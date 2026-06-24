import { useState, useCallback, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  Table as TableIcon,
  Trash2,
  File,
  Rows3,
  Columns3,
  Loader2,
  GripVertical,
} from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface CsvData {
  headers: string[];
  rows: string[][];
  fileName: string;
  delimiter: string;
}

const CsvPreviewPro = () => {
  const tool = tools.find((t) => t.id === "csv-preview-pro")!;
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectDelimiter = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").slice(0, 5).filter((line) => line.trim().length > 0);
        
        if (lines.length === 0) {
          resolve(",");
          return;
        }

        const delimiters = [
          { char: ",", name: "Virgule" },
          { char: ";", name: "Point-virgule" },
          { char: "\t", name: "Tabulation" },
          { char: "|", name: "Pipe" },
        ];

        const scores: { [key: string]: number[] } = {};
        
        delimiters.forEach((del) => {
          scores[del.char] = [];
          lines.forEach((line) => {
            const count = (line.match(new RegExp(`\\${del.char}`, "g")) || []).length;
            scores[del.char].push(count);
          });
        });

        // Trouver le délimiteur avec le plus grand nombre d'occurrences cohérentes
        let bestDelimiter = ",";
        let bestScore = 0;

        delimiters.forEach((del) => {
          const counts = scores[del.char];
          if (counts.length > 0) {
            const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
            const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / counts.length;
            // Score basé sur la moyenne moins la variance (cohérence)
            const score = avgCount - variance * 0.1;
            
            if (score > bestScore && avgCount > 0) {
              bestScore = score;
              bestDelimiter = del.char;
            }
          }
        });

        resolve(bestDelimiter);
      };
      reader.readAsText(file.slice(0, 1024 * 10)); // Lire les 10 premiers KB
    });
  }, []);

  const formatDelimiter = (delimiter: string): string => {
    const delimiterMap: { [key: string]: string } = {
      ",": "Virgule",
      ";": "Point-virgule",
      "\t": "Tabulation",
      "|": "Pipe",
    };
    return delimiterMap[delimiter] || delimiter;
  };

  const parseFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier CSV.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const detectedDelimiter = await detectDelimiter(file);

      Papa.parse(file, {
        delimiter: detectedDelimiter,
        complete: (results) => {
          const data = results.data as string[][];
          if (data.length > 0) {
            const headers = data[0];
            const rows = data.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""));
            setCsvData({
              headers,
              rows,
              fileName: file.name,
              delimiter: detectedDelimiter,
            });
            toast({
              title: "Fichier chargé",
              description: `${rows.length} lignes et ${headers.length} colonnes détectées.`,
            });
          }
          setIsLoading(false);
        },
        error: (error) => {
          toast({
            title: "Erreur de parsing",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
        },
      });
    } catch (error) {
      toast({
        title: "Erreur de détection",
        description: "Impossible de détecter le délimiteur. Utilisation de la virgule par défaut.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [detectDelimiter]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleClear = () => {
    setCsvData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const exportToPdf = () => {
    if (!csvData) return;

    const doc = new jsPDF({
      orientation: csvData.headers.length > 6 ? "landscape" : "portrait",
    });

    doc.setFontSize(16);
    doc.text(csvData.fileName.replace(".csv", ""), 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(`${csvData.rows.length} lignes • ${csvData.headers.length} colonnes`, 14, 22);

    autoTable(doc, {
      head: [csvData.headers],
      body: csvData.rows,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [6, 182, 212],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    doc.save(`${csvData.fileName.replace(".csv", "")}.pdf`);
    toast({
      title: "PDF exporté",
      description: "Le fichier a été téléchargé.",
    });
  };

  const exportToExcel = () => {
    if (!csvData) return;

    const worksheet = XLSX.utils.aoa_to_sheet([csvData.headers, ...csvData.rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Données");

    // Auto-size columns
    const colWidths = csvData.headers.map((header, i) => {
      const maxLength = Math.max(
        header.length,
        ...csvData.rows.map((row) => (row[i] || "").length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `${csvData.fileName.replace(".csv", "")}.xlsx`);
    toast({
      title: "Excel exporté",
      description: "Le fichier a été téléchargé.",
    });
  };

  const exportToWooCommerce = () => {
    if (!csvData) return;
    const h = csvData.headers.map((x) => x.toLowerCase());
    const skuIdx = h.findIndex((x) => x.includes("sku"));
    const nameIdx = h.findIndex((x) => x.includes("name") || x.includes("nom"));
    const priceIdx = h.findIndex((x) => x.includes("price") || x.includes("prix"));
    const stockIdx = h.findIndex((x) => x.includes("stock"));

    const wcHeaders = ["SKU", "Name", "Regular price", "Stock"];
    const wcRows = csvData.rows.map((row) => [
      skuIdx >= 0 ? row[skuIdx] : "",
      nameIdx >= 0 ? row[nameIdx] : row[0] || "",
      priceIdx >= 0 ? row[priceIdx] : "",
      stockIdx >= 0 ? row[stockIdx] : "",
    ]);

    const csv = [wcHeaders, ...wcRows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `woocommerce-import-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export WooCommerce", description: "CSV format import produits généré." });
  };

  return (
    <ToolLayout tool={tool}>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Prévisualisation CSV</h2>
            <p className="text-muted-foreground text-sm">
              Visualisez et exportez vos fichiers CSV
            </p>
          </div>
          {csvData && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPdf}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 font-medium text-sm hover:bg-red-500/20 transition-all"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium text-sm hover:bg-emerald-500/20 transition-all"
              >
                <TableIcon className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={exportToWooCommerce}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 font-medium text-sm hover:bg-purple-500/20 transition-all"
              >
                WooCommerce
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Effacer
              </button>
            </div>
          )}
        </div>

        {/* Drop Zone */}
        {!csvData && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-foreground font-medium">Chargement en cours...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-foreground font-medium mb-1">
                  Glissez votre fichier CSV ici
                </p>
                <p className="text-sm text-muted-foreground">
                  ou cliquez pour sélectionner un fichier
                </p>
              </>
            )}
          </div>
        )}

        {/* File Info */}
        {csvData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                <File className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Fichier</p>
                <p className="font-medium text-foreground truncate">{csvData.fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Rows3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lignes</p>
                <p className="font-medium text-foreground font-mono">{csvData.rows.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Columns3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Colonnes</p>
                <p className="font-medium text-foreground font-mono">{csvData.headers.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <GripVertical className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Délimiteur</p>
                <p className="font-medium text-foreground">{formatDelimiter(csvData.delimiter)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        {csvData && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-r border-border w-12">
                      #
                    </th>
                    {csvData.headers.map((header, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-r border-border last:border-r-0 whitespace-nowrap"
                      >
                        {header || `Colonne ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {csvData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 text-xs text-muted-foreground font-mono border-r border-border bg-muted/20">
                        {rowIndex + 1}
                      </td>
                      {csvData.headers.map((_, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-2 text-sm text-foreground border-r border-border last:border-r-0 max-w-xs truncate"
                          title={row[colIndex] || ""}
                        >
                          {row[colIndex] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvData.rows.length > 100 && (
              <div className="px-4 py-2 bg-muted/50 border-t border-border text-xs text-muted-foreground text-center">
                Affichage de {csvData.rows.length} lignes
              </div>
            )}
          </div>
        )}

        {/* Empty state hint */}
        {!csvData && !isLoading && (
          <div className="text-center py-8">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Formats supportés : CSV (séparateur virgule ou point-virgule)
            </p>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default CsvPreviewPro;
