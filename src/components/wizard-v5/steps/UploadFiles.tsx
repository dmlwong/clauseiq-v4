import { FileDropzone } from "@/components/wizard-v5/FileDropzone";

interface UploadFilesProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export function UploadFiles({ file, onFileSelect, onClear }: UploadFilesProps) {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Upload Contract</h2>
        <p className="text-sm text-muted-foreground mt-1">
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
