/**
 * Self-check: the UNLIMITED tier (Infinity limits) must never be rate limited.
 * Run with: node --experimental-transform-types scripts/check-rate-limiter.mts
 */
import assert from 'node:assert';
import { checkAdvancedRateLimit, RATE_LIMIT_TIERS } from '../src/lib/advanced-rate-limiter.ts';

for (let i = 0; i < 3; i++) {
  const r = await checkAdvancedRateLimit({ identifier: 'u', tier: RATE_LIMIT_TIERS.UNLIMITED });
  assert.equal(r.allowed, true, `unlimited tier rejected request ${i + 1}`);
}
console.log('ok');
process.exit(0); // module schedules cleanup timers
