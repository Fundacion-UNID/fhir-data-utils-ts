// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.
// File: src/utils/convert-encounter.ts

import { EncounterClaim, EncounterStatusR5 } from '../claims/encounter-claims.js';
import type { FhirResource, FlatClaims } from './convert-shared.js';
import { codingFromValue, codingToValue, referenceListToCsv, referenceToValue } from './convert-shared.js';

export function encounterFlatToFhirR4(claims: FlatClaims): FhirResource {
  const subject = claims[EncounterClaim.Subject] ?? claims[EncounterClaim.Patient];
  return {
    resourceType: 'Encounter',
    identifier: claims[EncounterClaim.Identifier] ? [{ value: claims[EncounterClaim.Identifier] }] : undefined,
    appointment: claims[EncounterClaim.Appointment]
      ? claims[EncounterClaim.Appointment]!.split(',').map((reference) => ({ reference: reference.trim() }))
      : undefined,
    status: claims[EncounterClaim.Status],
    class: claims[EncounterClaim.Class]
      ? (() => {
        const [system, code] = claims[EncounterClaim.Class]!.split('|');
        return code ? { system, code } : { code: system };
      })()
      : undefined,
    type: claims[EncounterClaim.Type] ? [{ coding: codingFromValue(claims[EncounterClaim.Type]) }] : undefined,
    subject: subject ? { reference: subject } : undefined,
    participant: claims[EncounterClaim.Participant]
      ? claims[EncounterClaim.Participant]!.split(',').map((reference) => ({ individual: { reference: reference.trim() } }))
      : undefined,
    serviceProvider: claims[EncounterClaim.ServiceProvider] ? { reference: claims[EncounterClaim.ServiceProvider] } : undefined,
    period: (claims[EncounterClaim.PeriodStart] || claims[EncounterClaim.PeriodEnd]) ? {
      start: claims[EncounterClaim.PeriodStart],
      end: claims[EncounterClaim.PeriodEnd],
    } : undefined,
    reasonCode: claims[EncounterClaim.ReasonCode] ? [{ coding: codingFromValue(claims[EncounterClaim.ReasonCode]) }] : undefined,
    diagnosis: claims[EncounterClaim.Diagnosis]
      ? claims[EncounterClaim.Diagnosis]!.split(',').map((reference) => ({ condition: { reference: reference.trim() } }))
      : undefined,
    location: claims[EncounterClaim.Location]
      ? claims[EncounterClaim.Location]!.split(',').map((reference) => ({ location: { reference: reference.trim() } }))
      : undefined,
    partOf: claims[EncounterClaim.PartOf] ? { reference: claims[EncounterClaim.PartOf] } : undefined,
  };
}

export function encounterFhirR4ToFlat(resource: FhirResource): FlatClaims {
  const klass = resource.class as { system?: string; code?: string } | undefined;
  return {
    [EncounterClaim.Identifier]: (resource.identifier as Array<{ value?: string }> | undefined)?.[0]?.value,
    [EncounterClaim.Appointment]: referenceListToCsv(resource.appointment as Array<{ reference?: string }> | undefined),
    [EncounterClaim.Status]: resource.status as string | undefined,
    [EncounterClaim.Class]: klass?.code ? (klass.system ? `${klass.system}|${klass.code}` : klass.code) : undefined,
    [EncounterClaim.Type]: codingToValue((resource.type as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [EncounterClaim.Subject]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [EncounterClaim.Patient]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [EncounterClaim.Participant]: Array.isArray(resource.participant)
      ? (resource.participant as Array<Record<string, unknown>>)
        .map((item) => referenceToValue(item?.individual as { reference?: string } | undefined))
        .filter((item): item is string => Boolean(item))
        .join(',')
      : undefined,
    [EncounterClaim.ServiceProvider]: referenceToValue(resource.serviceProvider as { reference?: string } | undefined),
    [EncounterClaim.PeriodStart]: (resource.period as { start?: string } | undefined)?.start,
    [EncounterClaim.PeriodEnd]: (resource.period as { end?: string } | undefined)?.end,
    [EncounterClaim.ReasonCode]: codingToValue((resource.reasonCode as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [EncounterClaim.Diagnosis]: Array.isArray(resource.diagnosis)
      ? (resource.diagnosis as Array<Record<string, unknown>>)
        .map((item) => referenceToValue(item?.condition as { reference?: string } | undefined))
        .filter((item): item is string => Boolean(item))
        .join(',')
      : undefined,
    [EncounterClaim.Location]: Array.isArray(resource.location)
      ? (resource.location as Array<Record<string, unknown>>)
        .map((item) => referenceToValue(item?.location as { reference?: string } | undefined))
        .filter((item): item is string => Boolean(item))
        .join(',')
      : undefined,
    [EncounterClaim.PartOf]: referenceToValue(resource.partOf as { reference?: string } | undefined),
  };
}

const R5_STATUSES = new Set<string>(Object.values(EncounterStatusR5))

/** Materializes canonical Encounter claims as native FHIR R5. */
export function encounterFlatToFhirR5(claims: FlatClaims): FhirResource {
  const status = claims[EncounterClaim.Status]
  if (status && !R5_STATUSES.has(status)) throw new TypeError('encounter_r5_status_invalid')
  const subject = claims[EncounterClaim.Subject] ?? claims[EncounterClaim.Patient]
  const actualPeriodStart = claims[EncounterClaim.ActualPeriodStart] ?? claims[EncounterClaim.PeriodStart]
  const actualPeriodEnd = claims[EncounterClaim.ActualPeriodEnd] ?? claims[EncounterClaim.PeriodEnd]
  return {
    resourceType: 'Encounter',
    identifier: claims[EncounterClaim.Identifier] ? [{ value: claims[EncounterClaim.Identifier] }] : undefined,
    appointment: referenceList(claims[EncounterClaim.Appointment]),
    status,
    class: claims[EncounterClaim.Class] ? { coding: codingFromValue(claims[EncounterClaim.Class]) } : undefined,
    type: claims[EncounterClaim.Type] ? [{ coding: codingFromValue(claims[EncounterClaim.Type]) }] : undefined,
    serviceType: codeableReferenceList(claims[EncounterClaim.ServiceType]),
    subject: subject ? { reference: subject } : undefined,
    participant: claims[EncounterClaim.Participant]
      ? claims[EncounterClaim.Participant]!.split(',').map(reference => ({ actor: { reference: reference.trim() } }))
      : undefined,
    serviceProvider: claims[EncounterClaim.ServiceProvider] ? { reference: claims[EncounterClaim.ServiceProvider] } : undefined,
    actualPeriod: (actualPeriodStart || actualPeriodEnd) ? { start: actualPeriodStart, end: actualPeriodEnd } : undefined,
    location: claims[EncounterClaim.Location]
      ? claims[EncounterClaim.Location]!.split(',').map(reference => ({ location: { reference: reference.trim() } }))
      : undefined,
    partOf: claims[EncounterClaim.PartOf] ? { reference: claims[EncounterClaim.PartOf] } : undefined,
  }
}

/** Extracts the supported R5 Encounter fields into canonical flat claims. */
export function encounterFhirR5ToFlat(resource: FhirResource): FlatClaims {
  const klass = resource.class as { coding?: Array<{ system?: string; code?: string }> } | undefined
  const actualPeriod = resource.actualPeriod as { start?: string; end?: string } | undefined
  return {
    [EncounterClaim.Identifier]: (resource.identifier as Array<{ value?: string }> | undefined)?.[0]?.value,
    [EncounterClaim.Appointment]: referenceListToCsv(resource.appointment as Array<{ reference?: string }> | undefined),
    [EncounterClaim.Status]: resource.status as string | undefined,
    [EncounterClaim.Class]: codingToValue(klass?.coding?.[0]),
    [EncounterClaim.Type]: codingToValue((resource.type as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [EncounterClaim.ServiceType]: codeableReferencesToCsv(resource.serviceType),
    [EncounterClaim.Subject]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [EncounterClaim.Patient]: referenceToValue(resource.subject as { reference?: string } | undefined),
    [EncounterClaim.Participant]: Array.isArray(resource.participant)
      ? (resource.participant as Array<{ actor?: { reference?: string } }>).map(item => item.actor?.reference).filter(Boolean).join(',') || undefined
      : undefined,
    [EncounterClaim.ServiceProvider]: referenceToValue(resource.serviceProvider as { reference?: string } | undefined),
    [EncounterClaim.ActualPeriodStart]: actualPeriod?.start,
    [EncounterClaim.ActualPeriodEnd]: actualPeriod?.end,
    [EncounterClaim.Location]: Array.isArray(resource.location)
      ? (resource.location as Array<{ location?: { reference?: string } }>).map(item => item.location?.reference).filter(Boolean).join(',') || undefined
      : undefined,
    [EncounterClaim.PartOf]: referenceToValue(resource.partOf as { reference?: string } | undefined),
  }
}

function referenceList(value: string | undefined): Array<{ reference: string }> | undefined {
  const references = value?.split(',').map(reference => reference.trim()).filter(Boolean) ?? []
  return references.length ? references.map(reference => ({ reference })) : undefined
}

function codeableReferenceList(value: string | undefined): Array<{ reference: { reference: string } }> | undefined {
  const references = referenceList(value)
  return references?.map(reference => ({ reference }))
}

function codeableReferencesToCsv(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined
  const references = value.map(item => {
    if (!item || typeof item !== 'object') return undefined
    return referenceToValue((item as { reference?: { reference?: string } }).reference)
  }).filter((item): item is string => Boolean(item))
  return references.length ? references.join(',') : undefined
}
