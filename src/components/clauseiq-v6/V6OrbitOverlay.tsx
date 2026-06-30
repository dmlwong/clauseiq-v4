import type { ReactNode } from "react";
import { Button, Card, FA, FaIcon, Headings, IconButton, Overlay, Text } from "@orbit";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/clauseiq-v6/orbit-theme.css";

interface V6OrbitOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "Default" | "Large";
  height?: "Viewport" | "Content";
  modalKey?: string;
}

export function V6OrbitOverlay({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "Default",
  height = "Content",
  modalKey,
}: V6OrbitOverlayProps) {
  const fullBleedSeparatorStyle = { left: -2, right: -2 };

  return (
    <Overlay
      visible={open}
      onClose={() => onOpenChange(false)}
      ariaLabel={title}
      size={size}
      height={height}
    >
      <div
        data-prototype="clauseiq-v6"
        data-theme="orbit"
        data-v6-overlay={modalKey}
        style={{
          color: "var(--orbit-color-text-primary)",
          fontFamily: "var(--orbit-font-family-sans)",
          width: "100%",
        }}
      >
        <Card type="Static" padding="Base" state="Default" style={{ padding: 0 }}>
          <div className="flex max-h-[86vh] min-w-0 flex-col overflow-hidden">
            <div className="relative px-orbit-base py-orbit-base">
              <div
                className={`flex justify-between gap-orbit-base ${
                  description ? "items-start" : "items-center"
                }`}
              >
                <div className="min-w-0">
                  <Headings size="Heading 4">{title}</Headings>
                  {description && (
                    <div className="mt-orbit-s">
                      <Text size="Small" variant="Secondary" as="p">
                        {description}
                      </Text>
                    </div>
                  )}
                </div>
                <IconButton
                  variant="Tertiary"
                  size="Medium"
                  ariaLabel="Close modal"
                  icon={<FaIcon icon={FA.xmark} size={12} />}
                  onClick={() => onOpenChange(false)}
                />
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute bottom-0 h-px bg-border" style={fullBleedSeparatorStyle} />
            </div>
            {children && <div className="v6-hover-scrollbar min-h-0 overflow-y-auto px-[24px] py-[16px]">{children}</div>}
            {footer && (
              <div className="relative px-orbit-base py-orbit-base">
                <div aria-hidden="true" className="pointer-events-none absolute top-0 h-px bg-border" style={fullBleedSeparatorStyle} />
                {footer}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Overlay>
  );
}

interface V6OrbitConfirmOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function V6OrbitConfirmOverlay({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = false,
}: V6OrbitConfirmOverlayProps) {
  return (
    <V6OrbitOverlay
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <div className="flex justify-end gap-orbit-s">
          <Button variant="Secondary" size="Medium" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "Destructive" : "Primary"}
            size="Medium"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    />
  );
}
