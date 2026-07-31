import { FormEvent, ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACCESS_COOKIE = "clauseiq_prototype_access";

function cookiePath() {
  const basePath = import.meta.env.BASE_URL || "/";
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

function hasAccessCookie() {
  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim() === `${ACCESS_COOKIE}=granted`);
}

function isLocalDevelopmentHost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function setAccessCookie() {
  const attributes = [`Path=${cookiePath()}`, "SameSite=Lax"];
  if (window.location.protocol === "https:") attributes.push("Secure");
  document.cookie = `${ACCESS_COOKIE}=granted; ${attributes.join("; ")}`;
}

function clearAccessCookie() {
  const attributes = [`Path=${cookiePath()}`, "SameSite=Lax", "Max-Age=0"];
  if (window.location.protocol === "https:") attributes.push("Secure");
  document.cookie = `${ACCESS_COOKIE}=; ${attributes.join("; ")}`;
}

interface PrototypeAccessGateProps {
  children: ReactNode;
  /** Test-only override. Production access uses VITE_PROTOTYPE_PASSCODE. */
  passcode?: string;
  /** Test-only override. Local development hosts bypass the passcode by default. */
  bypassAccessGate?: boolean;
}

export function PrototypeAccessGate({
  children,
  passcode = import.meta.env.VITE_PROTOTYPE_PASSCODE,
  bypassAccessGate = isLocalDevelopmentHost(),
}: PrototypeAccessGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(() => bypassAccessGate || hasAccessCookie());
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [error, setError] = useState("");
  const isConfigured = Boolean(passcode);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enteredPasscode !== passcode) {
      setError("Incorrect passcode.");
      setEnteredPasscode("");
      return;
    }

    setAccessCookie();
    setError("");
    setIsUnlocked(true);
  };

  const handleLogout = () => {
    clearAccessCookie();
    setEnteredPasscode("");
    setError("");
    setIsUnlocked(false);
  };

  if (!bypassAccessGate && !isConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <section className="w-full max-w-sm space-y-3 rounded-lg border bg-card p-6 shadow-sm" aria-labelledby="access-configuration-title">
          <h1 id="access-configuration-title" className="text-lg font-semibold">Passcode configuration unavailable</h1>
          <p className="text-sm text-muted-foreground">Set VITE_PROTOTYPE_PASSCODE before starting the prototype.</p>
        </section>
      </main>
    );
  }

  if (!bypassAccessGate && !isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <section className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm" aria-labelledby="passcode-title">
          <h1 id="passcode-title" className="text-lg font-semibold">Passcode required</h1>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="prototype-passcode">Passcode</label>
              <Input
                autoComplete="off"
                autoFocus
                id="prototype-passcode"
                onChange={(event) => {
                  setEnteredPasscode(event.target.value);
                  if (error) setError("");
                }}
                type="password"
                value={enteredPasscode}
              />
              {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
            </div>
            <Button className="w-full" type="submit">Continue</Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <>
      {children}
      {!bypassAccessGate ? (
        <Button
          aria-label="Log out and lock prototype"
          className="fixed bottom-4 left-4 z-50 shadow-md"
          onClick={handleLogout}
          size="sm"
          type="button"
          variant="outline"
        >
          Lock / Log out
        </Button>
      ) : null}
    </>
  );
}
