// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.
// File: src/models/interoperable-claims/organization-claims.ts

import type { ClaimSpec } from './claim-types.js';

/**
 * Flat claim keys for `Organization`.
 *
 * Use this resource for legal entities, suborganizations and departments.
 * A service offered by one of them is a separate `HealthcareService`.
 */
export const OrganizationClaim = {
  Identifier: 'Organization.identifier',
  Active: 'Organization.active',
  Type: 'Organization.type',
  Name: 'Organization.name',
  Description: 'Organization.description',
  Alias: 'Organization.alias',
  PartOf: 'Organization.part-of',
  Telecom: 'Organization.telecom',
  Address: 'Organization.address',
} as const;

export type OrganizationClaimKey = typeof OrganizationClaim[keyof typeof OrganizationClaim];

export const OrganizationClaimSpecs: ClaimSpec[] = [
  { key: OrganizationClaim.Identifier, meaning: 'Business identifier.', example: 'dept-cardiology-001' },
  { key: OrganizationClaim.Active, meaning: 'Active flag.', example: 'true' },
  { key: OrganizationClaim.Type, meaning: 'Organization type token.', example: 'http://terminology.hl7.org/CodeSystem/organization-type|dept' },
  { key: OrganizationClaim.Name, meaning: 'Display name.', example: 'Cardiology Department' },
  { key: OrganizationClaim.Description, meaning: 'Consumer-facing department description materialized in FHIR R5.', example: 'Specialist cardiovascular care.' },
  { key: OrganizationClaim.Alias, meaning: 'Alternate names as CSV.', example: 'Cardiology,Heart Clinic' },
  { key: OrganizationClaim.PartOf, meaning: 'Parent organization reference.', example: 'Organization/hospital-1' },
  { key: OrganizationClaim.Telecom, meaning: 'Contact values as CSV.', example: 'tel:+16045550101,mailto:cardiology@example.org' },
  { key: OrganizationClaim.Address, meaning: 'Display address.', example: '123 Main St, Vancouver' },
];
