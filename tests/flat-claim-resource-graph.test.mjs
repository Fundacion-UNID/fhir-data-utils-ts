// Flow contract: channel-neutral flat claims own graph references; native FHIR is produced only by explicit adapters.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildFlatClaimResourceEntry,
  linkFlatClaimResourceEntries,
  normalizeLegacyContainedClaims,
  withFlatClaimNarrative,
} from '../dist/flat-claim-resource-graph.js'

test('links independent resources from the parent and never writes child containment flags', () => {
  const entries = [
    buildFlatClaimResourceEntry({ entryId: 'immunization-1', resourceType: 'Immunization', claims: { 'Immunization.date': '2024-05-23' } }),
    buildFlatClaimResourceEntry({ entryId: 'medication-1', resourceType: 'Medication', claims: { 'Medication.code-text': 'Imrab 3 TF' } }),
  ]
  const linked = linkFlatClaimResourceEntries(entries, { parentEntryId: 'immunization-1', childEntryIds: ['medication-1'] })
  assert.equal(linked[0].claims['Immunization.contained-reference-list'], 'Medication/medication-1')
  assert.equal(linked[1].claims['Medication.is-contained'], undefined)
  assert.equal(linked[1].claims['Medication.contained-parent-reference'], undefined)
})

test('keeps language and XHTML narrative as flat claims and strips legacy containment markers', () => {
  const legacy = buildFlatClaimResourceEntry({ entryId: 'observation-1', resourceType: 'Observation', claims: {
    'Observation.status': 'final',
    'Observation.is-contained': 'true',
    'Observation.contained-parent-reference': 'Composition/example',
  } })
  const normalized = withFlatClaimNarrative(normalizeLegacyContainedClaims(legacy), {
    language: 'es', status: 'generated', xhtml: '<div xmlns="http://www.w3.org/1999/xhtml">Temperatura</div>',
  })
  assert.deepEqual(normalized.claims, {
    'Observation.status': 'final',
    'Observation.language': 'es',
    'Observation.narrative-status': 'generated',
    'Observation.xhtml': '<div xmlns="http://www.w3.org/1999/xhtml">Temperatura</div>',
  })
})
