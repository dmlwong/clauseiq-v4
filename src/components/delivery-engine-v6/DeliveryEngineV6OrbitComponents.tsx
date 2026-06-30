import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  Dropdown,
  FaIcon,
  FileItem,
  Headings,
  IconButton,
  QuickFilterGroup,
  QuickFilterItem,
  Searchbox,
  StatusIndicator,
  Table,
  Text,
} from "@orbit";

import { showV6OrbitToast as toast } from "@/components/clauseiq-v6/V6OrbitToast";
import type {
  DeliveryDocument,
  DeliveryStatus,
  RagStatus,
  ToolCoverage,
} from "@/data/mock-delivery-engine";

type SortKey = "name" | "type" | "createdBy";
type SortDir = "asc" | "desc";

const ICON_DOWNLOAD = "\uf019";
const ICON_EXTERNAL = "\uf35d";
const ICON_FILTER = "\uf0b0";
const ICON_FILE = "\uf15b";
const ICON_REFRESH = "\uf2f1";
const ICON_SETTINGS = "\uf013";
const ICON_UPLOAD = "\uf093";

const ragOptions: Array<{ label: string; value: RagStatus }> = [
  { label: "Green", value: "green" },
  { label: "Amber", value: "amber" },
  { label: "Red", value: "red" },
];

function sortDocuments(documents: DeliveryDocument[], sortKey: SortKey, sortDir: SortDir) {
  return [...documents].sort((a, b) => {
    const aValue = String(a[sortKey]).toLowerCase();
    const bValue = String(b[sortKey]).toLowerCase();
    const direction = sortDir === "asc" ? 1 : -1;
    return aValue.localeCompare(bValue) * direction;
  });
}

function documentTypeFromName(name: string): "XLS" | "DOC" | "PDF" | "ZIP" | "IMG" | "Unknown" {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "xls" || extension === "xlsx" || extension === "csv") return "XLS";
  if (extension === "doc" || extension === "docx" || extension === "ppt" || extension === "pptx") return "DOC";
  if (extension === "pdf") return "PDF";
  if (extension === "zip") return "ZIP";
  if (extension === "png" || extension === "jpg" || extension === "jpeg" || extension === "webp") return "IMG";
  return "Unknown";
}

function initials(name?: string) {
  return (name ?? "DE")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StatusBadgeV6({ status }: { status: DeliveryStatus }) {
  return (
    <Chip
      label={status}
      size="Small"
      variant={status === "In-flight" ? "Information" : "Outline"}
    />
  );
}

export function RagIndicatorV6({
  status,
  compact = false,
  onChange,
}: {
  status: RagStatus;
  compact?: boolean;
  onChange?: (status: RagStatus) => void;
}) {
  const orbitStatus = status === "green" ? "Success" : status === "amber" ? "Warning" : "Error";
  const label = status === "green" ? "Green" : status === "amber" ? "Amber" : "Red";

  if (!onChange) {
    return (
      <StatusIndicator
        status={orbitStatus}
        size="Small"
        label={compact ? undefined : label}
        ariaLabel={`${label} RAG status`}
      />
    );
  }

  return (
    <Dropdown
      ariaLabel="RAG status"
      value={status}
      options={ragOptions}
      onChange={(value) => onChange(value as RagStatus)}
    />
  );
}

export function InfoCardV6({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card type="Static" padding="Base">
      <div className="mb-orbit-base flex items-center gap-orbit-s">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--orbit-color-chip-additional-bg)]">
          {icon}
        </span>
        <Headings size="Heading 5">
          {title}
        </Headings>
      </div>
      {children}
    </Card>
  );
}

export function MetricV6({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <Text as="p" size="Small" variant="Secondary">
        {label}
      </Text>
      <div className="mt-orbit-xs">
        <Text as="div" size="Small" variant="Bold">
          {value}
        </Text>
      </div>
    </div>
  );
}

export function CompletedToolActionCardV6({
  toolName,
  description,
  initials: avatarInitials,
  timestamp,
  downloadLabel,
  uploadLabel,
  onDownload,
  onUpload,
  onOpenResults,
}: {
  toolName: string;
  description: string;
  initials: string;
  timestamp: string;
  downloadLabel: string;
  uploadLabel: string;
  onDownload: () => void;
  onUpload: () => void;
  onOpenResults: () => void;
}) {
  return (
    <Card type="Static" padding="Small" state="Success">
      <div className="flex min-h-[192px] flex-col">
        <div className="flex items-start justify-between gap-orbit-s">
          <span className="relative grid h-10 w-10 place-items-center rounded-md border border-[var(--orbit-color-status-low-border-success)] bg-[var(--orbit-color-card-bg-default)] text-[var(--orbit-color-text-success)]">
            <FaIcon icon={ICON_FILE} size={18} />
            <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--orbit-color-status-high-bg-success)] text-white">
              <FaIcon icon="\uf00c" size={9} />
            </span>
          </span>
          <Badge label="Deliver" status="Success" />
        </div>

        <div className="mt-orbit-base">
          <Headings size="Heading 5">
            {toolName}
          </Headings>
          <div className="mt-orbit-xs min-h-[34px]">
            <Text as="p" size="Small" variant="Secondary">
              {description}
            </Text>
          </div>
        </div>

        <div className="mt-orbit-base flex items-center gap-orbit-s">
          <Avatar
            style="Text"
            name={avatarInitials}
            initials={avatarInitials}
            size="Extra Small"
            color="var(--orbit-color-efficio-dark-teal)"
          />
          <Text size="Small" variant="Secondary">
            {timestamp}
          </Text>
        </div>

        <div className="mt-auto pt-orbit-base">
          <div className="grid grid-cols-2 gap-orbit-s">
            <IconButton
              variant="Secondary"
              size="Medium"
              ariaLabel={downloadLabel}
              icon={<FaIcon icon={ICON_DOWNLOAD} />}
              onClick={onDownload}
            />
            <IconButton
              variant="Secondary"
              size="Medium"
              ariaLabel={uploadLabel}
              icon={<FaIcon icon={ICON_REFRESH} />}
              onClick={onUpload}
            />
          </div>
          <Button
            className="mt-orbit-s w-full"
            variant="Secondary"
            size="Medium"
            iconRight={<FaIcon icon={ICON_EXTERNAL} />}
            onClick={onOpenResults}
          >
            My results
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ToolCoverageCardV6({
  tool,
  index,
  onAction,
}: {
  tool: ToolCoverage;
  index: number;
  onAction?: () => void;
}) {
  const hasActivity = Boolean(tool.lastRunBy || tool.lastRunAt);
  const isDisabledPrototypeTool = tool.toolName === "RFP Builder" || tool.toolName === "RFP Analytics";
  const actionLabel = tool.ctaLabel ?? (tool.isUsed ? "Open tool" : "Run tool");
  const cardState = tool.isUsed || hasActivity ? "Success" : "Default";

  const handleAction = () => {
    if (onAction) {
      onAction();
      return;
    }

    toast({
      title: `${tool.toolName} action`,
      description: "Prototype placeholder - this tool workspace is not implemented yet.",
    });
  };

  return (
    <Card type="Static" padding="Small" state={cardState}>
      <div className="flex min-h-[192px] flex-col">
        <div className="flex items-start justify-between gap-orbit-s">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-[var(--orbit-color-card-border-default)] bg-[var(--orbit-color-chip-additional-bg)] text-[var(--orbit-color-text-info)]">
            <FaIcon icon={index % 2 === 0 ? ICON_SETTINGS : ICON_FILE} size={18} />
          </span>
          <Badge
            label={tool.statusLabel ?? "Deliver"}
            status={tool.isUsed || hasActivity ? "Success" : "Information"}
          />
        </div>

        <div className="mt-orbit-base">
          <Headings size="Heading 5">
            {tool.toolName}
          </Headings>
          <div className="mt-orbit-xs min-h-[34px]">
            <Text as="p" size="Small" variant="Secondary">
              {tool.description}
            </Text>
          </div>
        </div>

        {hasActivity ? (
          <div className="mt-orbit-base flex items-center gap-orbit-s">
            <Avatar
              style="Text"
              name={tool.lastRunBy ?? tool.toolName}
              initials={initials(tool.lastRunBy ?? tool.toolName)}
              size="Extra Small"
              color="var(--orbit-color-efficio-dark-teal)"
            />
            <Text size="Small" variant="Secondary">
              {tool.lastRunAt ?? "Recently updated"}
            </Text>
          </div>
        ) : (
          <div className="mt-orbit-base">
            <Chip
              label={tool.isPrimary ? "Primary tool" : "Optional tool"}
              size="Small"
              variant={tool.isPrimary ? "Information" : "Outline"}
            />
          </div>
        )}

        <div className="mt-auto pt-orbit-base">
          {hasActivity ? (
            <div className="grid grid-cols-2 gap-orbit-s">
              <IconButton
                variant="Secondary"
                size="Medium"
                ariaLabel={`Download latest ${tool.toolName} output`}
                icon={<FaIcon icon={ICON_DOWNLOAD} />}
                onClick={handleAction}
              />
              <IconButton
                variant="Secondary"
                size="Medium"
                ariaLabel={`Refresh ${tool.toolName}`}
                icon={<FaIcon icon={ICON_REFRESH} />}
                onClick={handleAction}
              />
            </div>
          ) : null}
          <Button
            className="w-full"
            variant={isDisabledPrototypeTool ? "Tertiary" : "Secondary"}
            size="Medium"
            disabled={isDisabledPrototypeTool}
            iconRight={<FaIcon icon={tool.isUsed || hasActivity ? ICON_EXTERNAL : ICON_UPLOAD} />}
            onClick={handleAction}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ContentSearchTableV6({ documents }: { documents: DeliveryDocument[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"general" | "training">("general");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterState, setFilterState] = useState({
    categoryCaseStudy: true,
    projectPlan: false,
    templateOnly: false,
  });
  const [page, setPage] = useState(1);

  const visibleRows = useMemo(() => {
    if (tab === "training") return [];
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? documents.filter((document) => {
          const haystack = `${document.name} ${document.type} ${document.createdBy}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        })
      : documents;
    return sortDocuments(filtered, sortKey, sortDir);
  }, [documents, query, sortDir, sortKey, tab]);

  const updateSort = (key: SortKey, direction: SortDir) => {
    setSortKey(key);
    setSortDir(direction);
  };

  return (
    <Card type="Static" padding="Base">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={() => toast({ title: "Document upload received" })}
      />

      <div className="flex flex-wrap items-start justify-between gap-orbit-base">
        <div>
          <Headings size="Heading 4">
            Content Search
          </Headings>
          <div className="mt-orbit-xs">
            <Text as="p" size="Small" variant="Secondary">
              Browse initiative content and training material
            </Text>
          </div>
        </div>
        <Button
          variant="Secondary"
          size="Medium"
          icon={<FaIcon icon={ICON_UPLOAD} />}
          onClick={() => fileRef.current?.click()}
        >
          Upload
        </Button>
      </div>

      <div className="mt-orbit-base flex flex-wrap items-center justify-between gap-orbit-base">
        <QuickFilterGroup ariaLabel="Content type">
          <QuickFilterItem label="General Docs" selected={tab === "general"} onClick={() => setTab("general")} />
          <QuickFilterItem label="Training" selected={tab === "training"} onClick={() => setTab("training")} />
        </QuickFilterGroup>

        <div className="flex min-w-[280px] flex-1 flex-wrap justify-end gap-orbit-s">
          <div className="min-w-[240px] max-w-sm flex-1">
            <Searchbox
              ariaLabel="Search content"
              placeholder="Search by Document Name"
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="Secondary"
            size="Medium"
            icon={<FaIcon icon={ICON_FILTER} />}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filter
          </Button>
        </div>
      </div>

      {filtersOpen ? (
        <div className="mt-orbit-base space-y-orbit-s rounded-md border border-[var(--orbit-color-card-border-accent)] bg-[var(--orbit-color-card-bg-accent)] p-orbit-base">
          <div className="grid gap-orbit-base sm:grid-cols-3">
            <Checkbox
              label="Category case study"
              checked={filterState.categoryCaseStudy}
              onChange={(checked) => setFilterState((state) => ({ ...state, categoryCaseStudy: checked }))}
            />
            <Checkbox
              label="Project plan"
              checked={filterState.projectPlan}
              onChange={(checked) => setFilterState((state) => ({ ...state, projectPlan: checked }))}
            />
            <Checkbox
              label="Templates only"
              checked={filterState.templateOnly}
              onChange={(checked) => setFilterState((state) => ({ ...state, templateOnly: checked }))}
            />
          </div>
          <Text as="p" size="Small" variant="Secondary">
            Prototype filters are display-only in this pass; search and sorting remain active.
          </Text>
        </div>
      ) : null}

      <div className="mt-orbit-base">
        <Table<DeliveryDocument>
          ariaLabel="Content search documents"
          density="Compact"
          variant="SeparatedRows"
          rows={visibleRows}
          getRowKey={(document) => document.name}
          emptyState={tab === "training" ? "No training documents available." : "No documents match your search."}
          columns={[
            {
              id: "name",
              header: "Document Name",
              sortable: true,
              sortDirection: sortKey === "name" ? sortDir : undefined,
              onSortChange: (direction) => updateSort("name", direction),
              render: (document) => (
                <FileItem
                  filename={document.name}
                  documentType={documentTypeFromName(document.name)}
                />
              ),
            },
            {
              id: "type",
              header: "Document Type",
              sortable: true,
              sortDirection: sortKey === "type" ? sortDir : undefined,
              onSortChange: (direction) => updateSort("type", direction),
              render: (document) => <Chip label={document.type} size="Small" variant="Outline" />,
            },
            {
              id: "template",
              header: "Template",
              width: "96px",
              render: (document) => (
                <Text size="Small" variant={document.hasTemplate ? "Bold" : "Secondary"}>
                  {document.hasTemplate ? "Yes" : "No"}
                </Text>
              ),
            },
            {
              id: "createdBy",
              header: "Created By",
              sortable: true,
              sortDirection: sortKey === "createdBy" ? sortDir : undefined,
              onSortChange: (direction) => updateSort("createdBy", direction),
              render: (document) => (
                <Text size="Small" variant="Secondary">
                  {document.createdBy}
                </Text>
              ),
            },
            {
              id: "actions",
              header: "Action",
              width: "100px",
              render: (document) => (
                <div className="flex items-center gap-orbit-xs">
                  <IconButton
                    variant="Tertiary"
                    size="Medium"
                    ariaLabel={`Download ${document.name}`}
                    icon={<FaIcon icon={ICON_DOWNLOAD} />}
                    onClick={() => toast({ title: `Downloading ${document.name}` })}
                  />
                  <IconButton
                    variant="Tertiary"
                    size="Medium"
                    ariaLabel={`Open ${document.name}`}
                    icon={<FaIcon icon={ICON_EXTERNAL} />}
                    onClick={() => toast({ title: `Opening ${document.name}` })}
                  />
                </div>
              ),
            },
          ]}
          pagination={{
            page,
            pageSize: 5,
            totalRows: visibleRows.length,
            onPageChange: setPage,
          }}
        />
      </div>
    </Card>
  );
}
