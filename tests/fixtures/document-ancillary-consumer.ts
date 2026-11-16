import {documentSupportResourceToClaims,type DocumentSupportInputType} from '../../dist/index.js'
import {documentSupportResourceToClaims as leaf} from '../../dist/converters/indexed-r4-profile.js'
const families:readonly DocumentSupportInputType[]=['Device','Location','Coverage','Appointment','AppointmentResponse']
for(const resourceType of families){documentSupportResourceToClaims({resourceType},{profile:'document-support-r4-v1'});leaf({resourceType},{profile:'document-support-r4-v1'})}
// @ts-expect-error Goal is not admitted by the document support profile.
documentSupportResourceToClaims({resourceType:'Goal'},{profile:'document-support-r4-v1'})
// @ts-expect-error A native R5 family must not be inferred from document admission.
documentSupportResourceToClaims({resourceType:'EncounterHistory'},{profile:'document-support-r4-v1'})
// @ts-expect-error Explicit profile selection remains required.
documentSupportResourceToClaims({resourceType:'Device'},{profile:'indexed-r4-semantic'})
