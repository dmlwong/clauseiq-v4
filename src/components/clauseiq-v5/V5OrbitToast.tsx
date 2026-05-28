import { useEffect, useState } from "react";
import { Toast } from "@orbit";

type V5ToastVariant = "default" | "destructive" | "success" | "warning" | "info";

export interface V5ToastOptions {
  title: string;
  description?: string;
  variant?: V5ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

const V5_TOAST_EVENT = "clauseiq-v5:orbit-toast";

function toastType(variant: V5ToastVariant | undefined) {
  if (variant === "destructive") return "Error";
  if (variant === "warning") return "Warning";
  if (variant === "info") return "Info";
  return "Success";
}

function toastMessage(options: V5ToastOptions) {
  return options.description ? `${options.title} — ${options.description}` : options.title;
}

export function showV5OrbitToast(options: V5ToastOptions) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<V5ToastOptions>(V5_TOAST_EVENT, { detail: options }));
}

showV5OrbitToast.success = (title: string, description?: string) =>
  showV5OrbitToast({ title, description, variant: "success" });

showV5OrbitToast.error = (title: string, description?: string) =>
  showV5OrbitToast({ title, description, variant: "destructive" });

export function useV5OrbitToast() {
  return { toast: showV5OrbitToast };
}

export function V5OrbitToastHost() {
  const [current, setCurrent] = useState<(V5ToastOptions & { id: number }) | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<V5ToastOptions>).detail;
      setCurrent({ ...detail, id: Date.now() });
    };

    window.addEventListener(V5_TOAST_EVENT, handleToast);
    return () => window.removeEventListener(V5_TOAST_EVENT, handleToast);
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
