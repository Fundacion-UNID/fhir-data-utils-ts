// Flow contract: 1) a dataspace exchange is an outer batch Bundle containing Communication, 2) each Communication carries one inner document, batch, or collection Bundle authored and read only through the public Bundle boundary, 3) native Appointment start/end survive projection, 4) an ICS file is a DocumentReference inside the inner Bundle rather than a direct Communication payload, and 5) malformed document or batch Bundles fail closed.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AppointmentClaim,
  CommunicationClaim,
  DocumentReferenceClaim,
  FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA,
  projectAppointmentCommunicationBatchToFlatGraph,
  readCommunicationBundlePayloads,
} from '../dist/index.js'

test('projects an Appointment Bundle carried by Communication without losing its DocumentReference calendar attachment', () => {
  const projected = projectAppointmentCommunicationBatchToFlatGraph(
    FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.outerBatch,
    FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.release,
  )

  assert.equal(projected.appointments.length, 1)
  assert.equal(projected.communications.length, 1)
  assert.equal(projected.documentReferences.length, 1)
  assert.equal(projected.appointments[0].claims[AppointmentClaim.Start], FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.start)
  assert.equal(projected.appointments[0].claims[AppointmentClaim.End], FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.end)
  assert.equal(projected.communications[0].claims[CommunicationClaim.ContentAttachmentType], 'application/fhir+json')
  assert.equal(projected.documentReferences[0].claims[DocumentReferenceClaim.ContentType], 'text/calendar')
  assert.equal(projected.documentReferences[0].claims[DocumentReferenceClaim.ContentData], FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.calendarData)
  assert.equal(projected.documentReferences[0].claims[DocumentReferenceClaim.EventReference], FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.appointmentReference)
  assert.equal(projected.entries.some(entry => entry.resourceType === 'DocumentReference'), true)
})

test('validates the complete outer Communication and inner collection Bundle boundary', () => {
  const payloads = readCommunicationBundlePayloads(FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.outerBatch)

  assert.equal(payloads.length, 1)
  assert.equal(payloads[0].bundle.type, 'collection')
  assert.equal(payloads[0].bundle.entry.filter(entry => entry.resource.resourceType === 'Appointment').length, 1)
  assert.equal(payloads[0].bundle.entry.filter(entry => entry.resource.resourceType === 'DocumentReference').length, 1)
})

test('rejects a document Bundle whose first resource is not Composition', () => {
  assert.throws(
    () => readCommunicationBundlePayloads(FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.outerBatchWithInvalidDocument),
    /fhir_document_composition_first_required/,
  )
})

test('rejects a batch Bundle entry without an executable request', () => {
  assert.throws(
    () => readCommunicationBundlePayloads(FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.outerBatchWithInvalidInnerBatch),
    /fhir_batch_request_required/,
  )
})

test('rejects a direct calendar attachment because files belong to DocumentReference inside the Bundle', () => {
  const invalidCommunication = {
    ...FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.communication,
    payload: [{ contentAttachment: { contentType: 'text/calendar', data: FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.calendarData } }],
  }
  const invalidOuterBatch = {
    resourceType: 'Bundle',
    type: 'batch',
    entry: [{ resource: invalidCommunication, request: { method: 'POST', url: 'Communication' } }],
  }

  assert.throws(() => readCommunicationBundlePayloads(invalidOuterBatch), /fhir_bundle_attachment_required/)
})

test('rejects an outer payload that is not a batch Bundle', () => {
  assert.throws(
    () => projectAppointmentCommunicationBatchToFlatGraph(FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.communication, 'r5'),
    /fhir_bundle_required/,
  )
})

test('rejects a Communication whose clinical attachment is not an inner Bundle', () => {
  assert.throws(
    () => projectAppointmentCommunicationBatchToFlatGraph(FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA.outerBatchWithBareAppointment, 'r5'),
    /fhir_bundle_required/,
  )
})
