// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  FHIR_IPS_OBSERVATION_ARTIFACT_SCHEMAS,
  FHIR_IPS_SECTION_CODES,
  FhirIpsObservationArtifactKinds,
  ObservationCategoryCodes,
  ObservationClaim,
  observationFromFlatToFhirR4,
} from '../dist/index.js'

test('keeps each authored Observation kind in its own IPS section and category', () => {
  const expected = new Map([
    [FhirIpsObservationArtifactKinds.VitalSigns, [FHIR_IPS_SECTION_CODES.VitalSigns, ObservationCategoryCodes.VitalSigns.claim]],
    [FhirIpsObservationArtifactKinds.Laboratory, [FHIR_IPS_SECTION_CODES.DiagnosticResults, ObservationCategoryCodes.Laboratory.claim]],
    [FhirIpsObservationArtifactKinds.SocialHistory, [FHIR_IPS_SECTION_CODES.SocialHistory, ObservationCategoryCodes.SocialHistory.claim]],
    [FhirIpsObservationArtifactKinds.PregnancyHistory, [FHIR_IPS_SECTION_CODES.PregnancyHistory, ObservationCategoryCodes.Survey.claim]],
  ])

  assert.deepEqual(Object.keys(FHIR_IPS_OBSERVATION_ARTIFACT_SCHEMAS), [...expected.keys()])
  for (const [kind, [sectionCode, category]] of expected) {
    const schema = FHIR_IPS_OBSERVATION_ARTIFACT_SCHEMAS[kind]
    assert.equal(schema.sectionCode, sectionCode)
    assert.equal(schema.initialClaims[ObservationClaim.Category], category)
    assert.ok(schema.requiredClaims.includes(ObservationClaim.CodeText))
    assert.ok(schema.requiredClaims.includes(ObservationClaim.Status))
  }
})

test('materializes locally entered Observation text before a terminology code is confirmed', () => {
  const schema = FHIR_IPS_OBSERVATION_ARTIFACT_SCHEMAS[FhirIpsObservationArtifactKinds.Laboratory]
  const localText = 'Locally entered laboratory result'
  const observation = observationFromFlatToFhirR4({
    ...schema.initialClaims,
    [ObservationClaim.CodeText]: localText,
  })

  assert.equal(observation.code?.text, localText)
  assert.equal(observation.code?.coding, undefined)
})
