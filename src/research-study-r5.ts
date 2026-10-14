/**
 * Browser-safe FHIR R5 ResearchStudy flat-claim contract.
 *
 * The standard catalogue is copied from the R5 SearchParameter definitions,
 * not inferred from similarly named resource elements. In particular, the
 * `date` SearchParameter targets `ResearchStudy.period`, not the publication
 * date element. Associated-party projections are indexed separately because
 * base R5 defines no ResearchStudy party SearchParameter.
 *
 * @see https://hl7.org/fhir/R5/researchstudy.html
 * @see https://hl7.org/fhir/R5/researchstudy-search.html
 */

export const ResearchStudyR5Version = '5.0.0' as const

/**
 * Immutable codes defined by the FHIR R5 5.0.0 ResearchStudy party-role code
 * system. The element binding remains extensible; this catalogue is the closed
 * set a portal may offer by default, not a validator for every conformant
 * external Coding.
 *
 * @see https://hl7.org/fhir/R5/codesystem-research-study-party-role.html
 */
export const ResearchStudyR5PartyRoleSystem = 'http://hl7.org/fhir/research-study-party-role' as const

export const ResearchStudyR5PartyRoleCodes = Object.freeze([
  'sponsor',
  'lead-sponsor',
  'sponsor-investigator',
  'primary-investigator',
  'collaborator',
  'funding-source',
  'general-contact',
  'recruitment-contact',
  'sub-investigator',
  'study-director',
  'study-chair',
  'irb',
] as const)

export type ResearchStudyR5PartyRoleCode = (typeof ResearchStudyR5PartyRoleCodes)[number]

export const ResearchStudyAssociatedPartyBindings = Object.freeze({
  role: Object.freeze({
    valueSet: 'http://hl7.org/fhir/ValueSet/research-study-party-role',
    strength: 'extensible',
  }),
  classifier: Object.freeze({
    valueSet: 'http://hl7.org/fhir/ValueSet/research-study-party-organization-type',
    strength: 'example',
  }),
} as const)

export type ResearchStudySearchParameterType =
  | 'composite'
  | 'date'
  | 'number'
  | 'reference'
  | 'string'
  | 'token'

export type ResearchStudyR5SearchParameter = Readonly<{
  code: string
  type: ResearchStudySearchParameterType
  expression: string
  components: readonly string[]
}>

const searchParameter = (
  code: string,
  type: ResearchStudySearchParameterType,
  expression: string,
  components: readonly string[] = [],
): ResearchStudyR5SearchParameter => Object.freeze({
  code,
  type,
  expression,
  components: Object.freeze([...components]),
})

/** Exact resource-specific SearchParameters published by FHIR R5 5.0.0. */
export const ResearchStudyR5SearchParameterCatalog: readonly ResearchStudyR5SearchParameter[] = Object.freeze([
  searchParameter('classifier', 'token', 'ResearchStudy.classifier'),
  searchParameter('condition', 'token', 'ResearchStudy.condition'),
  searchParameter('date', 'date', 'ResearchStudy.period'),
  searchParameter('description', 'string', 'ResearchStudy.description'),
  searchParameter('eligibility', 'reference', 'ResearchStudy.recruitment.eligibility'),
  searchParameter('focus-code', 'token', 'ResearchStudy.focus.concept'),
  searchParameter('focus-reference', 'reference', 'ResearchStudy.focus.reference'),
  searchParameter('identifier', 'token', 'ResearchStudy.identifier'),
  searchParameter('keyword', 'token', 'ResearchStudy.keyword'),
  searchParameter('name', 'string', 'ResearchStudy.name'),
  searchParameter('objective-description', 'string', 'ResearchStudy.objective.description'),
  searchParameter('objective-type', 'token', 'ResearchStudy.objective.type'),
  searchParameter('part-of', 'reference', 'ResearchStudy.partOf'),
  searchParameter('phase', 'token', 'ResearchStudy.phase'),
  searchParameter('progress-status-state-actual', 'composite', 'ResearchStudy.progressStatus', [
    'http://hl7.org/fhir/SearchParameter/ResearchStudy-state',
    'http://hl7.org/fhir/SearchParameter/ResearchStudy-actual',
  ]),
  searchParameter('progress-status-state-period', 'composite', 'ResearchStudy.progressStatus', [
    'http://hl7.org/fhir/SearchParameter/ResearchStudy-state',
    'http://hl7.org/fhir/SearchParameter/ResearchStudy-period',
  ]),
  searchParameter('progress-status-state-period-actual', 'composite', 'ResearchStudy.progressStatus', [
    'http://hl7.org/fhir/SearchParameter/ResearchStudy-state',
    'http://hl7.org/fhir/SearchParameter/ResearchStudy-period',
    'http://hl7.org/fhir/SearchParameter/ResearchStudy-actual',
  ]),
  searchParameter('protocol', 'reference', 'ResearchStudy.protocol'),
  searchParameter('recruitment-actual', 'number', 'ResearchStudy.recruitment.actualNumber'),
  searchParameter('recruitment-target', 'number', 'ResearchStudy.recruitment.targetNumber'),
  searchParameter('region', 'token', 'ResearchStudy.region'),
  searchParameter('site', 'reference', 'ResearchStudy.site'),
  searchParameter('status', 'token', 'ResearchStudy.status'),
  searchParameter('study-design', 'token', 'ResearchStudy.studyDesign'),
  searchParameter('title', 'string', 'ResearchStudy.title'),
])

/** Canonical ResearchStudy flat-claim names. Never repeat these storage keys as literals. */
export const ResearchStudyClaim = Object.freeze({
  Classifier: 'ResearchStudy.classifier',
  Condition: 'ResearchStudy.condition',
  Date: 'ResearchStudy.date',
  Description: 'ResearchStudy.description',
  Eligibility: 'ResearchStudy.eligibility',
  FocusCode: 'ResearchStudy.focus-code',
  FocusReference: 'ResearchStudy.focus-reference',
  Identifier: 'ResearchStudy.identifier',
  Keyword: 'ResearchStudy.keyword',
  Name: 'ResearchStudy.name',
  ObjectiveDescription: 'ResearchStudy.objective-description',
  ObjectiveType: 'ResearchStudy.objective-type',
  PartOf: 'ResearchStudy.part-of',
  Phase: 'ResearchStudy.phase',
  ProgressStatusStateActual: 'ResearchStudy.progress-status-state-actual',
  ProgressStatusStatePeriod: 'ResearchStudy.progress-status-state-period',
  ProgressStatusStatePeriodActual: 'ResearchStudy.progress-status-state-period-actual',
  Protocol: 'ResearchStudy.protocol',
  RecruitmentActual: 'ResearchStudy.recruitment-actual',
  RecruitmentTarget: 'ResearchStudy.recruitment-target',
  Region: 'ResearchStudy.region',
  Site: 'ResearchStudy.site',
  Status: 'ResearchStudy.status',
  StudyDesign: 'ResearchStudy.study-design',
  Title: 'ResearchStudy.title',
  PartyName: 'ResearchStudy.party-name',
  PartyRole: 'ResearchStudy.party-role',
  PartyPeriodStart: 'ResearchStudy.party-period-start',
  PartyPeriodEnd: 'ResearchStudy.party-period-end',
  PartyClassifier: 'ResearchStudy.party-classifier',
  Party: 'ResearchStudy.party',
} as const)

const standardSearchClaims = Object.freeze([
  ResearchStudyClaim.Classifier, ResearchStudyClaim.Condition, ResearchStudyClaim.Date,
  ResearchStudyClaim.Description, ResearchStudyClaim.Eligibility, ResearchStudyClaim.FocusCode,
  ResearchStudyClaim.FocusReference, ResearchStudyClaim.Identifier, ResearchStudyClaim.Keyword,
  ResearchStudyClaim.Name, ResearchStudyClaim.ObjectiveDescription, ResearchStudyClaim.ObjectiveType,
  ResearchStudyClaim.PartOf, ResearchStudyClaim.Phase, ResearchStudyClaim.ProgressStatusStateActual,
  ResearchStudyClaim.ProgressStatusStatePeriod, ResearchStudyClaim.ProgressStatusStatePeriodActual,
  ResearchStudyClaim.Protocol, ResearchStudyClaim.RecruitmentActual, ResearchStudyClaim.RecruitmentTarget,
  ResearchStudyClaim.Region, ResearchStudyClaim.Site, ResearchStudyClaim.Status,
  ResearchStudyClaim.StudyDesign, ResearchStudyClaim.Title,
] as const)

const associatedPartyClaims = Object.freeze([
  ResearchStudyClaim.PartyName, ResearchStudyClaim.PartyRole, ResearchStudyClaim.PartyPeriodStart,
  ResearchStudyClaim.PartyPeriodEnd, ResearchStudyClaim.PartyClassifier, ResearchStudyClaim.Party,
] as const)

/**
 * Governed flat claims for ResearchStudy.
 *
 * `standardSearch` contains only official R5 SearchParameters. The
 * `associatedParty` list is an explicit operational projection of the R5
 * backbone element; none of those names is advertised as a standard search
 * parameter and `classifier` never carries CRUD or authorization policy.
 */
export const ResearchStudyFlatClaimCatalog = Object.freeze({
  standardSearch: standardSearchClaims,
  associatedParty: associatedPartyClaims,
  all: Object.freeze([...standardSearchClaims, ...associatedPartyClaims]),
})

export type ResearchStudyCoding = Readonly<{
  system?: string
  code?: string
  display?: string
}>

export type ResearchStudyCodeableConcept = Readonly<{
  coding?: readonly ResearchStudyCoding[]
  text?: string
}>

export type ResearchStudyPeriod = Readonly<{
  start?: string
  end?: string
}>

export type ResearchStudyAssociatedPartyReferenceType = 'Organization' | 'Practitioner' | 'PractitionerRole'

export type ResearchStudyAssociatedPartyReference = Readonly<{
  reference: string
  type?: ResearchStudyAssociatedPartyReferenceType
  display?: string
}>

export type ResearchStudyAssociatedParty = Readonly<{
  name?: string
  role: ResearchStudyCodeableConcept
  period?: readonly ResearchStudyPeriod[]
  classifier?: readonly ResearchStudyCodeableConcept[]
  party?: ResearchStudyAssociatedPartyReference
}>

export type ResearchStudyAssociatedPartyClaimProjection = Readonly<{
  /** The complete party is retained beside its derived claims to preserve correlation. */
  associatedParty: ResearchStudyAssociatedParty
  claims: Readonly<Record<(typeof associatedPartyClaims)[number], readonly string[]>>
}>

export type ResearchStudyR5SearchClaim = (typeof standardSearchClaims)[number]
export type ResearchStudyR5SearchClaims = Readonly<Partial<Record<ResearchStudyR5SearchClaim, readonly string[]>>>
export type ResearchStudyR5FlatClaimsResource = Readonly<{
  resourceType: 'ResearchStudy'
  id: string
  meta: Readonly<{ claims: Readonly<Record<string, readonly string[]>> }>
}>

/**
 * Projects the official resource-specific R5 SearchParameters from one native
 * ResearchStudy into flat `resource.meta.claims`. Composite values use FHIR's
 * `$` component separator; associatedParty remains a separate projection and
 * never becomes authorization data.
 *
 * @see https://hl7.org/fhir/R5/researchstudy-search.html
 */
export function projectResearchStudyR5SearchClaims(input: unknown): ResearchStudyR5SearchClaims {
  if (!isRecord(input) || input.resourceType !== 'ResearchStudy') {
    throw new TypeError('research_study_resource_invalid')
  }
  const claims: Partial<Record<ResearchStudyR5SearchClaim, readonly string[]>> = {}
  addClaim(claims, ResearchStudyClaim.Classifier, conceptsValue(input.classifier, 'research_study_classifier_invalid'))
  addClaim(claims, ResearchStudyClaim.Condition, conceptsValue(input.condition, 'research_study_condition_invalid'))
  addClaim(claims, ResearchStudyClaim.Date, periodValues(input.period, 'research_study_period_invalid'))
  addClaim(claims, ResearchStudyClaim.Description, strings(input.description))
  addClaim(claims, ResearchStudyClaim.Eligibility, references(input.recruitment, 'eligibility'))
  addClaim(claims, ResearchStudyClaim.FocusCode, codeableReferences(input.focus, 'concept'))
  addClaim(claims, ResearchStudyClaim.FocusReference, codeableReferences(input.focus, 'reference'))
  addClaim(claims, ResearchStudyClaim.Identifier, identifiers(input.identifier))
  addClaim(claims, ResearchStudyClaim.Keyword, conceptsValue(input.keyword, 'research_study_keyword_invalid'))
  addClaim(claims, ResearchStudyClaim.Name, strings(input.name))
  addClaim(claims, ResearchStudyClaim.ObjectiveDescription, backboneStrings(input.objective, 'description'))
  addClaim(claims, ResearchStudyClaim.ObjectiveType, backboneConcepts(input.objective, 'type'))
  addClaim(claims, ResearchStudyClaim.PartOf, references(input.partOf))
  addClaim(claims, ResearchStudyClaim.Phase, conceptsValue(input.phase, 'research_study_phase_invalid'))
  const progress = progressStatusValues(input.progressStatus)
  addClaim(claims, ResearchStudyClaim.ProgressStatusStateActual, progress.stateActual)
  addClaim(claims, ResearchStudyClaim.ProgressStatusStatePeriod, progress.statePeriod)
  addClaim(claims, ResearchStudyClaim.ProgressStatusStatePeriodActual, progress.statePeriodActual)
  addClaim(claims, ResearchStudyClaim.Protocol, references(input.protocol))
  addClaim(claims, ResearchStudyClaim.RecruitmentActual, nestedNumber(input.recruitment, 'actualNumber'))
  addClaim(claims, ResearchStudyClaim.RecruitmentTarget, nestedNumber(input.recruitment, 'targetNumber'))
  addClaim(claims, ResearchStudyClaim.Region, conceptsValue(input.region, 'research_study_region_invalid'))
  addClaim(claims, ResearchStudyClaim.Site, references(input.site))
  addClaim(claims, ResearchStudyClaim.Status, strings(input.status))
  addClaim(claims, ResearchStudyClaim.StudyDesign, conceptsValue(input.studyDesign, 'research_study_design_invalid'))
  addClaim(claims, ResearchStudyClaim.Title, strings(input.title))
  return Object.freeze(claims)
}

/**
 * Normalizes the R5 `associatedParty[]` backbone without flattening parties
 * into unrelated parallel arrays. This function validates data shape only; it
 * does not grant study access or interpret classifier values as permissions.
 */
export function normalizeResearchStudyAssociatedParties(input: unknown): readonly ResearchStudyAssociatedParty[] {
  if (!Array.isArray(input)) throw new TypeError('research_study_associated_parties_invalid')
  return Object.freeze(input.map((value, index) => normalizeAssociatedParty(value, index)))
}

/**
 * Produces one flat-claim map per associated party. Keeping the normalized
 * party beside each map preserves the party/role/period/classifier boundary
 * required when a later Bundle PATCH changes one party.
 */
export function projectResearchStudyAssociatedPartyClaims(
  input: unknown,
): readonly ResearchStudyAssociatedPartyClaimProjection[] {
  const parties = normalizeResearchStudyAssociatedParties(input)
  return Object.freeze(parties.map(party => Object.freeze({
    associatedParty: party,
    claims: Object.freeze({
      [ResearchStudyClaim.PartyName]: Object.freeze(party.name ? [party.name] : []),
      [ResearchStudyClaim.PartyRole]: Object.freeze(conceptValues([party.role])),
      [ResearchStudyClaim.PartyPeriodStart]: Object.freeze((party.period || []).flatMap(period => period.start ? [period.start] : [])),
      [ResearchStudyClaim.PartyPeriodEnd]: Object.freeze((party.period || []).flatMap(period => period.end ? [period.end] : [])),
      [ResearchStudyClaim.PartyClassifier]: Object.freeze(conceptValues(party.classifier || [])),
      [ResearchStudyClaim.Party]: Object.freeze(party.party ? [party.party.reference] : []),
    }),
  })))
}

/** Projects native-shaped study input to the claims-only GW persistence shape. */
export function projectResearchStudyR5FlatClaimsResource(input: unknown): ResearchStudyR5FlatClaimsResource {
  if (!isRecord(input) || input.resourceType !== 'ResearchStudy') throw new TypeError('research_study_resource_invalid')
  const id = fhirId(input.id, 'research_study_flat_resource_invalid')
  if (input.associatedParty !== undefined) throw new TypeError('research_study_parties_require_separate_resources')
  return normalizeResearchStudyR5FlatClaimsResource({
    resourceType: 'ResearchStudy',
    id,
    meta: { claims: projectResearchStudyR5SearchClaims(input) },
  })
}

/** Projects one correlated claims-only GW resource per associated party. */
export function projectResearchStudyAssociatedPartyFlatClaimResources(input: Readonly<{
  researchStudyId: string
  associatedParties: unknown
}>): readonly ResearchStudyR5FlatClaimsResource[] {
  const id = fhirId(input.researchStudyId, 'research_study_flat_resource_invalid')
  return Object.freeze(projectResearchStudyAssociatedPartyClaims(input.associatedParties).map(projection => {
    const claims = Object.fromEntries(Object.entries(projection.claims).filter(([, values]) => values.length > 0))
    return normalizeResearchStudyR5FlatClaimsResource({ resourceType: 'ResearchStudy', id, meta: { claims } })
  }))
}

/** Validates and freezes a claims-only ResearchStudy GW resource. */
export function normalizeResearchStudyR5FlatClaimsResource(input: unknown): ResearchStudyR5FlatClaimsResource {
  if (!isRecord(input)
    || input.resourceType !== 'ResearchStudy'
    || Object.keys(input).some(key => !['resourceType', 'id', 'meta'].includes(key))) {
    throw new TypeError('research_study_flat_resource_invalid')
  }
  const id = fhirId(input.id, 'research_study_flat_resource_invalid')
  if (!isRecord(input.meta) || !isRecord(input.meta.claims)) throw new TypeError('research_study_flat_resource_invalid')
  const claims: Record<string, readonly string[]> = {}
  for (const [name, rawValues] of Object.entries(input.meta.claims)) {
    if (!ResearchStudyFlatClaimCatalog.all.includes(name as never)
      || !Array.isArray(rawValues)
      || rawValues.length === 0
      || rawValues.some(value => typeof value !== 'string' || !value.trim())) {
      throw new TypeError('research_study_flat_claim_invalid')
    }
    claims[name] = Object.freeze(rawValues.map(value => value.trim()))
  }
  return Object.freeze({ resourceType: 'ResearchStudy', id, meta: Object.freeze({ claims: Object.freeze(claims) }) })
}

function normalizeAssociatedParty(value: unknown, index: number): ResearchStudyAssociatedParty {
  if (!isRecord(value)) throw new TypeError(`research_study_associated_party_${index}_invalid`)
  const role = normalizeConcept(value.role, `research_study_associated_party_${index}_role_required`)
  const name = optionalString(value.name)
  const period = value.period === undefined
    ? undefined
    : normalizePeriods(value.period, index)
  const classifier = value.classifier === undefined
    ? undefined
    : normalizeConcepts(value.classifier, `research_study_associated_party_${index}_classifier_invalid`)
  const party = value.party === undefined ? undefined : normalizePartyReference(value.party, index)
  return Object.freeze({
    ...(name ? { name } : {}),
    role,
    ...(period ? { period } : {}),
    ...(classifier ? { classifier } : {}),
    ...(party ? { party } : {}),
  })
}

function normalizeConcepts(value: unknown, error: string): readonly ResearchStudyCodeableConcept[] {
  if (!Array.isArray(value)) throw new TypeError(error)
  return Object.freeze(value.map(item => normalizeConcept(item, error)))
}

function normalizeConcept(value: unknown, error: string): ResearchStudyCodeableConcept {
  if (!isRecord(value)) throw new TypeError(error)
  const text = optionalString(value.text)
  let coding: readonly ResearchStudyCoding[] | undefined
  if (value.coding !== undefined) {
    if (!Array.isArray(value.coding)) throw new TypeError(error)
    coding = Object.freeze(value.coding.map(item => normalizeCoding(item, error)))
  }
  if (!text && (!coding || coding.length === 0 || !coding.some(item => item.code))) throw new TypeError(error)
  return Object.freeze({ ...(coding ? { coding } : {}), ...(text ? { text } : {}) })
}

function normalizeCoding(value: unknown, error: string): ResearchStudyCoding {
  if (!isRecord(value)) throw new TypeError(error)
  const system = optionalString(value.system)
  const code = optionalString(value.code)
  const display = optionalString(value.display)
  if (!code && !display) throw new TypeError(error)
  return Object.freeze({ ...(system ? { system } : {}), ...(code ? { code } : {}), ...(display ? { display } : {}) })
}

function normalizePeriods(value: unknown, index: number): readonly ResearchStudyPeriod[] {
  if (!Array.isArray(value)) throw new TypeError(`research_study_associated_party_${index}_period_invalid`)
  return Object.freeze(value.map(item => {
    if (!isRecord(item)) throw new TypeError(`research_study_associated_party_${index}_period_invalid`)
    const start = optionalString(item.start)
    const end = optionalString(item.end)
    if (!start && !end) throw new TypeError(`research_study_associated_party_${index}_period_invalid`)
    if ((start && !isFhirDateTime(start)) || (end && !isFhirDateTime(end))) {
      throw new TypeError(`research_study_associated_party_${index}_period_invalid`)
    }
    if (start && end && Date.parse(end) < Date.parse(start)) {
      throw new TypeError(`research_study_associated_party_${index}_period_invalid`)
    }
    return Object.freeze({ ...(start ? { start } : {}), ...(end ? { end } : {}) })
  }))
}

function normalizePartyReference(value: unknown, index: number): ResearchStudyAssociatedPartyReference {
  const error = `research_study_associated_party_${index}_party_reference_invalid`
  if (!isRecord(value)) throw new TypeError(error)
  const reference = optionalString(value.reference)
  const type = optionalString(value.type)
  const display = optionalString(value.display)
  if (!reference) throw new TypeError(error)
  const allowed = ['Organization', 'Practitioner', 'PractitionerRole'] as const
  if (type && !allowed.includes(type as ResearchStudyAssociatedPartyReferenceType)) throw new TypeError(error)
  const relativeType = reference.match(/^(Organization|Practitioner|PractitionerRole|[A-Z][A-Za-z]+)\//)?.[1]
  if (relativeType && !allowed.includes(relativeType as ResearchStudyAssociatedPartyReferenceType)) throw new TypeError(error)
  return Object.freeze({
    reference,
    ...(type ? { type: type as ResearchStudyAssociatedPartyReferenceType } : {}),
    ...(display ? { display } : {}),
  })
}

function conceptValues(concepts: readonly ResearchStudyCodeableConcept[]): string[] {
  return concepts.flatMap(concept => {
    const coded = (concept.coding || []).flatMap(coding => coding.code
      ? [`${coding.system ? `${coding.system}|` : ''}${coding.code}`]
      : [])
    return coded.length > 0 ? coded : concept.text ? [concept.text] : []
  })
}

function addClaim(
  claims: Partial<Record<ResearchStudyR5SearchClaim, readonly string[]>>,
  name: ResearchStudyR5SearchClaim,
  values: readonly string[],
): void {
  if (values.length > 0) claims[name] = Object.freeze([...values])
}

function strings(value: unknown): string[] {
  const result = optionalString(value)
  return result ? [result] : []
}

function conceptsValue(value: unknown, error: string): string[] {
  if (value === undefined) return []
  const concepts = Array.isArray(value)
    ? normalizeConcepts(value, error)
    : Object.freeze([normalizeConcept(value, error)])
  return conceptValues(concepts)
}

function references(value: unknown, nestedKey?: string): string[] {
  let candidate = value
  if (nestedKey) {
    if (!isRecord(value)) return []
    candidate = value[nestedKey]
  }
  if (candidate === undefined) return []
  const items = Array.isArray(candidate) ? candidate : [candidate]
  return items.flatMap(item => isRecord(item) && optionalString(item.reference) ? [String(item.reference).trim()] : [])
}

function identifiers(value: unknown): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new TypeError('research_study_identifier_invalid')
  return value.flatMap(item => {
    if (!isRecord(item)) throw new TypeError('research_study_identifier_invalid')
    const system = optionalString(item.system)
    const identifier = optionalString(item.value)
    return identifier ? [`${system ? `${system}|` : ''}${identifier}`] : []
  })
}

function periodValues(value: unknown, error: string): string[] {
  if (value === undefined) return []
  if (!isRecord(value)) throw new TypeError(error)
  const start = optionalString(value.start)
  const end = optionalString(value.end)
  if ((start && !isFhirDateTime(start)) || (end && !isFhirDateTime(end))) throw new TypeError(error)
  return [start, end].filter((item): item is string => Boolean(item))
}

function codeableReferences(value: unknown, key: 'concept' | 'reference'): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new TypeError('research_study_focus_invalid')
  return value.flatMap(item => {
    if (!isRecord(item)) throw new TypeError('research_study_focus_invalid')
    return key === 'concept'
      ? conceptsValue(item.concept, 'research_study_focus_invalid')
      : references(item.reference)
  })
}

function backboneStrings(value: unknown, key: string): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new TypeError('research_study_backbone_invalid')
  return value.flatMap(item => isRecord(item) ? strings(item[key]) : [])
}

function backboneConcepts(value: unknown, key: string): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new TypeError('research_study_backbone_invalid')
  return value.flatMap(item => isRecord(item) ? conceptsValue(item[key], 'research_study_backbone_invalid') : [])
}

function nestedNumber(value: unknown, key: string): string[] {
  if (!isRecord(value) || value[key] === undefined) return []
  const number = Number(value[key])
  if (!Number.isInteger(number) || number < 0) throw new TypeError('research_study_recruitment_invalid')
  return [String(number)]
}

function progressStatusValues(value: unknown): Readonly<{
  stateActual: string[]
  statePeriod: string[]
  statePeriodActual: string[]
}> {
  const result = { stateActual: [] as string[], statePeriod: [] as string[], statePeriodActual: [] as string[] }
  if (value === undefined) return result
  if (!Array.isArray(value)) throw new TypeError('research_study_progress_status_invalid')
  for (const item of value) {
    if (!isRecord(item)) throw new TypeError('research_study_progress_status_invalid')
    const states = conceptsValue(item.state, 'research_study_progress_status_invalid')
    const dates = periodValues(item.period, 'research_study_progress_status_invalid')
    const actual = typeof item.actual === 'boolean' ? String(item.actual) : undefined
    for (const state of states) {
      if (actual) result.stateActual.push(`${state}$${actual}`)
      for (const date of dates) {
        result.statePeriod.push(`${state}$${date}`)
        if (actual) result.statePeriodActual.push(`${state}$${date}$${actual}`)
      }
    }
  }
  return result
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return normalized || undefined
}

function isFhirDateTime(value: string): boolean {
  return /^\d{4}(?:-\d{2}(?:-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?)?)?$/.test(value)
    && !Number.isNaN(Date.parse(value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fhirId(value: unknown, error: string): string {
  const id = optionalString(value)
  if (!id || !/^[A-Za-z0-9.-]{1,64}$/.test(id)) throw new TypeError(error)
  return id
}
