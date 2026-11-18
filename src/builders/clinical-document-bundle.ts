import {CompositionClaim,CompositionAttesterModes} from '../claims/composition-claims.js'
import {compositionFlatToFhirR4} from '../converters/convert-composition.js'
import {buildFlatClaimResourceEntry} from '../flat-claim-resource-graph.js'
import {FHIR_IPS_DOCUMENT_CODE} from '../data/ips-all-sections.data.js'
import {ClinicalTerminologySystems} from '../clinical-terminology.js'

/** Existing claims vocabulary retained independently of the canonical native FHIR Coding.system URI. */
export const FHIR_IPS_DOCUMENT_TYPE_CLAIM=`LOINC|${FHIR_IPS_DOCUMENT_CODE}` as const

export type ClinicalDocumentAttester=Readonly<{reference:string;mode:string;time?:string}>
export type ClinicalDocumentEntry=Readonly<{resourceType:string;entryId:string;claims:Readonly<Record<string,unknown>>;sectionCodes?:readonly string[]}>
export type ClinicalDocumentBundleInput=Readonly<{
  documentId:string;compositionId:string;subjectReference:string;title:string;documentType:string;date:string
  status:'preliminary'|'final'|'amended'|'entered-in-error';sectionCodeSystem?:string
  authorReferences:readonly string[];attesters?:readonly ClinicalDocumentAttester[];language?:string
  subjectProjection?:Readonly<Pick<ClinicalDocumentResource,'resourceType'> & {id:string;fullUrl?:string}>
  sections?:readonly Readonly<{code:string;title?:string}>[];entries:readonly ClinicalDocumentEntry[]
}>
export type ClinicalDocumentResource=Readonly<{resourceType:string;id?:string;meta?:Readonly<{claims:Readonly<Record<string,unknown>>}>;[key:string]:unknown}>
export type ClinicalDocumentBundle=Readonly<{resourceType:'Bundle';type:'document';id:string;entry:readonly Readonly<{resource:ClinicalDocumentResource;fullUrl?:string}>[]}>

/** Pure document assembly. Callers own identifiers, provenance and the decision to persist or sign. */
export function buildClinicalDocumentBundle(input:ClinicalDocumentBundleInput):ClinicalDocumentBundle{
  const required=(value:string,name:string)=>{if(typeof value!=='string'||!value.trim())throw new TypeError(`clinical_document_${name}_required`);return value.trim()}
  const subject=required(input.subjectReference,'subject'),date=required(input.date,'date')
  const authors=[...new Set(input.authorReferences.map(value=>required(value,'author')))]
  if(!authors.length||!input.entries.length)throw new TypeError('clinical_document_author_and_entries_required')
  const attesters=(input.attesters??[]).map(value=>{
    if(!Object.values(CompositionAttesterModes).some(mode=>mode===value.mode))throw new TypeError('clinical_document_attester_mode_invalid')
    return {...value,reference:required(value.reference,'attester')}
  })
  const compositionClaims:Record<string,string>={
    [CompositionClaim.Subject]:subject,[CompositionClaim.Type]:required(input.documentType,'type'),
    [CompositionClaim.Title]:required(input.title,'title'),[CompositionClaim.Date]:date,
    [CompositionClaim.Author]:authors.join(','),[CompositionClaim.Status]:input.status,
    [CompositionClaim.Identifier]:required(input.compositionId,'composition_id'),
    ...(attesters.length?{[CompositionClaim.Attester]:attesters.map(value=>value.reference).join(','),[CompositionClaim.AttesterMode]:attesters.map(value=>value.mode).join(','),[CompositionClaim.AttesterTime]:attesters.map(value=>value.time??'').join(',')}:{}),
  }
  const sections=new Map<string,{code:{coding:{system?:string;code:string}[]};title?:string;entry:{reference:string}[]}>()
  const section=(code:string)=>{
    let value=sections.get(code)
    if(!value){
      const separator=code.indexOf('|'),system=separator>=0?code.slice(0,separator):input.sectionCodeSystem
      const title=input.sections?.find(item=>item.code===code)?.title
      value={code:{coding:[{...(system?{system:system==='LOINC'?ClinicalTerminologySystems.Loinc:system}:{}),code:separator>=0?code.slice(separator+1):code}]},...(title?{title}:{}),entry:[]}
      sections.set(code,value)
    }
    return value
  }
  const seen=new Set<string>()
  const entries=input.entries.map(entry=>{
    const identity=buildFlatClaimResourceEntry({resourceType:entry.resourceType,entryId:entry.entryId,claims:{}})
    if(seen.has(identity.reference))throw new TypeError('clinical_document_duplicate_entry')
    seen.add(identity.reference)
    // Resource-local values and inherited Composition provenance remain distinct, with no registry side effects.
    const claims:Record<string,unknown>={}
    for(const [key,value] of Object.entries(entry.claims)){
      if(!key.startsWith(`${entry.resourceType}.`)&&!key.startsWith('Composition.'))throw new TypeError('clinical_document_claim_resource_mismatch')
      claims[key]=value
    }
    Object.assign(claims,compositionClaims)
    claims[`${entry.resourceType}.subject`]=subject
    const codes=[...new Set(entry.sectionCodes??[])]
    if(codes.length){claims[CompositionClaim.Section]=codes.join(',');for(const code of codes)section(code).entry.push({reference:identity.reference})}
    return {resource:{resourceType:entry.resourceType,id:entry.entryId,meta:{claims}}}
  })
  const nativeCompositionClaims={...compositionClaims,[CompositionClaim.Type]:compositionClaims[CompositionClaim.Type].replace(/^LOINC\|/u,`${ClinicalTerminologySystems.Loinc}|`)}
  const composition:ClinicalDocumentResource={...compositionFlatToFhirR4(nativeCompositionClaims),id:input.compositionId,
    ...(input.language?{language:input.language}:{}),section:[...sections.values()],meta:{claims:compositionClaims}}
  const match=/^([A-Z][A-Za-z0-9]+)\/([^/]+)$/u.exec(subject)
  let subjectEntry:Readonly<{resource:ClinicalDocumentResource;fullUrl?:string}>[]=match&&!seen.has(subject)?[{resource:{resourceType:match[1],id:match[2]}}]:[]
  if(input.subjectProjection){
    const projection=input.subjectProjection
    const type=required(projection.resourceType,'subject_projection_type'),id=required(projection.id,'subject_projection_id')
    if(!/^[A-Z][A-Za-z0-9]+$/u.test(type)||!/^[A-Za-z0-9.-]{1,64}$/u.test(id))throw new TypeError('clinical_document_subject_projection_identity_invalid')
    if(seen.has(`${type}/${id}`))throw new TypeError('clinical_document_duplicate_subject_projection')
    if(match){
      if(match[1]!==type||match[2]!==id||projection.fullUrl)throw new TypeError('clinical_document_subject_projection_mismatch')
    }else if(!/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(subject)||projection.fullUrl!==subject){
      throw new TypeError('clinical_document_subject_projection_mismatch')
    }
    subjectEntry=[{resource:{resourceType:type,id},...(projection.fullUrl?{fullUrl:projection.fullUrl}:{})}]
  }
  return {resourceType:'Bundle',type:'document',id:required(input.documentId,'id'),entry:[{resource:composition},...subjectEntry,...entries]}
}
