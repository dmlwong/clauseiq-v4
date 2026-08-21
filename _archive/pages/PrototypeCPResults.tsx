import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/prototype-cp-results/orbit-theme.css";

import { ContractResults } from "@/components/prototype-cp-results/ContractResults";
import { CpOrbitToastHost } from "@/components/prototype-cp-results/CpOrbitToast";
import { CP_FA, CpIcon, CpRail, HeaderActions } from "@/components/prototype-cp/PrototypeCPChrome";
import { CpButton } from "@/components/prototype-cp-shared/orbit";
import { PROTOTYPE_CP_RESULT_ROUTE } from "@/lib/prototype-cp-routes";
import "./PrototypeCP.css";

export { PROTOTYPE_CP_RESULT_ROUTE };

export default function PrototypeCPResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    if (searchParams.get("view") !== "results") return;
    defaultsAppliedRef.current = true;

    const next = new URLSearchParams(searchParams);
    next.set("source", "prototype-cp");
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
    <div className="prototype-cp cp-results-page cp-results-v5-parity">
      <div className="cp-app cp-results-shell">
        <CpRail />
        <section className="cp-main cp-results-shell-main">
          <header className="cp-topbar cp-results-shell-topbar">
            <div className="cp-results-shell-title">
              <h1 className="cp-title">ClauseIQ Results</h1>
              <span>CP001-1014 | sdasd</span>
            </div>
            <HeaderActions uploadCount="5" showCloud />
          </header>
          <main className="cp-results-dashboard-shell" data-prototype="prototype-cp-results" data-theme="orbit">
            <ContractResults
              initiativeId={searchParams.get("initiativeId") ?? "init-1"}
              supplierId={searchParams.get("supplierId") ?? "sup-1"}
              contractId={searchParams.get("contractId") ?? "ct-1"}
              compactHeader
              backLabel="Back to Workspace"
              onBack={() => navigate("/prototype-cp?view=workspace")}
            />
          </main>
        </section>
        <CpButton className="cp-floating-jasper"><CpIcon icon={CP_FA.sparkles} size={13} />Ask Jasper</CpButton>
        <CpButton className="cp-floating-help" aria-label="Help">?</CpButton>
      </div>
      <CpOrbitToastHost />
    </div>
  );
}
