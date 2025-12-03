import { ProcessedImage } from "@/types/image-resizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle2, FileImage } from "lucide-react";

interface ExportPanelProps {
  image: ProcessedImage;
  onDownload: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const calculateReduction = (original: number, processed: number): number => {
  return Math.round(((original - processed) / original) * 100);
};

export const ExportPanel = ({ image, onDownload }: ExportPanelProps) => {
  const sizeReduction = calculateReduction(image.originalSize, image.processedSize);
  const fileName = image.originalFile.name.replace(/\.[^/.]+$/, "") + ".webp";

  return (
    <div className="space-y-6">
      {/* Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Exporter l'image optimisée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-muted rounded-lg border-2 border-dashed">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg">Image prête à être exportée</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Format WebP optimisé pour WordPress
                </p>
              </div>
            </div>
          </div>

          <Button onClick={onDownload} size="lg" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Télécharger {fileName}
          </Button>
        </CardContent>
      </Card>

      {/* File Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations du fichier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nom du fichier</p>
                <p className="font-mono text-sm font-medium break-all">{fileName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Format</p>
                <p className="font-medium">WebP</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Dimensions</p>
                <p className="font-mono font-medium">
                  {image.processedDimensions.width} × {image.processedDimensions.height} px
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Taille du fichier</p>
                <p className="font-medium">{formatFileSize(image.processedSize)}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Réduction de taille</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {sizeReduction > 0 ? `-${sizeReduction}%` : `${Math.abs(sizeReduction)}%`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Économie</p>
                  <p className="text-lg font-medium">
                    {formatFileSize(image.originalSize - image.processedSize)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WordPress Integration Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conseils pour WordPress</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>
                Le format WebP est automatiquement pris en charge par WordPress 5.8+
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>
                Pour une compatibilité maximale, utilisez un plugin comme "WebP Express"
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>
                Les images WebP réduisent significativement le temps de chargement des pages
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>
                Qualité recommandée : 75% pour un bon équilibre qualité/taille
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};




