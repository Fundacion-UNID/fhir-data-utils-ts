// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.

import { ScheduleClaim, SlotClaim } from '../claims/schedule-slot-claims.js'
import type { FhirResource, FlatClaims } from './convert-shared.js'
import {
  codingListFromCsv,
  codingListToCsv,
  identifierFromValue,
  identifierToValue,
  referenceListToCsv,
  referenceToValue,
} from './convert-shared.js'

type Coding = { system?: string; code?: string }
type Concept = { coding?: Coding[] }
type Reference = { reference?: string }
type CodeableReference = { concept?: Concept; reference?: Reference }

const splitCsv = (value?: string): string[] => String(value || '').split(',').map(item => item.trim()).filter(Boolean)
const referencesFromCsv = (value?: string): Reference[] | undefined => {
  const values = splitCsv(value)
  return values.length ? values.map(reference => ({ reference })) : undefined
}
const conceptsFromCsv = (value?: string): Concept[] | undefined => {
  const codings = codingListFromCsv(value)
  return codings?.map(coding => ({ coding: [coding] }))
}
const conceptsToCsv = (value: unknown): string | undefined => codingListToCsv(
  (Array.isArray(value) ? value : []).flatMap(item =>
    item && typeof item === 'object' && Array.isArray((item as Concept).coding)
      ? (item as Concept).coding ?? []
      : []),
)
const codeableReferencesFromClaims = (concepts?: string, references?: string): CodeableReference[] | undefined => {
  const conceptList = conceptsFromCsv(concepts) ?? []
  const referenceList = referencesFromCsv(references) ?? []
  const length = Math.max(conceptList.length, referenceList.length)
  if (!length) return undefined
  return Array.from({ length }, (_, index) => ({
    ...(conceptList[index] ? { concept: conceptList[index] } : {}),
    ...(referenceList[index] ? { reference: referenceList[index] } : {}),
  }))
}
const conceptsFromCodeableReferences = (value: unknown): string | undefined => conceptsToCsv(
  (Array.isArray(value) ? value : []).map(item => (item as CodeableReference | undefined)?.concept),
)
const referencesFromCodeableReferences = (value: unknown): string | undefined => referenceListToCsv(
  (Array.isArray(value) ? value : []).map(item => (item as CodeableReference | undefined)?.reference ?? {}),
)

/** Materializes canonical Schedule claims as native FHIR R5. */
export function scheduleFlatToFhirR5(claims: FlatClaims): FhirResource {
  return {
    resourceType: 'Schedule',
    identifier: claims[ScheduleClaim.Identifier] ? [identifierFromValue(claims[ScheduleClaim.Identifier])] : undefined,
    active: claims[ScheduleClaim.Active] === undefined ? undefined : claims[ScheduleClaim.Active] === 'true',
    serviceCategory: conceptsFromCsv(claims[ScheduleClaim.ServiceCategory]),
    serviceType: codeableReferencesFromClaims(
      claims[ScheduleClaim.ServiceType],
      claims[ScheduleClaim.ServiceTypeReference],
    ),
    specialty: conceptsFromCsv(claims[ScheduleClaim.Specialty]),
    name: claims[ScheduleClaim.Name],
    actor: referencesFromCsv(claims[ScheduleClaim.Actor]),
    planningHorizon: claims[ScheduleClaim.PlanningHorizonStart] || claims[ScheduleClaim.PlanningHorizonEnd]
      ? { start: claims[ScheduleClaim.PlanningHorizonStart], end: claims[ScheduleClaim.PlanningHorizonEnd] }
      : undefined,
    comment: claims[ScheduleClaim.Comment],
  }
}

/** Extracts official Schedule search claims plus required materialization fields. */
export function scheduleFhirR5ToFlat(resource: FhirResource): FlatClaims {
  const planningHorizon = resource.planningHorizon as { start?: string; end?: string } | undefined
  return {
    [ScheduleClaim.Identifier]: identifierToValue((resource.identifier as Array<{ system?: string; value?: string }> | undefined)?.[0]),
    [ScheduleClaim.Active]: resource.active === undefined ? undefined : String(resource.active),
    [ScheduleClaim.ServiceCategory]: conceptsToCsv(resource.serviceCategory),
    [ScheduleClaim.ServiceType]: conceptsFromCodeableReferences(resource.serviceType),
    [ScheduleClaim.ServiceTypeReference]: referencesFromCodeableReferences(resource.serviceType),
    [ScheduleClaim.Specialty]: conceptsToCsv(resource.specialty),
    [ScheduleClaim.Name]: resource.name as string | undefined,
    [ScheduleClaim.Actor]: referenceListToCsv(resource.actor as Reference[] | undefined),
    [ScheduleClaim.PlanningHorizonStart]: planningHorizon?.start,
    [ScheduleClaim.PlanningHorizonEnd]: planningHorizon?.end,
    [ScheduleClaim.Comment]: resource.comment as string | undefined,
  }
}

/** Materializes canonical Slot claims as native FHIR R5. */
export function slotFlatToFhirR5(claims: FlatClaims): FhirResource {
  return {
    resourceType: 'Slot',
    identifier: claims[SlotClaim.Identifier] ? [identifierFromValue(claims[SlotClaim.Identifier])] : undefined,
    serviceCategory: conceptsFromCsv(claims[SlotClaim.ServiceCategory]),
    serviceType: codeableReferencesFromClaims(claims[SlotClaim.ServiceType], claims[SlotClaim.ServiceTypeReference]),
    specialty: conceptsFromCsv(claims[SlotClaim.Specialty]),
    appointmentType: conceptsFromCsv(claims[SlotClaim.AppointmentType]),
    schedule: claims[SlotClaim.Schedule] ? { reference: claims[SlotClaim.Schedule] } : undefined,
    status: claims[SlotClaim.Status],
    start: claims[SlotClaim.Start],
    end: claims[SlotClaim.End],
    overbooked: claims[SlotClaim.Overbooked] === undefined ? undefined : claims[SlotClaim.Overbooked] === 'true',
    comment: claims[SlotClaim.Comment],
  }
}

/** Extracts official Slot search claims plus required materialization fields. */
export function slotFhirR5ToFlat(resource: FhirResource): FlatClaims {
  return {
    [SlotClaim.Identifier]: identifierToValue((resource.identifier as Array<{ system?: string; value?: string }> | undefined)?.[0]),
    [SlotClaim.ServiceCategory]: conceptsToCsv(resource.serviceCategory),
    [SlotClaim.ServiceType]: conceptsFromCodeableReferences(resource.serviceType),
    [SlotClaim.ServiceTypeReference]: referencesFromCodeableReferences(resource.serviceType),
    [SlotClaim.Specialty]: conceptsToCsv(resource.specialty),
    [SlotClaim.AppointmentType]: conceptsToCsv(resource.appointmentType),
    [SlotClaim.Schedule]: referenceToValue(resource.schedule as Reference | undefined),
    [SlotClaim.Status]: resource.status as string | undefined,
    [SlotClaim.Start]: resource.start as string | undefined,
    [SlotClaim.End]: resource.end as string | undefined,
    [SlotClaim.Overbooked]: resource.overbooked === undefined ? undefined : String(resource.overbooked),
    [SlotClaim.Comment]: resource.comment as string | undefined,
  }
}
