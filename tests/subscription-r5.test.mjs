// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const EXAMPLE = Object.freeze({
  topicId: 'research-job-terminal',
  topicUrl: 'https://profiles.example.test/SubscriptionTopic/research-job-terminal',
  subscriptionId: 'research-job-terminal-bff',
  endpoint: 'https://professional.example.test/api/fhir/subscriptions',
  secretName: 'x-fhir-subscription-secret',
  secretValue: 'test-secret-value',
  communicationId: 'communication-job-1',
  threadId: 'research-import-thread-1',
  jobId: 'job-1',
  recipient: 'did:web:example.test:employee:researcher-1',
  sender: 'did:web:example.test:service:dataconv',
  study: 'ResearchStudy/study-1',
  sent: '2026-09-23T18:00:00.000Z',
  jobStatus: 'completed',
})

test('R5 Subscription and SubscriptionTopic expose the official resource-specific SearchParameters', () => {
  assert.equal(fhir.ResourceTypesFhirR5.Subscription, 'Subscription')
  assert.equal(fhir.ResourceTypesFhirR5.SubscriptionTopic, 'SubscriptionTopic')
  assert.equal(fhir.ResourceTypesFhirR5.SubscriptionStatus, 'SubscriptionStatus')

  assert.deepEqual(
    fhir.SubscriptionR5SearchParameterCatalog.map(({ code, type, expression }) => ({ code, type, expression })),
    [
      { code: 'contact', type: 'token', expression: 'Subscription.contact' },
      { code: 'content-level', type: 'token', expression: 'Subscription.content' },
      { code: 'filter-value', type: 'string', expression: 'Subscription.filterBy.value' },
      { code: 'identifier', type: 'token', expression: 'Subscription.identifier' },
      { code: 'name', type: 'string', expression: 'Subscription.name' },
      { code: 'owner', type: 'reference', expression: 'Subscription.managingEntity' },
      { code: 'payload', type: 'token', expression: 'Subscription.contentType' },
      { code: 'status', type: 'token', expression: 'Subscription.status' },
      { code: 'topic', type: 'uri', expression: 'Subscription.topic' },
      { code: 'type', type: 'token', expression: 'Subscription.channelType' },
      { code: 'url', type: 'uri', expression: 'Subscription.endpoint' },
    ],
  )
  assert.ok(fhir.SubscriptionTopicR5SearchParameterCatalog.some(parameter => (
    parameter.code === 'resource'
      && parameter.type === 'uri'
      && parameter.expression.includes('SubscriptionTopic.resourceTrigger.resource')
  )))
})

test('builders create native R5 subscription configuration without inventing flat claims', () => {
  const topic = fhir.buildCommunicationSubscriptionTopicR5({
    id: EXAMPLE.topicId,
    url: EXAMPLE.topicUrl,
  })
  const subscription = fhir.buildRestHookSubscriptionR5({
    id: EXAMPLE.subscriptionId,
    topic: topic.url,
    endpoint: EXAMPLE.endpoint,
    parameters: [{ name: EXAMPLE.secretName, value: EXAMPLE.secretValue }],
    content: fhir.SubscriptionR5Content.FullResource,
  })

  assert.equal(topic.resourceType, fhir.ResourceTypesFhirR5.SubscriptionTopic)
  assert.deepEqual(topic.resourceTrigger, [{ resource: fhir.ResourceTypesFhirR5.Communication }])
  assert.equal(subscription.channelType.code, fhir.SubscriptionR5ChannelType.RestHook)
  assert.equal(subscription.content, fhir.SubscriptionR5Content.FullResource)
  assert.deepEqual(subscription.parameter, [{ name: EXAMPLE.secretName, value: EXAMPLE.secretValue }])
  assert.equal(topic.meta, undefined)
  assert.equal(subscription.meta, undefined)
})

test('terminal job Communication keeps correlation and routing in canonical flat claims', () => {
  const communication = fhir.buildTerminalJobCommunication({
    id: EXAMPLE.communicationId,
    threadId: EXAMPLE.threadId,
    jobId: EXAMPLE.jobId,
    recipient: EXAMPLE.recipient,
    sender: EXAMPLE.sender,
    researchStudyReference: EXAMPLE.study,
    sent: EXAMPLE.sent,
    jobStatus: EXAMPLE.jobStatus,
  })

  assert.deepEqual(communication, {
    resourceType: fhir.ResourceTypesFhirR5.Communication,
    id: EXAMPLE.communicationId,
    meta: { claims: {
      '@context': fhir.FhirFlatClaimContext.Api,
      [fhir.CommunicationClaim.Identifier]: EXAMPLE.threadId,
      [fhir.CommunicationClaim.Status]: fhir.CommunicationStatus.Completed,
      [fhir.CommunicationClaim.Category]: `${fhir.FhirCodeSystems.CommunicationCategory}|${fhir.CommunicationCategoryCode.Notification}`,
      [fhir.CommunicationClaim.Recipient]: EXAMPLE.recipient,
      [fhir.CommunicationClaim.Sender]: EXAMPLE.sender,
      [fhir.CommunicationClaim.Sent]: EXAMPLE.sent,
      [fhir.CommunicationClaim.Subject]: EXAMPLE.study,
      [fhir.CommunicationClaim.ContentReference]: `${fhir.ResourceTypesFhirR5.Task}/${EXAMPLE.jobId}`,
      [fhir.CommunicationClaim.ContentCode]: `${fhir.FhirCodeSystems.TaskStatus}|${fhir.TaskStatusCode.Completed}`,
    } },
  })
  assert.equal(communication.status, undefined)
  assert.equal(communication.recipient, undefined)
})

test('subscription-notification parser handles handshake and resolves a full-resource event focus', () => {
  const communication = fhir.buildTerminalJobCommunication({
    id: EXAMPLE.communicationId,
    threadId: EXAMPLE.threadId,
    jobId: EXAMPLE.jobId,
    recipient: EXAMPLE.recipient,
    sender: EXAMPLE.sender,
    researchStudyReference: EXAMPLE.study,
    sent: EXAMPLE.sent,
    jobStatus: EXAMPLE.jobStatus,
  })
  const handshake = fhir.parseSubscriptionNotificationR5({
    resourceType: fhir.ResourceTypesFhirR5.Bundle,
    type: fhir.SubscriptionR5BundleType.Notification,
    entry: [{ resource: {
      resourceType: fhir.ResourceTypesFhirR5.SubscriptionStatus,
      status: fhir.SubscriptionR5Status.Active,
      type: fhir.SubscriptionR5NotificationType.Handshake,
      subscription: { reference: `Subscription/${EXAMPLE.subscriptionId}` },
      topic: EXAMPLE.topicUrl,
    } }],
  })
  assert.equal(handshake.type, fhir.SubscriptionR5NotificationType.Handshake)
  assert.deepEqual(handshake.events, [])

  const event = fhir.parseSubscriptionNotificationR5({
    resourceType: fhir.ResourceTypesFhirR5.Bundle,
    type: fhir.SubscriptionR5BundleType.Notification,
    entry: [
      { resource: {
        resourceType: fhir.ResourceTypesFhirR5.SubscriptionStatus,
        status: fhir.SubscriptionR5Status.Active,
        type: fhir.SubscriptionR5NotificationType.EventNotification,
        subscription: { reference: `Subscription/${EXAMPLE.subscriptionId}` },
        topic: EXAMPLE.topicUrl,
        notificationEvent: [{
          eventNumber: '1',
          timestamp: EXAMPLE.sent,
          focus: { reference: `${fhir.ResourceTypesFhirR5.Communication}/${EXAMPLE.communicationId}` },
        }],
      } },
      { resource: communication },
    ],
  })
  assert.equal(event.events.length, 1)
  assert.equal(event.events[0].focusReference, `${fhir.ResourceTypesFhirR5.Communication}/${EXAMPLE.communicationId}`)
  assert.deepEqual(event.events[0].focusResource, communication)
})

test('subscription-notification parser rejects non-notification and unresolved full-resource bundles', () => {
  assert.throws(
    () => fhir.parseSubscriptionNotificationR5({ resourceType: 'Bundle', type: 'searchset', entry: [] }),
    /subscription_notification_bundle_invalid/,
  )
  assert.throws(
    () => fhir.parseSubscriptionNotificationR5({
      resourceType: 'Bundle',
      type: fhir.SubscriptionR5BundleType.Notification,
      entry: [{ resource: {
        resourceType: fhir.ResourceTypesFhirR5.SubscriptionStatus,
        status: fhir.SubscriptionR5Status.Active,
        type: fhir.SubscriptionR5NotificationType.EventNotification,
        subscription: { reference: `Subscription/${EXAMPLE.subscriptionId}` },
        notificationEvent: [{ eventNumber: '1', focus: { reference: 'Communication/missing' } }],
      } }],
    }),
    /subscription_notification_focus_missing/,
  )
})

test('event notification builder preserves counters and resolves its full-resource focus by fullUrl', () => {
  const communication = fhir.buildTerminalJobCommunication({
    id: EXAMPLE.communicationId, threadId: EXAMPLE.threadId, jobId: EXAMPLE.jobId,
    recipient: EXAMPLE.recipient, sender: EXAMPLE.sender,
    researchStudyReference: EXAMPLE.study, sent: EXAMPLE.sent, jobStatus: EXAMPLE.jobStatus,
  })
  const focusUrl = new URL(`/Communication/${EXAMPLE.communicationId}`, EXAMPLE.topicUrl).href
  const statusUrl = new URL(`/SubscriptionStatus/${EXAMPLE.subscriptionId}`, EXAMPLE.topicUrl).href
  const bundle = fhir.buildSubscriptionNotificationR5({
    subscriptionReference: `Subscription/${EXAMPLE.subscriptionId}`, topic: EXAMPLE.topicUrl,
    eventNumber: 1, eventsSinceSubscriptionStart: 1, timestamp: EXAMPLE.sent,
    statusFullUrl: statusUrl, focusReference: focusUrl, focusResource: communication,
    focusFullUrl: focusUrl, additionalContextReferences: [EXAMPLE.study],
  })
  assert.equal(bundle.type, fhir.SubscriptionR5BundleType.Notification)
  assert.equal(bundle.timestamp, EXAMPLE.sent)
  assert.ok(bundle.entry.every(entry => new URL(entry.fullUrl).href === entry.fullUrl))
  const status = bundle.entry[0].resource
  assert.equal(status.status, fhir.SubscriptionR5Status.Active)
  assert.equal(status.eventsSinceSubscriptionStart, '1')
  assert.deepEqual(status.notificationEvent, [{
    eventNumber: '1', timestamp: EXAMPLE.sent, focus: { reference: focusUrl },
    additionalContext: [{ reference: EXAMPLE.study }],
  }])
  const parsed = fhir.parseSubscriptionNotificationR5(bundle)
  assert.equal(parsed.subscriptionReference, `Subscription/${EXAMPLE.subscriptionId}`)
  assert.equal(parsed.events[0].eventNumber, '1')
  assert.deepEqual(parsed.events[0].focusResource, communication)
})

test('event matching accepts the canonical R5 resource URI and requires every applicable filter', () => {
  const resource = { resourceType: fhir.ResourceTypesFhirR5.Communication, id: EXAMPLE.communicationId,
    status: fhir.CommunicationStatus.Completed, subject: { reference: EXAMPLE.study } }
  const topic = { status: fhir.SubscriptionTopicR5Status.Active, url: EXAMPLE.topicUrl,
    resourceTrigger: [{ resource: 'http://hl7.org/fhir/StructureDefinition/Communication' }],
    canFilterBy: [
      { resource: 'http://hl7.org/fhir/StructureDefinition/Communication', filterParameter: 'status', comparator: ['eq', 'ne'] },
      { resource: fhir.ResourceTypesFhirR5.Communication, filterParameter: 'subject', comparator: ['eq', 'ne'] },
    ] }
  const subscription = { status: fhir.SubscriptionR5Status.Active, topic: EXAMPLE.topicUrl,
    filterBy: [
      { resourceType: fhir.ResourceTypesFhirR5.Communication, filterParameter: 'status', comparator: 'eq', value: resource.status },
      { filterParameter: 'subject', value: EXAMPLE.study },
    ] }
  const snapshot = structuredClone({ resource, topic, subscription })
  assert.equal(fhir.matchesSubscriptionEventR5(subscription, topic, resource), true)
  assert.equal(fhir.matchesSubscriptionEventR5({ ...subscription, filterBy: [
    subscription.filterBy[0], { filterParameter: 'subject', value: `${EXAMPLE.study}-other` },
  ] }, topic, resource), false)
  assert.deepEqual({ resource, topic, subscription }, snapshot)
})

test('event matching preserves exact references and rejects unsupported filters and stale subscriptions', () => {
  const resource = { resourceType: fhir.ResourceTypesFhirR5.Communication, id: EXAMPLE.communicationId,
    status: fhir.CommunicationStatus.Completed, subject: { reference: EXAMPLE.study },
    category: [{ coding: [{ code: fhir.CommunicationCategoryCode.Notification }] }] }
  const topic = { status: fhir.SubscriptionTopicR5Status.Active, url: EXAMPLE.topicUrl,
    resourceTrigger: [{ resource: resource.resourceType }],
    canFilterBy: [
      { resource: resource.resourceType, filterParameter: 'status', comparator: ['eq', 'ne'] },
      { resource: resource.resourceType, filterParameter: 'patient', comparator: ['eq', 'ne'] },
      { resource: resource.resourceType, filterParameter: 'category.coding.code', comparator: ['eq'] },
    ] }
  const base = { status: fhir.SubscriptionR5Status.Active, topic: topic.url }
  const withFilter = filter => ({ ...base, filterBy: [filter] })
  assert.equal(fhir.matchesSubscriptionEventR5(withFilter({ filterParameter: 'patient', value: EXAMPLE.study }), topic, resource), true)
  assert.equal(fhir.matchesSubscriptionEventR5(withFilter({ filterParameter: 'patient', value: EXAMPLE.study.slice(0, -1) }), topic, resource), false)
  assert.equal(fhir.matchesSubscriptionEventR5(withFilter({ filterParameter: 'status', comparator: 'ne', value: 'entered-in-error' }), topic, resource), true)
  assert.equal(fhir.matchesSubscriptionEventR5(withFilter({ filterParameter: 'category.coding.code', comparator: 'eq', value: fhir.CommunicationCategoryCode.Notification }), topic, resource), true)
  for (const filter of [
    { filterParameter: 'missing', value: resource.status },
    { filterParameter: 'status', comparator: 'gt', value: resource.status },
    { filterParameter: 'status', comparator: 'eq', modifier: 'exact', value: resource.status },
    { filterParameter: 'status', modifier: 'exact', value: resource.status },
  ]) assert.equal(fhir.matchesSubscriptionEventR5(withFilter(filter), topic, resource), false)
  assert.equal(fhir.matchesSubscriptionEventR5({ ...base, status: fhir.SubscriptionR5Status.Off }, topic, resource), false)
  assert.equal(fhir.matchesSubscriptionEventR5(base, { ...topic, status: fhir.SubscriptionTopicR5Status.Retired }, resource), false)
  assert.equal(fhir.matchesSubscriptionEventR5({ ...base, topic: `${topic.url}-other` }, topic, resource), false)
  assert.equal(fhir.matchesSubscriptionEventR5(withFilter({ filterParameter: 'status', comparator: 'eq', value: resource.status }), {
    ...topic, canFilterBy: [{ resourceType: resource.resourceType, filterParameter: 'status', comparator: ['eq'] }],
  }, resource), false)
  assert.equal(fhir.matchesSubscriptionEventR5(base, { ...topic, resourceTrigger: [null] }, resource), false)
})

test('notification builder rejects ambiguous references, invalid identifiers and counters without changing its input', () => {
  const base = { subscriptionReference: `Subscription/${EXAMPLE.subscriptionId}`, topic: EXAMPLE.topicUrl,
    eventNumber: 1, eventsSinceSubscriptionStart: 1, timestamp: EXAMPLE.sent,
    statusFullUrl: new URL(`/SubscriptionStatus/${EXAMPLE.subscriptionId}`, EXAMPLE.topicUrl).href,
    focusReference: `${fhir.ResourceTypesFhirR5.Communication}/${EXAMPLE.communicationId}` }
  const snapshot = structuredClone(base)
  for (const override of [
    { statusFullUrl: '' }, { statusFullUrl: 'urn:uuid:subscription-status' },
    { statusFullUrl: 'URN:UUID:subscription-status' }, { statusFullUrl: `${base.statusFullUrl}/_history/1` },
    { eventNumber: -1 }, { eventNumber: Number.MAX_SAFE_INTEGER + 1 },
    { eventsSinceSubscriptionStart: '9223372036854775808' }, { timestamp: 'not-an-instant' },
    { focusFullUrl: EXAMPLE.topicUrl },
  ]) assert.throws(() => fhir.buildSubscriptionNotificationR5({ ...base, ...override }))
  const large = fhir.buildSubscriptionNotificationR5({ ...base, eventsSinceSubscriptionStart: '9223372036854775807' })
  assert.equal(large.entry[0].resource.eventsSinceSubscriptionStart, '9223372036854775807')
  assert.deepEqual(base, snapshot)
})

test('full-resource notifications reject ambiguous focus identities and do not share mutable source data', () => {
  const resource = { resourceType: fhir.ResourceTypesFhirR5.Communication, id: EXAMPLE.communicationId,
    meta: { claims: { [fhir.CommunicationClaim.Identifier]: EXAMPLE.threadId } } }
  const statusUrl = new URL(`/SubscriptionStatus/${EXAMPLE.subscriptionId}`, EXAMPLE.topicUrl).href
  const focusUrl = new URL(`/Communication/${EXAMPLE.communicationId}`, EXAMPLE.topicUrl).href
  const input = { subscriptionReference: `Subscription/${EXAMPLE.subscriptionId}`, timestamp: EXAMPLE.sent,
    eventNumber: 1, eventsSinceSubscriptionStart: 1, statusFullUrl: statusUrl,
    focusReference: focusUrl, focusResource: resource, focusFullUrl: focusUrl }
  assert.throws(() => fhir.buildSubscriptionNotificationR5({ ...input, focusFullUrl: statusUrl }), /focus_binding/)
  assert.throws(() => fhir.buildSubscriptionNotificationR5({ ...input, focusReference: `${focusUrl}-other` }), /focus_binding/)
  const bundle = fhir.buildSubscriptionNotificationR5(input)
  const duplicated = structuredClone(bundle)
  duplicated.entry.push(structuredClone(duplicated.entry[1]))
  assert.throws(() => fhir.parseSubscriptionNotificationR5(duplicated), /focus_missing/)
  bundle.entry[1].resource.meta.claims[fhir.CommunicationClaim.Identifier] = `${EXAMPLE.threadId}-changed`
  assert.equal(resource.meta.claims[fhir.CommunicationClaim.Identifier], EXAMPLE.threadId)
})
