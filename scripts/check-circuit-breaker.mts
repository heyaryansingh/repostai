/**
 * Self-check: a failed half-open probe must re-open the circuit.
 * Run with: node --experimental-transform-types scripts/check-circuit-breaker.mts
 */
import assert from 'node:assert';
import { CircuitBreaker } from '../src/lib/retry-utility.ts';

const cb = new CircuitBreaker(async () => { throw new Error('boom'); }, {
  failureThreshold: 2,
  resetTimeout: 10,
});
for (let i = 0; i < 2; i++) await cb.execute().catch(() => {});
assert.equal(cb.getState().state, 'open');
await new Promise((r) => setTimeout(r, 20));
await cb.execute().catch(() => {}); // half-open probe fails
assert.equal(cb.getState().state, 'open', 'failed probe did not re-open circuit');
console.log('ok');
