import type { ReactNode } from "react";
// CP v3 runs its own private Orbit build (@orbit-cp*), separate from the shared @orbit the other
// six prototypes use — so this port cannot shift their rendering. See TOKEN_MAP.md.
import { OrbitInspector } from "@orbit-cp-inspector";
import "@orbit-cp-tokens";
import "@orbit-cp-fonts";
import "@/components/prototype-cp-v3/tokens.css";
import "@/components/prototype-cp-v3/clauseiq-theme.css";
// v6a's ported theme layer (rescoped to [data-prototype="prototype-cp-v3"], data-theme dropped).
// Carries the structural typography/layout classes the ported ClauseIQ components depend on;
// its colour values are progressively translated to efficio tokens.
import "@/components/prototype-cp-v3/clauseiq/orbit-theme.css";

interface PrototypeCPV3RootProps {
  children: ReactNode;
}

/**
 * Efficio-theme root for Prototype CP v3 (Connected Platform).
 *
 * This is the whole thesis of the port in one component: identical in shape to v6a's
 * V6OrbitRoot, but with NO `data-theme` attribute — so the subtree renders on the efficio
 * base (:root) instead of the orbit theme. Everything downstream resolves through
 * @efficio/orbit tokens. OrbitInspector mounts exactly once, here, per AGENTS.md rule 8.
 */
export function PrototypeCPV3Root({ children }: PrototypeCPV3RootProps) {
  return (
    <div
      data-prototype="prototype-cp-v3"
      style={{
        minHeight: "100vh",
        background: "var(--orbit-color-bg-canvas)",
        color: "var(--orbit-color-text-primary)",
        fontFamily: "var(--orbit-cp-font-family)",
      }}
    >
      {children}
      <OrbitInspector />
    </div>
  );
}
