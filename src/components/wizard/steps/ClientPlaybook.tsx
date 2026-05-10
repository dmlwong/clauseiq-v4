import { FileDropzone } from "@/components/wizard/FileDropzone";

interface ClientPlaybookProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  playbookAvailable: boolean;
}

export function ClientPlaybook({ file, onFileSelect, onClear, playbookAvailable }: ClientPlaybookProps) {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Client Playbook</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optionally upload a client playbook to guide the analysis according to client-specific
          priorities or business rules. This step can be skipped.
        </p>
      </div>
      <FileDropzone
        onFileSelect={onFileSelect}
        selectedFile={file}
        onClear={onClear}
        accept=".pdf"
        disabled={!playbookAvailable}
        disabledMessage="Playbook upload is not available for the selected Company and Category."
      />
    </div>
  );
}
