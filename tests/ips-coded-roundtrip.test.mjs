// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as fhir from '../dist/index.js'

const IPS_SUBJECT = 'urn:uuid:2b7c6f10-2d7f-4f4a-b4d8-1c05a6ad8df1'

test('preserves every coding identity from the IPS AllergyIntolerance concept', () => {
  // These exact coding identities are the behavior under test from the HL7 IPS
  // all-sections example; the secondary WHO ATC coding must not disappear.
  const source = {
    resourceType: 'AllergyIntolerance',
    patient: { reference: IPS_SUBJECT },
    code: {
      coding: [
        { system: 'http://snomed.info/sct', code: '764146007', display: 'Penicillin' },
        { system: 'http://www.whocc.no/atc', code: 'J01CA', display: 'Penicillins with extended spectrum' },
      ],
    },
  }

  const claims = fhir.allergyIntoleranceFhirR4ToFlat(source)
  assert.equal(
    claims[fhir.AllergyIntoleranceClaim.Code],
    'http://snomed.info/sct|764146007,http://www.whocc.no/atc|J01CA',
  )

  const projected = fhir.allergyIntoleranceFlatToFhirR4(claims)
  assert.deepEqual(
    projected.code.coding.map(({ system, code }) => ({ system, code })),
    source.code.coding.map(({ system, code }) => ({ system, code })),
  )
  assert.equal(projected.code.text, undefined)
})

test('preserves IPS medication text, dosage narrative and the complete coded dose quantity', () => {
  // This exact medication and quantity come from the HL7 IPS all-sections
  // example and prove that Quantity.unit is not replaced with system|code.
  const source = {
    resourceType: 'MedicationStatement',
    status: 'active',
    subject: { reference: IPS_SUBJECT },
    medicationCodeableConcept: {
      coding: [{
        system: 'http://www.whocc.no/atc',
        code: 'C05AA08',
        display: 'Fluocortolone',
      }],
      text: 'Ultraproct - cinchocaine 0.5% (5 mg/g) + fluocortolone hexanoate 0.095% (945 microgram/g) + fluocortolone pivalate 0.092% (918 microgram/g) ointment',
    },
    dosage: [{
      text: 'apply a small amount to the affected area up to 4 times daily on the first day, then twice daily for at least 1 week; continue for up to a maximum of 4 weeks',
      doseAndRate: [{
        doseQuantity: {
          value: 1,
          unit: 'ointment',
          system: 'http://snomed.info/sct',
          code: '385101003',
        },
      }],
    }],
  }

  const claims = fhir.medicationStatementFhirR4ToFlat(source)
  assert.equal(claims[fhir.MedicationStatementClaim.CodeText], source.medicationCodeableConcept.text)
  assert.equal(claims[fhir.MedicationStatementClaim.DosageInstruction], source.dosage[0].text)
  assert.equal(
    claims[fhir.MedicationStatementClaimsFhirApiExtended.DoseQuantity],
    'http://snomed.info/sct|385101003',
  )
  assert.equal(claims[fhir.MedicationStatementClaim.DoseQuantityUnit], 'ointment')

  const projected = fhir.medicationStatementFlatToFhirR4(claims)
  assert.deepEqual(projected.medicationCodeableConcept, source.medicationCodeableConcept)
  assert.equal(projected.dosage[0].text, source.dosage[0].text)
  assert.deepEqual(projected.dosage[0].doseAndRate[0].doseQuantity, source.dosage[0].doseAndRate[0].doseQuantity)
})
