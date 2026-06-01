import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PrototypeCP from "./PrototypeCP";
import { CIQ_DEFAULT_PLAYBOOK } from "@/lib/clauseiq-v4-data";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderPrototypeCP() {
  return render(
    <MemoryRouter initialEntries={["/prototype-cp"]}>
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
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
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
  it("runs the CP modal journey and hands off completed results to the v5 review route", () => {
    vi.useFakeTimers();
    const { container } = renderPrototypeCP();

    openCpWorkspace();
    openClauseIqModal();

    expect(screen.getByRole("dialog", { name: "ClauseIQ workflow" })).toBeInTheDocument();
    expect(screen.queryByText("ClauseIQ Contract")).not.toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();

    advanceToUpload();

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

    expect(screen.getAllByText("contract.pdf").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Analysing Your Contract" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run Analysis" }));

    expect(screen.getByRole("heading", { name: "Analysing Your Contract" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_100);
    });

    expect(screen.getByRole("heading", { name: "Here is your Analysis Result" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "ClauseIQ workflow" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Analysis" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View Analysis" }));
    expect(screen.getByRole("heading", { name: "Here is your Analysis Result" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View Full Result" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/initiatives-v5?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq",
    );
  });
});
