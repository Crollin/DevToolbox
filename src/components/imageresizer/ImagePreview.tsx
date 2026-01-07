import { useState } from "react";
import { ProcessedImage } from "@/types/image-resizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, TrendingDown, TrendingUp, Maximize2 } from "lucide-react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

interface ImagePreviewProps {
  image: ProcessedImage;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const calculateReduction = (original: number, processed: number): number => {
  return Math.round(((original - processed) / original) * 100);
};

export const ImagePreview = ({ image }: ImagePreviewProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const sizeReduction = calculateReduction(image.originalSize, image.processedSize);
  const dimensionReduction = {
    width: Math.round(((image.originalDimensions.width - image.processedDimensions.width) / image.originalDimensions.width) * 100),
    height: Math.round(((image.originalDimensions.height - image.processedDimensions.height) / image.originalDimensions.height) * 100),
  };

  return (
    <div className="space-y-6">
      {/* Before/After Slider */}
      <div className="space-y-4">
        <BeforeAfterSlider image={image} />
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setLightboxOpen(true)}
            className="gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            Voir l'image optimisée en grand format
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistiques d'optimisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-emerald-500" />
                <p className="text-sm text-muted-foreground">Réduction de taille</p>
              </div>
              <p className="text-2xl font-bold text-emerald-500">
                {sizeReduction > 0 ? `-${sizeReduction}%` : `${Math.abs(sizeReduction)}%`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFileSize(image.originalSize)} → {formatFileSize(image.processedSize)}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Réduction largeur</p>
              </div>
              <p className="text-2xl font-bold text-blue-500">
                {dimensionReduction.width > 0 ? `-${dimensionReduction.width}%` : `${Math.abs(dimensionReduction.width)}%`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {image.originalDimensions.width}px → {image.processedDimensions.width}px
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-purple-500" />
                <p className="text-sm text-muted-foreground">Réduction hauteur</p>
              </div>
              <p className="text-2xl font-bold text-purple-500">
                {dimensionReduction.height > 0 ? `-${dimensionReduction.height}%` : `${Math.abs(dimensionReduction.height)}%`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {image.originalDimensions.height}px → {image.processedDimensions.height}px
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Used */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paramètres utilisés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Qualité WebP</p>
              <p className="font-medium">{image.settings.quality}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ratio d'aspect</p>
              <p className="font-medium">
                {image.settings.maintainAspectRatio ? "Conservé" : "Modifié"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Format</p>
              <p className="font-medium">WebP</p>
            </div>
            <div>
              <p className="text-muted-foreground">Traitement</p>
              <p className="font-medium">
                {new Date(image.processedAt).toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lightbox pour l'image convertie */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={image.processedUrl}
              alt="Image optimisée en grand format"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
              <p className="font-medium">
                {image.processedDimensions.width} × {image.processedDimensions.height} px
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFileSize(image.processedSize)} • Qualité {image.settings.quality}%
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};







