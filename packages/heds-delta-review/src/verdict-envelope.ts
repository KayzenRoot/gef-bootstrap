import type{HedsVerdictCapsule,OperationOptions,Result}from'./types.js';
import{allSha,digestValue,fail,ok,validId}from'./utils.js';

export function verifySerializedHedsVerdictEnvelope(c:HedsVerdictCapsule,options:OperationOptions):Result<true>{
 if(![c.verdictId,c.projectId,c.lineageId].every(validId)||!['APPROVED','CORRECTION_REQUIRED','BLOCKED','INDETERMINATE','TRUNCATED'].includes(c.verdict))return fail('HVC26_ENVELOPE_INVALID','Serialized verdict envelope identifiers or state are invalid.',c.verdictId);
 if(!allSha([c.baselineIdentityDigest,c.candidateIdentityDigest,c.sourceManifestDigest,c.reviewPolicyDigest,c.inventoryDigest,c.frontierDigest,c.gateSetDigest,c.semanticDigest,c.verdictDigest,...c.findingDigests]))return fail('HVC26_ENVELOPE_INVALID','Serialized verdict envelope contains invalid digest bindings.',c.verdictId);
 if(new Set(c.findingDigests).size!==c.findingDigests.length)return fail('HVC26_ENVELOPE_INVALID','Serialized verdict envelope contains duplicate finding bindings.',c.verdictId);
 const body={verdictId:c.verdictId,projectId:c.projectId,lineageId:c.lineageId,baselineIdentityDigest:c.baselineIdentityDigest,candidateIdentityDigest:c.candidateIdentityDigest,sourceManifestDigest:c.sourceManifestDigest,reviewPolicyDigest:c.reviewPolicyDigest,inventoryDigest:c.inventoryDigest,frontierDigest:c.frontierDigest,gateSetDigest:c.gateSetDigest,findingDigests:c.findingDigests,verdict:c.verdict};
 const s=digestValue(options,'HSD26',body);if(!s.ok)return s;
 const d=digestValue(options,'HVC26',{...body,semanticDigest:s.value});if(!d.ok)return d;
 if(s.value!==c.semanticDigest||d.value!==c.verdictDigest)return fail('HVC26_ENVELOPE_TAMPERED','Serialized verdict envelope does not match its semantic identities.',c.verdictId);
 return ok(true);
}
