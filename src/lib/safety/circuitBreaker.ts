export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number; // consecutive failures before opening
  recoveryTimeoutMs: number; // time to wait before trying half-open
}

interface CircuitRecord {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  lastStateChange: number;
}

const circuits = new Map<string, CircuitRecord>();

const DEFAULT_OPTIONS: Record<string, CircuitBreakerOptions> = {
  ai_provider: { failureThreshold: 5, recoveryTimeoutMs: 30000 },
  google_api: { failureThreshold: 4, recoveryTimeoutMs: 60000 },
  whatsapp_api: { failureThreshold: 4, recoveryTimeoutMs: 60000 },
  speech_api: { failureThreshold: 3, recoveryTimeoutMs: 30000 },
  research_api: { failureThreshold: 4, recoveryTimeoutMs: 45000 },
  default: { failureThreshold: 5, recoveryTimeoutMs: 30000 }
};

/**
 * Checks if a circuit for a given service allows execution.
 */
export function canExecute(serviceName: string): { allowed: boolean; state: CircuitState } {
  const record = getOrCreateCircuit(serviceName);
  const options = DEFAULT_OPTIONS[serviceName] || DEFAULT_OPTIONS.default;
  const now = Date.now();

  if (record.state === 'OPEN') {
    if (now - record.lastFailureTime > options.recoveryTimeoutMs) {
      record.state = 'HALF_OPEN';
      record.lastStateChange = now;
      return { allowed: true, state: 'HALF_OPEN' };
    }
    return { allowed: false, state: 'OPEN' };
  }

  return { allowed: true, state: record.state };
}

/**
 * Records a successful execution for a service.
 */
export function recordSuccess(serviceName: string): void {
  const record = getOrCreateCircuit(serviceName);
  record.failureCount = 0;
  record.state = 'CLOSED';
  record.lastStateChange = Date.now();
}

/**
 * Records a failure for a service.
 */
export function recordFailure(serviceName: string): void {
  const record = getOrCreateCircuit(serviceName);
  const options = DEFAULT_OPTIONS[serviceName] || DEFAULT_OPTIONS.default;
  const now = Date.now();

  record.failureCount += 1;
  record.lastFailureTime = now;

  if (record.failureCount >= options.failureThreshold) {
    record.state = 'OPEN';
    record.lastStateChange = now;
  }
}

/**
 * Gets current state of all monitored circuits.
 */
export function getAllCircuitStates(): Record<string, { state: CircuitState; failureCount: number }> {
  const result: Record<string, { state: CircuitState; failureCount: number }> = {};
  circuits.forEach((record, name) => {
    result[name] = { state: record.state, failureCount: record.failureCount };
  });
  return result;
}

function getOrCreateCircuit(serviceName: string): CircuitRecord {
  let record = circuits.get(serviceName);
  if (!record) {
    record = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      lastStateChange: Date.now()
    };
    circuits.set(serviceName, record);
  }
  return record;
}
