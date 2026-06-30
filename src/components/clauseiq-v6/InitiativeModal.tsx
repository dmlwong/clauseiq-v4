import { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { CIQ_INITIATIVES, type CiqInitiative } from "@/lib/clauseiq-v6-data";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (initiative: CiqInitiative) => void;
}

export function InitiativeModal({ open, onClose, onSelect }: Props) {
  const [tab, setTab] = useState<"mine" | "team">("mine");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CIQ_INITIATIVES.filter((i) => i.scope === tab).filter(
      (i) => !q || i.name.toLowerCase().includes(q) || i.sector.toLowerCase().includes(q) || i.owner.toLowerCase().includes(q),
    );
  }, [tab, query]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-orbit-none z-50 bg-slate-950/45" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-64px)] w-[min(1120px,calc(100vw-64px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white text-slate-950 shadow-2xl focus:outline-none"
          aria-label="Select An Initiative"
          aria-describedby={undefined}
        >
          <header className="flex h-[84px] shrink-0 items-center border-b border-[#dfe5ee] px-orbit-m">
            <DialogPrimitive.Title className="v6-orbit-heading-1 pr-[calc(var(--orbit-space-xxl)+var(--orbit-space-s))]">
              Select An Initiative
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="absolute right-[calc(var(--orbit-space-base)+var(--orbit-space-xs))] top-[calc(var(--orbit-space-base)+var(--orbit-space-xs))] grid h-10 w-10 place-items-center rounded-md text-[#666] transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6257ff]"
              aria-label="Close select initiative modal"
            >
              <X className="h-7 w-7" strokeWidth={2.4} />
            </DialogPrimitive.Close>
          </header>

          <div className="flex h-[86px] shrink-0 items-stretch justify-between gap-orbit-m border-b border-[#dfe5ee] px-orbit-m">
            <div className="flex items-end gap-[calc(var(--orbit-space-s)+var(--orbit-space-xs))]" role="tablist" aria-label="Initiative scope">
              <ScopeTab label="Mine" value="mine" active={tab === "mine"} onSelect={setTab} />
              <ScopeTab label="Team" value="team" active={tab === "team"} onSelect={setTab} />
            </div>

            <div className="flex min-w-[280px] flex-1 items-center justify-end">
              <label
                className="relative block h-11 w-full max-w-[480px] rounded-md border border-[#93a1b6] bg-white focus-within:border-[#6257ff] focus-within:ring-2 focus-within:ring-[#6257ff]/20"
                htmlFor="initiative-search"
              >
                <span className="sr-only">Search initiative</span>
                <input
                  id="initiative-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search initiative..."
                  className="h-full w-full rounded-md border-0 bg-transparent pl-orbit-base pr-orbit-xxl text-base leading-none text-slate-950 outline-none placeholder:text-[#4b586d]"
                />
                <Search className="pointer-events-none absolute right-orbit-base top-1/2 h-5 w-5 -translate-y-1/2 text-[#070c26]" strokeWidth={2.4} />
              </label>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-orbit-m pb-orbit-m pt-orbit-m">
            <div className="grid grid-cols-[minmax(260px,1fr)_minmax(160px,0.34fr)_minmax(140px,0.24fr)] gap-orbit-m px-orbit-base pb-orbit-base text-base v6-orbit-weight-semibold leading-none text-black">
              <div>Initiative name</div>
              <div>Sector</div>
              <div>Owner</div>
            </div>

            {rows.length > 0 ? (
              <div className="space-y-[calc(var(--orbit-space-s)+var(--orbit-space-xs))]" role="list" aria-label="Available ClauseIQ initiatives">
                {rows.map((initiative) => (
                  <button
                    key={initiative.id}
                    type="button"
                    className="grid min-h-14 w-full grid-cols-[minmax(260px,1fr)_minmax(160px,0.34fr)_minmax(140px,0.24fr)] items-center gap-orbit-m rounded-md border border-[#dfe6ee] bg-white px-orbit-base text-left text-base leading-tight transition-colors hover:border-[#93a1b6] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6257ff]"
                    aria-label={`Select ${initiative.name}`}
                    onClick={() => onSelect(initiative)}
                  >
                    <span className="min-w-0 truncate v6-orbit-weight-regular text-black">{initiative.name}</span>
                    <span className="min-w-0 truncate v6-orbit-weight-regular text-[#475569]">{initiative.sector}</span>
                    <span className="min-w-0 truncate v6-orbit-weight-regular text-[#475569]">{initiative.owner}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-[#dfe6ee] px-orbit-base py-orbit-l text-center text-sm text-[#475569]">
                No initiatives match your search.
              </div>
            )}
          </div>

          <footer className="flex h-[72px] shrink-0 items-center border-t border-[#dfe5ee] px-orbit-m">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#8fa0b8] bg-white px-[calc(var(--orbit-space-base)+var(--orbit-space-xs))] text-base v6-orbit-weight-regular leading-none text-[#475569] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6257ff]"
              onClick={onClose}
            >
              Cancel
            </button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ScopeTab({
  label,
  value,
  active,
  onSelect,
}: {
  label: string;
  value: "mine" | "team";
  active: boolean;
  onSelect: (value: "mine" | "team") => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        "relative h-[56px] px-orbit-base pb-orbit-base text-lg v6-orbit-weight-regular leading-none text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6257ff]",
        active && "v6-orbit-weight-bold",
      )}
      onClick={() => onSelect(value)}
    >
      {label}
      {active && <span className="absolute inset-x-orbit-none bottom-orbit-none h-1 rounded-full bg-[#6257ff]" />}
    </button>
  );
}
