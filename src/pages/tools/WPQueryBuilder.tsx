import { useState } from "react";
import { Save, Database, Download, Layers } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { useWPQuery } from "@/hooks/useWPQuery";
import { WPQueryConfig, SavedQuery } from "@/types/wpquery";
import QueryBuilder from "@/components/wpquery/QueryBuilder";
import QueryPreview from "@/components/wpquery/QueryPreview";
import SavedQueries from "@/components/wpquery/SavedQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QUERY_PRESETS: { label: string; config: WPQueryConfig }[] = [
  { label: "Posts récents", config: { post_type: "post", posts_per_page: 10, orderby: "date", order: "DESC" } },
  { label: "Pages publiées", config: { post_type: "page", post_status: "publish", posts_per_page: -1 } },
  { label: "CPT produit", config: { post_type: "product", posts_per_page: 12, orderby: "title", order: "ASC" } },
];

const WPQueryBuilder = () => {
  const tool = tools.find((t) => t.id === "wp-query-builder")!;

  const { savedQueries, isLoaded, saveQuery, deleteQuery, getQuery } = useWPQuery();

  const [config, setConfig] = useState<WPQueryConfig>({});
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  const handleSave = () => {
    if (!saveName.trim()) {
      toast({ title: "Le nom est requis", variant: "destructive" });
      return;
    }
    saveQuery(saveName.trim(), config, saveDescription.trim() || undefined);
    toast({ title: "Requête sauvegardée" });
    setSaveDialogOpen(false);
    setSaveName("");
    setSaveDescription("");
  };

  const handleLoad = (query: SavedQuery) => {
    setConfig(query.config);
    toast({ title: "Requête chargée" });
  };

  const handleDelete = (id: string) => {
    deleteQuery(id);
  };

  const exportToFunctionsPhp = () => {
    const args = JSON.stringify(config, null, 2)
      .replace(/"([^"]+)":/g, "'$1' =>")
      .replace(/"/g, "'");
    const code = `$query = new WP_Query([\n${args}\n]);`;
    void navigator.clipboard.writeText(code);
    toast({ title: "Code WP_Query copié", description: "Collez dans functions.php ou un plugin." });
  };

  if (!isLoaded) {
    return (
      <ToolLayout tool={tool}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout tool={tool}>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">WP Query Builder</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Constructeur visuel de requêtes WP_Query
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setSaveDialogOpen(true)}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
            <Button variant="outline" onClick={exportToFunctionsPhp}>
              <Download className="w-4 h-4 mr-2" />
              Exporter PHP
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Presets :</span>
          {QUERY_PRESETS.map((p) => (
            <Button key={p.label} variant="secondary" size="sm" onClick={() => { setConfig(p.config); toast({ title: `Preset « ${p.label} » appliqué` }); }}>
              {p.label}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="preview">Prévisualisation</TabsTrigger>
            <TabsTrigger value="saved">Sauvegardées</TabsTrigger>
          </TabsList>

          {/* Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <QueryBuilder config={config} onChange={setConfig} />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <QueryPreview config={config} />
          </TabsContent>

          {/* Saved Queries Tab */}
          <TabsContent value="saved" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Requêtes sauvegardées</h3>
              <SavedQueries
                queries={savedQueries}
                onLoad={handleLoad}
                onDelete={handleDelete}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder la requête</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="save-name">Nom *</Label>
              <Input
                id="save-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Ma requête personnalisée"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="save-description">Description</Label>
              <Textarea
                id="save-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Description optionnelle..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolLayout>
  );
};

export default WPQueryBuilder;





