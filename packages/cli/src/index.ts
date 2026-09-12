import type { GefResult } from "@gef-bootstrap/contracts";
import { projectExitCode } from "@gef-bootstrap/kernel";

export function processExitCodeFor(result: GefResult<unknown>): number {
  return projectExitCode(result);
}
