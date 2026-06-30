import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
} from "lucide-react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react";

import { V6Shell } from "@/components/clauseiq-v6/V6Shell";
import { Button } from "@/components/clauseiq-v6/orbit-ui/button";
import { Card, Chip, Text } from "@orbit";
import { cn } from "@/lib/utils";

type SeverityTier = "high" | "medium" | "low";
type VariantKey = "row-scale" | "section-nav" | "inline-diff";

interface DeviationClause {
  id: string;
  tier: SeverityTier;
  title: string;
  section: string;
  category: string;
  summary: string;
  original: string;
  proposed: string;
  issueCount: number;
}

interface SeverityToken {
  label: string;
  color: string;
  pillBackground: string;
  pillText: string;
  rowWash?: string;
  icon: ComponentType<{ className?: string }>;
}

const severityTokens: Record<SeverityTier, SeverityToken> = {
  high: {
    label: "High",
    color: "#A32D2D",
    pillBackground: "#A32D2D",
    pillText: "#FFFFFF",
    rowWash: "rgba(163, 45, 45, 0.04)",
    icon: IconAlertTriangle,
  },
  medium: {
    label: "Medium",
    color: "#BA7517",
    pillBackground: "#BA7517",
    // #BA7517 with white text is 3.72:1, so the prototype uses dark text to satisfy WCAG AA for 11px labels.
    pillText: "#251607",
    icon: IconAlertCircle,
  },
  low: {
    label: "Low",
    color: "#888780",
    pillBackground: "#F1EFE8",
    pillText: "#4F4D48",
    icon: IconInfoCircle,
  },
};

const variants: Array<{ key: VariantKey; label: string }> = [
  { key: "row-scale", label: "A · Row scale" },
  { key: "section-nav", label: "B · Section nav" },
  { key: "inline-diff", label: "C · Inline diff" },
];

const fullInteractionPath =
  "/initiatives-v6?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";

const highClauses: DeviationClause[] = [
  {
    id: "C14",
    tier: "high",
    title: "Limitation of liability",
    section: "§14.2",
    category: "Liability",
    summary: "Supplier caps all liability at one month of fees, leaving uncapped operational and regulatory exposure.",
    original:
      "The supplier's aggregate liability shall not exceed fees paid in the month preceding the claim. No carve-outs apply except for unpaid invoices.",
    proposed:
      "Cap ordinary liability at twelve months of fees and carve out confidentiality, data protection, IP infringement, fraud, wilful misconduct, and indemnity obligations.",
    issueCount: 3,
  },
  {
    id: "C16",
    tier: "high",
    title: "Indemnification",
    section: "§16.1",
    category: "Buyer remedies",
    summary: "Supplier indemnity is limited to third-party IP claims and excludes data, personnel, and compliance losses.",
    original:
      "Supplier will defend customer against third-party claims alleging that the service infringes intellectual property rights.",
    proposed:
      "Supplier will indemnify buyer for IP infringement, data breach, confidentiality breach, regulatory penalties caused by supplier acts, and personnel injury claims.",
    issueCount: 3,
  },
  {
    id: "C18",
    tier: "high",
    title: "Termination for convenience",
    section: "§18.1",
    category: "Termination",
    summary: "Buyer cannot exit for convenience, while supplier can terminate with short notice after the first renewal.",
    original:
      "Supplier may terminate this agreement for convenience on thirty days' written notice after the initial term.",
    proposed:
      "Buyer may terminate for convenience on sixty days' notice after transition obligations are agreed; supplier convenience termination requires buyer consent.",
    issueCount: 2,
  },
];

const mediumClauses: DeviationClause[] = [
  {
    id: "C07",
    tier: "medium",
    title: "Payment terms",
    section: "§7.4",
    category: "Commercial",
    summary: "Payment is due within 15 days, shorter than the 45-day benchmark for this supplier segment.",
    original: "Invoices are payable within fifteen days of receipt unless otherwise stated on the invoice.",
    proposed: "Invoices are payable within forty-five days of receipt of a valid invoice and supporting purchase order reference.",
    issueCount: 2,
  },
  {
    id: "C03",
    tier: "medium",
    title: "Auto-renewal",
    section: "§3.2",
    category: "Term",
    summary: "Renewal is automatic unless buyer gives notice 120 days before expiry.",
    original: "The agreement renews for successive one-year periods unless either party gives 120 days' prior notice.",
    proposed: "Renewal requires buyer approval or, at minimum, a 30-day notice window with supplier reminder obligations.",
    issueCount: 2,
  },
  {
    id: "C20",
    tier: "medium",
    title: "Force majeure",
    section: "§20",
    category: "Risk allocation",
    summary: "Force majeure relief is broad and has no mitigation or notification requirement.",
    original: "Neither party is liable for delay caused by events beyond reasonable control.",
    proposed: "Relief applies only where the affected party promptly notifies, mitigates impact, and resumes performance as soon as practicable.",
    issueCount: 2,
  },
  {
    id: "C12",
    tier: "medium",
    title: "IP ownership",
    section: "§12",
    category: "Intellectual property",
    summary: "Developed materials are assigned to supplier even when buyer funds the work.",
    original: "All deliverables and related intellectual property remain the property of supplier.",
    proposed: "Buyer owns buyer-funded deliverables, with supplier retaining background IP and granting a perpetual use licence where needed.",
    issueCount: 2,
  },
  {
    id: "C11",
    tier: "medium",
    title: "Confidentiality term",
    section: "§11.5",
    category: "Confidentiality",
    summary: "Confidentiality expires after two years and does not treat trade secrets separately.",
    original: "Confidentiality obligations survive for two years after termination.",
    proposed: "Confidentiality survives for five years, while trade secrets remain protected for as long as they retain trade secret status.",
    issueCount: 1,
  },
  {
    id: "C05",
    tier: "medium",
    title: "Service levels",
    section: "§5",
    category: "Performance",
    summary: "Service credits are discretionary and there is no chronic failure termination trigger.",
    original: "Supplier may provide service credits where service levels are not met.",
    proposed: "Service credits are automatic and repeated failures give buyer a termination right without early exit fees.",
    issueCount: 2,
  },
  {
    id: "C13",
    tier: "medium",
    title: "Audit rights",
    section: "§13",
    category: "Governance",
    summary: "Audit rights require supplier consent and are limited to once every two years.",
    original: "Buyer may audit supplier records with supplier approval no more than once every two years.",
    proposed: "Buyer may audit relevant records annually and after material incidents on reasonable notice.",
    issueCount: 2,
  },
  {
    id: "C17",
    tier: "medium",
    title: "Insurance",
    section: "§17",
    category: "Risk allocation",
    summary: "Insurance coverage does not include cyber or professional liability.",
    original: "Supplier will maintain commercially reasonable general liability insurance.",
    proposed: "Supplier will maintain general liability, professional liability, cyber, employer's liability, and workers compensation insurance.",
    issueCount: 2,
  },
  {
    id: "C15",
    tier: "medium",
    title: "Data protection",
    section: "§15",
    category: "Control and compliance",
    summary: "Data processing terms are referenced but not attached to the contract.",
    original: "Supplier will comply with applicable data protection laws and its standard data handling practices.",
    proposed: "Attach the data processing agreement, security schedule, subprocessors list, and breach notification commitments.",
    issueCount: 3,
  },
  {
    id: "C09",
    tier: "medium",
    title: "Warranties",
    section: "§9",
    category: "Performance",
    summary: "Warranties are limited to conformance with documentation and exclude fit-for-purpose commitments.",
    original: "Supplier warrants the services will materially conform to the applicable documentation.",
    proposed: "Supplier warrants conformance with specifications, applicable law, security requirements, and agreed business purpose.",
    issueCount: 2,
  },
  {
    id: "C10",
    tier: "medium",
    title: "Subcontracting",
    section: "§10",
    category: "Control and compliance",
    summary: "Supplier can appoint subcontractors without buyer notice or objection rights.",
    original: "Supplier may use subcontractors to perform any portion of the services.",
    proposed: "Supplier must notify buyer of material subcontractors and remains fully liable for subcontractor acts and omissions.",
    issueCount: 2,
  },
  {
    id: "C06",
    tier: "medium",
    title: "Assignment",
    section: "§6",
    category: "Governance",
    summary: "Supplier may assign the agreement to affiliates without notice.",
    original: "Supplier may assign this agreement to an affiliate or successor without buyer consent.",
    proposed: "Assignment requires buyer consent except for solvent group reorganisations with prior notice and no adverse impact.",
    issueCount: 1,
  },
];

const lowClauses: DeviationClause[] = [
  {
    id: "C22",
    tier: "low",
    title: "Notices",
    section: "§22.1",
    category: "Administration",
    summary: "Notice addresses need updating to the current buyer entity.",
    original: "Notices must be sent to the addresses stated in the signature block.",
    proposed: "Update notice addresses to the current buyer legal entity and procurement inbox.",
    issueCount: 1,
  },
  {
    id: "C19",
    tier: "low",
    title: "Governing law",
    section: "§19.3",
    category: "Legal boilerplate",
    summary: "Governing law references the previous operating jurisdiction.",
    original: "This agreement is governed by the laws of New York.",
    proposed: "Confirm the preferred governing law for this procurement and update the jurisdiction reference.",
    issueCount: 1,
  },
  {
    id: "C21",
    tier: "low",
    title: "Dispute resolution",
    section: "§21",
    category: "Legal boilerplate",
    summary: "Escalation contacts are named individuals rather than current roles.",
    original: "Disputes will be escalated to the named account directors in Schedule 2.",
    proposed: "Use role-based escalation contacts and current notice channels.",
    issueCount: 1,
  },
  {
    id: "C23",
    tier: "low",
    title: "Entire agreement",
    section: "§23",
    category: "Legal boilerplate",
    summary: "The clause references an obsolete order form attachment.",
    original: "This agreement and the 2022 order form contain the entire agreement.",
    proposed: "Replace the obsolete attachment reference with the current order schedule.",
    issueCount: 1,
  },
  {
    id: "C24",
    tier: "low",
    title: "Severability",
    section: "§24",
    category: "Legal boilerplate",
    summary: "Minor drafting cleanup needed for severed provision replacement wording.",
    original: "If a provision is invalid the parties shall replace it where possible.",
    proposed: "Clarify replacement language to preserve commercial intent to the maximum extent permitted.",
    issueCount: 1,
  },
  {
    id: "C25",
    tier: "low",
    title: "Waiver",
    section: "§25",
    category: "Legal boilerplate",
    summary: "Waiver wording should state that delay is not a waiver.",
    original: "A waiver must be in writing and signed by the waiving party.",
    proposed: "Add that delay or failure to enforce does not constitute waiver of future rights.",
    issueCount: 1,
  },
  {
    id: "C26",
    tier: "low",
    title: "Definitions cleanup",
    section: "§1.1",
    category: "Definitions",
    summary: "Defined terms use inconsistent capitalisation.",
    original: "The terms customer data, Customer Materials and services are used throughout.",
    proposed: "Align defined-term capitalisation across the agreement.",
    issueCount: 1,
  },
  {
    id: "C27",
    tier: "low",
    title: "Signature block",
    section: "§26",
    category: "Administration",
    summary: "Buyer signatory title is outdated.",
    original: "Signed by Procurement Director, Network Hardware.",
    proposed: "Update the signatory title to Director, Strategic Sourcing.",
    issueCount: 1,
  },
  {
    id: "C28",
    tier: "low",
    title: "Document version",
    section: "§0.2",
    category: "Formatting",
    summary: "Footer still shows draft version 0.7.",
    original: "Document footer reads Draft v0.7.",
    proposed: "Update footer to the final negotiation version before circulation.",
    issueCount: 1,
  },
  {
    id: "C29",
    tier: "low",
    title: "Schedule numbering",
    section: "Sch. 1",
    category: "Formatting",
    summary: "Schedule cross-references skip Schedule 3.",
    original: "References jump from Schedule 2 to Schedule 4.",
    proposed: "Renumber schedules or restore the missing schedule reference.",
    issueCount: 1,
  },
  {
    id: "C30",
    tier: "low",
    title: "Purchase order reference",
    section: "§7.1",
    category: "Commercial",
    summary: "Invoice clause omits purchase order reference requirements.",
    original: "Invoices must contain reasonable supporting detail.",
    proposed: "Require purchase order number, contract ID, and service period on each invoice.",
    issueCount: 1,
  },
  {
    id: "C31",
    tier: "low",
    title: "Tax wording",
    section: "§7.6",
    category: "Commercial",
    summary: "Tax language should separate withholding tax from sales tax.",
    original: "Charges are exclusive of all taxes unless stated otherwise.",
    proposed: "Clarify sales tax, VAT, and withholding responsibilities separately.",
    issueCount: 1,
  },
  {
    id: "C32",
    tier: "low",
    title: "Currency label",
    section: "§7.2",
    category: "Commercial",
    summary: "Currency is abbreviated inconsistently between USD and US$.",
    original: "Fees are payable in US$ unless quoted differently.",
    proposed: "Use USD consistently across pricing and invoicing schedules.",
    issueCount: 1,
  },
  {
    id: "C33",
    tier: "low",
    title: "Business day definition",
    section: "§1.4",
    category: "Definitions",
    summary: "Business day definition omits public holidays in buyer location.",
    original: "Business day means Monday to Friday excluding public holidays.",
    proposed: "Clarify the relevant country for excluded public holidays.",
    issueCount: 1,
  },
  {
    id: "C34",
    tier: "low",
    title: "Contact table",
    section: "Sch. 2",
    category: "Administration",
    summary: "Supplier support contact email uses a legacy domain.",
    original: "Support requests should be sent to support@old-supplier.example.",
    proposed: "Update support email to the current supplier service desk domain.",
    issueCount: 1,
  },
  {
    id: "C35",
    tier: "low",
    title: "Security exhibit title",
    section: "Sch. 4",
    category: "Control and compliance",
    summary: "Security exhibit title does not match the attachment name.",
    original: "Schedule 4 is titled Information Security Requirements.",
    proposed: "Match schedule title to the attached Cyber Security Requirements document.",
    issueCount: 1,
  },
  {
    id: "C36",
    tier: "low",
    title: "Reporting cadence",
    section: "§5.4",
    category: "Performance",
    summary: "Monthly reporting cadence is referenced as quarterly in one sentence.",
    original: "Supplier will provide quarterly performance reports each month.",
    proposed: "Correct the sentence to monthly performance reports.",
    issueCount: 1,
  },
  {
    id: "C37",
    tier: "low",
    title: "Remedy notice typo",
    section: "§8.2",
    category: "Buyer remedies",
    summary: "Cure notice period contains a typographical error.",
    original: "Supplier has fifteen bussiness days to cure.",
    proposed: "Correct the typo to business days.",
    issueCount: 1,
  },
  {
    id: "C38",
    tier: "low",
    title: "Change control owner",
    section: "§4.3",
    category: "Governance",
    summary: "Change control owner should be procurement rather than IT operations.",
    original: "Changes require approval from IT operations.",
    proposed: "Route commercial change approval through procurement with IT consulted as needed.",
    issueCount: 1,
  },
  {
    id: "C39",
    tier: "low",
    title: "Modern slavery reference",
    section: "§15.8",
    category: "Control and compliance",
    summary: "Policy reference points to a retired supplier conduct policy.",
    original: "Supplier agrees to comply with the 2021 Supplier Conduct Policy.",
    proposed: "Update the reference to the current Responsible Sourcing Policy.",
    issueCount: 1,
  },
  {
    id: "C40",
    tier: "low",
    title: "Records retention",
    section: "§13.4",
    category: "Governance",
    summary: "Records retention period is stated in months in one clause and years in another.",
    original: "Records will be retained for 36 months after expiry.",
    proposed: "State the retention period consistently as three years after expiry.",
    issueCount: 1,
  },
  {
    id: "C41",
    tier: "low",
    title: "Export controls",
    section: "§15.9",
    category: "Control and compliance",
    summary: "Export control wording lacks the standard sanctions reference.",
    original: "Each party will comply with export control laws.",
    proposed: "Add the standard sanctions and restricted-party screening reference.",
    issueCount: 1,
  },
  {
    id: "C42",
    tier: "low",
    title: "Order precedence",
    section: "§2.3",
    category: "Governance",
    summary: "Precedence order should put negotiated terms above supplier standard terms.",
    original: "Supplier standard terms prevail where documents conflict.",
    proposed: "Set precedence to negotiated agreement, schedules, order forms, then supplier standard terms.",
    issueCount: 1,
  },
  {
    id: "C43",
    tier: "low",
    title: "Transition assistance",
    section: "§18.7",
    category: "Termination",
    summary: "Transition assistance clause lacks a time-boxed cooperation period.",
    original: "Supplier will provide reasonable exit assistance after termination.",
    proposed: "Specify up to ninety days of transition assistance at agreed rates.",
    issueCount: 1,
  },
  {
    id: "C44",
    tier: "low",
    title: "Benchmarking rights",
    section: "§7.9",
    category: "Commercial",
    summary: "Benchmarking clause names an obsolete benchmarking provider.",
    original: "Benchmarking may be performed by BenchmarkCo.",
    proposed: "Replace the named provider with a mutually agreed independent benchmarker.",
    issueCount: 1,
  },
  {
    id: "C45",
    tier: "low",
    title: "Minimum order typo",
    section: "§7.8",
    category: "Commercial",
    summary: "Minimum order threshold contains a misplaced comma.",
    original: "The minimum order value is 10,00 USD.",
    proposed: "Correct the threshold formatting to 10,000 USD.",
    issueCount: 1,
  },
  {
    id: "C46",
    tier: "low",
    title: "Background check wording",
    section: "§10.4",
    category: "Control and compliance",
    summary: "Personnel screening clause should reference legally permitted checks.",
    original: "Supplier will perform all background checks requested by buyer.",
    proposed: "Limit checks to those legally permitted and relevant to the service location.",
    issueCount: 1,
  },
  {
    id: "C47",
    tier: "low",
    title: "Accessibility standard",
    section: "§5.8",
    category: "Performance",
    summary: "Accessibility standard should cite the current WCAG version.",
    original: "Supplier will support WCAG 2.0 accessibility requirements.",
    proposed: "Update the reference to WCAG 2.2 AA where applicable.",
    issueCount: 1,
  },
  {
    id: "C48",
    tier: "low",
    title: "Publicity consent",
    section: "§11.8",
    category: "Confidentiality",
    summary: "Publicity clause should require buyer written approval.",
    original: "Supplier may identify buyer as a customer in marketing materials.",
    proposed: "Require prior written approval before using buyer name, logo, or case study content.",
    issueCount: 1,
  },
  {
    id: "C49",
    tier: "low",
    title: "Survival clause",
    section: "§27",
    category: "Legal boilerplate",
    summary: "Survival list omits confidentiality and payment obligations.",
    original: "Termination does not affect rights accrued before termination.",
    proposed: "Add confidentiality, audit, payment, liability, and dispute provisions to survival.",
    issueCount: 1,
  },
  {
    id: "C50",
    tier: "low",
    title: "Counterparts",
    section: "§28",
    category: "Administration",
    summary: "Counterparts clause does not mention electronic signatures.",
    original: "This agreement may be executed in counterparts.",
    proposed: "Add electronic signature and PDF counterpart validity wording.",
    issueCount: 1,
  },
  {
    id: "C51",
    tier: "low",
    title: "Headings",
    section: "§29",
    category: "Formatting",
    summary: "Heading interpretation language is missing.",
    original: "Clause headings are included for convenience.",
    proposed: "Clarify headings do not affect interpretation of the agreement.",
    issueCount: 1,
  },
  {
    id: "C52",
    tier: "low",
    title: "Order form date",
    section: "Order 1",
    category: "Administration",
    summary: "Order form date is left as a placeholder.",
    original: "Effective date: [insert date].",
    proposed: "Insert the effective date before sending to supplier.",
    issueCount: 1,
  },
  {
    id: "C53",
    tier: "low",
    title: "Attachment filename",
    section: "Sch. 6",
    category: "Formatting",
    summary: "Attachment filename includes internal draft notes.",
    original: "Attachment name: security-schedule-draft-final-v3.docx.",
    proposed: "Rename attachment using the agreed final document naming convention.",
    issueCount: 1,
  },
  {
    id: "C54",
    tier: "low",
    title: "Incoterms reference",
    section: "§4.8",
    category: "Commercial",
    summary: "Incoterms reference should be updated to the current edition.",
    original: "Delivery terms follow Incoterms 2010.",
    proposed: "Update to Incoterms 2020 or confirm the intended edition.",
    issueCount: 1,
  },
];

const deviationClauses: DeviationClause[] = [...highClauses, ...mediumClauses, ...lowClauses];

const severityOrder: SeverityTier[] = ["high", "medium", "low"];
const severityRank: Record<SeverityTier, number> = { high: 3, medium: 2, low: 1 };

export default function ClauseIQV6DeviationProminence() {
  const navigate = useNavigate();
  const [activeVariant, setActiveVariant] = useState<VariantKey>("row-scale");
  const [sectionExpanded, setSectionExpanded] = useState<Record<SeverityTier, boolean>>({
    high: true,
    medium: true,
    low: false,
  });
  const [expandedMediumIds, setExpandedMediumIds] = useState<Set<string>>(new Set());
  const [expandedDiffIds, setExpandedDiffIds] = useState<Set<string>>(new Set());

  const counts = useMemo(() => getCounts(deviationClauses), []);
  const visibleVariant = variants.find((variant) => variant.key === activeVariant) ?? variants[0];

  const toggleSection = (tier: SeverityTier) => {
    setSectionExpanded((current) => ({ ...current, [tier]: !current[tier] }));
  };

  const expandAllSections = () => {
    setSectionExpanded({ high: true, medium: true, low: true });
  };

  const toggleMedium = (id: string) => {
    setExpandedMediumIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDiff = (id: string) => {
    setExpandedDiffIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <V6Shell
      title="ClauseIQ"
      subtitle="Deviation prominence reframes"
      headerRight={
        <>
          <Button
            type="button"
            className="h-8 rounded-[5px] bg-[#1A2744] px-orbit-base text-xs text-white hover:bg-[#243454]"
            onClick={() => navigate(fullInteractionPath)}
          >
            Open full interaction
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8 gap-orbit-xs rounded-[5px] bg-white text-xs"
            onClick={() => navigate("/clauseiq-v6")}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            ClauseIQ
          </Button>
        </>
      }
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-orbit-base">
          <div className="min-w-0">
            <p className="text-[10px] v6-orbit-weight-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Prototype v4
            </p>
            <div className="mt-orbit-xs flex flex-wrap items-center gap-orbit-s text-xs text-muted-foreground">
              <span>{deviationClauses.length} clauses</span>
              <span>·</span>
              <span>{counts.high} high</span>
              <span>·</span>
              <span>{counts.medium} medium</span>
              <span>·</span>
              <span>{counts.low} low</span>
            </div>
          </div>
          <div
            role="tablist"
            aria-label="Deviation prominence variant"
            className="inline-flex rounded-md border border-border bg-white p-orbit-xs"
          >
            {variants.map((variant) => {
              const selected = variant.key === activeVariant;
              return (
                <button
                  key={variant.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={cn(
                    "h-8 rounded-[5px] px-orbit-base text-xs v6-orbit-weight-medium outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#185FA5]",
                    selected ? "bg-[#1A2744] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={() => setActiveVariant(variant.key)}
                >
                  {variant.label}
                </button>
              );
            })}
          </div>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-orbit-base px-orbit-m py-orbit-m">
        <div className="flex flex-wrap items-end justify-between gap-orbit-base">
          <div>
            <h1 className="v6-orbit-heading-4">{visibleVariant.label}</h1>
            <p className="mt-orbit-xs max-w-[720px] text-xs leading-5 text-muted-foreground">
              Same clause set, different severity treatment. Use the switcher to compare how quickly the high-risk work rises to the surface.
            </p>
          </div>
          <SeverityLegend counts={counts} />
        </div>

        {activeVariant === "row-scale" && <VariantRowScale clauses={deviationClauses} />}
        {activeVariant === "section-nav" && (
          <VariantSectionNav
            clauses={deviationClauses}
            expanded={sectionExpanded}
            onToggleSection={toggleSection}
            onExpandAll={expandAllSections}
          />
        )}
        {activeVariant === "inline-diff" && (
          <VariantInlineDiff
            clauses={deviationClauses}
            expandedMediumIds={expandedMediumIds}
            expandedDiffIds={expandedDiffIds}
            onToggleMedium={toggleMedium}
            onToggleDiff={toggleDiff}
          />
        )}
      </div>
    </V6Shell>
  );
}

function SeverityLegend({ counts }: { counts: Record<SeverityTier, number> }) {
  return (
    <div className="flex flex-wrap items-center gap-orbit-s">
      {severityOrder.map((tier) => {
        const token = severityTokens[tier];
        return (
          <div key={tier} className="inline-flex items-center gap-orbit-xs rounded-full border border-border bg-white px-orbit-s py-orbit-xs text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: token.color }} />
            <span>{token.label}</span>
            <span className="v6-orbit-weight-medium text-foreground">{counts[tier]}</span>
          </div>
        );
      })}
    </div>
  );
}

function VariantRowScale({ clauses }: { clauses: DeviationClause[] }) {
  const sorted = useMemo(
    () => [...clauses].sort((a, b) => severityRank[b.tier] - severityRank[a.tier] || sectionNumber(a.section) - sectionNumber(b.section)),
    [clauses],
  );

  return (
    <div className="space-y-orbit-xs">
      {sorted.map((clause) => {
        if (clause.tier === "high") return <HighScaleRow key={clause.id} clause={clause} />;
        if (clause.tier === "medium") return <MediumScaleRow key={clause.id} clause={clause} />;
        return <LowScaleRow key={clause.id} clause={clause} />;
      })}
    </div>
  );
}

function HighScaleRow({ clause }: { clause: DeviationClause }) {
  return (
    <CardShell clause={clause} className="min-h-[100px] p-orbit-base">
      <div className="flex flex-wrap items-center gap-orbit-s">
        <SeverityPill tier={clause.tier} />
        <p className="text-[11px] text-muted-foreground">
          {clause.issueCount} issues · {clause.section} · {clause.category}
        </p>
      </div>
      <h2 className="v6-orbit-heading-label mt-orbit-s text-foreground">{clause.title}</h2>
      <p className="mt-orbit-xs text-[13px] leading-5 text-muted-foreground">{clause.summary}</p>
      <div className="mt-orbit-base flex flex-wrap items-center gap-orbit-s">
        <Button
          type="button"
          className="h-8 rounded-[5px] px-orbit-base text-[11px] v6-orbit-weight-medium text-white hover:opacity-90"
          style={{ backgroundColor: severityTokens.high.color }}
        >
          Request change
        </Button>
        <Button type="button" variant="outline" className="h-8 rounded-[5px] bg-white px-orbit-base text-[11px]">
          View clause
        </Button>
      </div>
    </CardShell>
  );
}

function MediumScaleRow({ clause }: { clause: DeviationClause }) {
  return (
    <CardShell clause={clause} className="min-h-[56px] px-orbit-base py-orbit-base">
      <div className="flex min-w-0 items-center gap-orbit-s">
        <SeverityPill tier={clause.tier} />
        <p className="shrink-0 text-[11px] text-muted-foreground">
          {clause.section} · {clause.title}
        </p>
        <p className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">{clause.summary}</p>
        <Button type="button" variant="outline" className="h-7 rounded-[5px] bg-white px-orbit-s text-[11px]">
          Review
        </Button>
      </div>
    </CardShell>
  );
}

function LowScaleRow({ clause }: { clause: DeviationClause }) {
  return (
    <CardShell clause={clause} className="min-h-[38px] px-orbit-base py-orbit-s">
      <div className="flex min-w-0 items-center gap-orbit-s">
        <SeverityPill tier={clause.tier} />
        <span className="shrink-0 text-[11px] text-muted-foreground">{clause.section} ·</span>
        <span className="min-w-0 flex-1 truncate text-[12px] v6-orbit-weight-medium text-foreground">{clause.title}</span>
        <button type="button" className="text-[11px] v6-orbit-weight-medium text-[#185FA5] outline-none hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#185FA5]">
          View
        </button>
      </div>
    </CardShell>
  );
}

function VariantSectionNav({
  clauses,
  expanded,
  onToggleSection,
  onExpandAll,
}: {
  clauses: DeviationClause[];
  expanded: Record<SeverityTier, boolean>;
  onToggleSection: (tier: SeverityTier) => void;
  onExpandAll: () => void;
}) {
  const grouped = useMemo(() => groupBySeverity(sortForSectionNav(clauses)), [clauses]);

  return (
    <div className="space-y-orbit-base">
      {severityOrder.map((tier) => (
        <SectionNavGroup
          key={tier}
          tier={tier}
          clauses={grouped[tier]}
          expanded={expanded[tier]}
          onToggle={() => onToggleSection(tier)}
          onExpandAll={onExpandAll}
        />
      ))}
    </div>
  );
}

function SectionNavGroup({
  tier,
  clauses,
  expanded,
  onToggle,
  onExpandAll,
}: {
  tier: SeverityTier;
  clauses: DeviationClause[];
  expanded: boolean;
  onToggle: () => void;
  onExpandAll: () => void;
}) {
  const token = severityTokens[tier];
  const Icon = token.icon as ComponentType<{ className?: string }>;
  const label = tier === "high" ? "High deviations" : token.label;

  return (
    <section className="space-y-orbit-xs">
      <div className="sticky top-0 z-10 bg-background/95 py-orbit-xs backdrop-blur">
        <div className="flex items-center gap-orbit-base">
          <div
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            className="group flex min-w-0 flex-1 cursor-pointer items-center gap-orbit-s outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#185FA5]"
            onClick={onToggle}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle();
              }
            }}
          >
            <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: token.color }}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm v6-orbit-weight-medium text-foreground">{label}</span>
            <span className="rounded-full bg-muted px-orbit-s py-orbit-xxs text-xs text-muted-foreground">{clauses.length}</span>
            <span className="h-px min-w-8 flex-1 bg-border" />
            {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          {tier === "high" && (
            <button
              type="button"
              className="text-[11px] v6-orbit-weight-medium text-[#185FA5] outline-none hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#185FA5]"
              onClick={onExpandAll}
            >
              Expand all
            </button>
          )}
        </div>
      </div>

      {!expanded && tier === "low" ? (
        <button
          type="button"
          className="w-full rounded-[6px] border border-dashed border-border bg-white px-orbit-base py-orbit-base text-sm v6-orbit-weight-medium text-muted-foreground outline-none transition-colors hover:border-[#185FA5]/40 hover:bg-[#E6F1FB] hover:text-[#185FA5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#185FA5]"
          onClick={onToggle}
        >
          Show {clauses.length} low-deviation clauses
        </button>
      ) : expanded ? (
        <div className="space-y-orbit-xs">
          {clauses.map((clause) => (
            <SectionCard key={clause.id} clause={clause} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SectionCard({ clause }: { clause: DeviationClause }) {
  return (
    <Card type="Static" padding="Small">
      <div className="flex min-w-0 items-center gap-orbit-base">
        <div className="min-w-0 flex-1">
          <Text as="div" size="Paragraph" variant="Bold">
            {clause.title} <span className="text-[12px] v6-orbit-weight-regular text-muted-foreground">{clause.section}</span>
          </Text>
          <div className="mt-orbit-xs truncate">
            <Text as="span" size="Small" variant="Secondary">{clause.summary}</Text>
          </div>
        </div>
        <Button type="button" variant="outline" className="h-7 rounded-[5px] bg-white px-orbit-s text-[11px]">
          Review
        </Button>
      </div>
    </Card>
  );
}

function VariantInlineDiff({
  clauses,
  expandedMediumIds,
  expandedDiffIds,
  onToggleMedium,
  onToggleDiff,
}: {
  clauses: DeviationClause[];
  expandedMediumIds: Set<string>;
  expandedDiffIds: Set<string>;
  onToggleMedium: (id: string) => void;
  onToggleDiff: (id: string) => void;
}) {
  const sorted = useMemo(
    () => [...clauses].sort((a, b) => severityRank[b.tier] - severityRank[a.tier] || sectionNumber(a.section) - sectionNumber(b.section)),
    [clauses],
  );

  return (
    <div className="space-y-orbit-xs">
      {sorted.map((clause) => {
        if (clause.tier === "high") {
          return (
            <HighDiffCard
              key={clause.id}
              clause={clause}
              expanded={expandedDiffIds.has(clause.id)}
              onToggleDiff={() => onToggleDiff(clause.id)}
            />
          );
        }
        if (clause.tier === "medium") {
          return (
            <MediumDiffCard
              key={clause.id}
              clause={clause}
              expanded={expandedMediumIds.has(clause.id)}
              diffExpanded={expandedDiffIds.has(clause.id)}
              onToggleMedium={() => onToggleMedium(clause.id)}
              onToggleDiff={() => onToggleDiff(clause.id)}
            />
          );
        }
        return <LowDiffRow key={clause.id} clause={clause} />;
      })}
    </div>
  );
}

function HighDiffCard({
  clause,
  expanded,
  onToggleDiff,
}: {
  clause: DeviationClause;
  expanded: boolean;
  onToggleDiff: () => void;
}) {
  return (
    <CardShell clause={clause} className="p-orbit-base">
      <DiffHeader clause={clause} />
      <DiffBlock clause={clause} expanded={expanded} onToggle={onToggleDiff} />
      <DiffActions tier={clause.tier} />
    </CardShell>
  );
}

function MediumDiffCard({
  clause,
  expanded,
  diffExpanded,
  onToggleMedium,
  onToggleDiff,
}: {
  clause: DeviationClause;
  expanded: boolean;
  diffExpanded: boolean;
  onToggleMedium: () => void;
  onToggleDiff: () => void;
}) {
  return (
    <CardShell clause={clause} className="p-orbit-base">
      <div className="flex min-w-0 items-center gap-orbit-s">
        <SeverityPill tier={clause.tier} />
        <h2 className="v6-orbit-heading-label min-w-0 flex-1 truncate text-foreground">
          {clause.title} <span className="text-[11px] v6-orbit-weight-regular text-muted-foreground">{clause.section}</span>
        </h2>
        <p className="hidden min-w-0 flex-[1.2] truncate text-[12px] text-muted-foreground lg:block">{clause.summary}</p>
        <Button type="button" variant="outline" className="h-7 rounded-[5px] bg-white px-orbit-s text-[11px]" onClick={onToggleMedium}>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Show change
        </Button>
      </div>
      {expanded && (
        <div className="mt-orbit-base">
          <DiffBlock clause={clause} expanded={diffExpanded} onToggle={onToggleDiff} />
          <DiffActions tier={clause.tier} />
        </div>
      )}
    </CardShell>
  );
}

function LowDiffRow({ clause }: { clause: DeviationClause }) {
  return (
    <article className="flex min-h-[38px] cursor-pointer items-center gap-orbit-s rounded-[6px] border-[0.5px] border-border bg-white px-orbit-base py-orbit-s transition-colors hover:bg-muted/50">
      <IconCheck className="h-3.5 w-3.5 shrink-0 text-[#6B6A64]" />
      <span className="shrink-0 text-[11px] text-muted-foreground">{clause.section}</span>
      <span className="min-w-0 flex-1 truncate text-[12px] v6-orbit-weight-medium text-foreground">{clause.title}</span>
      <button type="button" className="text-[11px] v6-orbit-weight-medium text-[#185FA5] outline-none hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#185FA5]">
        Confirm
      </button>
    </article>
  );
}

function DiffHeader({ clause }: { clause: DeviationClause }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-orbit-s">
      <SeverityPill tier={clause.tier} />
      <h2 className="v6-orbit-heading-label min-w-0 text-foreground">{clause.title}</h2>
      <span className="text-[11px] text-muted-foreground">{clause.section}</span>
    </div>
  );
}

function DiffBlock({
  clause,
  expanded,
  onToggle,
}: {
  clause: DeviationClause;
  expanded: boolean;
  onToggle: () => void;
}) {
  const token = severityTokens[clause.tier];
  const hasLongDiff = `${clause.original} ${clause.proposed}`.length > 320;

  return (
    <div className="mt-orbit-base rounded-[6px] bg-[#F1EFE8] p-orbit-base">
      <div className={cn("relative overflow-hidden", !expanded && hasLongDiff && "max-h-28")}>
        <p className="text-[12px] leading-5 text-[#6B6A64] line-through">{clause.original}</p>
        <p className="mt-orbit-s text-[12px] leading-5 text-foreground">
          <span
            className="rounded-[2px] px-orbit-xs py-orbit-xxs"
            style={{
              backgroundColor: clause.tier === "high" ? "rgba(163, 45, 45, 0.12)" : "rgba(186, 117, 23, 0.16)",
              color: clause.tier === "high" ? "#791F1F" : "#4B2D04",
            }}
          >
            {clause.proposed}
          </span>
        </p>
        {!expanded && hasLongDiff && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-[#F1EFE8]/0 to-[#F1EFE8]" />
        )}
      </div>
      {hasLongDiff && (
        // Open question: real diffs may exceed four lines; this keeps the sample scannable while preserving an inline full-clause escape hatch.
        <button
          type="button"
          className="mt-orbit-s text-[11px] v6-orbit-weight-medium outline-none hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: token.color }}
          onClick={onToggle}
        >
          {expanded ? "Show less" : "Show full clause"}
        </button>
      )}
    </div>
  );
}

function DiffActions({ tier }: { tier: SeverityTier }) {
  const primaryColor = tier === "high" ? severityTokens.high.color : "#7A4900";
  const label = tier === "high" ? "Counter-propose" : "Counter-propose";
  return (
    <div className="mt-orbit-base flex flex-wrap items-center gap-orbit-s">
      <Button
        type="button"
        className="h-8 rounded-[5px] px-orbit-base text-[11px] v6-orbit-weight-medium text-white hover:opacity-90"
        style={{ backgroundColor: primaryColor }}
      >
        {label}
      </Button>
      <Button type="button" variant="outline" className="h-8 rounded-[5px] bg-white px-orbit-base text-[11px]">
        Accept
      </Button>
      <Button type="button" variant="outline" className="h-8 rounded-[5px] bg-white px-orbit-base text-[11px]">
        Flag for legal
      </Button>
    </div>
  );
}

function CardShell({
  clause,
  className,
  children,
}: {
  clause: DeviationClause;
  className?: string;
  children: ReactNode;
}) {
  const token = severityTokens[clause.tier];
  return (
    <Card
      type="Static"
      padding="Small"
      state={clause.tier === "high" ? "Warning" : "Default"}
      style={{ padding: 0, backgroundColor: clause.tier === "high" ? token.rowWash : undefined }}
    >
      <article className={cn("relative overflow-hidden pl-orbit-base", className)}>
        <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: token.color }} />
        {children}
      </article>
    </Card>
  );
}

function SeverityPill({ tier }: { tier: SeverityTier }) {
  return (
    <Chip
      label={severityTokens[tier].label}
      size="Small"
      variant={tier === "high" ? "Error" : tier === "medium" ? "Warning" : "No Status"}
    />
  );
}

function groupBySeverity(clauses: DeviationClause[]) {
  return clauses.reduce<Record<SeverityTier, DeviationClause[]>>(
    (groups, clause) => {
      groups[clause.tier].push(clause);
      return groups;
    },
    { high: [], medium: [], low: [] },
  );
}

function getCounts(clauses: DeviationClause[]) {
  return clauses.reduce<Record<SeverityTier, number>>(
    (counts, clause) => {
      counts[clause.tier] += 1;
      return counts;
    },
    { high: 0, medium: 0, low: 0 },
  );
}

function sortForSectionNav(clauses: DeviationClause[]) {
  // Open question: default is severity descending, then section number; swap this comparator to category when that review mode is in scope.
  return [...clauses].sort((a, b) => severityRank[b.tier] - severityRank[a.tier] || sectionNumber(a.section) - sectionNumber(b.section));
}

function sectionNumber(section: string) {
  const match = section.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}
