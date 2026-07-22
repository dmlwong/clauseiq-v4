import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Table, Text, type TableColumn } from "@orbit";
import { Button } from "@/components/clauseiq-v6a/orbit-ui/button";
import { Searchbox } from "@/components/clauseiq-v6a/orbit-ui/searchbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/clauseiq-v6a/orbit-ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/clauseiq-v6a/orbit-ui/tooltip";
import { V6OrbitOverlay } from "@/components/clauseiq-v6a/V6OrbitOverlay";
import { BarChart2, Download, FileText } from "@/components/clauseiq-v6a/v6aIcons";
import type { ClauseAnalysis, Supplier } from "@/data/mock-clauseiq-v6";
import { formatClauseIqTimestamp } from "@/lib/clauseiq-v6a-format";
import { getSupplierScorePresentationByAnalysisId, type OutputScorePresentation } from "./OutputSummaryMetrics";
import type { SupplierOutputSelection } from "./types";

type HistorySort = "uploaded-newest" | "uploaded-oldest" | "score-highest" | "score-lowest" | "version-newest" | "version-oldest";

interface SupplierOutputHistoryOverlayProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: () => void;
  onViewResult?: (selection?: SupplierOutputSelection) => void;
  showComparisonStatus: boolean;
}

interface HistoryRow {
  analysis: ClauseAnalysis;
  version: number;
  score?: OutputScorePresentation;
}

export function SupplierOutputHistoryOverlay({
  supplier,
  open,
  onOpenChange,
  onDownload,
  onViewResult,
  showComparisonStatus,
}: SupplierOutputHistoryOverlayProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<HistorySort>("uploaded-newest");

  useEffect(() => {
    setQuery("");
    setSort("uploaded-newest");
  }, [open, supplier?.id]);

  const rows = useMemo(() => {
    if (!supplier) return [];

    const chronological = [...supplier.analyses].sort(
      (a, b) => Date.parse(a.analysedAt) - Date.parse(b.analysedAt),
    );
    const scoresByAnalysisId = getSupplierScorePresentationByAnalysisId(chronological);
    const searchableRows = chronological
      .map((analysis, index) => ({
        analysis,
        version: index + 1,
        score: scoresByAnalysisId[analysis.id],
      }))
      .filter(({ analysis }) => analysis.fileName.toLowerCase().includes(query.trim().toLowerCase()));

    return [...searchableRows].sort((left, right) => compareHistoryRows(left, right, sort));
  }, [query, sort, supplier]);

  const columns = useMemo<TableColumn<HistoryRow>[]>(
    () => [
      {
        id: "version",
        header: "Version",
        width: "92px",
        render: ({ version }) => (
          <span className="rounded-orbit-sm bg-orbit-surface px-orbit-s py-orbit-xxs v6-orbit-text-small v6-orbit-weight-medium">
            v{version}
          </span>
        ),
      },
      {
        id: "fileName",
        header: "File name",
        width: "28%",
        render: ({ analysis }) => (
          <span className="flex min-w-[180px] items-center gap-orbit-s v6-orbit-weight-medium">
            <FileText className="h-4 w-4 shrink-0 text-orbit-fg-secondary" aria-hidden="true" />
            <span className="truncate">{analysis.fileName}</span>
          </span>
        ),
      },
      {
        id: "uploaded",
        header: "Uploaded",
        width: "210px",
        render: ({ analysis }) => (
          <span className="whitespace-nowrap text-orbit-fg-secondary">
            {formatClauseIqTimestamp(analysis.analysedAt)}
          </span>
        ),
      },
      {
        id: "score",
        header: "Score",
        width: "82px",
        render: ({ score }) => (
          <span className="whitespace-nowrap v6-orbit-weight-medium">
            {typeof score?.score === "number" ? score.score : "—"}
          </span>
        ),
      },
      {
        id: "findings",
        header: "Findings",
        width: "220px",
        render: ({ analysis, version }) => (
          <span className="whitespace-nowrap text-orbit-fg-secondary">
            <FindingsSummary
              analysis={analysis}
              hasPreviousOutput={version > 1}
              showComparisonStatus={showComparisonStatus}
            />
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        width: "104px",
        render: ({ analysis, version }) => (
          <div className="flex justify-end gap-orbit-xs">
            <HistoryActionButton
              label={`View Results: ${analysis.fileName}`}
              onClick={() => {
                const previousAnalysis = supplier?.analyses
                  .slice()
                  .sort((a, b) => Date.parse(a.analysedAt) - Date.parse(b.analysedAt))[version - 2];
                if (supplier) onViewResult?.({ supplier, analysis, previousAnalysis });
              }}
            >
              <BarChart2 className="h-3.5 w-3.5" />
            </HistoryActionButton>
            <HistoryActionButton label={`Download: ${analysis.fileName}`} onClick={onDownload}>
              <Download className="h-3.5 w-3.5" />
            </HistoryActionButton>
          </div>
        ),
      },
    ],
    [onDownload, onViewResult, showComparisonStatus, supplier],
  );

  if (!supplier) return null;

  return (
    <V6OrbitOverlay
      open={open}
      onOpenChange={onOpenChange}
      title={`${supplier.name} — output history`}
      size="Large"
      height="Viewport"
      modalKey="supplier-output-history"
    >
      <div className="space-y-orbit-base">
        <Text size="Small" variant="Secondary" as="p">
          {supplier.analyses.length} {supplier.analyses.length === 1 ? "output is" : "outputs are"} retained in this supplier&apos;s analysis history.
        </Text>
        <div className="flex flex-col gap-orbit-s sm:flex-row sm:items-center">
          <Searchbox
            className="w-full sm:max-w-[240px]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search file names"
            aria-label="Search supplier output history"
          />
          <div className="w-full sm:ml-auto sm:w-[220px]">
            <Select value={sort} onValueChange={(value) => setSort(value as HistorySort)}>
              <SelectTrigger className="w-full clauseiq-v6-select-left" aria-label="Sort supplier output history">
                <SelectValue placeholder="Sort outputs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uploaded-newest">Newest uploaded</SelectItem>
                <SelectItem value="uploaded-oldest">Oldest uploaded</SelectItem>
                <SelectItem value="score-highest">Highest score</SelectItem>
                <SelectItem value="score-lowest">Lowest score</SelectItem>
                <SelectItem value="version-newest">Newest version</SelectItem>
                <SelectItem value="version-oldest">Oldest version</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table
          columns={columns}
          rows={rows}
          getRowKey={({ analysis }) => analysis.id}
          ariaLabel={`${supplier.name} output history`}
          density="Compact"
          emptyState="No outputs match this file name."
        />
      </div>
    </V6OrbitOverlay>
  );
}

function compareHistoryRows(left: HistoryRow, right: HistoryRow, sort: HistorySort) {
  switch (sort) {
    case "uploaded-oldest":
      return Date.parse(left.analysis.analysedAt) - Date.parse(right.analysis.analysedAt);
    case "score-highest":
      return (right.score?.score ?? -Infinity) - (left.score?.score ?? -Infinity);
    case "score-lowest":
      return (left.score?.score ?? Infinity) - (right.score?.score ?? Infinity);
    case "version-newest":
      return right.version - left.version;
    case "version-oldest":
      return left.version - right.version;
    case "uploaded-newest":
    default:
      return Date.parse(right.analysis.analysedAt) - Date.parse(left.analysis.analysedAt);
  }
}

function FindingsSummary({
  analysis,
  hasPreviousOutput,
  showComparisonStatus,
}: {
  analysis: ClauseAnalysis;
  hasPreviousOutput: boolean;
  showComparisonStatus: boolean;
}) {
  if (showComparisonStatus && hasPreviousOutput) {
    const notMet = analysis.deviations.high + analysis.deviations.medium + analysis.deviations.low + analysis.deviations.missing;
    return <>Met {analysis.deviations.none} · Not met {notMet}</>;
  }

  return <>Missing {analysis.deviations.missing}</>;
}

function HistoryActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          className="h-7 w-7 px-orbit-none"
          aria-label={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="v6-orbit-text-small">
        {label.split(":")[0]}
      </TooltipContent>
    </Tooltip>
  );
}
