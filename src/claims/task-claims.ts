// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.
// File: src/models/interoperable-claims/task-claims.ts

/**
 * Canonical claims keys for Task (FHIR-oriented claims-first payloads).
 * These keys are the source of truth for GW/SDK Task claim mapping.
 */
export enum TaskClaimsFhirApi {
  Id = 'Task.id',
  Identifier = 'Task.identifier',
  GroupIdentifier = 'Task.group-identifier',
  Status = 'Task.status',
  StatusReason = 'Task.status-reason',
  BusinessStatus = 'Task.business-status',
  Intent = 'Task.intent',
  Code = 'Task.code',
  Description = 'Task.description',
  Subject = 'Task.subject',
  For = 'Task.for',
  Requester = 'Task.requester',
  Owner = 'Task.owner',
  Focus = 'Task.focus',
  PartOf = 'Task.part-of',
  BasedOn = 'Task.based-on',
  BasedOnDisplay = 'Task.based-on-display',
  Language = 'Task.language',
  /** @deprecated Non-standard compatibility claim. Model delivery policy outside FHIR. */
  Channel = 'Task.channel',
  AuthoredOn = 'Task.authored-on',
  LastModified = 'Task.last-modified',
  ScheduledAt = 'Task.scheduled-at',
  RetryIntervalMinutes = 'Task.retry-interval-minutes',
  MaxAttempts = 'Task.max-attempts',
  TriggerType = 'Task.trigger-type',
  Attempt = 'Task.attempt',
  WindowStart = 'Task.window-start',
  WindowEnd = 'Task.window-end',
  AutoCloseAt = 'Task.auto-close-at',
  EscalationRecipient = 'Task.escalation-recipient',
  Confirmed = 'Task.confirmed',
  ConfirmedAt = 'Task.confirmed-at',
  Repetitions = 'Task.repetitions',
  DaysOfWeek = 'Task.days-of-week',
  RepeatCount = 'Task.repeat-count',
  RepeatDurationValue = 'Task.repeat-duration-value',
  RepeatDurationUnit = 'Task.repeat-duration-unit',
  Modified = 'Task.modified',
  Priority = 'Task.priority',
  RestrictionPeriodStart = 'Task.restriction-period-start',
  RestrictionPeriodEnd = 'Task.restriction-period-end',
  ExecutionPeriodStart = 'Task.execution-period-start',
  ExecutionPeriodEnd = 'Task.execution-period-end',
  OutputType = 'Task.output-type',
  OutputValueReference = 'Task.output-value-reference',
  OutputValueString = 'Task.output-value-string',
  UserSelected = 'Task.user-selected',
}

/** Complete product-neutral Task authoring contract shared by all sectors. */
export const TaskArtifactSchema = Object.freeze({
  resourceType: 'Task' as const,
  requiredClaims: Object.freeze([TaskClaimsFhirApi.Status, TaskClaimsFhirApi.Intent]),
  optionalClaims: Object.freeze(Object.values(TaskClaimsFhirApi).filter(claim =>
    claim !== TaskClaimsFhirApi.Status && claim !== TaskClaimsFhirApi.Intent)),
})

/** Common singular catalog name used consistently with the other resources. */
export const TaskClaim = TaskClaimsFhirApi
