import type { FhirBundle, FhirResource } from './fhir-types.js'

export function readBundleResources<TResource extends FhirResource = FhirResource>(bundle: FhirBundle<TResource>): readonly TResource[] {
  if (bundle.resourceType !== 'Bundle') throw new TypeError('fhir_bundle_required')
  return Object.freeze((bundle.entry ?? []).flatMap(entry => entry.resource ? [entry.resource] : []))
}

export function findBundleResources<TResource extends FhirResource = FhirResource>(
  bundle: FhirBundle,
  resourceType: string,
): readonly TResource[] {
  return Object.freeze(readBundleResources(bundle).filter(resource => resource.resourceType === resourceType) as TResource[])
}

/** Traverses top-level and native contained resources without changing ownership. */
export function walkBundleResources(bundle: FhirBundle): readonly FhirResource[] {
  const output: FhirResource[] = []
  const visit = (resource: FhirResource): void => {
    output.push(resource)
    for (const child of resource.contained ?? []) visit(child)
  }
  for (const resource of readBundleResources(bundle)) visit(resource)
  return Object.freeze(output)
}

/** Classifies top-level Bundle resources in encounter order without cloning or mutation. */
export function classifyBundleResources(bundle: FhirBundle): ReadonlyMap<string, readonly FhirResource[]> {
  const classified = new Map<string, FhirResource[]>()
  for (const resource of readBundleResources(bundle)) {
    const resources = classified.get(resource.resourceType) ?? []
    resources.push(resource)
    classified.set(resource.resourceType, resources)
  }
  return classified
}

/** Resolves `ResourceType/id`, `urn:uuid:*`, an entry fullUrl, or a bare resource id. */
export function findBundleResourceByReference(
  bundle: FhirBundle,
  reference: string,
): FhirResource | undefined {
  const target = reference.trim()
  if (!target) throw new TypeError('fhir_reference_required')
  const directEntry = bundle.entry?.find(entry => entry.fullUrl === target)
  if (directEntry?.resource) return directEntry.resource
  const [resourceType, id] = target.includes('/')
    ? target.split('/', 2)
    : [undefined, target.startsWith('urn:uuid:') ? target.slice('urn:uuid:'.length) : target]
  return readBundleResources(bundle).find(resource =>
    resource.id === id && (!resourceType || resource.resourceType === resourceType))
}

export type CommunicationInnerBundleType = 'document' | 'batch' | 'collection'
export type CommunicationBundlePayload = Readonly<{
  communication: FhirResource
  attachment: Readonly<{ contentType: 'application/fhir+json'; data: string; title?: string }>
  bundle: FhirBundle
}>

/**
 * Bundle Reader boundary used by every secure Communication flow.
 *
 * The outer operational payload is always a batch Bundle containing
 * Communication entries. Each Communication carries exactly one FHIR JSON
 * attachment whose decoded resource is an inner document, batch or collection
 * Bundle. Individual clinical resources and arbitrary file MIME types are not
 * accepted directly at this boundary; files belong to DocumentReference
 * entries inside the inner Bundle and must be edited through Bundle Editor.
 */
export function readCommunicationBundlePayloads(input: unknown): readonly CommunicationBundlePayload[] {
  const outerBatch = requireBundle(input)
  if (outerBatch.type !== 'batch') throw new TypeError('fhir_batch_bundle_required')
  validateBatchRequests(outerBatch)
  const payloads = readBundleResources(outerBatch)
    .filter(resource => resource.resourceType === 'Communication')
    .map(communication => {
      const attachment = firstFhirBundleAttachment(communication)
      let decoded: unknown
      try { decoded = JSON.parse(decodeBase64Utf8(attachment.data)) } catch { throw new TypeError('fhir_bundle_attachment_invalid') }
      const bundle = requireBundle(decoded)
      if (!['document', 'batch', 'collection'].includes(String(bundle.type))) throw new TypeError('fhir_inner_bundle_type_invalid')
      validateInnerBundle(bundle)
      return Object.freeze({ communication, attachment, bundle })
    })
  if (!payloads.length) throw new TypeError('fhir_communication_required')
  return Object.freeze(payloads)
}

type BundleAttachment = Readonly<{ contentType: 'application/fhir+json'; data: string; title?: string }>

function requireBundle(value: unknown): FhirBundle {
  if (!value || typeof value !== 'object' || Array.isArray(value) || (value as FhirResource).resourceType !== 'Bundle') throw new TypeError('fhir_bundle_required')
  return value as FhirBundle
}

function firstFhirBundleAttachment(resource: FhirResource): BundleAttachment {
  const payload = Array.isArray(resource.payload) ? resource.payload : []
  if (payload.length !== 1) throw new TypeError('fhir_single_bundle_attachment_required')
  const item = payload[0]
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new TypeError('fhir_bundle_attachment_required')
  const attachment = (item as { contentAttachment?: unknown }).contentAttachment
  if (!attachment || typeof attachment !== 'object' || Array.isArray(attachment)) throw new TypeError('fhir_bundle_attachment_required')
  const candidate = attachment as Record<string, unknown>
  if (candidate.contentType !== 'application/fhir+json' || typeof candidate.data !== 'string' || !candidate.data) {
    throw new TypeError('fhir_bundle_attachment_required')
  }
  return Object.freeze({ contentType: candidate.contentType, data: candidate.data, ...(typeof candidate.title === 'string' ? { title: candidate.title } : {}) })
}

function decodeBase64Utf8(value: string): string {
  const binary = globalThis.atob(value)
  return new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0)))
}

function validateInnerBundle(bundle: FhirBundle): void {
  if (bundle.type === 'document' && readBundleResources(bundle)[0]?.resourceType !== 'Composition') {
    throw new TypeError('fhir_document_composition_first_required')
  }
  if (bundle.type === 'batch') validateBatchRequests(bundle)
}

function validateBatchRequests(bundle: FhirBundle): void {
  for (const entry of bundle.entry ?? []) {
    if (!entry.request?.method || !entry.request.url) throw new TypeError('fhir_batch_request_required')
  }
}
