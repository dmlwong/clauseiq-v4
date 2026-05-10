import { motion } from "framer-motion";
import { Download, ExternalLink, FileText, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { ToolCoverage } from "@/data/mock-delivery-engine";

export function ToolCoverageCard({ tool, index, onAction }: { tool: ToolCoverage; index: number; onAction?: () => void }) {
  const hasActivity = Boolean(tool.lastRunBy || tool.lastRunAt);
  const actionLabel = tool.ctaLabel ?? (tool.isUsed ? "Open Analysis" : "Run Tool");
  const ActionIcon = actionLabel.toLowerCase().startsWith("open") ? ExternalLink : Play;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, boxShadow: "0 10px 24px rgba(15, 23, 42, 0.10)" }}
      transition={{ duration: 0.18, delay: index * 0.08 }}
      className={cn(
        "flex min-h-[216px] flex-col rounded-lg border bg-white p-3",
        hasActivity ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-100" : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("grid h-8 w-8 place-items-center rounded-md", hasActivity ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
          <FileText className="h-4 w-4" />
        </div>
        <Badge className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-50">
          {tool.statusLabel ?? "Deliver"}
        </Badge>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-950">{tool.toolName}</h3>
        <p className="mt-1 min-h-[34px] text-xs text-slate-500">{tool.description}</p>
      </div>

      {hasActivity && (
        <div className="mt-4 rounded-md border border-slate-200 bg-white/80 p-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                {tool.lastRunBy?.split(" ").map((p) => p[0]).join("").slice(0, 2) ?? "DE"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-900">{tool.lastRunBy}</p>
              <p className="text-[11px] text-slate-500">{tool.lastRunAt}</p>
            </div>
            <div className="ml-auto flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button
        variant={tool.isPrimary ? "default" : "outline"}
        className={cn(
          "mt-auto h-8 gap-1.5 text-xs",
          !tool.isPrimary && "border-transparent bg-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-500",
        )}
        onClick={onAction ?? (() => toast({ title: `Launching ${tool.toolName}...` }))}
      >
        <ActionIcon className="h-3.5 w-3.5" />
        {actionLabel}
      </Button>
    </motion.div>
  );
}
