/** Version-neutral FHIR primitives used by flat-claim adapters. */
export type FhirPrimitive = string | number | boolean

export type FhirCoding = Readonly<{
  system?: string
  version?: string
  code?: string
  display?: string
  userSelected?: boolean
}>

export type FhirCodeableConcept = Readonly<{
  coding?: readonly FhirCoding[]
  text?: string
}>

export type FhirIdentifier = Readonly<{
  use?: string
  type?: FhirCodeableConcept
  system?: string
  value?: string
  period?: FhirPeriod
  assigner?: FhirReference
}>

export type FhirReference = Readonly<{
  reference?: string
  type?: string
  identifier?: FhirIdentifier
  display?: string
}>

export type FhirQuantity = Readonly<{
  value?: number
  comparator?: '<' | '<=' | '>=' | '>'
  unit?: string
  system?: string
  code?: string
}>

export type FhirPeriod = Readonly<{ start?: string; end?: string }>
export type FhirAnnotation = Readonly<{ authorReference?: FhirReference; authorString?: string; time?: string; text: string }>
export type FhirContactPoint = Readonly<{
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other'
  value?: string
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile'
  rank?: number
  period?: FhirPeriod
}>

export type FhirResource = Readonly<{
  resourceType: string
  id?: string
  language?: string
  meta?: Readonly<Record<string, unknown>>
  contained?: readonly FhirResource[]
  [key: string]: unknown
}>

export type FhirBundleEntry<TResource extends FhirResource = FhirResource> = Readonly<{
  fullUrl?: string
  resource?: TResource
  request?: Readonly<{ method?: string; url?: string }>
  response?: Readonly<{ status?: string; location?: string }>
}>

export type FhirBundle<TResource extends FhirResource = FhirResource> = FhirResource & Readonly<{
  resourceType: 'Bundle'
  type?: string
  total?: number
  entry?: readonly FhirBundleEntry<TResource>[]
}>
