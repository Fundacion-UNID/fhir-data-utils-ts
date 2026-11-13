export type FhirCanonicalizationOptions = Readonly<{
  stripMetaVersionId?:boolean
  stripNarrativeText?:boolean
  stripNestedElementIds?:boolean
}>

/** Deterministic JSON projection; significant array order is preserved. This is not JSON-LD normalization. */
export function canonicalizeFhirResource(resource:Record<string,unknown>,options:FhirCanonicalizationOptions={}):string {
  const visit=(value:unknown,depth:number):unknown=>{
    if(Array.isArray(value))return value.map(item=>visit(item,depth+1))
    if(!value||typeof value!=='object')return value
    const source=value as Record<string,unknown>
    const output:Record<string,unknown>={}
    for(const key of Object.keys(source).sort()){
      if(source[key]===undefined)continue
      if(depth===0&&key==='text'&&options.stripNarrativeText)continue
      if(depth>0&&key==='id'&&options.stripNestedElementIds)continue
      let next=source[key]
      if(key==='meta'&&(options.stripMetaVersionId??true)&&next&&typeof next==='object'&&!Array.isArray(next)){
        const {versionId,...meta}=next as Record<string,unknown>
        next=meta
      }
      Object.defineProperty(output,key,{value:visit(next,depth+1),enumerable:true,writable:true,configurable:true})
    }
    return output
  }
  return JSON.stringify(visit(resource,0))
}
