/**
 * U12-03 read-only M63 telemetry binding for an already sealed Marathon state.
 * No provider execution, checkpoint authority, or inferred performance claims.
 */
import { capturePerformanceRecord, verifyPerformanceRecord } from './v11-performance-telemetry.mjs';
import { digest } from './index.mjs';

const ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const SHA = /^[0-9a-f]{40}$/;
const HASH = /^sha256:[0-9a-f]{64}$/;

/**
 * Consume real M63 P1-P8 population + measurements and bind the record to the
 * exact Marathon plan/state. Unavailable metrics stay UNAVAILABLE under M63.
 * Record is only performance evidence, never a step-settlement proof.
 */
export function captureMarathonTelemetry({ plan, state, recordInput } = {}) {
  if (!plan || !state || !recordInput ||
      !ID.test(plan.workOrderId ?? '') || !ID.test(plan.actor ?? '') ||
      !SHA.test(plan.baseSha ?? '') || !HASH.test(plan.planDigest ?? '') ||
      !HASH.test(state.stateDigest ?? '') || state.planDigest !== plan.planDigest ||
      recordInput.population?.P3?.commitSha !== plan.baseSha) {
    return { state: 'INVALID', reasonCode: 'MARATHON_TELEMETRY_BINDING_INVALID' };
  }
  const captured = capturePerformanceRecord(recordInput);
  if (captured.state !== 'CAPTURED') return captured;
  if (!verifyPerformanceRecord(captured.record))
    return { state: 'INVALID', reasonCode: 'M63_RECORD_INTEGRITY_INVALID' };
  const lineage = {
    workOrderId: plan.workOrderId,
    actor: plan.actor,
    baseSha: plan.baseSha,
    planDigest: plan.planDigest,
    stateDigest: state.stateDigest,
    m63RecordDigest: captured.record.digest,
  };
  return {
    state: 'CAPTURED',
    record: captured.record,
    lineage: Object.freeze({ ...lineage, lineageDigest: digest('GBS-V12-MARATHON-M63-LINEAGE', lineage) }),
    authority: 'READ_ONLY_TELEMETRY',
    optimizationClaimEligible: false,
  };
}
