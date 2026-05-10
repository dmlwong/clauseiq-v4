import { useState } from "react";
import { InitiativesList } from "@/components/workflow/InitiativesList";
import { InitiativeOverview } from "@/components/workflow/InitiativeOverview";
import { SupplierPage } from "@/components/workflow/SupplierPage";
import { ContractResults } from "@/components/workflow/ContractResults";
import { WizardModal } from "@/components/wizard/WizardModal";
import { useWizardState } from "@/hooks/use-wizard-state";
import { useContractStatus } from "@/hooks/use-contract-status";
import { auditLog } from "@/lib/mock-api";
import { getInitiative, getSupplier, getContract } from "@/lib/workflow-data";

type View =
  | { name: "initiatives" }
  | { name: "initiative"; initiativeId: string }
  | { name: "supplier"; initiativeId: string; supplierId: string }
  | { name: "results"; initiativeId: string; supplierId: string; contractId: string };

const Index = () => {
  const [view, setView] = useState<View>({ name: "initiatives" });
  const [wizardCtx, setWizardCtx] = useState<{ initiativeId: string; supplierId: string; contractId: string } | null>(null);
  const wizard = useWizardState();
  const contractStatus = useContractStatus();

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
    <>
      {view.name === "initiatives" && (
        <InitiativesList onSelect={(id) => setView({ name: "initiative", initiativeId: id })} />
      )}
      {view.name === "initiative" && (
        <InitiativeOverview
          initiativeId={view.initiativeId}
          onBack={() => setView({ name: "initiatives" })}
          onSelectSupplier={(supplierId) => setView({ name: "supplier", initiativeId: view.initiativeId, supplierId })}
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
          onBack={() => setView({ name: "supplier", initiativeId: view.initiativeId, supplierId: view.supplierId })}
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
    </>
  );
};

export default Index;
