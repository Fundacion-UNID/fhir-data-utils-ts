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

/** Native attachment exchange subset; data is base64 and hash is the native base64 digest.
 * https://hl7.org/fhir/R4/datatypes.html#Attachment
 */
export type FhirAttachment = Readonly<{
  contentType?: string
  language?: string
  data?: string
  url?: string
  title?: string
  creation?: string
  hash?: string
}>

/** Native metadata projection. Additional consumer fields remain unknown here;
 * this package does not assign persistence or authorization meaning to them.
 */
export type FhirMeta = Readonly<{
  versionId?: string
  lastUpdated?: string
  source?: string
  profile?: readonly string[]
  security?: readonly FhirCoding[]
  tag?: readonly FhirCoding[]
  [key: string]: unknown
}>

/** Partial native Communication payload projection, not a content-choice validator. */
export type FhirCommunicationPayload = Readonly<{
  contentString?: string
  contentAttachment?: FhirAttachment
  contentReference?: FhirReference
}>

/** Exclusive R4 content choice using the package's partial exchange primitives.
 * This is not a complete resource/profile validator. R5 uses CodeableConcept
 * instead of contentString and needs its own explicit adapter.
 * https://hl7.org/fhir/R4/communication-definitions.html#Communication.payload.content_x_
 */
export type FhirR4CommunicationPayloadItem =
  | Readonly<{contentString: string; contentReference?: never; contentAttachment?: never}>
  | Readonly<{contentReference: FhirReference; contentString?: never; contentAttachment?: never}>
  | Readonly<{contentAttachment: FhirAttachment; contentString?: never; contentReference?: never}>

/** Native Communication exchange projection used at explicit adapter boundaries.
 * Optional fields allow partial projections; this is not full profile validation.
 * Consumers may specialize metadata explicitly without defining a second stored
 * clinical model. Routing, delivery, identity and authorization remain downstream.
 * https://hl7.org/fhir/R4/communication.html
 */
export interface FhirCommunicationResource<TMeta extends FhirMeta = FhirMeta> extends FhirResource {
  resourceType: 'Communication'
  meta?: TMeta
  status?: string
  category?: readonly FhirCodeableConcept[]
  subject?: FhirReference
  recipient?: readonly FhirReference[]
  sender?: FhirReference
  sent?: string
  payload?: readonly FhirCommunicationPayload[]
  partOf?: readonly FhirReference[]
  note?: readonly FhirAnnotation[]
}

/** Compatibility spelling for the neutral native Communication projection. */
export type FhirCommunication<TMeta extends FhirMeta = FhirMeta> = FhirCommunicationResource<TMeta>
