// Flow contract: certified or individually reported coded evidence becomes an identifier-free public-statistics projection; the projection excludes source hashes, private datasets, direct identifiers, free text and any dependency on SHC issuance.
import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPublicHealthStatisticsProjection } from '../dist/public-health-statistics.js'

const source = {
  subjectKind: 'human',
  section: 'http://loinc.org|11450-4',
  codingSystem: 'http://snomed.info/sct',
  code: '386661006',
  jurisdiction: 'CA-BC',
  occurredOn: '2026-10-23',
  ageBand: '40-49',
  sex: 'female',
}

test('projects only anonymous coded statistics and does not depend on SHC issuance', () => {
  const withoutShc = buildPublicHealthStatisticsProjection({ ...source, smartHealthCardIssued: false })
  const withShc = buildPublicHealthStatisticsProjection({ ...source, smartHealthCardIssued: true })

  assert.deepEqual(withoutShc, withShc)
  assert.deepEqual(withoutShc, {
    subjectKind: source.subjectKind,
    section: source.section,
    codingSystem: source.codingSystem,
    code: source.code,
    jurisdiction: source.jurisdiction,
    occurredOn: source.occurredOn,
    demographics: { ageBand: source.ageBand, sex: source.sex },
  })
})

test('supports animal statistics without adding a patient or animal identifier', () => {
  assert.deepEqual(buildPublicHealthStatisticsProjection({
    ...source,
    subjectKind: 'animal',
    speciesTaxonomyId: '9615',
    ageBand: '5-9',
  }), {
    subjectKind: 'animal',
    section: source.section,
    codingSystem: source.codingSystem,
    code: source.code,
    jurisdiction: source.jurisdiction,
    occurredOn: source.occurredOn,
    demographics: { speciesTaxonomyId: '9615', ageBand: '5-9', sex: source.sex },
  })
})

test('rejects uncoded evidence and every identifying, correlating or free-text field', () => {
  assert.throws(
    () => buildPublicHealthStatisticsProjection({ ...source, code: '' }),
    /code_required/,
  )
  for (const forbidden of [
    { subjectDid: 'did:web:example.invalid:subject' },
    { patientId: 'patient-1' },
    { organizationDid: 'did:web:example.invalid:clinic' },
    { documentHash: 'zPrivateClinicalHash' },
    { sourceVersionId: 'private-clinical-version' },
    { description: 'free text may identify the subject' },
    { resource: { resourceType: 'Condition' } },
  ]) {
    assert.throws(
      () => buildPublicHealthStatisticsProjection({ ...source, ...forbidden }),
      /identifying_data_forbidden/,
    )
  }
})

test('requires a coarse date and coarse demographics', () => {
  assert.throws(
    () => buildPublicHealthStatisticsProjection({ ...source, occurredOn: '2026-10-23T12:34:56Z' }),
    /occurred_on_invalid/,
  )
  assert.throws(
    () => buildPublicHealthStatisticsProjection({ ...source, ageBand: '43' }),
    /age_band_invalid/,
  )
})
