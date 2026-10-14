// Flow contract: an attended appointment opens one encounter-linked clinical context, and imaging metadata round-trips without embedding DICOM payloads.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const SUBJECT = 'did:web:example.test:individual:animal-1'

test('Encounter preserves its originating Appointment and canonical lifecycle statuses', () => {
  const nativeEncounter = {
    resourceType: 'Encounter',
    identifier: [{ value: 'encounter-1' }],
    status: fhir.EncounterStatus.InProgress,
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' },
    subject: { reference: SUBJECT },
    appointment: [{ reference: 'Appointment/appointment-1' }],
    participant: [{ individual: { reference: 'PractitionerRole/veterinarian-1' } }],
    serviceProvider: { reference: 'Organization/clinic-1' },
    period: { start: '2026-09-26T10:00:00Z' },
    location: [{ location: { reference: 'Location/consultation-1' } }],
  }

  const claims = fhir.encounterFhirR4ToFlat(nativeEncounter)
  assert.equal(claims[fhir.EncounterClaim.Appointment], 'Appointment/appointment-1')
  assert.equal(claims[fhir.EncounterClaim.Status], 'in-progress')
  assert.deepEqual(fhir.encounterFlatToFhirR4(claims).appointment, [{ reference: 'Appointment/appointment-1' }])
  assert.deepEqual(Object.values(fhir.EncounterStatus), [
    'planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown',
  ])
})

test('ImagingStudy preserves searchable clinical metadata and references but no image bytes', () => {
  const nativeImagingStudy = {
    resourceType: 'ImagingStudy',
    identifier: [{ value: 'imaging-study-1' }],
    status: 'available',
    modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'DX', display: 'Digital Radiography' }],
    subject: { reference: SUBJECT },
    encounter: { reference: 'Encounter/encounter-1' },
    started: '2026-09-26T10:15:00Z',
    basedOn: [{ reference: 'ServiceRequest/radiography-1' }],
    endpoint: [{ reference: 'Endpoint/dicomweb-1' }],
    referrer: { reference: 'PractitionerRole/veterinarian-1' },
    interpreter: [{ reference: 'PractitionerRole/radiologist-1' }],
    procedureReference: { reference: 'Procedure/radiography-1' },
    procedureCode: [{ coding: [{ system: 'http://snomed.info/sct', code: '363680008', display: 'Radiographic imaging procedure' }] }],
    reasonCode: [{ coding: [{ system: 'http://snomed.info/sct', code: '125605004', display: 'Fracture of bone' }] }],
    reasonReference: [{ reference: 'Condition/fracture-1' }],
    numberOfSeries: 1,
    numberOfInstances: 2,
    description: 'Left forelimb radiographs',
  }

  const claims = fhir.imagingStudyFhirR4ToFlat(nativeImagingStudy)
  assert.equal(claims[fhir.ImagingStudyClaim.Subject], SUBJECT)
  assert.equal(claims[fhir.ImagingStudyClaim.Encounter], 'Encounter/encounter-1')
  assert.equal(claims[fhir.ImagingStudyClaim.Modality], 'http://dicom.nema.org/resources/ontology/DCM|DX')
  assert.equal(claims[fhir.ImagingStudyClaim.Endpoint], 'Endpoint/dicomweb-1')

  const projected = fhir.imagingStudyFlatToFhirR4(claims)
  assert.equal(projected.resourceType, 'ImagingStudy')
  assert.deepEqual(projected.endpoint, [{ reference: 'Endpoint/dicomweb-1' }])
  assert.equal(projected.numberOfInstances, 2)
  assert.equal('data' in projected, false)
  assert.equal('content' in projected, false)
  assert.equal('series' in projected, false)
})
