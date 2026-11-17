/** Basic R4 document inspection, not full schema validation or identity/signature evidence. */
export type R4DocumentBundleStructureResult = Readonly<{
  ok: boolean
  issues: readonly string[]
}>

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function entriesOf(bundle: unknown): readonly unknown[] {
  return isRecord(bundle) && Array.isArray(bundle.entry) ? bundle.entry : []
}

function resourceOf(entry: unknown): Record<string, unknown> | undefined {
  return isRecord(entry) && isRecord(entry.resource) ? entry.resource : undefined
}

/** Checks only Bundle/document, nonempty entries and the first Composition, collecting every issue. */
export function validateR4DocumentBundleStructure(bundle: unknown): R4DocumentBundleStructureResult {
  const issues: string[] = []
  if (!isRecord(bundle) || bundle.resourceType !== 'Bundle') issues.push('Bundle.resourceType must be Bundle.')
  if (!isRecord(bundle) || bundle.type !== 'document') issues.push('Bundle.type must be document.')
  const entries = entriesOf(bundle)
  if (entries.length === 0) issues.push('Bundle.entry must contain at least one entry.')
  if (resourceOf(entries[0])?.resourceType !== 'Composition') issues.push('Bundle.entry[0].resource must be Composition.')
  return Object.freeze({ok: issues.length === 0, issues: Object.freeze(issues)})
}

function aliasesOf(entry: unknown): readonly string[] {
  const resource = resourceOf(entry)
  const resourceType = text(resource?.resourceType), id = text(resource?.id)
  const fullUrl = isRecord(entry) ? text(entry.fullUrl) : ''
  return [...new Set([fullUrl, resourceType && id ? `${resourceType}/${id}` : '', id,
    fullUrl ? fullUrl.split('/').slice(-2).join('/') : ''].filter(Boolean))]
}

/**
 * Resolves a Patient display name from a native R4 document. Composition.subject
 * matches an entry fullUrl, Resource/id or bare id, including the final reference
 * path segments. Compatibility behavior falls back to the first Patient if no
 * matching Patient exists. This fallback is not evidence of subject identity.
 * Official, then usual, then first HumanName wins; text precedes ordered parts.
 * Call structural validation separately; neither helper verifies a signature or
 * validates the complete FHIR schema. The input is never changed.
 */
export function getR4DocumentBundlePatientFullName(bundle: unknown): string | undefined {
  const entries = entriesOf(bundle), composition = resourceOf(entries[0])
  const subject = isRecord(composition?.subject) ? composition.subject : undefined
  const reference = text(subject?.reference)
  const referenceAliases = [reference, reference.split('/').slice(-2).join('/'), reference.split('/').pop()]
  const patients = entries.filter(entry => resourceOf(entry)?.resourceType === 'Patient')
  const patientEntry = patients.find(entry => !reference || aliasesOf(entry).some(alias => referenceAliases.includes(alias))) ?? patients[0]
  const patient = resourceOf(patientEntry)
  const names = Array.isArray(patient?.name) ? patient.name.filter(isRecord) : []
  const name = names.find(item => item.use === 'official') ?? names.find(item => item.use === 'usual') ?? names[0]
  if (!name) return undefined
  const display = text(name.text)
  if (display) return display
  const parts = [
    ...(Array.isArray(name.prefix) ? name.prefix : []),
    ...(Array.isArray(name.given) ? name.given : []),
    name.family,
    ...(Array.isArray(name.suffix) ? name.suffix : []),
  ].map(text).filter(Boolean)
  return parts.length ? parts.join(' ') : undefined
}
