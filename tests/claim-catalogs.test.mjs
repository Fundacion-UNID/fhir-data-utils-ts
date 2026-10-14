// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const CATALOGS = Object.freeze([
  ['AllergyIntolerance', fhir.AllergyIntoleranceClaim],
  ['Appointment', fhir.AppointmentClaim],
  ['AppointmentResponse', fhir.AppointmentResponseClaim],
  ['CarePlan', fhir.CarePlanClaim],
  ['ClinicalImpression', fhir.ClinicalImpressionClaim],
  ['Communication', fhir.CommunicationClaim],
  ['CommunicationRequest', fhir.CommunicationRequestClaim],
  ['Composition', fhir.CompositionClaim],
  ['Condition', fhir.ConditionClaim],
  ['Consent', fhir.ConsentClaim],
  ['Coverage', fhir.CoverageClaim],
  ['Device', fhir.DeviceClaim],
  ['DeviceUseStatement', fhir.DeviceUseStatementClaim],
  ['DiagnosticReport', fhir.DiagnosticReportClaim],
  ['DocumentReference', fhir.DocumentReferenceClaim],
  ['Encounter', fhir.EncounterClaim],
  ['Flag', fhir.FlagClaim],
  ['Immunization', fhir.ImmunizationClaim],
  ['ImmunizationRecommendation', fhir.ImmunizationRecommendationClaim],
  ['ImagingStudy', fhir.ImagingStudyClaim],
  ['HealthcareService', fhir.HealthcareServiceClaim],
  ['Invoice', fhir.InvoiceClaim],
  ['Location', fhir.LocationClaim],
  ['Medication', fhir.MedicationClaim],
  ['MedicationStatement', fhir.MedicationStatementClaim],
  ['Observation', fhir.ObservationClaim],
  ['Organization', fhir.OrganizationClaim],
  ['PractitionerRole', fhir.PractitionerRoleClaim],
  ['Procedure', fhir.ProcedureClaim],
  ['RelatedPerson', fhir.RelatedPersonClaim],
  ['ResearchSubject', fhir.ResearchSubjectClaim],
  ['Task', fhir.TaskClaim],
])

test('every exported claim catalog owns only its resource-prefixed names', () => {
  for (const [resourceType, catalog] of CATALOGS) {
    assert.ok(catalog, `missing ${resourceType} claim catalog`)
    for (const claim of Object.values(catalog)) {
      assert.match(claim, new RegExp(`^${resourceType}\\.`), `${claim} is outside ${resourceType}`)
    }
  }
})

test('builders and converters contain no duplicated flat-claim string literals', async () => {
  const roots = ['src/builders', 'src/converters']
  const violations = []
  for (const root of roots) {
    for (const name of await readdir(root)) {
      if (!name.endsWith('.ts')) continue
      const relative = path.join(root, name)
      const source = await readFile(relative, 'utf8')
      const matches = source.match(/['"](?:[A-Z][A-Za-z]+)\.[a-z][A-Za-z0-9-]*['"]/g) ?? []
      if (matches.length) violations.push(`${relative}: ${matches.join(', ')}`)
    }
  }
  assert.deepEqual(violations, [])
})

test('legacy root immunization modules are re-export shims rather than duplicate implementations', async () => {
  for (const file of ['src/immunization-flat-claims.ts', 'src/immunization-reminder-plan.ts']) {
    const source = await readFile(file, 'utf8')
    assert.doesNotMatch(source, /function\s+/)
    assert.match(source, /@deprecated/)
  }
})
