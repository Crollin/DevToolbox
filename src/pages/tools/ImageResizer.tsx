import { useState, useEffect } from "react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageResizer } from "@/hooks/useImageResizer";
import { ImageUploader } from "@/components/imageresizer/ImageUploader";
import { ResizeControls } from "@/components/imageresizer/ResizeControls";
import { QualitySlider } from "@/components/imageresizer/QualitySlider";
import { ImagePreview } from "@/components/imageresizer/ImagePreview";
import { ExportPanel } from "@/components/imageresizer/ExportPanel";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { toast } from "sonner";

const ImageResizer = () => {
  const tool = tools.find((t) => t.id === "image-resizer")!;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("settings");
  const {
    currentImage,
    isProcessing,
    error,
    settings,
    processImage,
    updateSettings,
    clearImage,
    downloadImage,
  } = useImageResizer();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    clearImage();
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    await processImage(selectedFile, settings);
  };

  const handleClear = () => {
    setSelectedFile(null);
    clearImage();
  };

  // Navigation automatique vers l'onglet prévisualisation après traitement réussi
  useEffect(() => {
    if (currentImage && !isProcessing) {
      setActiveTab("preview");
    }
  }, [currentImage, isProcessing]);

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Téléverser une image</h2>
            <p className="text-sm text-muted-foreground">
              Glissez-déposez ou sélectionnez une image à redimensionner et optimiser
            </p>
          </div>
          <ImageUploader
            onFileSelect={handleFileSelect}
            isProcessing={isProcessing}
            currentImage={selectedFile}
            onClear={handleClear}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="preview" disabled={!currentImage}>
              Prévisualisation
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!currentImage}>
              Export
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Resize Controls */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">2. Configuration du redimensionnement</h3>
                  <p className="text-sm text-muted-foreground">
                    Choisissez un preset WordPress ou définissez des dimensions personnalisées
                  </p>
                </div>
                <ResizeControls settings={settings} onSettingsChange={updateSettings} />
              </div>

              {/* Quality Settings */}
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
            {selectedFile && (
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

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">Erreur</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            )}
          </TabsContent>

          {/* Preview Tab */}
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
            {currentImage ? (
              <ExportPanel image={currentImage} onDownload={downloadImage} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune image à exporter. Traitez d'abord une image.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ToolLayout>
  );
};

export default ImageResizer;

