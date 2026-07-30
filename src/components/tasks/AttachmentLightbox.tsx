import { useCallback, useEffect, useState } from "react";
import { Download, File, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchAttachmentBlob } from "@/lib/taskAttachmentsApi";
import type { TaskAttachment } from "@/types/task";

export interface AttachmentLightboxProps {
  attachment: TaskAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string;
  localFile?: File | null;
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isPdfMime(mimeType: string) {
  return mimeType === "application/pdf";
}

export function AttachmentLightbox({
  attachment,
  open,
  onOpenChange,
  taskId,
  localFile,
}: AttachmentLightboxProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !attachment) {
      setObjectUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let currentUrl: string | null = null;

    const revokeCurrent = () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
        currentUrl = null;
      }
    };

    const load = async () => {
      if (localFile) {
        revokeCurrent();
        currentUrl = URL.createObjectURL(localFile);
        if (!cancelled) setObjectUrl(currentUrl);
        return;
      }

      if (!taskId) return;

      setLoading(true);
      setError(null);
      try {
        const blob = await fetchAttachmentBlob(taskId, attachment.id);
        if (cancelled) return;
        revokeCurrent();
        currentUrl = URL.createObjectURL(blob);
        setObjectUrl(currentUrl);
      } catch {
        if (!cancelled) setError("Impossible de charger la pièce jointe.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      revokeCurrent();
      setObjectUrl(null);
      setLoading(false);
      setError(null);
    };
  }, [open, attachment, taskId, localFile]);

  const handleDownload = useCallback(async () => {
    if (!attachment) return;

    if (localFile) {
      const url = URL.createObjectURL(localFile);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = localFile.name;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (!taskId) return;

    try {
      const blob = await fetchAttachmentBlob(taskId, attachment.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.originalFilename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Impossible de télécharger la pièce jointe.");
    }
  }, [attachment, localFile, taskId]);

  const mimeType = localFile?.type || attachment?.mimeType || "";
  const filename = localFile?.name || attachment?.originalFilename || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3">
          <DialogTitle className="truncate pr-8 text-base font-medium">
            {filename}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/30 p-4">
          {loading && (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 text-center">
              <File className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void handleDownload()}>
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
            </div>
          )}

          {!loading && !error && objectUrl && isImageMime(mimeType) && (
            <img
              src={objectUrl}
              alt={filename}
              className="max-h-full max-w-full object-contain"
            />
          )}

          {!loading && !error && objectUrl && isPdfMime(mimeType) && (
            <iframe
              src={objectUrl}
              title={filename}
              className="h-full w-full rounded-md border border-border bg-background"
            />
          )}

          {!loading && !error && objectUrl && !isImageMime(mimeType) && !isPdfMime(mimeType) && (
            <div className="flex flex-col items-center gap-3 text-center">
              <File className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aperçu non disponible pour ce type de fichier.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => void handleDownload()}>
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
