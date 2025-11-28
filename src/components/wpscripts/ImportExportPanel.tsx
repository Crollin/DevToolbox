import { useState, useRef } from "react";
import { Upload, Download, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ImportExportPanelProps {
  onImport: (data: any) => number;
  onExport: () => void;
}

const ImportExportPanel = ({ onImport, onExport }: ImportExportPanelProps) => {
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
          description: `${count} script(s) importé(s)`,
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
  };

  const handlePasteImport = () => {
    try {
      const json = JSON.parse(jsonInput);
      const count = onImport(json);
      toast({
        title: "Import réussi",
        description: `${count} script(s) importé(s)`,
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
            Importer
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des scripts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* File upload */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full h-24 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileJson className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner un fichier JSON
                  </span>
                </div>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Paste JSON */}
            <div className="space-y-2">
              <Textarea
                placeholder='Collez votre JSON ici... {"scripts": [...]}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <Button onClick={handlePasteImport} disabled={!jsonInput.trim()} className="w-full">
                Importer depuis le JSON collé
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="w-4 h-4 mr-2" />
        Exporter
      </Button>
    </div>
  );
};

export default ImportExportPanel;
