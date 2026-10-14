import type { ClaimSpec } from './claims/claim-types.js'

/** Canonical code-system URIs used by neutral Observation contracts. */
export const FhirCodeSystem = Object.freeze({
  Loinc: 'http://loinc.org',
  Ucum: 'http://unitsofmeasure.org',
  ObservationCategory: 'http://terminology.hl7.org/CodeSystem/observation-category',
} as const)

export type CodingDescriptor = Readonly<{
  system: string
  code: string
  display?: string
  claim: string
}>

function defineCoding(system: string, code: string, display?: string): CodingDescriptor {
  return Object.freeze({ system, code, display, claim: `${system}|${code}` })
}

/** Canonical HL7 Observation category descriptors. */
export const ObservationCategoryCodes = Object.freeze({
  SocialHistory: defineCoding(FhirCodeSystem.ObservationCategory, 'social-history', 'Social History'),
  VitalSigns: defineCoding(FhirCodeSystem.ObservationCategory, 'vital-signs', 'Vital Signs'),
  Imaging: defineCoding(FhirCodeSystem.ObservationCategory, 'imaging', 'Imaging'),
  Laboratory: defineCoding(FhirCodeSystem.ObservationCategory, 'laboratory', 'Laboratory'),
  Procedure: defineCoding(FhirCodeSystem.ObservationCategory, 'procedure', 'Procedure'),
  Survey: defineCoding(FhirCodeSystem.ObservationCategory, 'survey', 'Survey'),
  Exam: defineCoding(FhirCodeSystem.ObservationCategory, 'exam', 'Exam'),
  Therapy: defineCoding(FhirCodeSystem.ObservationCategory, 'therapy', 'Therapy'),
  Activity: defineCoding(FhirCodeSystem.ObservationCategory, 'activity', 'Activity'),
} as const)

/**
 * Canonical flat claim keys for Observation authoring and projection.
 *
 * The `component-*` and `bp-*` keys are read-only migration inputs. They are
 * not FHIR SearchParameters and must never be emitted by a current writer.
 */
export const ObservationClaim = Object.freeze({
  BasedOn: 'Observation.based-on',
  Category: 'Observation.category',
  CodeSystem: 'Observation.code-system',
  CodeValue: 'Observation.code-value',
  CodeText: 'Observation.code-text',
  CodeTextLocal: 'Observation.code-text',
  CodeDisplay: 'Observation.code-display',
  Code: 'Observation.code',
  Date: 'Observation.date',
  Device: 'Observation.device',
  DerivedFrom: 'Observation.derived-from',
  Encounter: 'Observation.encounter',
  Focus: 'Observation.focus',
  HasMember: 'Observation.has-member',
  ComponentTags: 'Observation.component-tags',
  ComponentCodeValues: 'Observation.component-code-values',
  ComponentNames: 'Observation.component-names',
  Identifier: 'Observation.identifier',
  Language: 'Observation.language',
  Method: 'Observation.method',
  Patient: 'Observation.patient',
  Performer: 'Observation.performer',
  Specimen: 'Observation.specimen',
  Status: 'Observation.status',
  Subject: 'Observation.subject',
  ValueConcept: 'Observation.value-concept',
  ValueConceptSystem: 'Observation.value-concept-system',
  ValueConceptValue: 'Observation.value-concept-value',
  ValueConceptText: 'Observation.value-concept-text',
  ValueConceptDisplay: 'Observation.value-concept-display',
  ValueDate: 'Observation.value-date',
  ValueQuantityComparator: 'Observation.value-quantity-comparator',
  ValueQuantityNumber: 'Observation.value-quantity-number',
  ValueQuantityUnit: 'Observation.value-quantity-unit',
  ReferenceRangeLowNumber: 'Observation.reference-range-low-number',
  ReferenceRangeHighNumber: 'Observation.reference-range-high-number',
  ReferenceRangeUnit: 'Observation.reference-range-unit',
  ReferenceRangeText: 'Observation.reference-range-text',
  ComponentCode: 'Observation.component-code',
  ComponentCodeDisplay: 'Observation.component-code-display',
  ComponentValueQuantityNumber: 'Observation.component-value-quantity-number',
  ComponentValueQuantityUnit: 'Observation.component-value-quantity-unit',
  ScoreTotalNumber: 'Observation.score-total-number',
  BloodPressureSystolicNumber: 'Observation.bp-systolic-number',
  BloodPressureDiastolicNumber: 'Observation.bp-diastolic-number',
  ValueString: 'Observation.value-string',
  Note: 'Observation.note',
  EffectiveDateTime: 'Observation.effective-datetime',
  /** FHIR EventTiming bucket used by recurring morning/evening capture. */
  DateWhen: 'Observation.date-when',
  /** @deprecated Read-only camelCase key from historical persisted rows. */
  EffectiveDateTimeLegacy: 'Observation.effectiveDateTime',
  /** Custom provenance flag for an explicitly entered or selected result. */
  UserSelected: 'Observation.user-selected',
} as const)

export type ObservationClaimKey = typeof ObservationClaim[keyof typeof ObservationClaim]

/**
 * Reads historical JSON-array and comma-separated component claims.
 * Compatibility input is normalized in memory and never emitted again.
 */
export function decodeObservationClaimList(value: string | undefined): readonly unknown[] {
  if (!value) return Object.freeze([])
  const normalized = value.trim()
  if (!normalized) return Object.freeze([])
  if (normalized.startsWith('[')) {
    const parsed: unknown = JSON.parse(normalized)
    if (!Array.isArray(parsed)) throw new TypeError('observation_claim_list_invalid')
    return Object.freeze(parsed)
  }
  return Object.freeze(normalized.split(',').map(item => item.trim()))
}
export type SplitCodingClaims = Readonly<{
  system?: string;
  value?: string;
  text?: string;
  display?: string;
}>;

/**
 * Builds the legacy compact `system|code` token from split claims.
 *
 * Use this only for compatibility/export. Frontend authoring should prefer the
 * split fields such as `code-value`, `code-text`, and `value-concept-value`.
 */
export function buildObservationCodingClaim(input: SplitCodingClaims): string | undefined {
  const value = String(input.value || '').trim();
  const system = String(input.system || '').trim();
  if (!value) return undefined;
  return system ? `${system}|${value}` : value;
}

/**
 * Splits a compact token such as `http://loinc.org|8867-4` into separate
 * claims that are easier for forms, local storage, and numeric/text filters.
 */
export function splitObservationCodingClaim(value: unknown): SplitCodingClaims {
  const token = String(value || '').trim();
  if (!token) {
    return {};
  }
  const separatorIndex = token.indexOf('|');
  if (separatorIndex < 0) {
    return { value: token };
  }
  return {
    system: token.slice(0, separatorIndex) || undefined,
    value: token.slice(separatorIndex + 1) || undefined,
  };
}

/**
 * Reduced claim surface that mirrors FHIR `Observation.component`.
 *
 * By design this shape does not include `status`, `subject`, or other
 * top-level Observation context fields from FHIR. When a component needs to be
 * persisted/indexed locally, the transformer may add only the minimum
 * operational fields (`identifier`, `subject`) in a separate indexed shape.
 */
export interface ClaimsObservationComponent {
  /** Code system URL. Example: `http://loinc.org`. The SDK can derive the compact token from this and `code-value`. */
  [ObservationClaim.CodeSystem]?: string;
  /** Code value. Example: `8480-6`. This is the main code field for UI authoring and search. */
  [ObservationClaim.CodeValue]?: string;
  /** Local-language human label used by forms. Example: `Presión arterial sistólica`. */
  [ObservationClaim.CodeText]?: string;
  /** Canonical English/international display. Example: `Systolic blood pressure`. */
  [ObservationClaim.CodeDisplay]?: string;
  /** Component/observation code as `system|code`. Example: `http://loinc.org|8480-6`. */
  [ObservationClaim.Code]?: string;
  /** Value concept system URL. Example: `http://terminology.hl7.org/CodeSystem/data-absent-reason`. */
  [ObservationClaim.ValueConceptSystem]?: string;
  /** Value concept code value. Example: `not-performed`. */
  [ObservationClaim.ValueConceptValue]?: string;
  /** Local-language label for the value concept. Example: `No realizado`. */
  [ObservationClaim.ValueConceptText]?: string;
  /** Canonical English/international display for the value concept. Example: `Not performed`. */
  [ObservationClaim.ValueConceptDisplay]?: string;
  /** Value as coded concept token. Example: `http://terminology.hl7.org/CodeSystem/data-absent-reason|not-performed`. */
  [ObservationClaim.ValueConcept]?: string;
  /** Value when the observation result itself is one date/dateTime. Example: `2026-06-01T10:00:00Z`. */
  [ObservationClaim.ValueDate]?: string;
  /** Free-text value when the result is narrative rather than coded/quantified. Example: `Former smoker`. */
  [ObservationClaim.ValueString]?: string;
  /** Optional FHIR Quantity comparator. Allowed values: `<`, `<=`, `>=`, `>`. Example: `>=`. */
  [ObservationClaim.ValueQuantityComparator]?: string;
  /** Numeric scalar of the observed value. Example heart rate: `72`. Example temperature: `38.4`. */
  [ObservationClaim.ValueQuantityNumber]?: string | number;
  /** Human-readable quantity unit. Example: `/min`, `mmHg`, `Cel`. */
  [ObservationClaim.ValueQuantityUnit]?: string;
}

/**
 * Reduced component claims after local indexing adds only the minimal locator
 * information required by vault persistence and parent/child traversal.
 */
export interface ClaimsObservationComponentIndexed extends ClaimsObservationComponent {
  /** Synthetic/local identifier added during indexing of a reduced imported component. Example: `bp-systolic-1`. */
  [ObservationClaim.Identifier]: string;
  /** Subject inherited from the parent observation so the reduced row can be indexed and located locally. */
  [ObservationClaim.Subject]: string;
  /** Optional compatibility alias of `Observation.subject`. */
  [ObservationClaim.Patient]?: string;
}

/**
 * Minimal visible Vital Signs Observation claims.
 *
 * This is the practical authoring/search surface for local-first individual
 * apps. A row without `Observation.status` is not considered a visible vital
 * sign result and should be ignored by normal section list/search operations.
 */
export interface ClaimsObservationVitalSigns extends ClaimsObservationComponentIndexed {
  /** Required for visible/searchable vital signs. If missing, treat the row as internal/supporting only. Example: `final`. */
  [ObservationClaim.Status]: string;
  /** Must contain the vital-signs category token for visible Vital Signs rows. */
  [ObservationClaim.Category]: string;
  /** Vital Sign LOINC code. Example heart rate: `http://loinc.org|8867-4`. */
  [ObservationClaim.Code]: string;
  /** Clinical time of the observation when represented as one scalar date/dateTime. */
  [ObservationClaim.Date]?: string;
  /** FHIR-compatible explicit `effectiveDateTime` fallback. Example: `2026-06-01T10:00:00Z`. */
  [ObservationClaim.EffectiveDateTime]?: string;
  /** Language of authored text/narrative. Example: `en`, `es`. */
  [ObservationClaim.Language]?: string;
  /** Observation method token when relevant. Example: `http://snomed.info/sct|252465000`. */
  [ObservationClaim.Method]?: string;
  /** User-authored note. Example: `Measured after resting 5 minutes.` */
  [ObservationClaim.Note]?: string;
}

/**
 * General Observation claims for persisted/searchable clinical resources.
 *
 * This is the widest flat contract currently used by the package. It extends
 * the Vital Signs-visible shape so consumers can reuse one traversal/query
 * model while adding broader Observation fields such as encounter, performer,
 * specimen, focus, and group membership.
 */
export interface ClaimsObservationGeneral extends ClaimsObservationVitalSigns {
  /** Upstream order/request reference list. Example: `ServiceRequest/sr-1`. */
  [ObservationClaim.BasedOn]?: string;
  /** Device reference. Example: `Device/dev-1`. */
  [ObservationClaim.Device]?: string;
  /** Encounter reference. Example: `Encounter/enc-1`. */
  [ObservationClaim.Encounter]?: string;
  /** Focus reference list when the observation is about another target. Example: `Condition/cond-1`. */
  [ObservationClaim.Focus]?: string;
  /** Child Observation references for panels/groups. Example: `Observation/hr-1,Observation/temp-1`. */
  [ObservationClaim.HasMember]?: string;
  /** Synthetic tags summarizing component presence on a composite observation. Example: `bp-systolic,bp-diastolic`. */
  [ObservationClaim.ComponentTags]?: string;
  /** Component code values summarized on the parent observation. Example: `8480-6,8462-4`. */
  [ObservationClaim.ComponentCodeValues]?: string;
  /** Human-readable component names summarized on the parent observation. Example: `Systolic blood pressure,Diastolic blood pressure`. */
  [ObservationClaim.ComponentNames]?: string;
  /** Performer reference list. Example: `Practitioner/prac-1`. */
  [ObservationClaim.Performer]?: string;
  /** Specimen reference. Example: `Specimen/spec-1`. */
  [ObservationClaim.Specimen]?: string;
  /** Total assessment score summarized on the parent observation when applicable. Example: `8`. */
  [ObservationClaim.ScoreTotalNumber]?: string | number;
  /** Parent blood pressure panel copy of the systolic numeric value. Example: `120`. */
  [ObservationClaim.BloodPressureSystolicNumber]?: string | number;
  /** Parent blood pressure panel copy of the diastolic numeric value. Example: `78`. */
  [ObservationClaim.BloodPressureDiastolicNumber]?: string | number;
}

/**
 * Backwards-compatible alias kept during the current refactor.
 *
 * Prefer `ClaimsObservationVitalSigns` in new code when the row is expected to
 * be one visible/searchable vital-sign Observation.
 */
export type ClaimsVitalSign = ClaimsObservationVitalSigns;

/**
 * Full persisted claim surface for a general Observation row in local storage.
 *
 * This list is intentionally broader than the searchable/indexable subset.
 * Free-text or UI-only fields may exist here even when they must stay out of
 * blind-query/search indexes.
 */
export const ObservationGeneralClaimsList = [
  ObservationClaim.BasedOn,
  ObservationClaim.Category,
  ObservationClaim.CodeSystem,
  ObservationClaim.CodeValue,
  ObservationClaim.CodeText,
  ObservationClaim.CodeDisplay,
  ObservationClaim.Code,
  ObservationClaim.Date,
  ObservationClaim.Device,
  ObservationClaim.Encounter,
  ObservationClaim.EffectiveDateTime,
  ObservationClaim.Focus,
  ObservationClaim.HasMember,
  ObservationClaim.ComponentTags,
  ObservationClaim.ComponentCodeValues,
  ObservationClaim.ComponentNames,
  ObservationClaim.Identifier,
  ObservationClaim.Language,
  ObservationClaim.Method,
  ObservationClaim.Note,
  ObservationClaim.Patient,
  ObservationClaim.Performer,
  ObservationClaim.Specimen,
  ObservationClaim.Status,
  ObservationClaim.Subject,
  ObservationClaim.ValueConceptSystem,
  ObservationClaim.ValueConceptValue,
  ObservationClaim.ValueConceptText,
  ObservationClaim.ValueConceptDisplay,
  ObservationClaim.ValueConcept,
  ObservationClaim.ValueDate,
  ObservationClaim.ValueQuantityComparator,
  ObservationClaim.ValueQuantityNumber,
  ObservationClaim.ValueQuantityUnit,
  ObservationClaim.ScoreTotalNumber,
  ObservationClaim.BloodPressureSystolicNumber,
  ObservationClaim.BloodPressureDiastolicNumber,
  ObservationClaim.ValueString,
] as const;

/**
 * Full persisted claim surface for visible/searchable Vital Signs rows.
 *
 * This keeps the claims-first authoring fields but still avoids introducing
 * fields that only belong to broader Observation families.
 */
export const ObservationVitalSignsClaimsList = [
  ObservationClaim.Category,
  ObservationClaim.CodeSystem,
  ObservationClaim.CodeValue,
  ObservationClaim.CodeText,
  ObservationClaim.CodeDisplay,
  ObservationClaim.Code,
  ObservationClaim.Date,
  ObservationClaim.EffectiveDateTime,
  ObservationClaim.HasMember,
  ObservationClaim.ComponentTags,
  ObservationClaim.ComponentCodeValues,
  ObservationClaim.ComponentNames,
  ObservationClaim.Identifier,
  ObservationClaim.Language,
  ObservationClaim.Method,
  ObservationClaim.Note,
  ObservationClaim.Patient,
  ObservationClaim.Status,
  ObservationClaim.Subject,
  ObservationClaim.ValueConceptSystem,
  ObservationClaim.ValueConceptValue,
  ObservationClaim.ValueConceptText,
  ObservationClaim.ValueConceptDisplay,
  ObservationClaim.ValueConcept,
  ObservationClaim.ValueDate,
  ObservationClaim.ValueQuantityComparator,
  ObservationClaim.ValueQuantityNumber,
  ObservationClaim.ValueQuantityUnit,
  ObservationClaim.ScoreTotalNumber,
  ObservationClaim.BloodPressureSystolicNumber,
  ObservationClaim.BloodPressureDiastolicNumber,
  ObservationClaim.ValueString,
] as const;

export const ObservationClaimSpecs: ClaimSpec[] = [
  { key: ObservationClaim.BasedOn, meaning: 'Order or request that originated the observation.', example: 'ServiceRequest/sr-1' },
  { key: ObservationClaim.Category, meaning: 'Observation category token.', example: 'http://terminology.hl7.org/CodeSystem/observation-category|vital-signs' },
  { key: ObservationClaim.CodeSystem, meaning: 'Observation code system URL for UI/storage normalization.', example: 'http://loinc.org' },
  { key: ObservationClaim.CodeValue, meaning: 'Observation code value used for UI editing and search.', example: '8867-4' },
  { key: ObservationClaim.CodeText, meaning: 'Local-language label shown to the user.', example: 'Heart rate' },
  { key: ObservationClaim.CodeDisplay, meaning: 'Canonical English/international code display.', example: 'Heart rate' },
  { key: ObservationClaim.Code, meaning: 'Observation code token.', example: 'http://loinc.org|8480-6' },
  { key: ObservationClaim.Date, meaning: 'Observation effective or issued date/time.', example: '2026-06-01T10:00:00Z' },
  { key: ObservationClaim.Device, meaning: 'Device reference.', example: 'Device/dev-1' },
  { key: ObservationClaim.Encounter, meaning: 'Encounter reference.', example: 'Encounter/enc-1' },
  { key: ObservationClaim.Focus, meaning: 'Focus reference.', example: 'Condition/cond-1' },
  { key: ObservationClaim.HasMember, meaning: 'Member observation references (CSV).', example: 'Observation/obs-2,Observation/obs-3' },
  { key: ObservationClaim.ComponentTags, meaning: 'Synthetic component tags summarized on the parent observation.', example: 'bp-systolic,bp-diastolic' },
  { key: ObservationClaim.ComponentCodeValues, meaning: 'Component code values summarized on the parent observation.', example: '8480-6,8462-4' },
  { key: ObservationClaim.ComponentNames, meaning: 'Human-readable component names summarized on the parent observation.', example: 'Systolic blood pressure,Diastolic blood pressure' },
  { key: ObservationClaim.Identifier, meaning: 'Business identifier.', example: 'obs-001' },
  { key: ObservationClaim.Language, meaning: 'BCP-47 language of the observation content.', example: 'en' },
  { key: ObservationClaim.Method, meaning: 'Observation method token.', example: 'http://snomed.info/sct|252465000' },
  { key: ObservationClaim.Patient, meaning: 'Patient reference.', example: 'did:web:patient.example.org' },
  { key: ObservationClaim.Performer, meaning: 'Performer references (CSV).', example: 'Practitioner/prac-1' },
  { key: ObservationClaim.Specimen, meaning: 'Specimen reference.', example: 'Specimen/spec-1' },
  { key: ObservationClaim.Status, meaning: 'Observation status.', example: 'final' },
  { key: ObservationClaim.Subject, meaning: 'Canonical subject reference.', example: 'did:web:patient.example.org' },
  { key: ObservationClaim.ValueConceptSystem, meaning: 'Value concept system URL for UI/storage normalization.', example: 'http://snomed.info/sct' },
  { key: ObservationClaim.ValueConceptValue, meaning: 'Value concept code value used for UI editing and filters.', example: '373066001' },
  { key: ObservationClaim.ValueConceptText, meaning: 'Local-language label for the coded value.', example: 'Never smoker' },
  { key: ObservationClaim.ValueConceptDisplay, meaning: 'Canonical English/international display for the coded value.', example: 'Never smoker' },
  { key: ObservationClaim.ValueConcept, meaning: 'Value concept token.', example: 'http://snomed.info/sct|266919005' },
  { key: ObservationClaim.ValueDate, meaning: 'Value date.', example: '2026-06-01' },
  { key: ObservationClaim.ValueQuantityComparator, meaning: 'Optional FHIR Quantity comparator.', example: '>=' },
  { key: ObservationClaim.ValueQuantityNumber, meaning: 'Observation value quantity numeric scalar.', example: '72' },
  { key: ObservationClaim.ValueQuantityUnit, meaning: 'Observation value quantity unit token or display.', example: 'http://unitsofmeasure.org|/min' },
  { key: ObservationClaim.ScoreTotalNumber, meaning: 'Aggregated assessment score total for the parent observation when present.', example: '8' },
  { key: ObservationClaim.BloodPressureSystolicNumber, meaning: 'Parent blood pressure panel copy of the systolic numeric value.', example: '120' },
  { key: ObservationClaim.BloodPressureDiastolicNumber, meaning: 'Parent blood pressure panel copy of the diastolic numeric value.', example: '78' },
  { key: ObservationClaim.ValueString, meaning: 'Value string.', example: 'Former smoker' },
  { key: ObservationClaim.Note, meaning: 'Clinical note text.', example: 'Patient seated for 5 minutes before measurement.' },
  { key: ObservationClaim.EffectiveDateTime, meaning: 'FHIR-compatible effectiveDateTime fallback.', example: '2026-06-01T10:00:00Z' },
];

/**
 * Returns `true` when the flat claims represent one visible/searchable vital
 * sign Observation row.
 *
 * Current rule:
 * - must be categorized as `vital-signs`
 * - must carry `Observation.status`
 *
 * Reduced indexed component rows derived from FHIR `component` intentionally do
 * not carry `Observation.status`, so they are excluded from normal UI list and
 * search results even though they remain persisted for reconstruction/export.
 */
export function isDisplayableVitalSignObservationClaims(claims: Record<string, unknown> | undefined): boolean {
  if (!claims || typeof claims !== 'object') {
    return false;
  }

  const status = String(claims[ObservationClaim.Status] || '').trim();
  const category = String(claims[ObservationClaim.Category] || '').trim();
  return Boolean(status) && category
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .includes(ObservationCategoryCodes.VitalSigns.claim);
}
