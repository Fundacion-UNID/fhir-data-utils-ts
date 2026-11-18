// Flow contract: encode search primitives into native Parameters without losing false, zero, repeated values or numeric type.
import test from 'node:test'
import assert from 'node:assert/strict'
import {buildFhirParametersResourceFromSearchParams} from '../dist/fhir-parameters.js'

test('preserves repeated strings and native boolean/integer/decimal choices',()=>{
 assert.deepEqual(buildFhirParametersResourceFromSearchParams({name:[' first ','second'],active:false,count:0,ratio:1.5}),{resourceType:'Parameters',parameter:[{name:'name',valueString:'first'},{name:'name',valueString:'second'},{name:'active',valueBoolean:false},{name:'count',valueInteger:0},{name:'ratio',valueDecimal:1.5}]})
})
test('omits missing and empty string values without mutating input',()=>{
 const input=Object.freeze({empty:'  ',absent:undefined,items:Object.freeze(['',true,2])})
 assert.deepEqual(buildFhirParametersResourceFromSearchParams(input),{resourceType:'Parameters',parameter:[{name:'items',valueBoolean:true},{name:'items',valueInteger:2}]})
})
test('rejects non-finite numbers that cannot be expressed as FHIR numbers',()=>{
 for(const value of [NaN,Infinity,-Infinity])assert.throws(()=>buildFhirParametersResourceFromSearchParams({value}),/finite/)
})
