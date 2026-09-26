import { createGefError } from "./errors.js";
import type { TransactionPorts, TransactionPortResult } from "./transaction-ports.js";
import type { TransactionStateBinding } from "./transaction-types.js";

export interface EvaluatedStateBinding {
  readonly binding: TransactionStateBinding;
  readonly observedValue: string;
  readonly matches: boolean;
}

function stateError(reason: string, summary: string, binding: TransactionStateBinding): TransactionPortResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m05-state-${reason}-${binding.key}`,
      category: "PRECONDITION",
      reason: `transaction_state.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
      metadata: { bindingKey: binding.key, owner: binding.owner, predicate: binding.predicate },
    }),
  };
}

export async function evaluateStateBinding(binding: TransactionStateBinding, ports: TransactionPorts): Promise<TransactionPortResult<EvaluatedStateBinding>> {
  const observed = await ports.state.observeBinding(binding);
  if (!observed.ok) return observed;
  if (observed.value === undefined) return stateError("unavailable", `State binding ${binding.key} is unavailable`, binding);

  if (binding.predicate === "EXACT") {
    return { ok: true, value: Object.freeze({ binding, observedValue: observed.value, matches: observed.value === binding.value }) };
  }

  if (binding.predicate === "COMPATIBLE") {
    if (ports.compatibility === undefined) return stateError("compatibility_policy_unavailable", `Compatibility policy for ${binding.key} is unavailable`, binding);
    const compatible = await ports.compatibility.evaluate(binding, observed.value);
    if (!compatible.ok) return compatible;
    return { ok: true, value: Object.freeze({ binding, observedValue: observed.value, matches: compatible.value }) };
  }

  return stateError("unsupported_predicate", `Unsupported state predicate for ${binding.key}`, binding);
}
