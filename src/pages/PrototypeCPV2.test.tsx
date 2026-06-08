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
  fireEvent.click(screen.getByRole("option", { name: /Apply High only/i }));
}

function completeClauseIqAnalysis() {
  let dialog = openClauseIqModal();

  fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));
  dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
  fireEvent.click(within(dialog).getByRole("option", { name: "Procurement_Playbook_Yorkshire_Water .pdf" }));
  chooseFile("Upload contract PDF", new File(["pdf"], "Test.pdf", { type: "application/pdf" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));

  dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Finish" }));

  act(() => {
    vi.advanceTimersByTime(4000);
  });
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
    expect(screen.queryByRole("dialog", { name: "Supplier Analysis Output" })).not.toBeInTheDocument();
  });

  it("runs the isolated live wizard with Configure & Upload as step 2 and moves the workspace card to completed", () => {
    vi.useFakeTimers();
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    let dialog = openClauseIqModal();

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Prior to Use")).toBeInTheDocument();
    expect(within(dialog).getByText("Configure & Upload")).toBeInTheDocument();
    expect(within(dialog).getByText("Generate Results")).toBeInTheDocument();
    expect(within(dialog).queryByText("Settings")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Document Type")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Files")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Overview")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Client Playbook")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Analysing")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Back" })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));

    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Contract Analysis Parameters")).toBeInTheDocument();
    expect(within(dialog).getByText("Choose whether ClauseIQ should analyse against a playbook or governing law.")).toBeInTheDocument();
    expect(within(dialog).getByText("Procurement_Playbook_Yorkshire_Water .pdf")).toBeInTheDocument();
    expect(within(dialog).getByText("IT_Services_Playbook_2025.pdf")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Playbook ·/)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Change Playbook/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Contract")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("group", { name: "Upload contract PDF" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Next" })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole("option", { name: "Procurement_Playbook_Yorkshire_Water .pdf" }));

    expect(within(dialog).getByText("Upload Contract")).toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Upload contract PDF" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Next" })).toBeDisabled();

    chooseFile(
      "Upload contract PDF",
      new File(["not pdf"], "contract.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    );

    expect(within(dialog).queryByText("contract.docx")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Next" })).toBeDisabled();

    chooseFile("Upload contract PDF", new File(["pdf"], "Test.pdf", { type: "application/pdf" }));

    expect(within(dialog).getByText("Test.pdf")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Next" })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));

    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Your Contract insights are on the way!")).toBeInTheDocument();
    expect(within(dialog).queryByText(/What type of analysis do you want on your contract/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Master Service Agreement/i })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Finish" })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Back" }));
    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Upload Contract")).toBeInTheDocument();
    expect(within(dialog).getByText("Test.pdf")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Remove Test.pdf" }));

    expect(within(dialog).queryByText("Test.pdf")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Upload contract PDF" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Next" })).toBeDisabled();

    chooseFile("Upload contract PDF", new File(["pdf"], "Test.pdf", { type: "application/pdf" }));

    expect(within(dialog).getByText("Test.pdf")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Next" })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));

    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Your Contract insights are on the way!")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Finish" })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Finish" }));

    expect(screen.queryByRole("dialog", { name: "ClauseIQ Contract" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download Generating/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /View Result/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supplier Analysis Output" })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByRole("button", { name: /Download Generating/i })).not.toBeInTheDocument();
    expect(screen.getByText("Click View Result to open your contract analysis")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run Analysis Again" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Download completed contract analysis" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "History" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "View Result" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Supplier Analysis Output" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "History" }));

    const supplierDialog = screen.getByRole("dialog", { name: "Supplier Analysis Output" });
    expect(within(supplierDialog).getByRole("heading", { name: "Supplier Outputs" })).toBeInTheDocument();
    expect(within(supplierDialog).getByText(/1 supplier.*1 output/)).toBeInTheDocument();

    fireEvent.click(within(supplierDialog).getByRole("switch", { name: "Show past analyses" }));
    expect(within(supplierDialog).getByText(/6 suppliers.*9 outputs/)).toBeInTheDocument();

    fireEvent.click(within(supplierDialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "Supplier Analysis Output" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run Analysis Again" }));
    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Prior to Use")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByRole("button", { name: "View Result" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/prototype-cp-v2/results");
    expect(screen.getByTestId("location")).toHaveTextContent("source=prototype-cp-v2");
  });

  it("opens the v2 results dashboard in a workspace modal when the toggle is enabled", async () => {
    vi.useFakeTimers();
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    completeClauseIqAnalysis();
    vi.useRealTimers();

    const dashboardToggle = screen.getByRole("switch", { name: "Dashboard in modal" });
    expect(dashboardToggle).not.toBeChecked();

    fireEvent.click(dashboardToggle);

    expect(dashboardToggle).toBeChecked();
    expect(localStorage.getItem("prototype-cp-v2-dashboard-in-modal")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "View Result" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/prototype-cp-v2");
    expect(screen.getByTestId("location")).not.toHaveTextContent("/prototype-cp-v2/results");

    const resultsDialog = await screen.findByRole("dialog", { name: "ClauseIQ Results dashboard" });
    expect(within(resultsDialog).getByRole("heading", { name: "ClauseIQ Results" })).toBeInTheDocument();
    expect(within(resultsDialog).getByText("Validate ClauseIQ recommendations before supplier negotiation")).toBeInTheDocument();

    applyHighRecommendations();

    expect(await screen.findByRole("button", { name: /undo high recommendations/i })).toBeInTheDocument();

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

  it("keeps Configure & Upload as the required second step", () => {
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    let dialog = openClauseIqModal();
    fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));

    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Configure & Upload")).toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Files")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("Contract Analysis Parameters")).toBeInTheDocument();
    expect(within(dialog).queryByText("Upload Contract")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("group", { name: "Upload contract PDF" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Next" })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole("option", { name: "Procurement_Playbook_Yorkshire_Water .pdf" }));

    expect(within(dialog).getByText("Upload Contract")).toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Upload contract PDF" })).toBeInTheDocument();

    chooseFile("Upload contract PDF", new File(["pdf"], "Test.pdf", { type: "application/pdf" }));

    expect(within(dialog).getByRole("button", { name: "Next" })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));

    dialog = screen.getByRole("dialog", { name: "ClauseIQ Contract" });
    expect(within(dialog).getByText("Your Contract insights are on the way!")).toBeInTheDocument();
    expect(within(dialog).queryByText("Settings")).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/What type of analysis do you want on your contract/i)).not.toBeInTheDocument();
  });

  it("does not show the prototype switcher in the v2 header", () => {
    renderPrototypeCPV2("/prototype-cp-v2?view=workspace");

    expect(screen.queryByRole("button", { name: /Switch prototype/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Prototype CP - v2")).not.toBeInTheDocument();
  });
});
