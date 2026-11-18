// Copyright 2026 Antifraud Services Inc. under Apache-2.0.
import * as converters from './converters/index.js'
import type {FhirResource,FlatClaims} from './converters/convert-shared.js'
import {normalizeFhirApiClaimKey} from './claim-helpers/fhir-api-claim-key.js'
const context='org.hl7.fhir.api'
const families=['MedicationStatement','AllergyIntolerance','Condition','DocumentReference','DeviceUseStatement','Immunization','Location','Organization','Procedure','Device','Flag','CarePlan','DiagnosticReport','Composition','Appointment','AppointmentResponse','Encounter','RelatedPerson','Coverage','ClinicalImpression','Consent','PractitionerRole'] as const
const importers:Record<string,(resource:FhirResource)=>FlatClaims>={Observation:converters.observationToFlatFhirR4}
const exporters:Record<string,(claims:FlatClaims)=>FhirResource>={Observation:converters.observationFromFlatToFhirR4}
for(const family of families){
 const lower=family[0].toLowerCase()+family.slice(1)
 const modules=converters as unknown as Record<string,unknown>
 const reader=modules[`${lower}FhirR4ToFlat`],writer=modules[`${lower}FlatToFhirR4`]
 if(typeof reader!=='function'||typeof writer!=='function')throw new TypeError(`fhir_r4_adapter_missing_${family}`)
 importers[family]=reader as (resource:FhirResource)=>FlatClaims
 exporters[family]=writer as (claims:FlatClaims)=>FhirResource
}
/** Native R4 adapter input; existing claims remain the explicit persisted projection and technical id is never substituted for business identity. */
export function normalizeClaimsFromFhirResource(resource:FhirResource,input:Readonly<{identifierClaimKey?:string}>={}):Record<string,unknown>{
 const converted=(importers[resource.resourceType]??converters.fhirResourceToFlatClaims)(resource)
 const existing=resource.meta?.claims
 const claims:Record<string,unknown>={'@context':context,...converted,...(existing&&typeof existing==='object'&&!Array.isArray(existing)?existing:{})}
 if(typeof resource.language==='string'&&resource.language.trim())claims[`${resource.resourceType}.language`]=resource.language.trim()
 const identifier=Array.isArray(resource.identifier)?resource.identifier[0]?.value:undefined
 const key=String(input.identifierClaimKey??'').trim()||`${resource.resourceType}.identifier`
 if(typeof identifier==='string'&&identifier.trim()&&!String(claims[key]??'').trim())claims[key]=identifier.trim()
 return claims
}
function shortKey(key:string):string{
 try{return normalizeFhirApiClaimKey(key)}catch(error){
  if(key.startsWith('org.hl7.fhir.')&&!key.startsWith(`${context}.`))throw error
  const short=key.startsWith(`${context}.`)?key.slice(context.length+1):key
  // Structural fallback retains the owned generic converter's array/type-hint syntax.
  if(/^[A-Z][A-Za-z0-9]+\./u.test(short))return short
  return key
 }
}
/** R4 exchange projection over version-neutral claims. Native FHIR remains an adapter output, never a second stored business model. */
export function convertClaimsToFhirResource(claims:Readonly<Record<string,unknown>>,version:'r4'='r4'):FhirResource{
 if(version!=='r4')throw new TypeError('fhir_adapter_version_unsupported')
 const declared=String(claims['@context']??'').trim()
 if(declared.startsWith('org.hl7.fhir.')&&declared!==context)throw new TypeError('fhir_claim_namespace_invalid')
 const flat:FlatClaims={}
 const entries=Object.entries(claims).filter(([key,value])=>key!=='@context'&&value!==undefined&&value!==null)
 // Qualified syntax is accepted at import; an explicit short key retains established precedence.
 for(const [key,value]of entries)if(shortKey(key)!==key)flat[shortKey(key)]=String(value)
 for(const [key,value]of entries)if(shortKey(key)===key)flat[key]=String(value)
 const prefixes=Object.keys(flat).filter(key=>key.includes('.')&&!key.startsWith('@')).map(key=>key.split('.')[0])
 const type=['MedicationStatement','AllergyIntolerance','Condition','DocumentReference'].find(prefix=>prefixes.includes(prefix))??prefixes.find(prefix=>prefix!=='Composition')??prefixes[0]
 const native=(exporters[type]??converters.flatClaimsToFhirResource)(flat)
 const language=type?flat[`${type}.language`]?.trim():undefined
 return language?{...native,language}:native
}
