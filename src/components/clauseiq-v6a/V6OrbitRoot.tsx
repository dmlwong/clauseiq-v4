import type { ReactNode } from "react";
import { OrbitInspector } from "@efficio/orbit/inspector";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/clauseiq-v6a/orbit-theme.css";
import { V6OrbitToastHost } from "@/components/clauseiq-v6a/V6OrbitToast";

interface V6OrbitRootProps {
  children: ReactNode;
  layout?: "page" | "embedded";
}

export function V6OrbitRoot({ children, layout = "page" }: V6OrbitRootProps) {
  return (
    <div
      data-prototype="clauseiq-v6a"
      data-theme="orbit"
      style={{
        minHeight: layout === "page" ? "100vh" : "100%",
        height: layout === "embedded" ? "100%" : undefined,
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
