// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ClinicalTerminologySourceScopes,
  ClinicalTerminologySystems,
  DocumentReferenceClaim,
  ImmunizationClaim,
  ImmunizationRecommendationClaim,
  MedicationClaim,
  TaskClaim,
  buildDocumentReferenceFlatEntry,
  buildImmunizationFlatGraph,
  buildImmunizationRecommendationFlatEntry,
  validateImmunizationDoseSeries,
} from '../dist/index.js'

const FIXTURE = Object.freeze({
  immunizationId: 'immunization-1',
  medicationId: 'medication-1',
  attachmentId: 'attachment-1',
  subject: 'Patient/subject-1',
  performer: 'PractitionerRole/professional-1',
  administered: '2026-09-21',
  recommended: '2026-09-22',
  nextDose: '2026-12-21',
  vaccine: Object.freeze({
    source: ClinicalTerminologySourceScopes.Atc,
    system: ClinicalTerminologySystems.Atc,
    code: 'J07BB02',
    display: 'influenza, inactivated, split virus or surface antigen',
  }),
})

test('builds a complete immunization graph using only owning claim catalogs', () => {
  const attachment = buildDocumentReferenceFlatEntry({
    entryId: FIXTURE.attachmentId,
    identifier: 'urn:uuid:attachment-1',
    contentType: 'application/pdf',
    contentHash: 'sha3-384:fixture',
  })
  const graph = buildImmunizationFlatGraph({
    entryId: FIXTURE.immunizationId,
    subjectReference: FIXTURE.subject,
    administrationDate: FIXTURE.administered,
    vaccineCode: FIXTURE.vaccine,
    performerReference: FIXTURE.performer,
    medication: {
      entryId: FIXTURE.medicationId,
      productName: 'Influenza vaccine product',
      lotNumber: 'LOT-1',
    },
    nextDoseDate: FIXTURE.nextDose,
    recommendationDate: FIXTURE.recommended,
    reminderChannels: ['sms'],
    attachments: [attachment],
  })

  const immunization = graph.find(entry => entry.entryId === FIXTURE.immunizationId)
  const medication = graph.find(entry => entry.entryId === FIXTURE.medicationId)
  const recommendation = graph.find(entry => entry.resourceType === 'ImmunizationRecommendation')
  const reminders = graph.filter(entry => entry.resourceType === 'Task')
  assert.equal(immunization.claims[ImmunizationClaim.VaccineCode], `${FIXTURE.vaccine.system}|${FIXTURE.vaccine.code}`)
  assert.equal(medication.claims[MedicationClaim.CodeText], 'Influenza vaccine product')
  assert.equal(recommendation.claims[ImmunizationRecommendationClaim.Patient], FIXTURE.subject)
  assert.equal(reminders.length, 3)
  assert.ok(reminders.every(entry => entry.claims[TaskClaim.Intent] === 'order'))
  assert.equal(attachment.claims[DocumentReferenceClaim.Identifier], 'urn:uuid:attachment-1')
})

test('rejects malformed dates, incomplete recommendations and non-document attachments', () => {
  const base = {
    entryId: FIXTURE.immunizationId,
    subjectReference: FIXTURE.subject,
    administrationDate: FIXTURE.administered,
    vaccineCode: FIXTURE.vaccine,
  }
  assert.throws(() => buildImmunizationFlatGraph({ ...base, administrationDate: '2026-02-31' }), /immunization_date_invalid/)
  assert.throws(() => buildImmunizationFlatGraph({ ...base, nextDoseDate: FIXTURE.nextDose }), /recommendation_date_required/)
  assert.throws(() => buildImmunizationFlatGraph({
    ...base,
    attachments: [{ entryId: 'wrong', reference: 'Observation/wrong', resourceType: 'Observation', claims: {} }],
  }), /immunization_attachment_invalid/)
})

test('builds one reusable recommendation entry and validates dose ordering', () => {
  const recommendation = buildImmunizationRecommendationFlatEntry({
    entryId: 'immunization-1-recommendation',
    immunizationEntryId: FIXTURE.immunizationId,
    subjectReference: FIXTURE.subject,
    recommendationDate: FIXTURE.recommended,
    nextDoseDate: FIXTURE.nextDose,
    vaccineCode: FIXTURE.vaccine,
  })

  assert.equal(recommendation.resourceType, 'ImmunizationRecommendation')
  assert.equal(recommendation.claims[ImmunizationRecommendationClaim.DateCriterionValue], FIXTURE.nextDose)
  assert.doesNotThrow(() => validateImmunizationDoseSeries('2', '3'))
  assert.throws(() => validateImmunizationDoseSeries('0', '3'), /immunization_dose_sequence_invalid/)
  assert.throws(() => validateImmunizationDoseSeries('3', '2'), /immunization_series_doses_invalid/)
})
