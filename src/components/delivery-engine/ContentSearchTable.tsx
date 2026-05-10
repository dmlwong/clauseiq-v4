import { useMemo, useRef, useState } from "react";
import { Check, Download, Eye, FileText, Filter, Pencil, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { DeliveryDocument } from "@/data/mock-delivery-engine";

type SortKey = "name" | "type" | "createdBy";

export function ContentSearchTable({ documents }: { documents: DeliveryDocument[] }) {
  const [tab, setTab] = useState<"general" | "training">("general");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleDocs = useMemo(() => {
    if (tab === "training") return [];
    const q = query.trim().toLowerCase();
    const filtered = q ? documents.filter((doc) => doc.name.toLowerCase().includes(q)) : documents;
    return [...filtered].sort((a, b) => {
      const result = a[sortKey].localeCompare(b[sortKey]);
      return sortDir === "asc" ? result : -result;
    });
  }, [documents, query, sortDir, sortKey, tab]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortButton = ({ label, value }: { label: string; value: SortKey }) => (
    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort(value)}>
      {label}
      <span className="text-[10px] text-slate-400">↕</span>
    </button>
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-950">Content Search</h2>
        </div>
        <div className="flex rounded-md border border-slate-200 bg-slate-100 p-0.5">
          {[
            ["general", "General Docs"],
            ["training", "Training"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value as "general" | "training")}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium",
                tab === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-[248px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-8 border-slate-400 bg-white pl-9 text-xs"
            placeholder="Search by Document Name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 gap-1.5 border-slate-400 bg-white text-xs">
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 space-y-3">
              <p className="text-sm font-medium">Document Type</p>
              {["Category Case Study", "Project Plan", "Supplier Brief"].map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox />
                  {type}
                </label>
              ))}
            </PopoverContent>
          </Popover>
          <Button className="h-8 gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
        <input ref={fileRef} type="file" className="hidden" />
      </div>

      {tab === "training" ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          No training documents found
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead><SortButton label="Document Name" value="name" /></TableHead>
                <TableHead><SortButton label="Document Type" value="type" /></TableHead>
                <TableHead>Template</TableHead>
                <TableHead><SortButton label="Created By" value="createdBy" /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleDocs.map((doc) => (
                <TableRow key={doc.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-slate-900">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700">{doc.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {doc.hasTemplate ? <Check className="h-4 w-4 text-emerald-600" /> : <span className="text-slate-400">—</span>}
                  </TableCell>
                  <TableCell>{doc.createdBy}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      {[Download, Eye, Pencil].map((Icon, index) => (
                        <Button key={index} variant="ghost" size="icon" className="h-8 w-8">
                          <Icon className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>1 to {visibleDocs.length} of {visibleDocs.length} item{visibleDocs.length === 1 ? "" : "s"}</span>
            <span>View 20 ∨ &nbsp;&nbsp; Page 1 of 1</span>
          </div>
        </div>
      )}
    </section>
  );
}
