import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { PrototypeAccessGate } from "./PrototypeAccessGate";

function LocationEcho() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderGate(route = "/", passcode = "test-passcode") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <PrototypeAccessGate passcode={passcode}>
        <Routes>
          <Route path="*" element={<LocationEcho />} />
        </Routes>
      </PrototypeAccessGate>
    </MemoryRouter>,
  );
}

function clearAccessCookie() {
  document.cookie = "clauseiq_prototype_access=; Path=/; Max-Age=0";
}

afterEach(clearAccessCookie);

describe("PrototypeAccessGate", () => {
  it("hides the requested route until the correct passcode is entered", () => {
    renderGate("/clauseiq-v6a/output-panel?view=results");

    expect(screen.getByRole("heading", { name: "Passcode required" })).toBeInTheDocument();
    expect(screen.queryByTestId("location")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "test-passcode" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/clauseiq-v6a/output-panel?view=results");
  });

  it("shows an error and stays locked for an incorrect passcode", () => {
    renderGate();

    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "wrong" } });
    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent("Incorrect passcode.");
    expect(screen.queryByTestId("location")).not.toBeInTheDocument();
  });

  it("honours an existing session cookie and clears it on logout", () => {
    document.cookie = "clauseiq_prototype_access=granted; Path=/; SameSite=Lax";
    renderGate("/prototypes");

    expect(screen.getByTestId("location")).toHaveTextContent("/prototypes");
    fireEvent.click(screen.getByRole("button", { name: "Log out and lock prototype" }));

    expect(screen.getByRole("heading", { name: "Passcode required" })).toBeInTheDocument();
    expect(document.cookie).not.toContain("clauseiq_prototype_access=granted");
  });
});
