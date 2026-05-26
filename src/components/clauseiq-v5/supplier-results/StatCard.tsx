import { Card, Text } from "@orbit";

interface Props {
  label: string;
  value: number | string;
  className?: string;
}

export function StatCard({ label, value, className }: Props) {
  const content = (
    <Card type="Static" padding="Small" state="Accent">
      <Text as="div" size="Small" variant="Secondary">
        {label}
      </Text>
      <div className="mt-orbit-xs text-2xl font-medium tabular-nums text-[var(--orbit-color-text-primary)]">
        {value}
      </div>
    </Card>
  );

  if (!className) return content;

  return <div className={className}>{content}</div>;
}
