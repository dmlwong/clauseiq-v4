import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeAll } from "vitest";

import ClauseIQV4 from "./ClauseIQV4";
import { CIQ_DEFAULT_PLAYBOOK } from "@/lib/clauseiq-v4-data";
import { TooltipProvider } from "@/components/ui/tooltip";

function renderClauseIQ(
  route = "/clauseiq-v4",
  props: { forceResults?: boolean; resultsLayout?: "accordion" | "output-panel" } = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TooltipProvider>
        <ClauseIQV4 {...props} />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

function startAndSelectInitiative() {
  fireEvent.click(screen.getByRole("button", { name: /get started/i }));
  fireEvent.click(screen.getByRole("button", { name: /search initiatives/i }));
  fireEvent.click(screen.getByRole("cell", { name: "Fleet Telematics Refresh" }));
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("ClauseIQ V4 flow", () => {
  it("starts at welcome and reveals initiative selection after Get Started", async () => {
    renderClauseIQ();

    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    expect(screen.getAllByText("Supplier Outputs").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No outputs yet").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    expect(screen.getByRole("button", { name: /search initiatives/i })).toBeInTheDocument();
    expect(screen.getAllByText("No outputs yet").length).toBeGreaterThan(0);
  });

  it("shows Contract Analysis Parameters after selecting an initiative before upload", async () => {
    renderClauseIQ();

    startAndSelectInitiative();

    expect(screen.getByRole("heading", { name: "Contract Analysis Parameters" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("selects a playbook parameter, shows the summary card, and then shows upload", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    fireEvent.click(screen.getByRole("radio", { name: "Playbook" }));
    fireEvent.click(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK }));

    expect(screen.getByText(CIQ_DEFAULT_PLAYBOOK)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change playbook/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
  });

  it("returns to parameter selection from Change Playbook", async () => {
    renderClauseIQ();

    startAndSelectInitiative();
    fireEvent.click(screen.getByRole("radio", { name: "Playbook" }));
    fireEvent.click(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK }));
    fireEvent.click(screen.getByRole("button", { name: /change playbook/i }));

    expect(screen.getByRole("radio", { name: "Playbook" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Upload Contract" })).not.toBeInTheDocument();
  });

  it("keeps the user on upload when a non-PDF is selected", async () => {
    const { container } = renderClauseIQ();

    startAndSelectInitiative();
    fireEvent.click(screen.getByRole("radio", { name: "Playbook" }));
    fireEvent.click(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK }));

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
    fireEvent.click(screen.getByRole("radio", { name: "Playbook" }));
    fireEvent.click(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK }));

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    fireEvent.change(input!, {
      target: {
        files: [new File(["pdf"], "contract.pdf", { type: "application/pdf" })],
      },
    });

    expect(screen.getByRole("heading", { name: "Analysing Your Contract" })).toBeInTheDocument();
    expect(screen.getAllByText("Analysis running").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Analysis running. This output will appear here when complete.").length).toBeGreaterThan(0);
  });

  it("renders the output-panel route with filled supplier outputs", () => {
    renderClauseIQ("/clauseiq-v4/output-panel", { forceResults: true, resultsLayout: "output-panel" });

    expect(screen.getAllByText("Supplier Outputs").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("View Results").length).toBeGreaterThan(0);
    expect(screen.queryByText("No outputs yet")).not.toBeInTheDocument();
  });

  it("renders direct results routes with the default playbook selected", () => {
    renderClauseIQ("/clauseiq-v4?view=results");

    expect(screen.getByText(CIQ_DEFAULT_PLAYBOOK)).toBeInTheDocument();
    expect(screen.getByText("Playbook")).toBeInTheDocument();
    expect(screen.getAllByText(/Analysis Result/i).length).toBeGreaterThan(0);
  });
});
