import { DiagnosticReportClaim } from '../claims/diagnostic-report-claims.js';
import {
  addClaimValues,
  getClaimValues,
  normalizeClaimScalar,
  removeClaimValues,
  setClaimValues,
  type GenericInteroperableClaims,
} from './claim-list-helpers.js';

export type DiagnosticReportInteroperableClaims = GenericInteroperableClaims;

export function getDiagnosticReportClaimList(claims: DiagnosticReportInteroperableClaims, claimKey: string): string[] {
  return getClaimValues(claims, claimKey);
}

export function setDiagnosticReportClaimList(
  claims: DiagnosticReportInteroperableClaims,
  claimKey: string,
  values: string | readonly string[],
): DiagnosticReportInteroperableClaims {
  return setClaimValues(claims, claimKey, values);
}

export function addDiagnosticReportClaimList(
  claims: DiagnosticReportInteroperableClaims,
  claimKey: string,
  values: string | readonly string[],
): DiagnosticReportInteroperableClaims {
  return addClaimValues(claims, claimKey, values);
}

export function removeDiagnosticReportClaimList(
  claims: DiagnosticReportInteroperableClaims,
  claimKey: string,
  values: string | readonly string[],
): DiagnosticReportInteroperableClaims {
  return removeClaimValues(claims, claimKey, values);
}

export function getDiagnosticReportIdentifier(claims: DiagnosticReportInteroperableClaims): string {
  return normalizeClaimScalar(claims[DiagnosticReportClaim.Identifier]);
}

export function setDiagnosticReportIdentifier(claims: DiagnosticReportInteroperableClaims, value: string): DiagnosticReportInteroperableClaims {
  return { ...claims, [DiagnosticReportClaim.Identifier]: normalizeClaimScalar(value) };
}

export function getDiagnosticReportResultList(claims: DiagnosticReportInteroperableClaims): string[] {
  return getDiagnosticReportClaimList(claims, DiagnosticReportClaim.Result);
}

export function setDiagnosticReportResultList(
  claims: DiagnosticReportInteroperableClaims,
  values: string | readonly string[],
): DiagnosticReportInteroperableClaims {
  return setDiagnosticReportClaimList(claims, DiagnosticReportClaim.Result, values);
}

export function addDiagnosticReportResultList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  return addDiagnosticReportClaimList(claims, DiagnosticReportClaim.Result, values);
}

export function removeDiagnosticReportResultList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  return removeDiagnosticReportClaimList(claims, DiagnosticReportClaim.Result, values);
}

export function getDiagnosticReportPerformerList(claims: DiagnosticReportInteroperableClaims): string[] {
  return getDiagnosticReportClaimList(claims, DiagnosticReportClaim.Performer);
}

export function setDiagnosticReportPerformerList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  return setDiagnosticReportClaimList(claims, DiagnosticReportClaim.Performer, values);
}

export function addDiagnosticReportPerformerList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  return addDiagnosticReportClaimList(claims, DiagnosticReportClaim.Performer, values);
}

export function removeDiagnosticReportPerformerList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  return removeDiagnosticReportClaimList(claims, DiagnosticReportClaim.Performer, values);
}

export function getDiagnosticReportSpecimenList(claims: DiagnosticReportInteroperableClaims): string[] {
  return getDiagnosticReportClaimList(claims, DiagnosticReportClaim.Specimen);
}

export function setDiagnosticReportSpecimenList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  return setDiagnosticReportClaimList(claims, DiagnosticReportClaim.Specimen, values);
}

export function addDiagnosticReportSpecimenList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  return addDiagnosticReportClaimList(claims, DiagnosticReportClaim.Specimen, values);
}

export function removeDiagnosticReportSpecimenList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  return removeDiagnosticReportClaimList(claims, DiagnosticReportClaim.Specimen, values);
}

export function getDiagnosticReportContainedResourceReferenceList(claims: DiagnosticReportInteroperableClaims): string[] {
  const canonical = getDiagnosticReportClaimList(claims, DiagnosticReportClaim.ContainedReferenceList);
  const legacy = getDiagnosticReportClaimList(claims, DiagnosticReportClaim.ContainedDocuments);
  return [...new Set([...canonical, ...legacy].map((item) => String(item || '').trim()).filter(Boolean))];
}

export function setDiagnosticReportContainedResourceReferenceList(
  claims: DiagnosticReportInteroperableClaims,
  values: string | readonly string[],
): DiagnosticReportInteroperableClaims {
  const next = setDiagnosticReportClaimList(claims, DiagnosticReportClaim.ContainedReferenceList, values);
  const cleaned = {
    ...next,
  };
  delete cleaned[DiagnosticReportClaim.ContainedDocuments];
  return cleaned;
}

export function addDiagnosticReportContainedResourceReferenceList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  return setDiagnosticReportContainedResourceReferenceList(claims, [
    ...getDiagnosticReportContainedResourceReferenceList(claims),
    ...(Array.isArray(values) ? values : [values]),
  ]);
}

export function removeDiagnosticReportContainedResourceReferenceList(claims: DiagnosticReportInteroperableClaims, values: string | readonly string[]): DiagnosticReportInteroperableClaims {
  const removals = new Set(Array.isArray(values) ? values : [values]);
  return setDiagnosticReportContainedResourceReferenceList(
    claims,
    getDiagnosticReportContainedResourceReferenceList(claims).filter(value => !removals.has(value)),
  );
}

/** @deprecated Use `getDiagnosticReportContainedResourceReferenceList`. */
export function getDiagnosticReportContainedDocumentIdentifierList(claims: DiagnosticReportInteroperableClaims): string[] {
  return getDiagnosticReportContainedResourceReferenceList(claims);
}

/** @deprecated Use `setDiagnosticReportContainedResourceReferenceList`. */
export function setDiagnosticReportContainedDocumentIdentifierList(
  claims: DiagnosticReportInteroperableClaims,
  values: string | readonly string[],
): DiagnosticReportInteroperableClaims {
  return setDiagnosticReportContainedResourceReferenceList(claims, values);
}
