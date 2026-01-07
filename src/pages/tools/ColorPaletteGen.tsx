import { useState } from "react";
import { RefreshCw, Plus, Settings2 } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useColorPalettes } from "@/hooks/useColorPalettes";
import { HarmonyType, harmonyLabels } from "@/types/palette";
import PaletteSidebar from "@/components/palette/PaletteSidebar";
import PaletteColorCard from "@/components/palette/PaletteColorCard";
import ContrastChecker from "@/components/palette/ContrastChecker";
import PaletteExporter from "@/components/palette/PaletteExporter";
import UIPreview from "@/components/palette/UIPreview";

const ColorPaletteGen = () => {
  const tool = tools.find((t) => t.id === "color-palette-gen")!;
  const [colorFormat, setColorFormat] = useState<"hex" | "rgb" | "hsl">("hex");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    palettes,
    activePalette,
    activePaletteId,
    setActivePaletteId,
    createPalette,
    deletePalette,
    duplicatePalette,
    updatePalette,
    addColor,
    removeColor,
    updateColor,
    toggleLock,
    generatePalette,
    importPalette,
    loadPredefinedPalette,
  } = useColorPalettes();

  if (!activePalette) return null;

  return (
    <ToolLayout tool={tool}>
      <div className="flex h-[calc(100vh-120px)] -mx-4 -mt-6">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block w-64 shrink-0">
          <PaletteSidebar
            palettes={palettes}
            activePaletteId={activePaletteId}
            onSelectPalette={setActivePaletteId}
            onCreatePalette={createPalette}
            onDeletePalette={deletePalette}
            onDuplicatePalette={duplicatePalette}
            onImportPalette={importPalette}
            onLoadPredefinedPalette={loadPredefinedPalette}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-border bg-card/30">
            <div className="flex flex-wrap items-center gap-4">
              {/* Mobile sidebar trigger */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" size="sm">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Palettes
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <PaletteSidebar
                    palettes={palettes}
                    activePaletteId={activePaletteId}
                    onSelectPalette={(id) => {
                      setActivePaletteId(id);
                      setSidebarOpen(false);
                    }}
                    onCreatePalette={() => {
                      createPalette();
                      setSidebarOpen(false);
                    }}
                    onDeletePalette={deletePalette}
                    onDuplicatePalette={duplicatePalette}
                    onImportPalette={importPalette}
                    onLoadPredefinedPalette={(id) => {
                      loadPredefinedPalette(id);
                      setSidebarOpen(false);
                    }}
                  />
                </SheetContent>
              </Sheet>

              {/* Palette name */}
              <div className="flex-1 min-w-0">
                <Input
                  value={activePalette.name}
                  onChange={(e) => updatePalette(activePaletteId, { name: e.target.value })}
                  className="h-9 font-semibold text-lg bg-transparent border-transparent hover:border-border focus:border-primary"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Select
                  value={activePalette.harmony}
                  onValueChange={(v) => generatePalette(activePaletteId, v as HarmonyType)}
                >
                  <SelectTrigger className="w-40 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(harmonyLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={colorFormat} onValueChange={(v) => setColorFormat(v as "hex" | "rgb" | "hsl")}>
                  <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hex">HEX</SelectItem>
                    <SelectItem value="rgb">RGB</SelectItem>
                    <SelectItem value="hsl">HSL</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => generatePalette(activePaletteId, activePalette.harmony)}
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Générer
                </Button>

                <Button
                  onClick={() => addColor(activePaletteId)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <Textarea
              value={activePalette.description}
              onChange={(e) => updatePalette(activePaletteId, { description: e.target.value })}
              placeholder="Description du projet..."
              className="mt-3 resize-none h-16 text-sm bg-transparent"
            />
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto p-4">
            <Tabs defaultValue="palette" className="h-full flex flex-col">
              <TabsList className="w-fit mb-4">
                <TabsTrigger value="palette">Palette</TabsTrigger>
                <TabsTrigger value="preview">Prévisualisation</TabsTrigger>
                <TabsTrigger value="contrast">Contraste</TabsTrigger>
                <TabsTrigger value="export">Exporter</TabsTrigger>
              </TabsList>

              <TabsContent value="palette" className="flex-1 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {activePalette.colors.map((color) => (
                    <PaletteColorCard
                      key={color.id}
                      color={color}
                      colorFormat={colorFormat}
                      onUpdate={(updates) => updateColor(activePaletteId, color.id, updates)}
                      onToggleLock={() => toggleLock(activePaletteId, color.id)}
                      onRemove={() => removeColor(activePaletteId, color.id)}
                    />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground text-center mt-6">
                  Astuce : Verrouillez une couleur pour la conserver lors de la génération • Cliquez sur les nuances pour les copier
                </p>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 mt-0">
                <div className="max-w-2xl mx-auto">
                  <UIPreview colors={activePalette.colors} />
                </div>
              </TabsContent>

              <TabsContent value="contrast" className="flex-1 mt-0">
                <div className="max-w-xl mx-auto">
                  <ContrastChecker colors={activePalette.colors} />
                </div>
              </TabsContent>

              <TabsContent value="export" className="flex-1 mt-0">
                <div className="max-w-2xl mx-auto">
                  <PaletteExporter palette={activePalette} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default ColorPaletteGen;
