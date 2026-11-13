/** Published FHIR R5 vocabulary; R4 adapters must apply their own version constraints.
 * https://hl7.org/fhir/R5/valueset-issue-type.html
 * https://hl7.org/fhir/R5/valueset-issue-severity.html
 */
export const FHIR_ISSUE_TYPE_SYSTEM = 'http://hl7.org/fhir/issue-type' as const
export const FHIR_ISSUE_SEVERITY_SYSTEM = 'http://hl7.org/fhir/issue-severity' as const

export const IssueSeverity = Object.freeze({
  Fatal: 'fatal',
  Error: 'error',
  Warning: 'warning',
  Information: 'information',
  Success: 'success',
} as const)

export type IssueSeverityCode = typeof IssueSeverity[keyof typeof IssueSeverity]
export type IssueSeverityAttentionCode = typeof IssueSeverity.Error | typeof IssueSeverity.Warning
/** @deprecated Prefer the standard IssueSeverity name. */
export const IssueLevel = IssueSeverity
export type IssueLevel = IssueSeverityCode

export const IssueType = Object.freeze({
  Invalid: 'invalid',
  Structure: 'structure',
  Required: 'required',
  Value: 'value',
  Invariant: 'invariant',
  Security: 'security',
  Login: 'login',
  Unknown: 'unknown',
  Expired: 'expired',
  Forbidden: 'forbidden',
  Suppressed: 'suppressed',
  Processing: 'processing',
  NotSupported: 'not-supported',
  Duplicate: 'duplicate',
  MultipleMatches: 'multiple-matches',
  NotFound: 'not-found',
  Deleted: 'deleted',
  TooLong: 'too-long',
  CodeInvalid: 'code-invalid',
  Extension: 'extension',
  TooCostly: 'too-costly',
  BusinessRule: 'business-rule',
  Conflict: 'conflict',
  LimitedFilter: 'limited-filter',
  Transient: 'transient',
  LockError: 'lock-error',
  NoStore: 'no-store',
  Exception: 'exception',
  Timeout: 'timeout',
  Incomplete: 'incomplete',
  Throttled: 'throttled',
  Informational: 'informational',
  Success: 'success',
} as const)

export type IssueTypeCode = typeof IssueType[keyof typeof IssueType]
const severityCodes: ReadonlySet<string> = new Set(Object.values(IssueSeverity))
const issueCodes: ReadonlySet<string> = new Set(Object.values(IssueType))

export function isIssueSeverityCode(value: unknown): value is IssueSeverityCode {
  return typeof value === 'string' && severityCodes.has(value)
}

export function isIssueTypeCode(value: unknown): value is IssueTypeCode {
  return typeof value === 'string' && issueCodes.has(value)
}

/** Minimal native FHIR issue projection, not a persisted clinical data model. */
export interface OperationOutcomeDetails {
  severity: IssueSeverityCode
  code: IssueTypeCode
  diagnostics?: string
}

/** Minimal native exchange projection; consumers validate their selected FHIR version. */
export interface OperationOutcome {
  resourceType: 'OperationOutcome'
  issue: OperationOutcomeDetails[]
}
