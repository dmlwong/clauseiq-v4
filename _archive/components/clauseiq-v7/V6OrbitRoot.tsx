import type { ReactNode } from "react";
import { OrbitInspector } from "@efficio/orbit/inspector";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/clauseiq-v7/orbit-theme.css";
import { V6OrbitToastHost } from "@/components/clauseiq-v7/V6OrbitToast";

interface V6OrbitRootProps {
  children: ReactNode;
}

export function V6OrbitRoot({ children }: V6OrbitRootProps) {
  return (
    <div
      data-prototype="clauseiq-v7"
      data-theme="orbit"
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
