import { useMemo, useState } from "react";
import { Button, Card, Chip, FA, FaIcon, Headings, IconButton, PageHeader, StatusIndicator, Table, Text, type TableColumn } from "@orbit";
import { CiqSidebar } from "@/components/clauseiq-v6a/CiqSidebar";
import { V6OrbitRoot } from "@/components/clauseiq-v6a/V6OrbitRoot";
import { V6OrbitOverlay } from "@/components/clauseiq-v6a/V6OrbitOverlay";
import { showV6OrbitToast } from "@/components/clauseiq-v6a/V6OrbitToast";
import { Input } from "@/components/clauseiq-v6a/orbit-ui/input";
import { Textarea } from "@/components/clauseiq-v6a/orbit-ui/textarea";
import "@/components/playbook-management/playbook-management.css";

type ProcessingStatus = "processing" | "ready" | "failed";
type PublicationStatus = "draft" | "published" | null;
type SortColumn = "name" | "company" | "category" | "agreementType" | "entity" | "governingLaw" | "processingStatus" | "publicationStatus" | "createdAt";
type SortDirection = "asc" | "desc";

interface Clause {
  id: string;
  name: string;
  subClauseName: string;
  description: string;
  bestPractice: string;
}

interface Playbook {
  id: string;
  name: string;
  company: string;
  category: string;
  agreementType: string;
  entity: string;
  governingLaw: string;
  processingStatus: ProcessingStatus;
  publicationStatus: PublicationStatus;
  createdAt: string;
  contractTemplate: string;
  clauses: Clause[];
}

const baseClauses = (): Clause[] => [
  { id: "clause-1", name: "Confidentiality", subClauseName: "Non-Disclosure Obligations", description: "Obligations of receiving party to protect confidential information.", bestPractice: "Require mutual NDA with 3-year survival period." },
  { id: "clause-2", name: "Confidentiality", subClauseName: "Permitted Disclosures", description: "Circumstances in which confidential information may lawfully be shared with third parties.", bestPractice: "Limit to legal advisers and regulators; notify the disclosing party where permitted." },
  { id: "clause-3", name: "Liability", subClauseName: "Limitation of Liability", description: "Caps on the total financial liability of each party under the agreement.", bestPractice: "Cap at 12 months of fees paid. Carve out fraud and death or personal injury." },
  { id: "clause-4", name: "Termination", subClauseName: "Termination for Convenience", description: "Notice period and process for ending the agreement without cause.", bestPractice: "Minimum 30 days written notice. No termination fee after the initial term." },
  { id: "clause-5", name: "Data Protection", subClauseName: "Data Processing", description: "Requirements for handling personal data in accordance with applicable data protection laws.", bestPractice: "Specify controller and processor responsibilities, security measures, and audit rights." },
  { id: "clause-6", name: "Data Protection", subClauseName: "International Transfers", description: "Controls for transferring personal data outside the country of origin.", bestPractice: "Require approved transfer mechanisms and documented safeguards before any transfer." },
  { id: "clause-7", name: "Intellectual Property", subClauseName: "Ownership of Deliverables", description: "Allocation of ownership rights in work product and materials created under the agreement.", bestPractice: "Assign bespoke deliverables to the customer while retaining supplier background IP." },
  { id: "clause-8", name: "Intellectual Property", subClauseName: "Licence Grant", description: "Scope and limitations of the licence granted for each party's intellectual property.", bestPractice: "Use a non-exclusive, non-transferable licence limited to the agreement term and purpose." },
  { id: "clause-9", name: "Fees and Payment", subClauseName: "Invoicing", description: "Timing, content, and delivery requirements for invoices.", bestPractice: "Invoice monthly in arrears with sufficient detail for the customer to validate charges." },
  { id: "clause-10", name: "Fees and Payment", subClauseName: "Late Payment", description: "Consequences and remedies where an undisputed payment is not made on time.", bestPractice: "Allow interest only after written notice and a reasonable cure period." },
  { id: "clause-11", name: "Service Levels", subClauseName: "Performance Standards", description: "Measurable standards for service availability, response times, and quality.", bestPractice: "Define service levels with clear measurement methods and monthly reporting." },
  { id: "clause-12", name: "Service Levels", subClauseName: "Service Credits", description: "Credits or other remedies available if agreed service levels are not achieved.", bestPractice: "Make credits the primary remedy, with escalation for persistent material failures." },
  { id: "clause-13", name: "Compliance", subClauseName: "Anti-Bribery", description: "Obligations to comply with anti-bribery, anti-corruption, and sanctions laws.", bestPractice: "Include audit and termination rights for material compliance breaches." },
  { id: "clause-14", name: "General", subClauseName: "Assignment", description: "Rules governing transfer of rights or obligations to another party.", bestPractice: "Prohibit assignment without consent, except to affiliates or on a change of control." },
];

const createPlaybook = (item: Omit<Playbook, "clauses" | "contractTemplate">, index: number): Playbook => ({
  ...item,
  contractTemplate: `Contract_${123 + index}_ABC.pdf`,
  clauses: baseClauses(),
});

const INITIAL_PLAYBOOKS: Playbook[] = [
  createPlaybook({ id: "pb-dpa", name: "Data Processing Agreement", company: "Initech", category: "Finance", agreementType: "MSA", entity: "FHLR", governingLaw: "United Kingdom", processingStatus: "processing", publicationStatus: null, createdAt: "2024-12-15" }, 0),
  createPlaybook({ id: "pb-nda", name: "Vendor NDA — EMEA", company: "Initech", category: "Finance", agreementType: "SOW", entity: "GOODS", governingLaw: "Italy", processingStatus: "failed", publicationStatus: null, createdAt: "2024-12-14" }, 1),
  createPlaybook({ id: "pb-supplier", name: "Supplier Onboarding Terms", company: "Initech", category: "Finance", agreementType: "SOW", entity: "FHLR", governingLaw: "Japan", processingStatus: "ready", publicationStatus: "draft", createdAt: "2024-12-15" }, 2),
  createPlaybook({ id: "pb-consultancy", name: "Consultancy Framework", company: "Globex", category: "Technology", agreementType: "OOA", entity: "GOODS", governingLaw: "United Kingdom", processingStatus: "ready", publicationStatus: "draft", createdAt: "2024-12-13" }, 3),
  createPlaybook({ id: "pb-msa", name: "Master Services Agreement", company: "Initech", category: "Finance", agreementType: "MSA", entity: "FHLR", governingLaw: "Italy", processingStatus: "ready", publicationStatus: "published", createdAt: "2024-12-11" }, 4),
  createPlaybook({ id: "pb-licence", name: "Software Licence — Standard", company: "Globex", category: "Technology", agreementType: "MSA", entity: "GOODS", governingLaw: "Japan", processingStatus: "ready", publicationStatus: "published", createdAt: "2024-12-09" }, 5),
  createPlaybook({ id: "pb-marketing-services", name: "Marketing Services Agreement", company: "Umbrella", category: "Marketing", agreementType: "MSA", entity: "FHLR", governingLaw: "United Kingdom", processingStatus: "processing", publicationStatus: null, createdAt: "2024-12-08" }, 6),
  createPlaybook({ id: "pb-professional-services", name: "Professional Services SOW", company: "Globex", category: "Technology", agreementType: "SOW", entity: "GOODS", governingLaw: "Italy", processingStatus: "ready", publicationStatus: "draft", createdAt: "2024-12-07" }, 7),
  createPlaybook({ id: "pb-reseller", name: "Reseller Agreement", company: "Initech", category: "Sales", agreementType: "OOA", entity: "FHLR", governingLaw: "Japan", processingStatus: "ready", publicationStatus: "published", createdAt: "2024-12-06" }, 8),
  createPlaybook({ id: "pb-cloud-hosting", name: "Cloud Hosting Terms", company: "Globex", category: "Technology", agreementType: "MSA", entity: "GOODS", governingLaw: "United Kingdom", processingStatus: "failed", publicationStatus: null, createdAt: "2024-12-05" }, 9),
  createPlaybook({ id: "pb-recruitment", name: "Recruitment Agency Terms", company: "Umbrella", category: "People", agreementType: "SOW", entity: "FHLR", governingLaw: "Italy", processingStatus: "ready", publicationStatus: "draft", createdAt: "2024-12-04" }, 10),
  createPlaybook({ id: "pb-security", name: "Information Security Addendum", company: "Initech", category: "Security", agreementType: "OOA", entity: "GOODS", governingLaw: "Japan", processingStatus: "ready", publicationStatus: "published", createdAt: "2024-12-03" }, 11),
  createPlaybook({ id: "pb-logistics", name: "Logistics Services Agreement", company: "Globex", category: "Operations", agreementType: "MSA", entity: "FHLR", governingLaw: "United Kingdom", processingStatus: "processing", publicationStatus: null, createdAt: "2024-12-02" }, 12),
  createPlaybook({ id: "pb-consultancy-sow", name: "Consultancy Statement of Work", company: "Umbrella", category: "Professional Services", agreementType: "SOW", entity: "GOODS", governingLaw: "Italy", processingStatus: "ready", publicationStatus: "draft", createdAt: "2024-12-01" }, 13),
  createPlaybook({ id: "pb-partner", name: "Channel Partner Agreement", company: "Initech", category: "Sales", agreementType: "OOA", entity: "FHLR", governingLaw: "Japan", processingStatus: "ready", publicationStatus: "published", createdAt: "2024-11-30" }, 14),
  createPlaybook({ id: "pb-support", name: "Support and Maintenance Terms", company: "Globex", category: "Technology", agreementType: "MSA", entity: "GOODS", governingLaw: "United Kingdom", processingStatus: "failed", publicationStatus: null, createdAt: "2024-11-29" }, 15),
];

const processingRank: Record<ProcessingStatus, number> = { processing: 0, ready: 1, failed: 2 };
const publicationRank: Record<Exclude<PublicationStatus, null>, number> = { draft: 1, published: 2 };
const playbookIcons = { pen: "\uf304", trash: "\uf2ed", more: "\uf142" };
const duration = 4000;

function toast(title: string, description?: string) {
  showV6OrbitToast({ title, description, variant: "success", duration });
}

function ProcessingBadge({ status, published }: { status: ProcessingStatus; published: boolean }) {
  if (published) return <span className="playbook-dash" aria-label="Not applicable">—</span>;
  if (status === "processing") return <Chip label="Processing" variant="No Status" />;
  if (status === "failed") return <Chip label="Failed" variant="Error" />;
  return <Chip label="Ready for Review" variant="Warning" />;
}

function PublicationBadge({ status, ready }: { status: PublicationStatus; ready: boolean }) {
  if (!ready) return <span className="playbook-dash" aria-label="Not applicable">—</span>;
  return status === "published"
    ? <Chip label="Published" variant="Success" />
    : <Chip label="Draft" variant="Warning" />;
}

function Dialog({ open, title, titleMeta, titleAction, onClose, children, footer, wide = false }: { open: boolean; title: string; titleMeta?: React.ReactNode; titleAction?: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  return (
    <V6OrbitOverlay
      open={open}
      onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}
      title={title}
      titleAction={titleAction}
      titleMeta={titleMeta}
      footer={footer}
      size="Large"
      height={wide ? "Viewport" : "Content"}
      modalKey={wide ? "playbook-review" : "playbook-dialog"}
      maxWidth={wide ? 1160 : 560}
    >
      <div data-prototype="playbook-management" data-theme="orbit">{children}</div>
    </V6OrbitOverlay>
  );
}

export default function PlaybookManagement() {
  const [playbooks, setPlaybooks] = useState(INITIAL_PLAYBOOKS);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingClauseId, setEditingClauseId] = useState<string | "new" | null>(null);
  const [clauseForm, setClauseForm] = useState<Omit<Clause, "id">>({ name: "", subClauseName: "", description: "", bestPractice: "" });
  const [clauseErrors, setClauseErrors] = useState<Partial<Record<keyof Omit<Clause, "id">, string>>>({});

  const reviewPlaybook = playbooks.find((playbook) => playbook.id === reviewId) ?? null;
  const renamePlaybook = playbooks.find((playbook) => playbook.id === renameId) ?? null;
  const deletePlaybook = playbooks.find((playbook) => playbook.id === deleteId) ?? null;
  const duplicateName = Boolean(renamePlaybook && renameValue.trim() && renameValue.trim().toLocaleLowerCase() !== renamePlaybook.name.toLocaleLowerCase() && playbooks.some((playbook) => playbook.id !== renamePlaybook.id && playbook.name.toLocaleLowerCase() === renameValue.trim().toLocaleLowerCase()));

  const sortedPlaybooks = useMemo(() => {
    if (!sort) return playbooks;
    const factor = sort.direction === "asc" ? 1 : -1;
    return playbooks.map((playbook, index) => ({ playbook, index })).sort((left, right) => {
      const a = left.playbook;
      const b = right.playbook;
      let comparison = 0;
      if (sort.column === "processingStatus") comparison = processingRank[a.processingStatus] - processingRank[b.processingStatus];
      else if (sort.column === "publicationStatus") comparison = (a.publicationStatus ? publicationRank[a.publicationStatus] : 0) - (b.publicationStatus ? publicationRank[b.publicationStatus] : 0);
      else if (sort.column === "createdAt") comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else comparison = a[sort.column].localeCompare(b[sort.column]);
      return comparison === 0 ? left.index - right.index : comparison * factor;
    }).map(({ playbook }) => playbook);
  }, [playbooks, sort]);

  const openRename = (playbook: Playbook) => { setMenuId(null); setRenameId(playbook.id); setRenameValue(playbook.name); };
  const openReview = (playbook: Playbook) => { setMenuId(null); setReviewId(playbook.id); setEditingClauseId(null); };
  const closeReview = () => { setEditingClauseId(null); setReviewId(null); };

  const saveRename = () => {
    if (!renamePlaybook || !renameValue.trim()) return;
    setPlaybooks((current) => current.map((playbook) => playbook.id === renamePlaybook.id ? { ...playbook, name: renameValue.trim() } : playbook));
    setRenameId(null);
    toast("Playbook renamed successfully");
  };
  const retry = (playbook: Playbook) => {
    setPlaybooks((current) => current.map((item) => item.id === playbook.id ? { ...item, processingStatus: "processing" } : item));
    setMenuId(null);
    toast("Retry started", `${playbook.name} is processing again`);
  };
  const deletePlaybookConfirm = () => {
    if (!deletePlaybook) return;
    setPlaybooks((current) => current.filter((playbook) => playbook.id !== deletePlaybook.id));
    setDeleteId(null);
    toast("Playbook deleted successfully");
  };
  const publish = () => {
    if (!reviewPlaybook) return;
    setPlaybooks((current) => current.map((playbook) => playbook.id === reviewPlaybook.id ? { ...playbook, publicationStatus: "published" } : playbook));
    closeReview();
  };
  const savePublished = () => { closeReview(); toast("Playbook changes saved"); };
  const openClauseEditor = (clause: Clause | null) => {
    setClauseErrors({});
    setEditingClauseId(clause?.id ?? "new");
    setClauseForm(clause ? { name: clause.name, subClauseName: clause.subClauseName, description: clause.description, bestPractice: clause.bestPractice } : { name: "", subClauseName: "", description: "", bestPractice: "" });
  };
  const saveClause = () => {
    if (!reviewPlaybook) return;
    const nextErrors = (Object.entries(clauseForm) as [keyof Omit<Clause, "id">, string][]).reduce<Partial<Record<keyof Omit<Clause, "id">, string>>>((errors, [key, value]) => {
      if (!value.trim()) errors[key] = "This field is required.";
      return errors;
    }, {});
    if (Object.keys(nextErrors).length) { setClauseErrors(nextErrors); return; }
    if (editingClauseId === "new") { setEditingClauseId(null); return; }
    setPlaybooks((current) => current.map((playbook) => playbook.id !== reviewPlaybook.id ? playbook : {
      ...playbook,
      clauses: playbook.clauses.map((clause) => clause.id === editingClauseId ? { ...clause, ...clauseForm } : clause),
    }));
    setEditingClauseId(null);
  };
  const deleteClause = (clauseId: string) => {
    if (!reviewPlaybook) return;
    setPlaybooks((current) => current.map((playbook) => playbook.id !== reviewPlaybook.id ? playbook : { ...playbook, clauses: playbook.clauses.filter((clause) => clause.id !== clauseId) }));
    if (editingClauseId === clauseId) setEditingClauseId(null);
    toast("Clause deleted successfully");
  };

  const tableColumns: TableColumn<Playbook>[] = [
    { id: "name", header: "Playbook Name", width: "260px", sortable: true, sortDirection: sort?.column === "name" ? sort.direction : undefined, onSortChange: (direction) => setSort({ column: "name", direction }), render: (playbook) => <div className="playbook-name"><span>{playbook.name}</span><IconButton variant="Tertiary" size="Medium" ariaLabel={"Rename " + playbook.name} icon={<FaIcon icon={playbookIcons.pen} size={12} />} onClick={() => openRename(playbook)} /></div> },
    { id: "company", header: "Company", width: "110px", sortable: true, sortDirection: sort?.column === "company" ? sort.direction : undefined, onSortChange: (direction) => setSort({ column: "company", direction }), render: (playbook) => playbook.company },
    { id: "category", header: "Category", width: "108px", sortable: true, sortDirection: sort?.column === "category" ? sort.direction : undefined, onSortChange: (direction) => setSort({ column: "category", direction }), render: (playbook) => <Chip label={playbook.category} variant="Information" /> },
    { id: "agreementType", header: "Agreement Type", width: "118px", sortable: true, sortDirection: sort?.column === "agreementType" ? sort.direction : undefined, onSortChange: (direction) => setSort({ column: "agreementType", direction }), render: (playbook) => <Chip label={playbook.agreementType} variant="Information" /> },
    { id: "entity", header: "Entity", width: "84px", sortable: true, sortDirection: sort?.column === "entity" ? sort.direction : undefined, onSortChange: (direction) => setSort({ column: "entity", direction }), render: (playbook) => playbook.entity },
    { id: "governingLaw", header: "Governing Law", width: "142px", sortable: true, sortDirection: sort?.column === "governingLaw" ? sort.direction : undefined, onSortChange: (direction) => setSort({ column: "governingLaw", direction }), render: (playbook) => playbook.governingLaw },
    { id: "processingStatus", header: "Processing Status", width: "165px", sortable: true, sortDirection: sort?.column === "processingStatus" ? sort.direction : undefined, onSortChange: (direction) => setSort({ column: "processingStatus", direction }), info: "Whether AI generation has finished. Clears once the playbook is published.", render: (playbook) => <ProcessingBadge status={playbook.processingStatus} published={playbook.publicationStatus === "published"} /> },
    { id: "publicationStatus", header: "Publication Status", width: "145px", sortable: true, sortDirection: sort?.column === "publicationStatus" ? sort.direction : undefined, onSortChange: (direction) => setSort({ column: "publicationStatus", direction }), info: "Only Published playbooks can be selected in ClauseIQ.", render: (playbook) => <PublicationBadge status={playbook.publicationStatus} ready={playbook.processingStatus === "ready"} /> },
    { id: "createdAt", header: "Date Created", width: "105px", sortable: true, sortDirection: sort?.column === "createdAt" ? sort.direction : undefined, onSortChange: (direction) => setSort({ column: "createdAt", direction }), render: (playbook) => <span className="playbook-date">{playbook.createdAt.replaceAll("-", "/")}</span> },
    { id: "actions", header: <span className="sr-only">Actions</span>, width: "136px", render: (playbook) => <div className="playbook-row-actions">{playbook.processingStatus === "failed" ? <Button variant="Secondary" size="Medium" onClick={() => retry(playbook)}>Retry</Button> : playbook.processingStatus === "ready" ? <Button variant={playbook.publicationStatus === "published" ? "Secondary" : "Primary"} size="Medium" onClick={() => openReview(playbook)}>{playbook.publicationStatus === "published" ? "Open" : "Review"}</Button> : null}<div className="playbook-menu-anchor"><IconButton variant="Tertiary" size="Medium" ariaLabel={"More actions for " + playbook.name} icon={<FaIcon icon={playbookIcons.more} size={13} />} onClick={() => setMenuId(menuId === playbook.id ? null : playbook.id)} />{menuId === playbook.id ? <div className="playbook-menu" role="menu"><button type="button" role="menuitem" onClick={() => openRename(playbook)}>Rename</button>{playbook.publicationStatus === "published" ? <button type="button" role="menuitem" onClick={() => setMenuId(null)}>Move back to draft</button> : null}<hr /><button className="danger" type="button" role="menuitem" onClick={() => { setMenuId(null); setDeleteId(playbook.id); }}>{playbook.processingStatus === "processing" ? "Cancel & delete" : "Delete"}</button></div> : null}</div></div> },
  ];
  const clauseColumns: TableColumn<Clause>[] = [
    { id: "name", header: "Clause Name", width: "18%", render: (clause) => clause.name },
    { id: "subClauseName", header: "Sub-Clause Name", width: "28%", render: (clause) => clause.subClauseName },
    { id: "description", header: "Sub-Clause Description", render: (clause) => clause.description },
    { id: "actions", header: <span className="sr-only">Actions</span>, width: "96px", render: (clause) => <div className="playbook-clause-actions"><IconButton variant="Secondary" size="Medium" ariaLabel={"Edit " + clause.subClauseName} icon={<FaIcon icon={playbookIcons.pen} size={12} />} onClick={() => openClauseEditor(clause)} /><IconButton variant="Secondary" size="Medium" ariaLabel={"Delete " + clause.subClauseName} icon={<FaIcon icon={playbookIcons.trash} size={12} />} onClick={() => deleteClause(clause.id)} /></div> },
  ];

  return (
    <V6OrbitRoot prototypeId="playbook-management" showInspector={false}>
      <div className="playbook-shell">
        <aside className="playbook-sidebar"><CiqSidebar prototype="v6a" activeArea="data-tracker" /></aside>
        <div className="playbook-main-shell">
          <header className="playbook-page-header"><PageHeader type="tool" title="Data Tracker & Insights" subtitle="Here's your overview for today" icon="\uf1c0" /></header>
          <nav className="playbook-tabs" aria-label="Data Tracker views"><button type="button">Insights</button><button type="button" className="active" aria-current="page">Data Overview</button></nav>
          <main className="playbook-page">
            <Card type="Static" padding="Base" state="Default" className="playbook-card">
              <div className="playbook-card-head">
                <div><Headings size="Heading 3">Best Practice Library</Headings><Text as="p" variant="Secondary" size="Body" className="playbook-subtitle">Manage your contract playbooks.</Text></div>
                <div className="playbook-actions"><Button variant="Secondary" size="Medium">+ Add Parameters</Button><Button variant="Primary" size="Medium">+ Add Playbook</Button></div>
              </div>
              <Card type="Static" padding="Base" state="Accent" className="playbook-guidance">
                  <div className="playbook-guidance-heading"><FaIcon icon={FA.circleInfo} size={16} color="var(--orbit-color-text-secondary)" /><Text as="p" size="Paragraph" variant="Bold">Only playbooks with a publication status of Published can be selected in ClauseIQ.</Text></div>
                  <div className="playbook-status-groups"><div><Text as="p" size="Small" variant="Bold">Processing Status</Text><StatusIndicator size="Small" status="No Status" label="Processing — still being generated." /><StatusIndicator size="Small" status="Warning" label="Ready for Review — generated successfully." /><StatusIndicator size="Small" status="Error" label="Failed — couldn't be generated." /></div>
                    <div><Text as="p" size="Small" variant="Bold">Publication Status</Text><StatusIndicator size="Small" status="Warning" label="Draft — not available in ClauseIQ." /><StatusIndicator size="Small" status="Success" label="Published — available in ClauseIQ." /></div></div>
              </Card>
              <div className="playbook-table-wrap" data-playbook-table>
                <Table ariaLabel="Best Practice Library" columns={tableColumns} rows={sortedPlaybooks} getRowKey={(playbook) => playbook.id} density="Compact" />
              </div>
            </Card>
          </main>
        </div>
      </div>

      <Dialog open={Boolean(renamePlaybook)} title="Rename Playbook" onClose={() => setRenameId(null)} footer={<div className="playbook-footer-split"><Button variant="Secondary" size="Medium" onClick={() => setRenameId(null)}>Close</Button><Button variant="Primary" size="Medium" onClick={saveRename}>{duplicateName ? "Save anyway" : "Save"}</Button></div>}>
        <label className="playbook-field"><span>Playbook name</span><Input className="playbook-rename-input" autoFocus aria-label="Playbook name" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /></label>
        {duplicateName ? <div className="playbook-warning">A playbook named <b>“{renameValue.trim()}”</b> already exists. Two playbooks with the same name are hard to tell apart when selecting one in ClauseIQ.</div> : null}
      </Dialog>

      <Dialog open={Boolean(deletePlaybook)} title="Delete playbook?" onClose={() => setDeleteId(null)} footer={<div className="playbook-footer-right"><Button variant="Secondary" size="Medium" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="Destructive" size="Medium" onClick={deletePlaybookConfirm}>Delete playbook</Button></div>}>
        <Text as="p" size="Body" variant="Secondary">Delete <b>{deletePlaybook?.name}</b>? This can't be undone — you'd need to upload and convert the document again.</Text>
        {deletePlaybook?.publicationStatus === "published" ? <div className="playbook-danger-note">This playbook is <b>Published</b> and may be selected by colleagues in ClauseIQ right now. Consider Move back to draft instead of deleting.</div> : null}
      </Dialog>

      <Dialog open={Boolean(reviewPlaybook)} wide title={reviewPlaybook?.name ?? "Review playbook"} titleAction={reviewPlaybook ? <IconButton variant="Tertiary" size="Medium" ariaLabel="Rename playbook" icon={<FaIcon icon={playbookIcons.pen} size={12} />} onClick={() => { closeReview(); openRename(reviewPlaybook); }} /> : undefined} titleMeta={reviewPlaybook ? <Chip label={reviewPlaybook.publicationStatus === "published" ? "Published" : "Draft"} variant={reviewPlaybook.publicationStatus === "published" ? "Success" : "Warning"} /> : undefined} onClose={closeReview} footer={<div className="playbook-footer-split"><Button variant="Secondary" size="Medium" onClick={closeReview}>Close</Button>{reviewPlaybook?.publicationStatus === "published" ? <Button variant="Primary" size="Medium" onClick={savePublished}>Save Changes</Button> : <Button variant="Primary" size="Medium" onClick={publish}>Publish</Button>}</div>}>
        {reviewPlaybook ? <div className={`playbook-review ${editingClauseId ? "editing" : ""}`}>
          <section className="playbook-review-main"><div className="playbook-review-toolbar"><div className="playbook-review-meta"><Chip label={"Contract Template: " + reviewPlaybook.contractTemplate} variant="No Status" /><Chip label={"Category: " + reviewPlaybook.category} variant="No Status" /><Chip label={"Company: " + reviewPlaybook.company} variant="No Status" /><Chip label={"Agreement Type: " + reviewPlaybook.agreementType} variant="No Status" /><Chip label={"Entity: " + reviewPlaybook.entity} variant="No Status" /><Chip label={"Governing Law: " + reviewPlaybook.governingLaw} variant="No Status" /></div><div className="playbook-review-actions"><Button variant="Secondary" size="Medium" onClick={() => openClauseEditor(null)}>+ Add Clause</Button></div></div>
          <div className="playbook-clause-table-wrap"><Table ariaLabel="Playbook clauses" columns={clauseColumns} rows={reviewPlaybook.clauses} getRowKey={(clause) => clause.id} density="Compact" /></div></section>
          {editingClauseId ? <aside className="playbook-clause-editor"><div className="playbook-editor-head"><Headings size="Heading 5">{editingClauseId === "new" ? "Add Clause" : "Edit Clause"}</Headings><div><Button variant="Secondary" size="Medium" onClick={() => setEditingClauseId(null)}>Cancel</Button><Button variant="Primary" size="Medium" onClick={saveClause}>{editingClauseId === "new" ? "Add Clause" : "Save Changes"}</Button></div></div>
            {([ ["name", "Clause Name", 60], ["subClauseName", "Sub-Clause Name", 90], ["description", "Sub-Clause Description", 300], ["bestPractice", "Best Practice", 500] ] as const).map(([field, label, maxLength]) => <label className="playbook-field" key={field}><span>{label}<em>*</em></span>{field === "description" || field === "bestPractice" ? <Textarea hideCharacterCount aria-label={label} maxLength={maxLength} value={clauseForm[field]} onChange={(event) => setClauseForm((current) => ({ ...current, [field]: event.target.value }))} /> : <Input aria-label={label} maxLength={maxLength} value={clauseForm[field]} onChange={(event) => setClauseForm((current) => ({ ...current, [field]: event.target.value }))} />}{clauseErrors[field] ? <small className="error">{clauseErrors[field]}</small> : null}</label>)}</aside> : null}
        </div> : null}
      </Dialog>
    </V6OrbitRoot>
  );
}
