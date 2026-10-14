export const HealthCredentialQrPayloadKinds = Object.freeze({
  SmartHealthCard: 'smart-health-card',
  DigitalGreenCertificate: 'digital-green-certificate',
  Unknown: 'unknown',
} as const)

export type HealthCredentialQrPayloadKind = typeof HealthCredentialQrPayloadKinds[keyof typeof HealthCredentialQrPayloadKinds]

export type HealthCredentialQrClassification = Readonly<{
  kind: HealthCredentialQrPayloadKind
  value: string
}>

/**
 * Recognizes the wire prefix only. This function does not decode, verify,
 * authorize, trust or persist the credential or any embedded FHIR resource.
 */
export function classifyHealthCredentialQrPayload(value: unknown): HealthCredentialQrClassification {
  const normalized = String(value ?? '').trim()
  const upper = normalized.toUpperCase()
  if (normalized.toLowerCase().startsWith('shc:/')) return Object.freeze({ kind: HealthCredentialQrPayloadKinds.SmartHealthCard, value: normalized })
  if (upper.startsWith('HC1:') || upper.startsWith('NO1:')) return Object.freeze({ kind: HealthCredentialQrPayloadKinds.DigitalGreenCertificate, value: normalized })
  return Object.freeze({ kind: HealthCredentialQrPayloadKinds.Unknown, value: normalized })
}
