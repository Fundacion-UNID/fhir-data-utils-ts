import type { FhirCodeableConcept, FhirPeriod, FhirReference, FhirResource } from '../fhir-types.js'

export const FhirDemoEncounterUpdateStatusIds = Object.freeze({
  Arrived: 'arrived',
  Triaged: 'triaged',
  Diagnosed: 'diagnosed',
  TreatmentInProgress: 'treatment-in-progress',
} as const)

export type FhirDemoEncounterUpdateStatusId =
  typeof FhirDemoEncounterUpdateStatusIds[keyof typeof FhirDemoEncounterUpdateStatusIds]

export type FhirDemoEncounterUpdate = Readonly<{
  sequence: number
  status: FhirDemoEncounterUpdateStatusId
  occurredAt: string
  summary: string
}>

export type FhirDemoEncounter = FhirResource & Readonly<{
  resourceType: 'Encounter'
  id: string
  status: 'in-progress'
  class: Readonly<{ system: string; code: string; display: string }>
  subject: FhirReference
  period: FhirPeriod
  location: readonly Readonly<{ location: FhirReference }>[]
}>

export type FhirDemoCondition = FhirResource & Readonly<{
  resourceType: 'Condition'
  id: string
  clinicalStatus: FhirCodeableConcept
  code: FhirCodeableConcept
  subject: FhirReference
  encounter: FhirReference
  onsetDateTime: string
}>

export type FhirDemoEmergencyEncounterJourney = Readonly<{
  encounter: FhirDemoEncounter
  condition: FhirDemoCondition
  updates: readonly FhirDemoEncounterUpdate[]
}>

const subject = Object.freeze({ reference: 'Patient/demo-arm-fracture-subject', display: 'Example patient' })
const encounterReference = Object.freeze({ reference: 'Encounter/demo-arm-fracture' })

/** Repository-safe clinical fixture. It is descriptive and grants no access. */
export const FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY: FhirDemoEmergencyEncounterJourney = Object.freeze({
  encounter: Object.freeze({
    resourceType: 'Encounter',
    id: 'demo-arm-fracture',
    status: 'in-progress',
    class: Object.freeze({ system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER', display: 'emergency' }),
    subject,
    period: Object.freeze({ start: '2026-10-27T14:12:00Z' }),
    location: Object.freeze([{ location: Object.freeze({ reference: 'Location/demo-emergency-department', display: 'Example emergency department' }) }]),
  }),
  condition: Object.freeze({
    resourceType: 'Condition',
    id: 'demo-closed-forearm-fracture',
    clinicalStatus: Object.freeze({ coding: Object.freeze([{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]) }),
    code: Object.freeze({ text: 'Closed forearm fracture' }),
    subject,
    encounter: encounterReference,
    onsetDateTime: '2026-10-27T13:45:00Z',
  }),
  updates: Object.freeze([
    Object.freeze({ sequence: 1, status: FhirDemoEncounterUpdateStatusIds.Arrived, occurredAt: '2026-10-27T14:12:00Z', summary: 'Arrived at the emergency department after a fall.' }),
    Object.freeze({ sequence: 2, status: FhirDemoEncounterUpdateStatusIds.Triaged, occurredAt: '2026-10-27T14:24:00Z', summary: 'Triage completed; circulation and sensation are intact.' }),
    Object.freeze({ sequence: 3, status: FhirDemoEncounterUpdateStatusIds.Diagnosed, occurredAt: '2026-10-27T15:08:00Z', summary: 'X-ray confirms a closed forearm fracture.' }),
    Object.freeze({ sequence: 4, status: FhirDemoEncounterUpdateStatusIds.TreatmentInProgress, occurredAt: '2026-10-27T15:20:00Z', summary: 'Immobilization and discharge planning are in progress.' }),
  ]),
})
