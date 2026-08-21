import { Plus, Minus } from "@/components/clauseiq-v7/v7Icons";
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
    return <p className="text-orbit-xs text-orbit-fg-secondary italic">— No clause text available —</p>;
  }

  return (
    <div className="space-y-orbit-s">
      <div className="flex items-center gap-orbit-s text-orbit-xs tabular-nums uppercase text-orbit-fg-secondary">
        <span className="inline-flex items-center gap-orbit-xs">
          <Minus className="w-3 h-3 text-orbit-destructive" aria-hidden /> Removed in {leftLabel}: {removed}
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-orbit-xs">
          <Plus className="w-3 h-3 text-orbit-success" aria-hidden /> Added in {rightLabel}: {added}
        </span>
      </div>
      <p className="text-orbit-sm leading-orbit-relaxed rounded-orbit-md border border-orbit-border bg-orbit-card p-orbit-base">
        {segments.map((s, i) => {
          if (s.type === "equal") return <span key={i}>{s.text}</span>;
          if (s.type === "added") {
            // DI-13: AA-compliant pairing in dark mode — stronger fg token,
            // bolder underline marker so colour is never the sole signal.
            return (
              <span
                key={i}
                className="bg-orbit-success/25 text-orbit-fg dark:text-orbit-success underline decoration-success decoration-[3px] underline-offset-[3px] v6-orbit-weight-medium rounded-orbit-sm px-orbit-xxs"
                aria-label={`added in ${rightLabel}`}
              >
                {s.text}
              </span>
            );
          }
          return (
            <span
              key={i}
              className="bg-orbit-destructive/25 text-orbit-fg dark:text-orbit-destructive line-through decoration-destructive decoration-[3px] v6-orbit-weight-medium rounded-orbit-sm px-orbit-xxs"
              aria-label={`removed from ${leftLabel}`}
            >
              {s.text}
            </span>
          );
        })}
      </p>
      <p className="text-orbit-xs text-orbit-fg-secondary">
        <span className="text-orbit-success v6-orbit-weight-semibold">Underlined</span> = added in {rightLabel}.{" "}
        <span className="text-orbit-destructive v6-orbit-weight-semibold line-through">Strikethrough</span> = removed from {leftLabel}.
      </p>
    </div>
  );
}
