// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  clinicalArtifactCodedOptionsForClaim,
  FHIR_IPS_CLINICAL_CODED_OPTION_SETS,
} from '../dist/clinical-artifact-coded-options.js'
import {
  AllergyIntoleranceClaim,
  ConditionClaim,
  ImmunizationClaim,
  MedicationStatementClaim,
  ProcedureClaim,
} from '../dist/claims/index.js'
import { ObservationClaim } from '../dist/observation-claims.js'
import { ObservationCategoryCodes } from '../dist/observation-claims.js'

test('returns exact FHIR R4 required-binding options for each clinical claim', () => {
  assert.deepEqual(
    clinicalArtifactCodedOptionsForClaim(ImmunizationClaim.Status, 'en').map(option => option.code),
    ['completed', 'entered-in-error', 'not-done'],
  )
  assert.deepEqual(
    clinicalArtifactCodedOptionsForClaim(ConditionClaim.ClinicalStatus, 'en').map(option => option.code),
    ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved'],
  )
  assert.deepEqual(
    clinicalArtifactCodedOptionsForClaim(ProcedureClaim.Status, 'en').map(option => option.code),
    ['preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error', 'unknown'],
  )
  assert.equal(FHIR_IPS_CLINICAL_CODED_OPTION_SETS[ObservationClaim.Status].system, 'http://hl7.org/fhir/observation-status')
  assert.equal(FHIR_IPS_CLINICAL_CODED_OPTION_SETS[MedicationStatementClaim.Status].fhirVersion, 'R4')
  assert.equal(FHIR_IPS_CLINICAL_CODED_OPTION_SETS[AllergyIntoleranceClaim.Category].binding, 'required')
})

test('localizes presentation while preserving the canonical stored code', () => {
  const spanish = clinicalArtifactCodedOptionsForClaim(ConditionClaim.VerificationStatus, 'es')
  assert.deepEqual(spanish.find(option => option.code === 'confirmed'), {
    code: 'confirmed',
    label: 'Confirmado',
  })
  assert.equal(
    clinicalArtifactCodedOptionsForClaim(ObservationClaim.Status, 'es-MX').find(option => option.code === 'preliminary')?.label,
    'Preliminar',
  )
  assert.equal(
    clinicalArtifactCodedOptionsForClaim(ObservationClaim.Status, 'fr').find(option => option.code === 'preliminary')?.label,
    'Preliminary',
  )
})

test('presents canonical Observation categories as localized HL7 tokens', () => {
  assert.deepEqual(
    clinicalArtifactCodedOptionsForClaim(ObservationClaim.Category, 'es').find(option => option.code === ObservationCategoryCodes.VitalSigns.claim),
    { code: ObservationCategoryCodes.VitalSigns.claim, label: 'Signos vitales (HL7|vital-signs)' },
  )
  assert.deepEqual(
    clinicalArtifactCodedOptionsForClaim(ObservationClaim.Category, 'en').find(option => option.code === ObservationCategoryCodes.Laboratory.claim),
    { code: ObservationCategoryCodes.Laboratory.claim, label: 'Laboratory (HL7|laboratory)' },
  )
})

test('does not turn extensible or example terminology fields into closed dropdowns', () => {
  assert.deepEqual(clinicalArtifactCodedOptionsForClaim(ConditionClaim.Severity, 'es'), [])
  assert.deepEqual(clinicalArtifactCodedOptionsForClaim(ObservationClaim.Code, 'es'), [])
})
