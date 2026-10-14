// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.
// File: src/models/interoperable-claims/location-claims.ts

import type { ClaimSpec } from './claim-types.js';

/**
 * Flat claim keys for `Location`.
 *
 * Use this resource for offices, consultation rooms, clinics, labs, or other
 * service/physical locations.
 */
export const LocationClaim = {
  Identifier: 'Location.identifier',
  Status: 'Location.status',
  Name: 'Location.name',
  Description: 'Location.description',
  Type: 'Location.type',
  Mode: 'Location.mode',
  Telecom: 'Location.telecom',
  Address: 'Location.address',
  PhysicalType: 'Location.physical-type',
  ManagingOrganization: 'Location.managing-organization',
  PartOf: 'Location.part-of',
  PositionLongitude: 'Location.position-longitude',
  PositionLatitude: 'Location.position-latitude',
  PositionAltitude: 'Location.position-altitude',
} as const;

export type LocationClaimKey = typeof LocationClaim[keyof typeof LocationClaim];

export const LocationClaimSpecs: ClaimSpec[] = [
  { key: LocationClaim.Identifier, meaning: 'Business identifier.', example: 'room-201' },
  { key: LocationClaim.Status, meaning: 'Location status.', example: 'active' },
  { key: LocationClaim.Name, meaning: 'Display name.', example: 'Consultation Room 201' },
  { key: LocationClaim.Description, meaning: 'Narrative description.', example: 'Second floor consultation room' },
  { key: LocationClaim.Type, meaning: 'Location type token.', example: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode|OF' },
  { key: LocationClaim.Mode, meaning: 'Location mode.', example: 'instance' },
  { key: LocationClaim.Telecom, meaning: 'Contact values as CSV.', example: 'tel:+16045550102' },
  { key: LocationClaim.Address, meaning: 'Display address.', example: '123 Main St, Vancouver' },
  { key: LocationClaim.PhysicalType, meaning: 'Physical type token.', example: 'http://terminology.hl7.org/CodeSystem/location-physical-type|ro' },
  { key: LocationClaim.ManagingOrganization, meaning: 'Managing organization reference.', example: 'Organization/dept-cardiology-001' },
  { key: LocationClaim.PartOf, meaning: 'Parent location reference.', example: 'Location/building-a' },
  { key: LocationClaim.PositionLongitude, meaning: 'WGS84 longitude in decimal degrees.', example: '-123.1207' },
  { key: LocationClaim.PositionLatitude, meaning: 'WGS84 latitude in decimal degrees.', example: '49.2827' },
  { key: LocationClaim.PositionAltitude, meaning: 'Altitude in metres.', example: '12.5' },
];
