import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear?: () => void;
  disabled?: boolean;
  accept?: string;
  disabledMessage?: string;
}

export function FileDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  disabled,
  accept = ".pdf",
  disabledMessage,
}: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [disabled, onFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  if (disabled && disabledMessage) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-muted/50">
        <p className="text-muted-foreground text-sm">{disabledMessage}</p>
      </div>
    );
  }

  if (selectedFile) {
    return (
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          {onClear && (
            <Button variant="ghost" size="icon" onClick={onClear} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
        dragOver ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <label className="cursor-pointer flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
          <Upload className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">
            Drag & drop or{" "}
            <span className="text-primary underline">choose files</span> to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            File types supported: .pdf files.
          </p>
          <p className="text-xs text-muted-foreground">Maximum upload file size: 100 MB</p>
        </div>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
        />
      </label>
    </div>
  );
}
