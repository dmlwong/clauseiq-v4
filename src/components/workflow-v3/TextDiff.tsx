import { Plus, Minus } from "lucide-react";
import { diffWords } from "@/lib/text-diff";

interface Props {
  prev?: string;
  curr?: string;
  leftLabel: string;
  rightLabel: string;
}

/**
 * Accessible inline word-level diff (TASK-06 / DI-01).
 * Uses label, icon, and tint together so colour is never the only signal.
 */
export function TextDiff({ prev, curr, leftLabel, rightLabel }: Props) {
  const segments = diffWords(prev ?? "", curr ?? "");
  const removed = segments.filter((s) => s.type === "removed").length;
  const added = segments.filter((s) => s.type === "added").length;

  if (!prev && !curr) {
    return <p className="text-xs text-muted-foreground italic">— No clause text available —</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Minus className="w-3 h-3 text-destructive" aria-hidden /> Removed in {leftLabel}: {removed}
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1">
          <Plus className="w-3 h-3 text-success" aria-hidden /> Added in {rightLabel}: {added}
        </span>
      </div>
      <p className="text-sm leading-relaxed font-serif rounded-md border border-border bg-card p-3">
        {segments.map((s, i) => {
          if (s.type === "equal") return <span key={i}>{s.text}</span>;
          if (s.type === "added") {
            // DI-13: AA-compliant pairing in dark mode — stronger fg token,
            // bolder underline marker so colour is never the sole signal.
            return (
              <span
                key={i}
                className="bg-success/25 text-foreground dark:text-success underline decoration-success decoration-[3px] underline-offset-[3px] font-medium rounded-sm px-0.5"
                aria-label={`added in ${rightLabel}`}
              >
                {s.text}
              </span>
            );
          }
          return (
            <span
              key={i}
              className="bg-destructive/25 text-foreground dark:text-destructive line-through decoration-destructive decoration-[3px] font-medium rounded-sm px-0.5"
              aria-label={`removed from ${leftLabel}`}
            >
              {s.text}
            </span>
          );
        })}
      </p>
      <p className="text-[11px] text-muted-foreground">
        <span className="text-success font-semibold">Underlined</span> = added in {rightLabel}.{" "}
        <span className="text-destructive font-semibold line-through">Strikethrough</span> = removed from {leftLabel}.
      </p>
    </div>
  );
}
