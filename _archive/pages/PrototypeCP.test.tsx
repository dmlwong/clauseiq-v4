import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PrototypeCP from "./PrototypeCP";
import { CIQ_DEFAULT_PLAYBOOK } from "@/lib/clauseiq-v4-data";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderPrototypeCP(initialEntry = "/prototype-cp") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PrototypeCP />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function openCpWorkspace() {
  const efficioCard = screen.getByText("Efficio").closest("article");
  expect(efficioCard).toBeTruthy();

  fireEvent.click(within(efficioCard!).getByRole("button", { name: /expand project/i }));
  fireEvent.click(within(efficioCard!).getByRole("button", { name: "View Project" }));
  fireEvent.click(screen.getAllByRole("button", { name: "View Initiative" })[0]);
}

function openClauseIqModal() {
  fireEvent.click(screen.getByRole("button", { name: /clauseiq - analyse your contracts/i }));
  fireEvent.click(screen.getByRole("button", { name: "Get Started" }));
}

function advanceToUpload() {
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  expect(screen.getAllByText("CP001-1014 | sdasd").length).toBeGreaterThan(0);
  expect(screen.getByRole("heading", { name: "Contract Analysis Parameters" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("option", { name: CIQ_DEFAULT_PLAYBOOK }));
  expect(screen.getByText(`Playbook · ${CIQ_DEFAULT_PLAYBOOK}`)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
  expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
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
  vi.useRealTimers();
});

describe("Prototype CP ClauseIQ modal workflow", () => {
  it("runs the CP modal journey and exposes completed results from the workspace", () => {
    vi.useFakeTimers();
    const { container } = renderPrototypeCP();

    openCpWorkspace();
    openClauseIqModal();

    expect(screen.getByRole("dialog", { name: "ClauseIQ workflow" })).toBeInTheDocument();
    expect(screen.queryByText("ClauseIQ Contract")).not.toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Configure & Upload")).toBeInTheDocument();
    expect(screen.getByText("Analysing")).toBeInTheDocument();
    expect(screen.queryByText("Results")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();

    advanceToUpload();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    fireEvent.change(input!, {
      target: {
        files: [new File(["not pdf"], "contract.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })],
      },
    });

    expect(screen.getByRole("heading", { name: "Upload Contract" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Analysing Your Contract" })).not.toBeInTheDocument();

    fireEvent.change(input!, {
      target: {
        files: [new File(["pdf"], "contract.pdf", { type: "application/pdf" })],
      },
    });

    expect(screen.getByRole("dialog", { name: "ClauseIQ workflow" })).toBeInTheDocument();
    expect(screen.getAllByText("contract.pdf").length).toBeGreaterThan(0);
    expect(screen.queryByRole("group", { name: "Upload contract PDF" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Analysing Your Contract" })).toBeInTheDocument();
    expect(screen.getByText("Analysis submitted")).toBeInTheDocument();
    expect(screen.getByText(/ClauseIQ is reviewing contract\.pdf/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analysis running" })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(3_100);
    });

    expect(screen.getAllByRole("heading", { name: "Here is your Analysis Result" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Your ClauseIQ analysis result is ready to review.")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "ClauseIQ workflow" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Analysis" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supplier Analysis Output" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Supplier Analysis Output" }));
    const supplierDialog = screen.getByRole("dialog", { name: "Supplier Analysis Output" });
    expect(within(supplierDialog).getByRole("heading", { name: "Supplier Outputs" })).toBeInTheDocument();
    expect(within(supplierDialog).getByText(/1 supplier.*1 output/)).toBeInTheDocument();

    fireEvent.click(within(supplierDialog).getByRole("switch", { name: "Show past analyses" }));
    expect(within(supplierDialog).getByText(/6 suppliers.*9 outputs/)).toBeInTheDocument();

    fireEvent.click(within(supplierDialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "Supplier Analysis Output" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New Analysis" }));
    expect(screen.getByRole("dialog", { name: "ClauseIQ workflow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/prototype-cp?view=workspace",
    );
  });

  it("switches to Prototype CP v2 while preserving the workspace view", () => {
    renderPrototypeCP("/prototype-cp?view=workspace");

    expect(screen.getByRole("button", { name: /Switch prototype Prototype CP$/i })).toBeInTheDocument();

    choosePrototype("Prototype CP - v2");

    expect(screen.getByTestId("location")).toHaveTextContent("/prototype-cp-v2?view=workspace");
  });

  it("opens and manages the CP notifications panel", () => {
    renderPrototypeCP("/prototype-cp?view=workspace");

    const notificationButton = screen.getByRole("button", { name: "Notifications" });
    expect(within(notificationButton).getByText("3")).toBeInTheDocument();

    fireEvent.click(notificationButton);

    let panel = screen.getByRole("dialog", { name: "Notifications" });
    const contractReviewedMessage = "Your contract has now been reviewed. Click here to download.";

    expect(within(panel).getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Mark all as read" })).toBeInTheDocument();
    expect(within(panel).getAllByText(contractReviewedMessage).length).toBeGreaterThan(0);

    fireEvent.click(within(panel).getByRole("tab", { name: "Efficio Hub" }));
    expect(within(panel).getAllByText(contractReviewedMessage)).toHaveLength(2);
    expect(within(panel).queryByText(/Initiative In-Flight/)).not.toBeInTheDocument();

    fireEvent.click(within(panel).getByRole("tab", { name: "Unread" }));
    expect(within(panel).getByText(/Initiative In-Flight/)).toBeInTheDocument();
    expect(within(panel).queryByText("6 days ago")).not.toBeInTheDocument();

    const dismissButtons = within(panel).getAllByRole("button", { name: /Dismiss notification/i });
    fireEvent.click(dismissButtons[0]);
    expect(within(panel).getAllByRole("button", { name: /Dismiss notification/i })).toHaveLength(dismissButtons.length - 1);

    fireEvent.click(within(panel).getByRole("button", { name: "Mark all as read" }));
    expect(within(notificationButton).queryByText("3")).not.toBeInTheDocument();
    expect(within(panel).getByText("No notifications to show")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();

    fireEvent.click(notificationButton);
    panel = screen.getByRole("dialog", { name: "Notifications" });
    expect(panel).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();
  });
});
