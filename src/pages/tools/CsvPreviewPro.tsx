import { useState } from "react";
import { FileSpreadsheet, Upload, Download, Table, Grid3X3 } from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { cn } from "@/lib/utils";

const sampleData = [
  { id: 1, nom: "Dupont", prenom: "Jean", email: "jean.dupont@email.com", ville: "Paris" },
  { id: 2, nom: "Martin", prenom: "Marie", email: "marie.martin@email.com", ville: "Lyon" },
  { id: 3, nom: "Bernard", prenom: "Pierre", email: "pierre.bernard@email.com", ville: "Marseille" },
  { id: 4, nom: "Petit", prenom: "Sophie", email: "sophie.petit@email.com", ville: "Bordeaux" },
  { id: 5, nom: "Robert", prenom: "Lucas", email: "lucas.robert@email.com", ville: "Lille" },
];

const CsvPreviewPro = () => {
  const tool = tools.find((t) => t.id === "csv-preview-pro")!;
  const [data] = useState(sampleData);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <ToolLayout tool={tool}>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Aperçu CSV</h2>
            <p className="text-muted-foreground text-sm">
              {data.length} ligne{data.length !== 1 ? "s" : ""} • {columns.length} colonne{columns.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "cards" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-all">
              <Upload className="w-4 h-4" />
              Importer
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>

        {/* Drop Zone */}
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">Glissez votre fichier CSV ici</p>
          <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner un fichier</p>
        </div>

        {/* Data View */}
        {viewMode === "table" ? (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-3 text-sm text-foreground">
                          {String(row[col as keyof typeof row])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((row, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
                {columns.map((col) => (
                  <div key={col} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-xs text-muted-foreground uppercase">{col}</span>
                    <span className="text-sm text-foreground font-medium">
                      {String(row[col as keyof typeof row])}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default CsvPreviewPro;
