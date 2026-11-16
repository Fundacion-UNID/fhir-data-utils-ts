import {CommunicationClaim as C} from '../claims/communication-claims.js'
import {normalizeFhirApiClaimKey} from '../claim-helpers/fhir-api-claim-key.js'
import type {FhirAttachment,FhirCommunicationPayload,FhirR4CommunicationPayloadItem} from '../fhir-types.js'
import {isPlainObject,type FlatClaims} from './convert-shared.js'

const attachmentFields = [
  ['contentType',C.ContentAttachmentType], ['data',C.ContentAttachmentData],
  ['title',C.ContentAttachmentTitle], ['url',C.ContentAttachmentUrl],
] as const
const payloadKeys = new Set<string>([C.ContentString,C.ContentReference,C.ContentCode,...attachmentFields.map(([,key])=>key)])

function rawString(value:unknown):string {
  if(typeof value!=='string'||value.length===0)throw new TypeError('communication_payload_string_required')
  return value
}
function reference(value:unknown):string {
  const text=rawString(value)
  if(text.includes(',')||text.trim()!==text)throw new TypeError('communication_payload_reference_not_representable')
  return text
}
function payloadClaims(input:Readonly<FlatClaims>):FlatClaims {
  if(!isPlainObject(input))throw new TypeError('communication_payload_claims_invalid')
  const output:FlatClaims={}
  for(const [raw,value]of Object.entries(input)){
    if(value===undefined)continue
    let key:string
    try{key=normalizeFhirApiClaimKey(raw)}catch{
      if(raw.startsWith('org.hl7.fhir.')||raw.startsWith('Communication.'))throw new TypeError('communication_payload_claim_namespace_invalid')
      continue
    }
    if(!payloadKeys.has(key))continue
    const text=rawString(value)
    if(output[key]!==undefined&&output[key]!==text)throw new TypeError('communication_payload_claim_conflict')
    output[key]=text
  }
  if(output[C.ContentCode]!==undefined)throw new TypeError('communication_payload_r5_coded_choice_not_supported_in_r4')
  return output
}
function attachmentFromClaims(claims:Readonly<FlatClaims>):FhirAttachment|undefined {
  const output:{contentType?:string;data?:string;title?:string;url?:string}={}
  for(const [field,key]of attachmentFields){const value=claims[key];if(value!==undefined)output[field]=value}
  return Object.keys(output).length?Object.freeze(output):undefined
}

/** Project one R4 payload item from the known scalar flat fields.
 * Narrative, notes and other resource claims are not payload content. At most
 * one choice is accepted; use the declared aggregate profile for multipart data.
 * String values are preserved exactly, including JSON-significant whitespace.
 */
export function communicationPayloadItemFlatToFhirR4(input:Readonly<FlatClaims>):FhirR4CommunicationPayloadItem|undefined {
  const claims=payloadClaims(input),body=claims[C.ContentString],target=claims[C.ContentReference],attachment=attachmentFromClaims(claims)
  if(Number(body!==undefined)+Number(target!==undefined)+Number(attachment!==undefined)>1)throw new TypeError('communication_payload_item_choice_conflict')
  if(body!==undefined)return Object.freeze({contentString:body})
  if(target!==undefined)return Object.freeze({contentReference:Object.freeze({reference:reference(target)})})
  if(attachment!==undefined)return Object.freeze({contentAttachment:attachment})
  return undefined
}

/** Import one native R4 item without silently discarding unsupported fields.
 * The scalar profile supports reference.reference and attachment contentType,
 * data, title and url. Additional native fields need a richer explicit adapter.
 */
export function communicationPayloadItemFhirR4ToFlat(item:FhirCommunicationPayload):Readonly<FlatClaims> {
  if(!isPlainObject(item)||Object.keys(item).length!==1)throw new TypeError('communication_payload_item_choice_invalid')
  const output:FlatClaims={}
  if(Object.hasOwn(item,'contentString'))output[C.ContentString]=rawString(item.contentString)
  else if(Object.hasOwn(item,'contentReference')){
    const value=item.contentReference
    if(!isPlainObject(value)||Object.keys(value).length!==1||!Object.hasOwn(value,'reference'))throw new TypeError('communication_payload_reference_fields_unsupported')
    output[C.ContentReference]=reference(value.reference)
  }else if(Object.hasOwn(item,'contentAttachment')){
    const value=item.contentAttachment
    if(!isPlainObject(value)||Object.keys(value).length===0)throw new TypeError('communication_payload_attachment_invalid')
    for(const field of Object.keys(value)){
      const entry=attachmentFields.find(([native])=>native===field)
      if(!entry)throw new TypeError('communication_payload_attachment_field_unsupported')
      output[entry[1]]=rawString(value[entry[0]])
    }
  }else throw new TypeError('communication_payload_r4_choice_unsupported')
  return Object.freeze(output)
}

/** Emit the controlled scalar-flat R4 profile in order: optional body, ordered
 * CSV references, optional attachment. This supports a body plus a Bundle
 * reference without conflating payload alternatives within a single item.
 */
export function communicationPayloadProfileFlatToFhirR4(input:Readonly<FlatClaims>):readonly FhirR4CommunicationPayloadItem[]|undefined {
  const claims=payloadClaims(input),parts:FhirR4CommunicationPayloadItem[]=[]
  const body=claims[C.ContentString],targets=claims[C.ContentReference]
  if(body!==undefined){const part=communicationPayloadItemFlatToFhirR4({[C.ContentString]:body});if(part)parts.push(part)}
  if(targets!==undefined)for(const target of targets.split(',')){
    const part=communicationPayloadItemFlatToFhirR4({[C.ContentReference]:reference(target)})
    if(part)parts.push(part)
  }
  const attachmentClaims:FlatClaims={}
  for(const [,key]of attachmentFields)if(claims[key]!==undefined)attachmentClaims[key]=claims[key]
  const attachment=communicationPayloadItemFlatToFhirR4(attachmentClaims)
  if(attachment)parts.push(attachment)
  return parts.length?Object.freeze(parts):undefined
}

/** Import only the declared body -> references -> attachment ordering.
 * Duplicate scalar parts or other orders cannot round-trip through these flat
 * fields, so they fail instead of being silently reordered or truncated.
 */
export function communicationPayloadProfileFhirR4ToFlat(payload:readonly FhirCommunicationPayload[]|undefined):Readonly<FlatClaims> {
  if(payload===undefined)return Object.freeze({})
  if(!Array.isArray(payload))throw new TypeError('communication_payload_array_required')
  const output:FlatClaims={},references:string[]=[]
  let previous=-1
  for(const item of payload){
    const claims=communicationPayloadItemFhirR4ToFlat(item),body=claims[C.ContentString],target=claims[C.ContentReference]
    const current=body!==undefined?0:target!==undefined?1:2
    if(current<previous||(current===previous&&current!==1))throw new TypeError('communication_payload_profile_order_or_multiplicity_unsupported')
    if(target!==undefined)references.push(target)
    else Object.assign(output,claims)
    previous=current
  }
  if(references.length)output[C.ContentReference]=references.join(',')
  return Object.freeze(output)
}
