/**
 * Self-check for sanitizeHTML against known XSS bypasses.
 *
 * Run with: node --experimental-strip-types scripts/check-sanitizer.mts
 * Exits non-zero if any case leaks an event handler, script tag, or
 * javascript: scheme, or if benign markup is not preserved.
 */
import { sanitizeHTML } from '../src/lib/input-sanitizer.ts';

const DANGEROUS: [string, string][] = [
  ['<a href="#" onclick=alert(1)>x</a>', 'unquoted handler on an allowed tag'],
  ['<a href="#" ONCLICK="alert(1)">x</a>', 'uppercase quoted handler'],
  ['<scr<script>ipt>alert(1)</scr</script>ipt>', 'nested tag reassembly'],
  ['<a href="jav&#x09;ascript:alert(1)">x</a>', 'entity-encoded javascript scheme'],
  ['<a href="javjavascript:ascript:alert(1)">x</a>', 'overlapping scheme strip'],
  ['<img src=x onerror=alert(1)>', 'unquoted handler on a disallowed tag'],
  ['<a href="data:text/html;base64,PHN2Zz4=">x</a>', 'data URL href'],
  ['<iframe src="//evil.test"></iframe>', 'iframe injection'],
];

const BENIGN: [string, string][] = [
  ['<p>safe <strong>text</strong></p>', '<p>safe <strong>text</strong></p>'],
  ['<a href="https://example.com" title="hi">ok</a>', '<a href="https://example.com" title="hi">ok</a>'],
  ['plain text', 'plain text'],
];

let failures = 0;

for (const [input, label] of DANGEROUS) {
  const out = sanitizeHTML(input).sanitized;
  if (/on\w+\s*=|<\s*script|javascript:|data:text\/html|<\s*iframe/i.test(out)) {
    console.error(`FAIL  ${label}\n      -> ${JSON.stringify(out)}`);
    failures++;
  } else {
    console.log(`ok    ${label}`);
  }
}

for (const [input, expected] of BENIGN) {
  const out = sanitizeHTML(input).sanitized;
  if (out !== expected) {
    console.error(`FAIL  benign markup altered\n      -> ${JSON.stringify(out)}`);
    failures++;
  } else {
    console.log(`ok    preserved ${JSON.stringify(input)}`);
  }
}

console.log(failures ? `\n${failures} failing case(s)` : '\nall sanitizer checks passed');
process.exit(failures ? 1 : 0);
