import "./cp-results-theme.css";
import {
  ContractResults as V6AContractResults,
} from "@/components/workflow-v6a/ContractResults";
import { V6OrbitRoot } from "@/components/clauseiq-v6a/V6OrbitRoot";

interface CpV4ResultsExperienceProps {
  initiativeId: string;
  supplierId: string;
  contractId: string;
  compactHeader?: boolean;
  showBack?: boolean;
  backLabel?: string;
  onBack: () => void;
  embedded?: boolean;
}

/**
 * CP v4's ownership boundary for the ClauseIQ results experience.
 *
 * The current CCP v6a result engine remains read-only while this wrapper owns
 * its CP presentation and provides the seam for migrating the implementation
 * into CP v4 in incremental, behaviour-preserving steps.
 */
export function CpV4ResultsExperience({
  embedded = false,
  ...props
}: CpV4ResultsExperienceProps) {
  return (
    <div className="cpv4-results-experience" data-theme="efficio-cp">
      <V6OrbitRoot layout={embedded ? "embedded" : "page"}>
        <V6AContractResults {...props} />
      </V6OrbitRoot>
    </div>
  );
}
