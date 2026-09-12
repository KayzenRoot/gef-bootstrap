import type { ProjectIdentityAssessment, ProjectIdentityDocument, ProjectOnlyBinding, UuidV4Generator } from "./types.js";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function secureUuidV4(): string {
  const value = globalThis.crypto?.randomUUID?.();
  if (!value) throw new Error("gef.identity.secure_uuid_generator_unavailable");
  return value;
}

export function isCanonicalProjectId(value: unknown): value is string {
  return typeof value === "string" && UUID_V4.test(value);
}

export function generateProjectId(generator: UuidV4Generator = secureUuidV4): string {
  const value = generator();
  if (!isCanonicalProjectId(value)) throw new Error("gef.identity.generated_project_id_invalid");
  return value;
}

export function assessProjectIdentity(document: ProjectIdentityDocument | null | undefined): ProjectIdentityAssessment {
  if (!document || document.adopted !== true) return { state: "UNADOPTED" };
  if (document.projectId === undefined || document.projectId === null || document.projectId === "") {
    return { state: "IDENTITY_BOOTSTRAP_REQUIRED", reasonCode: "gef.identity.bootstrap_required" };
  }
  if (!isCanonicalProjectId(document.projectId)) {
    return { state: "INVALID_PROJECT_ID", reasonCode: "gef.identity.project_id_invalid" };
  }
  return { state: "ADOPTED_VALID", projectId: document.projectId };
}

export function createProjectOnlyBinding(projectId: unknown): ProjectOnlyBinding {
  if (!isCanonicalProjectId(projectId)) throw new Error("gef.identity.project_id_invalid");
  return { bindingStrength: "PROJECT_ONLY", projectId };
}
