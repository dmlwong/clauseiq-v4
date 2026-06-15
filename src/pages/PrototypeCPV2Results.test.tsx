import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PrototypeCPV2Results from "./PrototypeCPV2Results";
import { PROTOTYPE_CP_V2_RESULT_ROUTE } from "@/lib/prototype-cp-v2-routes";

const mocks = vi.hoisted(() => ({
  downloadCsv: vi.fn(),
}));

vi.mock("@/lib/csv-export", () => ({
  downloadCsv: mocks.downloadCsv,
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  );
}

function renderCpResults(route = PROTOTYPE_CP_V2_RESULT_ROUTE) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/prototype-cp-v2/results"
          element={
            <>
              <PrototypeCPV2Results />
              <LocationProbe />
            </>
          }
        />
        <Route path="/prototype-cp/results" element={<LocationProbe />} />
        <Route path="/prototype-cp-v2" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function openRecommendationMenu() {
  fireEvent.click(
    screen.getByRole("button", { name: /bulk apply recommendation/i }),
  );
}

function applyRecommendationOptions(...names: RegExp[]) {
  openRecommendationMenu();
  names.forEach((name) => {
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name }));
  });
  fireEvent.click(screen.getByRole("button", { name: /apply selected/i }));
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

describe("Prototype CP v2 result dashboard", () => {
  it("renders the v5 dashboard interaction model in the CP v2 route", () => {
    renderCpResults();

    expect(
      screen.getByLabelText("Connected Platform navigation"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "ClauseIQ Results" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Guidance" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cloud disabled" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to Workspace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tablist", { name: "Analysis mode" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "History" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /bulk apply recommendation/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Bulk Apply Recommendation \(\d+\)/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /review & generate/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /High Deviation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
      "Validate ClauseIQ recommendations before supplier negotiation",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Finding").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Recommended action").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Use Recommendation/i }).length,
    ).toBeGreaterThan(0);
    openRecommendationMenu();
    expect(
      screen.getByRole("menuitemcheckbox", { name: /High Deviation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: /Medium Deviation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: /Low Deviation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: /Missing Clauses/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: /None Deviation/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Liquidated Damages")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/prototype-cp-v2/results",
    );
    expect(screen.getByTestId("location")).not.toHaveTextContent(
      "/initiatives-v5",
    );
  });

  it("uses CP-specific storage for apply and undo recommendations", async () => {
    renderCpResults();

    applyRecommendationOptions(/High Deviation/i);

    expect(screen.getAllByText("Added to Review").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Edit Request/i }).length,
    ).toBeGreaterThan(0);

    expect(
      await screen.findByRole("button", { name: /undo high deviation recommendations/i }),
    ).toBeInTheDocument();
    expect(localStorage.getItem("prototype-cp-v2-clause-decisions")).toContain(
      "request-update",
    );
    expect(localStorage.getItem("prototype-cp-clause-decisions")).toBeNull();
    expect(localStorage.getItem("ciq-v5-clause-decisions")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /undo high deviation recommendations/i }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /undo high deviation recommendations/i }),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /bulk apply recommendation/i }),
    ).toBeInTheDocument();
  }, 10_000);

  it("keeps the CP review and generate flow independent from v5", () => {
    renderCpResults();

    applyRecommendationOptions(/High Deviation/i);
    fireEvent.click(screen.getByRole("button", { name: /review & generate/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit & generate/i }));

    expect(mocks.downloadCsv).toHaveBeenCalledTimes(1);
    expect(
      localStorage.getItem(
        "prototype-cp-v2-generated-csv:sup-1:ct-1:first-analysis-demo:v1",
      ),
    ).toBeTruthy();
    expect(
      localStorage.getItem(
        "prototype-cp-generated-csv:sup-1:ct-1:first-analysis-demo:v1",
      ),
    ).toBeNull();
    expect(
      localStorage.getItem(
        "ciq-v5-generated-csv:sup-1:ct-1:first-analysis-demo:v1",
      ),
    ).toBeNull();
  });

  it("does not show the prototype switcher in the v2 results header", () => {
    renderCpResults();

    expect(
      screen.queryByRole("button", { name: /Switch prototype/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Prototype CP - v2")).not.toBeInTheDocument();
  });

  it("supports the None Deviation first-analysis metric without review actions", () => {
    renderCpResults();

    openRecommendationMenu();
    expect(
      screen.getByRole("menuitemcheckbox", { name: /None Deviation/i }),
    ).toBeInTheDocument();
    fireEvent.pointerDown(document.body);

    fireEvent.click(screen.getByRole("button", { name: /None Deviation/i }));

    expect(screen.getByText("Milestone Payments")).toBeInTheDocument();
    expect(screen.queryByText("Term of Contract")).not.toBeInTheDocument();
    expect(screen.getAllByText("None Deviation").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Use Recommendation/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /No Action/i })).not.toBeInTheDocument();
  });

  it("returns to the isolated Prototype CP v2 route", () => {
    renderCpResults();

    fireEvent.click(screen.getByRole("button", { name: "Back to Workspace" }));

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/prototype-cp-v2?view=workspace",
    );
  });
});
