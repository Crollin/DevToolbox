import { useCallback, useState } from "react";
import api from "@/lib/api";
import type {
  ConvertedFileMeta,
  FileConverterPhase,
  UploadedFileMeta,
} from "@/types/file-converter";
import { toast } from "sonner";

export function useFileConverter() {
  const [phase, setPhase] = useState<FileConverterPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFileMeta | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [converted, setConverted] = useState<ConvertedFileMeta | null>(null);
  const [reachable, setReachable] = useState<boolean | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setSelectedFile(null);
    setUploaded(null);
    setOutputFormat("");
    setConverted(null);
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const status = await api.get<{ enabled: boolean; reachable: boolean }>("/transmute/status");
      setReachable(status.reachable);
      return status;
    } catch {
      setReachable(false);
      return null;
    }
  }, []);

  const selectFile = useCallback((file: File) => {
    setSelectedFile(file);
    setUploaded(null);
    setConverted(null);
    setOutputFormat("");
    setError(null);
    setPhase("idle");
  }, []);

  const upload = useCallback(async (file?: File) => {
    const target = file ?? selectedFile;
    if (!target) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setPhase("uploading");
    setError(null);
    setConverted(null);

    try {
      const formData = new FormData();
      formData.append("file", target);
      const meta = await api.upload<UploadedFileMeta>("/transmute/files", formData);
      setUploaded(meta);
      setSelectedFile(target);
      const first = meta.compatibleFormats[0] ?? "";
      setOutputFormat(first);
      setPhase("ready");
      toast.success("Fichier uploadé");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec de l’upload";
      setError(message);
      setPhase("error");
      toast.error(message);
    }
  }, [selectedFile]);

  const convert = useCallback(async () => {
    if (!uploaded?.id || !outputFormat) {
      toast.error("Choisissez un format de sortie");
      return;
    }

    setPhase("converting");
    setError(null);

    try {
      const meta = await api.post<ConvertedFileMeta>("/transmute/conversions", {
        fileId: uploaded.id,
        outputFormat,
      });
      setConverted(meta);
      setPhase("done");
      toast.success("Conversion terminée");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec de la conversion";
      setError(message);
      setPhase("error");
      toast.error(message);
    }
  }, [uploaded, outputFormat]);

  const download = useCallback(async () => {
    if (!converted?.id) return;
    try {
      const blob = await api.getBlob(`/transmute/files/${converted.id}/download`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const base =
        converted.originalFilename?.replace(/\.[^/.]+$/, "") ||
        uploaded?.originalFilename?.replace(/\.[^/.]+$/, "") ||
        "converted";
      const ext = converted.extension?.replace(/^\./, "") || outputFormat || "bin";
      link.download = `${base}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Téléchargement démarré");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec du téléchargement";
      toast.error(message);
    }
  }, [converted, uploaded, outputFormat]);

  return {
    phase,
    error,
    selectedFile,
    uploaded,
    outputFormat,
    converted,
    reachable,
    setOutputFormat,
    selectFile,
    upload,
    convert,
    download,
    reset,
    checkStatus,
    isBusy: phase === "uploading" || phase === "converting",
  };
}
