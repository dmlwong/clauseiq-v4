import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi, beforeAll } from "vitest";

import ClauseIQV5 from "./ClauseIQV5";
import { CIQ_DEFAULT_PLAYBOOK } from "@/lib/clauseiq-v4-data";
import { TooltipProvider } from "@/components/clauseiq-v5/orbit-ui/tooltip";

function renderClauseIQ(
  route = "/clauseiq-v5",
  props: { forceResults?: boolean; resultsLayout?: "accordion" | "output-panel" } = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TooltipProvider>
        <ClauseIQV5 {...props} />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

function startAndSelectInitiative() {
  fireEvent.click(screen.getByRole("button", { name: /get started/i }));
  fireEvent.click(screen.getByRole("button", { name: /search initiatives/i }));
  fireEvent.click(screen.getByRole("button", { name: "Select Fleet Telematics Refresh" }));
}

function selectDefaultPlaybook() {
  fireEvent.click(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK }));
}

function selectServicesCategory() {
  fireEvent.click(screen.getByRole("option", { name: "Services" }));
}

function selectNoPlaybook() {
  fireEvent.click(screen.getByRole("radio", { name: "No" }));
}

function selectUnitedKingdomLaw() {
  selectNoPlaybook();
  fireEvent.click(screen.getByRole("option", { name: "United Kingdom" }));
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ClauseIQ V5 flow", () => {
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
    expect(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).toBeInTheDocument();
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

  it("shows category and governing law when the user selects no playbook", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectNoPlaybook();

    expect(screen.getByRole("radio", { name: "No" })).toBeChecked();
    expect(screen.queryByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Category" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Governing Law" })).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: "Category options" })).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: "Governing Law options" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("allows governing law as the analysis parameter before the required category", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectUnitedKingdomLaw();

    expect(screen.getByText("Governing Law · United Kingdom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change governing law/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Category" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();

    selectServicesCategory();

    expect(screen.getByText("Category · Services")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
  });

  it("returns to parameter selection from Change Playbook", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectDefaultPlaybook();
    fireEvent.click(screen.getByRole("button", { name: /change playbook/i }));

    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).toBeInTheDocument();
    expect(screen.queryByText(`Playbook · ${CIQ_DEFAULT_PLAYBOOK}`)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("returns to parameter selection from Change Category", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectUnitedKingdomLaw();
    selectServicesCategory();
    fireEvent.click(screen.getByRole("button", { name: /change category/i }));

    expect(screen.getByText("Governing Law · United Kingdom")).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: "Category options" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Services" })).toBeInTheDocument();
    expect(screen.queryByText("Category · Services")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("clears incompatible selections when switching between playbook choices", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    selectUnitedKingdomLaw();
    selectServicesCategory();
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));

    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).toBeInTheDocument();
    expect(screen.queryByText("Governing Law · United Kingdom")).not.toBeInTheDocument();
    expect(screen.queryByText("Category · Services")).not.toBeInTheDocument();
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
    expect(screen.queryByText("Category · Services")).not.toBeInTheDocument();
    expect(screen.getAllByText("Analysis In Progress").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        "ClauseIQ is reviewing the uploaded contract. Supplier outputs will appear here once the analysis is complete.",
      ).length,
    ).toBeGreaterThan(0);
  });

  it("renders the output-panel route with the first-run output by default", () => {
    renderClauseIQ("/clauseiq-v5/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    expect(screen.getAllByText("Supplier Outputs").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Thomson Reuters").length).toBeGreaterThan(0);
    expect(screen.queryByText("Kira Systems")).not.toBeInTheDocument();
    expect(screen.queryByText("API_Kira_v3.pdf")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("View Results").length).toBeGreaterThan(0);
    expect(screen.queryByText("No outputs yet")).not.toBeInTheDocument();
  });

  it("shows next actions below the completed output-panel analysis", () => {
    renderClauseIQ("/clauseiq-v5/output-panel", { forceResults: true, resultsLayout: "output-panel" });

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
    renderClauseIQ("/clauseiq-v5/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    const gate1Row = screen.getByText("Gate 1").closest("tr");
    expect(gate1Row).toBeTruthy();
    expect(gate1Row).toHaveTextContent("Pending");

    fireEvent.click(within(gate1Row!).getByRole("button", { name: "Mark Complete" }));

    expect(gate1Row).toHaveTextContent("Completed");
    expect(within(gate1Row!).queryByRole("button", { name: "Mark Complete" })).not.toBeInTheDocument();
    expect(within(gate1Row!).getByRole("button", { name: "Completed" })).toBeDisabled();
  });

  it("hides the complete initiative action after completion", () => {
    renderClauseIQ("/clauseiq-v5/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    fireEvent.click(screen.getByRole("button", { name: /complete initiative/i }));

    expect(screen.queryByRole("button", { name: /complete initiative/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analyse contract on another initiative/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Update Milestone" })).toBeInTheDocument();
  });

  it("starts a fresh workflow from the next-action analyse-another-initiative action", () => {
    renderClauseIQ("/clauseiq-v5?view=results");

    fireEvent.click(screen.getByRole("button", { name: /analyse contract on another initiative/i }));

    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Here is your Analysis Result" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Next, you can..." })).not.toBeInTheDocument();
  });

  it("lets users select parameters before upload when running another output-panel analysis", () => {
    renderClauseIQ("/clauseiq-v5/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run Analysis Again" }));

    expect(screen.getByText("Do you want to use a playbook for this analysis?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "No" })).not.toBeChecked();
    expect(screen.queryByRole("heading", { name: "Category" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Governing Law" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();

    selectDefaultPlaybook();

    const rerunParameterHeading = screen.getAllByRole("heading", { name: "Contract Analysis Parameters" }).at(-1);
    const uploadHeading = screen.getByRole("heading", { name: "Upload Contract" });

    expect(screen.getByRole("button", { name: /change playbook/i })).toBeInTheDocument();
    expect(rerunParameterHeading).toBeTruthy();
    expect(rerunParameterHeading!.compareDocumentPosition(uploadHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("requires category before upload in the rerun parameter flow", () => {
    renderClauseIQ("/clauseiq-v5/output-panel?rerun=upload", {
      forceResults: true,
      resultsLayout: "output-panel",
    });

    selectUnitedKingdomLaw();

    expect(screen.getByText("Governing Law · United Kingdom")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Category" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();

    selectServicesCategory();

    expect(screen.getByText("Category · Services")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
  });

  it("keeps previous output and the New Analysis divider after rerun completion", async () => {
    vi.useFakeTimers();
    const { container } = renderClauseIQ("/clauseiq-v5/output-panel", {
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

  it("renders direct results routes with the default playbook selected", () => {
    const { container } = renderClauseIQ("/clauseiq-v5?view=results");

    expect(container.textContent).toContain(CIQ_DEFAULT_PLAYBOOK);
    expect(screen.getAllByText("Selected").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Contract Analysis Parameters" })).not.toBeInTheDocument();
    expect(screen.queryByText("All categories")).not.toBeInTheDocument();
    expect(screen.queryByText("United Kingdom")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Analysis Result/i).length).toBeGreaterThan(0);
  });
});
