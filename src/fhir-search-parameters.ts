export type FhirSearchParameterType = 'number' | 'date' | 'string' | 'token' | 'reference' | 'composite' | 'quantity' | 'uri'
export type FhirSearchPrefix = 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | 'sa' | 'eb' | 'ap'

export type FhirSearchParameter = Readonly<{
  name: string
  type: FhirSearchParameterType
  value: string | number
  prefix?: FhirSearchPrefix
  system?: string
  unit?: string
}>

const PREFIX = /^(eq|ne|gt|lt|ge|le|sa|eb|ap)/

/** Parses one typed FHIR query value without lossy integer coercion. */
export function parseFhirSearchParameter(input: Readonly<{
  name: string
  type: FhirSearchParameterType
  value: string
}>): FhirSearchParameter {
  const name = required(input.name, 'fhir_search_name_required')
  const raw = required(input.value, 'fhir_search_value_required')
  if (input.type === 'token') {
    const separator = raw.lastIndexOf('|')
    return Object.freeze({ name, type: input.type, value: separator < 0 ? raw : raw.slice(separator + 1), ...(separator < 0 ? {} : { system: raw.slice(0, separator) }) })
  }
  if (input.type === 'quantity') {
    const match = raw.match(PREFIX)
    const withoutPrefix = match ? raw.slice(2) : raw
    const [numberValue, system, unit] = withoutPrefix.split('|')
    const value = Number(numberValue)
    if (!Number.isFinite(value)) throw new TypeError('fhir_search_quantity_invalid')
    return Object.freeze({ name, type: input.type, value, ...(match ? { prefix: match[1] as FhirSearchPrefix } : {}), ...(system ? { system } : {}), ...(unit ? { unit } : {}) })
  }
  if (input.type === 'number') {
    const match = raw.match(PREFIX)
    const value = Number(match ? raw.slice(2) : raw)
    if (!Number.isFinite(value)) throw new TypeError('fhir_search_number_invalid')
    return Object.freeze({ name, type: input.type, value, ...(match ? { prefix: match[1] as FhirSearchPrefix } : {}) })
  }
  if (input.type === 'date') {
    const match = raw.match(PREFIX)
    return Object.freeze({ name, type: input.type, value: match ? raw.slice(2) : raw, ...(match ? { prefix: match[1] as FhirSearchPrefix } : {}) })
  }
  return Object.freeze({ name, type: input.type, value: raw })
}

/** Repeats parameters for AND; callers may use comma-separated values for FHIR OR. */
export function buildFhirSearchQuery(parameters: readonly FhirSearchParameter[]): string {
  const query = new URLSearchParams()
  for (const parameter of parameters) {
    const prefix = parameter.prefix ?? ''
    const scalar = String(parameter.value)
    const value = parameter.type === 'token' && parameter.system
      ? `${parameter.system}|${scalar}`
      : parameter.type === 'quantity' && (parameter.system || parameter.unit)
        ? `${prefix}${scalar}|${parameter.system ?? ''}|${parameter.unit ?? ''}`
        : `${prefix}${scalar}`
    query.append(required(parameter.name, 'fhir_search_name_required'), value)
  }
  return query.toString()
}

function required(value: string, error: string): string {
  const normalized = value.trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}
