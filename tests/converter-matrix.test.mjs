// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const TOKEN = Object.freeze({ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' })
const SUBJECT = 'did:web:example.test:individual:subject-1'

const CASES = Object.freeze([
  ['AllergyIntolerance', fhir.allergyIntoleranceFhirR4ToFlat, fhir.allergyIntoleranceFlatToFhirR4, fhir.AllergyIntoleranceClaim.Code, { patient: { reference: SUBJECT }, code: { coding: [TOKEN], text: 'Allergy' } }],
  ['AppointmentResponse', fhir.appointmentResponseFhirR4ToFlat, fhir.appointmentResponseFlatToFhirR4, fhir.AppointmentResponseClaim.Appointment, { appointment: { reference: 'Appointment/appointment-1' }, participantStatus: 'accepted' }],
  ['Appointment', fhir.appointmentFhirR4ToFlat, fhir.appointmentFlatToFhirR4, fhir.AppointmentClaim.Status, { status: 'booked', participant: [{ actor: { reference: SUBJECT }, status: 'accepted' }] }],
  ['CarePlan', fhir.carePlanFhirR4ToFlat, fhir.carePlanFlatToFhirR4, fhir.CarePlanClaim.Status, {
    status: 'active', intent: 'plan', subject: { reference: SUBJECT }, created: '2026-09-21',
    category: [{ coding: [TOKEN], text: 'Plan category' }], description: 'Longitudinal plan',
    period: { start: '2026-09-21', end: '2027-09-21' }, note: [{ text: 'Plan note' }],
    basedOn: [{ reference: 'ServiceRequest/request-1' }], careTeam: [{ reference: 'CareTeam/team-1' }],
    addresses: [{ reference: 'Condition/condition-1' }], encounter: { reference: 'Encounter/encounter-1' },
    goal: [{ reference: 'Goal/goal-1' }], partOf: [{ reference: 'CarePlan/parent-1' }],
    replaces: [{ reference: 'CarePlan/replaced-1' }], activity: [{
      outcomeCodeableConcept: [{ coding: [TOKEN] }], reference: { reference: 'Task/task-1' },
      detail: { code: { coding: [TOKEN] }, scheduledString: 'weekly', performer: [{ reference: 'PractitionerRole/role-1' }], status: 'in-progress', statusReason: { text: 'scheduled' }, doNotPerform: false, scheduledTiming: { repeat: { frequency: 2, period: 1, periodUnit: 'wk' } }, location: { display: 'Clinic' } },
    }],
  }],
  ['ClinicalImpression', fhir.clinicalImpressionFhirR4ToFlat, fhir.clinicalImpressionFlatToFhirR4, fhir.ClinicalImpressionClaim.Subject, { status: 'completed', subject: { reference: SUBJECT } }],
  ['Composition', fhir.compositionFhirR4ToFlat, fhir.compositionFlatToFhirR4, fhir.CompositionClaim.Subject, {
    status: 'final', subject: { reference: SUBJECT }, type: { coding: [TOKEN] }, title: 'Document',
    author: [{ reference: 'PractitionerRole/role-1' }], custodian: { reference: 'Organization/org-1' }, date: '2026-09-21T12:00:00Z',
    attester: [{ mode: 'professional', time: '2026-09-21T12:01:00Z', party: { reference: 'PractitionerRole/role-1' } }, { mode: 'legal', time: '2026-09-21T12:02:00Z', party: { reference: 'Organization/org-1' } }],
    section: [{ code: { coding: [TOKEN] } }],
  }],
  ['Condition', fhir.conditionFhirR4ToFlat, fhir.conditionFlatToFhirR4, fhir.ConditionClaim.Code, { subject: { reference: SUBJECT }, code: { coding: [TOKEN], text: 'Condition' } }],
  ['Coverage', fhir.coverageFhirR4ToFlat, fhir.coverageFlatToFhirR4, fhir.CoverageClaim.Status, {
    status: 'active', type: { coding: [TOKEN] }, policyHolder: { reference: 'RelatedPerson/holder-1' },
    subscriber: { reference: 'Patient/subscriber-1' }, beneficiary: { reference: SUBJECT },
    relationship: { coding: [TOKEN] }, period: { start: '2026-01-01', end: '2026-12-31' },
    payor: [{ reference: 'Organization/payer-1' }, { reference: 'Organization/payer-2' }],
    class: [{ type: { text: 'plan' }, value: 'gold' }, { type: { text: 'group' }, value: 'research' }],
  }],
  ['DeviceUseStatement', fhir.deviceUseStatementFhirR4ToFlat, fhir.deviceUseStatementFlatToFhirR4, fhir.DeviceUseStatementClaim.Subject, { status: 'active', subject: { reference: SUBJECT }, device: { reference: 'Device/device-1' } }],
  ['Device', fhir.deviceFhirR4ToFlat, fhir.deviceFlatToFhirR4, fhir.DeviceClaim.Status, { status: 'active', patient: { reference: SUBJECT }, type: { coding: [TOKEN] } }],
  ['DiagnosticReport', fhir.diagnosticReportFhirR4ToFlat, fhir.diagnosticReportFlatToFhirR4, fhir.DiagnosticReportClaim.Code, {
    status: 'final', subject: { reference: SUBJECT }, code: { coding: [TOKEN], text: 'Report' }, category: [{ coding: [TOKEN] }],
    encounter: { reference: 'Encounter/encounter-1' }, effectiveDateTime: '2026-09-21', basedOn: [{ reference: 'ServiceRequest/request-1' }],
    performer: [{ reference: 'Organization/lab-1' }], result: [{ reference: 'Observation/result-1' }],
    resultsInterpreter: [{ reference: 'PractitionerRole/role-1' }], specimen: [{ reference: 'Specimen/specimen-1' }],
    media: [{ link: { reference: 'Media/media-1' } }], presentedForm: [{ contentType: 'application/pdf', data: 'ZGF0YQ==', url: 'urn:uuid:report-1' }],
  }],
  ['DocumentReference', fhir.documentReferenceFhirR4ToFlat, fhir.documentReferenceFlatToFhirR4, fhir.DocumentReferenceClaim.Subject, { status: 'current', subject: { reference: SUBJECT }, content: [{ attachment: { contentType: 'application/pdf', url: 'urn:uuid:document-1' } }] }],
  ['Encounter', fhir.encounterFhirR4ToFlat, fhir.encounterFlatToFhirR4, fhir.EncounterClaim.Status, {
    status: 'finished', subject: { reference: SUBJECT }, class: { system: TOKEN.system, code: TOKEN.code }, type: [{ coding: [TOKEN] }],
    participant: [{ individual: { reference: 'PractitionerRole/role-1' } }], serviceProvider: { reference: 'Organization/org-1' },
    period: { start: '2026-09-21T10:00:00Z', end: '2026-09-21T11:00:00Z' }, reasonCode: [{ coding: [TOKEN] }],
    diagnosis: [{ condition: { reference: 'Condition/condition-1' } }], location: [{ location: { reference: 'Location/location-1' } }],
  }],
  ['Flag', fhir.flagFhirR4ToFlat, fhir.flagFlatToFhirR4, fhir.FlagClaim.Subject, { status: 'active', subject: { reference: SUBJECT }, code: { coding: [TOKEN], text: 'Alert' } }],
  ['Immunization', fhir.immunizationFhirR4ToFlat, fhir.immunizationFlatToFhirR4, fhir.ImmunizationClaim.VaccineCode, { status: 'completed', patient: { reference: SUBJECT }, occurrenceDateTime: '2026-09-21', vaccineCode: { coding: [TOKEN], text: 'Vaccine' } }],
  ['ImagingStudy', fhir.imagingStudyFhirR4ToFlat, fhir.imagingStudyFlatToFhirR4, fhir.ImagingStudyClaim.Status, {
    status: 'available', subject: { reference: SUBJECT }, encounter: { reference: 'Encounter/encounter-1' },
    modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'DX' }],
    endpoint: [{ reference: 'Endpoint/dicomweb-1' }], numberOfSeries: 1, numberOfInstances: 2,
  }],
  ['HealthcareService', fhir.healthcareServiceFhirR4ToFlat, fhir.healthcareServiceFlatToFhirR4, fhir.HealthcareServiceClaim.ServiceType, {
    active: true, providedBy: { reference: 'Organization/department-1' },
    category: [{ coding: [TOKEN] }], type: [{ coding: [TOKEN] }], specialty: [{ coding: [TOKEN] }],
    location: [{ reference: 'Location/clinic-1' }], coverageArea: [{ reference: 'Location/region-1' }],
    name: 'Clinical laboratory', program: [{ coding: [TOKEN] }], characteristic: [{ coding: [TOKEN] }],
    endpoint: [{ reference: 'Endpoint/service-inbox-1' }],
  }],
  ['Location', fhir.locationFhirR4ToFlat, fhir.locationFlatToFhirR4, fhir.LocationClaim.Name, { status: 'active', name: 'Clinic' }],
  ['MedicationStatement', fhir.medicationStatementFhirR4ToFlat, fhir.medicationStatementFlatToFhirR4, fhir.MedicationStatementClaim.Code, {
    status: 'active', subject: { reference: SUBJECT }, medicationCodeableConcept: { coding: [TOKEN], text: 'Medicine' },
    effectivePeriod: { start: '2026-09-21', end: '2026-10-21' }, informationSource: { reference: 'PractitionerRole/role-1' },
    note: [{ text: 'With food' }], dosage: [{ text: 'Twice daily', route: { coding: [TOKEN] }, timing: { repeat: { frequency: 2, period: 1, periodUnit: 'd' } }, doseAndRate: [{ doseQuantity: { value: 5, system: 'http://unitsofmeasure.org', code: 'mg', unit: 'mg' } }] }],
  }],
  ['Observation', fhir.observationFhirR4ToFlat, fhir.observationFlatToFhirR4, fhir.ObservationClaim.Code, { status: 'final', subject: { reference: SUBJECT }, code: { coding: [TOKEN] }, valueQuantity: { value: 37, system: 'http://unitsofmeasure.org', code: 'Cel' } }],
  ['Organization', fhir.organizationFhirR4ToFlat, fhir.organizationFlatToFhirR4, fhir.OrganizationClaim.Name, { active: true, name: 'Clinic' }],
  ['PractitionerRole', fhir.practitionerRoleFhirR4ToFlat, fhir.practitionerRoleFlatToFhirR4, fhir.PractitionerRoleClaim.Practitioner, { active: true, practitioner: { reference: 'Practitioner/practitioner-1' }, organization: { reference: 'Organization/clinic-1' }, code: [{ coding: [TOKEN] }] }],
  ['Procedure', fhir.procedureFhirR4ToFlat, fhir.procedureFlatToFhirR4, fhir.ProcedureClaim.Code, { status: 'completed', subject: { reference: SUBJECT }, code: { coding: [TOKEN], text: 'Procedure' } }],
  ['RelatedPerson', fhir.relatedPersonFhirR4ToFlat, fhir.relatedPersonFlatToFhirR4, fhir.RelatedPersonClaim.Patient, { active: true, patient: { reference: SUBJECT }, relationship: [{ coding: [TOKEN] }] }],
])

for (const [resourceType, toFlat, fromFlat, key, fields] of CASES) {
  test(`${resourceType} converter preserves a meaningful canonical claim`, () => {
    const resource = { resourceType, identifier: [{ value: `${resourceType.toLowerCase()}-1` }], ...fields }
    const claims = toFlat(resource)
    assert.ok(claims[key], `${resourceType} did not emit ${key}`)
    const projected = fromFlat(claims)
    assert.equal(projected.resourceType, resourceType)
    assert.equal(toFlat(projected)[key], claims[key])
  })
}

test('Immunization preserves total series doses independently from the dose sequence', () => {
  const claims = fhir.immunizationFhirR4ToFlat({
    resourceType: 'Immunization',
    status: 'completed',
    patient: { reference: SUBJECT },
    occurrenceDateTime: '2026-09-21',
    vaccineCode: { coding: [TOKEN], text: 'Vaccine' },
    protocolApplied: [{ series: 'Primary course', doseNumberPositiveInt: 2, seriesDosesPositiveInt: 3 }],
  })

  assert.equal(claims[fhir.ImmunizationClaim.DoseSequence], '2')
  assert.equal(claims[fhir.ImmunizationClaim.SeriesDoses], '3')
  assert.equal(fhir.immunizationFlatToFhirR4(claims).protocolApplied[0].seriesDosesPositiveInt, 3)
})

test('Consent adapters preserve active permit decisions in R4 and R5', () => {
  const r4 = { resourceType: 'Consent', status: 'active', patient: { reference: SUBJECT }, provision: { type: 'permit', action: [{ coding: [TOKEN] }] } }
  const r5 = { resourceType: 'Consent', status: 'active', subject: { reference: SUBJECT }, decision: 'permit', provision: [{ action: [{ coding: [TOKEN] }] }] }
  assert.equal(fhir.consentFlatToFhirR4(fhir.consentFhirR4ToFlat(r4)).provision.type, 'permit')
  assert.equal(fhir.consentFlatToFhirR5(fhir.consentFhirR5ToFlat(r5)).decision, 'permit')
})
