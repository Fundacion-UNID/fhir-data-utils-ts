import { RegulatedAuthorizationClaim } from '../claims/regulated-authorization-claims.js'
import type { FhirResource, FlatClaims } from './convert-shared.js'
import { codingFromValue, codingToValue, referenceToValue } from './convert-shared.js'

export function regulatedAuthorizationFlatToFhirR5(claims: FlatClaims): FhirResource {
  return {
    resourceType: 'RegulatedAuthorization',
    identifier: claims[RegulatedAuthorizationClaim.Identifier] ? [{ value: claims[RegulatedAuthorizationClaim.Identifier] }] : undefined,
    subject: claims[RegulatedAuthorizationClaim.Subject] ? claims[RegulatedAuthorizationClaim.Subject]!.split(',').map(reference => ({ reference: reference.trim() })) : undefined,
    type: claims[RegulatedAuthorizationClaim.Type] ? { coding: codingFromValue(claims[RegulatedAuthorizationClaim.Type]) } : undefined,
    region: claims[RegulatedAuthorizationClaim.Region] ? [{ coding: codingFromValue(claims[RegulatedAuthorizationClaim.Region]) }] : undefined,
    status: claims[RegulatedAuthorizationClaim.Status] ? { coding: [{ code: claims[RegulatedAuthorizationClaim.Status] }] } : undefined,
    statusDate: claims[RegulatedAuthorizationClaim.StatusDate],
    validityPeriod: claims[RegulatedAuthorizationClaim.ValidityStart] || claims[RegulatedAuthorizationClaim.ValidityEnd]
      ? { start: claims[RegulatedAuthorizationClaim.ValidityStart], end: claims[RegulatedAuthorizationClaim.ValidityEnd] }
      : undefined,
    basis: claims[RegulatedAuthorizationClaim.Basis] ? [{ coding: codingFromValue(claims[RegulatedAuthorizationClaim.Basis]) }] : undefined,
    holder: claims[RegulatedAuthorizationClaim.Holder] ? { reference: claims[RegulatedAuthorizationClaim.Holder] } : undefined,
    regulator: claims[RegulatedAuthorizationClaim.Regulator] ? { reference: claims[RegulatedAuthorizationClaim.Regulator] } : undefined,
  }
}

export function regulatedAuthorizationFhirR5ToFlat(resource: FhirResource): FlatClaims {
  return {
    [RegulatedAuthorizationClaim.Identifier]: (resource.identifier as Array<{ value?: string }> | undefined)?.[0]?.value,
    [RegulatedAuthorizationClaim.Subject]: Array.isArray(resource.subject) ? (resource.subject as Array<{ reference?: string }>).map(item => item.reference).filter(Boolean).join(',') || undefined : undefined,
    [RegulatedAuthorizationClaim.Type]: codingToValue((resource.type as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.[0]),
    [RegulatedAuthorizationClaim.Region]: codingToValue((resource.region as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [RegulatedAuthorizationClaim.Status]: (resource.status as { coding?: Array<{ code?: string }> } | undefined)?.coding?.[0]?.code,
    [RegulatedAuthorizationClaim.StatusDate]: resource.statusDate as string | undefined,
    [RegulatedAuthorizationClaim.ValidityStart]: (resource.validityPeriod as { start?: string } | undefined)?.start,
    [RegulatedAuthorizationClaim.ValidityEnd]: (resource.validityPeriod as { end?: string } | undefined)?.end,
    [RegulatedAuthorizationClaim.Basis]: codingToValue((resource.basis as Array<{ coding?: Array<{ system?: string; code?: string }> }> | undefined)?.[0]?.coding?.[0]),
    [RegulatedAuthorizationClaim.Holder]: referenceToValue(resource.holder as { reference?: string } | undefined),
    [RegulatedAuthorizationClaim.Regulator]: referenceToValue(resource.regulator as { reference?: string } | undefined),
  }
}
