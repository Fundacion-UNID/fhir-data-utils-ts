import type { ClaimSpec } from './claim-types.js'

/** Canonical flat claims for the FHIR R5 RegulatedAuthorization resource. */
export const RegulatedAuthorizationClaim = {
  Identifier: 'RegulatedAuthorization.identifier',
  Subject: 'RegulatedAuthorization.subject',
  Type: 'RegulatedAuthorization.type',
  Region: 'RegulatedAuthorization.region',
  Status: 'RegulatedAuthorization.status',
  StatusDate: 'RegulatedAuthorization.status-date',
  ValidityStart: 'RegulatedAuthorization.validity-start',
  ValidityEnd: 'RegulatedAuthorization.validity-end',
  Basis: 'RegulatedAuthorization.basis',
  Holder: 'RegulatedAuthorization.holder',
  Regulator: 'RegulatedAuthorization.regulator',
} as const

export type RegulatedAuthorizationClaimKey = typeof RegulatedAuthorizationClaim[keyof typeof RegulatedAuthorizationClaim]

export const RegulatedAuthorizationClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: RegulatedAuthorizationClaim.Identifier, meaning: 'Identifier assigned by the authorizing body.', example: 'authorization-1' },
  { key: RegulatedAuthorizationClaim.Subject, meaning: 'Authorized product type, facility or activity reference.', example: 'Location/location-1' },
  { key: RegulatedAuthorizationClaim.Type, meaning: 'Authorization type coding token.', example: 'https://example.invalid/codes|operation' },
  { key: RegulatedAuthorizationClaim.Region, meaning: 'Jurisdiction coding token.', example: 'urn:iso:std:iso:3166|CA' },
  { key: RegulatedAuthorizationClaim.Status, meaning: 'Authorization publication status.', example: 'active' },
  { key: RegulatedAuthorizationClaim.StatusDate, meaning: 'Date the status was assigned.', example: '2026-09-29T16:00:00Z' },
  { key: RegulatedAuthorizationClaim.ValidityStart, meaning: 'Authorization validity start.', example: '2026-09-29' },
  { key: RegulatedAuthorizationClaim.ValidityEnd, meaning: 'Authorization validity end.', example: '2027-09-29' },
  { key: RegulatedAuthorizationClaim.Basis, meaning: 'Regulatory basis coding token.', example: 'https://example.invalid/codes|installed-device' },
  { key: RegulatedAuthorizationClaim.Holder, meaning: 'Organization granted the authorization.', example: 'Organization/holder-1' },
  { key: RegulatedAuthorizationClaim.Regulator, meaning: 'Regulatory authority granting the authorization.', example: 'Organization/regulator-1' },
])
