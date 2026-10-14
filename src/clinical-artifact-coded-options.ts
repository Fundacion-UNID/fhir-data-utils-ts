// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

import { AllergyIntoleranceClaim } from './claims/allergy-intolerance-claims.js'
import { ConditionClaim } from './claims/condition-claims.js'
import { ImmunizationClaim } from './claims/immunization-claims.js'
import { MedicationStatementClaim } from './claims/medication-statement-claims.js'
import { ProcedureClaim } from './claims/procedure-claims.js'
import { ObservationCategoryCodes, ObservationClaim } from './observation-claims.js'

export type FhirClinicalCodedOption = Readonly<{
  code: string
  labels: Readonly<{ en: string; es: string }>
}>

export type FhirClinicalCodedOptionSet = Readonly<{
  fhirVersion: 'R4'
  binding: 'required' | 'preferred'
  system: string
  options: readonly FhirClinicalCodedOption[]
}>

const option = (code: string, en: string, es: string): FhirClinicalCodedOption =>
  Object.freeze({ code, labels: Object.freeze({ en, es }) })

const requiredSet = (system: string, options: readonly FhirClinicalCodedOption[]): FhirClinicalCodedOptionSet =>
  Object.freeze({ fhirVersion: 'R4', binding: 'required', system, options: Object.freeze(options) })
const preferredSet = (system: string, options: readonly FhirClinicalCodedOption[]): FhirClinicalCodedOptionSet =>
  Object.freeze({ fhirVersion: 'R4', binding: 'preferred', system, options: Object.freeze(options) })

const enteredInError = option('entered-in-error', 'Entered in error', 'Introducido por error')
const unknown = option('unknown', 'Unknown', 'Desconocido')

/**
 * Required FHIR R4 code bindings used by the reusable IPS artifact editor.
 *
 * Extensible and example bindings deliberately stay out of this catalog: they
 * require terminology search or free entry and must not be rendered as closed
 * dropdowns.
 */
export const FHIR_IPS_CLINICAL_CODED_OPTION_SETS: Readonly<Record<string, FhirClinicalCodedOptionSet>> = Object.freeze({
  [AllergyIntoleranceClaim.ClinicalStatus]: requiredSet(
    'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
    [option('active', 'Active', 'Activo'), option('inactive', 'Inactive', 'Inactivo'), option('resolved', 'Resolved', 'Resuelto')],
  ),
  [AllergyIntoleranceClaim.VerificationStatus]: requiredSet(
    'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
    [option('unconfirmed', 'Unconfirmed', 'No confirmado'), option('confirmed', 'Confirmed', 'Confirmado'), option('refuted', 'Refuted', 'Refutado'), enteredInError],
  ),
  [AllergyIntoleranceClaim.Category]: requiredSet(
    'http://hl7.org/fhir/allergy-intolerance-category',
    [option('food', 'Food', 'Alimento'), option('medication', 'Medication', 'Medicamento'), option('environment', 'Environment', 'Entorno'), option('biologic', 'Biologic', 'Biológico')],
  ),
  [AllergyIntoleranceClaim.Criticality]: requiredSet(
    'http://hl7.org/fhir/allergy-intolerance-criticality',
    [option('low', 'Low risk', 'Riesgo bajo'), option('high', 'High risk', 'Riesgo alto'), option('unable-to-assess', 'Unable to assess', 'No se puede evaluar')],
  ),
  [MedicationStatementClaim.Status]: requiredSet(
    'http://hl7.org/fhir/CodeSystem/medication-statement-status',
    [option('active', 'Active', 'Activo'), option('completed', 'Completed', 'Completado'), enteredInError, option('intended', 'Intended', 'Previsto'), option('stopped', 'Stopped', 'Interrumpido'), option('on-hold', 'On hold', 'En espera'), unknown, option('not-taken', 'Not taken', 'No tomado')],
  ),
  [ImmunizationClaim.Status]: requiredSet(
    'http://hl7.org/fhir/event-status',
    [option('completed', 'Completed', 'Completado'), enteredInError, option('not-done', 'Not done', 'No realizado')],
  ),
  [ConditionClaim.ClinicalStatus]: requiredSet(
    'http://terminology.hl7.org/CodeSystem/condition-clinical',
    [option('active', 'Active', 'Activo'), option('recurrence', 'Recurrence', 'Recurrencia'), option('relapse', 'Relapse', 'Recaída'), option('inactive', 'Inactive', 'Inactivo'), option('remission', 'Remission', 'Remisión'), option('resolved', 'Resolved', 'Resuelto')],
  ),
  [ConditionClaim.VerificationStatus]: requiredSet(
    'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    [option('unconfirmed', 'Unconfirmed', 'No confirmado'), option('provisional', 'Provisional', 'Provisional'), option('differential', 'Differential', 'Diferencial'), option('confirmed', 'Confirmed', 'Confirmado'), option('refuted', 'Refuted', 'Refutado'), enteredInError],
  ),
  [ProcedureClaim.Status]: requiredSet(
    'http://hl7.org/fhir/event-status',
    [option('preparation', 'Preparation', 'Preparación'), option('in-progress', 'In progress', 'En curso'), option('not-done', 'Not done', 'No realizado'), option('on-hold', 'On hold', 'En espera'), option('stopped', 'Stopped', 'Detenido'), option('completed', 'Completed', 'Completado'), enteredInError, unknown],
  ),
  [ObservationClaim.Status]: requiredSet(
    'http://hl7.org/fhir/observation-status',
    [option('registered', 'Registered', 'Registrado'), option('preliminary', 'Preliminary', 'Preliminar'), option('final', 'Final', 'Final'), option('amended', 'Amended', 'Modificado'), option('corrected', 'Corrected', 'Corregido'), option('cancelled', 'Cancelled', 'Cancelado'), enteredInError, unknown],
  ),
  [ObservationClaim.Category]: preferredSet(
    ObservationCategoryCodes.VitalSigns.system,
    [
      option(ObservationCategoryCodes.SocialHistory.claim, 'Social history (HL7|social-history)', 'Historia social (HL7|social-history)'),
      option(ObservationCategoryCodes.VitalSigns.claim, 'Vital signs (HL7|vital-signs)', 'Signos vitales (HL7|vital-signs)'),
      option(ObservationCategoryCodes.Imaging.claim, 'Imaging (HL7|imaging)', 'Diagnóstico por imagen (HL7|imaging)'),
      option(ObservationCategoryCodes.Laboratory.claim, 'Laboratory (HL7|laboratory)', 'Laboratorio (HL7|laboratory)'),
      option(ObservationCategoryCodes.Procedure.claim, 'Procedure (HL7|procedure)', 'Procedimiento (HL7|procedure)'),
      option(ObservationCategoryCodes.Survey.claim, 'Survey (HL7|survey)', 'Cuestionario (HL7|survey)'),
      option(ObservationCategoryCodes.Exam.claim, 'Exam (HL7|exam)', 'Exploración (HL7|exam)'),
      option(ObservationCategoryCodes.Therapy.claim, 'Therapy (HL7|therapy)', 'Terapia (HL7|therapy)'),
      option(ObservationCategoryCodes.Activity.claim, 'Activity (HL7|activity)', 'Actividad (HL7|activity)'),
    ],
  ),
})

/** Returns localized labels while preserving the exact canonical code value. */
export function clinicalArtifactCodedOptionsForClaim(
  claim: string,
  locale: string,
): readonly Readonly<{ code: string; label: string }>[] {
  const set = FHIR_IPS_CLINICAL_CODED_OPTION_SETS[claim]
  if (!set) return Object.freeze([])
  const language = locale.trim().toLowerCase().split('-')[0] === 'es' ? 'es' : 'en'
  return Object.freeze(set.options.map(entry => Object.freeze({ code: entry.code, label: entry.labels[language] })))
}
