import type { ReactNode } from "react";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/prototype-cp-v4/clauseiq/orbit-theme.css";
import { V5OrbitToastHost } from "@/components/prototype-cp-v4/clauseiq/V5OrbitToast";

interface V5OrbitRootProps {
  children: ReactNode;
}

export function V5OrbitRoot({ children }: V5OrbitRootProps) {
  return (
    <div
      data-prototype="clauseiq-v5"
      data-theme="orbit"
      style={{
        minHeight: "100vh",
        background: "var(--orbit-color-bg-canvas)",
        color: "var(--orbit-color-text-primary)",
        fontFamily: "var(--orbit-font-family-sans)",
      }}
    >
      {children}
      <V5OrbitToastHost />
    </div>
  );
}
