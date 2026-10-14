// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const FAMILY_CASES = Object.freeze([
  ['AllergyIntolerance', fhir.AllergyIntoleranceClaim.Code],
  ['AppointmentResponse', fhir.AppointmentResponseClaim.Identifier],
  ['Appointment', fhir.AppointmentClaim.Identifier],
  ['CarePlan', fhir.CarePlanClaim.Identifier],
  ['ClinicalImpression', fhir.ClinicalImpressionClaim.Identifier],
  ['Composition', fhir.CompositionClaim.Section],
  ['Condition', fhir.ConditionClaim.Code],
  ['Coverage', fhir.CoverageClaim.Identifier],
  ['DeviceUseStatement', fhir.DeviceUseStatementClaim.Identifier],
  ['Device', fhir.DeviceClaim.Identifier],
  ['DiagnosticReport', fhir.DiagnosticReportClaim.Identifier],
  ['DocumentReference', fhir.DocumentReferenceClaim.Identifier],
  ['Encounter', fhir.EncounterClaim.Identifier],
  ['Flag', fhir.FlagClaim.Identifier],
  ['Immunization', fhir.ImmunizationClaim.Identifier],
  ['ImagingStudy', fhir.ImagingStudyClaim.Identifier],
  ['Location', fhir.LocationClaim.Identifier],
  ['Medication', fhir.MedicationStatementClaim.Identifier],
  ['Observation', fhir.ObservationClaim.Identifier],
  ['Organization', fhir.OrganizationClaim.Identifier],
  ['Procedure', fhir.ProcedureClaim.Identifier],
  ['RelatedPerson', fhir.RelatedPersonClaim.Identifier],
])

for (const [family, claim] of FAMILY_CASES) {
  test(`${family} list helpers set, add, deduplicate and remove canonical values`, () => {
    const get = fhir[`get${family}ClaimList`]
    const set = fhir[`set${family}ClaimList`]
    const add = fhir[`add${family}ClaimList`]
    const remove = fhir[`remove${family}ClaimList`]
    assert.equal(typeof get, 'function')
    assert.equal(typeof set, 'function')
    assert.equal(typeof add, 'function')
    assert.equal(typeof remove, 'function')
    const initial = set({}, claim, ['value-a', 'value-b'])
    assert.deepEqual(get(initial, claim), ['value-a', 'value-b'])
    const extended = add(initial, claim, ['value-b', 'value-c'])
    assert.deepEqual(get(extended, claim), ['value-a', 'value-b', 'value-c'])
    const reduced = remove(extended, claim, ['value-a', 'value-c'])
    assert.deepEqual(get(reduced, claim), ['value-b'])
  })
}

test('Communication helpers keep scalar text and repeatable categories separate', () => {
  const withText = fhir.setCommunicationText({}, 'Appointment confirmed')
  const withCategories = fhir.setCommunicationCategory(withText, ['notification', 'reminder'])
  const extended = fhir.addCommunicationCategoryList(withCategories, ['notification', 'alert'])
  assert.equal(fhir.getCommunicationText(extended), 'Appointment confirmed')
  assert.deepEqual(fhir.getCommunicationCategoryList(extended), ['notification', 'reminder', 'alert'])
  assert.deepEqual(
    fhir.getCommunicationCategoryList(fhir.removeCommunicationCategoryList(extended, ['reminder'])),
    ['notification', 'alert'],
  )
})

test('generic claim-list helpers are immutable and remove empty claim lists', () => {
  const source = Object.freeze({ example: 'a,b' })
  const updated = fhir.addClaimValues(source, 'example', ['b', 'c'])
  assert.deepEqual(source, { example: 'a,b' })
  assert.deepEqual(updated, { example: 'a,b,c' })
  assert.deepEqual(fhir.setClaimValues(source, 'example', [' ', '']), {})
})
