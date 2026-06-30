import { useEffect, useState } from "react";
import { Toast } from "@orbit";

type V6ToastVariant = "default" | "destructive" | "success" | "warning" | "info";

export interface V6ToastOptions {
  title: string;
  description?: string;
  variant?: V6ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

const V6_TOAST_EVENT = "clauseiq-v6:orbit-toast";

function toastType(variant: V6ToastVariant | undefined) {
  if (variant === "destructive") return "Error";
  if (variant === "warning") return "Warning";
  if (variant === "info") return "Info";
  return "Success";
}

function toastMessage(options: V6ToastOptions) {
  return options.description ? `${options.title} — ${options.description}` : options.title;
}

export function showV6OrbitToast(options: V6ToastOptions) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<V6ToastOptions>(V6_TOAST_EVENT, { detail: options }));
}

showV6OrbitToast.success = (title: string, description?: string) =>
  showV6OrbitToast({ title, description, variant: "success" });

showV6OrbitToast.error = (title: string, description?: string) =>
  showV6OrbitToast({ title, description, variant: "destructive" });

export function useV6OrbitToast() {
  return { toast: showV6OrbitToast };
}

export function V6OrbitToastHost() {
  const [current, setCurrent] = useState<(V6ToastOptions & { id: number }) | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<V6ToastOptions>).detail;
      setCurrent({ ...detail, id: Date.now() });
    };

    window.addEventListener(V6_TOAST_EVENT, handleToast);
    return () => window.removeEventListener(V6_TOAST_EVENT, handleToast);
  }, []);

  if (!current) return null;

  return (
    <div className="v6-orbit-toast-host pointer-events-none fixed left-1/2 top-orbit-base z-[100] w-[min(760px,calc(100vw-var(--orbit-space-m)-var(--orbit-space-m)))] -translate-x-1/2 md:left-[calc(50%+150px)]">
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
