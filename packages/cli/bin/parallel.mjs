/**
 * GBS-V113-PARALLEL-001: opt-in, fail-closed module planning for the installed CLI.
 * No GitHub mutation occurs except through an explicit "issues --apply" invocation.
 * This module has no dependencies on the internal engine graph.
 */
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_MANIFEST_BYTES = 262144;
const MAX_MODULES = 256;
const MAX_SLOTS = 6;
const ID = /^[A-Z][A-Z0-9-]{1,63}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA = /^[0-9a-f]{40}$/i;
const RESERVED = ["package.json", "package-lock.json", "AGENTS.md", ".github/**", ".engineering/**", "planning/**"];
const marker = id => "<!-- gef-parallel-module:" + id + " -->";

export class ParallelInputError extends Error {
  constructor(reason, message) {
    super(message);
    this.name = "ParallelInputError";
    this.reason = reason;
  }
}
function reject(reason, message) { throw new ParallelInputError(reason, message); }
function object(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function paths(value, id, field) {
  if (!Array.isArray(value)) reject("invalid_paths", id + "." + field + " must be an array");
  const seen = new Set();
  return value.map(path => {
    if (typeof path !== "string" || path.length > 180 ||
      !/^[A-Za-z0-9_.@/-]+(?:\/\*\*)?$/.test(path)) {
      reject("unsafe_path", id + "." + field + ": unsafe or ambiguous path");
    }
    const segments = path.split("/");
    if (path.endsWith("/") || segments.some(part => part === "" || part === "." ||
      part === ".." || part.toLowerCase() === ".git")) {
      reject("unsafe_path", id + "." + field + ": unsafe or ambiguous path");
    }
    const key = path.toLowerCase();
    if (seen.has(key)) reject("duplicate_path", id + "." + field + ": duplicate path");
    seen.add(key);
    return path;
  });
}
export function validateManifest(source) {
  if (!object(source) || source.schemaVersion !== "1" ||
      !REPO.test(source.repository || "") || !Array.isArray(source.modules) ||
      source.modules.length === 0 || source.modules.length > MAX_MODULES) {
    reject("invalid_manifest", "Expected schemaVersion 1, repository owner/name and 1..256 modules");
  }
  const ids = new Set();
  const modules = source.modules.map(m => {
    if (!object(m) || typeof m.id !== "string" || !ID.test(m.id) || ids.has(m.id)) {
      reject("invalid_module_id", "Module IDs must be unique, stable uppercase IDs");
    }
    ids.add(m.id);
    if (typeof m.title !== "string" || !m.title.trim() || m.title.length > 140 || /[\x00-\x1f]/.test(m.title) ||
        typeof m.workOrder !== "string" || !ID.test(m.workOrder) ||
        typeof m.approved !== "boolean" ||
        !["PLANNED", "ADMITTED", "PROMOTED"].includes(m.state) ||
        !Array.isArray(m.dependencies) ||
        m.dependencies.some(d => typeof d !== "string" || !ID.test(d)) ||
        new Set(m.dependencies).size !== m.dependencies.length ||
        !object(m.files)) {
      reject("invalid_module", "Invalid title, workOrder, approval, state, dependencies or files for " + m.id);
    }
    const read = paths(m.files.read, m.id, "read");
    const write = paths(m.files.write, m.id, "write");
    if (write.some(path => RESERVED.some(protectedPath => intersects(path, protectedPath)))) {
      reject("reserved_write", m.id + " declares a protected WRITE path; split shared changes into a separate reviewed Work Order");
    }
    if (m.state === "ADMITTED" && (!m.approved || write.length === 0)) {
      reject("unsafe_admission", m.id + " requires approval and declared write paths");
    }
    if (m.state === "PROMOTED" && (m.approved !== true || typeof m.promotionSha !== "string" || !SHA.test(m.promotionSha))) {
      reject("unproven_promotion", m.id + " needs an explicit promotion SHA; verify it against canonical checkpoint");
    }
    if (m.tests !== undefined && (!Array.isArray(m.tests) ||
        m.tests.some(t => typeof t !== "string" || t.length > 200 || /[\r\n]/.test(t)))) {
      reject("invalid_tests", m.id + " tests must be bounded strings");
    }
    return { ...m, files: { read, write }, tests: m.tests ?? [] };
  });
  const byId = new Map(modules.map(m => [m.id, m]));
  for (const m of modules) for (const d of m.dependencies) {
    if (!byId.has(d) || d === m.id) reject("invalid_dependency", m.id + " has missing/self dependency " + d);
  }
  const seen = new Set(), active = new Set();
  function visit(id) {
    if (active.has(id)) reject("dependency_cycle", "Dependency cycle involving " + id);
    if (seen.has(id)) return;
    const current = byId.get(id);
    if (!current) reject("invalid_dependency", "Unknown dependency " + id);
    active.add(id);
    for (const d of current.dependencies) visit(d);
    active.delete(id); seen.add(id);
  }
  for (const m of modules) visit(m.id);
  return { schemaVersion: "1", repository: source.repository, modules };
}
function intersects(a, b) {
  const root = p => p.endsWith("/**") ? p.slice(0, -3) : p;
  const x = root(a).toLowerCase(), y = root(b).toLowerCase();
  return x === y || x.startsWith(y + "/") || y.startsWith(x + "/");
}
function reserved(m) {
  return m.files.write.some(w => RESERVED.some(r => intersects(w, r)));
}
export function moduleConflict(a, b) {
  if (reserved(a) || reserved(b)) return "reserved_shared_surface";
  for (const aw of a.files.write) for (const path of [...b.files.write, ...b.files.read]) {
    if (intersects(aw, path)) return "write_overlap:" + aw + ":" + path;
  }
  for (const bw of b.files.write) for (const path of a.files.read) {
    if (intersects(bw, path)) return "write_read_overlap:" + bw + ":" + path;
  }
  return null;
}
export function planBatches(input, slots = MAX_SLOTS) {
  const manifest = validateManifest(input);
  if (!Number.isInteger(slots) || slots < 1 || slots > MAX_SLOTS) {
    reject("invalid_slots", "slots must be an integer between 1 and 6");
  }
  const byId = new Map(manifest.modules.map(m => [m.id, m]));
  const blocked = [], eligible = [];
  for (const m of manifest.modules) {
    if (m.state !== "ADMITTED") continue;
    const prerequisites = m.dependencies.filter(id => byId.get(id)?.state !== "PROMOTED");
    if (prerequisites.length > 0) blocked.push({ id: m.id, reason: "dependencies_not_promoted", dependencies: prerequisites });
    else eligible.push(m);
  }
  const batches = [];
  for (const m of eligible) {
    let batch = batches.find(b => b.length < slots && b.every(other => moduleConflict(m, other) === null));
    if (!batch) { batch = []; batches.push(batch); }
    batch.push(m);
  }
  return {
    schemaVersion: "1", repository: manifest.repository, slots,
    batches: batches.map((b, i) => ({ number: i + 1, modules: b.map(m => m.id) })),
    blocked, approvedModules: manifest.modules.filter(m => m.approved).map(m => m.id),
    // A batch is a proposed independent set, not proof of branch or runtime isolation.
    caution: "Paths are declared by the project; agents must enforce worktrees, file boundaries and exact-head review."
  };
}
export function ghDefault(args, spawn = spawnSync) {
  const out = spawn("gh", args, { encoding: "utf8", shell: false, timeout: 30000, maxBuffer: 64 * 1024 * 1024 });
  if (out.error?.code === "ENOBUFS") reject("github_incomplete", "GitHub issue output exceeded 64 MiB; inventory incomplete");
  if (out.error || out.status !== 0) {
    reject("github_unavailable", "GitHub CLI/auth/permission unavailable. Install gh, run gh auth login, and check repository permissions.");
  }
  return out.stdout;
}
function inventory(repo, gh) {
  const text = gh(["issue", "list", "--repo", repo, "--state", "all", "--limit", "1000", "--json", "number,title,body,url,author"]);
  let entries;
  try { entries = JSON.parse(text); } catch { reject("github_malformed", "gh issue list returned invalid JSON"); }
  if (!Array.isArray(entries) || entries.length >= 1000) reject("github_incomplete", "Issue inventory is incomplete; no creation allowed");
  if (entries.some(e => !object(e) || !Number.isInteger(e.number) || typeof e.title !== "string" ||
    typeof e.body !== "string" || typeof e.url !== "string")) {
    reject("github_malformed", "GitHub issue inventory contained malformed entries; no creation allowed");
  }
  return entries;
}
function verifyIssueProvenance(issue, repo, gh, cache) {
  const login = issue.author?.login;
  if (typeof login !== "string" || !/^[A-Za-z0-9-]{1,39}$/.test(login)) {
    reject("issue_untrusted", "Issue #" + issue.number + " lacks a verifiable GitHub author; reconcile before reuse");
  }
  const key = login.toLowerCase();
  if (!cache.has(key)) {
    let result;
    try {
      result = JSON.parse(gh(["api", "repos/" + repo + "/collaborators/" + login + "/permission"]));
    } catch (error) {
      if (error instanceof ParallelInputError) throw error;
      reject("github_malformed", "Cannot verify issue author permission; no issue reuse allowed");
    }
    if (!object(result) || typeof result.permission !== "string") {
      reject("github_malformed", "Missing GitHub collaborator permission; no issue reuse allowed");
    }
    cache.set(key, result.permission);
  }
  if (!["admin", "maintain", "write"].includes(cache.get(key))) {
    reject("issue_untrusted", "Issue #" + issue.number + " was authored without verified write permission; reconcile manually");
  }
}
function existingIssue(module, entries, repo, gh, cache) {
  const matching = entries.filter(e => (typeof e.body === "string" && e.body.includes(marker(module.id))) ||
    (typeof e.title === "string" && e.title.includes("[GEF-MOD:" + module.id + "]")));
  // Legacy issue titles containing the stable ID are a collision requiring manual reconciliation.
  const legacy = entries.filter(e => !matching.includes(e) && typeof e.title === "string" &&
    e.title.toUpperCase().split(/[^A-Z0-9-]+/).includes(module.id));
  if (matching.length > 1 || legacy.length > 0) {
    reject("issue_ambiguous", module.id + " has possible duplicate/legacy issues; reconcile manually");
  }
  const issue = matching[0] || null;
  if (issue !== null) {
    const bodyLines = typeof issue.body === "string" ? issue.body.split(/\r?\n/) : [];
    const required = [
      "Work Order: " + module.workOrder,
      "Dependencies: " + (module.dependencies.join(", ") || "none"),
      "READ: " + (module.files.read.join(", ") || "none"),
      "WRITE: " + (module.files.write.join(", ") || "none")
    ];
    verifyIssueProvenance(issue, repo, gh, cache);
    if (!required.every(line => bodyLines.includes(line))) {
      reject("issue_stale", module.id + " has a matching issue with stale Work Order or path contract; reconcile before reuse");
    }
  }
  return issue;
}
function issueBody(m) {
  return [
    marker(m.id), "# " + m.id + " — " + m.title,
    "Work Order: " + m.workOrder, "Approval: " + (m.approved ? "YES" : "NO"),
    "State: " + m.state, "Dependencies: " + (m.dependencies.join(", ") || "none"),
    "READ: " + (m.files.read.join(", ") || "none"),
    "WRITE: " + (m.files.write.join(", ") || "none"),
    "Tests: " + (m.tests.join(" | ") || "not declared"),
    "Rules: one agent, one isolated worktree/branch, one PR, exact-head evidence; no merge or checkpoint promotion before objective audit."
  ].join("\n") + "\n";
}
export function prepareIssues(input, { apply = false, gh = ghDefault } = {}) {
  const manifest = validateManifest(input);
  const entries = inventory(manifest.repository, gh);
  const trustedAuthors = new Map();
  const results = [];
  for (const m of manifest.modules) {
    if (!m.approved || m.state === "PROMOTED") continue;
    let issue = existingIssue(m, entries, manifest.repository, gh, trustedAuthors);
    if (!issue && apply) {
      gh(["issue", "create", "--repo", manifest.repository,
        "--title", "[GEF-MOD:" + m.id + "] " + m.title, "--body", issueBody(m)]);
      // Re-read after each effect: prevents silent duplicates on retries.
      const observed = inventory(manifest.repository, gh);
      issue = existingIssue(m, observed, manifest.repository, gh, trustedAuthors);
      if (!issue) reject("issue_readback_failed", "Created issue for " + m.id + " was not found on read-back");
      entries.splice(0, entries.length, ...observed);
    }
    results.push({ id: m.id, status: issue ? "REUSED_OR_CREATED" : "WOULD_CREATE", number: issue?.number ?? null, url: issue?.url ?? null });
  }
  return { repository: manifest.repository, applied: apply, issues: results };
}
export function buildPrompt(input, { slots = MAX_SLOTS, batchNumber = 1, gh = ghDefault } = {}) {
  const manifest = validateManifest(input);
  const plan = planBatches(manifest, slots);
  if (!Number.isInteger(batchNumber) || batchNumber < 1) {
    reject("invalid_batch", "batch must be an integer >= 1");
  }
  const batch = plan.batches[batchNumber - 1];
  if (!batch) reject("batch_unavailable", "Requested batch " + batchNumber + " is unavailable or has no admitted modules");
  const entries = inventory(manifest.repository, gh);
  const trustedAuthors = new Map();
  const selected = batch.modules.map(id => {
    const m = manifest.modules.find(x => x.id === id);
    if (!m) reject("invalid_module_id", "Planned module is missing from manifest");
    const issue = existingIssue(m, entries, manifest.repository, gh, trustedAuthors);
    if (!issue || !Number.isInteger(issue.number)) reject("missing_issue", "Run parallel issues --apply for " + id + " before emitting a prompt");
    return { m, issue };
  });
  const lines = [
    "Repository: " + manifest.repository,
    "Planning contract: GBS-V113-PARALLEL-001 (module batch " + batch.number + ")",
    "Execute ONLY the approved, admitted, dependency-ready modules listed below in parallel.",
    "Use one isolated Codex agent, independent git worktree, branch, PR and Evidence Bundle per module.",
    "Before mutation, inspect exact main HEAD, source hierarchy, checkpoint, ADRs, Scope, Architecture, DoD and each module Work Order.",
    "If Context Lock, dependencies, paths, approvals or source fingerprints are unknown/stale, STOP affected module.",
    "Do not modify shared files or another agent's allowed paths. No force-push, autonomous merge, publishing or checkpoint promotion.",
    "Run targeted tests per agent; after integration run the governed regression and exact-head checks. Review final in português brasileiro.",
    "Use installed Jev MCP/skills for suitable narrow typed decisions when available (https://docs.typesafe.ai/introduction). Prefer deterministic Git, AST, tests and evidence first; Jev never replaces a security or audit gate.",
  ];
  for (const { m, issue } of selected) {
    lines.push(
      "AGENT " + (selected.findIndex(x => x.m.id === m.id) + 1) + " | " + m.id + " | " + m.workOrder + " | ISSUE #" + issue.number,
      "BRANCH: feat/" + m.id.toLowerCase() + "-" + m.workOrder.toLowerCase() + " | WRITE: " + m.files.write.join(", "),
      "READ: " + (m.files.read.join(", ") || "none") + " | TESTS: " + (m.tests.join(" ; ") || "derive from Work Order")
    );
  }
  return { repository: manifest.repository, batch: batch.modules, prompt: lines.join("\n") + "\n" };
}
function assignValueOption(result, option, value) {
  switch (option) {
    case "--manifest": result.manifest = value; break;
    case "--repo": result.repository = value; break;
    case "--slots": result.slots = Number(value); break;
    case "--batch": result.batch = Number(value); result.batchSupplied = true; break;
    default: reject("unknown_option", "Unexpected option: " + option);
  }
}
function options(argv) {
  // The action and repository fields are strings throughout parsing, not null/string unions.
  const result = { action: "", apply: false, json: false, slots: MAX_SLOTS, batch: 1, batchSupplied: false, manifest: ".gef/parallel-modules.json", repository: "", help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") { result.help = true; continue; }
    if (arg === "--apply") { result.apply = true; continue; }
    if (arg === "--json") { result.json = true; continue; }
    if (["--manifest", "--repo", "--slots", "--batch"].includes(arg)) {
      const value = argv[++i];
      if (!value || value.startsWith("-")) reject("missing_option_value", arg + " requires a value");
      assignValueOption(result, arg, value);
      continue;
    }
    if (!arg.startsWith("-") && result.action === "") { result.action = arg; continue; }
    reject("unknown_option", "Unexpected argument: " + arg);
  }
  if (!result.help && !["plan", "issues", "prompt"].includes(result.action)) {
    reject("unknown_action", "Use: gef parallel plan|issues|prompt [--manifest path] [--slots 1..6] [--repo owner/name] [--batch N (prompt only)] [--json] [--apply only with issues]");
  }
  if (result.apply && result.action !== "issues") reject("unsafe_apply", "--apply is only allowed for parallel issues");
  if (result.batchSupplied && result.action !== "prompt") reject("invalid_batch", "--batch is only allowed for parallel prompt");
  if (!Number.isInteger(result.batch) || result.batch < 1) reject("invalid_batch", "--batch must be a positive integer");
  return result;
}
function loadManifest(path) {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); }
  catch { reject("manifest_missing", "Manifest not found: " + path); }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_MANIFEST_BYTES) {
    reject("manifest_unsafe", "Manifest must be a regular non-symlink file under 256 KiB");
  }
  try { return JSON.parse(readFileSync(absolute, "utf8")); }
  catch { reject("manifest_invalid_json", "Cannot parse manifest JSON"); }
}
function executeAction(opt, manifest, gh) {
  switch (opt.action) {
    case "plan": return planBatches(manifest, opt.slots);
    case "issues": return prepareIssues(manifest, { apply: opt.apply, gh });
    case "prompt": return buildPrompt(manifest, { slots: opt.slots, batchNumber: opt.batch, gh });
    default: reject("unknown_action", "Expected plan, issues or prompt");
  }
}
function renderSuccess(opt, value, json) {
  if (json) return JSON.stringify({ ok: true, value }, null, 2) + "\n";
  if (opt.action === "prompt") return value.prompt;
  return JSON.stringify(value, null, 2) + "\n";
}
export async function runParallel(argv, io = {}) {
  const stdout = io.stdout ?? (s => process.stdout.write(s));
  const stderr = io.stderr ?? (s => process.stderr.write(s));
  const gh = io.gh ?? ghDefault;
  let json = argv.includes("--json") || process.stdout.isTTY !== true;
  try {
    const opt = options(argv);
    json = json || opt.json;
    if (opt.help) {
      stdout("gef parallel plan|issues|prompt [--manifest path] [--repo owner/name] [--slots 1..6] [--batch N (prompt only)] [--json] [--apply (issues only)]\n");
      return 0;
    }
    const manifest = loadManifest(opt.manifest);
    if (opt.repository !== "") {
      if (!REPO.test(opt.repository)) reject("invalid_repository", "Use owner/name for --repo");
      manifest.repository = opt.repository;
    }
    const value = executeAction(opt, manifest, gh);
    stdout(renderSuccess(opt, value, json));
    return 0;
  } catch (error) {
    const reason = error instanceof ParallelInputError ? error.reason : "unexpected_failure";
    const message = error instanceof ParallelInputError ? error.message : "Parallel command failed closed";
    stderr(json ? JSON.stringify({ ok: false, reason, message }) + "\n" : "gef parallel: " + message + " (" + reason + ")\n");
    return reason === "github_unavailable" ? 40 : 10;
  }
}
