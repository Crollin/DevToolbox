import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { useFileConverter } from "@/hooks/useFileConverter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Download, FileUp, Loader2, RefreshCw, Upload } from "lucide-react";

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const FileConverter = () => {
  const tool = tools.find((t) => t.id === "file-converter")!;
  const { transmuteEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const {
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
    isBusy,
  } = useFileConverter();

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (transmuteEnabled) {
      void checkStatus();
    }
  }, [transmuteEnabled, checkStatus]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (flagsLoading) {
    return (
      <ToolLayout tool={tool}>
        <p className="text-muted-foreground">Chargement…</p>
      </ToolLayout>
    );
  }

  if (!transmuteEnabled) {
    return (
      <ToolLayout tool={tool}>
        <div className="mx-auto max-w-xl space-y-3 rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold">Transmute non configuré</h2>
          <p className="text-sm text-muted-foreground">
            Définissez <code className="font-mono text-xs">TRANSMUTE_BASE_URL</code> et{" "}
            <code className="font-mono text-xs">TRANSMUTE_API_KEY</code> côté backend, puis
            redémarrez le service.
          </p>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout tool={tool}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {reachable === false && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            Transmute semble injoignable. Vérifiez l’instance et la clé API.
          </div>
        )}

        <div
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 transition-colors",
            dragging && "border-primary bg-primary/5",
            isBusy && "pointer-events-none opacity-60"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <FileUp className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Glissez un fichier ici, ou cliquez pour parcourir
          </p>
          <p className="text-xs text-muted-foreground">Max 100 Mo — tous formats supportés par Transmute</p>
          <input ref={inputRef} type="file" className="hidden" onChange={onInput} />
        </div>

        {selectedFile && (
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={reset} disabled={isBusy}>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Réinitialiser
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void upload(selectedFile)}
                  disabled={isBusy}
                >
                  {phase === "uploading" ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-1 h-4 w-4" />
                  )}
                  Envoyer
                </Button>
              </div>
            </div>

            {(phase === "uploading" || phase === "converting") && (
              <Progress value={phase === "uploading" ? 35 : 70} className="h-2" />
            )}

            {uploaded && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Formats compatibles : {uploaded.compatibleFormats.length || "aucun"}
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[180px] flex-1 space-y-1.5">
                    <label className="text-xs text-muted-foreground">Format de sortie</label>
                    <Select
                      value={outputFormat}
                      onValueChange={setOutputFormat}
                      disabled={isBusy || uploaded.compatibleFormats.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir…" />
                      </SelectTrigger>
                      <SelectContent>
                        {uploaded.compatibleFormats.map((fmt) => (
                          <SelectItem key={fmt} value={fmt}>
                            {fmt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => void convert()}
                    disabled={isBusy || !outputFormat}
                  >
                    {phase === "converting" ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : null}
                    Convertir
                  </Button>
                </div>
              </div>
            )}

            {converted && phase === "done" && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-sm font-medium">Prêt : {converted.originalFilename}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(converted.sizeBytes)}</p>
                </div>
                <Button type="button" onClick={() => void download()}>
                  <Download className="mr-1 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default FileConverter;
