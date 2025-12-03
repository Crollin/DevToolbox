import { ProcessedImage } from "@/types/image-resizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingDown, TrendingUp } from "lucide-react";

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
  const sizeReduction = calculateReduction(image.originalSize, image.processedSize);
  const dimensionReduction = {
    width: Math.round(((image.originalDimensions.width - image.processedDimensions.width) / image.originalDimensions.width) * 100),
    height: Math.round(((image.originalDimensions.height - image.processedDimensions.height) / image.originalDimensions.height) * 100),
  };

  return (
    <div className="space-y-6">
      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Original Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Image originale</span>
              <Badge variant="outline">Avant</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
              <img
                src={image.originalUrl}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Dimensions</p>
                <p className="font-mono font-medium">
                  {image.originalDimensions.width} × {image.originalDimensions.height} px
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Taille</p>
                <p className="font-medium">{formatFileSize(image.originalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processed Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Image optimisée</span>
              <Badge variant="default" className="bg-primary">
                Après
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
              <img
                src={image.processedUrl}
                alt="Processed"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Dimensions</p>
                <p className="font-mono font-medium">
                  {image.processedDimensions.width} × {image.processedDimensions.height} px
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Taille</p>
                <p className="font-medium">{formatFileSize(image.processedSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
};




