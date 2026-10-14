import type { FhirCodeableConcept, FhirContactPoint, FhirReference } from './fhir-types.js'
import { joinFhirOrList, makeFhirToken, telecomToTokens } from './fhir-tokens.js'

export type FhirHumanName = Readonly<{
  use?: string
  text?: string
  family?: string
  given?: readonly string[]
}>

export type FhirRelatedPerson = Readonly<{
  resourceType: 'RelatedPerson'
  patient?: FhirReference
  name?: readonly FhirHumanName[]
  relationship?: readonly FhirCodeableConcept[]
  telecom?: readonly FhirContactPoint[]
}>

/** Projects a RelatedPerson to standard search values without reading server-private metadata. */
export function relatedPersonToSearchValues(resource: FhirRelatedPerson): Readonly<Record<string, string | undefined>> {
  const name = resource.name?.find(value => value.use === 'nickname') ?? resource.name?.[0]
  const displayName = name?.text?.trim() || [...(name?.given ?? []), name?.family].filter(Boolean).join(' ') || undefined
  const relationships = resource.relationship?.flatMap(concept => concept.coding ?? []).flatMap(coding =>
    coding.system && coding.code ? [makeFhirToken(coding.system, coding.code)] : []) ?? []
  return Object.freeze({
    subject: resource.patient?.reference,
    name: displayName,
    'name-use': name?.use ? makeFhirToken('http://hl7.org/fhir/name-use', name.use) : undefined,
    relationship: joinFhirOrList(relationships),
    telecom: joinFhirOrList(telecomToTokens(resource)),
  })
}
