/** A canonical flat-claims resource entry; `entryId` is graph identity, never a business identifier. */
export type FlatClaimResourceEntry = Readonly<{
  entryId: string
  reference: string
  resourceType: string
  claims: Readonly<Record<string, string>>
}>

/** Version-neutral source for FHIR `Resource.language` and `DomainResource.text`. */
export type FlatClaimNarrative = Readonly<{
  language: string
  status: 'generated' | 'extensions' | 'additional' | 'empty'
  xhtml: string
}>

const LEGACY_CONTAINMENT_SUFFIXES = Object.freeze(['.is-contained', '.contained-parent-reference'])

/** Builds one independent resource entry whose claims all belong to its resource type. */
export function buildFlatClaimResourceEntry(input: Readonly<{
  entryId: string
  resourceType: string
  claims: Readonly<Record<string, string>>
}>): FlatClaimResourceEntry {
  const entryId = requiredToken(input.entryId, 'flat_claim_entry_id_required')
  const resourceType = requiredResourceType(input.resourceType)
  const prefix = `${resourceType}.`
  const claims: Record<string, string> = {}
  for (const [claim, value] of Object.entries(input.claims)) {
    if (!claim.startsWith(prefix)) throw new TypeError('flat_claim_resource_type_mismatch')
    if (typeof value !== 'string') throw new TypeError('flat_claim_value_must_be_string')
    claims[claim] = value.trim()
  }
  return Object.freeze({ entryId, reference: `${resourceType}/${entryId}`, resourceType, claims: Object.freeze(claims) })
}

/**
 * Links contained or referenced resources from the parent flat entry.
 *
 * The comma-separated `<ParentType>.contained-reference-list` is the only
 * canonical graph edge. A child remains an independent entry and therefore
 * never receives `is-contained` or `contained-parent-reference` claims.
 */
export function linkFlatClaimResourceEntries(
  entries: readonly FlatClaimResourceEntry[],
  link: Readonly<{ parentEntryId: string; childEntryIds: readonly string[] }>,
): readonly FlatClaimResourceEntry[] {
  const byId = new Map(entries.map(entry => [entry.entryId, entry]))
  const parent = byId.get(link.parentEntryId)
  if (!parent) throw new TypeError('flat_claim_entry_not_found')
  const children = link.childEntryIds.map(entryId => {
    const child = byId.get(entryId)
    if (!child) throw new TypeError('flat_claim_entry_not_found')
    if (child.entryId === parent.entryId) throw new TypeError('flat_claim_self_reference')
    return child
  })
  const claimName = `${parent.resourceType}.contained-reference-list`
  const references = uniqueCsv([...splitCsv(parent.claims[claimName]), ...children.map(child => child.reference)])
  return Object.freeze(entries.map(entry => entry.entryId === parent.entryId
    ? buildFlatClaimResourceEntry({
        entryId: entry.entryId,
        resourceType: entry.resourceType,
        claims: { ...entry.claims, [claimName]: references.join(',') },
      })
    : entry))
}

/** Adds language and XHTML narrative source without materializing native FHIR. */
export function withFlatClaimNarrative(entry: FlatClaimResourceEntry, narrative: FlatClaimNarrative): FlatClaimResourceEntry {
  const prefix = entry.resourceType
  return buildFlatClaimResourceEntry({
    entryId: entry.entryId,
    resourceType: entry.resourceType,
    claims: {
      ...entry.claims,
      [`${prefix}.language`]: requiredToken(narrative.language, 'flat_claim_language_required'),
      [`${prefix}.narrative-status`]: narrative.status,
      [`${prefix}.xhtml`]: requiredText(narrative.xhtml, 'flat_claim_xhtml_required'),
    },
  })
}

/** Reads legacy graphs without perpetuating child-owned containment state. */
export function normalizeLegacyContainedClaims(entry: FlatClaimResourceEntry): FlatClaimResourceEntry {
  const claims = Object.fromEntries(Object.entries(entry.claims).filter(([claim]) =>
    !LEGACY_CONTAINMENT_SUFFIXES.some(suffix => claim.endsWith(suffix))))
  return buildFlatClaimResourceEntry({ entryId: entry.entryId, resourceType: entry.resourceType, claims })
}

/**
 * Builds one DocumentReference flat entry for a PDF, JPEG or PNG.
 * Link one or many such entries from any clinical parent with
 * `linkFlatClaimResourceEntries`; attachment bytes are not duplicated.
 */
export function buildDocumentReferenceFlatEntry(input: Readonly<{
  entryId: string
  identifier: string
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png'
  contentHash: string
  title?: string
  url?: string
  dataBase64?: string
}>): FlatClaimResourceEntry {
  const claims: Record<string, string> = {
    [DocumentReferenceClaim.Identifier]: requiredToken(input.identifier, 'document_reference_identifier_required'),
    [DocumentReferenceClaim.ContentType]: input.contentType,
    [DocumentReferenceClaim.ContentHash]: requiredToken(input.contentHash, 'document_reference_contenthash_required'),
  }
  if (input.title?.trim()) claims[DocumentReferenceClaim.Description] = input.title.trim()
  if (input.url?.trim()) claims[DocumentReferenceClaim.Location] = input.url.trim()
  if (input.dataBase64?.trim()) claims[DocumentReferenceClaim.ContentData] = input.dataBase64.trim()
  return buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: 'DocumentReference', claims })
}

function splitCsv(value: string | undefined): string[] {
  return value?.split(',').map(item => item.trim()).filter(Boolean) ?? []
}

function uniqueCsv(values: readonly string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
}

function requiredToken(value: string, error: string): string {
  const normalized = value.trim()
  if (!normalized || normalized.includes(',')) throw new TypeError(error)
  return normalized
}

function requiredText(value: string, error: string): string {
  const normalized = value.trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}

function requiredResourceType(value: string): string {
  const normalized = requiredToken(value, 'flat_claim_resource_type_required')
  if (!/^[A-Z][A-Za-z0-9]+$/.test(normalized)) throw new TypeError('flat_claim_resource_type_invalid')
  return normalized
}
import { DocumentReferenceClaim } from './claims/document-reference-claims.js'
