import { Link2 } from "lucide-react";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { cn } from "@/lib/utils";

interface V5InitiativeLinkButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function V5InitiativeLinkButton({
  onClick,
  className,
  label = "AAK01-1442 | CheckPermissionsPart01",
}: V5InitiativeLinkButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "max-w-[min(42vw,420px)] gap-2 text-[#5B5BF7] hover:bg-[#E6F1FB] hover:text-[#4F46E5]",
        className,
      )}
      onClick={onClick}
    >
      <Link2 className="h-4 w-4 shrink-0" />
      <span className="truncate font-medium">{label}</span>
    </Button>
  );
}
