/**
 * Pure argv parsing.
 *
 * This module contains no I/O, no environment access and no engine calls. It maps a
 * raw argument vector onto either a canonical command intent or an explicit usage
 * failure. Every failure produced here is projected by the caller as
 * `USAGE_OR_INPUT_ERROR` before any domain engine is reached.
 */

export const CLI_CONTRACT_VERSION = "1.0";

export type CliVerb = "init" | "adopt";

export interface ParsedCommand {
  readonly kind: "command";
  readonly verb: CliVerb;
  readonly commandId: string;
  readonly json: boolean;
  readonly apply: boolean;
  readonly help: boolean;
  readonly targetRef?: string;
}

export interface ParsedMeta {
  readonly kind: "help" | "version";
  readonly json: boolean;
  readonly verb?: CliVerb;
}

export interface ParseFailure {
  readonly kind: "failure";
  readonly reason: string;
  readonly summary: string;
  readonly json: boolean;
}

export type ParseOutcome = ParsedCommand | ParsedMeta | ParseFailure;

/** Frozen safe-action mapping for the WO-002 increment. */
const ACTION_MAP: Readonly<Record<CliVerb, (apply: boolean) => string>> = Object.freeze({
  init: (apply) => (apply ? "gef.init.run" : "gef.init.plan"),
  adopt: (apply) => (apply ? "gef.adopt.apply" : "gef.adopt.preview"),
});

/** Verbs admitted by this Work Order. `doctor`, `status` and `upgrade` are WO-003/WO-004. */
export const ADMITTED_VERBS: readonly CliVerb[] = Object.freeze(["init", "adopt"]);

function isVerb(value: string): value is CliVerb {
  return (ADMITTED_VERBS as readonly string[]).includes(value);
}

function failure(reason: string, summary: string, json: boolean): ParseFailure {
  return { kind: "failure", reason, summary, json };
}

/**
 * Parse an argument vector.
 *
 * `argv` is the raw slice after `process.argv[0..1]`. Ordering is not significant;
 * `--json` may appear anywhere. `--apply` is admitted only for verbs that declare an
 * apply action.
 */
export function parseArgv(argv: readonly string[]): ParseOutcome {
  // `--json` is a global flag and must apply to failures too, including failures raised
  // before its position in the vector. It is therefore resolved in a pre-pass.
  const json = argv.includes("--json");
  let help = false;
  let version = false;
  let apply = false;
  let verb: CliVerb | undefined;
  let targetRef: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === undefined) continue;

    if (token === "--json") continue;
    if (token === "--help" || token === "-h") { help = true; continue; }
    if (token === "--version" || token === "-V") { version = true; continue; }
    if (token === "--apply") { apply = true; continue; }

    if (token === "--target") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("-")) return failure("missing_target_value", "--target requires a value", json);
      targetRef = value;
      index += 1;
      continue;
    }

    if (token.startsWith("-")) return failure("unknown_flag", `Unknown flag: ${token}`, json);

    if (verb !== undefined) return failure("unexpected_argument", `Unexpected argument: ${token}`, json);
    if (!isVerb(token)) return failure("unknown_command", `Unknown command: ${token}`, json);
    verb = token;
  }

  if (version) {
    if (verb !== undefined || apply) return failure("conflicting_options", "--version cannot be combined with a command", json);
    return { kind: "version", json };
  }

  if (verb === undefined) {
    if (apply) return failure("apply_without_command", "--apply requires a command", json);
    if (targetRef !== undefined) return failure("target_without_command", "--target requires a command", json);
    return { kind: "help", json };
  }

  // Verb-level help resolves before apply/target validation: help is never an error.
  if (help) return { kind: "help", json, verb };

  const parsed: ParsedCommand = {
    kind: "command",
    verb,
    commandId: ACTION_MAP[verb](apply),
    json,
    apply,
    help: false,
    ...(targetRef === undefined ? {} : { targetRef }),
  };
  return parsed;
}

/** Deterministic usage text. Rendered without consulting the network or the filesystem. */
export function usageText(verb?: CliVerb): readonly string[] {
  const lines: string[] = ["gef - GEF Bootstrap operator surface", "", "Usage: gef <command> [options]", "", "Commands:"];
  if (verb === undefined) {
    lines.push("  init           plan project initialization (safe, read-only by default)");
    lines.push("  adopt          preview brownfield adoption (safe, read-only by default)");
  } else if (verb === "init") {
    lines.push("  init           plan project initialization (safe, read-only by default)");
    lines.push("  init --apply   run the governed initialization path");
  } else {
    lines.push("  adopt          preview brownfield adoption (safe, read-only by default)");
    lines.push("  adopt --apply  run the governed adoption path");
  }
  lines.push("", "Options:");
  lines.push("  --json              emit a stable machine-readable envelope");
  lines.push("  --apply             run the governed mutation path instead of the safe plan");
  lines.push("  --target <ref>      target project directory");
  lines.push("  -h, --help          show help");
  lines.push("  -V, --version       show version");
  lines.push("", "Not yet available: doctor, status, upgrade.");
  return Object.freeze(lines);
}
