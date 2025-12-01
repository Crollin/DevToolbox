import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  currentImage?: File | null;
  onClear?: () => void;
}

export const ImageUploader = ({
  onFileSelect,
  isProcessing = false,
  currentImage,
  onClear,
}: ImageUploaderProps) => {
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

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(
      (file) => file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    );

    if (imageFile) {
      onFileSelect(imageFile);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

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
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {currentImage ? (
            <>
              <div className="relative">
                <ImageIcon className="w-16 h-16 text-primary" />
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <X className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">{currentImage.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(currentImage.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {onClear && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Changer d'image
                </Button>
              )}
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  Glissez-déposez une image ici
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou cliquez pour sélectionner un fichier
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

