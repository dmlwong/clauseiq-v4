import type { Initiative } from "@/data/mock-clauseiq-v6";
import { OptionAccordion } from "./OptionAccordion";
import { OutputPanelResultsContent } from "./OutputPanelResultsContent";
import type { AnalysisParameterItem, ResultsLayout, SupplierOutputSelection } from "./types";

interface Props {
  initiative: Initiative;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: (selection?: SupplierOutputSelection) => void;
  viewResultPrimary?: boolean;
  highlightLatestOutput?: boolean;
  higherIsBetter?: boolean;
  analysisParameters?: AnalysisParameterItem[];
  layout?: ResultsLayout;
}

export function ResultsContent({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  viewResultPrimary = true,
  highlightLatestOutput = true,
  higherIsBetter,
  analysisParameters,
  layout = "accordion",
}: Props) {
  if (layout === "output-panel") {
    return (
      <OutputPanelResultsContent
        initiative={initiative}
        onRunAgain={onRunAgain}
        onDownload={onDownload}
        onViewResult={onViewResult}
        viewResultPrimary={viewResultPrimary}
        highlightLatestOutput={highlightLatestOutput}
        higherIsBetter={higherIsBetter}
        analysisParameters={analysisParameters}
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
      analysisParameters={analysisParameters}
    />
  );
}
