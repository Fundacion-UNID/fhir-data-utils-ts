export type FlatSearchParameterType = 'token' | 'reference' | 'date' | 'string' | 'number' | 'quantity' | 'uri' | 'composite' | 'special'

export type FlatSearchParameterDefinition = Readonly<{
  claim: `${string}.${string}`
  resourceType: string
  elementPath: string
  type: FlatSearchParameterType
}>

/**
 * Defines one canonical flat claim backed by a standard FHIR SearchParameter.
 * Channels send `claim`; compatibility `resourceType` and `field` coordinates
 * are derived from this governed definition and are never accepted as policy.
 */
export function defineFlatSearchParameter(input: FlatSearchParameterDefinition): FlatSearchParameterDefinition {
  const resourceType = requiredResourceType(input.resourceType)
  const claim = required(input.claim, 'flat_search_parameter_claim_required') as `${string}.${string}`
  const elementPath = required(input.elementPath, 'flat_search_parameter_element_path_required')
  if (!claim.startsWith(`${resourceType}.`) || !elementPath.startsWith(`${resourceType}.`)) {
    throw new TypeError('flat_search_parameter_resource_type_mismatch')
  }
  return Object.freeze({ ...input, claim, resourceType, elementPath })
}

/** Derives compatibility coordinates from governed policy, never from channel input. */
export function legacyFieldCoordinates(definition: FlatSearchParameterDefinition): Readonly<{ resourceType: string; field: string }> {
  const prefix = `${definition.resourceType}.`
  const field = definition.elementPath.slice(prefix.length)
  if (!field) throw new TypeError('flat_search_parameter_element_path_invalid')
  return Object.freeze({ resourceType: definition.resourceType, field })
}

function required(value: string, error: string): string {
  const normalized = value.trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}

function requiredResourceType(value: string): string {
  const normalized = required(value, 'flat_search_parameter_resource_type_required')
  if (!/^[A-Z][A-Za-z0-9]+$/.test(normalized)) throw new TypeError('flat_search_parameter_resource_type_invalid')
  return normalized
}
