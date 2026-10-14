// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.

import type { ClaimSpec } from './claim-types.js'
import { defineFlatSearchParameter } from '../search-parameters.js'

/**
 * Canonical flat claims for the official FHIR R4 HealthcareService search
 * surface. The providing Organization may be a department/suborganization;
 * it is not the service itself.
 *
 * @see https://hl7.org/fhir/R4/healthcareservice.html#search
 */
export const HealthcareServiceClaim = Object.freeze({
  Active: 'HealthcareService.active',
  AppointmentRequired: 'HealthcareService.appointment-required',
  Characteristic: 'HealthcareService.characteristic',
  CoverageArea: 'HealthcareService.coverage-area',
  Endpoint: 'HealthcareService.endpoint',
  Identifier: 'HealthcareService.identifier',
  Location: 'HealthcareService.location',
  Name: 'HealthcareService.name',
  Comment: 'HealthcareService.comment',
  Organization: 'HealthcareService.organization',
  Program: 'HealthcareService.program',
  ServiceCategory: 'HealthcareService.service-category',
  ServiceType: 'HealthcareService.service-type',
  Specialty: 'HealthcareService.specialty',
} as const)

export type HealthcareServiceClaimKey = typeof HealthcareServiceClaim[keyof typeof HealthcareServiceClaim]

/** Exact resource-specific SearchParameters published by FHIR R4 4.0.1. */
export const HealthcareServiceR4SearchParameterCatalog = Object.freeze([
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.Active, resourceType: 'HealthcareService', elementPath: 'HealthcareService.active', type: 'token' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.Characteristic, resourceType: 'HealthcareService', elementPath: 'HealthcareService.characteristic', type: 'token' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.CoverageArea, resourceType: 'HealthcareService', elementPath: 'HealthcareService.coverageArea', type: 'reference' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.Endpoint, resourceType: 'HealthcareService', elementPath: 'HealthcareService.endpoint', type: 'reference' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.Identifier, resourceType: 'HealthcareService', elementPath: 'HealthcareService.identifier', type: 'token' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.Location, resourceType: 'HealthcareService', elementPath: 'HealthcareService.location', type: 'reference' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.Name, resourceType: 'HealthcareService', elementPath: 'HealthcareService.name', type: 'string' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.Organization, resourceType: 'HealthcareService', elementPath: 'HealthcareService.providedBy', type: 'reference' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.Program, resourceType: 'HealthcareService', elementPath: 'HealthcareService.program', type: 'token' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.ServiceCategory, resourceType: 'HealthcareService', elementPath: 'HealthcareService.category', type: 'token' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.ServiceType, resourceType: 'HealthcareService', elementPath: 'HealthcareService.type', type: 'token' }),
  defineFlatSearchParameter({ claim: HealthcareServiceClaim.Specialty, resourceType: 'HealthcareService', elementPath: 'HealthcareService.specialty', type: 'token' }),
])

export const HealthcareServiceClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: HealthcareServiceClaim.Active, meaning: 'Whether the service is active.', example: 'true' },
  { key: HealthcareServiceClaim.AppointmentRequired, meaning: 'Whether an appointment is required before receiving the service.', example: 'true' },
  { key: HealthcareServiceClaim.Characteristic, meaning: 'Repeatable service characteristic tokens as CSV.', example: 'https://example.org/CodeSystem/service-characteristic|24-hours' },
  { key: HealthcareServiceClaim.CoverageArea, meaning: 'Repeatable intended coverage Location references as CSV.', example: 'Location/british-columbia' },
  { key: HealthcareServiceClaim.Endpoint, meaning: 'Repeatable technical Endpoint references as CSV.', example: 'Endpoint/emergency-group-inbox' },
  { key: HealthcareServiceClaim.Identifier, meaning: 'Logical service identifier.', example: 'urn:uuid:healthcare-service-1' },
  { key: HealthcareServiceClaim.Location, meaning: 'Repeatable Places where the service is provided as Location references.', example: 'Location/emergency-room-1' },
  { key: HealthcareServiceClaim.Name, meaning: 'Consumer-facing service name.', example: 'Veterinary emergency care' },
  { key: HealthcareServiceClaim.Comment, meaning: 'Consumer-facing service description; this is a materialized field, not a SearchParameter.', example: 'Emergency assessment and stabilization.' },
  { key: HealthcareServiceClaim.Organization, meaning: 'Organization or department that provides the service.', example: 'Organization/emergency-department-1' },
  { key: HealthcareServiceClaim.Program, meaning: 'Repeatable program tokens as CSV.', example: 'https://example.org/CodeSystem/program|lost-animal-emergency' },
  { key: HealthcareServiceClaim.ServiceCategory, meaning: 'Repeatable broad service category tokens as CSV.', example: 'http://terminology.hl7.org/CodeSystem/service-category|1' },
  { key: HealthcareServiceClaim.ServiceType, meaning: 'Repeatable service type tokens as CSV.', example: 'http://terminology.hl7.org/CodeSystem/service-type|117' },
  { key: HealthcareServiceClaim.Specialty, meaning: 'Repeatable clinical specialty tokens as CSV.', example: 'http://loinc.org|LP172940-1' },
])
