import { buildFlatClaimResourceEntry, type FlatClaimResourceEntry } from './flat-claim-resource-graph.js'
import { CompositionAttesterModes, CompositionClaim } from './claims/composition-claims.js'
import {
  FhirCodeSystem,
  ObservationCategoryCodes,
  ObservationClaim,
  decodeObservationClaimList,
  type CodingDescriptor,
} from './observation-claims.js'

export { ObservationCategoryCodes, ObservationClaim } from './observation-claims.js'

function defineCoding(system: string, code: string, display?: string): CodingDescriptor {
  return Object.freeze({ system, code, display, claim: `${system}|${code}` })
}

/** Canonical LOINC descriptors for supported vital signs. */
export const VitalSignsCodes = Object.freeze({
  BodyWeight: defineCoding(FhirCodeSystem.Loinc, '29463-7', 'Body weight'),
  HeartRate: defineCoding(FhirCodeSystem.Loinc, '8867-4', 'Heart rate'),
  BloodPressure: defineCoding(FhirCodeSystem.Loinc, '85354-9', 'Blood pressure panel'),
  SystolicBloodPressure: defineCoding(FhirCodeSystem.Loinc, '8480-6', 'Systolic blood pressure'),
  DiastolicBloodPressure: defineCoding(FhirCodeSystem.Loinc, '8462-4', 'Diastolic blood pressure'),
  BodyTemperature: defineCoding(FhirCodeSystem.Loinc, '8310-5', 'Body temperature'),
  OxygenSaturation: defineCoding(FhirCodeSystem.Loinc, '2708-6', 'Oxygen saturation'),
  RespiratoryRate: defineCoding(FhirCodeSystem.Loinc, '9279-1', 'Respiratory rate'),
} as const)

/** Canonical UCUM descriptors for supported vital signs. */
export const VitalSignsUnits = Object.freeze({
  BeatsPerMinute: defineCoding(FhirCodeSystem.Ucum, '/min', 'beats/minute'),
  MillimeterOfMercury: defineCoding(FhirCodeSystem.Ucum, 'mm[Hg]', 'mmHg'),
  Celsius: defineCoding(FhirCodeSystem.Ucum, 'Cel', 'degrees Celsius'),
  Fahrenheit: defineCoding(FhirCodeSystem.Ucum, '[degF]', 'degrees Fahrenheit'),
  Percent: defineCoding(FhirCodeSystem.Ucum, '%', 'percent'),
  Kilogram: defineCoding(FhirCodeSystem.Ucum, 'kg', 'kilogram'),
  Pound: defineCoding(FhirCodeSystem.Ucum, '[lb_av]', 'pound'),
} as const)

/** Governed FHIR/LOINC tokens used by every channel that captures vital signs. */
export const VitalSignCode = Object.freeze({
  bloodPressure: VitalSignsCodes.BloodPressure.claim,
  systolic: VitalSignsCodes.SystolicBloodPressure.claim,
  diastolic: VitalSignsCodes.DiastolicBloodPressure.claim,
  temperature: VitalSignsCodes.BodyTemperature.claim,
  heartRate: VitalSignsCodes.HeartRate.claim,
  oxygenSaturation: VitalSignsCodes.OxygenSaturation.claim,
  respiratoryRate: VitalSignsCodes.RespiratoryRate.claim,
  bodyWeight: VitalSignsCodes.BodyWeight.claim,
} as const)

/** UCUM-compatible unit spellings persisted in flat claims. */
export const VitalSignUnit = Object.freeze({
  bloodPressure: VitalSignsUnits.MillimeterOfMercury.claim,
  temperature: VitalSignsUnits.Celsius.claim,
  temperatureFahrenheit: VitalSignsUnits.Fahrenheit.claim,
  heartRate: VitalSignsUnits.BeatsPerMinute.claim,
  oxygenSaturation: VitalSignsUnits.Percent.claim,
  respiratoryRate: VitalSignsUnits.BeatsPerMinute.claim,
  bodyWeight: VitalSignsUnits.Kilogram.claim,
  bodyWeightPound: VitalSignsUnits.Pound.claim,
} as const)

export type VitalSignQuantityUnit = typeof VitalSignUnit[keyof typeof VitalSignUnit]

export type VitalSignKind = 'blood-pressure' | 'temperature' | 'heart-rate' | 'oxygen-saturation' | 'respiratory-rate' | 'body-weight'
export type VitalSignObservationStatus = 'registered' | 'preliminary' | 'final'
export type VitalSignEventTiming = 'MORN' | 'AFT' | 'EVE' | 'NIGHT'

type CommonMeasurement = Readonly<{
  entryId: string
  subjectReference: string
  kind: VitalSignKind
  measuredAt: string
  status: VitalSignObservationStatus
  eventTiming?: VitalSignEventTiming
  deviceReference?: string
  note?: string
  userSelected?: boolean
}>

export type VitalSignMeasurement = CommonMeasurement & (
  | Readonly<{ kind: 'blood-pressure'; systolic: number; diastolic: number }>
  | Readonly<{ kind: Exclude<VitalSignKind, 'blood-pressure'>; value: number; unit?: VitalSignQuantityUnit }>
)

/**
 * Canonical claims-first representation of one native FHIR Observation.
 *
 * Component values are independent reduced Observation entries so each one
 * can be indexed with the ordinary Observation claim catalog. The primary
 * entry owns the only relationship through `Observation.has-member`.
 */
export type VitalSignObservationGraph = Readonly<{
  primary: FlatClaimResourceEntry
  components: readonly FlatClaimResourceEntry[]
  entries: readonly FlatClaimResourceEntry[]
}>

/**
 * Builds one timestamped Observation. The device is retained as source; this
 * helper deliberately never creates a professional performer or attester.
 */
export function buildVitalSignObservation(input: VitalSignMeasurement): VitalSignObservationGraph {
  const measuredAt = normalizeDateTime(input.measuredAt)
  const claims: Record<string, string> = {
    [ObservationClaim.Identifier]: required(input.entryId, 'vital_sign_entry_id_required'),
    [ObservationClaim.Subject]: required(input.subjectReference, 'vital_sign_subject_required'),
    [ObservationClaim.Status]: input.status,
    [ObservationClaim.Category]: ObservationCategoryCodes.VitalSigns.claim,
    [ObservationClaim.EffectiveDateTime]: measuredAt,
  }
  if (input.deviceReference) claims[ObservationClaim.Device] = required(input.deviceReference, 'vital_sign_device_required')
  if (input.eventTiming) claims[ObservationClaim.DateWhen] = normalizeEventTiming(input.eventTiming)
  if (input.note?.trim()) claims[ObservationClaim.Note] = input.note.trim()
  if (input.userSelected !== undefined) claims[ObservationClaim.UserSelected] = String(input.userSelected)

  if (input.kind === 'blood-pressure') {
    if (!validPositive(input.systolic) || !validPositive(input.diastolic) || input.systolic <= input.diastolic) {
      throw new TypeError('blood_pressure_values_invalid')
    }
    claims[ObservationClaim.Code] = VitalSignCode.bloodPressure
    claims[ObservationClaim.CodeDisplay] = VitalSignsCodes.BloodPressure.display ?? ''
    const components = Object.freeze([
      buildBloodPressureComponent(input, 'systolic', input.systolic, VitalSignsCodes.SystolicBloodPressure),
      buildBloodPressureComponent(input, 'diastolic', input.diastolic, VitalSignsCodes.DiastolicBloodPressure),
    ])
    claims[ObservationClaim.HasMember] = components.map(component => component.reference).join(',')
    const primary = buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: 'Observation', claims })
    return freezeObservationGraph(primary, components)
  } else {
    if (!validPositive(input.value)) throw new TypeError('vital_sign_value_invalid')
    const scalar = scalarDefinition(input.kind, input.unit)
    claims[ObservationClaim.Code] = scalar.coding.claim
    if (scalar.coding.display) claims[ObservationClaim.CodeDisplay] = scalar.coding.display
    claims[ObservationClaim.ValueQuantityNumber] = String(input.value)
    claims[ObservationClaim.ValueQuantityUnit] = scalar.unit
  }
  return freezeObservationGraph(
    buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: 'Observation', claims }),
    Object.freeze([]),
  )
}

export type ObservationComponentQuantity = Readonly<{ code: string; display?: string; value: number; unit: string }>

/** Restores component values from the canonical graph or legacy scalar/array claims. */
export function parseObservationComponents(
  source: VitalSignObservationGraph | Readonly<Record<string, string>>,
): readonly ObservationComponentQuantity[] {
  if (isVitalSignObservationGraph(source)) {
    return Object.freeze(source.components.map(component => componentQuantityFromEntry(component)))
  }
  const claims = source
  const codes = decodeObservationClaimList(claims[ObservationClaim.ComponentCode])
  const displays = decodeObservationClaimList(claims[ObservationClaim.ComponentCodeDisplay])
  const values = decodeObservationClaimList(claims[ObservationClaim.ComponentValueQuantityNumber])
  const units = decodeObservationClaimList(claims[ObservationClaim.ComponentValueQuantityUnit])
  if (!codes.length && claims[ObservationClaim.Code] === VitalSignCode.bloodPressure) {
    const systolic = Number(claims[ObservationClaim.BloodPressureSystolicNumber])
    const diastolic = Number(claims[ObservationClaim.BloodPressureDiastolicNumber])
    if (Number.isFinite(systolic) && Number.isFinite(diastolic)) {
      return Object.freeze([
        Object.freeze({ code: VitalSignCode.systolic, value: systolic, unit: VitalSignUnit.bloodPressure }),
        Object.freeze({ code: VitalSignCode.diastolic, value: diastolic, unit: VitalSignUnit.bloodPressure }),
      ])
    }
  }
  if (codes.length !== values.length || codes.length !== units.length) throw new TypeError('observation_components_not_aligned')
  if (displays.length && displays.length !== codes.length) throw new TypeError('observation_components_not_aligned')
  return Object.freeze(codes.map((code, index) => {
    const value = Number(values[index])
    if (typeof code !== 'string' || typeof units[index] !== 'string' || !Number.isFinite(value)) {
      throw new TypeError('observation_component_invalid')
    }
    const display = displays[index]
    if (display !== undefined && typeof display !== 'string') throw new TypeError('observation_component_invalid')
    return Object.freeze({ code, ...(display ? { display } : {}), value, unit: units[index] })
  }))
}

export type ObservationComponentIndexEntry = Readonly<{
  parentReference: string
  componentIndex: number
  claims: Readonly<Record<string, string>>
}>

/**
 * Creates generic reduced rows for component-level indexes.
 *
 * These are internal index projections, not independent native FHIR
 * Observations. The missing status deliberately keeps them out of normal
 * top-level Observation results.
 */
export function materializeObservationComponentIndexEntries(entry: VitalSignObservationGraph | FlatClaimResourceEntry): readonly ObservationComponentIndexEntry[] {
  if (isVitalSignObservationGraph(entry)) {
    return Object.freeze(entry.components.map((component, componentIndex) => Object.freeze({
      parentReference: entry.primary.reference,
      componentIndex,
      claims: component.claims,
    })))
  }
  if (entry.resourceType !== 'Observation') throw new TypeError('vital_sign_observation_required')
  const subject = required(entry.claims[ObservationClaim.Subject] ?? '', 'vital_sign_subject_required')
  return Object.freeze(parseObservationComponents(entry.claims).map((component, componentIndex) => Object.freeze({
    parentReference: entry.reference,
    componentIndex,
    claims: Object.freeze({
      [ObservationClaim.Subject]: subject,
      [ObservationClaim.Code]: component.code,
      ...(component.display ? { [ObservationClaim.CodeDisplay]: component.display } : {}),
      [ObservationClaim.ValueQuantityNumber]: String(component.value),
      [ObservationClaim.ValueQuantityUnit]: component.unit,
    }),
  })))
}

type NativeCoding = Readonly<{ system?: string; code: string; display?: string }>
type NativeVitalSignObservation = Readonly<{
  resourceType: 'Observation'
  id: string
  status: string
  category: readonly Readonly<{ coding: readonly NativeCoding[] }>[]
  code: Readonly<{ coding: readonly NativeCoding[] }>
  subject: Readonly<{ reference: string }>
  effectiveDateTime: string
  device?: Readonly<{ reference: string }>
  component?: readonly Readonly<{
    code: Readonly<{ coding: readonly NativeCoding[] }>
    valueQuantity: Readonly<{ value: number; unit: string; system?: string; code: string }>
  }>[]
  valueQuantity?: Readonly<{ value: number; unit: string; system?: string; code: string }>
}>

/** Projects the neutral flat contract at the explicit FHIR R4 boundary. */
export function projectVitalSignObservationR4(entry: VitalSignObservationGraph | FlatClaimResourceEntry): NativeVitalSignObservation {
  return projectVitalSignObservation(entry)
}

/** Projects the neutral flat contract at the explicit FHIR R5 boundary. */
export function projectVitalSignObservationR5(entry: VitalSignObservationGraph | FlatClaimResourceEntry): NativeVitalSignObservation {
  return projectVitalSignObservation(entry)
}

function projectVitalSignObservation(source: VitalSignObservationGraph | FlatClaimResourceEntry): NativeVitalSignObservation {
  const entry = isVitalSignObservationGraph(source) ? source.primary : source
  if (entry.resourceType !== 'Observation') throw new TypeError('vital_sign_observation_required')
  const claims = entry.claims
  const base = {
    resourceType: 'Observation' as const,
    id: required(claims[ObservationClaim.Identifier] ?? '', 'vital_sign_entry_id_required'),
    status: required(claims[ObservationClaim.Status] ?? '', 'vital_sign_status_required'),
    category: [{ coding: [codingFromClaim(required(claims[ObservationClaim.Category] ?? '', 'vital_sign_category_required'))] }],
    code: { coding: [codingFromClaim(required(claims[ObservationClaim.Code] ?? '', 'vital_sign_code_required'), claims[ObservationClaim.CodeDisplay])] },
    subject: { reference: required(claims[ObservationClaim.Subject] ?? '', 'vital_sign_subject_required') },
    effectiveDateTime: required(claims[ObservationClaim.EffectiveDateTime] ?? '', 'vital_sign_measured_at_required'),
    ...(claims[ObservationClaim.Device] ? { device: { reference: claims[ObservationClaim.Device] } } : {}),
  }
  const components = parseObservationComponents(isVitalSignObservationGraph(source) ? source : claims)
  if (components.length) {
    return Object.freeze({ ...base, component: Object.freeze(components.map(component => Object.freeze({
      code: { coding: [codingFromClaim(component.code, component.display)] },
      valueQuantity: quantity(component.value, component.unit),
    }))) })
  }
  const value = Number(claims[ObservationClaim.ValueQuantityNumber])
  if (!Number.isFinite(value)) throw new TypeError('vital_sign_value_invalid')
  return Object.freeze({ ...base, valueQuantity: quantity(value, required(claims[ObservationClaim.ValueQuantityUnit] ?? '', 'vital_sign_unit_required')) })
}

function codingFromClaim(value: string, display?: string): NativeCoding {
  const separator = value.lastIndexOf('|')
  return separator < 0
    ? Object.freeze({ code: value, ...(display ? { display } : {}) })
    : Object.freeze({ system: value.slice(0, separator), code: value.slice(separator + 1), ...(display ? { display } : {}) })
}

function quantity(value: number, unitClaim: string): Readonly<{ value: number; unit: string; system?: string; code: string }> {
  const coding = codingFromClaim(unitClaim)
  return Object.freeze({ value, unit: coding.code, ...coding })
}

export type VitalSignDeviceReading =
  | Readonly<{ entryId: string; kind: 'blood-pressure'; measuredAt: string; systolic: number; diastolic: number; note?: string }>
  | Readonly<{ entryId: string; kind: Exclude<VitalSignKind, 'blood-pressure'>; measuredAt: string; value: number; unit?: VitalSignQuantityUnit; note?: string }>

/** Converts a device/API batch to independent preliminary Observations without aggregation. */
export function normalizeVitalSignDeviceBatch(input: Readonly<{
  subjectReference: string
  deviceReference: string
  readings: readonly VitalSignDeviceReading[]
}>): readonly VitalSignObservationGraph[] {
  const seen = new Set<string>()
  return Object.freeze(input.readings.map(reading => {
    if (seen.has(reading.entryId)) throw new TypeError('vital_sign_entry_id_duplicate')
    seen.add(reading.entryId)
    return buildVitalSignObservation({
      ...reading,
      subjectReference: input.subjectReference,
      deviceReference: input.deviceReference,
      status: 'preliminary',
    } as VitalSignMeasurement)
  }))
}

export type RepeatedVitalSignReading =
  | Readonly<{ entryId: string; measuredAt: string; systolic: number; diastolic: number; note?: string }>
  | Readonly<{ entryId: string; measuredAt: string; value: number; unit?: VitalSignQuantityUnit; note?: string }>

export type RepeatedVitalSignSession = Readonly<{
  eventTiming: VitalSignEventTiming
  sourceGraphs: readonly VitalSignObservationGraph[]
  averageGraph: VitalSignObservationGraph
  entries: readonly FlatClaimResourceEntry[]
}>

/**
 * Converts exactly three readings taken two minutes apart into registered raw
 * evidence plus one preliminary arithmetic mean. Confirmation belongs to the
 * daily document boundary; this helper never invents an attester.
 */
export function buildRepeatedVitalSignAverage(input: Readonly<{
  entryId: string
  subjectReference: string
  deviceReference?: string
  kind: VitalSignKind
  eventTiming: VitalSignEventTiming
  readings: readonly RepeatedVitalSignReading[]
}>): RepeatedVitalSignSession {
  if (input.readings.length !== 3) throw new TypeError('vital_sign_repeated_reading_count_invalid')
  const instants = input.readings.map(reading => normalizeDateTime(reading.measuredAt))
  for (let index = 1; index < instants.length; index += 1) {
    if (Date.parse(instants[index]) - Date.parse(instants[index - 1]) !== 120_000) {
      throw new TypeError('vital_sign_repeated_reading_cadence_invalid')
    }
  }
  const eventTiming = normalizeEventTiming(input.eventTiming)
  const sourceGraphs = Object.freeze(input.readings.map(reading => buildVitalSignObservation({
    ...reading,
    subjectReference: input.subjectReference,
    ...(input.deviceReference ? { deviceReference: input.deviceReference } : {}),
    kind: input.kind,
    status: 'registered',
    eventTiming,
  } as VitalSignMeasurement)))
  const common = {
    entryId: input.entryId,
    subjectReference: input.subjectReference,
    ...(input.deviceReference ? { deviceReference: input.deviceReference } : {}),
    kind: input.kind,
    measuredAt: instants[1],
    status: 'preliminary' as const,
    eventTiming,
    ...(input.kind === 'blood-pressure' ? {} : { unit: repeatedScalarUnit(input.kind, input.readings) }),
  }
  const average = input.kind === 'blood-pressure'
    ? buildVitalSignObservation({
        ...common,
        kind: 'blood-pressure',
        systolic: mean(input.readings.map(reading => bloodPressureValue(reading, 'systolic'))),
        diastolic: mean(input.readings.map(reading => bloodPressureValue(reading, 'diastolic'))),
      })
    : buildVitalSignObservation({
        ...common,
        kind: input.kind,
        value: mean(input.readings.map(scalarReadingValue)),
      } as VitalSignMeasurement)
  const derivedFrom = sourceGraphs.map(graph => graph.primary.reference).join(',')
  const averageGraph = replacePrimaryClaims(average, {
    ...average.primary.claims,
    [ObservationClaim.DerivedFrom]: derivedFrom,
  })
  return Object.freeze({
    eventTiming,
    sourceGraphs,
    averageGraph,
    entries: Object.freeze([...sourceGraphs.flatMap(graph => graph.entries), ...averageGraph.entries]),
  })
}

export type VitalSignDailyDocument = Readonly<{
  localDate: string
  timeZone: string
  status: 'preliminary' | 'final'
  composition: FlatClaimResourceEntry
  observations: readonly VitalSignObservationGraph[]
  entries: readonly FlatClaimResourceEntry[]
}>

/** Builds one daily FHIR document graph; hashing, indexing and research remain service policy. */
export function buildVitalSignDailyDocument(input: Readonly<{
  entryId: string
  identifier: string
  subjectReference: string
  authorReference: string
  localDate: string
  timeZone: string
  observationGraphs: readonly VitalSignObservationGraph[]
}>): VitalSignDailyDocument {
  const localDate = normalizeLocalDate(input.localDate)
  const timeZone = normalizeTimeZone(input.timeZone)
  if (!input.observationGraphs.length) throw new TypeError('vital_sign_daily_observations_required')
  const seen = new Set<string>()
  for (const graph of input.observationGraphs) {
    if (graph.primary.claims[ObservationClaim.Subject] !== input.subjectReference) throw new TypeError('vital_sign_daily_subject_mismatch')
    const measuredAt = required(graph.primary.claims[ObservationClaim.EffectiveDateTime] ?? '', 'vital_sign_measured_at_required')
    if (localDateAt(measuredAt, timeZone) !== localDate) throw new TypeError('vital_sign_daily_local_date_mismatch')
    for (const entry of graph.entries) {
      if (seen.has(entry.reference)) throw new TypeError('vital_sign_daily_entry_duplicate')
      seen.add(entry.reference)
    }
  }
  const observationReferences = input.observationGraphs.map(graph => graph.primary.reference)
  const composition = buildFlatClaimResourceEntry({
    entryId: input.entryId,
    resourceType: 'Composition',
    claims: {
      [CompositionClaim.Identifier]: required(input.identifier, 'vital_sign_daily_identifier_required'),
      [CompositionClaim.Status]: 'preliminary',
      [CompositionClaim.Subject]: required(input.subjectReference, 'vital_sign_subject_required'),
      [CompositionClaim.Author]: required(input.authorReference, 'vital_sign_daily_author_required'),
      [CompositionClaim.Date]: latestEffectiveDateTime(input.observationGraphs),
      [CompositionClaim.Type]: `${FhirCodeSystem.Loinc}|8716-3`,
      [CompositionClaim.Title]: `Daily vital signs ${localDate}`,
      [CompositionClaim.Entry]: observationReferences.join(','),
    },
  })
  return freezeDailyDocument(localDate, timeZone, 'preliminary', composition, input.observationGraphs)
}

/** Confirms a preliminary daily document and finalizes its top-level Observations atomically in memory. */
export function finalizeVitalSignDailyDocument(
  draft: VitalSignDailyDocument,
  confirmation: Readonly<{ attesterReference: string; confirmedAt: string }>,
): VitalSignDailyDocument {
  if (draft.status !== 'preliminary' || draft.composition.claims[CompositionClaim.Status] !== 'preliminary') {
    throw new TypeError('vital_sign_daily_preliminary_required')
  }
  const confirmedAt = normalizeDateTime(confirmation.confirmedAt)
  const attesterReference = required(confirmation.attesterReference, 'vital_sign_daily_attester_required')
  const observations = Object.freeze(draft.observations.map(graph => replacePrimaryClaims(graph, {
    ...graph.primary.claims,
    [ObservationClaim.Status]: 'final',
  })))
  const composition = buildFlatClaimResourceEntry({
    entryId: draft.composition.entryId,
    resourceType: 'Composition',
    claims: {
      ...draft.composition.claims,
      [CompositionClaim.Status]: 'final',
      [CompositionClaim.Attester]: attesterReference,
      [CompositionClaim.AttesterMode]: CompositionAttesterModes.Professional,
      [CompositionClaim.AttesterTime]: confirmedAt,
    },
  })
  return freezeDailyDocument(draft.localDate, draft.timeZone, 'final', composition, observations)
}

function buildBloodPressureComponent(
  input: Extract<VitalSignMeasurement, { kind: 'blood-pressure' }>,
  role: 'systolic' | 'diastolic',
  value: number,
  coding: CodingDescriptor,
): FlatClaimResourceEntry {
  const entryId = `${required(input.entryId, 'vital_sign_entry_id_required')}-${role}`
  const claims: Record<string, string> = {
    [ObservationClaim.Identifier]: entryId,
    [ObservationClaim.Subject]: required(input.subjectReference, 'vital_sign_subject_required'),
    [ObservationClaim.Category]: ObservationCategoryCodes.VitalSigns.claim,
    [ObservationClaim.Code]: coding.claim,
    [ObservationClaim.ValueQuantityNumber]: String(value),
    [ObservationClaim.ValueQuantityUnit]: VitalSignUnit.bloodPressure,
    [ObservationClaim.EffectiveDateTime]: normalizeDateTime(input.measuredAt),
  }
  if (coding.display) claims[ObservationClaim.CodeDisplay] = coding.display
  if (input.deviceReference) claims[ObservationClaim.Device] = required(input.deviceReference, 'vital_sign_device_required')
  if (input.eventTiming) claims[ObservationClaim.DateWhen] = normalizeEventTiming(input.eventTiming)
  return buildFlatClaimResourceEntry({ entryId, resourceType: 'Observation', claims })
}

function freezeObservationGraph(
  primary: FlatClaimResourceEntry,
  components: readonly FlatClaimResourceEntry[],
): VitalSignObservationGraph {
  const frozenComponents = Object.freeze([...components])
  return Object.freeze({ primary, components: frozenComponents, entries: Object.freeze([primary, ...frozenComponents]) })
}

function isVitalSignObservationGraph(
  source: VitalSignObservationGraph | FlatClaimResourceEntry | Readonly<Record<string, string>>,
): source is VitalSignObservationGraph {
  return 'primary' in source && 'components' in source && 'entries' in source
}

function componentQuantityFromEntry(entry: FlatClaimResourceEntry): ObservationComponentQuantity {
  if (entry.resourceType !== 'Observation') throw new TypeError('observation_component_invalid')
  const value = Number(entry.claims[ObservationClaim.ValueQuantityNumber])
  const code = entry.claims[ObservationClaim.Code]
  const unit = entry.claims[ObservationClaim.ValueQuantityUnit]
  if (!code || !unit || !Number.isFinite(value)) throw new TypeError('observation_component_invalid')
  const display = entry.claims[ObservationClaim.CodeDisplay]
  return Object.freeze({ code, ...(display ? { display } : {}), value, unit })
}

function scalarDefinition(
  kind: Exclude<VitalSignKind, 'blood-pressure'>,
  requestedUnit?: VitalSignQuantityUnit,
): Readonly<{ coding: CodingDescriptor; unit: VitalSignQuantityUnit }> {
  const definition = (() => {
    switch (kind) {
      case 'temperature': return { coding: VitalSignsCodes.BodyTemperature, units: [VitalSignUnit.temperature, VitalSignUnit.temperatureFahrenheit] as const }
      case 'heart-rate': return { coding: VitalSignsCodes.HeartRate, units: [VitalSignUnit.heartRate] as const }
      case 'oxygen-saturation': return { coding: VitalSignsCodes.OxygenSaturation, units: [VitalSignUnit.oxygenSaturation] as const }
      case 'respiratory-rate': return { coding: VitalSignsCodes.RespiratoryRate, units: [VitalSignUnit.respiratoryRate] as const }
      case 'body-weight': return { coding: VitalSignsCodes.BodyWeight, units: [VitalSignUnit.bodyWeight, VitalSignUnit.bodyWeightPound] as const }
    }
  })()
  const unit = requestedUnit ?? definition.units[0]
  if (!(definition.units as readonly string[]).includes(unit)) throw new TypeError('vital_sign_unit_invalid')
  return { coding: definition.coding, unit }
}

function normalizeDateTime(value: string): string {
  const date = new Date(value)
  if (!value.trim() || Number.isNaN(date.valueOf())) throw new TypeError('vital_sign_measured_at_invalid')
  return date.toISOString()
}

function normalizeEventTiming(value: string): VitalSignEventTiming {
  if (value === 'MORN' || value === 'AFT' || value === 'EVE' || value === 'NIGHT') return value
  throw new TypeError('vital_sign_event_timing_invalid')
}

function mean(values: readonly number[]): number {
  if (values.length === 0 || values.some(value => !validPositive(value))) throw new TypeError('vital_sign_value_invalid')
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10
}

function bloodPressureValue(reading: RepeatedVitalSignReading, key: 'systolic' | 'diastolic'): number {
  if (!('systolic' in reading) || !('diastolic' in reading)) throw new TypeError('blood_pressure_values_invalid')
  const value = key === 'systolic' ? reading.systolic : reading.diastolic
  if (typeof value !== 'number') throw new TypeError('blood_pressure_values_invalid')
  return value
}

function scalarReadingValue(reading: RepeatedVitalSignReading): number {
  if (!('value' in reading) || typeof reading.value !== 'number') throw new TypeError('vital_sign_value_invalid')
  return reading.value
}

function repeatedScalarUnit(
  kind: Exclude<VitalSignKind, 'blood-pressure'>,
  readings: readonly RepeatedVitalSignReading[],
): VitalSignQuantityUnit {
  const units = readings.map(reading => 'unit' in reading ? reading.unit : undefined)
  const selected = units.find((unit): unit is VitalSignQuantityUnit => Boolean(unit))
  if (units.some(unit => unit !== undefined && unit !== selected)) throw new TypeError('vital_sign_repeated_unit_mismatch')
  return scalarDefinition(kind, selected).unit
}

function replacePrimaryClaims(
  graph: VitalSignObservationGraph,
  claims: Readonly<Record<string, string>>,
): VitalSignObservationGraph {
  const primary = buildFlatClaimResourceEntry({
    entryId: graph.primary.entryId,
    resourceType: 'Observation',
    claims,
  })
  return freezeObservationGraph(primary, graph.components)
}

function freezeDailyDocument(
  localDate: string,
  timeZone: string,
  status: 'preliminary' | 'final',
  composition: FlatClaimResourceEntry,
  observations: readonly VitalSignObservationGraph[],
): VitalSignDailyDocument {
  const frozenObservations = Object.freeze([...observations])
  return Object.freeze({
    localDate,
    timeZone,
    status,
    composition,
    observations: frozenObservations,
    entries: Object.freeze([composition, ...frozenObservations.flatMap(graph => graph.entries)]),
  })
}

function normalizeLocalDate(value: string): string {
  const normalized = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) throw new TypeError('vital_sign_daily_local_date_invalid')
  const parsed = new Date(`${normalized}T00:00:00.000Z`)
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw new TypeError('vital_sign_daily_local_date_invalid')
  }
  return normalized
}

function normalizeTimeZone(value: string): string {
  const normalized = value.trim()
  if (!normalized) throw new TypeError('vital_sign_daily_time_zone_invalid')
  try {
    new Intl.DateTimeFormat('en', { timeZone: normalized }).format(0)
  } catch {
    throw new TypeError('vital_sign_daily_time_zone_invalid')
  }
  return normalized
}

function localDateAt(dateTime: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(dateTime))
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function latestEffectiveDateTime(graphs: readonly VitalSignObservationGraph[]): string {
  return graphs.map(graph => required(
    graph.primary.claims[ObservationClaim.EffectiveDateTime] ?? '',
    'vital_sign_measured_at_required',
  )).sort().at(-1)!
}

function validPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

function required(value: string, error: string): string {
  const normalized = value.trim()
  if (!normalized || normalized.includes(',')) throw new TypeError(error)
  return normalized
}

/** Reusable neutral fixtures; consumers and tests must not duplicate wire examples. */
export const VITAL_SIGN_EXAMPLES = Object.freeze({
  subjectReference: 'Patient/example-subject',
  deviceReference: 'Device/example-home-monitor',
  bloodPressure: Object.freeze({ entryId: 'bp-example-1', measuredAt: '2026-09-21T08:15:00-07:00', systolic: 121, diastolic: 79 }),
  heartRateBatch: Object.freeze([
    Object.freeze({ entryId: 'hr-example-1', kind: 'heart-rate' as const, measuredAt: '2026-09-20T08:00:00Z', value: 68 }),
    Object.freeze({ entryId: 'hr-example-2', kind: 'heart-rate' as const, measuredAt: '2026-09-21T08:00:00Z', value: 72 }),
  ]),
})
