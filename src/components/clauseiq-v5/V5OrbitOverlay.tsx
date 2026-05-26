import type { ReactNode } from "react";
import { Button, Card, Headings, Overlay, Text } from "@orbit";

interface V5OrbitOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "Default" | "Large";
  height?: "Viewport" | "Content";
}

export function V5OrbitOverlay({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "Default",
  height = "Content",
}: V5OrbitOverlayProps) {
  return (
    <Overlay
      visible={open}
      onClose={() => onOpenChange(false)}
      ariaLabel={title}
      size={size}
      height={height}
    >
      <Card type="Static" padding="Base" state="Default">
        <div className="flex max-h-[86vh] min-w-0 flex-col overflow-hidden">
          <div className="border-b border-border pb-orbit-base">
            <Headings size="Heading 4">{title}</Headings>
            {description && (
              <div className="mt-orbit-s">
                <Text size="Small" variant="Secondary" as="p">
                  {description}
                </Text>
              </div>
            )}
          </div>
          {children && <div className="v5-hover-scrollbar min-h-0 overflow-y-auto py-orbit-base">{children}</div>}
          {footer && <div className="border-t border-border pt-orbit-base">{footer}</div>}
        </div>
      </Card>
    </Overlay>
  );
}

interface V5OrbitConfirmOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function V5OrbitConfirmOverlay({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = false,
}: V5OrbitConfirmOverlayProps) {
  return (
    <V5OrbitOverlay
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
