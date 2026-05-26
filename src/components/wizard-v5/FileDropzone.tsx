import { Card, Dropzone, FaIcon, FileItem, IconButton, Text } from "@orbit";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear?: () => void;
  disabled?: boolean;
  accept?: string;
  disabledMessage?: string;
}

function documentTypeFromName(name: string): "XLS" | "DOC" | "PDF" | "ZIP" | "IMG" | "Unknown" {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "PDF";
  if (extension === "doc" || extension === "docx") return "DOC";
  if (extension === "xls" || extension === "xlsx" || extension === "csv") return "XLS";
  if (extension === "zip") return "ZIP";
  if (extension === "png" || extension === "jpg" || extension === "jpeg" || extension === "webp") return "IMG";
  return "Unknown";
}

export function FileDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  disabled,
  accept = ".pdf",
  disabledMessage,
}: FileDropzoneProps) {
  if (disabled && disabledMessage) {
    return (
      <Card type="Static" padding="Base" state="Disabled">
        <div className="py-8 text-center">
          <Text as="p" size="Small" variant="Disabled">
            {disabledMessage}
          </Text>
        </div>
      </Card>
    );
  }

  if (selectedFile) {
    return (
      <Card type="Static" padding="Base">
        <FileItem
          filename={`${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`}
          documentType={documentTypeFromName(selectedFile.name)}
          trailing={
            onClear ? (
              <IconButton
                variant="Tertiary"
                size="Medium"
                ariaLabel="Remove selected file"
                icon={<FaIcon icon="\uf00d" />}
                onClick={onClear}
              />
            ) : undefined
          }
        />
      </Card>
    );
  }

  return (
    <Dropzone
      ariaLabel="Upload contract file"
      accept={accept}
      disabled={disabled}
      onFileSelected={onFileSelect}
      acceptedFileTypesLabel="File types supported: .pdf files."
      maxFileSizeLabel="Maximum upload file size: 100 MB"
    />
  );
}
