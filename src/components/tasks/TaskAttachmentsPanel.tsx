import { useCallback, useEffect, useRef, useState } from "react";
import { File, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  deleteAttachment,
  fetchAttachmentBlob,
  listAttachments,
  uploadAttachment,
} from "@/lib/taskAttachmentsApi";
import type { TaskAttachment } from "@/types/task";
import { AttachmentLightbox } from "@/components/tasks/AttachmentLightbox";

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface TaskAttachmentsPanelProps {
  taskId?: string;
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
  readOnly?: boolean;
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isPdfMime(mimeType: string) {
  return mimeType === "application/pdf";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function pendingToAttachment(file: File, index: number): TaskAttachment {
  const mimeType = file.type || "application/octet-stream";
  return {
    id: `pending-${index}`,
    taskId: "",
    originalFilename: file.name,
    mimeType,
    sizeBytes: file.size,
    createdAt: new Date().toISOString(),
    previewable: isImageMime(mimeType) || isPdfMime(mimeType),
  };
}

interface AttachmentThumbnailProps {
  attachment: TaskAttachment;
  taskId?: string;
  localFile?: File;
}

function AttachmentThumbnail({ attachment, taskId, localFile }: AttachmentThumbnailProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (localFile && isImageMime(localFile.type)) {
      const url = URL.createObjectURL(localFile);
      setThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    if (taskId && isImageMime(attachment.mimeType)) {
      let cancelled = false;
      void fetchAttachmentBlob(taskId, attachment.id)
        .then((blob) => {
          if (cancelled) return;
          setThumbUrl(URL.createObjectURL(blob));
        })
        .catch(() => undefined);

      return () => {
        cancelled = true;
        setThumbUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      };
    }

    setThumbUrl(null);
    return undefined;
  }, [attachment.id, attachment.mimeType, localFile, taskId]);

  if (thumbUrl) {
    return <img src={thumbUrl} alt="" className="h-full w-full object-cover" />;
  }

  if (isPdfMime(attachment.mimeType)) {
    return <FileText className="h-6 w-6 text-muted-foreground" />;
  }

  return <File className="h-6 w-6 text-muted-foreground" />;
}

export function TaskAttachmentsPanel({
  taskId,
  pendingFiles,
  onPendingFilesChange,
  readOnly = false,
}: TaskAttachmentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxAttachment, setLightboxAttachment] = useState<TaskAttachment | null>(null);
  const [lightboxLocalFile, setLightboxLocalFile] = useState<File | null>(null);

  const loadAttachments = useCallback(async () => {
    if (!taskId) {
      setAttachments([]);
      return;
    }

    setLoadingList(true);
    try {
      const list = await listAttachments(taskId);
      setAttachments(list);
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les pièces jointes.",
      });
    } finally {
      setLoadingList(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  const totalCount = taskId ? attachments.length : pendingFiles.length;

  const validateFiles = (files: File[]): File[] => {
    const accepted: File[] = [];
    let count = totalCount;

    for (const file of files) {
      if (count >= MAX_ATTACHMENTS) {
        toast({
          variant: "destructive",
          title: "Limite atteinte",
          description: `Maximum ${MAX_ATTACHMENTS} pièces jointes par tâche.`,
        });
        break;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: `"${file.name}" dépasse la limite de 10 Mo.`,
        });
        continue;
      }

      accepted.push(file);
      count += 1;
    }

    return accepted;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length || readOnly) return;

    const validFiles = validateFiles(selected);
    if (!validFiles.length) return;

    if (taskId) {
      setUploading(true);
      let uploadedCount = 0;
      try {
        for (const file of validFiles) {
          await uploadAttachment(taskId, file);
          uploadedCount += 1;
        }
        toast({
          title: "Pièces jointes ajoutées",
          description:
            validFiles.length === 1
              ? `"${validFiles[0].name}" a été téléversé.`
              : `${validFiles.length} fichiers ont été téléversés.`,
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Échec du téléversement",
          description:
            uploadedCount > 0
              ? `${uploadedCount} fichier(s) téléversé(s), puis une erreur est survenue.`
              : "Impossible d'ajouter la pièce jointe.",
        });
      } finally {
        if (uploadedCount > 0) {
          await loadAttachments();
        }
        setUploading(false);
      }
      return;
    }

    onPendingFilesChange([...pendingFiles, ...validFiles]);
  };

  const handleDeleteServer = async (attachmentId: string) => {
    if (!taskId || readOnly) return;

    try {
      await deleteAttachment(taskId, attachmentId);
      setAttachments((current) => current.filter((item) => item.id !== attachmentId));
      toast({ title: "Pièce jointe supprimée" });
    } catch {
      toast({
        variant: "destructive",
        title: "Échec de la suppression",
        description: "Impossible de supprimer la pièce jointe.",
      });
    }
  };

  const handleDeletePending = (index: number) => {
    if (readOnly) return;
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  };

  const openLightbox = (attachment: TaskAttachment, localFile?: File) => {
    setLightboxAttachment(attachment);
    setLightboxLocalFile(localFile ?? null);
    setLightboxOpen(true);
  };

  const closeLightbox = (open: boolean) => {
    setLightboxOpen(open);
    if (!open) {
      setLightboxAttachment(null);
      setLightboxLocalFile(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Pièces jointes</Label>
        {!readOnly && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => void handleFileSelect(event)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || totalCount >= MAX_ATTACHMENTS}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Ajouter
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {totalCount}/{MAX_ATTACHMENTS} · 10 Mo max par fichier
      </p>

      {loadingList && taskId ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des pièces jointes…
        </div>
      ) : null}

      {!loadingList && totalCount === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
          Aucune pièce jointe
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {taskId
            ? attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card"
                >
                  <button
                    type="button"
                    className="flex h-20 items-center justify-center bg-muted/40 transition-colors hover:bg-muted/60"
                    onClick={() => openLightbox(attachment)}
                  >
                    <AttachmentThumbnail attachment={attachment} taskId={taskId} />
                  </button>
                  <div className="flex items-start justify-between gap-1 p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium" title={attachment.originalFilename}>
                        {attachment.originalFilename}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(attachment.sizeBytes)}
                      </p>
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Supprimer"
                        onClick={() => void handleDeleteServer(attachment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))
            : pendingFiles.map((file, index) => {
                const attachment = pendingToAttachment(file, index);
                return (
                  <li
                    key={`${file.name}-${index}`}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card"
                  >
                    <button
                      type="button"
                      className="flex h-20 items-center justify-center bg-muted/40 transition-colors hover:bg-muted/60"
                      onClick={() => openLightbox(attachment, file)}
                    >
                      <AttachmentThumbnail attachment={attachment} localFile={file} />
                    </button>
                    <div className="flex items-start justify-between gap-1 p-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Supprimer"
                          onClick={() => handleDeletePending(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
        </ul>
      )}

      <AttachmentLightbox
        attachment={lightboxAttachment}
        open={lightboxOpen}
        onOpenChange={closeLightbox}
        taskId={taskId}
        localFile={lightboxLocalFile}
      />
    </div>
  );
}
