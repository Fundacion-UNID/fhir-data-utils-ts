import { ServiceRequestClaim } from '../claims/service-request-claims.js'
import type { FhirResource, FlatClaims } from './convert-shared.js'
import { codingFromValue, codingListFromCsv, codingListToCsv, codingToValue, referenceListToCsv, referenceToValue } from './convert-shared.js'

/** Projects canonical ServiceRequest flat claims to the FHIR R4 wire shape. */
export function serviceRequestFlatToFhirR4(claims: FlatClaims): FhirResource {
  const codeCoding = codingFromValue(claims[ServiceRequestClaim.Code])?.[0]
  return {
    resourceType: 'ServiceRequest',
    identifier: claims[ServiceRequestClaim.Identifier] ? [{ value: claims[ServiceRequestClaim.Identifier] }] : undefined,
    status: claims[ServiceRequestClaim.Status], intent: claims[ServiceRequestClaim.Intent], priority: claims[ServiceRequestClaim.Priority],
    category: claims[ServiceRequestClaim.Category] ? [{ coding: codingFromValue(claims[ServiceRequestClaim.Category]) }] : undefined,
    code: codeCoding || claims[ServiceRequestClaim.CodeText] ? { coding: codeCoding ? [codeCoding] : undefined, text: claims[ServiceRequestClaim.CodeText] } : undefined,
    subject: claims[ServiceRequestClaim.Subject] ? { reference: claims[ServiceRequestClaim.Subject] } : undefined,
    encounter: claims[ServiceRequestClaim.Encounter] ? { reference: claims[ServiceRequestClaim.Encounter] } : undefined,
    requester: claims[ServiceRequestClaim.Requester] ? { reference: claims[ServiceRequestClaim.Requester] } : undefined,
    performer: referenceCsv(claims[ServiceRequestClaim.Performer]), authoredOn: claims[ServiceRequestClaim.AuthoredOn],
    occurrenceDateTime: claims[ServiceRequestClaim.Occurrence],
    reasonCode: claims[ServiceRequestClaim.ReasonCode] ? [{ coding: codingListFromCsv(claims[ServiceRequestClaim.ReasonCode]) }] : undefined,
    reasonReference: referenceCsv(claims[ServiceRequestClaim.ReasonReference]),
    supportingInfo: referenceCsv(claims[ServiceRequestClaim.SupportingInfo]), specimen: referenceCsv(claims[ServiceRequestClaim.Specimen]),
    bodySite: claims[ServiceRequestClaim.BodySite] ? [{ coding: codingListFromCsv(claims[ServiceRequestClaim.BodySite]) }] : undefined,
  }
}

/** Reads a FHIR R4 ServiceRequest into canonical compact-token flat claims. */
export function serviceRequestFhirR4ToFlat(resource: FhirResource): FlatClaims {
  const code = resource.code as { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string } | undefined
  return {
    [ServiceRequestClaim.Identifier]: (resource.identifier as Array<{ value?: string }> | undefined)?.[0]?.value,
    [ServiceRequestClaim.Status]: resource.status as string | undefined, [ServiceRequestClaim.Intent]: resource.intent as string | undefined,
    [ServiceRequestClaim.Priority]: resource.priority as string | undefined,
    [ServiceRequestClaim.Category]: codingToValue((resource.category as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [ServiceRequestClaim.Code]: codingToValue(code?.coding?.[0]), [ServiceRequestClaim.CodeText]: code?.text,
    [ServiceRequestClaim.Subject]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [ServiceRequestClaim.Encounter]: referenceToValue(resource.encounter as { reference?: string } | undefined),
    [ServiceRequestClaim.Requester]: referenceToValue(resource.requester as { reference?: string } | undefined),
    [ServiceRequestClaim.Performer]: referenceListToCsv(resource.performer as Array<{ reference?: string }> | undefined),
    [ServiceRequestClaim.AuthoredOn]: resource.authoredOn as string | undefined, [ServiceRequestClaim.Occurrence]: resource.occurrenceDateTime as string | undefined,
    [ServiceRequestClaim.ReasonCode]: codingListToCsv((resource.reasonCode as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.flatMap(value => value.coding ?? [])),
    [ServiceRequestClaim.ReasonReference]: referenceListToCsv(resource.reasonReference as Array<{ reference?: string }> | undefined),
    [ServiceRequestClaim.SupportingInfo]: referenceListToCsv(resource.supportingInfo as Array<{ reference?: string }> | undefined),
    [ServiceRequestClaim.Specimen]: referenceListToCsv(resource.specimen as Array<{ reference?: string }> | undefined),
    [ServiceRequestClaim.BodySite]: codingListToCsv((resource.bodySite as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.flatMap(value => value.coding ?? [])),
  }
}

function referenceCsv(value?: string): Array<{ reference: string }> | undefined {
  const references = value?.split(',').map(reference => reference.trim()).filter(Boolean) ?? []
  return references.length ? references.map(reference => ({ reference })) : undefined
}
