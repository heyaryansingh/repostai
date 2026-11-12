/** Run with: node --experimental-strip-types scripts/check-parse-model-json.mts */
import assert from 'node:assert';
import { parseModelJson, isEmptyOutput } from '../src/lib/parse-model-json.ts';

assert.deepEqual(parseModelJson('Here you go:\n```JSON\n{"a":1}\n```\nEnjoy!'), { a: 1 });
assert.deepEqual(parseModelJson('{"a":"}"}'), { a: '}' });
assert.throws(() => parseModelJson('sorry, no'));
assert.equal(isEmptyOutput({ a: '', b: [] }), true);
assert.equal(isEmptyOutput({ a: '', b: ['x'] }), false);
console.log('ok');
