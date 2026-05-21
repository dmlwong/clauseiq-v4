import type { Initiative } from "@/data/mock-clauseiq";
import { OptionAccordion } from "./OptionAccordion";
import { OutputPanelResultsContent } from "./OutputPanelResultsContent";
import type { ResultsLayout } from "./types";

interface Props {
  initiative: Initiative;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  layout?: ResultsLayout;
}

export function ResultsContent({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  layout = "accordion",
}: Props) {
  if (layout === "output-panel") {
    return (
      <OutputPanelResultsContent
        initiative={initiative}
        onRunAgain={onRunAgain}
        onDownload={onDownload}
        onViewResult={onViewResult}
      />
    );
  }

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
