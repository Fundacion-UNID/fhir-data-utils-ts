// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.

import {
  buildFlatClaimResourceEntry,
  linkFlatClaimResourceEntries,
  type FlatClaimResourceEntry,
} from '../flat-claim-resource-graph.js'
import {
  buildImmunizationReminderTasks,
  ImmunizationReminderChannels,
  type ImmunizationReminderChannel,
} from './immunization-reminders.js'
import { ImmunizationClaim } from '../claims/immunization-claims.js'
import {
  ImmunizationRecommendationClaim,
  ImmunizationRecommendationCodes,
} from '../claims/immunization-recommendation-claims.js'
import { MedicationClaim } from '../claims/medication-claims.js'
import { ResourceTypesFhirR4 } from '../constants/fhir-resource-types.js'

export type ImmunizationCoding = Readonly<{
  system: string
  code: string
  display?: string
  text?: string
}>

export type ImmunizationFlatInput = Readonly<{
  entryId: string
  identifier?: string
  subjectReference: string
  administrationDate: string
  vaccineCode: ImmunizationCoding
  performerReference?: string
  targetDiseases?: readonly ImmunizationCoding[]
  nextDoseDate?: string
  /** FHIR dateTime when the recommendation was created; required with nextDoseDate. */
  recommendationDate?: string
  reminderChannels?: readonly ImmunizationReminderChannel[]
  medication?: Readonly<{
    entryId: string
    productName: string
    identifiers?: readonly Readonly<{ system: string, value: string }>[]
    manufacturer?: string
    lotNumber?: string
    expirationDate?: string
    barcode?: string
  }>
  attachments?: readonly FlatClaimResourceEntry[]
}>

export type ImmunizationRecommendationFlatInput = Readonly<{
  entryId: string
  immunizationEntryId: string
  subjectReference: string
  recommendationDate: string
  nextDoseDate: string
  vaccineCode: ImmunizationCoding
}>

/** Validates the optional positive dose number and its optional series total. */
export function validateImmunizationDoseSeries(doseSequence?: string, seriesDoses?: string): void {
  const dose = positiveInteger(doseSequence, 'immunization_dose_sequence_invalid')
  const total = positiveInteger(seriesDoses, 'immunization_series_doses_invalid')
  if (dose !== undefined && total !== undefined && total < dose) {
    throw new TypeError('immunization_series_doses_invalid')
  }
}

/** Builds the recommendation related to one staged Immunization without reminder transport. */
export function buildImmunizationRecommendationFlatEntry(input: ImmunizationRecommendationFlatInput): FlatClaimResourceEntry {
  return buildFlatClaimResourceEntry({
    entryId: required(input.entryId, 'immunization_recommendation_id_required'),
    resourceType: ResourceTypesFhirR4.ImmunizationRecommendation,
    claims: {
      [ImmunizationRecommendationClaim.Patient]: required(input.subjectReference, 'immunization_subject_required'),
      [ImmunizationRecommendationClaim.Date]: isoDate(input.recommendationDate, 'immunization_recommendation_date_invalid'),
      [ImmunizationRecommendationClaim.VaccineCode]: codingToken(input.vaccineCode),
      [ImmunizationRecommendationClaim.ForecastStatus]: ImmunizationRecommendationCodes.ForecastDue,
      [ImmunizationRecommendationClaim.DateCriterionCode]: ImmunizationRecommendationCodes.RecommendedDate,
      [ImmunizationRecommendationClaim.DateCriterionValue]: isoDate(input.nextDoseDate, 'immunization_next_dose_date_invalid'),
      [ImmunizationRecommendationClaim.SupportingImmunization]: `${ResourceTypesFhirR4.Immunization}/${required(input.immunizationEntryId, 'immunization_id_required')}`,
    },
  })
}

/** Builds the shared claims-first human/animal immunization resource graph. */
export function buildImmunizationFlatGraph(input: ImmunizationFlatInput): readonly FlatClaimResourceEntry[] {
  const vaccineCode = codingToken(input.vaccineCode)
  const claims: Record<string, string> = {
    [ImmunizationClaim.Status]: 'completed',
    [ImmunizationClaim.Patient]: required(input.subjectReference, 'immunization_subject_required'),
    [ImmunizationClaim.Date]: isoDate(input.administrationDate, 'immunization_date_invalid'),
    [ImmunizationClaim.VaccineCode]: vaccineCode,
  }
  if (input.identifier) claims[ImmunizationClaim.Identifier] = required(input.identifier, 'immunization_identifier_invalid')
  if (input.vaccineCode.display?.trim()) claims[ImmunizationClaim.VaccineCodeDisplay] = input.vaccineCode.display.trim()
  if (input.vaccineCode.text?.trim()) claims[ImmunizationClaim.VaccineCodeText] = input.vaccineCode.text.trim()
  if (input.performerReference) claims[ImmunizationClaim.Performer] = required(input.performerReference, 'immunization_performer_invalid')
  if (input.targetDiseases?.length) {
    claims[ImmunizationClaim.TargetDisease] = input.targetDiseases.map(codingToken).join(',')
    claims[ImmunizationClaim.TargetDiseaseDisplay] = input.targetDiseases.map(value => value.display?.trim() ?? '').join(',')
    claims[ImmunizationClaim.TargetDiseaseText] = input.targetDiseases.map(value => value.text?.trim() ?? '').join(',')
  }

  const immunization = buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: ResourceTypesFhirR4.Immunization, claims })
  const children: FlatClaimResourceEntry[] = []
  if (input.medication) children.push(buildMedicationEntry(input.medication))
  if (input.nextDoseDate) {
    const recommendationId = `${input.entryId}-recommendation`
    const recommendation = buildImmunizationRecommendationFlatEntry({
      entryId: recommendationId,
      immunizationEntryId: input.entryId,
      subjectReference: input.subjectReference,
      recommendationDate: required(input.recommendationDate, 'immunization_recommendation_date_required'),
      nextDoseDate: input.nextDoseDate,
      vaccineCode: input.vaccineCode,
    })
    const tasks = buildImmunizationReminderTasks({
      entryIdPrefix: recommendationId,
      recommendationReference: recommendation.reference,
      subjectReference: input.subjectReference,
      coverageEndDate: input.nextDoseDate,
      channelCandidates: input.reminderChannels ?? ImmunizationReminderChannels,
    })
    children.push(recommendation, ...tasks)
  }
  for (const attachment of input.attachments ?? []) {
    if (attachment.resourceType !== ResourceTypesFhirR4.DocumentReference) throw new TypeError('immunization_attachment_invalid')
    children.push(attachment)
  }
  const graph = [immunization, ...children]
  const linkedToImmunization = children.length
    ? linkFlatClaimResourceEntries(graph, {
        parentEntryId: input.entryId,
    childEntryIds: children.filter(entry => entry.resourceType !== ResourceTypesFhirR4.Task).map(entry => entry.entryId),
      })
    : graph
  const recommendation = linkedToImmunization.find(entry => entry.resourceType === ResourceTypesFhirR4.ImmunizationRecommendation)
  const tasks = linkedToImmunization.filter(entry => entry.resourceType === ResourceTypesFhirR4.Task)
  return recommendation && tasks.length
    ? linkFlatClaimResourceEntries(linkedToImmunization, {
        parentEntryId: recommendation.entryId,
        childEntryIds: tasks.map(entry => entry.entryId),
      })
    : linkedToImmunization
}

function buildMedicationEntry(input: NonNullable<ImmunizationFlatInput['medication']>): FlatClaimResourceEntry {
  const claims: Record<string, string> = {
    [MedicationClaim.Code]: required(input.productName, 'medication_product_required'),
    [MedicationClaim.CodeText]: required(input.productName, 'medication_product_required'),
  }
  if (input.identifiers?.length) claims[MedicationClaim.Identifier] = input.identifiers
    .map(({ system, value }) => `${required(system, 'medication_identifier_invalid')}|${required(value, 'medication_identifier_invalid')}`)
    .join(',')
  if (input.manufacturer?.trim()) claims[MedicationClaim.Manufacturer] = input.manufacturer.trim()
  if (input.lotNumber?.trim()) claims[MedicationClaim.LotNumber] = input.lotNumber.trim()
  if (input.expirationDate) claims[MedicationClaim.ExpirationDate] = isoDate(input.expirationDate, 'medication_expiration_date_invalid')
  if (input.barcode?.trim()) claims[MedicationClaim.SerialNumber] = input.barcode.trim()
  return buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: ResourceTypesFhirR4.Medication, claims })
}

function codingToken(value: ImmunizationCoding): string {
  return `${required(value.system, 'immunization_coding_system_required')}|${required(value.code, 'immunization_coding_code_required')}`
}

function isoDate(value: string, error: string): string {
  const normalized = required(value, error)
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(normalized)
  if (!match || Number.isNaN(Date.parse(normalized))) throw new TypeError(error)
  const calendarDate = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (calendarDate.toISOString().slice(0, 10) !== `${match[1]}-${match[2]}-${match[3]}`) throw new TypeError(error)
  return normalized
}

function required(value: unknown, error: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(error)
  return value.trim()
}

function positiveInteger(value: string | undefined, error: string): number | undefined {
  if (value === undefined || value === '') return undefined
  if (!/^\d+$/.test(value) || Number(value) <= 0) throw new TypeError(error)
  return Number(value)
}
