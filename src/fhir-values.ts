import type { FhirCoding, FhirIdentifier, FhirQuantity, FhirReference } from './fhir-types.js'

/** Serializes a Coding as the established `system|code` flat token. */
export function codingToToken(coding: FhirCoding | undefined): string | undefined {
  const code = coding?.code?.trim()
  if (!code) return undefined
  const system = coding?.system?.trim()
  return system ? `${system}|${code}` : code
}

/** Parses a flat coding token without treating URI colons or slashes as separators. */
export function tokenToCoding(token: string | undefined): FhirCoding | undefined {
  const value = token?.trim()
  if (!value) return undefined
  const separator = value.lastIndexOf('|')
  return separator < 0
    ? Object.freeze({ code: value })
    : Object.freeze({ system: value.slice(0, separator) || undefined, code: value.slice(separator + 1) })
}

/** Serializes an Identifier without discarding its assigning system. */
export function identifierToToken(identifier: FhirIdentifier | undefined): string | undefined {
  const value = identifier?.value?.trim()
  if (!value) return undefined
  const system = identifier?.system?.trim()
  return system ? `${system}|${value}` : value
}

export function tokenToIdentifier(token: string | undefined): FhirIdentifier | undefined {
  const coding = tokenToCoding(token)
  return coding?.code ? Object.freeze({ system: coding.system, value: coding.code }) : undefined
}

export function referenceToString(reference: FhirReference | undefined): string | undefined {
  return reference?.reference?.trim() || undefined
}

export function stringToReference(reference: string | undefined): FhirReference | undefined {
  const value = reference?.trim()
  return value ? Object.freeze({ reference: value }) : undefined
}

/** Serializes Quantity as `value|system|code`; unit remains display-only. */
export function quantityToToken(quantity: FhirQuantity | undefined): string | undefined {
  if (quantity?.value === undefined || !Number.isFinite(quantity.value)) return undefined
  return [String(quantity.value), quantity.system?.trim() ?? '', quantity.code?.trim() ?? ''].join('|')
}

export function tokenToQuantity(token: string | undefined): FhirQuantity | undefined {
  const value = token?.trim()
  if (!value) return undefined
  const [numberValue, system, code] = value.split('|')
  const numeric = Number(numberValue)
  if (!Number.isFinite(numeric)) throw new TypeError('fhir_quantity_token_invalid')
  return Object.freeze({ value: numeric, ...(system ? { system } : {}), ...(code ? { code, unit: code } : {}) })
}
