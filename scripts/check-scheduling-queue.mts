/**
 * Self-check: markFailed records the error even when the post has no metadata.
 * Run with: node --experimental-strip-types scripts/check-scheduling-queue.mts
 */
import assert from 'node:assert';
import { SchedulingQueue } from '../src/lib/scheduling-queue.ts';

const q = new SchedulingQueue();
const p = q.schedulePost({ content: 'hi', platform: 'twitter', scheduledTime: new Date(Date.now() + 1e6) });
q.markFailed(p.id, 'boom');
assert.deepEqual(q.getPost(p.id)!.metadata?.tags, ['error:boom']);
console.log('ok');
