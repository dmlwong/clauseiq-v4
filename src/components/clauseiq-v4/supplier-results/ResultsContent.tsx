import type { Initiative } from "@/data/mock-clauseiq";
import { OptionAccordion } from "./OptionAccordion";

interface Props {
  initiative: Initiative;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
}

export function ResultsContent({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
}: Props) {
  return (
    <OptionAccordion
      key="accordion"
      initiative={initiative}
      onRunAgain={onRunAgain}
      onDownload={onDownload}
      onViewResult={onViewResult}
    />
  );
}
