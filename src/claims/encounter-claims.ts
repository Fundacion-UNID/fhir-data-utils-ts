// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.
// File: src/models/interoperable-claims/encounter-claims.ts

import type { ClaimSpec } from './claim-types.js';

export const EncounterClaim = {
  Identifier: 'Encounter.identifier',
  Appointment: 'Encounter.appointment',
  Status: 'Encounter.status',
  Class: 'Encounter.class',
  Type: 'Encounter.type',
  Subject: 'Encounter.subject',
  Patient: 'Encounter.patient',
  Participant: 'Encounter.participant',
  ServiceType: 'Encounter.service-type',
  ServiceProvider: 'Encounter.service-provider',
  PeriodStart: 'Encounter.period-start',
  PeriodEnd: 'Encounter.period-end',
  ActualPeriodStart: 'Encounter.actual-period-start',
  ActualPeriodEnd: 'Encounter.actual-period-end',
  ReasonCode: 'Encounter.reason-code',
  Diagnosis: 'Encounter.diagnosis',
  Location: 'Encounter.location',
  PartOf: 'Encounter.part-of',
} as const;

/** Canonical FHIR R4 Encounter lifecycle codes. */
export enum EncounterStatus {
  Planned = 'planned',
  Arrived = 'arrived',
  Triaged = 'triaged',
  InProgress = 'in-progress',
  OnLeave = 'onleave',
  Finished = 'finished',
  Cancelled = 'cancelled',
  EnteredInError = 'entered-in-error',
  Unknown = 'unknown',
}

/** Canonical FHIR R5 Encounter lifecycle codes. */
export enum EncounterStatusR5 {
  Planned = 'planned',
  InProgress = 'in-progress',
  OnHold = 'on-hold',
  Discharged = 'discharged',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Discontinued = 'discontinued',
  EnteredInError = 'entered-in-error',
  Unknown = 'unknown',
}

export type EncounterClaimKey = typeof EncounterClaim[keyof typeof EncounterClaim];

export const EncounterClaimSpecs: ClaimSpec[] = [
  { key: EncounterClaim.Identifier, meaning: 'Business identifier.', example: 'enc-001' },
  { key: EncounterClaim.Appointment, meaning: 'Originating appointment references (CSV).', example: 'Appointment/appointment-1' },
  { key: EncounterClaim.Status, meaning: 'Encounter status.', example: 'finished' },
  { key: EncounterClaim.Class, meaning: 'Encounter class token.', example: 'http://terminology.hl7.org/CodeSystem/v3-ActCode|AMB' },
  { key: EncounterClaim.Type, meaning: 'Encounter type token.', example: 'http://snomed.info/sct|185349003' },
  { key: EncounterClaim.Subject, meaning: 'Canonical subject reference.', example: 'did:web:patient.example.org' },
  { key: EncounterClaim.Patient, meaning: 'Patient alias reference.', example: 'did:web:patient.example.org' },
  { key: EncounterClaim.Participant, meaning: 'Participant references (CSV).', example: 'Practitioner/prac-1' },
  { key: EncounterClaim.ServiceType, meaning: 'HealthcareService references (CSV in R5).', example: 'HealthcareService/emergency-department-1' },
  { key: EncounterClaim.ServiceProvider, meaning: 'Service provider reference.', example: 'Organization/org-1' },
  { key: EncounterClaim.PeriodStart, meaning: 'Encounter start.', example: '2026-06-01T10:00:00Z' },
  { key: EncounterClaim.PeriodEnd, meaning: 'Encounter end.', example: '2026-06-01T10:30:00Z' },
  { key: EncounterClaim.ActualPeriodStart, meaning: 'R5 actual encounter start.', example: '2026-06-01T10:00:00Z' },
  { key: EncounterClaim.ActualPeriodEnd, meaning: 'R5 actual encounter end.', example: '2026-06-01T10:30:00Z' },
  { key: EncounterClaim.ReasonCode, meaning: 'Reason code token.', example: 'http://snomed.info/sct|65363002' },
  { key: EncounterClaim.Diagnosis, meaning: 'Diagnosis references (CSV).', example: 'Condition/cond-1' },
  { key: EncounterClaim.Location, meaning: 'Location references (CSV).', example: 'Location/loc-1' },
  { key: EncounterClaim.PartOf, meaning: 'Parent Encounter reference.', example: 'Encounter/encounter-1' },
];
