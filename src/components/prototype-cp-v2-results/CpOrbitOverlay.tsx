import type { ReactNode } from "react";
import {
  Button,
  Card,
  FA,
  FaIcon,
  Headings,
  IconButton,
  Overlay,
  Text,
} from "@orbit";
import { cn } from "@/lib/utils";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/prototype-cp-v2-results/orbit-theme.css";
interface CpOrbitOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "Default" | "Large";
  height?: "Viewport" | "Content";
  titleAlign?: "left" | "center";
}
export function CpOrbitOverlay({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "Default",
  height = "Content",
  titleAlign = "left",
}: CpOrbitOverlayProps) {
  const fullBleedSeparatorStyle = { left: -2, right: -2 };
  const centerTitle = titleAlign === "center";
  return (
    <Overlay
      visible={open}
      onClose={() => onOpenChange(false)}
      ariaLabel={title}
      size={size}
      height={height}
    >
      {" "}
      <div
        data-prototype="prototype-cp-v2-results"
        data-theme="efficio-cp"
        style={{
          color: "var(--orbit-color-text-primary)",
          fontFamily: "var(--orbit-font-family-sans)",
          width: "100%",
        }}
      >
        {" "}
        <Card
          type="Static"
          padding="Base"
          state="Default"
          style={{ padding: 0 }}
        >
          {" "}
          <div className="flex max-h-[86vh] min-w-0 flex-col overflow-hidden">
            {" "}
            <div className="relative px-orbit-base py-orbit-base">
              {" "}
              <div
                className={cn(
                  "gap-orbit-base",
                  centerTitle
                    ? "flex min-h-9 items-center justify-center"
                    : "flex items-start justify-between",
                )}
              >
                {" "}
                <div
                  className={cn(
                    "min-w-0",
                    centerTitle && "flex-1 text-center",
                  )}
                  style={
                    centerTitle
                      ? {
                          paddingInline:
                            "calc(var(--orbit-space-8) + var(--orbit-space-4))",
                        }
                      : undefined
                  }
                >
                  {" "}
                  <Headings size="Heading 4">{title}</Headings>{" "}
                  {description && (
                    <div className="mt-orbit-s">
                      {" "}
                      <Text size="Small" variant="Secondary" as="p">
                        {" "}
                        {description}{" "}
                      </Text>{" "}
                    </div>
                  )}{" "}
                </div>{" "}
                <div
                  className={cn(
                    centerTitle && "absolute top-1/2 -translate-y-1/2",
                  )}
                  style={
                    centerTitle ? { right: "var(--orbit-space-4)" } : undefined
                  }
                >
                  <IconButton
                    variant="Tertiary"
                    size="Medium"
                    ariaLabel="Close modal"
                    icon={<FaIcon icon={FA.xmark} size={12} />}
                    onClick={() => onOpenChange(false)}
                  />
                </div>{" "}
              </div>{" "}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 h-px bg-border"
                style={fullBleedSeparatorStyle}
              />{" "}
            </div>{" "}
            {children && (
              <div className="cpv2-hover-scrollbar min-h-0 overflow-y-auto px-orbit-base py-orbit-base">
                {children}
              </div>
            )}{" "}
            {footer && (
              <div className="relative px-orbit-base py-orbit-base">
                {" "}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 h-px bg-border"
                  style={fullBleedSeparatorStyle}
                />{" "}
                {footer}{" "}
              </div>
            )}{" "}
          </div>{" "}
        </Card>{" "}
      </div>{" "}
    </Overlay>
  );
}
interface CpOrbitConfirmOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}
export function CpOrbitConfirmOverlay({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = false,
}: CpOrbitConfirmOverlayProps) {
  return (
    <CpOrbitOverlay
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <div className="flex justify-end gap-orbit-s">
          {" "}
          <Button
            variant="Secondary"
            size="Medium"
            onClick={() => onOpenChange(false)}
          >
            {" "}
            Cancel{" "}
          </Button>{" "}
          <Button
            variant={destructive ? "Destructive" : "Primary"}
            size="Medium"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {" "}
            {confirmLabel}{" "}
          </Button>{" "}
        </div>
      }
    />
  );
}
