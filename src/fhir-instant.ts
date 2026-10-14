const FHIR_INSTANT_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/

/**
 * Derives whole Unix epoch seconds from a valid FHIR `instant`.
 *
 * A FHIR instant remains the authoritative ISO 8601 value with a timezone.
 * Epoch seconds are a derived numeric representation and must never replace
 * `Encounter.id`, `Encounter.identifier`, or the original clinical time.
 */
export function fhirInstantToEpochSeconds(instant: string): number {
  if (!FHIR_INSTANT_PATTERN.test(instant)) throw new TypeError('fhir_instant_invalid')
  const epochMilliseconds = Date.parse(instant)
  if (!Number.isFinite(epochMilliseconds)) throw new TypeError('fhir_instant_invalid')
  return Math.floor(epochMilliseconds / 1000)
}
