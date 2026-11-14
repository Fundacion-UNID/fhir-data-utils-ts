// Flow contract: native Communication exchange has a discriminator, typed references and payloads, while consumer metadata extensions remain explicitly owned by the consumer.
import type {
  FhirAttachment, FhirMeta, FhirCommunication, FhirCommunicationResource,
  FhirReference, FhirResource,
} from 'fhir-data-utils-ts'
import type { FhirCommunicationResource as SubpathCommunication } from 'fhir-data-utils-ts/fhir-types'

const attachment: FhirAttachment = { contentType: 'application/fhir+json', data: 'e30=', title: 'Report' }
const reference: FhirReference = { reference: 'Patient/example' }
const metadata: FhirMeta = { versionId: '1', profile: [], tag: [{ code: 'reviewed' }] }
const communication: FhirCommunicationResource = {
  resourceType: 'Communication', status: 'completed', meta: metadata,
  subject: reference, sender: { reference: 'Practitioner/example' }, recipient: [reference],
  category: [{ text: 'Clinical notification' }],
  payload: [{ contentAttachment: attachment }, { contentReference: reference }, { contentString: 'Reviewed' }],
  partOf: [{ reference: 'Encounter/example' }], note: [{ text: 'Documented' }],
}
const native: FhirResource = communication
const legacyName: FhirCommunication = communication
const subpath: SubpathCommunication = legacyName
const partial: FhirCommunicationResource = { resourceType: 'Communication' }
type ConsumerMetadata = FhirMeta & { consumerClaims: Record<string, unknown> }
const extended: FhirCommunicationResource<ConsumerMetadata> = {
  resourceType: 'Communication', meta: { consumerClaims: { reviewed: true } },
}
const consumerClaims: Record<string, unknown> = extended.meta!.consumerClaims
// @ts-expect-error Another resource discriminator is not a Communication projection.
const wrongType: FhirCommunicationResource = { resourceType: 'Patient' }
// @ts-expect-error References are objects, not flat strings.
const wrongRecipient: FhirCommunicationResource = { resourceType: 'Communication', recipient: ['Patient/example'] }
// @ts-expect-error Native attachment data must remain a base64 string.
const wrongPayload: FhirCommunicationResource = { resourceType: 'Communication', payload: [{ contentAttachment: { data: 42 } }] }
// @ts-expect-error Metadata extensions are unknown until the consumer specifies its own contract.
const inferredClaims: Record<string, unknown> = metadata.consumerClaims
void [native, subpath, partial, consumerClaims, wrongType, wrongRecipient, wrongPayload, inferredClaims]
