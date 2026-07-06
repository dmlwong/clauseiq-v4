import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        "h-8 max-w-[320px] gap-1.5 px-2 text-[#5B5BF7] hover:bg-[#E6F1FB] hover:text-[#4F46E5]",
        className,
      )}
      onClick={onClick}
    >
      <Link2 className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate text-xs font-medium">{label}</span>
    </Button>
  );
}
