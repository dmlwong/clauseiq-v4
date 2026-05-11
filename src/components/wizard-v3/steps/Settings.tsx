import { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/wizard-v3/SearchableSelect";
import { fetchCompanies, fetchCategories, type Company, type Category, type RoutingMetadata } from "@/lib/mock-api";
import { Building2, Database } from "lucide-react";

const DOC_TYPES = [
  { value: "msa", label: "Master Service Agreement (MSA)" },
  { value: "mpa", label: "Master Procurement Agreement (MPA)" },
  { value: "sow", label: "Statement of Work (SOW)" },
  { value: "saas", label: "SaaS Agreement" },
  { value: "other", label: "Other" },
];

interface SettingsProps {
  company: string;
  category: string;
  documentType: string;
  routingMetadata: RoutingMetadata | null;
  onCompanyChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onDocTypeChange: (v: string) => void;
}

export function Settings({
  company,
  category,
  documentType,
  routingMetadata,
  onCompanyChange,
  onCategoryChange,
  onDocTypeChange,
}: SettingsProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCompanies(), fetchCategories()]).then(([c, cat]) => {
      setCompanies(c);
      setCategories(cat);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Analysis Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Company and Category determine the backend routing and benchmark source used for this analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SearchableSelect
          label="Company"
          required
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
          value={company}
          onChange={onCompanyChange}
          placeholder="Select company..."
          tooltip="These selections route your analysis to the correct backend data source."
          loading={loading}
        />
        <SearchableSelect
          label="Category"
          required
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={category}
          onChange={onCategoryChange}
          placeholder="Select category..."
          tooltip="These selections route your analysis to the correct backend data source."
          loading={loading}
        />
      </div>

      <SearchableSelect
        label="Document Type"
        required
        options={DOC_TYPES}
        value={documentType}
        onChange={onDocTypeChange}
        placeholder="Select document type..."
      />

      {routingMetadata && (
        <div className="border border-border rounded-lg p-5 bg-secondary/40 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Building2 className="w-4 h-4 text-primary" />
            Routing Summary
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <span className="text-muted-foreground">Company</span>
            <span className="font-medium">{companies.find((c) => c.id === company)?.name}</span>
            <span className="text-muted-foreground">Category</span>
            <span className="font-medium">{categories.find((c) => c.id === category)?.name}</span>
            <span className="text-muted-foreground">Document Type</span>
            <span className="font-medium">{DOC_TYPES.find((d) => d.value === documentType)?.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border">
            <Database className="w-3 h-3" />
            Routing target: {routingMetadata.databaseName} ({routingMetadata.databaseId})
          </div>
        </div>
      )}
    </div>
  );
}
