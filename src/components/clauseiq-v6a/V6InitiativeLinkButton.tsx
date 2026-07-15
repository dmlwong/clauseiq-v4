import { Link2 } from "@/components/clauseiq-v6a/v6aIcons";
import { Button } from "@/components/clauseiq-v6a/orbit-ui/button";
import { cn } from "@/lib/utils";

interface V6InitiativeLinkButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function V6InitiativeLinkButton({
  onClick,
  className,
  label = "AAK01-1442 | CheckPermissionsPart01",
}: V6InitiativeLinkButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 max-w-[320px] gap-orbit-xs px-orbit-s text-orbit-primary hover:bg-orbit-info-surface hover:text-orbit-primary",
        className,
      )}
      onClick={onClick}
    >
      <Link2 className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate text-orbit-xs font-orbit-medium">{label}</span>
    </Button>
  );
}
