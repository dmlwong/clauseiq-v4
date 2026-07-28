import type { ReactNode } from "react";
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
  showComparisonStatus?: boolean;
  highlightSupplierId?: string | null;
  highlightAnalysisId?: string | null;
  hiddenSupplierIds?: string[];
  layout?: ResultsLayout;
  supplierIdentityContent?: ReactNode;
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
  showComparisonStatus,
  highlightSupplierId,
  highlightAnalysisId,
  hiddenSupplierIds,
  layout = "accordion",
  supplierIdentityContent,
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
        showComparisonStatus={showComparisonStatus}
        highlightSupplierId={highlightSupplierId}
        highlightAnalysisId={highlightAnalysisId}
        hiddenSupplierIds={hiddenSupplierIds}
        supplierIdentityContent={supplierIdentityContent}
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
