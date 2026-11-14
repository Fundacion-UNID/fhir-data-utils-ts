const API_NAMESPACE = 'org.hl7.fhir.api.'
const FHIR_NAMESPACE = 'org.hl7.fhir.'
const SHORT_API_CLAIM = /^[A-Z][A-Za-z0-9]+\.[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Return short version-neutral claim syntax, rejecting other vocabularies.
 * This syntax check does not establish catalogue membership, native FHIR
 * validity, search support or authorization. Callers apply those constraints.
 */
export function normalizeFhirApiClaimKey(claimKey: string): string {
  const raw = String(claimKey || '').trim()
  if (raw.startsWith(FHIR_NAMESPACE) && !raw.startsWith(API_NAMESPACE)) {
    throw new Error(`FHIR claims must use org.hl7.fhir.api, not version-specific key: ${raw}`)
  }
  const short = raw.startsWith(API_NAMESPACE) ? raw.slice(API_NAMESPACE.length) : raw
  if (!SHORT_API_CLAIM.test(short)) throw new Error(`Invalid FHIR API claim key: ${raw}`)
  return short
}
