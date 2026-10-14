// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  ObservationClaim,
  decodeObservationClaimList,
} from '../dist/observation-claims.js'

test('reads historical JSON arrays and CSV only as compatibility inputs', () => {
  // These literals freeze the two deprecated wire formats; current writers emit neither.
  assert.deepEqual(decodeObservationClaimList('["system|code","display, including comma","12.5"]'), ['system|code', 'display, including comma', '12.5'])
  assert.deepEqual(decodeObservationClaimList('first,second'), ['first', 'second'])
})

test('keeps Observation claim literals inside their owning catalog', async () => {
  const source = await readFile(new URL('../src/vital-sign-observations.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /claims\[['"]Observation\./)
  assert.equal(ObservationClaim.ComponentCode, 'Observation.component-code') // Exact deprecated wire name is compatibility behavior under test.
})
