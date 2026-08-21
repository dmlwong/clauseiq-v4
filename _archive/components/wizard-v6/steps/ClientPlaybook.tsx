import { FileDropzone } from "@/components/wizard-v6/FileDropzone";

interface ClientPlaybookProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  playbookAvailable: boolean;
}

export function ClientPlaybook({ file, onFileSelect, onClear, playbookAvailable }: ClientPlaybookProps) {
  return (
    <div className="p-orbit-l space-y-orbit-m">
      <div>
        <h2 className="text-lg v5-orbit-weight-semibold text-foreground">Client Playbook</h2>
        <p className="text-sm text-muted-foreground mt-orbit-xs">
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
