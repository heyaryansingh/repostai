/**
 * Self-check: a 32-bit hash collision must not be reported as an exact duplicate.
 * Run with: node --experimental-strip-types scripts/check-content-hash.mts
 */
import assert from 'node:assert';
import { hashContent, isDuplicate } from '../src/lib/content-hash.ts';

// "az" and "b[" collide under the 31-multiplier hash
assert.equal(hashContent('az'), hashContent('b['));
assert.equal(isDuplicate('az', [{ hash: hashContent('b['), timestamp: 0, content: 'b[', platforms: [] }]).isDuplicate, false);
assert.equal(isDuplicate('a  b', [{ hash: hashContent('A B'), timestamp: 0, content: 'A B', platforms: [] }]).isDuplicate, true);
console.log('ok');
