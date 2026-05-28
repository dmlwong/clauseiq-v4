import { FileDropzone } from "@/components/wizard-v5/FileDropzone";

interface UploadFilesProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export function UploadFiles({ file, onFileSelect, onClear }: UploadFilesProps) {
  return (
    <div className="p-orbit-l space-y-orbit-m">
      <div>
        <h2 className="text-lg v5-orbit-weight-semibold text-foreground">Upload Contract</h2>
        <p className="text-sm text-muted-foreground mt-orbit-xs">
          Upload the supplier contract you would like to analyse.
        </p>
      </div>
      <FileDropzone
        onFileSelect={onFileSelect}
        selectedFile={file}
        onClear={onClear}
        accept=".pdf"
      />
    </div>
  );
}
