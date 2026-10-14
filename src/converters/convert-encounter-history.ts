// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.

import { EncounterHistoryClaim } from '../claims/encounter-history-claims.js'
import { EncounterStatusR5 } from '../claims/encounter-claims.js'
import type { FhirResource, FlatClaims } from './convert-shared.js'
import { codingFromValue, codingToValue, referenceToValue } from './convert-shared.js'

const R5_STATUSES = new Set<string>(Object.values(EncounterStatusR5))

/** Materializes canonical EncounterHistory claims as native FHIR R5. */
export function encounterHistoryFlatToFhirR5(claims: FlatClaims): FhirResource {
  const status = claims[EncounterHistoryClaim.Status]
  if (!status || !R5_STATUSES.has(status)) throw new TypeError('encounter_history_r5_status_invalid')
  const klass = claims[EncounterHistoryClaim.Class]
  if (!klass) throw new TypeError('encounter_history_r5_class_required')
  return {
    resourceType: 'EncounterHistory',
    identifier: claims[EncounterHistoryClaim.Identifier] ? [{ value: claims[EncounterHistoryClaim.Identifier] }] : undefined,
    encounter: claims[EncounterHistoryClaim.Encounter] ? { reference: claims[EncounterHistoryClaim.Encounter] } : undefined,
    status,
    class: { coding: codingFromValue(klass) },
    type: concepts(claims[EncounterHistoryClaim.Type]),
    serviceType: codeableReferences(claims[EncounterHistoryClaim.ServiceType]),
    subject: claims[EncounterHistoryClaim.Subject] ? { reference: claims[EncounterHistoryClaim.Subject] } : undefined,
    subjectStatus: claims[EncounterHistoryClaim.SubjectStatus] ? { coding: codingFromValue(claims[EncounterHistoryClaim.SubjectStatus]) } : undefined,
    actualPeriod: period(claims[EncounterHistoryClaim.ActualPeriodStart], claims[EncounterHistoryClaim.ActualPeriodEnd]),
    plannedStartDate: claims[EncounterHistoryClaim.PlannedStartDate],
    plannedEndDate: claims[EncounterHistoryClaim.PlannedEndDate],
    location: locations(claims[EncounterHistoryClaim.Location], claims[EncounterHistoryClaim.LocationForm]),
  }
}

/** Extracts supported native FHIR R5 EncounterHistory fields into flat claims. */
export function encounterHistoryFhirR5ToFlat(resource: FhirResource): FlatClaims {
  const klass = resource.class as { coding?: Array<{ system?: string; code?: string }> } | undefined
  const actualPeriod = resource.actualPeriod as { start?: string; end?: string } | undefined
  const location = (resource.location as Array<{ location?: { reference?: string }; form?: { coding?: Array<{ system?: string; code?: string }> } }> | undefined)?.[0]
  return {
    [EncounterHistoryClaim.Identifier]: (resource.identifier as Array<{ value?: string }> | undefined)?.[0]?.value,
    [EncounterHistoryClaim.Encounter]: referenceToValue(resource.encounter as { reference?: string } | undefined),
    [EncounterHistoryClaim.Status]: resource.status as string | undefined,
    [EncounterHistoryClaim.Class]: codingToValue(klass?.coding?.[0]),
    [EncounterHistoryClaim.Type]: conceptsToCsv(resource.type),
    [EncounterHistoryClaim.ServiceType]: codeableReferencesToCsv(resource.serviceType),
    [EncounterHistoryClaim.Subject]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [EncounterHistoryClaim.SubjectStatus]: codingToValue((resource.subjectStatus as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.[0]),
    [EncounterHistoryClaim.ActualPeriodStart]: actualPeriod?.start,
    [EncounterHistoryClaim.ActualPeriodEnd]: actualPeriod?.end,
    [EncounterHistoryClaim.PlannedStartDate]: resource.plannedStartDate as string | undefined,
    [EncounterHistoryClaim.PlannedEndDate]: resource.plannedEndDate as string | undefined,
    [EncounterHistoryClaim.Location]: location?.location?.reference,
    [EncounterHistoryClaim.LocationForm]: codingToValue(location?.form?.coding?.[0]),
  }
}

function period(start?: string, end?: string): { start?: string; end?: string } | undefined {
  return start || end ? { start, end } : undefined
}

function concepts(value?: string): Array<{ coding: ReturnType<typeof codingFromValue> }> | undefined {
  const values = value?.split(',').map(item => item.trim()).filter(Boolean) ?? []
  return values.length ? values.map(item => ({ coding: codingFromValue(item) })) : undefined
}

function conceptsToCsv(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined
  const values = value.map(item => codingToValue((item as { coding?: Array<{ system?: string; code?: string }> })?.coding?.[0])).filter(Boolean)
  return values.length ? values.join(',') : undefined
}

function codeableReferences(value?: string): Array<{ reference: { reference: string } }> | undefined {
  const values = value?.split(',').map(item => item.trim()).filter(Boolean) ?? []
  return values.length ? values.map(reference => ({ reference: { reference } })) : undefined
}

function codeableReferencesToCsv(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined
  const values = value.map(item => referenceToValue((item as { reference?: { reference?: string } })?.reference)).filter(Boolean)
  return values.length ? values.join(',') : undefined
}

function locations(locationValue?: string, formValue?: string): Array<Record<string, unknown>> | undefined {
  const values = locationValue?.split(',').map(item => item.trim()).filter(Boolean) ?? []
  if (!values.length) return undefined
  return values.map((reference, index) => ({
    location: { reference },
    form: index === 0 && formValue ? { coding: codingFromValue(formValue) } : undefined,
  }))
}
