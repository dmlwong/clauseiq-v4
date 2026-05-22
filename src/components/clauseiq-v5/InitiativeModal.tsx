import { useMemo, useState, type MouseEvent } from "react";
import { Search } from "lucide-react";
import { Headings, Table as OrbitTable, Text } from "@orbit";
import { V5OrbitOverlay } from "@/components/clauseiq-v5/V5OrbitOverlay";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/clauseiq-v5/orbit-ui/tabs";
import { Input } from "@/components/clauseiq-v5/orbit-ui/input";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { CIQ_INITIATIVES, type CiqInitiative } from "@/lib/clauseiq-v4-data";

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
  const initiativeColumns = [
    {
      id: "name",
      header: "Initiative name",
      render: (row: CiqInitiative) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: "sector",
      header: "Sector",
      render: (row: CiqInitiative) => <span className="text-muted-foreground">{row.sector}</span>,
    },
    {
      id: "owner",
      header: "Owner",
      render: (row: CiqInitiative) => <span className="text-muted-foreground">{row.owner}</span>,
    },
  ];
  const handleInitiativeTableClick = (event: MouseEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest("tbody tr");
    const body = row?.parentElement;
    if (!row || !body) return;

    const rowIndex = Array.from(body.children).indexOf(row);
    const initiative = rows[rowIndex];
    if (initiative) onSelect(initiative);
  };

  return (
    <V5OrbitOverlay
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="Select An Initiative"
      size="Large"
      footer={<Button variant="outline" onClick={onClose}>Cancel</Button>}
    >
        <div className="space-y-4">
          <div className="sr-only">
            <Headings size="Heading 4">Select An Initiative</Headings>
            <Text size="Small" variant="Secondary" as="p">Choose an initiative for ClauseIQ analysis.</Text>
          </div>
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
              <div className="max-h-[320px] overflow-y-auto" onClick={handleInitiativeTableClick}>
                <OrbitTable
                  ariaLabel="Available ClauseIQ initiatives"
                  columns={initiativeColumns}
                  rows={rows}
                  getRowKey={(row) => row.id}
                  onRowSelect={onSelect}
                  density="Compact"
                  emptyState={<div className="py-6 text-center text-sm text-muted-foreground">No initiatives match your search.</div>}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </V5OrbitOverlay>
  );
}
