import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CIQ_INITIATIVES, type CiqInitiative } from "@/lib/clauseiq-v2-data";

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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-semibold">Select An Initiative</DialogTitle>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        <div className="px-6 pb-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "mine" | "team")}>
            <TabsList>
              <TabsTrigger value="mine">Mine</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search initiative..."
                  className="pl-9"
                />
              </div>
              <div className="border border-border rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead>Initiative name</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                          No initiatives match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer hover:bg-ciq-soft"
                          onClick={() => onSelect(row)}
                        >
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-muted-foreground">{row.sector}</TableCell>
                          <TableCell className="text-muted-foreground">{row.owner}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-start">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
