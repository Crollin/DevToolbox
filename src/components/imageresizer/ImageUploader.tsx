import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, Image as ImageIcon, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImageUploaderBaseProps {
  mode: "single" | "batch";
  isProcessing?: boolean;
}

interface ImageUploaderSingleProps extends ImageUploaderBaseProps {
  mode: "single";
  onFileSelect: (file: File) => void;
  currentImage?: File | null;
  onClear?: () => void;
}

interface ImageUploaderBatchProps extends ImageUploaderBaseProps {
  mode: "batch";
  onFilesSelect: (files: File[]) => void;
  currentFiles?: File[];
  onRemoveFile?: (index: number) => void;
  onClearBatch?: () => void;
}

type ImageUploaderProps = ImageUploaderSingleProps | ImageUploaderBatchProps;

const isImageFile = (file: File) =>
  file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

export const ImageUploader = (props: ImageUploaderProps) => {
  const { mode, isProcessing = false } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(isImageFile);

    if (mode === "single" && "onFileSelect" in props) {
      if (files[0]) props.onFileSelect(files[0]);
    } else if (mode === "batch" && "onFilesSelect" in props) {
      const current = props.currentFiles ?? [];
      props.onFilesSelect([...current, ...files]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(isImageFile);

    if (mode === "single" && "onFileSelect" in props) {
      if (imageFiles[0]) props.onFileSelect(imageFiles[0]);
    } else if (mode === "batch" && "onFilesSelect" in props) {
      const current = props.currentFiles ?? [];
      props.onFilesSelect([...current, ...imageFiles]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClick = () => fileInputRef.current?.click();

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragging && "border-primary bg-primary/5",
          isProcessing && "opacity-50 pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={mode === "batch"}
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {mode === "single" && "currentImage" in props && props.currentImage ? (
            <>
              <div className="relative">
                <ImageIcon className="w-16 h-16 text-primary" />
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <X className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">{props.currentImage.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(props.currentImage.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {props.onClear && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onClear!();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Changer d'image
                </Button>
              )}
            </>
          ) : mode === "batch" && "currentFiles" in props && props.currentFiles?.length ? (
            <>
              <div className="flex items-center gap-2">
                <FileImage className="w-16 h-16 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    {props.currentFiles.length} image(s) sélectionnée(s)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Glissez-déposez ou cliquez pour ajouter
                  </p>
                </div>
              </div>
              <ScrollArea className="w-full max-h-32 rounded-md border">
                <div className="p-2 space-y-1">
                  {props.currentFiles.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onRemoveFile?.(i);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {props.onClearBatch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onClearBatch!();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Tout effacer
                </Button>
              )}
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {mode === "batch"
                    ? "Glissez-déposez des images ici"
                    : "Glissez-déposez une image ici"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou cliquez pour sélectionner {mode === "batch" ? "des fichiers" : "un fichier"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Formats supportés : JPG, PNG, GIF, WebP, SVG
                </p>
              </div>
            </>
          )}
        </div>

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Traitement en cours...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
