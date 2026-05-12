import type { Initiative } from "@/data/mock-clauseiq";
import { OptionMasterDetail } from "./OptionMasterDetail";
import type { MasterDetailState } from "./types";

interface Props {
  initiative: Initiative;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  masterDetailState?: MasterDetailState;
}

export function ResultsContent({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  masterDetailState,
}: Props) {
  return (
    <OptionMasterDetail
      key="master-detail"
      initiative={initiative}
      onRunAgain={onRunAgain}
      onDownload={onDownload}
      onViewResult={onViewResult}
      masterDetailState={masterDetailState}
    />
  );
}
