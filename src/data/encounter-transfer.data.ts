import { EncounterStatusR5 } from '../claims/encounter-claims.js'

/** Product-neutral identifiers and references for cross-package Encounter transfer contract tests. */
export const FHIR_ENCOUNTER_TRANSFER_TEST_DATA = Object.freeze({
  communicationIdentifier: 'urn:uuid:00000000-0000-4000-8000-000000000401',
  subjectReference: 'Patient/00000000-0000-4000-8000-000000000402',
  senderReference: 'Organization/00000000-0000-4000-8000-000000000403',
  indexRecipientReference: 'Organization/00000000-0000-4000-8000-000000000404',
  occurredAt: '2026-09-30T10:10:00Z',
  invalidOccurredAtWithoutTimezone: '2026-09-30T10:10:00',
  class: Object.freeze({ system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER' }),
  source: Object.freeze({
    id: '00000000-0000-4000-8000-000000000405',
    reference: 'Encounter/00000000-0000-4000-8000-000000000405',
    identifier: 'urn:uuid:00000000-0000-4000-8000-000000000405',
    serviceReference: 'HealthcareService/00000000-0000-4000-8000-000000000406',
    locationReference: 'Location/00000000-0000-4000-8000-000000000407',
    statusWhenReturning: EncounterStatusR5.OnHold,
    statusWhenNotReturning: EncounterStatusR5.Completed,
  }),
  destination: Object.freeze({
    id: '00000000-0000-4000-8000-000000000408',
    reference: 'Encounter/00000000-0000-4000-8000-000000000408',
    identifier: 'urn:uuid:00000000-0000-4000-8000-000000000408',
    serviceReference: 'HealthcareService/00000000-0000-4000-8000-000000000409',
    locationReference: 'Location/00000000-0000-4000-8000-000000000410',
    statusOnArrival: EncounterStatusR5.InProgress,
  }),
  sourceHistory: Object.freeze({
    id: '00000000-0000-4000-8000-000000000411',
    identifier: 'urn:uuid:00000000-0000-4000-8000-000000000411',
    encounterReference: 'Encounter/00000000-0000-4000-8000-000000000405',
  }),
  destinationHistory: Object.freeze({
    id: '00000000-0000-4000-8000-000000000412',
    identifier: 'urn:uuid:00000000-0000-4000-8000-000000000412',
    encounterReference: 'Encounter/00000000-0000-4000-8000-000000000408',
  }),
})
