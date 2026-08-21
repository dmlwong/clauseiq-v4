import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/clauseiq-v7/orbit-ui/tooltip";
import { ContractResults } from "./ContractResults";

const mocks = vi.hoisted(() => ({
  downloadCsv: vi.fn(),
}));

vi.mock("@/lib/csv-export", () => ({
  downloadCsv: mocks.downloadCsv,
}));

const firstAnalysisRoute =
  "/initiatives-v7?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";
const outcomeReviewRoute =
  "/initiatives-v7?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=negotiated-reanalysis&resultMode=outcome&analysisId=a-001&previousAnalysisId=a-002&outputSupplierId=sup-001&from=v2&to=v3";
const outcomeReviewDraftRoute =
  "/initiatives-v7?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=negotiated-reanalysis&resultMode=outcome&analysisId=a-004&previousAnalysisId=a-005&outputSupplierId=sup-002&from=v1&to=v2";
const initialAnalysisOnlyRoute =
  "/initiatives-v7?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis&dashboardView=initial-analysis&analysisId=a-006&outputSupplierId=sup-003&to=v1";

function renderContractResults(route = firstAnalysisRoute) {
  window.history.pushState({}, "", route);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <TooltipProvider>
        <ContractResults
          initiativeId="init-1"
          supplierId="sup-1"
          contractId="ct-1"
          compactHeader
          onBack={vi.fn()}
          backLabel="Back to ClauseIQ"
        />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

function openRecommendationMenu() {
  fireEvent.click(screen.getByRole("button", { name: /bulk action/i }));
}

function selectedBannerCount() {
  const banner = screen.getByRole("region", { name: /bulk recommendation filters/i });
  const match = banner.textContent?.match(/(\d+)\s+selected/i);
  return match ? Number(match[1]) : 0;
}

function getBulkDropdownTrigger() {
  const banner = screen.getByRole("region", { name: /bulk recommendation filters/i });
  return within(banner).getByRole("button", { name: /all eligible clauses|deviation:|status:|type:/i });
}

function openBulkDropdown() {
  fireEvent.click(getBulkDropdownTrigger());
}

function selectBulkAxis(name: "Deviation" | "Status" | "Type") {
  fireEvent.click(screen.getByRole("button", { name }));
}

function toggleBulkCheckbox(name: RegExp) {
  fireEvent.click(screen.getByRole("checkbox", { name }));
}

function applyRecommendationOptions(axis: "Deviation" | "Status" | "Type", ...names: RegExp[]) {
  openRecommendationMenu();
  openBulkDropdown();
  selectBulkAxis(axis);
  names.forEach((name) => {
    toggleBulkCheckbox(name);
  });
  fireEvent.click(screen.getByRole("button", { name: /Accept recommended positions/i }));
  fireEvent.click(screen.getByRole("button", { name: /Accept \d+/i }));
}

function generateCsv() {
  fireEvent.click(screen.getByRole("button", { name: /review & generate/i }));
  fireEvent.click(screen.getByRole("button", { name: /submit & generate/i }));
}

function reviewGenerateCount() {
  const label = screen.getByRole("button", { name: /review & generate/i }).textContent ?? "";
  const match = label.match(/\((\d+)\)/);
  return match ? Number(match[1]) : 0;
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  mocks.downloadCsv.mockClear();
  localStorage.clear();
  sessionStorage.clear();
});

describe("ContractResults V7 review controls", () => {
  it("renders the negotiated re-analysis outcome review for later supplier outputs", () => {
    renderContractResults(outcomeReviewRoute);

    expect(screen.getByText("Supplier: Thomson Reuters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Initial Analysis" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Comparison View" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("v2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("v3").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Compare from version v2" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Compare to version v3" })).not.toBeInTheDocument();
    expect(screen.queryByText("MSA_ThomsonReuters_v1.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("MSA_ThomsonReuters_v2.pdf")).not.toBeInTheDocument();
  });

  it("switches the dashboard between initial-analysis and comparison views", () => {
    renderContractResults(outcomeReviewRoute);

    fireEvent.click(screen.getByRole("button", { name: "Initial Analysis" }));

    expect(screen.getByRole("button", { name: "Initial Analysis" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Comparison View" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Validate ClauseIQ recommendations before supplier negotiation")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Comparison View" }));

    expect(screen.getByRole("button", { name: "Initial Analysis" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Comparison View" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("v2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("v3").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Compare from version v2" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Compare to version v3" })).not.toBeInTheDocument();
  });

  it("disables comparison view for a selected output with no previous analysis", () => {
    renderContractResults(initialAnalysisOnlyRoute);

    expect(screen.getByRole("button", { name: "Initial Analysis" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Comparison View" })).toBeDisabled();
    expect(screen.getByText("Validate ClauseIQ recommendations before supplier negotiation")).toBeInTheDocument();
  });

  it("groups met outcome rows under Met instead of Not Met", () => {
    renderContractResults(outcomeReviewRoute);

    const metRow = screen.getByText("Liability Cap of Supplier").closest('[id^="clause-row-"]');
    const notMetRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');

    expect(metRow).toBeTruthy();
    expect(notMetRow).toBeTruthy();

    const metSection = metRow?.closest("section");
    const notMetSection = notMetRow?.closest("section");

    expect(metSection).toBeTruthy();
    expect(notMetSection).toBeTruthy();
    expect(within(metSection as HTMLElement).getByText(/^Met ·/)).toBeInTheDocument();
    expect(within(notMetSection as HTMLElement).getByText(/^Not Met ·/)).toBeInTheDocument();
    expect(within(notMetSection as HTMLElement).queryByText("Liability Cap of Supplier")).not.toBeInTheDocument();
  });

  it("sorts outcome rows within each verdict group by deviation level", () => {
    renderContractResults(outcomeReviewRoute);

    const highDeviationRow = screen.getByText("Subcontracting").closest('[id^="clause-row-"]');
    const mediumDeviationRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');

    expect(highDeviationRow).toBeTruthy();
    expect(mediumDeviationRow).toBeTruthy();
    expect(highDeviationRow?.closest("section")).toBe(mediumDeviationRow?.closest("section"));
    expect(highDeviationRow?.compareDocumentPosition(mediumDeviationRow as HTMLElement)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("enables bulk best-practice application by deviation level in outcome review", async () => {
    renderContractResults(outcomeReviewRoute);

    const bulkApplyButton = screen.getByRole("button", { name: /bulk action/i });
    expect(bulkApplyButton).toBeEnabled();

    applyRecommendationOptions("Deviation", /High/i);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /review & generate/i })).toBeEnabled();
      expect(reviewGenerateCount()).toBeGreaterThan(0);
    });
  });

  it("keeps open review clauses free of draft and added-to-review header pills", () => {
    renderContractResults(outcomeReviewDraftRoute);

    expect(screen.getByText("Liability Cap of Supplier")).toBeInTheDocument();
    expect(screen.queryByText("Drafting request")).not.toBeInTheDocument();
    expect(screen.queryByText("Added to Review")).not.toBeInTheDocument();
  });

  it("maps stakeholder demo examples into the corrected outcome metadata states", () => {
    renderContractResults(outcomeReviewRoute);

    const regressedRow = screen.getByText("Service Levels").closest('[id^="clause-row-"]');
    const newMissingRow = screen.getByText("Data Breach Notification").closest('[id^="clause-row-"]');

    expect(regressedRow).toBeTruthy();
    expect(newMissingRow).toBeTruthy();

    expect(within(regressedRow as HTMLElement).queryByText("Regressed")).not.toBeInTheDocument();
    expect(within(regressedRow as HTMLElement).getByText("High Deviation")).toBeInTheDocument();
    expect(within(newMissingRow as HTMLElement).getByText("New")).toBeInTheDocument();
    expect(within(newMissingRow as HTMLElement).queryByText("New supplier change")).not.toBeInTheDocument();
    expect(within(newMissingRow as HTMLElement).getByText("Missing")).toBeInTheDocument();
    expect(within(newMissingRow as HTMLElement).getByText("High Deviation")).toBeInTheDocument();
    expect(screen.queryByText("New supplier changes")).not.toBeInTheDocument();
    expect(screen.queryByText("Needs decision")).not.toBeInTheDocument();
  });

  it("shows a deviation level, rather than a round action, for missing clauses", () => {
    renderContractResults(outcomeReviewRoute);

    const missingRow = screen.getByText("Uptime and Downtime Commitments").closest('[id^="clause-row-"]');
    expect(missingRow).toBeTruthy();

    const scope = within(missingRow as HTMLElement);
    expect(scope.getByText("Low Deviation")).toBeInTheDocument();
    expect(scope.getByText("Missing")).toBeInTheDocument();
    expect(scope.getByText("Round Action")).toBeInTheDocument();
    expect(scope.queryByText("Not Met")).not.toBeInTheDocument();
  });

  it("shows No Further Action as round-action metadata before the deviation on carried-forward clauses", () => {
    renderContractResults(outcomeReviewRoute);

    const noActionRow = screen.getByText("Confidentiality").closest('[id^="clause-row-"]');
    expect(noActionRow).toBeTruthy();

    const scope = within(noActionRow as HTMLElement);
    expect(scope.getByText("Round Action")).toBeInTheDocument();
    expect(scope.getByText("No Further Action")).toBeInTheDocument();
    expect(scope.getByText("High Deviation")).toBeInTheDocument();
  });

  it("uses the simplified target, previous, and current hierarchy on negotiated outcome cards", () => {
    renderContractResults(outcomeReviewRoute);

    const clauseRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');
    expect(clauseRow).toBeTruthy();

    const scope = within(clauseRow as HTMLElement);

    expect(scope.getByText("Recommend Position")).toBeInTheDocument();
    expect(scope.getByText("Previous Analysis · v2")).toBeInTheDocument();
    expect(scope.getByText("Current Analysis · v3")).toBeInTheDocument();
    expect(
      scope.getByText("Require full GDPR Art. 28 schedule and 24-hour breach notification SLA."),
    ).toBeInTheDocument();
    expect(scope.queryByText("Outcome summary")).not.toBeInTheDocument();
    expect(scope.queryByText("Matched text")).not.toBeInTheDocument();
    expect(
      scope.queryByText("Current language is non-compliant with our DPA framework and exposes us to regulator action."),
    ).not.toBeInTheDocument();

    const rowText = clauseRow?.textContent ?? "";
    expect(rowText.indexOf("Previous Analysis · v2")).toBeLessThan(rowText.indexOf("Current Analysis · v3"));
    expect(rowText.indexOf("Current Analysis · v3")).toBeLessThan(rowText.indexOf("Recommend Position"));
  });

  it("shows the clause best practice even when a comparison clause has no custom target yet", () => {
    renderContractResults(outcomeReviewRoute);

    const clauseRow = screen.getByText("Service Levels").closest('[id^="clause-row-"]');

    expect(clauseRow).toBeTruthy();

    const scope = within(clauseRow as HTMLElement);

    expect(scope.getByText("Recommend Position")).toBeInTheDocument();
    expect(scope.getByText("Previous Analysis · v2")).toBeInTheDocument();
    expect(scope.getByText("Current Analysis · v3")).toBeInTheDocument();
  });

  it("places Set Custom Position and Apply Recommended Position inside the Recommend Position card", () => {
    renderContractResults(outcomeReviewRoute);

    const clauseRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');
    expect(clauseRow).toBeTruthy();

    const scope = within(clauseRow as HTMLElement);
    const recommendCard = scope.getByText("Recommend Position").closest("div");
    expect(recommendCard).toBeTruthy();

    const recommendScope = within(recommendCard as HTMLElement);
    expect(recommendScope.getByRole("button", { name: "Set Custom Position" })).toBeInTheDocument();
    expect(recommendScope.getByRole("button", { name: "Apply Recommended Position" })).toBeInTheDocument();

    const acceptButton = scope.getByRole("button", { name: "Accept Supplier Position" });
    expect(acceptButton).toBeInTheDocument();
    expect(recommendCard).not.toContainElement(acceptButton);
  });

  it("shows the clause id inline with the clause title in v7 cards", () => {
    renderContractResults(outcomeReviewDraftRoute);

    const clauseRow = screen.getByText("Exclusivity").closest('[id^="clause-row-"]');
    expect(clauseRow).toBeTruthy();
    expect(within(clauseRow as HTMLElement).getByText("c19")).toBeInTheDocument();
  });

  it("switches comparison cards into handled states after continuing with actionability or accepting supplier position", () => {
    renderContractResults(outcomeReviewRoute);

    const holdRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');
    expect(holdRow).toBeTruthy();

    fireEvent.click(within(holdRow as HTMLElement).getByRole("button", { name: "Apply Recommended Position" }));

    const updatedHoldRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');
    expect(updatedHoldRow).toBeTruthy();

    const holdScope = within(updatedHoldRow as HTMLElement);
    expect(holdScope.getByText("Request:")).toBeInTheDocument();
    expect(
      holdScope.getByText("Require full GDPR Art. 28 schedule and 24-hour breach notification SLA."),
    ).toBeInTheDocument();
    expect(holdScope.queryByText("Recommend Position")).not.toBeInTheDocument();
    expect(holdScope.queryByText("Previous Analysis · v2")).not.toBeInTheDocument();
    expect(holdScope.queryByText("Current Analysis · v3")).not.toBeInTheDocument();
    expect(holdScope.getByRole("button", { name: "Edit Position" })).toBeInTheDocument();
    const handledActionRow = holdScope.getByRole("button", { name: "Edit Position" }).parentElement;
    expect(handledActionRow).toBeTruthy();
    const handledButtonOrder = Array.from((handledActionRow as HTMLElement).querySelectorAll("button")).map((button) =>
      button.textContent?.trim(),
    );
    expect(handledButtonOrder).toEqual(["View Detail", "Edit Position", "Remove"]);
    fireEvent.click(holdScope.getByRole("button", { name: "View Detail" }));
    expect(holdScope.getByText("Recommend Position")).toBeInTheDocument();
    expect(holdScope.getByText("Previous Analysis · v2")).toBeInTheDocument();
    expect(holdScope.getByText("Current Analysis · v3")).toBeInTheDocument();
    expect(holdScope.queryByRole("button", { name: "Apply Recommended Position" })).not.toBeInTheDocument();
    expect(holdScope.queryByRole("button", { name: "Accept Supplier Position" })).not.toBeInTheDocument();

    const acceptRow = screen.getByText("Payment Terms").closest('[id^="clause-row-"]');
    expect(acceptRow).toBeTruthy();

    fireEvent.click(within(acceptRow as HTMLElement).getByRole("button", { name: "Accept Supplier Position" }));

    const updatedAcceptRow = screen.getByText("Payment Terms").closest('[id^="clause-row-"]');
    expect(updatedAcceptRow).toBeTruthy();

    const acceptScope = within(updatedAcceptRow as HTMLElement);
    expect(acceptScope.getByText("Accepted:")).toBeInTheDocument();
    expect(acceptScope.getByText("Supplier position accepted for this round.")).toBeInTheDocument();
    expect(acceptScope.queryByText("Recommend Position")).not.toBeInTheDocument();
    expect(acceptScope.queryByText("Previous Analysis · v2")).not.toBeInTheDocument();
    expect(acceptScope.queryByText("Current Analysis · v3")).not.toBeInTheDocument();
    expect(acceptScope.getByRole("button", { name: "Change Decision" })).toBeInTheDocument();
    fireEvent.click(acceptScope.getByRole("button", { name: "View Detail" }));
    expect(acceptScope.getByText("Recommend Position")).toBeInTheDocument();
    expect(acceptScope.getByText("Previous Analysis · v2")).toBeInTheDocument();
    expect(acceptScope.getByText("Current Analysis · v3")).toBeInTheDocument();
    expect(acceptScope.queryByRole("button", { name: "Apply Recommended Position" })).not.toBeInTheDocument();
    expect(acceptScope.queryByRole("button", { name: "Accept Supplier Position" })).not.toBeInTheDocument();
  });

  it("opens the bulk recommendation banner with all eligible clauses selected by default", () => {
    renderContractResults();

    expect(screen.getByText("Bulk Action")).toBeInTheDocument();
    expect(screen.queryByText(/Bulk Action \(\d+\)/i)).not.toBeInTheDocument();

    openRecommendationMenu();

    expect(screen.queryByRole("menu", { name: /bulk action options/i })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /bulk recommendation filters/i })).toBeInTheDocument();
    expect(selectedBannerCount()).toBeGreaterThan(0);
    expect(screen.queryByText(/^0 selected$/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Accept recommended positions/i })).toBeEnabled();

    openBulkDropdown();
    expect(screen.getByRole("button", { name: "Deviation" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("checkbox", { name: "All eligible clauses" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "High" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Medium" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Low" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "None" })).toBeInTheDocument();

    selectBulkAxis("Status");
    expect(screen.getByRole("checkbox", { name: "Not Met" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Met" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Missing" })).toBeInTheDocument();

    selectBulkAxis("Type");
    expect(screen.getByRole("checkbox", { name: "Commercial Mechanics" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Miscellaneous" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Warranties and Liability" })).toBeInTheDocument();
  });

  it("switches axis with a clear-selection confirm and reapplies scoped values cleanly", async () => {
    renderContractResults(outcomeReviewDraftRoute);

    openRecommendationMenu();

    openBulkDropdown();
    fireEvent.click(screen.getByRole("checkbox", { name: "All eligible clauses" }));
    selectBulkAxis("Deviation");
    toggleBulkCheckbox(/High/i);
    toggleBulkCheckbox(/Medium/i);
    const deviationCount = selectedBannerCount();
    expect(deviationCount).toBeGreaterThan(0);
    expect(getBulkDropdownTrigger()).toHaveTextContent(/Deviation:\s*High,\s*Medium/i);

    selectBulkAxis("Type");
    expect(screen.getByText(/Switch to Type\? This clears your 2 deviation levels\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch" }));

    const categoryCheckboxes = within(screen.getByRole("dialog", { name: /apply recommendation scope/i }))
      .getAllByRole("checkbox")
      .filter((checkbox) => {
        const label = checkbox.getAttribute("aria-label") ?? "";
        return !["All eligible clauses"].includes(label);
      });
    fireEvent.click(categoryCheckboxes[0]);
    const scopedCount = selectedBannerCount();
    expect(scopedCount).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Accept recommended positions/i }));
    fireEvent.click(screen.getByRole("button", { name: /Accept \d+/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /review & generate/i })).toBeEnabled();
      expect(reviewGenerateCount()).toBeGreaterThan(0);
    });
    expect(screen.queryByRole("region", { name: /bulk recommendation filters/i })).not.toBeInTheDocument();
  });

  it("keeps status scope limited to Met, Not Met, and Missing while only counting eligible clauses", () => {
    renderContractResults(outcomeReviewRoute);

    openRecommendationMenu();
    openBulkDropdown();
    fireEvent.click(screen.getByRole("checkbox", { name: "All eligible clauses" }));
    selectBulkAxis("Status");

    const notMetCheckbox = screen.getByRole("checkbox", { name: "Not Met" });
    const metCheckbox = screen.getByRole("checkbox", { name: "Met" });
    const missingCheckbox = screen.getByRole("checkbox", { name: "Missing" });

    expect(notMetCheckbox).toBeEnabled();
    expect(metCheckbox).toBeDisabled();
    expect(missingCheckbox).toBeDisabled();

    fireEvent.click(notMetCheckbox);
    expect(selectedBannerCount()).toBeGreaterThan(0);
  });

  it("resets draft banner selections back to all eligible when closing the bulk recommendation banner", () => {
    renderContractResults(outcomeReviewDraftRoute);

    openRecommendationMenu();
    openBulkDropdown();
    fireEvent.click(screen.getByRole("checkbox", { name: "All eligible clauses" }));
    selectBulkAxis("Deviation");
    toggleBulkCheckbox(/High/i);
    expect(getBulkDropdownTrigger()).toHaveTextContent(/Deviation:/i);

    fireEvent.click(screen.getByRole("button", { name: /Close bulk recommendation banner/i }));
    expect(screen.queryByRole("region", { name: /bulk recommendation filters/i })).not.toBeInTheDocument();

    openRecommendationMenu();
    expect(selectedBannerCount()).toBeGreaterThan(0);
    expect(getBulkDropdownTrigger()).toHaveTextContent("All eligible clauses");
    expect(screen.getByRole("button", { name: /Accept recommended positions/i })).toBeEnabled();
  });

  it("shows the selected state on active outcome filter toggle cards", () => {
    renderContractResults(outcomeReviewRoute);

    const mediumDeviationFilter = screen.getByRole("button", {
      name: /Add Medium Deviation outcome filter, 19 clauses/i,
    });

    fireEvent.click(mediumDeviationFilter);

    expect(mediumDeviationFilter).toHaveAttribute("aria-pressed", "true");
    expect(mediumDeviationFilter.className).not.toContain("clauseiq-v7-togglecard-subtle");
    expect(mediumDeviationFilter).toHaveAccessibleName("Remove Medium Deviation outcome filter, 19 clauses");
  });

  it("filters low deviation cards by displayed deviation metadata rather than base severity", () => {
    renderContractResults(outcomeReviewRoute);

    const lowDeviationFilter = screen.getByRole("button", {
      name: /Add Low outcome filter, 18 clauses/i,
    });

    fireEvent.click(lowDeviationFilter);

    expect(screen.queryByText("Audit")).not.toBeInTheDocument();
    expect(screen.getByText("Business Continuity and Disaster Recovery")).toBeInTheDocument();
  });

  it("renders first-analysis clause cards with only the current analysis in the simplified hierarchy", () => {
    const { container } = renderContractResults(`${firstAnalysisRoute}&cat=supplier-obligations`);
    const orbitClauseCards = container.querySelectorAll('[style*="--orbit-color-card-bg"][style*="min-height: 104px"]');
    const clauseRow = container.querySelector('[id^="clause-row-"]');

    expect(orbitClauseCards.length).toBeGreaterThan(0);
    expect(clauseRow).toBeTruthy();
    expect(within(clauseRow as HTMLElement).getByText("Current Summary")).toBeInTheDocument();
    expect(within(clauseRow as HTMLElement).queryByText(/Previous Analysis/i)).not.toBeInTheDocument();
    expect(within(clauseRow as HTMLElement).queryByText("Recommend Position")).not.toBeInTheDocument();
    expect(within(clauseRow as HTMLElement).queryByText(/Recommended action/i)).not.toBeInTheDocument();
  });

  it("uses the default Orbit card state for all first-analysis clause cards", () => {
    const { container } = renderContractResults(`${firstAnalysisRoute}&cat=term-and-termination`);
    const cards = Array.from(container.querySelectorAll('[id^="clause-row-"] > div')) as HTMLElement[];

    expect(cards.length).toBeGreaterThan(1);
    cards.forEach((card) => {
      expect(card.style.getPropertyValue("--_bg")).toBe("var(--orbit-color-card-bg-default)");
    });
  });

  it("applies scoped recommendations and undoes only that applied scope", async () => {
    renderContractResults();

    applyRecommendationOptions("Deviation", /High/i);

    expect(await screen.findByRole("button", { name: /undo high deviation recommendations/i })).toBeInTheDocument();
    expect(localStorage.getItem("ciq-v7-clause-decisions")).toBeNull();
    expect(localStorage.getItem("ciq-v6-clause-decisions")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /undo high deviation recommendations/i }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /undo high deviation recommendations/i })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /bulk action/i })).toBeInTheDocument();
  });

  it("regenerates a stale CSV with current request items after review changes", async () => {
    renderContractResults();

    applyRecommendationOptions("Deviation", /High/i);
    generateCsv();

    expect(mocks.downloadCsv).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("ciq-v7-generated-csv:sup-1:ct-1:first-analysis-demo:v1")).toBeTruthy();

    applyRecommendationOptions("Deviation", /Medium/i);

    fireEvent.click(screen.getByRole("button", { name: /review & generate/i }));

    expect(
      screen.getByText(/Changes have been made since the last generated CSV/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /submit & generate/i }));

    expect(mocks.downloadCsv).toHaveBeenCalledTimes(2);
    expect(mocks.downloadCsv.mock.calls[1][1]).toContain("Requested change");
  });

  it("adds actionability requests and accepted supplier positions into Review & Generate for comparison reviews", async () => {
    renderContractResults(outcomeReviewRoute);

    const baselineCount = reviewGenerateCount();

    const holdRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');
    expect(holdRow).toBeTruthy();
    fireEvent.click(within(holdRow as HTMLElement).getByRole("button", { name: "Apply Recommended Position" }));

    expect(reviewGenerateCount()).toBe(baselineCount + 1);

    generateCsv();

    expect(mocks.downloadCsv).toHaveBeenCalledTimes(1);
    expect(mocks.downloadCsv.mock.calls[0][1]).toContain("Data Processing");
    expect(mocks.downloadCsv.mock.calls[0][1]).toContain("Request update");
    expect(mocks.downloadCsv.mock.calls[0][1]).toContain(
      "Require full GDPR Art. 28 schedule and 24-hour breach notification SLA.",
    );
    expect(localStorage.getItem("ciq-v7-generated-csv:sup-1:ct-1:v3")).toBeTruthy();

    const acceptRow = screen.getByText("Payment Terms").closest('[id^="clause-row-"]');
    expect(acceptRow).toBeTruthy();
    fireEvent.click(within(acceptRow as HTMLElement).getByRole("button", { name: "Accept Supplier Position" }));

    fireEvent.click(screen.getByRole("button", { name: /review & generate/i }));

    expect(
      screen.getByText(/Changes have been made since the last generated CSV/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /submit & generate/i }));

    expect(mocks.downloadCsv).toHaveBeenCalledTimes(2);
    expect(mocks.downloadCsv.mock.calls[1][1]).toContain("Payment Terms");
    expect(mocks.downloadCsv.mock.calls[1][1]).toContain("Accept supplier wording");
  });
});
