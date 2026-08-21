import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/clauseiq-v6/orbit-ui/tooltip";
import { ContractResults } from "./ContractResults";

const mocks = vi.hoisted(() => ({
  downloadCsv: vi.fn(),
}));

vi.mock("@/lib/csv-export", () => ({
  downloadCsv: mocks.downloadCsv,
}));

const firstAnalysisRoute =
  "/initiatives-v6?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";
const outcomeReviewRoute =
  "/initiatives-v6?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=negotiated-reanalysis&resultMode=outcome&analysisId=a-001&previousAnalysisId=a-002&outputSupplierId=sup-001&from=v2&to=v3";
const outcomeReviewDraftRoute =
  "/initiatives-v6?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=negotiated-reanalysis&resultMode=outcome&analysisId=a-004&previousAnalysisId=a-005&outputSupplierId=sup-002&from=v1&to=v2";

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

describe("ContractResults V6 review controls", () => {
  it("renders the negotiated re-analysis outcome review for later supplier outputs", () => {
    renderContractResults(outcomeReviewRoute);

    expect(screen.getByText("Supplier: Thomson Reuters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare from version v2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare to version v3" })).toBeInTheDocument();
    expect(screen.queryByText("MSA_ThomsonReuters_v1.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("MSA_ThomsonReuters_v2.pdf")).not.toBeInTheDocument();
  });

  it("keeps open review clauses free of draft and added-to-review header pills", () => {
    renderContractResults(outcomeReviewDraftRoute);

    expect(screen.getByText("Liability Cap of Supplier")).toBeInTheDocument();
    expect(screen.queryByText("Drafting request")).not.toBeInTheDocument();
    expect(screen.queryByText("Added to Review")).not.toBeInTheDocument();
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

  it("renders first-analysis clause cards through Orbit Card surfaces", () => {
    const { container } = renderContractResults(`${firstAnalysisRoute}&cat=supplier-obligations`);
    const orbitClauseCards = container.querySelectorAll('[style*="--orbit-color-card-bg"][style*="min-height: 104px"]');

    expect(orbitClauseCards.length).toBeGreaterThan(0);
  });

  it("applies scoped recommendations and undoes only that applied scope", async () => {
    renderContractResults();

    applyRecommendationOptions(/High/i);

    expect(await screen.findByRole("button", { name: /undo high deviation recommendations/i })).toBeInTheDocument();
    expect(localStorage.getItem("ciq-v6-clause-decisions")).toContain("request-update");
    expect(localStorage.getItem("ciq-v4-clause-decisions")).toBeNull();

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
    expect(localStorage.getItem("ciq-v6-generated-csv:sup-1:ct-1:first-analysis-demo:v1")).toBeTruthy();

    applyRecommendationOptions(/Medium/i);

    fireEvent.click(screen.getByRole("button", { name: /review & generate/i }));

    expect(
      screen.getByText(/Changes have been made since the last generated CSV/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /submit & generate/i }));

    expect(mocks.downloadCsv).toHaveBeenCalledTimes(2);
    expect(mocks.downloadCsv.mock.calls[1][1]).toContain("Requested change");
  });
});
