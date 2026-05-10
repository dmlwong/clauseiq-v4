import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  ClipboardList,
  Edit3,
  FileBarChart,
  FileCheck2,
  FileText,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { DeliveryInitiative, RagStatus, ToolIndicator } from "@/data/mock-delivery-engine";
import { StatusBadge } from "./StatusBadge";
import { RagIndicator } from "./RagIndicator";

const toolIcons = [FileText, Edit3, FileBarChart, ClipboardList, FileCheck2, BarChart3];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ToolButton({ tool, index }: { tool: ToolIndicator; index: number }) {
  const Icon = toolIcons[index % toolIcons.length];
  return (
    <button
      type="button"
      title={tool.type}
      className={cn(
        "relative grid h-8 min-h-8 w-8 min-w-8 max-w-8 shrink-0 place-items-center rounded-md border p-0 text-slate-600 transition-colors hover:bg-slate-50 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
        tool.hasActivity ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300",
      )}
    >
      <Icon className="h-4 w-4" />
      <span
        className={cn(
          "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white",
          tool.hasActivity ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
    </button>
  );
}

export function InitiativeRow({
  initiative,
  index,
  onRagChange,
}: {
  initiative: DeliveryInitiative;
  index: number;
  onRagChange: (id: string, status: RagStatus) => void;
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="grid min-h-[82px] grid-cols-[76px_minmax(300px,1fr)_190px_42px_168px_64px_66px_34px_24px] items-center gap-4 rounded-lg border border-slate-200 bg-white px-6 shadow-sm transition-colors hover:bg-slate-50/70"
    >
      <StatusBadge status={initiative.status} />

      <div className="min-w-0">
        <button
          type="button"
          onClick={() => navigate(`/delivery-engine/${initiative.id}`)}
          className="block w-full truncate text-left text-base font-medium text-slate-950 hover:text-primary"
        >
          {initiative.id} | {initiative.name}
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 text-sm text-slate-900">
        <Briefcase className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="shrink-0 text-slate-700">Led by:</span>
        <span className="truncate font-semibold">{initiative.ledBy}</span>
      </div>

      <Avatar className="h-6 w-6 border border-slate-300">
        {initiative.leadAvatarUrl && <AvatarImage src={initiative.leadAvatarUrl} alt={initiative.leadName} />}
        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
          {initials(initiative.leadName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-1.5">
        {initiative.toolIndicators.map((tool, toolIndex) => (
          <ToolButton key={tool.type} tool={tool} index={toolIndex} />
        ))}
      </div>

      <RagIndicator status={initiative.ragStatus} onChange={(status) => onRagChange(initiative.id, status)} />

      <Button
        variant="outline"
        size="sm"
        className="h-8 border-slate-400 px-5 text-sm text-slate-950"
        onClick={() => navigate(`/delivery-engine/${initiative.id}`)}
      >
        View
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 border-slate-400"
        onClick={() => toast({ title: `Edit ${initiative.id}`, description: "Edit is not implemented in this prototype." })}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>Archive</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600 focus:text-red-600">
            <MoreHorizontal className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
