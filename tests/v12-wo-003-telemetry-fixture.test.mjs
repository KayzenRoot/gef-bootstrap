/**
 * TEST ONLY: stable M63 telemetry population fixture. Values are synthetic;
 * this module does not attest a real production host or performance run.
 */
export function syntheticMarathonTelemetryPopulation(P2, P3, P6) {
  return {
    P1: { workloadKind: 'VALIDATION_SELECTION' },
    P2,
    P3,
    P4: { node: '22.11.0', npm: '10.9.0', packageManager: 'npm', typescript: '6.0.3' },
    P5: { os: 'linux', osVersion: 'ubuntu-24.04', architecture: 'x64' },
    P6,
    P7: { posture: 'COLD', reuseSetDigest: 'none' },
    P8: { timedRegion: 'work-order-complete', startEvent: 'executor-start',
      endEvent: 'accepted-handoff' },
  };
}
