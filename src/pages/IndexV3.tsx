// Prototype v3 — duplicated from v2 so changes here don't affect v2.
// Edit freely without touching src/pages/IndexV2.tsx.
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InitiativesList } from "@/components/workflow-v3/InitiativesList";
import { InitiativeOverview } from "@/components/workflow-v3/InitiativeOverview";
import { SupplierPage } from "@/components/workflow-v3/SupplierPage";
import { ContractResults } from "@/components/workflow-v3/ContractResults";
import { CrossSupplierComparison } from "@/components/workflow-v3/CrossSupplierComparison";
import { WizardModal } from "@/components/wizard-v3/WizardModal";
import { useWizardState } from "@/hooks/use-wizard-state";
import { useContractStatus } from "@/hooks/use-contract-status";
import { auditLog } from "@/lib/mock-api";
import { getInitiative, getSupplier, getContract } from "@/lib/workflow-data";
import { V3Shell } from "@/components/clauseiq-v3/V3Shell";
import {
  DesignOptionSwitcher,
  type ComparisonDesignOption,
} from "@/components/workflow-v3/ComparisonDesignOptions";

type View =
  | { name: "initiatives" }
  | { name: "initiative"; initiativeId: string }
  | { name: "compare"; initiativeId: string }
  | { name: "supplier"; initiativeId: string; supplierId: string }
  | { name: "results"; initiativeId: string; supplierId: string; contractId: string };

const IndexV3 = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView: View = (() => {
    const v = searchParams.get("view");
    if (v === "results") {
      const initiativeId = searchParams.get("initiativeId");
      const supplierId = searchParams.get("supplierId");
      const contractId = searchParams.get("contractId");
      if (initiativeId && supplierId && contractId) {
        return { name: "results", initiativeId, supplierId, contractId };
      }
    }
    return { name: "initiatives" };
  })();
  const [view, setView] = useState<View>(initialView);
  useEffect(() => {
    const v = searchParams.get("view");
    if (v === "results") {
      const initiativeId = searchParams.get("initiativeId");
      const supplierId = searchParams.get("supplierId");
      const contractId = searchParams.get("contractId");
      if (initiativeId && supplierId && contractId) {
        setView({ name: "results", initiativeId, supplierId, contractId });
      }
    }
  }, [searchParams]);
  const [wizardCtx, setWizardCtx] = useState<{ initiativeId: string; supplierId: string; contractId: string } | null>(null);
  const wizard = useWizardState();
  const contractStatus = useContractStatus();
  const routeSource = searchParams.get("source");
  const isClauseIQResultRoute = routeSource === "clauseiq";
  const isDeliveryEngineResultRoute = routeSource === "delivery-engine";
  const isExternalResultRoute = isClauseIQResultRoute || isDeliveryEngineResultRoute;
  const deliveryEngineReturnPath = searchParams.get("return") ?? "/delivery-engine/YRK18-1043";
  const resultMode = searchParams.get("mode") === "history" ? "history" : "comparison";
  const designOption: ComparisonDesignOption =
    searchParams.get("design") === "side-by-side" || searchParams.get("design") === "document"
      ? (searchParams.get("design") as ComparisonDesignOption)
      : "evolved";
  const showDesignSwitcher = view.name === "results" && resultMode === "comparison";

  const setDesignOption = (nextDesign: ComparisonDesignOption) => {
    const next = new URLSearchParams(searchParams);
    next.set("mode", "comparison");
    next.set("design", nextDesign);
    setSearchParams(next, { replace: false });
  };

  const launchClauseIQ = (initiativeId: string, supplierId: string, contractId: string) => {
    setWizardCtx({ initiativeId, supplierId, contractId });
    wizard.resetWizard();
    wizard.openWizard();
    auditLog("modal_opened", { initiativeId, supplierId, contractId });
  };

  let context: React.ComponentProps<typeof WizardModal>["context"] = undefined;
  if (wizardCtx) {
    const init = getInitiative(wizardCtx.initiativeId);
    const sup = getSupplier(wizardCtx.initiativeId, wizardCtx.supplierId);
    const ct = getContract(wizardCtx.initiativeId, wizardCtx.supplierId, wizardCtx.contractId);
    if (init && sup && ct) {
      const nextV = `v${(ct.versions.length || 0) + 1}`;
      context = {
        initiativeName: init.name,
        initiativeRef: init.reference,
        supplierName: sup.name,
        contractName: ct.name,
        versionLabel: nextV,
      };
    }
  }

  return (
    <V3Shell
      title="ClauseIQ"
      subtitle="AI tool for detailed contract analyses"
      headerRight={
        showDesignSwitcher ? (
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Design
            </span>
            <DesignOptionSwitcher value={designOption} onChange={setDesignOption} />
          </div>
        ) : undefined
      }
    >
      {view.name === "initiatives" && (
        <InitiativesList onSelect={(id) => setView({ name: "initiative", initiativeId: id })} />
      )}
      {view.name === "initiative" && (
        <InitiativeOverview
          initiativeId={view.initiativeId}
          onBack={() => setView({ name: "initiatives" })}
          onSelectSupplier={(supplierId) => setView({ name: "supplier", initiativeId: view.initiativeId, supplierId })}
          onCompare={() => setView({ name: "compare", initiativeId: view.initiativeId })}
        />
      )}
      {view.name === "compare" && (
        <CrossSupplierComparison
          initiativeId={view.initiativeId}
          onBack={() => setView({ name: "initiative", initiativeId: view.initiativeId })}
          onOpenSupplier={(supplierId) => setView({ name: "supplier", initiativeId: view.initiativeId, supplierId })}
          onOpenContract={(supplierId, contractId) =>
            setView({ name: "results", initiativeId: view.initiativeId, supplierId, contractId })
          }
        />
      )}
      {view.name === "supplier" && (
        <SupplierPage
          initiativeId={view.initiativeId}
          supplierId={view.supplierId}
          onBack={() => setView({ name: "initiative", initiativeId: view.initiativeId })}
          onRunClauseIQ={(contractId) => launchClauseIQ(view.initiativeId, view.supplierId, contractId)}
          onViewResults={(contractId) =>
            setView({ name: "results", initiativeId: view.initiativeId, supplierId: view.supplierId, contractId })
          }
          getContractStatus={contractStatus.get}
          setContractStatus={contractStatus.set}
        />
      )}
      {view.name === "results" && (
        <ContractResults
          initiativeId={view.initiativeId}
          supplierId={view.supplierId}
          contractId={view.contractId}
          backLabel={
            isDeliveryEngineResultRoute
              ? "Back to Delivery Engine"
              : isClauseIQResultRoute
                ? "Back to ClauseIQ"
                : undefined
          }
          compactHeader
          onRunAnalysisAgain={
            isExternalResultRoute
              ? () =>
                  navigate(
                    `/clauseiq-v3?view=results&rerun=upload&source=${routeSource ?? "clauseiq"}${
                      isDeliveryEngineResultRoute ? "&initiativeId=YRK18-1043" : ""
                    }`,
                  )
              : undefined
          }
          onBack={() => {
            if (isDeliveryEngineResultRoute) {
              navigate(deliveryEngineReturnPath);
              return;
            }
            if (isClauseIQResultRoute) {
              navigate("/clauseiq-v3?view=results");
              return;
            }
            setView({ name: "supplier", initiativeId: view.initiativeId, supplierId: view.supplierId });
          }}
        />
      )}

      <WizardModal
        state={wizard.state}
        update={wizard.update}
        completeStep={wizard.completeStep}
        goNext={wizard.goNext}
        goBack={wizard.goBack}
        closeWizard={wizard.closeWizard}
        context={context}
      />
    </V3Shell>
  );
};

export default IndexV3;
