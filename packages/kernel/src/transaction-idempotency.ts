import type {
  IdempotencyDecisionResult,
  RetryContext,
} from "./transaction-types.js";

function result(
  decision: IdempotencyDecisionResult["decision"],
  context: RetryContext,
  reason: string,
): IdempotencyDecisionResult {
  return Object.freeze({
    decision,
    effectState: context.effectState,
    reason,
    ...(context.priorReceiptRef === undefined ? {} : { priorReceiptRef: context.priorReceiptRef }),
  });
}

export function decideIdempotentAction(context: RetryContext): IdempotencyDecisionResult {
  if (context.effectState === "IN_FLIGHT") {
    return result("SUPPRESS_DUPLICATE_IN_FLIGHT", context, "Equivalent mutation is already in flight");
  }

  if (context.effectState === "FULLY_APPLIED_VERIFIED") {
    if (!context.preStateValid || !context.authorizationValid) {
      return result("REPLAN_OR_BLOCK", context, "Previously applied result cannot be reused because current validity predicates changed");
    }
    return result("RETURN_ALREADY_APPLIED", context, "Verified equivalent effect is already applied");
  }

  if (context.desiredStateAlreadyPresent && context.effectState === "NO_EFFECT") {
    if (!context.preStateValid) return result("REPLAN_OR_BLOCK", context, "Desired state is present but required current-state predicates are stale");
    return result("RETURN_NOOP", context, "Desired state is already present without claiming historical authorship");
  }

  if (
    context.effectState === "UNKNOWN_EFFECT" ||
    context.effectState === "PARTIALLY_APPLIED" ||
    context.effectState === "PARTIALLY_RESTORED" ||
    context.effectState === "EXTERNAL_EFFECT_PRESENT"
  ) {
    return result("RECOVERY_REQUIRED", context, "Effect state is uncertain or partial and must be resolved before replay");
  }

  if (context.effectState === "FULLY_RESTORED_VERIFIED" || context.effectState === "NO_EFFECT") {
    if (!context.preStateValid || !context.authorizationValid) {
      return result("REPLAN_OR_BLOCK", context, "A fresh attempt requires current state and authorization revalidation");
    }

    if (!context.retryPolicy.enabled) {
      return result("FRESH_ATTEMPT_ELIGIBLE", context, "No prior effect remains; a new attempt may be admitted with new attempt identity");
    }

    if (context.attemptCount >= context.retryPolicy.maxAttempts) {
      return result("NO_AUTOMATIC_RETRY", context, "Retry attempt limit has been reached");
    }

    if (context.failureReason === undefined || !context.retryPolicy.retryableReasons.includes(context.failureReason)) {
      return result("NO_AUTOMATIC_RETRY", context, "Failure class is not explicitly admitted by retry policy");
    }

    return result("RETRY_ELIGIBLE", context, "Effect absence/restoration is verified and bounded retry policy admits a new attempt");
  }

  return result("BLOCKED", context, "Effect state does not admit automatic replay");
}

export function sameIdempotencyScope(
  left: RetryContext["scope"],
  right: RetryContext["scope"],
): boolean {
  return (
    left.scopeId === right.scopeId &&
    left.targetRef === right.targetRef &&
    left.planDigest === right.planDigest &&
    left.contractVersion === right.contractVersion &&
    left.policyFingerprint === right.policyFingerprint &&
    left.providerOperationRef === right.providerOperationRef
  );
}
