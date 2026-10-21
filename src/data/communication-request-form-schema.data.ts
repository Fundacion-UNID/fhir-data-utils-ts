// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

import { CommunicationRequestClaim } from '../claims/communication-request-claims.js'
import type { FlatClaims } from '../converters/convert-shared.js'

export const CommunicationRequestStatuses = Object.freeze([
  'draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown',
] as const)
export const CommunicationRequestIntents = Object.freeze([
  'proposal', 'plan', 'directive', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option',
] as const)
export const CommunicationRequestPriorities = Object.freeze(['routine', 'urgent', 'asap', 'stat'] as const)

export type CommunicationRequestFormData = Readonly<{
  identifier?: string
  status: typeof CommunicationRequestStatuses[number]
  intent: typeof CommunicationRequestIntents[number]
  priority?: typeof CommunicationRequestPriorities[number]
  category?: string
  subject: string
  about?: readonly string[]
  encounter?: string
  requester: string
  recipients: readonly string[]
  informationProviders?: readonly string[]
  authoredOn?: string
  occurrence?: string
  occurrencePeriodStart?: string
  occurrencePeriodEnd?: string
  payloadReference?: string
  payloadAttachmentContentType?: string
  payloadAttachmentData?: string
  payloadAttachmentTitle?: string
  note?: string
}>

/** Data-only JSON Schema. Portals own localized labels, widgets and authorization. */
export const FHIR_COMMUNICATION_REQUEST_FORM_SCHEMA = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://globaldatacare.com/schemas/fhir/communication-request-form.json',
  title: 'CommunicationRequest',
  type: 'object',
  additionalProperties: false,
  required: Object.freeze(['status', 'intent', 'subject', 'requester', 'recipients']),
  properties: Object.freeze({
    identifier: Object.freeze({ type: 'string', minLength: 1 }),
    status: Object.freeze({ type: 'string', enum: CommunicationRequestStatuses }),
    intent: Object.freeze({ type: 'string', enum: CommunicationRequestIntents }),
    priority: Object.freeze({ type: 'string', enum: CommunicationRequestPriorities }),
    category: codingSchema(),
    subject: referenceSchema(),
    about: Object.freeze({ type: 'array', uniqueItems: true, items: referenceSchema() }),
    encounter: referenceSchema(), requester: referenceSchema(),
    recipients: Object.freeze({ type: 'array', minItems: 1, uniqueItems: true, items: referenceSchema() }),
    informationProviders: Object.freeze({ type: 'array', uniqueItems: true, items: referenceSchema() }),
    authoredOn: dateTimeSchema(), occurrence: dateTimeSchema(),
    occurrencePeriodStart: dateTimeSchema(), occurrencePeriodEnd: dateTimeSchema(), payloadReference: referenceSchema(),
    payloadAttachmentContentType: Object.freeze({ type: 'string', minLength: 1 }),
    payloadAttachmentData: Object.freeze({ type: 'string', minLength: 1, contentEncoding: 'base64' }),
    payloadAttachmentTitle: Object.freeze({ type: 'string', minLength: 1 }),
    note: Object.freeze({ type: 'string' }),
  }),
})

export function communicationRequestFormDataToFlatClaims(input: CommunicationRequestFormData): FlatClaims {
  requiredEnum(input.status, CommunicationRequestStatuses, 'communication_request_status_invalid')
  requiredEnum(input.intent, CommunicationRequestIntents, 'communication_request_intent_invalid')
  if (input.priority) requiredEnum(input.priority, CommunicationRequestPriorities, 'communication_request_priority_invalid')
  const recipients = references(input.recipients, 'communication_request_recipient_required')
  const providers = input.informationProviders?.length
    ? references(input.informationProviders, 'communication_request_information_provider_invalid') : undefined
  const about = input.about?.length ? references(input.about, 'communication_request_about_invalid') : undefined
  if (input.payloadAttachmentData && !input.payloadAttachmentContentType) {
    throw new TypeError('communication_request_attachment_content_type_required')
  }
  const occurrence = dateTime(input.occurrence)
  const occurrencePeriodStart = dateTime(input.occurrencePeriodStart)
  const occurrencePeriodEnd = dateTime(input.occurrencePeriodEnd)
  if (occurrence && (occurrencePeriodStart || occurrencePeriodEnd)) throw new TypeError('communication_request_occurrence_choice_invalid')
  if (occurrencePeriodStart && occurrencePeriodEnd && Date.parse(occurrencePeriodEnd) <= Date.parse(occurrencePeriodStart)) {
    throw new TypeError('communication_request_occurrence_period_invalid')
  }
  return compact({
    [CommunicationRequestClaim.Identifier]: optional(input.identifier),
    [CommunicationRequestClaim.Status]: input.status,
    [CommunicationRequestClaim.Intent]: input.intent,
    [CommunicationRequestClaim.Priority]: optional(input.priority),
    [CommunicationRequestClaim.Category]: coding(input.category),
    [CommunicationRequestClaim.Subject]: reference(input.subject, 'communication_request_subject_invalid'),
    [CommunicationRequestClaim.About]: about?.join(','),
    [CommunicationRequestClaim.Encounter]: input.encounter ? reference(input.encounter, 'communication_request_encounter_invalid') : undefined,
    [CommunicationRequestClaim.Requester]: reference(input.requester, 'communication_request_requester_invalid'),
    [CommunicationRequestClaim.Recipient]: recipients.join(','),
    [CommunicationRequestClaim.InformationProvider]: providers?.join(','),
    [CommunicationRequestClaim.AuthoredOn]: dateTime(input.authoredOn),
    [CommunicationRequestClaim.Occurrence]: occurrence,
    [CommunicationRequestClaim.OccurrencePeriodStart]: occurrencePeriodStart,
    [CommunicationRequestClaim.OccurrencePeriodEnd]: occurrencePeriodEnd,
    [CommunicationRequestClaim.PayloadReference]: input.payloadReference ? reference(input.payloadReference, 'communication_request_payload_reference_invalid') : undefined,
    [CommunicationRequestClaim.PayloadAttachmentContentType]: optional(input.payloadAttachmentContentType),
    [CommunicationRequestClaim.PayloadAttachmentData]: optional(input.payloadAttachmentData),
    [CommunicationRequestClaim.PayloadAttachmentTitle]: optional(input.payloadAttachmentTitle),
    [CommunicationRequestClaim.Note]: optional(input.note),
  })
}

export function communicationRequestFlatClaimsToFormData(claims: FlatClaims): CommunicationRequestFormData {
  return compact({
    identifier: claims[CommunicationRequestClaim.Identifier], status: claims[CommunicationRequestClaim.Status],
    intent: claims[CommunicationRequestClaim.Intent], priority: claims[CommunicationRequestClaim.Priority],
    category: claims[CommunicationRequestClaim.Category],
    subject: claims[CommunicationRequestClaim.Subject], about: splitOptional(claims[CommunicationRequestClaim.About]),
    encounter: claims[CommunicationRequestClaim.Encounter],
    requester: claims[CommunicationRequestClaim.Requester], recipients: split(claims[CommunicationRequestClaim.Recipient]),
    informationProviders: splitOptional(claims[CommunicationRequestClaim.InformationProvider]),
    authoredOn: claims[CommunicationRequestClaim.AuthoredOn], occurrence: claims[CommunicationRequestClaim.Occurrence],
    occurrencePeriodStart: claims[CommunicationRequestClaim.OccurrencePeriodStart],
    occurrencePeriodEnd: claims[CommunicationRequestClaim.OccurrencePeriodEnd],
    payloadReference: claims[CommunicationRequestClaim.PayloadReference],
    payloadAttachmentContentType: claims[CommunicationRequestClaim.PayloadAttachmentContentType],
    payloadAttachmentData: claims[CommunicationRequestClaim.PayloadAttachmentData],
    payloadAttachmentTitle: claims[CommunicationRequestClaim.PayloadAttachmentTitle], note: claims[CommunicationRequestClaim.Note],
  }) as unknown as CommunicationRequestFormData
}

function referenceSchema() { return Object.freeze({ type: 'string', pattern: '^[A-Za-z][A-Za-z0-9]+/[A-Za-z0-9.-]{1,64}$' }) }
function codingSchema() { return Object.freeze({ type: 'string', pattern: '^https?://[^|,]+\\|[^|,]+$' }) }
function dateTimeSchema() { return Object.freeze({ type: 'string', format: 'date-time' }) }
function optional(value: unknown): string | undefined { const text = String(value ?? '').trim(); return text || undefined }
function dateTime(value: unknown): string | undefined { const text = optional(value); if (text && Number.isNaN(Date.parse(text))) throw new TypeError('communication_request_datetime_invalid'); return text }
function reference(value: unknown, error: string): string { const text = optional(value); if (!text || !/^[A-Za-z][A-Za-z0-9]+\/[A-Za-z0-9.-]{1,64}$/u.test(text)) throw new TypeError(error); return text }
function coding(value: unknown): string | undefined { const text = optional(value); if (text && !/^https?:\/\/[^|,]+\|[^|,]+$/u.test(text)) throw new TypeError('communication_request_category_invalid'); return text }
function references(values: readonly string[], error: string): string[] { if (!Array.isArray(values) || !values.length) throw new TypeError(error); const result = [...new Set(values.map(value => reference(value, error)))]; if (result.length !== values.length) throw new TypeError(error); return result }
function split(value: string | undefined): readonly string[] { return Object.freeze(String(value || '').split(',').map(item => item.trim()).filter(Boolean)) }
function splitOptional(value: string | undefined): readonly string[] | undefined { const values = split(value); return values.length ? values : undefined }
function requiredEnum<T extends string>(value: unknown, allowed: readonly T[], error: string): asserts value is T { if (!allowed.includes(value as T)) throw new TypeError(error) }
function compact<T extends Record<string, unknown>>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T }
