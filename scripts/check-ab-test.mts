/**
 * Self-check: no A/B winner before min sample size; revenue / >100% rates give finite p-values.
 * Run with: node --experimental-strip-types scripts/check-ab-test.mts
 */
import assert from 'node:assert';
import { analyzeResults, createABTest } from '../src/lib/ab-test-analyzer.ts';

const test = createABTest({ name: 't', variants: [{ content: 'a' }, { content: 'b' }], minSampleSize: 1000 });

// Big, significant lift but only 400 impressions total: no winner yet.
const early = analyzeResults(test, [
  { variantId: 'A', impressions: 200, engagements: 10 },
  { variantId: 'B', impressions: 200, engagements: 60 },
] as any);
assert.equal(early.isSignificant, true);
assert.equal(early.winner, null);
assert.equal(early.sampleSizeReached, false);

const done = analyzeResults(test, [
  { variantId: 'A', impressions: 1000, engagements: 50 },
  { variantId: 'B', impressions: 1000, engagements: 300 },
] as any);
assert.equal(done.winner, 'B');

// More engagements than impressions (rate > 100%) used to yield NaN.
const over = analyzeResults(test, [
  { variantId: 'A', impressions: 1000, engagements: 1500 },
  { variantId: 'B', impressions: 1000, engagements: 2500 },
] as any);
assert.ok(Number.isFinite(over.pValue));
assert.ok(over.variantStats.every((v) => Number.isFinite(v.standardError)));

const rev = analyzeResults({ ...test, targetMetric: 'revenue' }, [
  { variantId: 'A', impressions: 1000, engagements: 0, revenue: 5000 },
  { variantId: 'B', impressions: 1000, engagements: 0, revenue: 9000 },
] as any);
assert.ok(Number.isFinite(rev.pValue));
assert.equal(rev.winner, null);
console.log('ok');
