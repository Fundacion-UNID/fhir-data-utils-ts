/**
 * Browser-safe FHIR R5 Group contract for research-team descriptions.
 *
 * Group membership is descriptive. It never grants authorization, permission
 * or a SMART scope; those decisions remain separate Consent and credential
 * contracts.
 *
 * @see https://hl7.org/fhir/R5/group.html
 * @see https://hl7.org/fhir/R5/group-search.html
 */

export const GroupR5Version = '5.0.0' as const

export const GroupR5TypeSystem = 'http://hl7.org/fhir/group-type' as const
export const GroupR5TypeCodes = Object.freeze([
  'person',
  'animal',
  'practitioner',
  'device',
  'careteam',
  'healthcareservice',
  'location',
  'organization',
  'relatedperson',
  'specimen',
] as const)
export type GroupR5TypeCode = (typeof GroupR5TypeCodes)[number]

export const GroupR5MembershipSystem = 'http://hl7.org/fhir/group-membership-basis' as const
export const GroupR5MembershipCodes = Object.freeze(['definitional', 'enumerated'] as const)
export type GroupR5MembershipCode = (typeof GroupR5MembershipCodes)[number]

export const GroupR5Bindings = Object.freeze({
  type: Object.freeze({
    valueSet: 'http://hl7.org/fhir/ValueSet/group-type',
    strength: 'required',
  }),
  membership: Object.freeze({
    valueSet: 'http://hl7.org/fhir/ValueSet/group-membership-basis',
    strength: 'required',
  }),
} as const)

export type GroupSearchParameterType = 'composite' | 'reference' | 'string' | 'token'
export type GroupR5SearchParameter = Readonly<{
  code: string
  type: GroupSearchParameterType
  expression: string
  components: readonly string[]
}>

const searchParameter = (
  code: string,
  type: GroupSearchParameterType,
  expression: string,
  components: readonly string[] = [],
): GroupR5SearchParameter => Object.freeze({
  code,
  type,
  expression,
  components: Object.freeze([...components]),
})

/** Exact resource-specific SearchParameters published by FHIR R5 5.0.0. */
export const GroupR5SearchParameterCatalog: readonly GroupR5SearchParameter[] = Object.freeze([
  searchParameter('characteristic', 'token', 'Group.characteristic.code'),
  searchParameter('characteristic-reference', 'reference', '(Group.characteristic.value.ofType(Reference))'),
  searchParameter('characteristic-value', 'composite', 'Group.characteristic', [
    'http://hl7.org/fhir/SearchParameter/Group-characteristic',
    'http://hl7.org/fhir/SearchParameter/Group-value',
  ]),
  searchParameter('code', 'token', 'Group.code'),
  searchParameter('exclude', 'token', 'Group.characteristic.exclude'),
  searchParameter('identifier', 'token', 'Group.identifier'),
  searchParameter('managing-entity', 'reference', 'Group.managingEntity'),
  searchParameter('member', 'reference', 'Group.member.entity'),
  searchParameter('membership', 'token', 'Group.membership'),
  searchParameter('name', 'string', 'Group.name'),
  searchParameter('type', 'token', 'Group.type'),
  searchParameter(
    'value',
    'token',
    '(Group.characteristic.value.ofType(CodeableConcept)) | (Group.characteristic.value.ofType(boolean))',
  ),
])

/** Canonical Group flat-claim names. Never repeat these storage keys as literals. */
export const GroupClaim = Object.freeze({
  Characteristic: 'Group.characteristic',
  CharacteristicReference: 'Group.characteristic-reference',
  CharacteristicValue: 'Group.characteristic-value',
  Code: 'Group.code',
  Exclude: 'Group.exclude',
  Identifier: 'Group.identifier',
  ManagingEntity: 'Group.managing-entity',
  Member: 'Group.member',
  Membership: 'Group.membership',
  Name: 'Group.name',
  Type: 'Group.type',
  Value: 'Group.value',
} as const)

const standardSearchClaims = Object.freeze(Object.values(GroupClaim))

/** Canonical claims derived only from the official resource-specific catalogue. */
export const GroupFlatClaimCatalog = Object.freeze({
  standardSearch: standardSearchClaims,
  all: standardSearchClaims,
})

export type GroupR5SearchClaim = (typeof standardSearchClaims)[number]
export type GroupR5SearchClaims = Readonly<Partial<Record<GroupR5SearchClaim, readonly string[]>>>
export type GroupR5FlatClaimsResource = Readonly<{
  resourceType: 'Group'
  id: string
  meta: Readonly<{ claims: Readonly<Record<string, readonly string[]>> }>
}>

export type GroupR5Reference = Readonly<{
  reference: string
  type?: string
  display?: string
}>

export type GroupR5Period = Readonly<{
  start?: string
  end?: string
}>

export type GroupPractitionerRoleMember = Readonly<{
  entity: Readonly<{
    reference: `PractitionerRole/${string}`
    type: 'PractitionerRole'
    display?: string
  }>
  period?: GroupR5Period
  inactive?: boolean
}>

export type GroupR5ResearchTeam = Readonly<Record<string, unknown> & {
  resourceType: 'Group'
  id?: string
  type: 'practitioner'
  membership: 'enumerated'
  member: readonly GroupPractitionerRoleMember[]
}>

export type GroupR5ProfessionalServiceTeam = GroupR5ResearchTeam & Readonly<{
  managingEntity: Readonly<{
    reference: `Organization/${string}`
    type: 'Organization'
  }>
}>

/**
 * Normalizes the members used by an enumerated professional research team.
 * Every entity is a native PractitionerRole reference; a Practitioner or an
 * employee identifier cannot substitute for the registered role assignment.
 */
export function normalizeGroupPractitionerRoleMembers(input: unknown): readonly GroupPractitionerRoleMember[] {
  if (!Array.isArray(input)) throw new TypeError('group_members_invalid')
  return Object.freeze(input.map((value, index) => {
    if (!isRecord(value) || containsAuthorizationProperty(value)) {
      throw new TypeError(containsAuthorizationProperty(value) ? 'group_authorization_property_forbidden' : `group_member_${index}_invalid`)
    }
    if (!isRecord(value.entity)) throw new TypeError(`group_member_${index}_practitioner_role_reference_invalid`)
    const reference = optionalString(value.entity.reference)
    const declaredType = optionalString(value.entity.type)
    if (!reference || !/^PractitionerRole\/[A-Za-z0-9.-]{1,64}$/.test(reference) || (declaredType && declaredType !== 'PractitionerRole')) {
      throw new TypeError(`group_member_${index}_practitioner_role_reference_invalid`)
    }
    const display = optionalString(value.entity.display)
    const period = value.period === undefined ? undefined : normalizePeriod(value.period, index)
    if (value.inactive !== undefined && typeof value.inactive !== 'boolean') {
      throw new TypeError(`group_member_${index}_inactive_invalid`)
    }
    return Object.freeze({
      entity: Object.freeze({
        reference: reference as `PractitionerRole/${string}`,
        type: 'PractitionerRole' as const,
        ...(display ? { display } : {}),
      }),
      ...(period ? { period } : {}),
      ...(value.inactive !== undefined ? { inactive: value.inactive } : {}),
    })
  }))
}

/**
 * Normalizes the Group profile used to describe an explicit professional
 * ResearchStudy team. This data is descriptive and authorization-shaped
 * properties are rejected at every depth.
 */
export function normalizeGroupR5ResearchTeam(input: unknown): GroupR5ResearchTeam {
  if (!isRecord(input) || input.resourceType !== 'Group') throw new TypeError('group_resource_invalid')
  if (containsAuthorizationProperty(input)) throw new TypeError('group_authorization_property_forbidden')
  if (input.type !== 'practitioner') throw new TypeError('group_research_team_type_invalid')
  if (input.membership !== 'enumerated') throw new TypeError('group_research_team_membership_invalid')
  const member = normalizeGroupPractitionerRoleMembers(input.member)
  return Object.freeze({ ...input, type: 'practitioner', membership: 'enumerated', member }) as GroupR5ResearchTeam
}

/**
 * Normalizes a professional team assigned to one Organization department.
 * `managingEntity` is singular in FHIR R5, so one Group cannot span several
 * departments. Membership remains descriptive and grants no permission.
 */
export function normalizeGroupR5ProfessionalServiceTeam(input: unknown): GroupR5ProfessionalServiceTeam {
  const team = normalizeGroupR5ResearchTeam(input)
  const managingEntity = team.managingEntity
  if (!isRecord(managingEntity)) throw new TypeError('group_professional_service_managing_organization_invalid')
  const reference = optionalString(managingEntity.reference)
  const declaredType = optionalString(managingEntity.type)
  if (!reference || !/^Organization\/[A-Za-z0-9.-]{1,64}$/.test(reference) || (declaredType && declaredType !== 'Organization')) {
    throw new TypeError('group_professional_service_managing_organization_invalid')
  }
  return Object.freeze({
    ...team,
    managingEntity: Object.freeze({ reference: reference as `Organization/${string}`, type: 'Organization' as const }),
  }) as GroupR5ProfessionalServiceTeam
}

/**
 * Projects all populated official resource-specific R5 Group SearchParameters
 * into flat `resource.meta.claims`. A referenced characteristic is indexed by
 * `characteristic-reference`, not as the token-valued `value` parameter.
 *
 * @see https://hl7.org/fhir/R5/group-search.html
 */
export function projectGroupR5SearchClaims(input: unknown): GroupR5SearchClaims {
  if (!isRecord(input) || input.resourceType !== 'Group') throw new TypeError('group_resource_invalid')
  if (containsAuthorizationProperty(input)) throw new TypeError('group_authorization_property_forbidden')
  if (!GroupR5TypeCodes.includes(input.type as GroupR5TypeCode)) throw new TypeError('group_type_invalid')
  if (!GroupR5MembershipCodes.includes(input.membership as GroupR5MembershipCode)) {
    throw new TypeError('group_membership_invalid')
  }
  const characteristics = normalizeRecords(input.characteristic, 'group_characteristic_invalid')
  const characteristicCodes = characteristics.flatMap(item => conceptTokens(item.code))
  const characteristicValues = characteristics.flatMap(characteristicTokenValues)
  const claims: Partial<Record<GroupR5SearchClaim, readonly string[]>> = {}
  addClaim(claims, GroupClaim.Characteristic, characteristicCodes)
  addClaim(claims, GroupClaim.CharacteristicReference, characteristics.flatMap(item => referenceTokens(item.valueReference)))
  addClaim(claims, GroupClaim.CharacteristicValue, characteristics.flatMap(item =>
    conceptTokens(item.code).flatMap(code => characteristicTokenValues(item).map(value => `${code}$${value}`))))
  addClaim(claims, GroupClaim.Code, conceptTokens(input.code))
  addClaim(claims, GroupClaim.Exclude, characteristics.flatMap(item => typeof item.exclude === 'boolean' ? [String(item.exclude)] : []))
  addClaim(claims, GroupClaim.Identifier, identifierTokens(input.identifier))
  addClaim(claims, GroupClaim.ManagingEntity, referenceTokens(input.managingEntity))
  addClaim(claims, GroupClaim.Member, normalizeRecords(input.member, 'group_members_invalid').flatMap(item => referenceTokens(item.entity)))
  addClaim(claims, GroupClaim.Membership, [input.membership])
  addClaim(claims, GroupClaim.Name, strings(input.name))
  addClaim(claims, GroupClaim.Type, [input.type])
  addClaim(claims, GroupClaim.Value, characteristicValues)
  return Object.freeze(claims)
}

/** Projects native-shaped Group input to the claims-only GW persistence shape. */
export function projectGroupR5FlatClaimsResource(input: unknown): GroupR5FlatClaimsResource {
  if (!isRecord(input) || input.resourceType !== 'Group') throw new TypeError('group_resource_invalid')
  const id = fhirId(input.id, 'group_flat_resource_invalid')
  if (Array.isArray(input.member) && input.member.length > 0) throw new TypeError('group_members_require_separate_resources')
  return normalizeGroupR5FlatClaimsResource({
    resourceType: 'Group',
    id,
    meta: { claims: projectGroupR5SearchClaims(input) },
  })
}

/** Projects one correlated claims-only GW resource per PractitionerRole member. */
export function projectGroupPractitionerRoleMemberFlatClaimResources(input: Readonly<{
  groupId: string
  members: unknown
}>): readonly GroupR5FlatClaimsResource[] {
  const id = fhirId(input.groupId, 'group_flat_resource_invalid')
  const members = normalizeGroupPractitionerRoleMembers(input.members)
  return Object.freeze(members.map(member => normalizeGroupR5FlatClaimsResource({
    resourceType: 'Group',
    id,
    meta: {
      claims: projectGroupR5SearchClaims({
        resourceType: 'Group',
        id,
        type: 'practitioner',
        membership: 'enumerated',
        member: [member],
      }),
    },
  })))
}

/** Validates and freezes a claims-only Group GW resource. */
export function normalizeGroupR5FlatClaimsResource(input: unknown): GroupR5FlatClaimsResource {
  if (!isRecord(input)
    || input.resourceType !== 'Group'
    || Object.keys(input).some(key => !['resourceType', 'id', 'meta'].includes(key))) {
    throw new TypeError('group_flat_resource_invalid')
  }
  const id = fhirId(input.id, 'group_flat_resource_invalid')
  if (!isRecord(input.meta) || !isRecord(input.meta.claims)) throw new TypeError('group_flat_resource_invalid')
  const claims: Record<string, readonly string[]> = {}
  for (const [name, rawValues] of Object.entries(input.meta.claims)) {
    if (!GroupFlatClaimCatalog.all.includes(name as never)
      || !Array.isArray(rawValues)
      || rawValues.length === 0
      || rawValues.some(value => typeof value !== 'string' || !value.trim())) {
      throw new TypeError('group_flat_claim_invalid')
    }
    claims[name] = Object.freeze(rawValues.map(value => value.trim()))
  }
  return Object.freeze({ resourceType: 'Group', id, meta: Object.freeze({ claims: Object.freeze(claims) }) })
}

function addClaim(
  claims: Partial<Record<GroupR5SearchClaim, readonly string[]>>,
  name: GroupR5SearchClaim,
  values: readonly unknown[],
): void {
  const normalized = [...new Set(values.flatMap(value => strings(value)))]
  if (normalized.length > 0) claims[name] = Object.freeze(normalized)
}

function identifierTokens(value: unknown): string[] {
  return normalizeRecords(value, 'group_identifier_invalid').flatMap(identifier => {
    const system = optionalString(identifier.system)
    const identifierValue = optionalString(identifier.value)
    return identifierValue ? [`${system ? `${system}|` : ''}${identifierValue}`] : []
  })
}

function conceptTokens(value: unknown): string[] {
  if (!isRecord(value)) return []
  const coding = normalizeRecords(value.coding, 'group_coding_invalid').flatMap(item => {
    const system = optionalString(item.system)
    const code = optionalString(item.code)
    return code ? [`${system ? `${system}|` : ''}${code}`] : []
  })
  return coding.length > 0 ? coding : strings(value.text)
}

function characteristicTokenValues(value: Readonly<Record<string, unknown>>): string[] {
  if (typeof value.valueBoolean === 'boolean') return [String(value.valueBoolean)]
  return conceptTokens(value.valueCodeableConcept)
}

function referenceTokens(value: unknown): string[] {
  return isRecord(value) ? strings(value.reference) : []
}

function normalizeRecords(value: unknown, error: string): readonly Readonly<Record<string, unknown>>[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every(isRecord)) throw new TypeError(error)
  return value
}

function normalizePeriod(value: unknown, index: number): GroupR5Period {
  if (!isRecord(value)) throw new TypeError(`group_member_${index}_period_invalid`)
  const start = optionalString(value.start)
  const end = optionalString(value.end)
  if (!start && !end) throw new TypeError(`group_member_${index}_period_invalid`)
  if ((start && !isFhirDateTime(start)) || (end && !isFhirDateTime(end))) {
    throw new TypeError(`group_member_${index}_period_invalid`)
  }
  if (start && end && Date.parse(end) < Date.parse(start)) throw new TypeError(`group_member_${index}_period_invalid`)
  return Object.freeze({ ...(start ? { start } : {}), ...(end ? { end } : {}) })
}

function containsAuthorizationProperty(value: unknown, seen = new WeakSet<object>()): boolean {
  if (!value || typeof value !== 'object') return false
  if (seen.has(value)) return false
  seen.add(value)
  if (Array.isArray(value)) return value.some(item => containsAuthorizationProperty(item, seen))
  return Object.entries(value).some(([name, nested]) =>
    ['authorization', 'permission', 'scope'].includes(name) || containsAuthorizationProperty(nested, seen))
}

function strings(value: unknown): string[] {
  const normalized = optionalString(value)
  return normalized ? [normalized] : []
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isFhirDateTime(value: string): boolean {
  return /^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01])(?:T.+)?)?)?$/.test(value)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function fhirId(value: unknown, error: string): string {
  const id = optionalString(value)
  if (!id || !/^[A-Za-z0-9.-]{1,64}$/.test(id)) throw new TypeError(error)
  return id
}
