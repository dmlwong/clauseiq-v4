import { AnimatePresence } from "framer-motion";
import type { Initiative } from "@/data/mock-clauseiq";
import { OptionAccordion } from "./OptionAccordion";
import { OptionFilteredList } from "./OptionFilteredList";
import { OptionMasterDetail } from "./OptionMasterDetail";
import type { ResultsOption } from "./OptionSwitcher";
import type { FilteredListControls, MasterDetailState } from "./types";

interface Props {
  view: ResultsOption;
  initiative: Initiative;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  filteredControls?: FilteredListControls;
  onFilteredControlsChange?: (controls: FilteredListControls) => void;
  masterDetailState?: MasterDetailState;
}

export function ResultsContent({
  view,
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  filteredControls,
  onFilteredControlsChange,
  masterDetailState,
}: Props) {
  return (
    <AnimatePresence mode="wait">
      {view === "accordion" && (
        <OptionAccordion
          key="accordion"
          initiative={initiative}
          onRunAgain={onRunAgain}
          onDownload={onDownload}
          onViewResult={onViewResult}
        />
      )}
      {view === "master-detail" && (
        <OptionMasterDetail
          key="master-detail"
          initiative={initiative}
          onRunAgain={onRunAgain}
          onDownload={onDownload}
          onViewResult={onViewResult}
          masterDetailState={masterDetailState}
        />
      )}
      {view === "filtered-list" && (
        <OptionFilteredList
          key="filtered-list"
          initiative={initiative}
          onRunAgain={onRunAgain}
          onDownload={onDownload}
          onViewResult={onViewResult}
          filteredControls={filteredControls}
          onFilteredControlsChange={onFilteredControlsChange}
        />
      )}
    </AnimatePresence>
  );
}
