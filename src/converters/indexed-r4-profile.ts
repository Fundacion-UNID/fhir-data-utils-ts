import type {FhirResource, FlatClaims} from './convert-shared.js'
import {codingListFromCsv,codingListToCsv,identifierFromValue,identifierToValue,isPlainObject,fhirResourceToFlatClaims,flatClaimsToFhirResource} from './convert-shared.js'
import {normalizeFhirApiClaimKey} from '../claim-helpers/fhir-api-claim-key.js'
import {ResourceTypesFhirR4 as R,ResourceTypesFhirR5 as R5} from '../constants/fhir-resource-types.js'
import {ObservationClaim as O} from '../observation-claims.js'
import {AllergyIntoleranceClaim,CarePlanClaim,CompositionClaim,ConditionClaim,ClaimConsent,DeviceUseStatementClaim,DiagnosticReportClaim,DocumentReferenceClaim,FlagClaim,ImmunizationClaim,MedicationStatementClaim,RelatedPersonClaim,EncounterClaim,OrganizationClaim,PractitionerRoleClaim} from '../claims/index.js'
import {allergyIntoleranceFhirR4ToFlat,allergyIntoleranceFlatToFhirR4} from './convert-allergy-intolerance.js'
import {carePlanFhirR4ToFlat,carePlanFlatToFhirR4} from './convert-care-plan.js'
import {compositionFhirR4ToFlat,compositionFlatToFhirR4} from './convert-composition.js'
import {conditionFhirR4ToFlat,conditionFlatToFhirR4} from './convert-condition.js'
import {consentFhirR4ToFlat,consentFlatToFhirR4} from './convert-consent.js'
import {deviceUseStatementFhirR4ToFlat,deviceUseStatementFlatToFhirR4} from './convert-device-use-statement.js'
import {diagnosticReportFhirR4ToFlat,diagnosticReportFlatToFhirR4} from './convert-diagnostic-report.js'
import {documentReferenceFhirR4ToFlat,documentReferenceFlatToFhirR4} from './convert-document-reference.js'
import {flagFhirR4ToFlat,flagFlatToFhirR4} from './convert-flag.js'
import {immunizationFhirR4ToFlat,immunizationFlatToFhirR4} from './convert-immunization.js'
import {medicationStatementFhirR4ToFlat,medicationStatementFlatToFhirR4} from './convert-medication-statement.js'
import {observationToFlatFhirR4,observationFromFlatToFhirR4} from './convert-observation.js'
import {procedureFhirR4ToFlat,procedureFlatToFhirR4} from './convert-procedure.js'
import {ProcedureClaim} from '../claims/procedure-claims.js'
import {MedicationStatementClaimsFhirApiExtended} from '../claims/medication-statement-claims.js'
import {relatedPersonFhirR4ToFlat,relatedPersonFlatToFhirR4} from './convert-related-person.js'
import {encounterFhirR4ToFlat,encounterFlatToFhirR4} from './convert-encounter.js'
import {organizationFhirR4ToFlat,organizationFlatToFhirR4} from './convert-organization.js'
import {practitionerRoleFhirR4ToFlat,practitionerRoleFlatToFhirR4} from './convert-practitioner-role.js'

/** Internal flat-claim compatibility tag; this is not a published HL7 namespace URI. */
export const IndexedClaimsContext='org.hl7.fhir.api' as const
export const IndexedR4SemanticInputTypes=Object.freeze([R.MedicationStatement,R.Observation,R.AllergyIntolerance,R.Condition,R.DeviceUseStatement,R.Flag,R.Procedure,R.Immunization,R.DocumentReference,R.RelatedPerson,R.DiagnosticReport,R.CarePlan,R.Encounter,R.Consent] as const)
export const IndexedR4SemanticOutputTypes=Object.freeze([R.AllergyIntolerance,R.CarePlan,R.Composition,R.Condition,R.Consent,R.DeviceUseStatement,R.DiagnosticReport,R.DocumentReference,R.Flag,R.Immunization,R.MedicationStatement,R.Observation,R.Procedure] as const)
/** Historical compatibility families; EncounterHistory is not an R4 resource. */
export const IndexedStructuralCompatibilityTypes=Object.freeze([R.ImagingStudy,R.ImmunizationRecommendation,R.Medication,R5.EncounterHistory,R.AdverseEvent] as const)
export const DocumentSupportInputTypes=Object.freeze([R.Composition,R.Organization,R.PractitionerRole,R.Patient,R.Practitioner] as const)
export type IndexedR4SemanticInputType=typeof IndexedR4SemanticInputTypes[number]
export type IndexedR4SemanticOutputType=typeof IndexedR4SemanticOutputTypes[number]
export type IndexedStructuralCompatibilityType=typeof IndexedStructuralCompatibilityTypes[number]
export type DocumentSupportInputType=typeof DocumentSupportInputTypes[number]
export type IndexedR4SemanticOptions=Readonly<{profile:'indexed-r4-semantic';context?:typeof IndexedClaimsContext}>
export type IndexedStructuralOptions=Readonly<{profile:'indexed-structural-compat-v1'}>
export type DocumentSupportOptions=Readonly<{profile:'document-support-r4-v1'}>
type TypedResource<T extends string>=FhirResource&Readonly<{resourceType:T}>
type Pair=Readonly<{read:(resource:FhirResource)=>FlatClaims;write:(claims:FlatClaims)=>FhirResource;identifier:string}>
const pairs:Readonly<Record<string,Pair>>={
 [R.AllergyIntolerance]:{read:allergyIntoleranceFhirR4ToFlat,write:allergyIntoleranceFlatToFhirR4,identifier:AllergyIntoleranceClaim.Identifier},
 [R.CarePlan]:{read:carePlanFhirR4ToFlat,write:carePlanFlatToFhirR4,identifier:CarePlanClaim.Identifier},
 [R.Composition]:{read:compositionFhirR4ToFlat,write:compositionFlatToFhirR4,identifier:CompositionClaim.Identifier},
 [R.Condition]:{read:conditionFhirR4ToFlat,write:conditionFlatToFhirR4,identifier:ConditionClaim.Identifier},
 [R.Consent]:{read:consentFhirR4ToFlat,write:consentFlatToFhirR4,identifier:ClaimConsent.identifier},
 [R.DeviceUseStatement]:{read:deviceUseStatementFhirR4ToFlat,write:deviceUseStatementFlatToFhirR4,identifier:DeviceUseStatementClaim.Identifier},
 [R.DiagnosticReport]:{read:diagnosticReportFhirR4ToFlat,write:diagnosticReportFlatToFhirR4,identifier:DiagnosticReportClaim.Identifier},
 [R.DocumentReference]:{read:documentReferenceFhirR4ToFlat,write:documentReferenceFlatToFhirR4,identifier:DocumentReferenceClaim.Identifier},
 [R.Flag]:{read:flagFhirR4ToFlat,write:flagFlatToFhirR4,identifier:FlagClaim.Identifier},
 [R.Immunization]:{read:immunizationFhirR4ToFlat,write:immunizationFlatToFhirR4,identifier:ImmunizationClaim.Identifier},
 [R.MedicationStatement]:{read:medicationStatementFhirR4ToFlat,write:medicationStatementFlatToFhirR4,identifier:MedicationStatementClaim.Identifier},
 [R.Observation]:{read:observationToFlatFhirR4,write:observationFromFlatToFhirR4,identifier:O.Identifier},
 [R.Procedure]:{read:procedureFhirR4ToFlat,write:procedureFlatToFhirR4,identifier:ProcedureClaim.Identifier},
 [R.RelatedPerson]:{read:relatedPersonFhirR4ToFlat,write:relatedPersonFlatToFhirR4,identifier:RelatedPersonClaim.Identifier},
 [R.Encounter]:{read:encounterFhirR4ToFlat,write:encounterFlatToFhirR4,identifier:EncounterClaim.Identifier},
 [R.Organization]:{read:organizationFhirR4ToFlat,write:organizationFlatToFhirR4,identifier:OrganizationClaim.Identifier},
 [R.PractitionerRole]:{read:practitionerRoleFhirR4ToFlat,write:practitionerRoleFlatToFhirR4,identifier:PractitionerRoleClaim.Identifier},
}
type ConceptSlot=Readonly<{property:string;claim:string;textClaim?:string;array?:boolean}>
const conceptSlots:Readonly<Record<string,readonly ConceptSlot[]>>={
 [R.AllergyIntolerance]:[{property:'code',claim:AllergyIntoleranceClaim.Code,textClaim:AllergyIntoleranceClaim.CodeText}],
 [R.Condition]:[{property:'code',claim:ConditionClaim.Code}],
 [R.CarePlan]:[{property:'category',claim:CarePlanClaim.Category,array:true}],
 [R.Consent]:[{property:'category',claim:ClaimConsent.category,array:true}],
 [R.Composition]:[{property:'type',claim:CompositionClaim.Type}],
 [R.DocumentReference]:[{property:'type',claim:DocumentReferenceClaim.Type}],
 [R.DiagnosticReport]:[{property:'code',claim:DiagnosticReportClaim.Code}],
 [R.Flag]:[{property:'code',claim:FlagClaim.Code},{property:'category',claim:FlagClaim.Category,array:true}],
 [R.DeviceUseStatement]:[{property:'reasonCode',claim:DeviceUseStatementClaim.ReasonCode,array:true}],
 [R.Encounter]:[{property:'type',claim:EncounterClaim.Type,array:true}],
 [R.Immunization]:[{property:'vaccineCode',claim:ImmunizationClaim.VaccineCode}],
 [R.MedicationStatement]:[{property:'medicationCodeableConcept',claim:MedicationStatementClaim.Code}],
 [R.Observation]:[{property:'code',claim:O.Code},{property:'valueCodeableConcept',claim:O.ValueConcept}],
 [R.Procedure]:[{property:'code',claim:ProcedureClaim.Code}],
 [R.RelatedPerson]:[{property:'relationship',claim:RelatedPersonClaim.Relationship,array:true}],
}

function assertProfile(options:unknown,expected:string):void{
 if(!isPlainObject(options)||options.profile!==expected)throw new TypeError('indexed_profile_required')
 if(Object.keys(options).some(key=>key!=='profile'&&key!=='context'))throw new TypeError('indexed_profile_options_unsupported')
 if(options.context!==undefined&&options.context!==IndexedClaimsContext)throw new TypeError('indexed_context_invalid')
}
function assertType(type:string,allowed:readonly string[]):void{
 if(!allowed.includes(type))throw new TypeError(`indexed_resource_type_unsupported: ${type}`)
}
function normalizeClaims(claims:Readonly<Record<string,unknown>>):FlatClaims{
 if(claims['@context']!==undefined&&claims['@context']!==IndexedClaimsContext)throw new TypeError('indexed_context_invalid')
 const result:FlatClaims={}
 // Qualified compatibility keys are normalized first; an explicit short key wins.
 for(const qualified of [true,false])for(const [key,value] of Object.entries(claims)){
  if(key==='@context'||value===undefined||value===null)continue
  if(key.startsWith('org.hl7.fhir.')&&!key.startsWith(`${IndexedClaimsContext}.`))throw new TypeError('indexed_context_namespace_invalid')
  const isQualified=key.startsWith(`${IndexedClaimsContext}.`)
  if(isQualified!==qualified)continue
  const short=normalizeFhirApiClaimKey(key)
  if(!['string','number','boolean'].includes(typeof value))throw new TypeError('indexed_claim_scalar_required')
  result[short]=String(value)
 }
 return result
}
function codingEntries(value:unknown):Array<{system?:string;code:string}>{
 if(!isPlainObject(value)||!Array.isArray(value.coding))return []
 return value.coding.map(item=>{
  if(!isPlainObject(item)||typeof item.code!=='string'||!item.code||/[,|]/u.test(item.code)||item.system!==undefined&&(typeof item.system!=='string'||/[,|]/u.test(item.system)))throw new TypeError('indexed_coding_unrepresentable')
  return {code:item.code,...(typeof item.system==='string'?{system:item.system}:{})}
 })
}
function conceptClaims(resource:FhirResource,claims:FlatClaims):void{
 for(const slot of conceptSlots[resource.resourceType]??[]){
  const value=resource[slot.property]
  const values:readonly unknown[]=slot.array&&Array.isArray(value)?value:[value]
  const codings=values.flatMap(codingEntries)
  if(codings.length)claims[slot.claim]=codingListToCsv(codings)
  else if(slot.textClaim&&isPlainObject(value)&&typeof value.text==='string'){
   // Local native text must not become a coding identity in this profile.
   claims[slot.claim]=undefined
   claims[slot.textClaim]=value.text
  }
 }
}
function projectConcepts(type:string,native:FhirResource,claims:FlatClaims):FhirResource{
 const output:{resourceType:string;[key:string]:unknown}={...native}
 for(const slot of conceptSlots[type]??[]){
  const codings=codingListFromCsv(claims[slot.claim])
  if(!codings){
   if(slot.textClaim&&claims[slot.textClaim]!==undefined)output[slot.property]={text:claims[slot.textClaim]}
   continue
  }
  const nativeValue=output[slot.property]
  const original=slot.array&&Array.isArray(nativeValue)?nativeValue[0]:nativeValue
  const concept=isPlainObject(original)?original:{}
  const firstCoding=Array.isArray(concept.coding)&&isPlainObject(concept.coding[0])?concept.coding[0]:undefined
  const projected={...concept,coding:codings.map((coding,index)=>({...coding,...(index===0&&typeof firstCoding?.display==='string'?{display:firstCoding.display}:{})}))}
  output[slot.property]=slot.array?[projected]:projected
 }
 return output
}
function primaryIdentifier(resource:FhirResource):string|undefined{
 const first=resource.resourceType===R.Composition?resource.identifier:Array.isArray(resource.identifier)?resource.identifier[0]:undefined
 if(!isPlainObject(first)||typeof first.value!=='string'||!first.value)return undefined
 return identifierToValue({value:first.value,...(typeof first.system==='string'?{system:first.system}:{})})
}
function componentClaims(resource:FhirResource):FlatClaims{
 if(resource.component===undefined)return {}
 if(!Array.isArray(resource.component))throw new TypeError('indexed_observation_component_array_required')
 const codes:string[]=[],displays:string[]=[],numbers:string[]=[],units:string[]=[]
 for(const item of resource.component){
  if(!isPlainObject(item))throw new TypeError('indexed_observation_component_invalid')
  if(Object.keys(item).some(key=>key.startsWith('value')&&key!=='valueQuantity'))throw new TypeError('indexed_observation_component_value_unsupported')
  const coding=codingEntries(item.code),first=isPlainObject(item.code)&&Array.isArray(item.code.coding)&&isPlainObject(item.code.coding[0])?item.code.coding[0]:undefined
  if(!coding.length)throw new TypeError('indexed_observation_component_code_required')
  const quantity=isPlainObject(item.valueQuantity)?item.valueQuantity:undefined
  if(item.valueQuantity!==undefined&&!quantity)throw new TypeError('indexed_observation_component_quantity_invalid')
  if(quantity?.value!==undefined&&(typeof quantity.value!=='number'||!Number.isFinite(quantity.value)))throw new TypeError('indexed_observation_component_quantity_invalid')
  if(quantity&&quantity.value===undefined&&Object.keys(quantity).length)throw new TypeError('indexed_observation_component_quantity_value_required')
  if(quantity?.system!==undefined&&typeof quantity.code!=='string')throw new TypeError('indexed_observation_component_quantity_code_required')
  codes.push(codingListToCsv(coding)!)
  displays.push(typeof first?.display==='string'?first.display:'')
  numbers.push(quantity?.value===undefined?'':String(quantity.value))
  units.push(quantity&&typeof quantity.code==='string'?(typeof quantity.system==='string'?`${quantity.system}|${quantity.code}`:quantity.code):typeof quantity?.unit==='string'?quantity.unit:'')
 }
 const column=(values:string[])=>values.some(value=>value!=='')?JSON.stringify(values):undefined
 return {[O.ComponentCode]:column(codes),[O.ComponentCodeDisplay]:column(displays),[O.ComponentValueQuantityNumber]:column(numbers),[O.ComponentValueQuantityUnit]:column(units)}
}
function componentColumns(claims:FlatClaims):readonly string[][]{
 const keys=[O.ComponentCode,O.ComponentCodeDisplay,O.ComponentValueQuantityNumber,O.ComponentValueQuantityUnit]
 const parsed=keys.map(key=>{
  if(claims[key]===undefined)return undefined
  try{const value:unknown=JSON.parse(claims[key]!);if(!Array.isArray(value)||!value.every(item=>typeof item==='string'))throw new Error();return value}
  catch{throw new TypeError('indexed_observation_component_json_invalid')}
 })
 const codes=parsed[0]??[]
 if(parsed.some(column=>column!==undefined&&column.length!==codes.length)||codes.some(code=>!code))throw new TypeError('indexed_observation_component_alignment_invalid')
 if((parsed[2]??[]).some(number=>number!==''&&!Number.isFinite(Number(number))))throw new TypeError('indexed_observation_component_quantity_invalid')
 return parsed.map(column=>column??codes.map(()=>''))
}
function readSemantic(resource:FhirResource):FlatClaims{
 const pair=pairs[resource.resourceType]
 const claims=resource.resourceType===R.Observation?{...pair.read({...resource,component:undefined}),...componentClaims(resource)}:{...pair.read(resource)}
 claims[pair.identifier]=primaryIdentifier(resource)
 conceptClaims(resource,claims)
 const language=typeof resource.language==='string'?resource.language.trim():''
 return {'@context':IndexedClaimsContext,...claims,...(language?{[`${resource.resourceType}.language`]:language}:{})}
}
/** Explicit bounded semantic import. Embedded meta.claims never overlays native input or grants authority. */
export function indexedR4ResourceToClaims(resource:TypedResource<IndexedR4SemanticInputType>,options:IndexedR4SemanticOptions):FlatClaims{
 assertProfile(options,'indexed-r4-semantic');assertType(resource.resourceType,IndexedR4SemanticInputTypes)
 return readSemantic(resource)
}
/** Reads the existing parent component columns; it never manufactures a child Observation graph. */
export function indexedR4ClaimsToResource(type:IndexedR4SemanticOutputType,source:Readonly<Record<string,unknown>>,options:IndexedR4SemanticOptions):FhirResource{
 assertProfile(options,'indexed-r4-semantic');assertType(type,IndexedR4SemanticOutputTypes)
 const claims=normalizeClaims(source),pair=pairs[type]
 const columns=type===R.Observation?componentColumns(claims):undefined
 // The owned medication quantity converter also reads its declared qualified key.
 const converterClaims={...claims}
 if(type===R.MedicationStatement){
  const quantity=claims[normalizeFhirApiClaimKey(MedicationStatementClaimsFhirApiExtended.DoseQuantity)]
  if(quantity!==undefined)converterClaims[MedicationStatementClaimsFhirApiExtended.DoseQuantity]=quantity
 }
 let native=projectConcepts(type,pair.write(converterClaims),claims)
 const identifier=identifierFromValue(claims[pair.identifier])
 if(identifier)native={...native,identifier:type===R.Composition?identifier:[identifier]}
 if(columns?.[0].length){
  const [codes,displays,numbers,units]=columns
  native={...native,component:codes.map((code,index)=>({code:{coding:codingListFromCsv(code)?.map((coding,codingIndex)=>({...coding,...(codingIndex===0&&displays[index]?{display:displays[index]}:{})}))},...(numbers[index]!==''?{valueQuantity:{value:Number(numbers[index]),...(units[index]?{unit:units[index],...(codingListFromCsv(units[index])?.[0]??{})}:{})}}:{})}))}
 }
 const language=claims[`${type}.language`]
 return language?{...native,language}:native
}
/** Caller-selected historical structural compatibility, not a native-version conformance assertion. */
export function indexedStructuralResourceToClaims(resource:TypedResource<IndexedStructuralCompatibilityType>,options:IndexedStructuralOptions):FlatClaims{
 assertProfile(options,'indexed-structural-compat-v1');assertType(resource.resourceType,IndexedStructuralCompatibilityTypes)
 return fhirResourceToFlatClaims(resource,IndexedClaimsContext)
}
export function indexedStructuralClaimsToResource(type:IndexedStructuralCompatibilityType,claims:FlatClaims,options:IndexedStructuralOptions):FhirResource{
 assertProfile(options,'indexed-structural-compat-v1');assertType(type,IndexedStructuralCompatibilityTypes)
 if(claims['@context']!==undefined&&claims['@context']!==IndexedClaimsContext)throw new TypeError('indexed_context_invalid')
 if(Object.keys(claims).some(key=>key!=='@context'&&!key.startsWith(`${type}.`)))throw new TypeError('indexed_structural_resource_mismatch')
 return flatClaimsToFhirResource(claims)
}
/** Supporting entries stay separate from admitted clinical families and from verified provenance. */
export function documentSupportResourceToClaims(resource:TypedResource<DocumentSupportInputType>,options:DocumentSupportOptions):FlatClaims{
 assertProfile(options,'document-support-r4-v1');assertType(resource.resourceType,DocumentSupportInputTypes)
 return resource.resourceType===R.Patient||resource.resourceType===R.Practitioner?fhirResourceToFlatClaims(resource,IndexedClaimsContext):readSemantic(resource)
}
