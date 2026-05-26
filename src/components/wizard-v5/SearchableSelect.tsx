import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, FaIcon, Searchbox, Text, Tooltip } from "@orbit";

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
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <div className="space-y-1.5" ref={ref}>
      <div className="flex items-center gap-1.5">
        <Text as="span" size="Small" variant="Bold">
          {label}
          {required ? " *" : ""}
        </Text>
        {tooltip ? (
          <Tooltip content={tooltip}>
            <span className="inline-flex h-4 w-4 cursor-help items-center justify-center">
              <FaIcon icon="\uf05a" size={12} color="var(--orbit-color-text-secondary)" />
            </span>
          </Tooltip>
        ) : null}
      </div>

      <div className="relative">
        <Button
          className="w-full justify-between"
          variant="Secondary"
          state={loading ? "Disabled" : "Default"}
          iconRight={<FaIcon icon={open ? "\uf077" : "\uf078"} />}
          onClick={() => setOpen((current) => !current)}
        >
          {loading ? "Loading..." : selectedLabel || placeholder}
        </Button>

        {open ? (
          <div className="absolute z-50 mt-1 w-full">
            <Card type="Static" padding="Small">
              <div className="space-y-2">
                <Searchbox
                  ariaLabel={`Search ${label}`}
                  value={search}
                  onChange={setSearch}
                  placeholder="Search..."
                />
                <div className="v5-hover-scrollbar max-h-48 space-y-1 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="p-2 text-center">
                      <Text size="Small" variant="Secondary">No results</Text>
                    </div>
                  ) : (
                    filtered.map((option) => (
                      <Button
                        key={option.value}
                        className="w-full justify-start"
                        variant={option.value === value ? "Secondary" : "Tertiary"}
                        size="Medium"
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        {option.label}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
