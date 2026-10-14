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
