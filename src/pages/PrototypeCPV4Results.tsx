import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CpV4ResultsExperience } from "@/components/prototype-cp-v4/results/CpV4ResultsExperience";
import { PROTOTYPE_CP_RESULT_ROUTE } from "@/lib/prototype-cp-v4-routes";

export { PROTOTYPE_CP_RESULT_ROUTE };

export default function PrototypeCPV4Results() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (defaultsAppliedRef.current || searchParams.get("view") !== "results") return;
    defaultsAppliedRef.current = true;

    const next = new URLSearchParams(searchParams);
    next.set("source", "prototype-cp-v4");
    next.set("scenario", "first-analysis");
    next.set("dashboardView", "initial-analysis");
    next.set("mode", "comparison");
    next.set("design", "design-option-3");
    next.set("catSort", "risk");
    if (!next.has("tab")) next.set("tab", "changes");
    if (!next.has("analysisId")) next.set("analysisId", "a-initial-latest");
    if (!next.has("outputSupplierId")) next.set("outputSupplierId", "sup-001");
    if (!next.has("to")) next.set("to", "v1");
    next.delete("from");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <CpV4ResultsExperience
        initiativeId={searchParams.get("initiativeId") ?? "init-1"}
        supplierId={searchParams.get("supplierId") ?? "sup-1"}
        contractId={searchParams.get("contractId") ?? "ct-1"}
        compactHeader
        backLabel="Back to Workspace"
        onBack={() => navigate("/prototype-cp-v4?view=workspace")}
    />
  );
}
