import { CommunicationRequestClaim } from '../claims/communication-request-claims.js'
import type { FhirResource, FlatClaims } from './convert-shared.js'
import { codingFromValue, codingListFromCsv, codingListToCsv, codingToValue, referenceListToCsv, referenceToValue } from './convert-shared.js'

/** Projects one governed communication request to the FHIR R4 wire shape. */
export function communicationRequestFlatToFhirR4(claims: FlatClaims): FhirResource {
  return {
    resourceType: 'CommunicationRequest', identifier: claims[CommunicationRequestClaim.Identifier] ? [{ value: claims[CommunicationRequestClaim.Identifier] }] : undefined,
    basedOn: referenceCsv(claims[CommunicationRequestClaim.BasedOn]),
    replaces: referenceCsv(claims[CommunicationRequestClaim.Replaces]),
    groupIdentifier: claims[CommunicationRequestClaim.GroupIdentifier] ? { value: claims[CommunicationRequestClaim.GroupIdentifier] } : undefined,
    status: claims[CommunicationRequestClaim.Status],
    statusReason: codeableConcept(claims[CommunicationRequestClaim.StatusReason]),
    priority: claims[CommunicationRequestClaim.Priority],
    category: claims[CommunicationRequestClaim.Category] ? [{ coding: codingFromValue(claims[CommunicationRequestClaim.Category]) }] : undefined,
    doNotPerform: optionalBoolean(claims[CommunicationRequestClaim.DoNotPerform]),
    medium: claims[CommunicationRequestClaim.Medium] ? [{ coding: codingFromValue(claims[CommunicationRequestClaim.Medium]) }] : undefined,
    subject: claims[CommunicationRequestClaim.Subject] ? { reference: claims[CommunicationRequestClaim.Subject] } : undefined,
    about: referenceCsv(claims[CommunicationRequestClaim.About]), encounter: claims[CommunicationRequestClaim.Encounter] ? { reference: claims[CommunicationRequestClaim.Encounter] } : undefined,
    requester: claims[CommunicationRequestClaim.Requester] ? { reference: claims[CommunicationRequestClaim.Requester] } : undefined,
    sender: firstReference(claims[CommunicationRequestClaim.InformationProvider]),
    recipient: referenceCsv(claims[CommunicationRequestClaim.Recipient]), authoredOn: claims[CommunicationRequestClaim.AuthoredOn],
    ...occurrenceToFhir(claims),
    reasonCode: claims[CommunicationRequestClaim.ReasonCode] ? [{ coding: codingListFromCsv(claims[CommunicationRequestClaim.ReasonCode]) }] : undefined,
    reasonReference: referenceCsv(claims[CommunicationRequestClaim.ReasonReference]),
    payload: payloadR4(claims),
    note: annotation(claims[CommunicationRequestClaim.Note]),
  }
}

/** Reads a FHIR R4 CommunicationRequest into canonical flat claims. */
export function communicationRequestFhirR4ToFlat(resource: FhirResource): FlatClaims {
  return compact({
    [CommunicationRequestClaim.Identifier]: (resource.identifier as Array<{ value?: string }> | undefined)?.[0]?.value,
    [CommunicationRequestClaim.BasedOn]: referenceListToCsv(resource.basedOn as Array<{ reference?: string }> | undefined),
    [CommunicationRequestClaim.Replaces]: referenceListToCsv(resource.replaces as Array<{ reference?: string }> | undefined),
    [CommunicationRequestClaim.GroupIdentifier]: (resource.groupIdentifier as { value?: string } | undefined)?.value,
    [CommunicationRequestClaim.Status]: resource.status as string | undefined,
    [CommunicationRequestClaim.StatusReason]: codeableConceptToValue(resource.statusReason),
    [CommunicationRequestClaim.Priority]: resource.priority as string | undefined,
    [CommunicationRequestClaim.Category]: codingToValue((resource.category as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [CommunicationRequestClaim.DoNotPerform]: typeof resource.doNotPerform === 'boolean' ? String(resource.doNotPerform) : undefined,
    [CommunicationRequestClaim.Medium]: codingToValue((resource.medium as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [CommunicationRequestClaim.Subject]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [CommunicationRequestClaim.About]: referenceListToCsv(resource.about as Array<{ reference?: string }> | undefined),
    [CommunicationRequestClaim.Encounter]: referenceToValue(resource.encounter as { reference?: string } | undefined),
    [CommunicationRequestClaim.Requester]: referenceToValue(resource.requester as { reference?: string } | undefined),
    [CommunicationRequestClaim.InformationProvider]: referenceToValue(resource.sender as { reference?: string } | undefined),
    [CommunicationRequestClaim.Recipient]: referenceListToCsv(resource.recipient as Array<{ reference?: string }> | undefined),
    [CommunicationRequestClaim.AuthoredOn]: resource.authoredOn as string | undefined,
    ...occurrenceToFlat(resource),
    [CommunicationRequestClaim.ReasonCode]: codingListToCsv((resource.reasonCode as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.flatMap(value => value.coding ?? [])),
    [CommunicationRequestClaim.ReasonReference]: referenceListToCsv(resource.reasonReference as Array<{ reference?: string }> | undefined),
    ...payloadToFlat(resource),
    [CommunicationRequestClaim.Note]: annotationText(resource.note),
  })
}

/** Projects canonical claims to the published FHIR R5 shape. */
export function communicationRequestFlatToFhirR5(claims: FlatClaims): FhirResource {
  return communicationRequestFlatToFhirR5Resource(claims)
}

/** Reads a published FHIR R5 CommunicationRequest into canonical flat claims. */
export function communicationRequestFhirR5ToFlat(resource: FhirResource): FlatClaims {
  return communicationRequestFhirR5ResourceToFlat(resource)
}

function communicationRequestFlatToFhirR5Resource(claims: FlatClaims): FhirResource {
  const intent = claims[CommunicationRequestClaim.Intent]
  if (!intent) throw new TypeError('communication_request_intent_required')
  return {
    resourceType: 'CommunicationRequest',
    identifier: claims[CommunicationRequestClaim.Identifier] ? [{ value: claims[CommunicationRequestClaim.Identifier] }] : undefined,
    basedOn: referenceCsv(claims[CommunicationRequestClaim.BasedOn]),
    replaces: referenceCsv(claims[CommunicationRequestClaim.Replaces]),
    groupIdentifier: claims[CommunicationRequestClaim.GroupIdentifier] ? { value: claims[CommunicationRequestClaim.GroupIdentifier] } : undefined,
    status: claims[CommunicationRequestClaim.Status],
    statusReason: codeableConcept(claims[CommunicationRequestClaim.StatusReason]),
    intent,
    priority: claims[CommunicationRequestClaim.Priority],
    category: claims[CommunicationRequestClaim.Category] ? [{ coding: codingFromValue(claims[CommunicationRequestClaim.Category]) }] : undefined,
    doNotPerform: optionalBoolean(claims[CommunicationRequestClaim.DoNotPerform]),
    medium: claims[CommunicationRequestClaim.Medium] ? [{ coding: codingFromValue(claims[CommunicationRequestClaim.Medium]) }] : undefined,
    subject: claims[CommunicationRequestClaim.Subject] ? { reference: claims[CommunicationRequestClaim.Subject] } : undefined,
    about: referenceCsv(claims[CommunicationRequestClaim.About]),
    encounter: claims[CommunicationRequestClaim.Encounter] ? { reference: claims[CommunicationRequestClaim.Encounter] } : undefined,
    requester: claims[CommunicationRequestClaim.Requester] ? { reference: claims[CommunicationRequestClaim.Requester] } : undefined,
    recipient: referenceCsv(claims[CommunicationRequestClaim.Recipient]),
    informationProvider: referenceCsv(claims[CommunicationRequestClaim.InformationProvider]),
    authoredOn: claims[CommunicationRequestClaim.AuthoredOn], ...occurrenceToFhir(claims),
    reason: reasonsR5(claims), payload: payloadR5(claims), note: annotation(claims[CommunicationRequestClaim.Note]),
  }
}

function communicationRequestFhirR5ResourceToFlat(resource: FhirResource): FlatClaims {
  const reasons = resource.reason as Array<{ concept?: { coding?: Array<{ system?: string; code?: string }> }; reference?: { reference?: string } }> | undefined
  return compact({
    [CommunicationRequestClaim.Identifier]: (resource.identifier as Array<{ value?: string }> | undefined)?.[0]?.value,
    [CommunicationRequestClaim.BasedOn]: referenceListToCsv(resource.basedOn as Array<{ reference?: string }> | undefined),
    [CommunicationRequestClaim.Replaces]: referenceListToCsv(resource.replaces as Array<{ reference?: string }> | undefined),
    [CommunicationRequestClaim.GroupIdentifier]: (resource.groupIdentifier as { value?: string } | undefined)?.value,
    [CommunicationRequestClaim.Status]: resource.status as string | undefined,
    [CommunicationRequestClaim.StatusReason]: codeableConceptToValue(resource.statusReason),
    [CommunicationRequestClaim.Intent]: resource.intent as string | undefined,
    [CommunicationRequestClaim.Priority]: resource.priority as string | undefined,
    [CommunicationRequestClaim.Category]: codingToValue((resource.category as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [CommunicationRequestClaim.DoNotPerform]: typeof resource.doNotPerform === 'boolean' ? String(resource.doNotPerform) : undefined,
    [CommunicationRequestClaim.Medium]: codingToValue((resource.medium as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [CommunicationRequestClaim.Subject]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [CommunicationRequestClaim.About]: referenceListToCsv(resource.about as Array<{ reference?: string }> | undefined),
    [CommunicationRequestClaim.Encounter]: referenceToValue(resource.encounter as { reference?: string } | undefined),
    [CommunicationRequestClaim.Requester]: referenceToValue(resource.requester as { reference?: string } | undefined),
    [CommunicationRequestClaim.Recipient]: referenceListToCsv(resource.recipient as Array<{ reference?: string }> | undefined),
    [CommunicationRequestClaim.InformationProvider]: referenceListToCsv(resource.informationProvider as Array<{ reference?: string }> | undefined),
    [CommunicationRequestClaim.AuthoredOn]: resource.authoredOn as string | undefined,
    ...occurrenceToFlat(resource),
    [CommunicationRequestClaim.ReasonCode]: codingListToCsv(reasons?.flatMap(value => value.concept?.coding ?? [])),
    [CommunicationRequestClaim.ReasonReference]: reasons?.map(value => value.reference?.reference).filter((value): value is string => Boolean(value)).join(',') || undefined,
    ...payloadToFlat(resource), [CommunicationRequestClaim.Note]: annotationText(resource.note),
  })
}

function referenceCsv(value?: string): Array<{ reference: string }> | undefined {
  const references = value?.split(',').map(reference => reference.trim()).filter(Boolean) ?? []
  return references.length ? references.map(reference => ({ reference })) : undefined
}

function firstReference(value?: string): { reference: string } | undefined { return referenceCsv(value)?.[0] }
function codeableConcept(value?: string): { coding: Array<{ system?: string; code: string }> } | undefined {
  const coding = codingFromValue(value)
  return coding ? { coding } : undefined
}
function codeableConceptToValue(value: unknown): string | undefined {
  return codingToValue((value as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.[0])
}
function optionalBoolean(value?: string): boolean | undefined {
  if (value === undefined) return undefined
  if (value !== 'true' && value !== 'false') throw new TypeError('communication_request_boolean_invalid')
  return value === 'true'
}
function annotation(value?: string): Array<{ text: string }> | undefined { return value ? [{ text: value }] : undefined }
function annotationText(value: unknown): string | undefined { return (value as Array<{ text?: string }> | undefined)?.[0]?.text }
function occurrenceToFhir(claims: FlatClaims): Record<string, unknown> {
  const occurrenceDateTime = claims[CommunicationRequestClaim.Occurrence]
  const start = claims[CommunicationRequestClaim.OccurrencePeriodStart]
  const end = claims[CommunicationRequestClaim.OccurrencePeriodEnd]
  if (occurrenceDateTime && (start || end)) throw new TypeError('communication_request_occurrence_choice_invalid')
  return occurrenceDateTime ? { occurrenceDateTime } : start || end ? { occurrencePeriod: compact({ start, end }) } : {}
}
function occurrenceToFlat(resource: FhirResource): FlatClaims {
  const period = resource.occurrencePeriod as { start?: string; end?: string } | undefined
  if (resource.occurrenceDateTime && period) throw new TypeError('communication_request_occurrence_choice_invalid')
  return compact({
    [CommunicationRequestClaim.Occurrence]: resource.occurrenceDateTime as string | undefined,
    [CommunicationRequestClaim.OccurrencePeriodStart]: period?.start,
    [CommunicationRequestClaim.OccurrencePeriodEnd]: period?.end,
  })
}
function payloadR4(claims: FlatClaims): Array<Record<string, unknown>> | undefined {
  if (claims[CommunicationRequestClaim.PayloadReference]) return [{ contentReference: { reference: claims[CommunicationRequestClaim.PayloadReference] } }]
  if (claims[CommunicationRequestClaim.PayloadAttachmentData]) return [{ contentAttachment: attachment(claims) }]
  return claims[CommunicationRequestClaim.PayloadContent] ? [{ contentString: claims[CommunicationRequestClaim.PayloadContent] }] : undefined
}
function payloadR5(claims: FlatClaims): Array<Record<string, unknown>> | undefined {
  if (claims[CommunicationRequestClaim.PayloadReference]) return [{ contentReference: { reference: claims[CommunicationRequestClaim.PayloadReference] } }]
  if (claims[CommunicationRequestClaim.PayloadAttachmentData]) return [{ contentAttachment: attachment(claims) }]
  if (claims[CommunicationRequestClaim.PayloadContent]) throw new TypeError('communication_request_string_payload_not_supported_in_r5')
  return undefined
}
function attachment(claims: FlatClaims): Record<string, string | undefined> {
  const contentType = claims[CommunicationRequestClaim.PayloadAttachmentContentType]
  if (!contentType) throw new TypeError('communication_request_attachment_content_type_required')
  return { contentType, data: claims[CommunicationRequestClaim.PayloadAttachmentData], title: claims[CommunicationRequestClaim.PayloadAttachmentTitle] }
}
function payloadToFlat(resource: FhirResource): FlatClaims {
  const payload = (resource.payload as Array<{ contentString?: string; contentReference?: { reference?: string }; contentAttachment?: { contentType?: string; data?: string; title?: string } }> | undefined)?.[0]
  return compact({
    [CommunicationRequestClaim.PayloadContent]: payload?.contentString,
    [CommunicationRequestClaim.PayloadReference]: payload?.contentReference?.reference,
    [CommunicationRequestClaim.PayloadAttachmentContentType]: payload?.contentAttachment?.contentType,
    [CommunicationRequestClaim.PayloadAttachmentData]: payload?.contentAttachment?.data,
    [CommunicationRequestClaim.PayloadAttachmentTitle]: payload?.contentAttachment?.title,
  })
}
function reasonsR5(claims: FlatClaims): Array<Record<string, unknown>> | undefined {
  const result: Array<Record<string, unknown>> = []
  for (const coding of codingListFromCsv(claims[CommunicationRequestClaim.ReasonCode]) ?? []) result.push({ concept: { coding: [coding] } })
  for (const item of referenceCsv(claims[CommunicationRequestClaim.ReasonReference]) ?? []) result.push({ reference: item })
  return result.length ? result : undefined
}
function compact(value: FlatClaims): FlatClaims { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) }
