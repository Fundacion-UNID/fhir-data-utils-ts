// Flow contract: the public IPS reference fixture preserves all clinical sections and exact reference bytes independently of gateway dependencies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
test('public all-sections IPS reference fixture remains intact', () => {
  const bytes = readFileSync(require.resolve('fhir-data-utils-ts/fixtures/fhir-ips-bundle-all-sections.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '979e7e5a65300d8559f36ec8856047358e9fe53e38171494ab181abcdfa1b0f1');
  const bundle = JSON.parse(bytes.toString('utf8'));
  assert.equal(bundle.resourceType, 'Bundle');
  assert.equal(bundle.entry.length, 42);
  assert.equal(new Set(bundle.entry.map(entry => entry.resource.resourceType)).size, 17);
});
