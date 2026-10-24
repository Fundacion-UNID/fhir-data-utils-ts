export const PublicHealthStatisticsSubjectKinds = Object.freeze(['human', 'animal'] as const)
export type PublicHealthStatisticsSubjectKind = typeof PublicHealthStatisticsSubjectKinds[number]

export type PublicHealthStatisticsProjection = Readonly<{
  subjectKind: PublicHealthStatisticsSubjectKind
  section: string
  codingSystem: string
  code: string
  jurisdiction: string
  occurredOn: string
  demographics?: Readonly<{
    speciesTaxonomyId?: string
    ageBand?: string
    sex?: string
  }>
}>

const forbiddenFields = Object.freeze([
  'subjectDid', 'subjectId', 'patientId', 'animalId', 'cardNumber', 'microchip',
  'name', 'email', 'telephone', 'address', 'organizationDid', 'providerDid',
  'creatorDid', 'authorReference', 'attesterReference', 'description', 'note',
  'freeText', 'resource', 'attachment',
  'documentHash', 'sourceVersionId', 'sourceResourceId', 'signature',
])

/**
 * Reduces coded evidence to an identifier-free public-health statistics
 * projection. The source record, hash, signature and private dataset remain
 * outside this projection so that the statistic cannot be correlated back to
 * a clinical record or Digital Twin.
 *
 * SHC issuance is intentionally absent from this contract. A caller may issue
 * a credential, or not, without changing statistical eligibility or output.
 */
export function buildPublicHealthStatisticsProjection(input: unknown): PublicHealthStatisticsProjection {
  const value = asRecord(input)
  if (forbiddenFields.some((field) => hasValue(value[field]))) {
    throw new TypeError('public_health_statistics_identifying_data_forbidden')
  }
  const subjectKind = required(value.subjectKind, 'subject_kind')
  if (!PublicHealthStatisticsSubjectKinds.includes(subjectKind as PublicHealthStatisticsSubjectKind)) {
    throw new TypeError('public_health_statistics_subject_kind_invalid')
  }
  const jurisdiction = required(value.jurisdiction, 'jurisdiction').toUpperCase()
  if (!/^[A-Z]{2}(?:-[A-Z0-9]{1,3})+$/.test(jurisdiction)) {
    throw new TypeError('public_health_statistics_jurisdiction_invalid')
  }

  const occurredOn = required(value.occurredOn, 'occurred_on')
  if (!isIsoDate(occurredOn)) throw new TypeError('public_health_statistics_occurred_on_invalid')

  const speciesTaxonomyId = optional(value.speciesTaxonomyId)
  if (subjectKind === 'human' && speciesTaxonomyId) {
    throw new TypeError('public_health_statistics_human_species_forbidden')
  }
  if (speciesTaxonomyId && !/^\d{1,12}$/.test(speciesTaxonomyId)) {
    throw new TypeError('public_health_statistics_species_taxonomy_invalid')
  }
  const ageBand = optional(value.ageBand)
  if (ageBand && !/^\d{1,3}-\d{1,3}$/.test(ageBand)) {
    throw new TypeError('public_health_statistics_age_band_invalid')
  }
  const sex = optional(value.sex)
  const demographics = speciesTaxonomyId || ageBand || sex
    ? Object.freeze({
        ...(speciesTaxonomyId ? { speciesTaxonomyId } : {}),
        ...(ageBand ? { ageBand } : {}),
        ...(sex ? { sex } : {}),
      })
    : undefined

  return Object.freeze({
    subjectKind: subjectKind as PublicHealthStatisticsSubjectKind,
    section: required(value.section, 'section'),
    codingSystem: required(value.codingSystem, 'coding_system'),
    code: required(value.code, 'code'),
    jurisdiction,
    occurredOn,
    ...(demographics ? { demographics } : {}),
  })
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('public_health_statistics_input_invalid')
  }
  return value as Record<string, unknown>
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  return optional(value).length > 0
}

function optional(value: unknown): string {
  return String(value ?? '').trim()
}

function required(value: unknown, field: string): string {
  const normalized = optional(value)
  if (!normalized) throw new TypeError(`public_health_statistics_${field}_required`)
  return normalized
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}
