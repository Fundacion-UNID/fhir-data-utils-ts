import { AppointmentClaim } from '../claims/appointment-claims.js'
import { CommunicationClaim } from '../claims/communication-claims.js'
import { DocumentReferenceClaim } from '../claims/document-reference-claims.js'
import { readBundleResources, readCommunicationBundlePayloads } from '../fhir-bundle.js'
import type { FhirResource } from '../fhir-types.js'
import { buildFlatClaimResourceEntry, type FlatClaimResourceEntry } from '../flat-claim-resource-graph.js'
import { appointmentFhirR4ToFlat } from './convert-appointment.js'
import { documentReferenceFhirR4ToFlat } from './convert-document-reference.js'

export type SupportedAppointmentFhirRelease = 'r4' | 'r5'

export type AppointmentCommunicationFlatGraph = Readonly<{
  communications: readonly FlatClaimResourceEntry[]
  appointments: readonly FlatClaimResourceEntry[]
  documentReferences: readonly FlatClaimResourceEntry[]
  entries: readonly FlatClaimResourceEntry[]
}>

/**
 * Projects a validated appointment exchange into independently persisted flat
 * claim resources. Transport parsing is delegated to the shared Bundle Reader;
 * native FHIR remains an adapter input and is never persisted beside claims.
 */
export function projectAppointmentCommunicationBatchToFlatGraph(
  input: unknown,
  release: SupportedAppointmentFhirRelease,
): AppointmentCommunicationFlatGraph {
  if (release !== 'r4' && release !== 'r5') throw new TypeError('fhir_release_unsupported')
  const communications: FlatClaimResourceEntry[] = []
  const appointments: FlatClaimResourceEntry[] = []
  const documentReferences: FlatClaimResourceEntry[] = []

  for (const { communication, attachment, bundle } of readCommunicationBundlePayloads(input)) {
    const communicationId = resourceId(communication, 'communication_identifier_required')
    communications.push(buildFlatClaimResourceEntry({
      entryId: communicationId,
      resourceType: 'Communication',
      claims: compactClaims({
        [CommunicationClaim.Identifier]: communicationId,
        [CommunicationClaim.Status]: stringValue(communication.status),
        [CommunicationClaim.Subject]: referenceValue(communication.subject),
        [CommunicationClaim.Recipient]: referenceList(communication.recipient),
        [CommunicationClaim.Sender]: referenceValue(communication.sender),
        [CommunicationClaim.Sent]: stringValue(communication.sent),
        [CommunicationClaim.ContentAttachmentType]: attachment.contentType,
        [CommunicationClaim.ContentAttachmentData]: attachment.data,
        [CommunicationClaim.ContentAttachmentTitle]: attachment.title,
      }),
    }))

    for (const child of readBundleResources(bundle)) {
      if (child.resourceType === 'Appointment') {
        const entryId = resourceId(child, 'appointment_identifier_required')
        const structural = appointmentFhirR4ToFlat(child)
        appointments.push(buildFlatClaimResourceEntry({
          entryId,
          resourceType: 'Appointment',
          claims: compactClaims({
            ...structural,
            [AppointmentClaim.Identifier]: structural[AppointmentClaim.Identifier] || entryId,
          }),
        }))
      } else if (child.resourceType === 'DocumentReference') {
        const entryId = resourceId(child, 'document_reference_identifier_required')
        const structural = documentReferenceFhirR4ToFlat(child)
        documentReferences.push(buildFlatClaimResourceEntry({
          entryId,
          resourceType: 'DocumentReference',
          claims: compactClaims({
            ...structural,
            [DocumentReferenceClaim.Identifier]: structural[DocumentReferenceClaim.Identifier] || entryId,
          }),
        }))
      }
    }
  }

  return Object.freeze({
    communications: Object.freeze(communications),
    appointments: Object.freeze(appointments),
    documentReferences: Object.freeze(documentReferences),
    entries: Object.freeze([...communications, ...appointments, ...documentReferences]),
  })
}

function resourceId(resource: FhirResource, error: string): string {
  const identifier = Array.isArray(resource.identifier)
    ? (resource.identifier as readonly Record<string, unknown>[]).find(item => typeof item?.value === 'string')?.value
    : undefined
  const value = String(resource.id || identifier || '').trim()
  if (!value) throw new TypeError(error)
  return value
}

function compactClaims(input: Readonly<Record<string, unknown>>): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(Object.entries(input)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined && entry[1] !== null && String(entry[1]).trim() !== '')
    .map(([name, value]) => [name, String(value).trim()])))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function referenceValue(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return stringValue((value as Record<string, unknown>).reference)
}

function referenceList(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined
  const references = value.map(referenceValue).filter((item): item is string => Boolean(item))
  return references.length ? [...new Set(references)].join(',') : undefined
}
