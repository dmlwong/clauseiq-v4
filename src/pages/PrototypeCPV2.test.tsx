import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PrototypeCPV2 from "./PrototypeCPV2";

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

function renderPrototypeCPV2(initialEntry = "/prototype-cp-v2") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PrototypeCPV2 />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function openClauseIqModal() {
  fireEvent.click(screen.getByRole("button", { name: /ClauseIQ - Analyse your contracts/i }));
  fireEvent.click(screen.getByRole("button", { name: "Get Started" }));
  return screen.getByRole("dialog", { name: "ClauseIQ Contract" });
}

function chooseFile(inputLabel: string, file: File) {
  const input = screen.getByLabelText(inputLabel, { selector: "input" });
  fireEvent.change(input, {
    target: {
      files: [file],
    },
  });
}

function applyHighRecommendations() {
  fireEvent.click(screen.getByRole("button", { name: /apply recommendations/i }));
  fireEvent.click(screen.getByRole("option", { name: /High Deviation/i }));
}

function completeClauseIqAnalysis() {
  const dialog = openClauseIqModal();
  fireEvent.click(within(dialog).getByRole("button", { name: "Get Started" }));
  fireEvent.click(within(dialog).getByRole("option", { name: "Procurement_Playbook_Yorkshire_Water .pdf" }));
  chooseFile("Upload contract PDF", new File(["pdf"], "Test.pdf", { type: "application/pdf" }));

  act(() => {
    vi.advanceTimersByTime(3000);
  });

  fireEvent.click(within(dialog).getByRole("button", { name: "Close ClauseIQ Contract" }));
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  mocks.downloadCsv.mockClear();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});

describe("Prototype CP v2 ClauseIQ live wizard", () => {
  it("opens and manages notifications from the v2 rail", () => {
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    const notificationButton = screen.getByRole("button", { name: "Notifications" });
    expect(notificationButton).toHaveTextContent("3");
    expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();

    fireEvent.click(notificationButton);

    const notificationsDialog = screen.getByRole("dialog", { name: "Notifications" });
    expect(within(notificationsDialog).getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(within(notificationsDialog).getAllByText("Your contract has now been reviewed. Click here to download.").length).toBeGreaterThan(0);
    expect(within(notificationsDialog).getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(within(notificationsDialog).getByRole("tab", { name: "Efficio Hub" }));
    expect(within(notificationsDialog).getByRole("tab", { name: "Efficio Hub" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(within(notificationsDialog).getByRole("button", { name: "Mark all as read" }));
    expect(within(notificationsDialog).getByRole("button", { name: "Mark all as read" })).toBeDisabled();
    expect(notificationButton).not.toHaveTextContent("3");

    fireEvent.click(notificationButton);
    expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();
  });

  it("keeps supplier analysis output history disabled before ClauseIQ has outputs", () => {
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    fireEvent.click(screen.getByRole("button", { name: /ClauseIQ - Analyse your contracts/i }));

    expect(screen.getByRole("button", { name: "History" })).toBeDisabled();
    expect(screen.queryByRole("dialog", { name: "History" })).not.toBeInTheDocument();
  });

  it("runs the isolated V5-style modal journey and moves the workspace card to completed", () => {
    vi.useFakeTimers();
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    let dialog = openClauseIqModal();

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Tool Overview" })).toBeInTheDocument();
    expect(within(dialog).queryByText("Prior to Use")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Configure & Upload")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Files")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Settings")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Client Playbook")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Document Type")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Analysing")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Back" })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Get Started" }));

    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Contract Analysis Parameters")).toBeInTheDocument();
    expect(within(dialog).getByText("Do you want to use a playbook for this analysis?")).toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: "Yes" })).toHaveAttribute("aria-checked", "true");
    expect(within(dialog).getByRole("radio", { name: "No" })).toHaveAttribute("aria-checked", "false");
    expect(within(dialog).getByText("Procurement_Playbook_Yorkshire_Water .pdf")).toBeInTheDocument();
    expect(within(dialog).getByText("IT_Services_Playbook_2025.pdf")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Playbook ·/)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Change Playbook/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Contract")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("group", { name: "Upload contract PDF" })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("radio", { name: "No" }));

    expect(within(dialog).getByText("Category")).toBeInTheDocument();
    expect(within(dialog).getByText("Governing Law")).toBeInTheDocument();
    expect(within(dialog).getByRole("option", { name: "Services" })).toBeInTheDocument();
    expect(within(dialog).getByRole("option", { name: "United Kingdom" })).toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Contract")).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("option", { name: "Services" }));
    expect(within(dialog).queryByText("Upload Contract")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("option", { name: "United Kingdom" }));

    expect(within(dialog).getByText("Upload Contract")).toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Upload contract PDF" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /Change Governing Law/i }));
    fireEvent.click(within(dialog).getByRole("radio", { name: "Yes" }));

    fireEvent.click(within(dialog).getByRole("option", { name: "Procurement_Playbook_Yorkshire_Water .pdf" }));

    expect(within(dialog).getByText("Upload Contract")).toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Upload contract PDF" })).toBeInTheDocument();

    chooseFile(
      "Upload contract PDF",
      new File(["not pdf"], "contract.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    );

    expect(within(dialog).queryByText("contract.docx")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Upload contract PDF" })).toBeInTheDocument();

    chooseFile("Upload contract PDF", new File(["pdf"], "Test.pdf", { type: "application/pdf" }));

    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Analysing Your Contract")).toBeInTheDocument();
    expect(within(dialog).getByText("Test.pdf")).toBeInTheDocument();
    expect(within(dialog).getByText(/Playbook · Procurement_Playbook_Yorkshire_Water .pdf/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("radio", { name: "Yes" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("radio", { name: "No" })).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Contract")).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close ClauseIQ Contract" }));
    expect(screen.queryByRole("dialog", { name: "ClauseIQ Contract" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download Generating/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /View Result/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Download Generating/i }));
    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Analysing Your Contract")).toBeInTheDocument();
    expect(within(dialog).getByText("Test.pdf")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(within(dialog).getByText("Here is your Analysis Result")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "View Result" })).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: "Run Analysis Again" })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close ClauseIQ Contract" }));
    expect(screen.queryByRole("button", { name: /Download Generating/i })).not.toBeInTheDocument();
    expect(screen.getByText("Click View Result to open your contract analysis")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run Analysis Again" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Download completed contract analysis" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "History" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "View Result" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Supplier Analysis Output" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "History" }));

    const supplierDialog = screen.getByRole("dialog", { name: "History" });
    expect(within(supplierDialog).getByRole("heading", { name: "Supplier Outputs" })).toBeInTheDocument();
    expect(within(supplierDialog).queryByRole("button", { name: "Re-Run" })).not.toBeInTheDocument();
    expect(within(supplierDialog).getByText(/6 suppliers.*9 outputs/)).toBeInTheDocument();
    expect(within(supplierDialog).getByText("Kira Systems")).toBeInTheDocument();
    expect(within(supplierDialog).getByText("API_Kira_v3.pdf")).toBeInTheDocument();
    expect(within(supplierDialog).getByText("SOW_Kira_Q1.pdf")).toBeInTheDocument();
    expect(within(supplierDialog).getByText("Deloitte Legal")).toBeInTheDocument();
    expect(within(supplierDialog).getByText("Advisory_Deloitte_v4.pdf")).toBeInTheDocument();
    expect(within(supplierDialog).getByText(/Advisory services agreement.*29 clauses reviewed.*Completed/)).toBeInTheDocument();

    fireEvent.click(within(supplierDialog).getByRole("switch", { name: "Show past analyses" }));
    expect(within(supplierDialog).getByText(/1 supplier.*1 output/)).toBeInTheDocument();
    expect(within(supplierDialog).getByText("MSA_ThomsonReuters_v2.pdf")).toBeInTheDocument();
    expect(within(supplierDialog).getByText(/Master services agreement.*47 clauses reviewed.*Completed/)).toBeInTheDocument();

    fireEvent.click(within(supplierDialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "History" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run Analysis Again" }));
    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Here is your Analysis Result")).toBeInTheDocument();
    expect(within(dialog).getByText("New Analysis")).toBeInTheDocument();
    expect(within(dialog).getByText("Contract Analysis Parameters")).toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Contract")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("radio", { name: "Yes" }));
    fireEvent.click(within(dialog).getByRole("option", { name: "Procurement_Playbook_Yorkshire_Water .pdf" }));
    expect(within(dialog).getByText("Upload Contract")).toBeInTheDocument();
    chooseFile("Upload contract PDF", new File(["pdf"], "Rerun.pdf", { type: "application/pdf" }));
    expect(within(dialog).getByText("Analysing New Contract")).toBeInTheDocument();
    expect(within(dialog).getByText("Here is your Analysis Result")).toBeInTheDocument();
    expect(within(dialog).queryByRole("group", { name: "Upload contract PDF" })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close ClauseIQ Contract" }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const dashboardToggle = screen.getByRole("switch", { name: "Dashboard in modal" });
    expect(dashboardToggle).toBeChecked();

    fireEvent.click(dashboardToggle);

    expect(dashboardToggle).not.toBeChecked();
    expect(localStorage.getItem("prototype-cp-v2-dashboard-in-modal")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "View Result" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/prototype-cp-v2/results");
    expect(screen.getByTestId("location")).toHaveTextContent("source=prototype-cp-v2");
  });

  it("opens the v2 results dashboard in a workspace modal by default", async () => {
    vi.useFakeTimers();
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    completeClauseIqAnalysis();
    vi.useRealTimers();

    const dashboardToggle = screen.getByRole("switch", { name: "Dashboard in modal" });
    expect(dashboardToggle).toBeChecked();
    expect(localStorage.getItem("prototype-cp-v2-dashboard-in-modal")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "View Result" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/prototype-cp-v2");
    expect(screen.getByTestId("location")).not.toHaveTextContent("/prototype-cp-v2/results");

    const resultsDialog = await screen.findByRole("dialog", { name: "ClauseIQ Results dashboard" });
    expect(within(resultsDialog).getByRole("heading", { name: "ClauseIQ Results" })).toBeInTheDocument();
    expect(within(resultsDialog).getByText("Validate ClauseIQ recommendations before supplier negotiation")).toBeInTheDocument();

    applyHighRecommendations();

    expect(await screen.findByRole("button", { name: /undo high deviation recommendations/i })).toBeInTheDocument();

    fireEvent.click(within(resultsDialog).getByRole("button", { name: /Review & Generate/i }));

    expect(screen.getAllByRole("dialog")).toHaveLength(2);

    const reviewDialog = screen.getByRole("dialog", { name: /Generate CSV from applied recommendations/i });
    expect(within(reviewDialog).getByRole("heading", { name: "Generate CSV from applied recommendations" })).toBeInTheDocument();

    fireEvent.click(within(reviewDialog).getByRole("button", { name: /Submit & Generate/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /Generate CSV from applied recommendations/i })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("dialog", { name: "ClauseIQ Results dashboard" })).toBeInTheDocument();
    expect(mocks.downloadCsv).toHaveBeenCalledTimes(1);

    expect(within(resultsDialog).queryByRole("button", { name: "Back to Workspace" })).not.toBeInTheDocument();

    fireEvent.click(within(resultsDialog).getByRole("button", { name: "Close ClauseIQ Results dashboard" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "ClauseIQ Results dashboard" })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("location")).toHaveTextContent("/prototype-cp-v2?view=workspace");
    expect(screen.getByTestId("location")).not.toHaveTextContent("source=prototype-cp-v2");
  });

  it("requires parameters before revealing upload in the V5-style modal flow", () => {
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    let dialog = openClauseIqModal();
    fireEvent.click(within(dialog).getByRole("button", { name: "Get Started" }));

    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).queryByText("Upload Files")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Settings")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Client Playbook")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("Contract Analysis Parameters")).toBeInTheDocument();
    expect(within(dialog).getByText("Do you want to use a playbook for this analysis?")).toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Contract")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("group", { name: "Upload contract PDF" })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("radio", { name: "No" }));
    fireEvent.click(within(dialog).getByRole("option", { name: "Services" }));
    expect(within(dialog).queryByText("Upload Contract")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("option", { name: "United Kingdom" }));

    expect(within(dialog).getByText("Upload Contract")).toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Upload contract PDF" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /Change Governing Law/i }));
    fireEvent.click(within(dialog).getByRole("radio", { name: "Yes" }));
    fireEvent.click(within(dialog).getByRole("option", { name: "Procurement_Playbook_Yorkshire_Water .pdf" }));

    expect(within(dialog).getByText("Upload Contract")).toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Upload contract PDF" })).toBeInTheDocument();

    chooseFile("Upload contract PDF", new File(["pdf"], "Test.pdf", { type: "application/pdf" }));

    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Analysing Your Contract")).toBeInTheDocument();
    expect(within(dialog).queryByRole("radio", { name: "Yes" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("radio", { name: "No" })).not.toBeInTheDocument();
  });

  it("does not show the prototype switcher in the v2 header", () => {
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    expect(screen.queryByRole("button", { name: /Switch prototype/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Prototype CP - v2")).not.toBeInTheDocument();
  });
});
