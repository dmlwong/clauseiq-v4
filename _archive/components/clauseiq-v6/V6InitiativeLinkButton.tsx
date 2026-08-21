import { Link2 } from "lucide-react";
import { Button } from "@/components/clauseiq-v6/orbit-ui/button";
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
      className={cn(
        "max-w-[min(42vw,420px)] gap-orbit-s text-[#5B5BF7] hover:bg-[#E6F1FB] hover:text-[#4F46E5]",
        className,
      )}
      onClick={onClick}
    >
      <Link2 className="h-4 w-4 shrink-0" />
      <span className="truncate v6-orbit-weight-medium">{label}</span>
    </Button>
  );
}
