import type { FhirContactPoint } from './fhir-types.js'

/** Builds the FHIR token wire form after rejecting empty or ambiguous input. */
export function makeFhirToken(system: string, code: string): string {
  const normalizedSystem = required(system, 'fhir_token_system_required')
  const normalizedCode = required(code, 'fhir_token_code_required')
  if (normalizedSystem.includes('|') || normalizedCode.includes('|')) throw new TypeError('fhir_token_invalid')
  return `${normalizedSystem}|${normalizedCode}`
}

/** Escapes FHIR search delimiters according to the search value grammar. */
export function escapeFhirSearchValue(value: string): string {
  return String(value).replace(/[\\,|$]/g, '\\$&')
}

/** Builds one comma-separated FHIR OR value; repeated query keys remain AND. */
export function joinFhirOrList(values?: readonly (string | number)[]): string | undefined {
  return values?.length ? values.map(value => escapeFhirSearchValue(String(value))).join(',') : undefined
}

/** Converts valid ContactPoint values to token search values. */
export function telecomToTokens(resource: Readonly<{ telecom?: readonly FhirContactPoint[] }>): readonly string[] {
  return Object.freeze((resource.telecom ?? []).flatMap(point =>
    point.system && point.value?.trim() ? [makeFhirToken(point.system, point.value.trim())] : []))
}

function required(value: string, error: string): string {
  const normalized = value.trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}
