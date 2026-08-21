export const PROTOTYPE_CP_V3_ROUTE = "/prototype-cp-v3";

export const PROTOTYPE_CP_V3_WORKSPACE_ROUTE = "/prototype-cp-v3?view=workspace";

/** Workspace with the supplier-outputs modal already open (v6a's output-panel equivalent). */
export const PROTOTYPE_CP_V3_OUTPUTS_ROUTE = "/prototype-cp-v3?view=workspace&outputs=open";

export const PROTOTYPE_CP_V3_RESULT_ROUTE =
  "/prototype-cp-v3/results?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=prototype-cp-v3&catSort=risk&mode=comparison&tab=changes&design=design-option-2&scenario=first-analysis";

/**
 * Replaces v6a's LATEST_V6_RESULTS_ROUTE (clauseiq-v6a/ClauseIqWorkflow.tsx:313).
 * The copied workflow imports this instead of declaring its own literal.
 */
export const LATEST_CP_V3_RESULTS_ROUTE = PROTOTYPE_CP_V3_RESULT_ROUTE;
