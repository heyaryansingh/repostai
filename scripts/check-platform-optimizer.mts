/**
 * Self-check: truncating for a platform keeps at most its hashtag limit and
 * stays within the character limit.
 * Run with: node --experimental-strip-types scripts/check-platform-optimizer.mts
 */
import assert from 'node:assert';
import { extractHashtags, optimizeForPlatform } from '../src/lib/platform-character-optimizer.ts';

const body = 'Shipping a new release today with faster builds and better docs. '.repeat(6);
const text = `#launch #devtools #typescript #webdev ${body}`;
const result = optimizeForPlatform(text, 'twitter');
assert.equal(result.truncated, true);
assert.ok(result.optimized.length <= 280, `length ${result.optimized.length}`);
assert.deepEqual(result.hashtagsPreserved, ['#launch', '#devtools']);
assert.deepEqual(extractHashtags(result.optimized), ['#launch', '#devtools']);
console.log('ok');
