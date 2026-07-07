import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi, beforeAll } from "vitest";

import ClauseIQV6A from "./ClauseIQV6A";
import { CIQ_DEFAULT_PLAYBOOK } from "@/lib/clauseiq-v6-data";
import { TooltipProvider } from "@/components/clauseiq-v6a/orbit-ui/tooltip";
import { SupplierOutputsPanel } from "@/components/clauseiq-v6a/supplier-results";
import { mockInitiative } from "@/data/mock-clauseiq-v6";

function renderClauseIQ(
  route = "/clauseiq-v6a",
  props: { forceResults?: boolean; resultsLayout?: "accordion" | "output-panel" } = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TooltipProvider>
        <ClauseIQV6A {...props} />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

function LocationEcho() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function startAndSelectInitiative() {
  fireEvent.click(screen.getByRole("button", { name: /get started/i }));
  fireEvent.click(screen.getByRole("button", { name: /search initiatives/i }));
  fireEvent.click(screen.getByRole("row", { name: /Fleet Telematics Refresh Logistics Sarah Chen/i }));
}

function selectDefaultPlaybook() {
  fireEvent.focus(screen.getByRole("combobox", { name: "Playbook" }));
  fireEvent.click(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK }));
}

function selectNoPlaybook() {
  fireEvent.click(screen.getByRole("radio", { name: "No" }));
}

function benchmarkFieldName(fieldName: "Category" | "Governing law") {
  return fieldName === "Category" ? /^Category(?: \(Optional\))?$/i : /^Governing Law(?: \(Optional\))?$/i;
}

function selectBenchmarkOption(fieldName: "Category" | "Governing law", value: string) {
  const input = screen.getByRole("combobox", { name: benchmarkFieldName(fieldName) });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole("option", { name: value }));
}

function confirmBenchmark() {
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ClauseIQ V6A flow", () => {
  it("starts at welcome and reveals initiative selection after Get Started", async () => {
    renderClauseIQ();

    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    expect(screen.queryByText("Supplier Outputs")).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: "Search supplier outputs" })).not.toBeInTheDocument();
    expect(screen.getAllByText("No Supplier Outputs Yet").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Upload a contract and run ClauseIQ. Completed analyses will appear here, grouped by supplier.")
        .length,
    ).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/output scope preview/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    expect(screen.getByRole("button", { name: /search initiatives/i })).toBeInTheDocument();
    expect(screen.queryByText("Supplier Outputs")).not.toBeInTheDocument();
    expect(screen.getAllByText("No Supplier Outputs Yet").length).toBeGreaterThan(0);
  });

  it("shows Contract Analysis Parameters after selecting an initiative before upload", async () => {
    renderClauseIQ();

    startAndSelectInitiative();

    expect(screen.getByRole("heading", { name: "Contract Analysis Parameters" })).toBeInTheDocument();
    expect(screen.getByText("Do you want to use a playbook for this analysis?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "No" })).not.toBeChecked();
    expect(screen.queryByRole("heading", { name: "Category" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Governing Law" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Playbook" })).toHaveAttribute(
      "placeholder",
      "Please select a playbook...",
    );
    expect(screen.queryByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).not.toBeInTheDocument();
    expect(screen.queryByText("Logistics · Sarah Chen")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("selects a playbook parameter and shows upload without category", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectDefaultPlaybook();

    expect(screen.getByText(`Playbook · ${CIQ_DEFAULT_PLAYBOOK}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change playbook/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Category" })).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox", { name: "Category options" })).not.toBeInTheDocument();
    expect(screen.queryByText("Logistics · Sarah Chen")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
  });

  it("shows a prefilled optional benchmark when the user selects no playbook", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectNoPlaybook();

    expect(screen.getByRole("radio", { name: "No" })).toBeChecked();
    expect(screen.queryByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).not.toBeInTheDocument();
    expect(
      screen.queryByText("ClauseIQ pre-filled a benchmark from this initiative. Confirm, search to change, or skip."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Select a category and governing law")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The fields below are optional, if no selections are made the contract will be analysed against a standard benchmark",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Category") })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Category") })).toHaveAttribute(
      "placeholder",
      "Please select a category...",
    );
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Governing law") })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Governing law") })).toHaveAttribute(
      "placeholder",
      "Please select a governing law...",
    );
    fireEvent.focus(screen.getByRole("combobox", { name: benchmarkFieldName("Category") }));
    const categoryListbox = screen.getByRole("listbox", { name: benchmarkFieldName("Category") });
    expect(within(categoryListbox).getByRole("option", { name: "Goods" })).toBeInTheDocument();
    expect(within(categoryListbox).getByRole("option", { name: "Services" })).toBeInTheDocument();
    expect(within(categoryListbox).getByRole("option", { name: "Professional Services" })).toBeInTheDocument();
    expect(within(categoryListbox).queryByText("GOODS & MATERIALS")).not.toBeInTheDocument();
    expect(within(categoryListbox).queryByText("TECHNOLOGY")).not.toBeInTheDocument();
    fireEvent.blur(screen.getByRole("combobox", { name: benchmarkFieldName("Category") }));
    expect(screen.queryByText("Suggested")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Benchmarked against ClauseIQ's general standard. Add a category or governing law for sharper, more relevant findings.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("1-of-3 precision")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^continue$/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("lets users search, override, and clear optional benchmark fields before confirming", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectNoPlaybook();

    selectBenchmarkOption("Category", "Services");

    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Category") })).toHaveValue("Services");
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Governing law") })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Governing law") })).toHaveAttribute(
      "placeholder",
      "Please select a governing law...",
    );
    expect(screen.queryByText("Suggested")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Benchmarked against Services standards with a general governing law baseline. Add a governing law for sharper findings.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("2-of-3 precision")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();

    confirmBenchmark();

    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
  });

  it("skips the suggested benchmark and proceeds with the general standard", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectNoPlaybook();
    confirmBenchmark();

    expect(screen.queryByRole("combobox", { name: benchmarkFieldName("Category") })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: benchmarkFieldName("Governing law") })).not.toBeInTheDocument();
    expect(screen.getByText("Using the general benchmark")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add a category or governing law/i })).toBeInTheDocument();
    expect(screen.queryByText("Suggested")).not.toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Benchmarked against ClauseIQ's general standard. Add a category or governing law for sharper, more relevant findings.",
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("1-of-3 precision")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add a category or governing law/i }));

    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Category") })).toHaveAttribute(
      "placeholder",
      "Please select a category...",
    );
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Governing law") })).toHaveAttribute(
      "placeholder",
      "Please select a governing law...",
    );
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("returns to parameter selection from Change Playbook", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectDefaultPlaybook();
    fireEvent.click(screen.getByRole("button", { name: /change playbook/i }));

    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("combobox", { name: "Playbook" })).toHaveAttribute(
      "placeholder",
      "Please select a playbook...",
    );
    expect(screen.queryByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).not.toBeInTheDocument();
    expect(screen.queryByText(`Playbook · ${CIQ_DEFAULT_PLAYBOOK}`)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("does not advance the no-playbook branch until users confirm or skip", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectNoPlaybook();
    selectBenchmarkOption("Category", "Professional Services");
    selectBenchmarkOption("Governing law", "Germany");

    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();

    confirmBenchmark();

    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
  });

  it("clears incompatible selections when switching between playbook choices", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectNoPlaybook();
    selectBenchmarkOption("Category", "Services");
    selectBenchmarkOption("Governing law", "Germany");
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));

    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("combobox", { name: "Playbook" })).toHaveAttribute(
      "placeholder",
      "Please select a playbook...",
    );
    expect(screen.queryByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: benchmarkFieldName("Category") })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: benchmarkFieldName("Governing law") })).not.toBeInTheDocument();
    expect(screen.queryByText(/Benchmarked against/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("keeps the user on upload when a non-PDF is selected", async () => {
    const { container } = renderClauseIQ();

    startAndSelectInitiative();
    selectDefaultPlaybook();

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    fireEvent.change(input!, {
      target: {
        files: [new File(["not a pdf"], "contract.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })],
      },
    });

    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Analysing Your Contract" })).not.toBeInTheDocument();
  });

  it("shows the supplier output panel processing state after a PDF upload", async () => {
    const { container } = renderClauseIQ();

    startAndSelectInitiative();
    selectDefaultPlaybook();

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    fireEvent.change(input!, {
      target: {
        files: [new File(["pdf"], "contract.pdf", { type: "application/pdf" })],
      },
    });

    expect(screen.getByRole("heading", { name: "Analysing Your Contract" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Next, you can..." })).not.toBeInTheDocument();
    expect(screen.getByText(`Playbook · ${CIQ_DEFAULT_PLAYBOOK}`).closest(".min-h-11")).toHaveClass("bg-muted/50");
    expect(screen.queryByText("Do you want to use a playbook for this analysis?")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Yes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "No" })).not.toBeInTheDocument();
    expect(screen.queryByText("Category · Services")).not.toBeInTheDocument();
    expect(screen.getAllByText("Analysis In Progress").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        "ClauseIQ is reviewing the uploaded contract. Supplier outputs will appear here once the analysis is complete.",
      ).length,
    ).toBeGreaterThan(0);
  });

  it("renders the output-panel route with the first-run output by default", () => {
    renderClauseIQ("/clauseiq-v6a/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    expect(screen.getAllByText("Supplier Outputs").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Thomson Reuters").length).toBeGreaterThan(0);
    expect(screen.queryByText("Kira Systems")).not.toBeInTheDocument();
    expect(screen.queryByText("API_Kira_v3.pdf")).not.toBeInTheDocument();
    expect(screen.getAllByText("Score 56").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("View Results").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Download").length).toBeGreaterThan(0);
    expect(screen.queryByText("No outputs yet")).not.toBeInTheDocument();

    expect(screen.getAllByText("first output").length).toBeGreaterThan(0);
    expect(screen.queryByText("0 vs previous")).not.toBeInTheDocument();
    expect(screen.queryByText("Summary shown below. View the result for full details.")).not.toBeInTheDocument();
    expect(screen.queryByText("Missing Clauses and deviation levels")).not.toBeInTheDocument();
    expect(screen.getAllByText("Clause Target Status").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Deviations Level").length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Not Met \d+$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Met \d+$/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^Missing \d+$/).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Deviation level definitions")).not.toBeInTheDocument();
  });

  it("renders historical score deltas when multiple supplier outputs are visible", () => {
    render(
      <TooltipProvider>
        <SupplierOutputsPanel initiative={mockInitiative} initialOutputScope="team" outputState="filled" />
      </TooltipProvider>,
    );

    screen.queryAllByLabelText("Expand Thomson Reuters outputs").forEach((button) => {
      fireEvent.click(button);
    });

    expect(screen.getAllByText("Score 48").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+12 vs previous").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("View Results").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Download").length).toBeGreaterThan(0);
  });

  it("shows Met and Not Met metadata once previous analysis exists", () => {
    renderClauseIQ("/clauseiq-v6a/output-panel?resultScenario=history", {
      forceResults: true,
      resultsLayout: "output-panel",
    });

    expect(screen.getAllByText(/^Not Met \d+$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Met \d+$/).length).toBeGreaterThan(0);
  });

  it("passes the clicked supplier output and immediate previous output to View Result", () => {
    const onViewResult = vi.fn();
    const { container } = render(
      <TooltipProvider>
        <SupplierOutputsPanel
          initiative={mockInitiative}
          initialOutputScope="team"
          outputState="filled"
          onViewResult={onViewResult}
        />
      </TooltipProvider>,
    );

    screen.queryAllByLabelText("Expand Thomson Reuters outputs").forEach((button) => {
      fireEvent.click(button);
    });

    const latestThomsonReutersButton = container.querySelector<HTMLButtonElement>(
      "#supplier-output-sup-001 button[aria-label='View Results']",
    );
    expect(latestThomsonReutersButton).toBeTruthy();

    fireEvent.click(latestThomsonReutersButton!);

    expect(onViewResult).toHaveBeenCalledWith(
      expect.objectContaining({
        supplier: expect.objectContaining({ id: "sup-001" }),
        analysis: expect.objectContaining({ id: "a-001", fileName: "MSA_ThomsonReuters_v2.pdf" }),
        previousAnalysis: expect.objectContaining({ id: "a-002", fileName: "MSA_ThomsonReuters_v1.pdf" }),
      }),
    );
  });

  it("opens the negotiated re-analysis outcome route for a later supplier output", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/clauseiq-v6a/output-panel?resultScenario=history"]}>
        <TooltipProvider>
          <Routes>
            <Route
              path="/clauseiq-v6a/output-panel"
              element={<ClauseIQV6A forceResults resultsLayout="output-panel" />}
            />
            <Route path="/initiatives-v6a" element={<LocationEcho />} />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Team" })[0]);
    screen.queryAllByLabelText("Expand Thomson Reuters outputs").forEach((button) => {
      fireEvent.click(button);
    });

    const latestThomsonReutersButton = container.querySelector<HTMLButtonElement>(
      "#supplier-output-sup-001 button[aria-label='View Results']",
    );
    expect(latestThomsonReutersButton).toBeTruthy();

    fireEvent.click(latestThomsonReutersButton!);

    const route = screen.getByTestId("location").textContent ?? "";
    expect(route).toContain("/initiatives-v6a?");
    expect(route).toContain("resultMode=outcome");
    expect(route).toContain("scenario=negotiated-reanalysis");
    expect(route).toContain("analysisId=a-001");
    expect(route).toContain("previousAnalysisId=a-002");
    expect(route).toContain("from=v2");
    expect(route).toContain("to=v3");
  });

  it("opens the dashboard from the completed output-panel analysis card", () => {
    render(
      <MemoryRouter initialEntries={["/clauseiq-v6a/output-panel"]}>
        <TooltipProvider>
          <Routes>
            <Route
              path="/clauseiq-v6a/output-panel"
              element={<ClauseIQV6A forceResults resultsLayout="output-panel" />}
            />
            <Route path="/initiatives-v6a" element={<LocationEcho />} />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "View Result" }));

    const route = screen.getByTestId("location").textContent ?? "";
    expect(route).toContain("/initiatives-v6a?");
    expect(route).toContain("resultMode=outcome");
    expect(route).toContain("analysisId=a-001");
    expect(route).toContain("previousAnalysisId=a-002");
  });

  it("shows next actions below the completed output-panel analysis", () => {
    renderClauseIQ("/clauseiq-v6a/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    const analysisHeading = screen.getByRole("heading", { name: "Here is your Analysis Result" });
    const nextActionsHeading = screen.getByRole("heading", { name: "Next, you can..." });

    expect(
      analysisHeading.compareDocumentPosition(nextActionsHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /analyse contract on another initiative/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Update Milestone" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /complete initiative/i })).toBeInTheDocument();
  });

  it("marks individual next-action milestones as complete", () => {
    renderClauseIQ("/clauseiq-v6a/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    const gate1Row = screen.getByText("Gate 1").closest("tr");
    expect(gate1Row).toBeTruthy();
    expect(gate1Row).toHaveTextContent("Pending");

    fireEvent.click(within(gate1Row!).getByRole("button", { name: "Mark Complete" }));

    expect(gate1Row).toHaveTextContent("Completed");
    expect(within(gate1Row!).queryByRole("button", { name: "Mark Complete" })).not.toBeInTheDocument();
    expect(within(gate1Row!).getByRole("button", { name: "Completed" })).toBeDisabled();
  });

  it("hides the complete initiative action after completion", () => {
    renderClauseIQ("/clauseiq-v6a/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    fireEvent.click(screen.getByRole("button", { name: /complete initiative/i }));

    expect(screen.queryByRole("button", { name: /complete initiative/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analyse contract on another initiative/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Update Milestone" })).toBeInTheDocument();
  });

  it("starts a fresh workflow from the next-action analyse-another-initiative action", () => {
    renderClauseIQ("/clauseiq-v6a?view=results");

    fireEvent.click(screen.getByRole("button", { name: /analyse contract on another initiative/i }));

    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Here is your Analysis Result" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Next, you can..." })).not.toBeInTheDocument();
  });

  it("lets users select parameters before upload when running another output-panel analysis", () => {
    renderClauseIQ("/clauseiq-v6a/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run Analysis Again" }));

    expect(screen.getByText("Do you want to use a playbook for this analysis?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "No" })).not.toBeChecked();
    expect(screen.queryByRole("heading", { name: "Category" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Governing Law" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Playbook" })).toHaveAttribute(
      "placeholder",
      "Please select a playbook...",
    );
    expect(screen.queryByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();

    selectDefaultPlaybook();

    const rerunParameterHeading = screen.getAllByRole("heading", { name: "Contract Analysis Parameters" }).at(-1);
    const uploadHeading = screen.getByRole("heading", { name: "Upload Contract" });

    expect(screen.getByRole("button", { name: /change playbook/i })).toBeInTheDocument();
    expect(rerunParameterHeading).toBeTruthy();
    expect(rerunParameterHeading!.compareDocumentPosition(uploadHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("lets rerun analyses skip optional benchmark fields before upload", () => {
    renderClauseIQ("/clauseiq-v6a/output-panel?rerun=upload", {
      forceResults: true,
      resultsLayout: "output-panel",
    });

    selectNoPlaybook();

    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Category") })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Category") })).toHaveAttribute(
      "placeholder",
      "Please select a category...",
    );
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Governing law") })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: benchmarkFieldName("Governing law") })).toHaveAttribute(
      "placeholder",
      "Please select a governing law...",
    );
    expect(screen.queryByText("Suggested")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();

    confirmBenchmark();

    expect(screen.queryByRole("combobox", { name: benchmarkFieldName("Category") })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: benchmarkFieldName("Governing law") })).not.toBeInTheDocument();
    expect(screen.getByText("Using the general benchmark")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add a category or governing law/i })).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Benchmarked against ClauseIQ's general standard. Add a category or governing law for sharper, more relevant findings.",
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
  });

  it("keeps previous output and the New Analysis divider after rerun completion", async () => {
    vi.useFakeTimers();
    const { container } = renderClauseIQ("/clauseiq-v6a/output-panel", {
      forceResults: true,
      resultsLayout: "output-panel",
    });

    fireEvent.click(screen.getByRole("button", { name: "Run Analysis Again" }));
    selectDefaultPlaybook();

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    fireEvent.change(input!, {
      target: {
        files: [new File(["pdf"], "New_ThomsonReuters_contract.pdf", { type: "application/pdf" })],
      },
    });

    expect(screen.getByText("New Analysis")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contract Analysis Parameters" })).toBeInTheDocument();
    expect(
      screen
        .getAllByText(`Playbook · ${CIQ_DEFAULT_PLAYBOOK}`)
        .find((element) => element.closest(".min-h-11"))
        ?.closest(".min-h-11"),
    ).toHaveClass("bg-muted/50");
    expect(screen.queryByText("Do you want to use a playbook for this analysis?")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Yes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "No" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Analysing New Contract" })).toBeInTheDocument();
    expect(screen.getAllByText("MSA_ThomsonReuters_v2.pdf").length).toBeGreaterThan(0);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText("New Analysis")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Analysing New Contract" })).not.toBeInTheDocument();
    expect(screen.getAllByText("MSA_ThomsonReuters_v2.pdf").length).toBeGreaterThan(0);
    expect(screen.getByText("New_ThomsonReuters_contract.pdf")).toBeInTheDocument();
    expect(screen.getAllByText("Here is your Analysis Result").length).toBeGreaterThanOrEqual(2);
  });

  it("uses the confirmed rerun benchmark on the completed output card", async () => {
    vi.useFakeTimers();
    const { container } = renderClauseIQ("/clauseiq-v6a/output-panel", {
      forceResults: true,
      resultsLayout: "output-panel",
    });

    fireEvent.click(screen.getByRole("button", { name: "Run Analysis Again" }));
    selectNoPlaybook();
    selectBenchmarkOption("Category", "Services");
    selectBenchmarkOption("Governing law", "Germany");
    confirmBenchmark();

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    fireEvent.change(input!, {
      target: {
        files: [new File(["pdf"], "Services_Germany_contract.pdf", { type: "application/pdf" })],
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    const analysisCards = container.querySelectorAll("article.clauseiq-responsive-analysis-card");
    const latestCardText = analysisCards[analysisCards.length - 1]?.textContent ?? "";

    expect(latestCardText).toContain("Services_Germany_contract.pdf");
    expect(latestCardText).toContain(
      "Benchmark · Benchmarked against Germany · Services standards. The more you specify, the sharper the findings.",
    );
    expect(latestCardText).toContain("Precision · 3-of-3");
    expect(latestCardText).toContain("Category · Services");
    expect(latestCardText).toContain("Governing Law · Germany");
    expect(latestCardText).not.toContain("United States · Professional Services");
  });

  it("renders direct results routes with the default playbook selected", () => {
    const { container } = renderClauseIQ("/clauseiq-v6a?view=results");

    expect(container.textContent).toContain(CIQ_DEFAULT_PLAYBOOK);
    expect(screen.getAllByText("Selected").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Contract Analysis Parameters" })).not.toBeInTheDocument();
    expect(screen.queryByText("All categories")).not.toBeInTheDocument();
    expect(screen.queryByText("United Kingdom")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Analysis Result/i).length).toBeGreaterThan(0);
  });
});
