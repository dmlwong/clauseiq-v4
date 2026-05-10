// Prototype v2 — duplicated from Index.tsx so changes here don't affect v1.
// Currently identical to v1; edit freely without touching src/pages/Index.tsx.
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InitiativesList } from "@/components/workflow/InitiativesList";
import { InitiativeOverview } from "@/components/workflow/InitiativeOverview";
import { SupplierPage } from "@/components/workflow/SupplierPage";
import {
  ContractResults,
  ScoringOptionSwitcher,
  type ScoringOptionKey,
} from "@/components/workflow/ContractResults";
import { CrossSupplierComparison } from "@/components/workflow/CrossSupplierComparison";
import { WizardModal } from "@/components/wizard/WizardModal";
import { useWizardState } from "@/hooks/use-wizard-state";
import { useContractStatus } from "@/hooks/use-contract-status";
import { auditLog } from "@/lib/mock-api";
import { getInitiative, getSupplier, getContract } from "@/lib/workflow-data";
import { V2Shell } from "@/components/clauseiq-v2/V2Shell";

type View =
  | { name: "initiatives" }
  | { name: "initiative"; initiativeId: string }
  | { name: "compare"; initiativeId: string }
  | { name: "supplier"; initiativeId: string; supplierId: string }
  | { name: "results"; initiativeId: string; supplierId: string; contractId: string };

const IndexV2 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [scoringOption, setScoringOption] = useState<ScoringOptionKey>("hybrid");
  const wizard = useWizardState();
  const contractStatus = useContractStatus();
  const routeSource = searchParams.get("source");
  const isClauseIQResultRoute = routeSource === "clauseiq";
  const isDeliveryEngineResultRoute = routeSource === "delivery-engine";
  const isExternalResultRoute = isClauseIQResultRoute || isDeliveryEngineResultRoute;
  const deliveryEngineReturnPath = searchParams.get("return") ?? "/delivery-engine/YRK18-1043";

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
    <V2Shell
      title="ClauseIQ"
      subtitle="AI tool for detailed contract analyses"
      headerRight={
        isExternalResultRoute && view.name === "results" ? (
          <ScoringOptionSwitcher value={scoringOption} onChange={setScoringOption} />
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
          compactHeader={isExternalResultRoute}
          scoringOption={scoringOption}
          onScoringOptionChange={setScoringOption}
          onRunAnalysisAgain={
            isExternalResultRoute
              ? () =>
                  navigate(
                    `/clauseiq-v2?view=results&rerun=upload&source=${routeSource ?? "clauseiq"}${
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
              navigate("/clauseiq-v2?view=results");
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
    </V2Shell>
  );
};

export default IndexV2;
