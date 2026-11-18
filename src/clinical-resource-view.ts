import * as Claims from './claims/index.js'
import {ObservationClaim} from './observation-claims.js'
import {normalizeFhirApiClaimKey} from './claim-helpers/fhir-api-claim-key.js'

export type ClinicalResourceLike=Readonly<{resourceType?:string;id?:string;meta?:Readonly<{claims?:Record<string,unknown>}>;[key:string]:unknown}>
export type ClinicalResourceEntryLike=Readonly<{fullUrl?:string;type?:string;meta?:Readonly<Record<string,unknown>>;resource?:ClinicalResourceLike}>
export type ClinicalResourceBundleLike=Readonly<{resourceType?:string;type?:string;data?:readonly ClinicalResourceEntryLike[];entry?:readonly ClinicalResourceEntryLike[]}>
export type ClinicalTerminologyTranslationInput=Readonly<{resourceType:string;system?:string;code:string;token:string;locale:string}>
export type ClinicalResourceDisplayOptions=Readonly<{locale?:string;translateCode?:(input:ClinicalTerminologyTranslationInput)=>string|undefined}>
export type ClinicalResourceClaimFieldView=Readonly<{claim:string;parameter:string;value:unknown}>
export type ClinicalResourceCardView=Readonly<{
  title:string;resourceType:string;identifier?:string;date?:string;periodStart?:string;periodEnd?:string;fullUrl?:string
  actorsCount:number;fields:readonly ClinicalResourceClaimFieldView[];status?:string;value?:string|number;unit?:string
  lotNumber?:string;doseSequence?:string;criticality?:string;onsetDateTime?:string;dosageInstruction?:string
  category?:string;severity?:string;recordedDate?:string;source?:string;route?:string;site?:string
  doseQuantityValue?:number;doseQuantityUnit?:string;referenceRangeText?:string;description?:string
}>
export type ClinicalSectionView=Readonly<{code?:string;title:string;emptyReason?:string;resources:ClinicalResourceCardView[];unresolvedReferences:string[]}>
export type LocalTextAndIntDisplay=Readonly<{localText?:string;internationalDisplay?:string;combined?:string}>

const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
const list=(value:unknown):unknown[]=>Array.isArray(value)?value:[]
const text=(value:unknown):string=>typeof value==='string'?value.trim():typeof value==='number'||typeof value==='boolean'?String(value):''
const first=(...values:unknown[]):string|undefined=>values.map(text).find(Boolean)
const language=(value:unknown)=>text(value).toLowerCase().replace('_','-').split('-')[0]
const token=(concept:unknown):string|undefined=>{
  const coding=record(list(record(concept).coding)[0]),code=text(coding.code),system=text(coding.system)
  return code?(system?`${system}|${code}`:code):undefined
}
const conceptText=(concept:unknown)=>first(record(concept).text,...list(record(concept).coding).map(value=>record(value).display))

/** Normalizes only the API claim vocabulary. Native structural paths never become editable fields. */
export function toClinicalResourceClaimFieldViews(claims:Readonly<Record<string,unknown>>):ClinicalResourceClaimFieldView[]{
  const fields=new Map<string,ClinicalResourceClaimFieldView>()
  const entries=Object.entries(claims)
  for(const [raw,value] of [...entries.filter(([key])=>key.startsWith('org.hl7.fhir.')),...entries.filter(([key])=>!key.startsWith('org.hl7.fhir.'))]){
    if(raw.startsWith('org.hl7.fhir.')&&!raw.startsWith('org.hl7.fhir.api.'))throw new TypeError('clinical_view_versioned_claim_forbidden')
    let claim:string
    try{claim=normalizeFhirApiClaimKey(raw)}catch{continue}
    if(value!==undefined)fields.set(claim,{claim,parameter:claim.slice(claim.indexOf('.')+1),value})
  }
  return [...fields.values()].sort((left,right)=>left.claim.localeCompare(right.claim))
}

function primaryConcept(resource:ClinicalResourceLike):unknown{
  switch(resource.resourceType){
    case 'MedicationStatement':case 'MedicationRequest':return resource.medicationCodeableConcept
    case 'Immunization':return resource.vaccineCode
    case 'DocumentReference':case 'Device':case 'Specimen':return resource.type
    case 'Consent':case 'CarePlan':return list(resource.category)[0]
    case 'ImagingStudy':return list(resource.procedureCode)[0]
    case 'PractitionerRole':return list(resource.code)[0]
    case 'ImmunizationRecommendation':return list(record(list(resource.recommendation)[0]).vaccineCode)[0]
    default:return resource.code
  }
}
function primaryClaim(resourceType:string):string{
  switch(resourceType){
    case 'MedicationStatement':return Claims.MedicationStatementClaim.Code
    case 'Immunization':return Claims.ImmunizationClaim.VaccineCode
    case 'DocumentReference':return Claims.DocumentReferenceClaim.Type
    case 'Device':return Claims.DeviceClaim.Type
    case 'Consent':return Claims.ClaimConsent.category
    case 'CarePlan':return Claims.CarePlanClaim.Category
    default:return `${resourceType}.code`
  }
}
function titleFor(resource:ClinicalResourceLike,claims:Record<string,unknown>,options:ClinicalResourceDisplayOptions,allowCodeFallback=true):string{
  const type=resource.resourceType??'',concept=primaryConcept(resource),coding=record(list(record(concept).coding)[0])
  if(type==='Communication'){
    const payload=record(list(resource.payload)[0])
    return first(claims[Claims.CommunicationClaim.ContentAttachmentTitle],claims[Claims.CommunicationClaim.Text],claims[Claims.CommunicationClaim.NoteText],record(payload.contentAttachment).title,payload.contentString)||type
  }
  const primary=primaryClaim(type)
  const local=first(claims[`${primary}-text`],claims[`${type}.code-text`],claims[`${type}.medication-text`],record(concept).text)
  const international=first(claims[`${primary}-display`],claims[`${type}.code-display`],coding.display)
  const codeToken=first(claims[primaryClaim(type)])?.split(',')[0]||token(concept)
  const locale=language(options.locale),resourceLanguage=language(resource.language||claims[`${type}.language`])
  let coded:string|undefined
  if(!locale||locale===resourceLanguage)coded=local||international
  else if(locale==='en')coded=international||local
  else{
    if(codeToken&&options.translateCode){
      const separator=codeToken.indexOf('|')
      coded=text(options.translateCode({resourceType:type,...(separator>=0?{system:codeToken.slice(0,separator)}:{}),code:separator>=0?codeToken.slice(separator+1):codeToken,token:codeToken,locale}))||undefined
    }
    coded??=international||local
  }
  if(coded)return coded
  const names=list(resource.name).map(value=>first(record(value).text,[...list(record(value).given),record(value).family].map(text).filter(Boolean).join(' '))).filter(Boolean)
  const device=record(resource.device)
  const fallback=first(claims[`${type}.title`],claims[`${type}.description`],claims[`${type}.summary`],type==='Device'?claims[Claims.DeviceClaim.DeviceName]:undefined,resource.title,resource.description,resource.summary,typeof resource.name==='string'?resource.name:undefined,...names,device.display,record(resource.medicationReference).display,record(list(resource.content)[0]).attachment&&record(record(list(resource.content)[0]).attachment).title)
  if(fallback)return fallback
  // Missing source labels may still use the caller's terminology projection in
  // English or the source language. A token fallback displays supplied coding;
  // it does not validate that coding or invent a clinical translation.
  if(codeToken&&options.translateCode&&(!locale||locale==='en'||locale===resourceLanguage)){
    const separator=codeToken.indexOf('|')
    const translated=text(options.translateCode({resourceType:type,...(separator>=0?{system:codeToken.slice(0,separator)}:{}),code:separator>=0?codeToken.slice(separator+1):codeToken,token:codeToken,locale:locale||resourceLanguage||'und'}))
    if(translated)return translated
  }
  return (allowCodeFallback?codeToken:undefined)||type
}

/** Preserves supplied local and international labels; it neither translates nor confirms a coding. */
export function getLocalTextAndIntDisplay(resource:ClinicalResourceLike):LocalTextAndIntDisplay{
  const fields=toClinicalResourceClaimFieldViews(resource.meta?.claims??{})
  const claims=Object.fromEntries(fields.map(field=>[field.claim,field.value]))
  const type=resource.resourceType??'Unknown',concept=record(primaryConcept(resource))
  const readSuffix=(...suffixes:string[])=>first(...suffixes.flatMap(suffix=>fields.filter(field=>field.parameter===suffix).map(field=>field.value)))
  const localText=first(concept.text,readSuffix('code-text','code-text-local','codetextlocal','medication-text','vaccine-code-text','value-concept-text'))||titleFor({...resource,resourceType:type},claims,{},false)
  const internationalDisplay=first(...list(concept.coding).map(value=>record(value).display),readSuffix('code-display','codedisplay','vaccine-code-display','value-concept-display'))
  const combined=localText&&internationalDisplay&&localText!==internationalDisplay?`${localText} (${internationalDisplay})`:localText||internationalDisplay
  return {...(localText?{localText}:{}),...(internationalDisplay?{internationalDisplay}:{}),...(combined?{combined}:{})}
}

/** Claims-first resource projection shared by every clinical UI; it has no authorization or storage behavior. */
export function toClinicalResourceCardView(entry:ClinicalResourceEntryLike,options:ClinicalResourceDisplayOptions={}):ClinicalResourceCardView{
  const resource=entry.resource??{},type=resource.resourceType??entry.type??'Resource'
  const fields=toClinicalResourceClaimFieldViews(resource.meta?.claims??{})
  const claims=Object.fromEntries(fields.map(field=>[field.claim,field.value]))
  const read=(key:string)=>text(claims[key])||undefined
  const period=record(resource.effectivePeriod??resource.period??resource.occurrencePeriod)
  const periodStart=first(claims[`${type}.period-start`],claims[`${type}.effective-period-start`],period.start)
  const periodEnd=first(claims[`${type}.period-end`],claims[`${type}.effective-period-end`],period.end)
  const date=first(type==='Communication'?claims[Claims.CommunicationClaim.Sent]:undefined,type==='MedicationStatement'?claims[Claims.MedicationStatementClaim.Effective]:undefined,type==='Condition'?claims[Claims.ConditionClaim.OnsetDateTime]:undefined,type==='AllergyIntolerance'?claims[Claims.AllergyIntoleranceClaim.OnsetDateTime]:undefined,claims[`${type}.date`],claims[ObservationClaim.EffectiveDateTime],claims[Claims.ImmunizationClaim.Date],claims[Claims.ConditionClaim.RecordedDate],claims[`${type}.authored-on`],resource.effectiveDateTime,resource.occurrenceDateTime,resource.recordedDate,resource.authoredOn,resource.date,resource.performedDateTime,resource.effectiveInstant,resource.issued,resource.onsetDateTime,periodStart)
  const identifiers=list(resource.identifier).map(value=>record(value).value)
  const identifier=first(claims[`${type}.identifier`],...identifiers,resource.id)
  const actorSuffixes=['subject','patient','author','actor','performer','asserter','creator','source','sender','recipient']
  const actors=new Set(fields.filter(field=>actorSuffixes.includes(field.parameter)).flatMap(field=>text(field.value).split(',')).filter(Boolean))
  for(const key of actorSuffixes)for(const value of Array.isArray(resource[key])?list(resource[key]):[resource[key]]){const reference=text(record(value).reference);if(reference)actors.add(reference)}
  const quantity=record(resource.valueQuantity)
  const claimNumber=read(ObservationClaim.ValueQuantityNumber)
  const numericValue=claimNumber===undefined?undefined:Number(claimNumber)
  const value=type==='Observation'?(numericValue!==undefined&&Number.isFinite(numericValue)?numericValue:read(ObservationClaim.ValueString)??(typeof quantity.value==='number'&&Number.isFinite(quantity.value)?quantity.value:first(resource.valueString))):undefined
  const unit=type==='Observation'?first(claims[ObservationClaim.ValueQuantityUnit],quantity.unit,quantity.code):undefined
  const rawDose=read(Claims.MedicationStatementClaim.DoseQuantityValue)
  const numericDose=rawDose===undefined?undefined:Number(rawDose)
  const optional:Record<string,unknown>={
    identifier,date,periodStart,periodEnd,fullUrl:entry.fullUrl,
    status:first(claims[`${type}.status`],claims[`${type}.clinical-status`],resource.status,record(list(record(resource.clinicalStatus).coding)[0]).code,conceptText(resource.clinicalStatus)),value,unit,
    lotNumber:first(read(Claims.ImmunizationClaim.LotNumber),resource.lotNumber),
    doseSequence:first(read(Claims.ImmunizationClaim.DoseSequence),record(list(resource.protocolApplied)[0]).doseNumberString),
    criticality:first(read(Claims.AllergyIntoleranceClaim.Criticality),resource.criticality),
    onsetDateTime:first(read(Claims.AllergyIntoleranceClaim.OnsetDateTime),resource.onsetDateTime),
    dosageInstruction:first(read(Claims.MedicationStatementClaim.DosageInstruction),record(list(resource.dosage)[0]).text),
    category:read(`${type}.category`),severity:read(`${type}.severity`),recordedDate:read(Claims.ConditionClaim.RecordedDate),
    source:read(Claims.MedicationStatementClaim.Source),route:read(Claims.ImmunizationClaim.Route),site:read(Claims.ImmunizationClaim.Site),
    doseQuantityValue:numericDose!==undefined&&Number.isFinite(numericDose)?numericDose:undefined,
    doseQuantityUnit:read(Claims.MedicationStatementClaim.DoseQuantityUnit),referenceRangeText:read(ObservationClaim.ReferenceRangeText),description:read(Claims.CarePlanClaim.Description),
  }
  return {title:titleFor({...resource,resourceType:type},claims,options),resourceType:type,actorsCount:actors.size,fields,...Object.fromEntries(Object.entries(optional).filter(([,value])=>value!==undefined))}
}

/** Composition.section.entry owns membership. Missing references are reported rather than guessed into another section. */
export function toClinicalSectionViews(bundle:ClinicalResourceBundleLike,options:ClinicalResourceDisplayOptions={}):ClinicalSectionView[]{
  const entries=bundle.entry??bundle.data??[]
  const composition=entries.find(entry=>entry.resource?.resourceType==='Composition')?.resource
  if(!composition)return []
  const index=new Map<string,ClinicalResourceEntryLike>()
  for(const entry of entries){
    if(entry.fullUrl)index.set(entry.fullUrl,entry)
    const resource=entry.resource
    if(resource?.id){index.set(`${resource.resourceType}/${resource.id}`,entry);index.set(`urn:uuid:${resource.id}`,entry);if(!index.has(resource.id))index.set(resource.id,entry)}
  }
  const sections:Record<string,unknown>[]=[]
  const visit=(values:unknown)=>{for(const value of list(values)){const section=record(value);sections.push(section);visit(section.section)}}
  visit(composition.section)
  return sections.map(section=>{
    const unresolvedReferences:string[]=[],resources:ClinicalResourceCardView[]=[]
    for(const item of list(section.entry)){
      const reference=text(record(item).reference),entry=index.get(reference)
      if(entry)resources.push(toClinicalResourceCardView(entry,options));else if(reference)unresolvedReferences.push(reference)
    }
    const code=token(section.code),emptyReason=conceptText(section.emptyReason)
    return {...(code?{code}:{}),title:first(section.title,conceptText(section.code),code)||'Section',...(emptyReason?{emptyReason}:{}),resources,unresolvedReferences}
  })
}
