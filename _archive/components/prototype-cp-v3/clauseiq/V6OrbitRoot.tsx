import type { ReactNode } from "react";
import { OrbitInspector } from "@orbit-cp-inspector";
import "@orbit-cp-tokens";
import "@orbit-cp-fonts";
import "@/components/prototype-cp-v3/clauseiq/orbit-theme.css";
import { V6OrbitToastHost } from "@/components/prototype-cp-v3/clauseiq/V6OrbitToast";

interface V6OrbitRootProps {
  children: ReactNode;
}

export function V6OrbitRoot({ children }: V6OrbitRootProps) {
  return (
    <div
      data-prototype="prototype-cp-v3"

      style={{
        minHeight: "100vh",
        background: "var(--orbit-color-bg-canvas)",
        color: "var(--orbit-color-text-primary)",
        fontFamily: "var(--orbit-font-family-sans)",
      }}
    >
      {children}
      <V6OrbitToastHost />
      <OrbitInspector />
    </div>
  );
}
