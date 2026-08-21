import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/prototype-cp-v2-results/orbit-theme.css";

import { ContractResults } from "@/components/prototype-cp-v2-results/ContractResults";
import { CpOrbitToastHost } from "@/components/prototype-cp-v2-results/CpOrbitToast";
import { CP_FA, CpIcon, CpRail, HeaderActions } from "@/components/prototype-cp-v2/PrototypeCPV2Chrome";
import { CpButton } from "@/components/prototype-cp-shared/orbit";
import { PROTOTYPE_CP_V2_RESULT_ROUTE } from "@/lib/prototype-cp-v2-routes";
import "./PrototypeCPV2.css";

export { PROTOTYPE_CP_V2_RESULT_ROUTE };

export default function PrototypeCPV2Results() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    if (searchParams.get("view") !== "results") return;
    defaultsAppliedRef.current = true;

    const next = new URLSearchParams(searchParams);
    next.set("source", "prototype-cp-v2");
    next.set("scenario", "first-analysis");
    next.set("mode", next.get("mode") === "history" ? "history" : "comparison");
    next.set("design", "row-scale");
    next.set("catSort", "risk");
    if (!next.has("tab")) next.set("tab", "changes");
    next.delete("from");
    next.delete("to");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <div className="prototype-cp-v2 cpv2-results-page cpv2-results-v5-parity">
      <div className="cpv2-app cpv2-results-shell">
        <CpRail />
        <section className="cpv2-main cpv2-results-shell-main">
          <header className="cpv2-topbar cpv2-results-shell-topbar">
            <div className="cpv2-results-shell-title">
              <h1 className="cpv2-title">ClauseIQ Results</h1>
              <span>CP001-1014 | sdasd</span>
            </div>
            <HeaderActions uploadCount="5" showCloud />
          </header>
          <main className="cpv2-results-dashboard-shell" data-prototype="prototype-cp-v2-results" data-theme="efficio-cp">
            <ContractResults
              initiativeId={searchParams.get("initiativeId") ?? "init-1"}
              supplierId={searchParams.get("supplierId") ?? "sup-1"}
              contractId={searchParams.get("contractId") ?? "ct-1"}
              compactHeader
              backLabel="Back to Workspace"
              onBack={() => navigate("/prototype-cp-v2?view=workspace")}
            />
          </main>
        </section>
        <CpButton className="cpv2-floating-jasper"><CpIcon icon={CP_FA.sparkles} size={13} />Ask Jasper</CpButton>
        <CpButton className="cpv2-floating-help" aria-label="Help">?</CpButton>
      </div>
      <CpOrbitToastHost />
    </div>
  );
}
