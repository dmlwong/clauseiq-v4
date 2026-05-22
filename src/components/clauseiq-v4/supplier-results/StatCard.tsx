import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number | string;
  className?: string;
}

export function StatCard({ label, value, className }: Props) {
  return (
    <div className={cn("rounded-lg bg-muted/45 p-[16px]", className)}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-medium tabular-nums text-foreground">{value}</div>
    </div>
  );
}
