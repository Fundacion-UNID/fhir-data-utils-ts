// Copyright 2026 Conéctate Soluciones y Aplicaciones SL under the Apache License, Version 2.0.
// File: src/convert/convert-location.ts

import { LocationClaim } from '../claims/location-claims.js';
import type { FhirResource, FlatClaims } from './convert-shared.js';
import { codingFromValue, codingToValue, identifierFromValue, identifierToValue, referenceToValue } from './convert-shared.js';

function splitCsv(value?: string): string[] {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function locationFlatToFhirR4(claims: FlatClaims): FhirResource {
  return {
    resourceType: 'Location',
    identifier: claims[LocationClaim.Identifier] ? [identifierFromValue(claims[LocationClaim.Identifier])] : undefined,
    status: claims[LocationClaim.Status],
    name: claims[LocationClaim.Name],
    description: claims[LocationClaim.Description],
    type: claims[LocationClaim.Type] ? [{ coding: codingFromValue(claims[LocationClaim.Type]) }] : undefined,
    mode: claims[LocationClaim.Mode],
    telecom: splitCsv(claims[LocationClaim.Telecom]).map((value) => ({ value })),
    address: claims[LocationClaim.Address] ? { text: claims[LocationClaim.Address] } : undefined,
    physicalType: claims[LocationClaim.PhysicalType] ? { coding: codingFromValue(claims[LocationClaim.PhysicalType]) } : undefined,
    managingOrganization: claims[LocationClaim.ManagingOrganization] ? { reference: claims[LocationClaim.ManagingOrganization] } : undefined,
    partOf: claims[LocationClaim.PartOf] ? { reference: claims[LocationClaim.PartOf] } : undefined,
    position: claims[LocationClaim.PositionLongitude] !== undefined && claims[LocationClaim.PositionLatitude] !== undefined
      ? {
          longitude: Number(claims[LocationClaim.PositionLongitude]),
          latitude: Number(claims[LocationClaim.PositionLatitude]),
          ...(claims[LocationClaim.PositionAltitude] !== undefined
            ? { altitude: Number(claims[LocationClaim.PositionAltitude]) }
            : {}),
        }
      : undefined,
  };
}

export function locationFhirR4ToFlat(resource: FhirResource): FlatClaims {
  const telecom = (resource.telecom as Array<{ value?: string }> | undefined)
    ?.map((item) => item?.value)
    .filter((item): item is string => Boolean(item));

  return {
    [LocationClaim.Identifier]: identifierToValue((resource.identifier as Array<{ system?: string; value?: string }> | undefined)?.[0]),
    [LocationClaim.Status]: resource.status as string | undefined,
    [LocationClaim.Name]: resource.name as string | undefined,
    [LocationClaim.Description]: resource.description as string | undefined,
    [LocationClaim.Type]: codingToValue((resource.type as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [LocationClaim.Mode]: resource.mode as string | undefined,
    [LocationClaim.Telecom]: telecom?.length ? telecom.join(',') : undefined,
    [LocationClaim.Address]: (resource.address as { text?: string } | undefined)?.text,
    [LocationClaim.PhysicalType]: codingToValue((resource.physicalType as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.[0]),
    [LocationClaim.ManagingOrganization]: referenceToValue(resource.managingOrganization as { reference?: string } | undefined),
    [LocationClaim.PartOf]: referenceToValue(resource.partOf as { reference?: string } | undefined),
    [LocationClaim.PositionLongitude]: (resource.position as { longitude?: number } | undefined)?.longitude?.toString(),
    [LocationClaim.PositionLatitude]: (resource.position as { latitude?: number } | undefined)?.latitude?.toString(),
    [LocationClaim.PositionAltitude]: (resource.position as { altitude?: number } | undefined)?.altitude?.toString(),
  };
}

/** Materializes canonical Location claims as native FHIR R5 (`form`, not the removed R4 `physicalType`). */
export function locationFlatToFhirR5(claims: FlatClaims): FhirResource {
  const r4 = locationFlatToFhirR4(claims)
  const { physicalType: _physicalType, telecom: _telecom, ...common } = r4
  const telecom = _telecom as Array<{ value?: string }> | undefined
  return {
    ...common,
    contact: telecom?.length ? [{ telecom }] : undefined,
    form: claims[LocationClaim.PhysicalType]
      ? { coding: codingFromValue(claims[LocationClaim.PhysicalType]) }
      : undefined,
  }
}

/** Extracts the version-neutral Location claims from native FHIR R5. */
export function locationFhirR5ToFlat(resource: FhirResource): FlatClaims {
  const flat = locationFhirR4ToFlat(resource)
  const telecom = (resource.contact as Array<{ telecom?: Array<{ value?: string }> }> | undefined)
    ?.flatMap(contact => contact.telecom ?? [])
    .map(point => point.value)
    .filter((value): value is string => Boolean(value))
  return {
    ...flat,
    [LocationClaim.Telecom]: telecom?.length ? telecom.join(',') : undefined,
    [LocationClaim.PhysicalType]: codingToValue(
      (resource.form as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.[0],
    ),
  }
}
