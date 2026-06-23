import type * as React from "react";
import { FA, FaIcon } from "@orbit";
import { cn } from "@/lib/utils";
type CpResultIconProps = {
  "aria-hidden"?: boolean | "true" | "false";
  ariaHidden?: boolean;
  className?: string;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
};
function makeCpResultIcon(icon: string, fallbackSize = 14) {
  return function CpResultIcon({
    "aria-hidden": ariaHiddenAttr,
    ariaHidden,
    className,
    size,
    style,
  }: CpResultIconProps) {
    const hidden =
      ariaHidden ??
      (ariaHiddenAttr === undefined
        ? true
        : ariaHiddenAttr !== false && ariaHiddenAttr !== "false");
    return (
      <span
        className={cn("inline-flex items-center justify-center", className)}
        aria-hidden={hidden}
      >
        {" "}
        <FaIcon icon={icon} size={size ?? fallbackSize} style={style} />{" "}
      </span>
    );
  };
}
export const AlertCircle = makeCpResultIcon(FA.circleExclamation);
export const AlertTriangle = makeCpResultIcon(FA.triangleExclamation);
export const ArrowRight = makeCpResultIcon("\uf061");
export const CheckCircle = makeCpResultIcon(FA.circleCheck);
export const CheckCircle2 = makeCpResultIcon(FA.circleCheck);
export const ChevronDown = makeCpResultIcon(FA.angleDown);
export const ChevronLeft = makeCpResultIcon("\uf053");
export const ChevronRight = makeCpResultIcon(FA.chevronRight);
export const Clock = makeCpResultIcon("\uf017");
export const Columns3 = makeCpResultIcon("\uf0db");
export const Copy = makeCpResultIcon("\uf0c5");
export const Download = makeCpResultIcon("\ue094");
export const Eye = makeCpResultIcon("\uf06e");
export const FileText = makeCpResultIcon("\uf15c");
export const Filter = makeCpResultIcon("\uf0b0");
export const GitCompare = makeCpResultIcon("\uf559");
export const History = makeCpResultIcon("\uf1da");
export const Info = makeCpResultIcon(FA.circleInfo);
export const Lightbulb = makeCpResultIcon("\uf0eb");
export const List = makeCpResultIcon("\uf03a");
export const Loader2 = makeCpResultIcon("\uf110");
export const MapPin = makeCpResultIcon("\uf3c5");
export const Minus = makeCpResultIcon(FA.minus);
export const Pencil = makeCpResultIcon("\uf303");
export const Pin = makeCpResultIcon("\uf08d");
export const Plus = makeCpResultIcon("\uf067");
export const RefreshCw = makeCpResultIcon("\uf2f1");
export const RotateCcw = makeCpResultIcon("\uf2f1");
export const Search = makeCpResultIcon("\uf002");
export const Settings = makeCpResultIcon("\uf013");
export const ShieldCheck = makeCpResultIcon("\uf2f7");
export const ShieldX = makeCpResultIcon("\uf2f7");
export const Sigma = makeCpResultIcon("\uf68b");
export const SlidersHorizontal = makeCpResultIcon("\uf1de");
export const Sparkles = makeCpResultIcon("\ue5d6");
export const Trash2 = makeCpResultIcon("\uf2ed");
export const Undo2 = makeCpResultIcon("\uf2ea");
export const Upload = makeCpResultIcon("\uf093");
export const X = makeCpResultIcon(FA.xmark);
export const XCircle = makeCpResultIcon("\uf057");
export const BarChart3 = makeCpResultIcon("\uf080");
export const IconArrowDown = makeCpResultIcon(FA.angleDown);
export const IconArrowUp = makeCpResultIcon(FA.angleUp);
export const IconArrowsDiff = makeCpResultIcon("\uf559");
export const IconCircleCheck = makeCpResultIcon(FA.circleCheck);
export const IconCircleX = makeCpResultIcon("\uf057");
export const IconEye = Eye;
export const IconHelp = makeCpResultIcon(FA.circleQuestion);
export const IconInfoCircle = Info;
export const IconList = List;
export const IconPlus = Plus;
export const IconTimeline = makeCpResultIcon("\uf1da");
export const IconTrendingDown = makeCpResultIcon(FA.angleDown);
export const IconTrendingUp = makeCpResultIcon(FA.angleUp);
