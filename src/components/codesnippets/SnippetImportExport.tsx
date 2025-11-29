import { useState, useRef } from "react";
import { Upload, Download, FileJson, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SnippetImportExportProps {
  onImport: (data: unknown) => number;
  onExportWPCodeBox: () => void;
  onExportNative: () => void;
}

const SnippetImportExport = ({ onImport, onExportWPCodeBox, onExportNative }: SnippetImportExportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const count = onImport(json);
        toast({
          title: "Import réussi",
          description: `${count} snippet(s) importé(s)`,
        });
        setIsOpen(false);
      } catch (error) {
        toast({
          title: "Erreur d'import",
          description: "Le fichier JSON est invalide",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePasteImport = () => {
    try {
      const json = JSON.parse(jsonInput);
      const count = onImport(json);
      toast({
        title: "Import réussi",
        description: `${count} snippet(s) importé(s)`,
      });
      setJsonInput("");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Le JSON est invalide",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Importer</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importer des snippets</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Fichier</TabsTrigger>
              <TabsTrigger value="paste">Coller JSON</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Formats supportés: WPCodeBox, format natif
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full h-32 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileJson className="w-10 h-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner un fichier JSON
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Compatible WPCodeBox
                  </span>
                </div>
              </Button>
            </TabsContent>
            
            <TabsContent value="paste" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Collez directement le JSON exporté de WPCodeBox ou autre
              </div>
              <Textarea
                placeholder='{"snippets": [...]}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-[180px] font-mono text-sm"
              />
              <Button 
                onClick={handlePasteImport} 
                disabled={!jsonInput.trim()} 
                className="w-full"
              >
                Importer depuis le JSON collé
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exporter</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportWPCodeBox}>
            <FileJson className="w-4 h-4 mr-2" />
            Format WPCodeBox
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportNative}>
            <FileJson className="w-4 h-4 mr-2" />
            Format natif
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SnippetImportExport;
