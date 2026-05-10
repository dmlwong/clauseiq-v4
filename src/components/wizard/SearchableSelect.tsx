import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  required?: boolean;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tooltip?: string;
  loading?: boolean;
}

export function SearchableSelect({
  label,
  required,
  options,
  value,
  onChange,
  placeholder = "Select...",
  tooltip,
  loading,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="space-y-1.5" ref={ref}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between h-10 px-3 border border-input rounded-md bg-card text-sm hover:border-primary/40 transition-colors"
        >
          <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>
            {loading ? "Loading..." : selectedLabel || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute z-50 w-full mt-1 border border-border rounded-md bg-card shadow-lg">
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 text-center">No results</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors ${
                      opt.value === value ? "bg-accent font-medium" : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
