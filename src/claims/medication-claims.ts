import type { ClaimSpec } from './claim-types.js'

/** Canonical flat claims used by a FHIR Medication graph entry. */
export const MedicationClaim = Object.freeze({
  Identifier: 'Medication.identifier',
  Code: 'Medication.code',
  CodeText: 'Medication.code-text',
  CodeDisplay: 'Medication.code-display',
  Manufacturer: 'Medication.manufacturer',
  Form: 'Medication.form',
  LotNumber: 'Medication.lot-number',
  ExpirationDate: 'Medication.expiration-date',
  SerialNumber: 'Medication.serial-number',
} as const)

export type MedicationClaimKey = typeof MedicationClaim[keyof typeof MedicationClaim]

export const MedicationClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: MedicationClaim.Identifier, meaning: 'Medication business identifier.', example: 'urn:uuid:medication-1' },
  { key: MedicationClaim.Code, meaning: 'Medication coding token.', example: 'http://www.whocc.no/atc|J07BB02' },
  { key: MedicationClaim.CodeText, meaning: 'Source-language medication label.', example: 'Vacuna antigripal' },
  { key: MedicationClaim.CodeDisplay, meaning: 'Canonical terminology display.', example: 'Influenza vaccine' },
  { key: MedicationClaim.Manufacturer, meaning: 'Manufacturer reference or governed identifier.', example: 'Organization/manufacturer-1' },
  { key: MedicationClaim.Form, meaning: 'Medication dose-form coding token.', example: 'http://snomed.info/sct|385219001' },
  { key: MedicationClaim.LotNumber, meaning: 'Manufacturer lot number.', example: 'LOT-1' },
  { key: MedicationClaim.ExpirationDate, meaning: 'Batch expiration date.', example: '2027-09-21' },
  { key: MedicationClaim.SerialNumber, meaning: 'Package serial or barcode.', example: '0123456789012' },
])
