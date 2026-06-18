import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeAll } from "vitest";
import ClauseIQV5OutputScoreExploration from "./ClauseIQV5OutputScoreExploration";
import ClauseIQV5 from "./ClauseIQV5";
import { TooltipProvider } from "@/components/clauseiq-v5/orbit-ui/tooltip";

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("ClauseIQ V5 output score exploration", () => {
  it("renders the dedicated route with all three score concepts", () => {
    render(
      <MemoryRouter initialEntries={["/clauseiq-v5/output-score-exploration"]}>
        <TooltipProvider>
          <Routes>
            <Route path="/clauseiq-v5/output-score-exploration" element={<ClauseIQV5OutputScoreExploration />} />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Supplier Output Score Exploration" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A. Score Pill" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "B. Score + Delta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "C. Score Summary Block" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Option B Refinements" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "B1. Plain-language delta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "B1b. Plain-language delta copy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "B2. Stronger hierarchy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "B2b. Stronger hierarchy copy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "B3. Supplier summary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Simplified History Options" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "D1. Compact rows" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "D2. Featured latest" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "D3. Supplier ledger" })).toBeInTheDocument();
    expect(screen.getAllByText("Thomson Reuters").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Score 56").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+8 vs previous/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Improved by 8/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Latest score").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "View Result" }).length).toBeGreaterThan(0);
  });

  it("keeps the live output-panel route free of score exploration UI", () => {
    render(
      <MemoryRouter initialEntries={["/clauseiq-v5/output-panel"]}>
        <TooltipProvider>
          <ClauseIQV5 forceResults resultsLayout="output-panel" />
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Supplier Outputs").length).toBeGreaterThan(0);
    expect(screen.queryByText("Supplier Output Score Exploration")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "B2b. Stronger hierarchy copy" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Overall score/i)).not.toBeInTheDocument();
  });
});
