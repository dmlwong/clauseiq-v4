import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/clauseiq-v5/orbit-ui/tooltip";
import { ContractResults } from "./ContractResults";

const mocks = vi.hoisted(() => ({
  downloadCsv: vi.fn(),
}));

vi.mock("@/lib/csv-export", () => ({
  downloadCsv: mocks.downloadCsv,
}));

const firstAnalysisRoute =
  "/initiatives-v5?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";

function renderContractResults(route = firstAnalysisRoute) {
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

describe("ContractResults V5 review controls", () => {
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

  it("applies scoped recommendations and undoes only that applied scope", async () => {
    renderContractResults();

    applyRecommendationOptions(/High/i);

    expect(await screen.findByRole("button", { name: /undo high deviation recommendations/i })).toBeInTheDocument();
    expect(localStorage.getItem("ciq-v5-clause-decisions")).toContain("request-update");
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
    expect(localStorage.getItem("ciq-v5-generated-csv:sup-1:ct-1:first-analysis-demo:v1")).toBeTruthy();

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
