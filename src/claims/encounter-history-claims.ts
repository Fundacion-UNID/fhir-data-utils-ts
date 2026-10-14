// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.

import type { ClaimSpec } from './claim-types.js'

/** Canonical flat claims for the FHIR R5 EncounterHistory resource. */
export const EncounterHistoryClaim = {
  Identifier: 'EncounterHistory.identifier',
  Encounter: 'EncounterHistory.encounter',
  Status: 'EncounterHistory.status',
  Class: 'EncounterHistory.class',
  Type: 'EncounterHistory.type',
  ServiceType: 'EncounterHistory.service-type',
  Subject: 'EncounterHistory.subject',
  SubjectStatus: 'EncounterHistory.subject-status',
  ActualPeriodStart: 'EncounterHistory.actual-period-start',
  ActualPeriodEnd: 'EncounterHistory.actual-period-end',
  PlannedStartDate: 'EncounterHistory.planned-start-date',
  PlannedEndDate: 'EncounterHistory.planned-end-date',
  Location: 'EncounterHistory.location',
  LocationForm: 'EncounterHistory.location-form',
} as const

export type EncounterHistoryClaimKey = typeof EncounterHistoryClaim[keyof typeof EncounterHistoryClaim]

export const EncounterHistoryClaimSpecs: ClaimSpec[] = [
  { key: EncounterHistoryClaim.Identifier, meaning: 'Business identifier.', example: 'urn:uuid:encounter-history-1' },
  { key: EncounterHistoryClaim.Encounter, meaning: 'Encounter whose milestone is recorded.', example: 'Encounter/encounter-1' },
  { key: EncounterHistoryClaim.Status, meaning: 'FHIR R5 Encounter status at this milestone.', example: 'on-hold' },
  { key: EncounterHistoryClaim.Class, meaning: 'Encounter class token.', example: 'http://terminology.hl7.org/CodeSystem/v3-ActCode|EMER' },
  { key: EncounterHistoryClaim.Type, meaning: 'Encounter type tokens (CSV).', example: 'http://snomed.info/sct|50849002' },
  { key: EncounterHistoryClaim.ServiceType, meaning: 'HealthcareService references (CSV).', example: 'HealthcareService/emergency-1' },
  { key: EncounterHistoryClaim.Subject, meaning: 'Patient or Group reference.', example: 'Patient/patient-1' },
  { key: EncounterHistoryClaim.SubjectStatus, meaning: 'Subject status token.', example: 'departed' },
  { key: EncounterHistoryClaim.ActualPeriodStart, meaning: 'Milestone period start.', example: '2026-09-29T08:00:00Z' },
  { key: EncounterHistoryClaim.ActualPeriodEnd, meaning: 'Milestone period end.', example: '2026-09-29T08:30:00Z' },
  { key: EncounterHistoryClaim.PlannedStartDate, meaning: 'Planned start.', example: '2026-09-29T08:00:00Z' },
  { key: EncounterHistoryClaim.PlannedEndDate, meaning: 'Planned end.', example: '2026-09-29T08:30:00Z' },
  { key: EncounterHistoryClaim.Location, meaning: 'Location references (CSV).', example: 'Location/emergency-box-1' },
  { key: EncounterHistoryClaim.LocationForm, meaning: 'Location form token.', example: 'http://terminology.hl7.org/CodeSystem/location-physical-type|ro' },
]
