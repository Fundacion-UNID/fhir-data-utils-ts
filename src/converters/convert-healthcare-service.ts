// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.

import { HealthcareServiceClaim } from '../claims/healthcare-service-claims.js'
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
type CodeableConcept = { coding?: Coding[] }
type Reference = { reference?: string }

const conceptsFromCsv = (value?: string): CodeableConcept[] | undefined => {
  const coding = codingListFromCsv(value)
  return coding?.map(item => ({ coding: [item] }))
}

const conceptsToCsv = (value: unknown): string | undefined => codingListToCsv(
  (Array.isArray(value) ? value : [])
    .flatMap(item => item && typeof item === 'object' && Array.isArray((item as CodeableConcept).coding)
      ? (item as CodeableConcept).coding ?? []
      : []),
)

const referencesFromCsv = (value?: string): Reference[] | undefined => {
  const references = String(value || '').split(',').map(item => item.trim()).filter(Boolean)
  return references.length ? references.map(reference => ({ reference })) : undefined
}

/** Materializes canonical HealthcareService claims as native FHIR R4. */
export function healthcareServiceFlatToFhirR4(claims: FlatClaims): FhirResource {
  return {
    resourceType: 'HealthcareService',
    identifier: claims[HealthcareServiceClaim.Identifier]
      ? [identifierFromValue(claims[HealthcareServiceClaim.Identifier])]
      : undefined,
    active: claims[HealthcareServiceClaim.Active] === undefined
      ? undefined
      : claims[HealthcareServiceClaim.Active] === 'true',
    appointmentRequired: claims[HealthcareServiceClaim.AppointmentRequired] === undefined
      ? undefined
      : claims[HealthcareServiceClaim.AppointmentRequired] === 'true',
    providedBy: claims[HealthcareServiceClaim.Organization]
      ? { reference: claims[HealthcareServiceClaim.Organization] }
      : undefined,
    category: conceptsFromCsv(claims[HealthcareServiceClaim.ServiceCategory]),
    type: conceptsFromCsv(claims[HealthcareServiceClaim.ServiceType]),
    specialty: conceptsFromCsv(claims[HealthcareServiceClaim.Specialty]),
    location: referencesFromCsv(claims[HealthcareServiceClaim.Location]),
    name: claims[HealthcareServiceClaim.Name],
    comment: claims[HealthcareServiceClaim.Comment],
    coverageArea: referencesFromCsv(claims[HealthcareServiceClaim.CoverageArea]),
    program: conceptsFromCsv(claims[HealthcareServiceClaim.Program]),
    characteristic: conceptsFromCsv(claims[HealthcareServiceClaim.Characteristic]),
    endpoint: referencesFromCsv(claims[HealthcareServiceClaim.Endpoint]),
  }
}

/** Extracts only official R4 HealthcareService SearchParameters into flat claims. */
export function healthcareServiceFhirR4ToFlat(resource: FhirResource): FlatClaims {
  return {
    [HealthcareServiceClaim.Active]: resource.active === undefined ? undefined : String(resource.active),
    [HealthcareServiceClaim.AppointmentRequired]: resource.appointmentRequired === undefined
      ? undefined
      : String(resource.appointmentRequired),
    [HealthcareServiceClaim.Characteristic]: conceptsToCsv(resource.characteristic),
    [HealthcareServiceClaim.CoverageArea]: referenceListToCsv(resource.coverageArea as Reference[] | undefined),
    [HealthcareServiceClaim.Endpoint]: referenceListToCsv(resource.endpoint as Reference[] | undefined),
    [HealthcareServiceClaim.Identifier]: identifierToValue((resource.identifier as Array<{ system?: string; value?: string }> | undefined)?.[0]),
    [HealthcareServiceClaim.Location]: referenceListToCsv(resource.location as Reference[] | undefined),
    [HealthcareServiceClaim.Name]: resource.name as string | undefined,
    [HealthcareServiceClaim.Comment]: resource.comment as string | undefined,
    [HealthcareServiceClaim.Organization]: referenceToValue(resource.providedBy as Reference | undefined),
    [HealthcareServiceClaim.Program]: conceptsToCsv(resource.program),
    [HealthcareServiceClaim.ServiceCategory]: conceptsToCsv(resource.category),
    [HealthcareServiceClaim.ServiceType]: conceptsToCsv(resource.type),
    [HealthcareServiceClaim.Specialty]: conceptsToCsv(resource.specialty),
  }
}

/** Materializes canonical HealthcareService claims as native FHIR R5. */
export const healthcareServiceFlatToFhirR5 = healthcareServiceFlatToFhirR4;
