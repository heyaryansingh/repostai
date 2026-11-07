/**
 * Self-check: overwriting a key must not evict other entries.
 * Run with: node --experimental-strip-types scripts/check-cache.mts
 */
import assert from 'node:assert';
import { ContentCache } from '../src/lib/content-cache.ts';

const c = new ContentCache<string>({ maxSize: 30 });
c.set('a', 'x'.repeat(10)); // 12 bytes each
c.set('b', 'y'.repeat(10));
c.set('b', 'z'.repeat(10)); // overwrite; total 24 fits in 30
assert.equal(c.get('a'), 'x'.repeat(10), 'overwrite evicted unrelated entry');
assert.equal(c.get('b'), 'z'.repeat(10));
console.log('ok');

const big = new ContentCache<string>({ maxSize: 30 });
big.set('a', 'x'.repeat(10));
big.set('huge', 'y'.repeat(100)); // larger than the whole cache
assert.equal(big.get('a'), 'x'.repeat(10), 'oversized entry evicted others');
assert.equal(big.has('huge'), false);
assert.ok(big.getStats().totalSize <= 30);
console.log('ok oversized');
