import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PrototypeCPResults from "./PrototypeCPResults";
import { PROTOTYPE_CP_RESULT_ROUTE } from "@/lib/prototype-cp-routes";

const mocks = vi.hoisted(() => ({
  downloadCsv: vi.fn(),
}));

vi.mock("@/lib/csv-export", () => ({
  downloadCsv: mocks.downloadCsv,
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderCpResults(route = PROTOTYPE_CP_RESULT_ROUTE) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/prototype-cp/results"
          element={(
            <>
              <PrototypeCPResults />
              <LocationProbe />
            </>
          )}
        />
        <Route path="/prototype-cp-v2/results" element={<LocationProbe />} />
        <Route path="/prototype-cp" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function openRecommendationMenu() {
  fireEvent.click(screen.getByRole("button", { name: /apply recommendations/i }));
}

function applyRecommendationOption(name: RegExp) {
  openRecommendationMenu();
  fireEvent.click(screen.getByRole("option", { name }));
}

function choosePrototype(targetLabel: string) {
  fireEvent.click(screen.getByRole("button", { name: /Switch prototype/i }));
  fireEvent.click(screen.getByRole("option", { name: targetLabel }));
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

describe("Prototype CP result dashboard", () => {
  it("renders the v5 dashboard interaction model in the CP route", () => {
    renderCpResults();

    expect(screen.getByLabelText("Connected Platform navigation")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ClauseIQ Results" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cloud disabled" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Analysis mode" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "History" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply recommendations/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review & generate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /High Deviation/i })).toBeInTheDocument();
    expect(screen.getByText("Validate ClauseIQ recommendations before supplier negotiation")).toBeInTheDocument();
    expect(screen.getByText("Liquidated Damages")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/prototype-cp/results");
    expect(screen.getByTestId("location")).not.toHaveTextContent("/initiatives-v5");
  });

  it("uses CP-specific storage for apply and undo recommendations", async () => {
    renderCpResults();

    applyRecommendationOption(/Apply High only/i);

    expect(await screen.findByRole("button", { name: /undo high recommendations/i })).toBeInTheDocument();
    expect(localStorage.getItem("prototype-cp-clause-decisions")).toContain("request-update");
    expect(localStorage.getItem("ciq-v5-clause-decisions")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /undo high recommendations/i }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /undo high recommendations/i })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /apply recommendations/i })).toBeInTheDocument();
  }, 10_000);

  it("keeps the CP review and generate flow independent from v5", () => {
    renderCpResults();

    applyRecommendationOption(/Apply High only/i);
    fireEvent.click(screen.getByRole("button", { name: /review & generate/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit & generate/i }));

    expect(mocks.downloadCsv).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("prototype-cp-generated-csv:sup-1:ct-1:first-analysis-demo:v1")).toBeTruthy();
    expect(localStorage.getItem("ciq-v5-generated-csv:sup-1:ct-1:first-analysis-demo:v1")).toBeNull();
  });

  it("switches to the equivalent Prototype CP v2 result route", () => {
    renderCpResults();

    choosePrototype("Prototype CP - v2");

    expect(screen.getByTestId("location")).toHaveTextContent("/prototype-cp-v2/results");
    expect(screen.getByTestId("location")).toHaveTextContent("source=prototype-cp-v2");
  });

  it("returns to the isolated Prototype CP route", () => {
    renderCpResults();

    fireEvent.click(screen.getByRole("button", { name: "Back to Workspace" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/prototype-cp");
  });
});
