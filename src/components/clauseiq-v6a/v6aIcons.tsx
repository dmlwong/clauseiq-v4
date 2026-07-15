import * as React from "react";
import { FaIcon } from "@orbit";

/**
 * Orbit-backed icon set for clauseiq-v6a.
 *
 * Replaces `lucide-react` with the Orbit `FaIcon` (Font Awesome 6 Pro, loaded
 * via the Orbit design system). Each export is a drop-in, lucide-compatible
 * component: it accepts `className` (for colour via `text-*`, plus margins /
 * positioning / animation) and derives its glyph size from the `h-*` utility
 * (or an explicit `size` prop). Colour cascades through `currentColor`, so the
 * existing `text-orbit-*` classes keep working unchanged.
 *
 * Glyphs are FA6 Pro codepoints, each visually verified to render in the loaded
 * font. A few (marked `900`) only exist in the Solid weight.
 */

const SIZE_BY_CLASS: Record<string, number> = {
  "h-2": 8,
  "h-2.5": 10,
  "h-3": 12,
  "h-3.5": 14,
  "h-4": 16,
  "h-5": 20,
  "h-6": 24,
  "h-7": 28,
  "h-8": 32,
  "h-9": 36,
  "h-10": 40,
  "h-12": 48,
  "h-14": 56,
  "h-16": 64,
};

function sizeFromClassName(className: string | undefined, explicit: number | undefined): number {
  if (typeof explicit === "number") return explicit;
  if (className) {
    for (const token of className.split(/\s+/)) {
      if (token in SIZE_BY_CLASS) return SIZE_BY_CLASS[token];
    }
  }
  return 16;
}

export interface IconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Pixel size override; when omitted it is read from the `h-*` class (default 16). */
  size?: number;
  /** Accepted for lucide API compatibility; ignored (FA glyphs have no stroke width). */
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  color?: string;
}

/** Build a lucide-compatible icon from a FA6 Pro codepoint. */
function makeIcon(codepoint: number, weight: 400 | 900 = 400) {
  const glyph = String.fromCodePoint(codepoint);
  const Icon = React.forwardRef<HTMLSpanElement, IconProps>(function OrbitIcon(
    { className, size, style, color, strokeWidth: _sw, absoluteStrokeWidth: _asw, ...rest },
    ref,
  ) {
    return (
      <span
        ref={ref}
        className={className}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }}
        {...rest}
      >
        <FaIcon
          icon={glyph}
          size={sizeFromClassName(className, size)}
          color={color ?? "currentColor"}
          style={weight === 900 ? { fontWeight: 900 } : undefined}
        />
      </span>
    );
  });
  return Icon;
}

export const AlertCircle = makeIcon(0xf06a);
export const AlertTriangle = makeIcon(0xf071);
export const ArrowDown = makeIcon(0xf063);
export const ArrowDownRight = makeIcon(0xe093);
export const ArrowRight = makeIcon(0xf061);
export const ArrowUp = makeIcon(0xf062);
export const ArrowUpRight = makeIcon(0xe09f);
export const BadgeCheck = makeIcon(0xf336);
export const Ban = makeIcon(0xf05e);
export const BarChart2 = makeIcon(0xf080);
export const BarChart3 = makeIcon(0xe0e3);
export const Bell = makeIcon(0xf0f3);
export const BookOpen = makeIcon(0xf518);
export const Building2 = makeIcon(0xf1ad);
export const Check = makeIcon(0xf00c);
export const CheckCircle2 = makeIcon(0xf058);
export const ChevronDown = makeIcon(0xf078);
export const ChevronLeft = makeIcon(0xf053);
export const ChevronRight = makeIcon(0xf054);
export const ChevronUp = makeIcon(0xf077);
export const ClipboardList = makeIcon(0xf46d);
export const Clock = makeIcon(0xf017);
export const Columns3 = makeIcon(0xf0db);
export const Database = makeIcon(0xf1c0);
export const Download = makeIcon(0xf019);
export const ExternalLink = makeIcon(0xf08e);
export const Eye = makeIcon(0xf06e);
export const FilePlus2 = makeIcon(0xe494);
export const FileText = makeIcon(0xf15c);
export const FolderKanban = makeIcon(0xf07b);
export const GitCompare = makeIcon(0xe13a);
export const History = makeIcon(0xf1da);
export const Home = makeIcon(0xf015);
export const Info = makeIcon(0xf05a);
export const Leaf = makeIcon(0xf06c);
export const Lightbulb = makeIcon(0xf0eb);
export const Link2 = makeIcon(0xf0c1);
export const List = makeIcon(0xf03a);
export const ListChecks = makeIcon(0xf0ae);
export const Loader2 = makeIcon(0xf110);
export const MapPin = makeIcon(0xf3c5);
export const Minus = makeIcon(0xf068);
export const Pencil = makeIcon(0xf303);
export const Pin = makeIcon(0xf08d);
export const Play = makeIcon(0xf04b);
export const Plus = makeIcon(0xf067);
export const RotateCcw = makeIcon(0xf0e2);
export const RotateCw = makeIcon(0xf01e);
export const Route = makeIcon(0xf4d7);
export const Scale = makeIcon(0xf24e);
export const Search = makeIcon(0xf002);
export const ShieldCheck = makeIcon(0xf2f7);
export const ShieldX = makeIcon(0xf057);
export const Sigma = makeIcon(0xf68b);
export const SlidersHorizontal = makeIcon(0xf1de);
export const Sparkles = makeIcon(0xf890);
export const Target = makeIcon(0xf140);
export const Trash2 = makeIcon(0xf2ed);
export const Upload = makeIcon(0xf093);
export const X = makeIcon(0xf00d);
