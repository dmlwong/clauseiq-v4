import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BarChart3, FileText, Filter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { V2Shell } from "@/components/clauseiq-v2/V2Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { getDeliveryInitiatives, type RagStatus } from "@/data/mock-delivery-engine";
import { InitiativeRow } from "@/components/delivery-engine/InitiativeRow";

const PAGE_SIZE = 10;

export default function DeliveryEnginePage() {
  const navigate = useNavigate();
  const [initiatives, setInitiatives] = useState(() => getDeliveryInitiatives());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showMine, setShowMine] = useState(false);
  const [createdByFilters, setCreatedByFilters] = useState(["Yorkshire Water", "Efficio"]);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return initiatives.filter((initiative) => {
      if (q && !initiative.id.toLowerCase().includes(q) && !initiative.name.toLowerCase().includes(q)) return false;
      if (showMine && !initiative.isMine) return false;
      if (createdByFilters.length > 0 && !createdByFilters.includes(initiative.ledBy)) return false;
      return true;
    });
  }, [createdByFilters, debouncedSearch, initiatives, showMine]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
    setPageInput("1");
  }, [createdByFilters, debouncedSearch, showMine]);

  const updateRag = (id: string, ragStatus: RagStatus) => {
    setInitiatives((items) => items.map((item) => item.id === id ? { ...item, ragStatus } : item));
  };

  const setPageSafely = (next: number) => {
    const value = Math.min(Math.max(1, next), totalPages);
    setPage(value);
    setPageInput(String(value));
  };

  return (
    <V2Shell
      title="Delivery Engine"
      subtitle="Manage and track procurement initiatives end-to-end"
      titleIcon={
        <div className="grid h-10 w-10 place-items-center rounded bg-primary text-primary-foreground">
          <SlidersHorizontal className="h-5 w-5" />
        </div>
      }
      headerRight={
        <Button className="h-8 gap-1.5 px-4" onClick={() => toast({ title: "Add Initiative", description: "Creation flow is not implemented yet." })}>
          <Plus className="h-4 w-4" />
          Add Initiative
        </Button>
      }
    >
      <div className="min-h-full bg-slate-50 px-8 py-6">
        <div className="mx-auto max-w-[1152px] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-[240px]">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <Input
                  className="h-8 border-slate-400 bg-white pr-9 text-sm"
                  placeholder="Search for initiative"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onInput={(event) => setSearch((event.target as HTMLInputElement).value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-950">
                <Switch checked={showMine} onCheckedChange={setShowMine} className="h-5 w-9 data-[state=checked]:bg-slate-700 [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4" />
                Show My Initiatives
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 gap-1.5 border-slate-400 bg-white text-sm" onClick={() => toast({ title: "Guidance panel coming soon" })}>
                <FileText className="h-4 w-4" />
                Guidance
              </Button>
              <Button variant="outline" className="h-8 gap-1.5 border-slate-400 bg-white text-sm" onClick={() => toast({ title: "Reporting coming soon" })}>
                <BarChart3 className="h-4 w-4" />
                Reporting
              </Button>
              <Button variant="outline" className="h-8 gap-1.5 border-slate-400 bg-white text-sm" onClick={() => toast({ title: "Filter panel coming soon" })}>
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {createdByFilters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-2"
              >
                <AnimatePresence initial={false}>
                  {createdByFilters.map((filterValue) => (
                    <motion.button
                      key={filterValue}
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setCreatedByFilters((filters) => filters.filter((value) => value !== filterValue))}
                      className="inline-flex h-6 items-center gap-1 rounded-full border border-slate-300 bg-white px-2 text-xs text-slate-900"
                    >
                      Created By: {filterValue}
                      <X className="h-3 w-3" />
                    </motion.button>
                  ))}
                </AnimatePresence>
                <button
                  type="button"
                  className="inline-flex h-6 items-center gap-1 px-3 text-sm text-primary hover:underline"
                  onClick={() => setCreatedByFilters([])}
                >
                  Clear All
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="space-y-2">
            <AnimatePresence mode="popLayout">
              {rows.map((initiative, index) => (
                <InitiativeRow
                  key={initiative.id}
                  initiative={initiative}
                  index={index}
                  onRagChange={updateRag}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          <div className="flex items-center justify-between pt-2 text-sm text-slate-600">
            <span>{start} to {end} of {filtered.length} items</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8" disabled={currentPage === 1} onClick={() => setPageSafely(currentPage - 1)}>
                Previous
              </Button>
              <Input
                className="h-8 w-12 text-center"
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onBlur={() => setPageSafely(Number(pageInput) || 1)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setPageSafely(Number(pageInput) || 1);
                }}
              />
              <span>of {totalPages} pages</span>
              <Button variant="outline" size="sm" className="h-8" disabled={currentPage === totalPages} onClick={() => setPageSafely(currentPage + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </V2Shell>
  );
}
