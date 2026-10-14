// Flow contract: classify repository-safe health credential QR examples without treating recognition as verification or authorization.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  HealthCredentialQrPayloadKinds,
  classifyHealthCredentialQrPayload,
} from '../dist/health-credential-qr.js'
import { HEALTH_CREDENTIAL_QR_EXAMPLES } from '../dist/data/index.js'

test('classifies SMART Health Card and EU Digital Green Certificate payloads from shared data', () => {
  assert.equal(
    classifyHealthCredentialQrPayload(HEALTH_CREDENTIAL_QR_EXAMPLES.smartHealthCard).kind,
    HealthCredentialQrPayloadKinds.SmartHealthCard,
  )
  assert.equal(
    classifyHealthCredentialQrPayload(HEALTH_CREDENTIAL_QR_EXAMPLES.europeanDigitalCertificate).kind,
    HealthCredentialQrPayloadKinds.DigitalGreenCertificate,
  )
})

test('returns unknown for a subject card identifier and never reports verification', () => {
  const result = classifyHealthCredentialQrPayload(HEALTH_CREDENTIAL_QR_EXAMPLES.nonCredentialIdentifier)
  assert.equal(result.kind, HealthCredentialQrPayloadKinds.Unknown)
  assert.deepEqual(Object.keys(result).sort(), ['kind', 'value'])
})
