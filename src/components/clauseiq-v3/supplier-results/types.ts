import type { Initiative } from "@/data/mock-clauseiq";

export type FilteredListSortMode = "severity" | "recent" | "supplier" | "clauses";
export type MasterDetailSupplier = Initiative["suppliers"][number];

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
  onViewResult?: () => void;
  filteredControls?: FilteredListControls;
  onFilteredControlsChange?: (controls: FilteredListControls) => void;
  masterDetailState?: MasterDetailState;
}

export interface MasterDetailState {
  filteredSuppliers: Initiative["suppliers"];
  selectedId: string;
  selectedSupplier: MasterDetailSupplier | null;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (supplierId: string) => void;
}
