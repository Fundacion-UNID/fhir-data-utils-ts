import { CommunicationClaim } from './claims/communication-claims.js'
import { FhirCodeSystems } from './constants/fhir-code-systems.js'
import { ResourceTypesFhirR5 } from './constants/fhir-resource-types.js'
import type { FhirResource } from './fhir-types.js'

/** FHIR R5 version implemented by this native subscription boundary. */
export const SubscriptionR5Version = '5.0.0' as const

export const SubscriptionR5ChannelType = Object.freeze({ RestHook: 'rest-hook' } as const)
export const SubscriptionR5Content = Object.freeze({
  Empty: 'empty',
  IdOnly: 'id-only',
  FullResource: 'full-resource',
} as const)
export const SubscriptionR5Status = Object.freeze({
  Requested: 'requested',
  Active: 'active',
  Error: 'error',
  Off: 'off',
  EnteredInError: 'entered-in-error',
} as const)
export const SubscriptionTopicR5Status = Object.freeze({
  Draft: 'draft',
  Active: 'active',
  Retired: 'retired',
  Unknown: 'unknown',
} as const)
export const SubscriptionR5NotificationType = Object.freeze({
  Handshake: 'handshake',
  Heartbeat: 'heartbeat',
  EventNotification: 'event-notification',
  QueryStatus: 'query-status',
} as const)
export const SubscriptionR5BundleType = Object.freeze({ Notification: 'subscription-notification' } as const)
export const SubscriptionR5MediaType = 'application/fhir+json' as const
export const FhirFlatClaimContext = Object.freeze({ Api: 'org.hl7.fhir.api' } as const)
export const CommunicationStatus = Object.freeze({ Completed: 'completed' } as const)
export const CommunicationCategoryCode = Object.freeze({ Notification: 'notification' } as const)
export const TaskStatusCode = Object.freeze({ Completed: 'completed', Failed: 'failed' } as const)

type SearchParameterType = 'date' | 'reference' | 'string' | 'token' | 'uri'
export type R5SearchParameterDefinition = Readonly<{
  code: string
  type: SearchParameterType
  expression: string
}>

const searchParameter = (
  code: string,
  type: SearchParameterType,
  expression: string,
): R5SearchParameterDefinition => Object.freeze({ code, type, expression })

/** Exact Subscription-specific SearchParameters published by FHIR R5 5.0.0. */
export const SubscriptionR5SearchParameterCatalog: readonly R5SearchParameterDefinition[] = Object.freeze([
  searchParameter('contact', 'token', 'Subscription.contact'),
  searchParameter('content-level', 'token', 'Subscription.content'),
  searchParameter('filter-value', 'string', 'Subscription.filterBy.value'),
  searchParameter('identifier', 'token', 'Subscription.identifier'),
  searchParameter('name', 'string', 'Subscription.name'),
  searchParameter('owner', 'reference', 'Subscription.managingEntity'),
  searchParameter('payload', 'token', 'Subscription.contentType'),
  searchParameter('status', 'token', 'Subscription.status'),
  searchParameter('topic', 'uri', 'Subscription.topic'),
  searchParameter('type', 'token', 'Subscription.channelType'),
  searchParameter('url', 'uri', 'Subscription.endpoint'),
])

/** Exact SubscriptionTopic-specific SearchParameters published by FHIR R5 5.0.0. */
export const SubscriptionTopicR5SearchParameterCatalog: readonly R5SearchParameterDefinition[] = Object.freeze([
  searchParameter('date', 'date', 'SubscriptionTopic.date'),
  searchParameter('derived-or-self', 'uri', 'SubscriptionTopic.url | SubscriptionTopic.derivedFrom'),
  searchParameter('effective', 'date', 'SubscriptionTopic.effectivePeriod'),
  searchParameter('event', 'token', 'SubscriptionTopic.eventTrigger.event'),
  searchParameter('identifier', 'token', 'SubscriptionTopic.identifier'),
  searchParameter('resource', 'uri', 'SubscriptionTopic.resourceTrigger.resource | SubscriptionTopic.eventTrigger.resource | SubscriptionTopic.canFilterBy.resource | SubscriptionTopic.notificationShape.resource'),
  searchParameter('status', 'token', 'SubscriptionTopic.status'),
  searchParameter('title', 'string', 'SubscriptionTopic.title'),
  searchParameter('trigger-description', 'string', 'SubscriptionTopic.resourceTrigger.description'),
  searchParameter('url', 'uri', 'SubscriptionTopic.url'),
  searchParameter('version', 'token', 'SubscriptionTopic.version'),
])

export type SubscriptionR5Filter = Readonly<{
  resourceType?: string
  filterParameter: string
  comparator?: 'eq' | 'ne'
  modifier?: string
  value: string
}>

export type SubscriptionR5Parameter = Readonly<{ name: string; value: string }>

export type SubscriptionR5 = Readonly<{
  resourceType: 'Subscription'
  id: string
  status: (typeof SubscriptionR5Status)[keyof typeof SubscriptionR5Status]
  topic: string
  reason?: string
  filterBy?: readonly SubscriptionR5Filter[]
  channelType: Readonly<{ system: string; code: 'rest-hook' }>
  endpoint: string
  parameter?: readonly SubscriptionR5Parameter[]
  contentType: typeof SubscriptionR5MediaType
  content: (typeof SubscriptionR5Content)[keyof typeof SubscriptionR5Content]
}>

export type SubscriptionTopicR5 = Readonly<{
  resourceType: 'SubscriptionTopic'
  id: string
  url: string
  status: (typeof SubscriptionTopicR5Status)[keyof typeof SubscriptionTopicR5Status]
  resourceTrigger: readonly Readonly<{ resource: string }>[]
  canFilterBy: readonly Readonly<{
    resource: string
    filterParameter: string
    comparator: readonly ('eq' | 'ne')[]
  }>[]
}>

/** Builds the native R5 topic used to notify subscribers about Communication writes. */
export function buildCommunicationSubscriptionTopicR5(input: Readonly<{
  id: string
  url: string
}>): SubscriptionTopicR5 {
  return Object.freeze({
    resourceType: ResourceTypesFhirR5.SubscriptionTopic,
    id: required(input.id, 'subscription_topic_id_required'),
    url: absoluteHttpsUrl(input.url, 'subscription_topic_url_invalid'),
    status: SubscriptionTopicR5Status.Active,
    resourceTrigger: Object.freeze([{ resource: ResourceTypesFhirR5.Communication }]),
    canFilterBy: Object.freeze([
      Object.freeze({ resource: ResourceTypesFhirR5.Communication, filterParameter: 'identifier', comparator: Object.freeze(['eq', 'ne'] as const) }),
      Object.freeze({ resource: ResourceTypesFhirR5.Communication, filterParameter: 'recipient', comparator: Object.freeze(['eq', 'ne'] as const) }),
      Object.freeze({ resource: ResourceTypesFhirR5.Communication, filterParameter: 'status', comparator: Object.freeze(['eq', 'ne'] as const) }),
    ]),
  })
}

/** Builds one native R5 rest-hook Subscription. This resource is configuration, not flat clinical state. */
export function buildRestHookSubscriptionR5(input: Readonly<{
  id: string
  topic: string
  endpoint: string
  filters?: readonly SubscriptionR5Filter[]
  parameters?: readonly SubscriptionR5Parameter[]
  content?: SubscriptionR5['content']
  reason?: string
}>): SubscriptionR5 {
  const filters = Object.freeze((input.filters ?? []).map(filter => Object.freeze({
    ...(filter.resourceType ? { resourceType: required(filter.resourceType, 'subscription_filter_resource_required') } : {}),
    filterParameter: required(filter.filterParameter, 'subscription_filter_parameter_required'),
    ...(filter.comparator ? { comparator: filter.comparator } : {}),
    ...(filter.modifier ? { modifier: filter.modifier } : {}),
    value: required(filter.value, 'subscription_filter_value_required'),
  })))
  const parameters = Object.freeze((input.parameters ?? []).map(parameter => Object.freeze({
    name: required(parameter.name, 'subscription_parameter_name_required'),
    value: required(parameter.value, 'subscription_parameter_value_required'),
  })))
  return Object.freeze({
    resourceType: ResourceTypesFhirR5.Subscription,
    id: required(input.id, 'subscription_id_required'),
    status: SubscriptionR5Status.Requested,
    topic: absoluteHttpsUrl(input.topic, 'subscription_topic_url_invalid'),
    ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
    ...(filters.length ? { filterBy: filters } : {}),
    channelType: Object.freeze({
      system: FhirCodeSystems.SubscriptionChannelType,
      code: SubscriptionR5ChannelType.RestHook,
    }),
    endpoint: absoluteHttpsUrl(input.endpoint, 'subscription_endpoint_invalid'),
    ...(parameters.length ? { parameter: parameters } : {}),
    contentType: SubscriptionR5MediaType,
    content: input.content ?? SubscriptionR5Content.FullResource,
  })
}

export type TerminalJobStatusCode = (typeof TaskStatusCode)[keyof typeof TaskStatusCode]

/**
 * Builds the canonical claims-first Communication emitted when an asynchronous
 * Task reaches a terminal state. `Communication.status=completed` describes
 * the sent message; `Communication.content-code` carries the linked Task state.
 */
export function buildTerminalJobCommunication(input: Readonly<{
  id: string
  threadId: string
  jobId: string
  jobStatus: TerminalJobStatusCode
  recipient: string
  sender: string
  researchStudyReference: string
  sent: string
}>): FhirResource & Readonly<{ resourceType: 'Communication'; id: string; meta: Readonly<{ claims: Readonly<Record<string, string>> }> }> {
  if (!Object.values(TaskStatusCode).includes(input.jobStatus)) throw new TypeError('terminal_job_status_invalid')
  const sent = required(input.sent, 'terminal_job_sent_required')
  if (Number.isNaN(Date.parse(sent))) throw new TypeError('terminal_job_sent_invalid')
  return Object.freeze({
    resourceType: ResourceTypesFhirR5.Communication,
    id: required(input.id, 'terminal_job_communication_id_required'),
    meta: Object.freeze({ claims: Object.freeze({
      '@context': FhirFlatClaimContext.Api,
      [CommunicationClaim.Identifier]: required(input.threadId, 'terminal_job_thread_required'),
      [CommunicationClaim.Status]: CommunicationStatus.Completed,
      [CommunicationClaim.Category]: `${FhirCodeSystems.CommunicationCategory}|${CommunicationCategoryCode.Notification}`,
      [CommunicationClaim.Recipient]: required(input.recipient, 'terminal_job_recipient_required'),
      [CommunicationClaim.Sender]: required(input.sender, 'terminal_job_sender_required'),
      [CommunicationClaim.Sent]: sent,
      [CommunicationClaim.Subject]: required(input.researchStudyReference, 'terminal_job_study_required'),
      [CommunicationClaim.ContentReference]: `${ResourceTypesFhirR5.Task}/${required(input.jobId, 'terminal_job_id_required')}`,
      [CommunicationClaim.ContentCode]: `${FhirCodeSystems.TaskStatus}|${input.jobStatus}`,
    }) }),
  })
}

export type ParsedSubscriptionNotificationEventR5 = Readonly<{
  eventNumber: string
  timestamp?: string
  focusReference: string
  focusResource: FhirResource
}>

export type ParsedSubscriptionNotificationR5 = Readonly<{
  type: (typeof SubscriptionR5NotificationType)[keyof typeof SubscriptionR5NotificationType]
  subscriptionReference: string
  topic?: string
  events: readonly ParsedSubscriptionNotificationEventR5[]
}>

/** Validates a standard R5 notification Bundle and resolves every advertised full-resource focus. */
export function parseSubscriptionNotificationR5(input: unknown): ParsedSubscriptionNotificationR5 {
  const bundle = record(input)
  if (bundle.resourceType !== ResourceTypesFhirR5.Bundle || bundle.type !== SubscriptionR5BundleType.Notification) {
    throw new TypeError('subscription_notification_bundle_invalid')
  }
  const entries = Array.isArray(bundle.entry) ? bundle.entry : []
  if (entries.length < 1 || entries.length > 101) throw new TypeError('subscription_notification_entries_invalid')
  const resources = entries.map(entry => record(record(entry).resource)).filter(resource => resource.resourceType)
  const status = resources.find(resource => resource.resourceType === ResourceTypesFhirR5.SubscriptionStatus)
  if (!status) throw new TypeError('subscription_notification_status_missing')
  const notificationType = required(String(status.type ?? ''), 'subscription_notification_type_missing')
  if (!Object.values(SubscriptionR5NotificationType).includes(notificationType as never)) {
    throw new TypeError('subscription_notification_type_invalid')
  }
  const subscriptionReference = required(String(record(status.subscription).reference ?? ''), 'subscription_notification_subscription_missing')
  const rawEvents = Array.isArray(status.notificationEvent) ? status.notificationEvent : []
  if (notificationType === SubscriptionR5NotificationType.EventNotification && rawEvents.length < 1) {
    throw new TypeError('subscription_notification_event_missing')
  }
  const events = rawEvents.map(rawEvent => {
    const event = record(rawEvent)
    const focusReference = required(String(record(event.focus).reference ?? ''), 'subscription_notification_focus_missing')
    const focusResource = resources.find(resource => `${resource.resourceType}/${resource.id ?? ''}` === focusReference)
    if (!focusResource) throw new TypeError('subscription_notification_focus_missing')
    return Object.freeze({
      eventNumber: required(String(event.eventNumber ?? ''), 'subscription_notification_event_number_missing'),
      ...(event.timestamp ? { timestamp: String(event.timestamp) } : {}),
      focusReference,
      focusResource: focusResource as FhirResource,
    })
  })
  return Object.freeze({
    type: notificationType as ParsedSubscriptionNotificationR5['type'],
    subscriptionReference,
    ...(status.topic ? { topic: String(status.topic) } : {}),
    events: Object.freeze(events),
  })
}

function absoluteHttpsUrl(value: string, error: string): string {
  const text = required(value, error)
  let url: URL
  try { url = new URL(text) } catch { throw new TypeError(error) }
  if (url.protocol !== 'https:') throw new TypeError(error)
  return url.href
}

function required(value: string, error: string): string {
  const text = String(value ?? '').trim()
  if (!text) throw new TypeError(error)
  return text
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
