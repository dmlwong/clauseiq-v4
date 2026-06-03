import { useEffect, useState } from "react";
import { Toast } from "@orbit";

type CpToastVariant = "default" | "destructive" | "success" | "warning" | "info";

export interface CpToastOptions {
  title: string;
  description?: string;
  variant?: CpToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

const CP_TOAST_EVENT = "prototype-cp-v2:orbit-toast";

function toastType(variant: CpToastVariant | undefined) {
  if (variant === "destructive") return "Error";
  if (variant === "warning") return "Warning";
  if (variant === "info") return "Info";
  return "Success";
}

function toastMessage(options: CpToastOptions) {
  return options.description ? `${options.title} — ${options.description}` : options.title;
}

export function showCpOrbitToast(options: CpToastOptions) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CpToastOptions>(CP_TOAST_EVENT, { detail: options }));
}

showCpOrbitToast.success = (title: string, description?: string) =>
  showCpOrbitToast({ title, description, variant: "success" });

showCpOrbitToast.error = (title: string, description?: string) =>
  showCpOrbitToast({ title, description, variant: "destructive" });

export function useCpOrbitToast() {
  return { toast: showCpOrbitToast };
}

export function CpOrbitToastHost() {
  const [current, setCurrent] = useState<(CpToastOptions & { id: number }) | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<CpToastOptions>).detail;
      setCurrent({ ...detail, id: Date.now() });
    };

    window.addEventListener(CP_TOAST_EVENT, handleToast);
    return () => window.removeEventListener(CP_TOAST_EVENT, handleToast);
  }, []);

  if (!current) return null;

  return (
    <div className="pointer-events-none fixed right-orbit-base top-orbit-base z-[100] max-w-[380px]">
      <div className="pointer-events-auto">
        <Toast
          key={current.id}
          type={toastType(current.variant)}
          message={toastMessage(current)}
          visible
          actions={current.action ? [{ ...current.action, variant: "Secondary" }] : undefined}
          onDismiss={() => setCurrent(null)}
        />
      </div>
    </div>
  );
}
