// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const formData = Object.freeze({
  identifier: 'urn:uuid:communication-request-one',
  status: 'draft',
  intent: 'proposal',
  priority: 'urgent',
  subject: 'Patient/patient-one',
  encounter: 'Encounter/encounter-one',
  requester: 'PractitionerRole/secretary-one',
  recipients: Object.freeze(['Patient/patient-one', 'RelatedPerson/family-one']),
  informationProviders: Object.freeze(['PractitionerRole/doctor-one']),
  authoredOn: '2026-10-05T18:30:00Z',
  payloadReference: 'DocumentReference/family-update-one',
  note: 'Call the authorized family member before release.',
})

const publishedSharedClaims = Object.freeze({
  [fhir.CommunicationRequestClaim.Replaces]: 'CommunicationRequest/earlier-request',
  [fhir.CommunicationRequestClaim.GroupIdentifier]: 'urn:uuid:communication-request-group',
  [fhir.CommunicationRequestClaim.Status]: 'on-hold',
  [fhir.CommunicationRequestClaim.StatusReason]: 'http://snomed.info/sct|281323002',
  [fhir.CommunicationRequestClaim.Intent]: 'proposal',
  [fhir.CommunicationRequestClaim.DoNotPerform]: 'false',
  [fhir.CommunicationRequestClaim.Medium]: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationMode|WRITTEN',
})

test('drives a reusable CommunicationRequest form into canonical flat claims', () => {
  assert.equal(fhir.FHIR_COMMUNICATION_REQUEST_FORM_SCHEMA.type, 'object')
  assert.deepEqual(fhir.FHIR_COMMUNICATION_REQUEST_FORM_SCHEMA.required, ['status', 'intent', 'subject', 'requester', 'recipients'])
  assert.deepEqual(fhir.FHIR_COMMUNICATION_REQUEST_FORM_SCHEMA.properties.status.enum, ['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown'])

  const claims = fhir.communicationRequestFormDataToFlatClaims(formData)
  assert.equal(claims[fhir.CommunicationRequestClaim.Status], formData.status)
  assert.equal(claims[fhir.CommunicationRequestClaim.Intent], formData.intent)
  assert.equal(claims[fhir.CommunicationRequestClaim.Recipient], formData.recipients.join(','))
  assert.equal(claims[fhir.CommunicationRequestClaim.InformationProvider], formData.informationProviders.join(','))
  assert.equal(claims[fhir.CommunicationRequestClaim.PayloadReference], formData.payloadReference)
  assert.deepEqual(fhir.communicationRequestFlatClaimsToFormData(claims), formData)
})

test('round-trips the same claims through the published R4 and R5 projections', () => {
  const claims = fhir.communicationRequestFormDataToFlatClaims(formData)
  const r4 = fhir.communicationRequestFlatToFhirR4(claims)
  const r5 = fhir.communicationRequestFlatToFhirR5(claims)

  assert.equal(r4.sender.reference, formData.informationProviders[0])
  assert.equal(r4.payload[0].contentReference.reference, formData.payloadReference)
  assert.equal(r5.intent, formData.intent)
  assert.equal(r5.informationProvider[0].reference, formData.informationProviders[0])
  const r4Claims = fhir.communicationRequestFhirR4ToFlat(r4)
  assert.equal(r4Claims[fhir.CommunicationRequestClaim.Recipient], claims[fhir.CommunicationRequestClaim.Recipient])
  assert.equal(r4Claims[fhir.CommunicationRequestClaim.InformationProvider], claims[fhir.CommunicationRequestClaim.InformationProvider])
  assert.equal(r4Claims[fhir.CommunicationRequestClaim.PayloadReference], claims[fhir.CommunicationRequestClaim.PayloadReference])
  assert.deepEqual(fhir.communicationRequestFhirR5ToFlat(r5), claims)
})

test('exposes only published R4 and R5 CommunicationRequest adapters', () => {
  const communicationRequestExports = Object.keys(fhir).filter(name => name.toLowerCase().includes('communicationrequest'))
  assert.ok(communicationRequestExports.includes('communicationRequestFhirR5ToFlat'))
  assert.ok(communicationRequestExports.includes('communicationRequestFlatToFhirR5'))
  assert.deepEqual(communicationRequestExports.filter(name => /r5orr6|r6/iu.test(name)), [])
})

test('preserves fields shared by the published R4 and R5 CommunicationRequest definitions', () => {
  const r4 = fhir.communicationRequestFlatToFhirR4(publishedSharedClaims)
  const r5 = fhir.communicationRequestFlatToFhirR5(publishedSharedClaims)

  assert.equal(r4.replaces[0].reference, publishedSharedClaims[fhir.CommunicationRequestClaim.Replaces])
  assert.equal(r4.statusReason.coding[0].code, '281323002')
  assert.equal(r4.doNotPerform, false)
  assert.equal(r5.statusReason.coding[0].code, '281323002')
  assert.equal(r5.medium[0].coding[0].code, 'WRITTEN')
  assert.deepEqual(fhir.communicationRequestFhirR4ToFlat(r4), Object.fromEntries(Object.entries(publishedSharedClaims).filter(([key]) => key !== fhir.CommunicationRequestClaim.Intent)))
  assert.deepEqual(fhir.communicationRequestFhirR5ToFlat(r5), publishedSharedClaims)
})

test('rejects an empty audience', () => {
  assert.throws(() => fhir.communicationRequestFormDataToFlatClaims({ ...formData, recipients: [] }), /communication_request_recipient_required/)
})
