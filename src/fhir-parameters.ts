/** Native FHIR Parameters exchange subset. Parsing untrusted values still requires the consuming operation's validation. */
export type SearchParameterPrimitive=string|number|boolean|readonly(string|number|boolean)[]
export type FhirParametersResource={resourceType:'Parameters';parameter:Array<{name?:unknown;valueString?:unknown;valueUri?:unknown;valueCode?:unknown;valueReference?:{reference?:unknown};valueCoding?:{system?:unknown;code?:unknown};valueInteger?:unknown;valueBoolean?:unknown;valueDecimal?:unknown}>}

/** Encode repeated search values using their native FHIR primitive choice. This is serialization, never authorization. */
export function buildFhirParametersResourceFromSearchParams(params:Readonly<Record<string,SearchParameterPrimitive|undefined>>):FhirParametersResource{
 const parameter:FhirParametersResource['parameter']=[]
 for(const [name,value]of Object.entries(params)){
  if(value===undefined||value===null)continue
  for(const item of Array.isArray(value)?value:[value]){
   if(typeof item==='string'&&!item.trim())continue
   if(typeof item==='boolean')parameter.push({name,valueBoolean:item})
   else if(typeof item==='number'){
    if(!Number.isFinite(item))throw new TypeError('fhir_parameter_number_must_be_finite')
    parameter.push({name,...(Number.isInteger(item)?{valueInteger:item}:{valueDecimal:item})})
   }else parameter.push({name,valueString:String(item).trim()})
  }
 }
 return {resourceType:'Parameters',parameter}
}
