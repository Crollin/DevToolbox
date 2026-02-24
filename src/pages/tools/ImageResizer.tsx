import { useState, useEffect } from "react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { useImageResizer } from "@/hooks/useImageResizer";
import { ImageUploader } from "@/components/imageresizer/ImageUploader";
import { ResizeControls } from "@/components/imageresizer/ResizeControls";
import { QualitySlider } from "@/components/imageresizer/QualitySlider";
import { ImagePreview } from "@/components/imageresizer/ImagePreview";
import { ExportPanel } from "@/components/imageresizer/ExportPanel";
import { Button } from "@/components/ui/button";
import { Play, ImageIcon, Layers } from "lucide-react";
import { toast } from "sonner";
import type { ImageResizerMode } from "@/types/image-resizer";

const ImageResizer = () => {
  const tool = tools.find((t) => t.id === "image-resizer")!;
  const [mode, setMode] = useState<ImageResizerMode>("single");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState("settings");
  const {
    currentImage,
    isProcessing,
    error,
    settings,
    processImage,
    processBatch,
    updateSettings,
    clearImage,
    clearBatch,
    downloadImage,
    downloadProcessedImage,
    downloadAllAsZip,
    processedImages,
    batchProgress,
    batchFailedCount,
  } = useImageResizer();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    clearImage();
  };

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
    clearBatch();
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearBatch = () => {
    setSelectedFiles([]);
    clearBatch();
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    await processImage(selectedFile, settings);
  };

  const handleProcessBatch = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Veuillez sélectionner au moins une image");
      return;
    }
    await processBatch(selectedFiles, settings);
  };

  const handleClear = () => {
    setSelectedFile(null);
    clearImage();
  };

  const handleModeChange = (value: string) => {
    if (value === "single" || value === "batch") {
      setMode(value);
      if (value === "single") {
        setSelectedFiles([]);
        clearBatch();
      } else {
        setSelectedFile(null);
        clearImage();
      }
    }
  };

  const hasBatchData = processedImages.length > 0;
  const hasSingleData = !!currentImage;

  useEffect(() => {
    if (mode === "single" && currentImage && !isProcessing) {
      setActiveTab("preview");
    }
  }, [mode, currentImage, isProcessing]);

  useEffect(() => {
    if (mode === "batch" && hasBatchData && !isProcessing) {
      setActiveTab("export");
    }
  }, [mode, hasBatchData, isProcessing]);

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold mb-2">Mode</h2>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={handleModeChange}
            className="inline-flex"
          >
            <ToggleGroupItem value="single" aria-label="Image unique">
              <ImageIcon className="w-4 h-4 mr-2" />
              Image unique
            </ToggleGroupItem>
            <ToggleGroupItem value="batch" aria-label="Lots">
              <Layers className="w-4 h-4 mr-2" />
              Lots
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              1. Téléverser {mode === "single" ? "une image" : "des images"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "single"
                ? "Glissez-déposez ou sélectionnez une image à redimensionner et optimiser"
                : "Glissez-déposez ou sélectionnez plusieurs images à traiter avec les mêmes paramètres"}
            </p>
          </div>
          {mode === "single" ? (
            <ImageUploader
              mode="single"
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
              currentImage={selectedFile}
              onClear={handleClear}
            />
          ) : (
            <ImageUploader
              mode="batch"
              onFilesSelect={handleFilesSelect}
              currentFiles={selectedFiles}
              onRemoveFile={handleRemoveFile}
              onClearBatch={handleClearBatch}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="preview" disabled={mode === "batch" || !hasSingleData}>
              Prévisualisation
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!hasSingleData && !hasBatchData}>
              Export
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">2. Configuration du redimensionnement</h3>
                  <p className="text-sm text-muted-foreground">
                    Choisissez un preset WordPress ou définissez des dimensions personnalisées
                  </p>
                </div>
                <ResizeControls settings={settings} onSettingsChange={updateSettings} />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">3. Qualité WebP</h3>
                  <p className="text-sm text-muted-foreground">
                    Ajustez la qualité de compression WebP (50-100%)
                  </p>
                </div>
                <QualitySlider
                  quality={settings.quality}
                  onQualityChange={(quality) => updateSettings({ quality })}
                />
              </div>
            </div>

            {/* Process Button */}
            {mode === "single" && selectedFile && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Traiter l'image
                    </>
                  )}
                </Button>
              </div>
            )}

            {mode === "batch" && selectedFiles.length > 0 && (
              <div className="flex flex-col items-center gap-4 pt-4">
                <Button
                  onClick={handleProcessBatch}
                  disabled={isProcessing}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Traiter {selectedFiles.length} image(s)
                    </>
                  )}
                </Button>
                {isProcessing && (
                  <div className="w-full max-w-md space-y-2">
                    <Progress value={batchProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {Math.round(batchProgress)}% traité
                      {batchFailedCount > 0 && ` · ${batchFailedCount} échec(s)`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">Erreur</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            )}
          </TabsContent>

          {/* Preview Tab (single only) */}
          <TabsContent value="preview">
            {currentImage ? (
              <ImagePreview image={currentImage} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune image traitée. Configurez les paramètres et traitez une image.</p>
              </div>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            {mode === "single" && currentImage ? (
              <ExportPanel mode="single" image={currentImage} onDownload={downloadImage} />
            ) : mode === "batch" ? (
              <ExportPanel
                mode="batch"
                images={processedImages}
                onDownloadSingle={downloadProcessedImage}
                onDownloadAll={() => downloadAllAsZip(processedImages)}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune image à exporter. Traitez d'abord vos images.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ToolLayout>
  );
};

export default ImageResizer;
