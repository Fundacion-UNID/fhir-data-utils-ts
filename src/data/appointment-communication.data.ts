import type { FhirBundle, FhirResource } from '../fhir-types.js'

const APPOINTMENT_ID = 'appointment-one'
const COMMUNICATION_ID = 'communication-one'
const CALENDAR_DOCUMENT_ID = 'appointment-calendar-one'
const SUBJECT_REFERENCE = 'Patient/animal-one'
const SENDER_REFERENCE = 'Organization/clinic-one'
const RECIPIENT_REFERENCE = 'RelatedPerson/controller-one'
const APPOINTMENT_REFERENCE = `Appointment/${APPOINTMENT_ID}`
const CALENDAR_DOCUMENT_REFERENCE = `DocumentReference/${CALENDAR_DOCUMENT_ID}`
const APPOINTMENT_START = '2026-10-05T16:00:00.000Z'
const APPOINTMENT_END = '2026-10-05T16:30:00.000Z'
const CALENDAR_DATA = encodeBase64Utf8('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:20261005T160000Z\r\nDTEND:20261005T163000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n')
const APPOINTMENT: FhirResource = Object.freeze({
  resourceType: 'Appointment', id: APPOINTMENT_ID, identifier: [{ value: APPOINTMENT_ID }], status: 'booked',
  start: APPOINTMENT_START, end: APPOINTMENT_END,
  participant: [{ actor: { reference: SUBJECT_REFERENCE }, status: 'accepted' }, { actor: { reference: 'PractitionerRole/veterinarian-one' }, status: 'accepted' }, { actor: { reference: 'Location/consultation-one' }, status: 'accepted' }],
  slot: [{ reference: 'Slot/consultation-one' }], supportingInformation: [{ reference: CALENDAR_DOCUMENT_REFERENCE }],
})
const CALENDAR_DOCUMENT: FhirResource = Object.freeze({
  resourceType: 'DocumentReference', id: CALENDAR_DOCUMENT_ID, identifier: [{ value: CALENDAR_DOCUMENT_ID }], status: 'current',
  subject: { reference: SUBJECT_REFERENCE }, context: { related: [{ reference: APPOINTMENT_REFERENCE }] },
  content: [{ attachment: { contentType: 'text/calendar', data: CALENDAR_DATA, title: 'appointment.ics' } }],
})
const INNER_BUNDLE: FhirBundle = Object.freeze({ resourceType: 'Bundle', type: 'collection', entry: [{ resource: APPOINTMENT }, { resource: CALENDAR_DOCUMENT }] })
const COMMUNICATION: FhirResource = Object.freeze({
  resourceType: 'Communication', id: COMMUNICATION_ID, identifier: [{ value: COMMUNICATION_ID }], status: 'completed',
  subject: { reference: SUBJECT_REFERENCE }, recipient: [{ reference: RECIPIENT_REFERENCE }], sender: { reference: SENDER_REFERENCE },
  payload: [{ contentAttachment: { contentType: 'application/fhir+json', data: encodeBase64Utf8(JSON.stringify(INNER_BUNDLE)), title: 'appointment-bundle.json' } }],
})

function communicationWithInnerBundle(innerBundle: FhirBundle): FhirResource {
  return Object.freeze({
    ...COMMUNICATION,
    payload: [{ contentAttachment: { contentType: 'application/fhir+json', data: encodeBase64Utf8(JSON.stringify(innerBundle)) } }],
  })
}

function outerBatchWithCommunication(communication: FhirResource): FhirBundle {
  return Object.freeze({
    resourceType: 'Bundle',
    type: 'batch',
    entry: [{ resource: communication, request: { method: 'POST', url: 'Communication' } }],
  })
}

/** Repository-safe reusable evidence for appointment Bundle and calendar tests. */
export const FHIR_APPOINTMENT_COMMUNICATION_TEST_DATA = Object.freeze({
  release: 'r5' as const,
  start: APPOINTMENT_START,
  end: APPOINTMENT_END,
  communicationId: COMMUNICATION_ID,
  subjectReference: SUBJECT_REFERENCE,
  senderReference: SENDER_REFERENCE,
  recipientReference: RECIPIENT_REFERENCE,
  appointmentReference: APPOINTMENT_REFERENCE,
  calendarData: CALENDAR_DATA,
  appointment: APPOINTMENT,
  calendarDocument: CALENDAR_DOCUMENT,
  communication: COMMUNICATION,
  outerBatch: outerBatchWithCommunication(COMMUNICATION),
  outerBatchWithInvalidDocument: outerBatchWithCommunication(communicationWithInnerBundle(Object.freeze({
    resourceType: 'Bundle',
    type: 'document',
    entry: [{ resource: APPOINTMENT }],
  }))),
  outerBatchWithInvalidInnerBatch: outerBatchWithCommunication(communicationWithInnerBundle(Object.freeze({
    resourceType: 'Bundle',
    type: 'batch',
    entry: [{ resource: APPOINTMENT }],
  }))),
  outerBatchWithBareAppointment: Object.freeze({
    resourceType: 'Bundle', type: 'batch', entry: [{ resource: { ...COMMUNICATION, payload: [{ contentAttachment: { contentType: 'application/fhir+json', data: encodeBase64Utf8(JSON.stringify(APPOINTMENT)) } }] }, request: { method: 'POST', url: 'Communication' } }],
  }),
})

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return globalThis.btoa(binary)
}
