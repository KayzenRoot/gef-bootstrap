import type{CreditRetractionTransaction,OperationOptions,ProgressRegressionReceipt,ProgressSnapshotCapsule,Result}from'./types.js';
import{fail,stableJson}from'./utils.js';
import{createProgressRegressionReceipt as createBaseRegressionReceipt}from'./s03-invalidation.js';

export function createProgressRegressionReceipt(before:ProgressSnapshotCapsule,after:ProgressSnapshotCapsule,transaction:CreditRetractionTransaction,reasonCodes:readonly string[],options:OperationOptions):Result<ProgressRegressionReceipt>{
  if(before.projectId!==after.projectId||before.lineageDigest!==after.lineageDigest)return fail('REGRESSION_LINEAGE_MISMATCH','Progress regression requires the same project lineage');
  if(before.manifestDigest!==after.manifestDigest||before.epochId!==after.epochId)return fail('REGRESSION_EPOCH_MISMATCH','Progress regression requires the same denominator epoch');
  if(stableJson(before.query)!==stableJson(after.query))return fail('REGRESSION_QUERY_MISMATCH','Progress regression requires the same progress query');
  if(after.predecessorSemanticDigest!==before.semanticDigest)return fail('REGRESSION_PREDECESSOR_MISMATCH','After snapshot must directly descend from the before snapshot semantic identity');
  return createBaseRegressionReceipt(before,after,transaction,reasonCodes,options);
}
