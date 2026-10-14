import { ImagingStudyClaim } from '../claims/imaging-study-claims.js';
import {
  addClaimValues,
  getClaimValues,
  normalizeClaimScalar,
  removeClaimValues,
  setClaimValues,
  type GenericInteroperableClaims,
} from './claim-list-helpers.js';

export type ImagingStudyInteroperableClaims = GenericInteroperableClaims;

export function getImagingStudyClaimList(claims: ImagingStudyInteroperableClaims, claimKey: string): string[] {
  return getClaimValues(claims, claimKey);
}

export function setImagingStudyClaimList(claims: ImagingStudyInteroperableClaims, claimKey: string, values: string | readonly string[]): ImagingStudyInteroperableClaims {
  return setClaimValues(claims, claimKey, values);
}

export function addImagingStudyClaimList(claims: ImagingStudyInteroperableClaims, claimKey: string, values: string | readonly string[]): ImagingStudyInteroperableClaims {
  return addClaimValues(claims, claimKey, values);
}

export function removeImagingStudyClaimList(claims: ImagingStudyInteroperableClaims, claimKey: string, values: string | readonly string[]): ImagingStudyInteroperableClaims {
  return removeClaimValues(claims, claimKey, values);
}

export function getImagingStudyIdentifier(claims: ImagingStudyInteroperableClaims): string {
  return normalizeClaimScalar(claims[ImagingStudyClaim.Identifier]);
}

export function setImagingStudyIdentifier(claims: ImagingStudyInteroperableClaims, value: string): ImagingStudyInteroperableClaims {
  return { ...claims, [ImagingStudyClaim.Identifier]: normalizeClaimScalar(value) };
}
