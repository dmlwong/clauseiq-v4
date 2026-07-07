import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/clauseiq-v6a/orbit-ui/tooltip";
import { ContractResults } from "./ContractResults";

const mocks = vi.hoisted(() => ({
  downloadCsv: vi.fn(),
}));

vi.mock("@/lib/csv-export", () => ({
  downloadCsv: mocks.downloadCsv,
}));

const firstAnalysisRoute =
  "/initiatives-v6a?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";
const outcomeReviewRoute =
  "/initiatives-v6a?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=negotiated-reanalysis&resultMode=outcome&analysisId=a-001&previousAnalysisId=a-002&outputSupplierId=sup-001&from=v2&to=v3";
const outcomeReviewDraftRoute =
  "/initiatives-v6a?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=negotiated-reanalysis&resultMode=outcome&analysisId=a-004&previousAnalysisId=a-005&outputSupplierId=sup-002&from=v1&to=v2";

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
  fireEvent.click(screen.getByRole("button", { name: /bulk apply recommendation/i }));
}

function applyRecommendationOptions(...names: RegExp[]) {
  openRecommendationMenu();
  names.forEach((name) => {
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name }));
  });
  fireEvent.click(screen.getByRole("button", { name: /apply selected/i }));
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

describe("ContractResults V6A review controls", () => {
  it("renders the negotiated re-analysis outcome review for later supplier outputs", () => {
    renderContractResults(outcomeReviewRoute);

    expect(screen.getByText("Supplier: Thomson Reuters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare from version v2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare to version v3" })).toBeInTheDocument();
    expect(screen.queryByText("MSA_ThomsonReuters_v1.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("MSA_ThomsonReuters_v2.pdf")).not.toBeInTheDocument();
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

    const bulkApplyButton = screen.getByRole("button", { name: /bulk apply recommendation/i });
    expect(bulkApplyButton).toBeEnabled();

    openRecommendationMenu();
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: /High Deviation/i }));
    fireEvent.click(screen.getByRole("button", { name: /apply selected/i }));

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

  it("maps stakeholder demo examples into simplified Met and Not Met verdict states", () => {
    renderContractResults(outcomeReviewRoute);

    const regressedRow = screen.getByText("Service Levels").closest('[id^="clause-row-"]');
    const newMissingRow = screen.getByText("Data Breach Notification").closest('[id^="clause-row-"]');

    expect(regressedRow).toBeTruthy();
    expect(newMissingRow).toBeTruthy();

    expect(within(regressedRow as HTMLElement).getByText("Not met")).toBeInTheDocument();
    expect(within(regressedRow as HTMLElement).queryByText("Regressed")).not.toBeInTheDocument();
    expect(within(regressedRow as HTMLElement).getByText("None Deviation")).toBeInTheDocument();
    expect(within(newMissingRow as HTMLElement).getByText("Not met")).toBeInTheDocument();
    expect(within(newMissingRow as HTMLElement).queryByText("New supplier change")).not.toBeInTheDocument();
    expect(within(newMissingRow as HTMLElement).getByText("Missing Clause")).toBeInTheDocument();
    expect(screen.queryByText("New supplier changes")).not.toBeInTheDocument();
    expect(screen.queryByText("Needs decision")).not.toBeInTheDocument();
  });

  it("uses the simplified target, previous, and current hierarchy on negotiated outcome cards", () => {
    renderContractResults(outcomeReviewRoute);

    const clauseRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');
    expect(clauseRow).toBeTruthy();

    const scope = within(clauseRow as HTMLElement);

    expect(scope.getByText("Recommended Best Practice")).toBeInTheDocument();
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
    expect(rowText.indexOf("Current Analysis · v3")).toBeLessThan(rowText.indexOf("Recommended Best Practice"));
  });

  it("shows the clause best practice even when a comparison clause has no custom target yet", () => {
    renderContractResults(outcomeReviewRoute);

    const clauseRow = screen.getByText("Service Levels").closest('[id^="clause-row-"]');

    expect(clauseRow).toBeTruthy();

    const scope = within(clauseRow as HTMLElement);

    expect(scope.getByText("Recommended Best Practice")).toBeInTheDocument();
    expect(scope.getByText("Previous Analysis · v2")).toBeInTheDocument();
    expect(scope.getByText("Current Analysis · v3")).toBeInTheDocument();
  });

  it("keeps Write My Own Target left while ordering Continue with Actionability before Accept Supplier Position on the right", () => {
    renderContractResults(outcomeReviewRoute);

    const clauseRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');
    expect(clauseRow).toBeTruthy();

    const reviseButton = within(clauseRow as HTMLElement).getByRole("button", { name: "Write My Own Target" });
    const acceptButton = within(clauseRow as HTMLElement).getByRole("button", { name: "Accept Supplier Position" });
    const holdButton = within(clauseRow as HTMLElement).getByRole("button", { name: "Continue with Actionability" });

    const rightGroup = acceptButton.parentElement;

    expect(rightGroup).toBeTruthy();
    expect(rightGroup).toBe(holdButton.parentElement);
    expect(rightGroup).not.toBe(reviseButton.parentElement);
    expect(rightGroup?.className).toContain("ml-auto");

    const rightButtons = Array.from((rightGroup as HTMLElement).querySelectorAll("button")).map((button) =>
      button.textContent?.trim(),
    );
    expect(rightButtons.indexOf("Continue with Actionability")).toBeLessThan(rightButtons.indexOf("Accept Supplier Position"));
  });

  it("shows the clause id inline with the clause title in v6a cards", () => {
    renderContractResults(outcomeReviewDraftRoute);

    const clauseRow = screen.getByText("Exclusivity").closest('[id^="clause-row-"]');
    expect(clauseRow).toBeTruthy();
    expect(within(clauseRow as HTMLElement).getByText("c19")).toBeInTheDocument();
  });

  it("switches comparison cards into handled states after continuing with actionability or accepting supplier position", () => {
    renderContractResults(outcomeReviewRoute);

    const holdRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');
    expect(holdRow).toBeTruthy();

    fireEvent.click(within(holdRow as HTMLElement).getByRole("button", { name: "Continue with Actionability" }));

    const updatedHoldRow = screen.getByText("Data Processing").closest('[id^="clause-row-"]');
    expect(updatedHoldRow).toBeTruthy();

    const holdScope = within(updatedHoldRow as HTMLElement);
    expect(holdScope.getByText("Request:")).toBeInTheDocument();
    expect(
      holdScope.getByText("Require full GDPR Art. 28 schedule and 24-hour breach notification SLA."),
    ).toBeInTheDocument();
    expect(holdScope.queryByText("Recommended Best Practice")).not.toBeInTheDocument();
    expect(holdScope.queryByText("Previous Analysis · v2")).not.toBeInTheDocument();
    expect(holdScope.queryByText("Current Analysis · v3")).not.toBeInTheDocument();
    expect(holdScope.getByRole("button", { name: "Edit Request" })).toBeInTheDocument();
    const handledActionRow = holdScope.getByRole("button", { name: "Edit Request" }).parentElement;
    expect(handledActionRow).toBeTruthy();
    const handledButtonOrder = Array.from((handledActionRow as HTMLElement).querySelectorAll("button")).map((button) =>
      button.textContent?.trim(),
    );
    expect(handledButtonOrder).toEqual(["View Detail", "Edit Request", "Remove"]);
    fireEvent.click(holdScope.getByRole("button", { name: "View Detail" }));
    expect(holdScope.getByText("Recommended Best Practice")).toBeInTheDocument();
    expect(holdScope.getByText("Previous Analysis · v2")).toBeInTheDocument();
    expect(holdScope.getByText("Current Analysis · v3")).toBeInTheDocument();
    expect(holdScope.queryByRole("button", { name: "Continue with Actionability" })).not.toBeInTheDocument();
    expect(holdScope.queryByRole("button", { name: "Accept Supplier Position" })).not.toBeInTheDocument();

    const acceptRow = screen.getByText("Payment Terms").closest('[id^="clause-row-"]');
    expect(acceptRow).toBeTruthy();

    fireEvent.click(within(acceptRow as HTMLElement).getByRole("button", { name: "Accept Supplier Position" }));

    const updatedAcceptRow = screen.getByText("Payment Terms").closest('[id^="clause-row-"]');
    expect(updatedAcceptRow).toBeTruthy();

    const acceptScope = within(updatedAcceptRow as HTMLElement);
    expect(acceptScope.getByText("Accepted:")).toBeInTheDocument();
    expect(acceptScope.getByText("Supplier position accepted for this round.")).toBeInTheDocument();
    expect(acceptScope.queryByText("Recommended Best Practice")).not.toBeInTheDocument();
    expect(acceptScope.queryByText("Previous Analysis · v2")).not.toBeInTheDocument();
    expect(acceptScope.queryByText("Current Analysis · v3")).not.toBeInTheDocument();
    expect(acceptScope.getByRole("button", { name: "Change Decision" })).toBeInTheDocument();
    fireEvent.click(acceptScope.getByRole("button", { name: "View Detail" }));
    expect(acceptScope.getByText("Recommended Best Practice")).toBeInTheDocument();
    expect(acceptScope.getByText("Previous Analysis · v2")).toBeInTheDocument();
    expect(acceptScope.getByText("Current Analysis · v3")).toBeInTheDocument();
    expect(acceptScope.queryByRole("button", { name: "Continue with Actionability" })).not.toBeInTheDocument();
    expect(acceptScope.queryByRole("button", { name: "Accept Supplier Position" })).not.toBeInTheDocument();
  });

  it("shows full deviation labels in the bulk recommendation menu without a trigger count", () => {
    renderContractResults();

    expect(screen.getByText("Bulk Apply Recommendation")).toBeInTheDocument();
    expect(screen.queryByText(/Bulk Apply Recommendation \(\d+\)/i)).not.toBeInTheDocument();

    openRecommendationMenu();

    expect(screen.getByRole("menuitemcheckbox", { name: /High Deviation/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: /Medium Deviation/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: /Low Deviation/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: /Missing Clauses/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: /None Deviation/i })).toBeInTheDocument();
  });

  it("shows verdict and clause type groups in the outcome bulk recommendation menu", () => {
    renderContractResults(outcomeReviewDraftRoute);

    openRecommendationMenu();

    expect(screen.getByRole("menuitemcheckbox", { name: /Verdict: Not met/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: /Clause Type: Commercial Terms/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: /Clause Type: Restrictions/i })).toBeInTheDocument();
  });

  it("renders first-analysis clause cards with only the current analysis in the simplified hierarchy", () => {
    const { container } = renderContractResults(`${firstAnalysisRoute}&cat=supplier-obligations`);
    const orbitClauseCards = container.querySelectorAll('[style*="--orbit-color-card-bg"][style*="min-height: 104px"]');
    const clauseRow = container.querySelector('[id^="clause-row-"]');

    expect(orbitClauseCards.length).toBeGreaterThan(0);
    expect(clauseRow).toBeTruthy();
    expect(within(clauseRow as HTMLElement).getByText("Current Analysis")).toBeInTheDocument();
    expect(within(clauseRow as HTMLElement).queryByText(/Previous Analysis/i)).not.toBeInTheDocument();
    expect(within(clauseRow as HTMLElement).queryByText("Recommended Best Practice")).not.toBeInTheDocument();
    expect(within(clauseRow as HTMLElement).queryByText(/Recommended action/i)).not.toBeInTheDocument();
  });

  it("applies scoped recommendations and undoes only that applied scope", async () => {
    renderContractResults();

    applyRecommendationOptions(/High/i);

    expect(await screen.findByRole("button", { name: /undo high deviation recommendations/i })).toBeInTheDocument();
    expect(localStorage.getItem("ciq-v6a-clause-decisions")).toBeNull();
    expect(localStorage.getItem("ciq-v6-clause-decisions")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /undo high deviation recommendations/i }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /undo high deviation recommendations/i })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /bulk apply recommendation/i })).toBeInTheDocument();
  });

  it("regenerates a stale CSV with current request items after review changes", async () => {
    renderContractResults();

    applyRecommendationOptions(/High/i);
    generateCsv();

    expect(mocks.downloadCsv).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("ciq-v6a-generated-csv:sup-1:ct-1:first-analysis-demo:v1")).toBeTruthy();

    applyRecommendationOptions(/Medium/i);

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
    fireEvent.click(within(holdRow as HTMLElement).getByRole("button", { name: "Continue with Actionability" }));

    expect(reviewGenerateCount()).toBe(baselineCount + 1);

    generateCsv();

    expect(mocks.downloadCsv).toHaveBeenCalledTimes(1);
    expect(mocks.downloadCsv.mock.calls[0][1]).toContain("Data Processing");
    expect(mocks.downloadCsv.mock.calls[0][1]).toContain("Request update");
    expect(mocks.downloadCsv.mock.calls[0][1]).toContain(
      "Require full GDPR Art. 28 schedule and 24-hour breach notification SLA.",
    );
    expect(localStorage.getItem("ciq-v6a-generated-csv:sup-1:ct-1:v3")).toBeTruthy();

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
