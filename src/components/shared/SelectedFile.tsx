import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Human-readable size, so a teacher can tell a photo from a scan. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Shows the file chosen for a proof of learning before it is uploaded, with a
 * thumbnail for images so a mis-taken photo is obvious without saving first.
 */
export function SelectedFile({ file, onClear }: { file: File; onClear: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    // Object URLs pin the file in memory until revoked.
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      {preview ? (
        <img
          src={preview}
          alt={file.name}
          className="w-full max-h-64 object-contain bg-background"
        />
      ) : (
        <div className="flex items-center gap-3 p-4">
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
          <span className="text-sm truncate">{file.name}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-border">
        <span className="text-xs text-muted-foreground truncate">
          {preview ? `${file.name} · ` : ""}
          {formatSize(file.size)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 shrink-0"
          onClick={onClear}
          aria-label="Odebrat soubor"
        >
          <X className="h-4 w-4" />
          Odebrat
        </Button>
      </div>
    </div>
  );
}
