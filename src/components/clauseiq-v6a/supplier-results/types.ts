import type { ClauseAnalysis, Initiative, Supplier } from "@/data/mock-clauseiq-v6";

export type FilteredListSortMode = "severity" | "recent" | "supplier" | "clauses";
export type ResultsLayout = "accordion" | "output-panel";
export type SupplierOutputsPanelState = "empty" | "processing" | "filled";
export type MasterDetailSupplier = Initiative["suppliers"][number];

export interface AnalysisParameterItem {
  label: string;
  value: string;
}

export interface FilteredListControls {
  query: string;
  supplierId: string;
  sort: FilteredListSortMode;
}

export const DEFAULT_FILTERED_LIST_CONTROLS: FilteredListControls = {
  query: "",
  supplierId: "all",
  sort: "severity",
};

export interface ResultsViewProps {
  initiative: Initiative;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: (selection?: SupplierOutputSelection) => void;
  viewResultPrimary?: boolean;
  highlightLatestOutput?: boolean;
  higherIsBetter?: boolean;
  analysisParameters?: AnalysisParameterItem[];
  layout?: ResultsLayout;
  outputState?: SupplierOutputsPanelState;
  filteredControls?: FilteredListControls;
  onFilteredControlsChange?: (controls: FilteredListControls) => void;
  masterDetailState?: MasterDetailState;
}

export interface SupplierOutputSelection {
  supplier: Supplier;
  analysis: ClauseAnalysis;
  previousAnalysis?: ClauseAnalysis;
}

export interface MasterDetailState {
  filteredSuppliers: Initiative["suppliers"];
  selectedId: string;
  selectedSupplier: MasterDetailSupplier | null;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (supplierId: string) => void;
}
