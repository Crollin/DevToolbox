import { ProcessedImage } from "@/types/image-resizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle2, FileImage, FileArchive } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExportPanelSingleProps {
  mode: "single";
  image: ProcessedImage;
  onDownload: () => void;
}

interface ExportPanelBatchProps {
  mode: "batch";
  images: ProcessedImage[];
  onDownloadSingle: (img: ProcessedImage) => void;
  onDownloadAll: () => void;
}

type ExportPanelProps = ExportPanelSingleProps | ExportPanelBatchProps;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const calculateReduction = (original: number, processed: number): number => {
  return Math.round(((original - processed) / original) * 100);
};

export const ExportPanel = (props: ExportPanelProps) => {
  if (props.mode === "single") {
    const { image, onDownload } = props;
    const sizeReduction = calculateReduction(image.originalSize, image.processedSize);
    const fileName = image.originalFile.name.replace(/\.[^/.]+$/, "") + ".webp";

    return (
      <div className="space-y-6">
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

        <WordPressTipsCard />
      </div>
    );
  }

  // Batch mode
  const { images, onDownloadSingle, onDownloadAll } = props;

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucune image à exporter. Traitez d'abord vos images.</p>
      </div>
    );
  }

  const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
  const totalProcessed = images.reduce((s, i) => s + i.processedSize, 0);
  const totalReduction = calculateReduction(totalOriginal, totalProcessed);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Exporter les images optimisées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-muted rounded-lg border-2 border-dashed">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg">{images.length} image(s) prête(s) à l'export</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Format WebP optimisé pour WordPress
                </p>
              </div>
            </div>
          </div>

          <Button onClick={onDownloadAll} size="lg" className="w-full">
            <FileArchive className="w-4 h-4 mr-2" />
            Télécharger tout en ZIP
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des images</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-2 space-y-2">
              {images.map((img) => {
                const fileName = img.originalFile.name.replace(/\.[^/.]+$/, "") + ".webp";
                const reduction = calculateReduction(img.originalSize, img.processedSize);
                return (
                  <div
                    key={img.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {img.processedDimensions.width}×{img.processedDimensions.height} ·{" "}
                        {formatFileSize(img.processedSize)} ·{" "}
                        <span className="text-emerald-600">-{reduction}%</span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadSingle(img)}
                      className="shrink-0"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Réduction totale</p>
            <p className="text-lg font-bold text-emerald-500">-{totalReduction}%</p>
          </div>
        </CardContent>
      </Card>

      <WordPressTipsCard />
    </div>
  );
};

function WordPressTipsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Conseils pour WordPress</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>Le format WebP est automatiquement pris en charge par WordPress 5.8+</span>
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
            <span>Qualité recommandée : 75% pour un bon équilibre qualité/taille</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
