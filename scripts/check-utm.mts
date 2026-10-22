/**
 * Self-check: re-tagging a URL replaces all old UTM tags; non-http(s) is rejected.
 * Run with: node --experimental-strip-types scripts/check-utm.mts
 */
import assert from 'node:assert';
import { buildUtmUrl, parseUtmUrl } from '../src/lib/utm-link-builder.ts';

const old = 'https://ex.com/post?id=7&utm_source=x&utm_campaign=spring&utm_term=shoes&utm_content=a';
const retagged = buildUtmUrl(old, { source: 'linkedin', medium: 'social', campaign: 'fall' });
assert.deepEqual(parseUtmUrl(retagged), { source: 'linkedin', medium: 'social', campaign: 'fall' });
assert.equal(new URL(retagged).searchParams.get('id'), '7');
assert.throws(() => buildUtmUrl('javascript:alert(1)', { source: 's', medium: 'm', campaign: 'c' }));
console.log('ok');
