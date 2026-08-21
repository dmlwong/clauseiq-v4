import { useMemo, useState } from "react";
import { Search } from "@/components/clauseiq-v7/v7Icons";
import { V6OrbitOverlay } from "@/components/clauseiq-v7/V6OrbitOverlay";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/clauseiq-v7/orbit-ui/tabs";
import { Input } from "@/components/clauseiq-v7/orbit-ui/input";
import { Button } from "@/components/clauseiq-v7/orbit-ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/clauseiq-v7/orbit-ui/table";
import { CIQ_INITIATIVES, type CiqInitiative } from "@/lib/clauseiq-v7-data";

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
    <V6OrbitOverlay
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Select An Initiative"
      size="Large"
      modalKey="select-initiative"
      footer={
        <div className="flex justify-start">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as "mine" | "team")}>
        <TabsList>
          <TabsTrigger value="mine">Mine</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-orbit-base">
          <div className="relative mb-orbit-s">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orbit-fg-secondary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search initiative..."
              className="pl-9"
            />
          </div>
          <div className="border border-orbit-border rounded-orbit-lg overflow-hidden max-h-[320px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-orbit-surface/50 sticky top-0">
                <TableRow>
                  <TableHead>Initiative name</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-orbit-fg-secondary py-orbit-m">
                      No initiatives match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-orbit-primary-soft"
                      onClick={() => onSelect(row)}
                    >
                      <TableCell className="font-orbit-medium">{row.name}</TableCell>
                      <TableCell className="text-orbit-fg-secondary">{row.sector}</TableCell>
                      <TableCell className="text-orbit-fg-secondary">{row.owner}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </V6OrbitOverlay>
  );
}
