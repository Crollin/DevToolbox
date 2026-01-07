import { useState, useRef, useEffect } from "react";
import { ProcessedImage } from "@/types/image-resizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

interface BeforeAfterSliderProps {
  image: ProcessedImage;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

export const BeforeAfterSlider = ({ image }: BeforeAfterSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50); // 0-100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (e.touches[0]) {
      updateSliderPosition(e.touches[0].clientX);
    }
  };

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    if (isDragging) {
      const mouseMoveHandler = (e: MouseEvent) => {
        e.preventDefault();
        updateSliderPosition(e.clientX);
      };
      const mouseUpHandler = () => {
        setIsDragging(false);
      };
      const touchMoveHandler = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches[0]) {
          updateSliderPosition(e.touches[0].clientX);
        }
      };
      const touchEndHandler = () => {
        setIsDragging(false);
      };

      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
      document.addEventListener("touchmove", touchMoveHandler);
      document.addEventListener("touchend", touchEndHandler);

      return () => {
        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
        document.removeEventListener("touchmove", touchMoveHandler);
        document.removeEventListener("touchend", touchEndHandler);
      };
    }
  }, [isDragging]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Comparaison avant/après</span>
          <div className="flex gap-2">
            <Badge variant="outline">Avant</Badge>
            <Badge variant="default" className="bg-primary">
              Après
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slider Container */}
        <div
          ref={containerRef}
          className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border select-none"
          style={{ touchAction: "none" }}
        >
          {/* Original Image (Background) */}
          <div className="absolute inset-0">
            <img
              src={image.originalUrl}
              alt="Image originale"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {/* Processed Image (Overlay) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            }}
          >
            <img
              src={image.processedUrl}
              alt="Image optimisée"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {/* Slider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {/* Slider Handle */}
              <div
                className={`
                  w-10 h-10 rounded-full bg-white shadow-lg border-2 border-primary
                  flex items-center justify-center cursor-grab active:cursor-grabbing
                  transition-transform hover:scale-110
                  ${isDragging ? "scale-110" : ""}
                `}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{ touchAction: "none", pointerEvents: "auto" }}
              >
                <GripVertical className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-md text-sm font-medium pointer-events-none">
            Avant
          </div>
          <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium pointer-events-none">
            Après
          </div>
        </div>

        {/* Image Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Dimensions originales</p>
            <p className="font-mono font-medium">
              {image.originalDimensions.width} × {image.originalDimensions.height} px
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(image.originalSize)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Dimensions optimisées</p>
            <p className="font-mono font-medium">
              {image.processedDimensions.width} × {image.processedDimensions.height} px
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(image.processedSize)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

