import { Trash2, Loader2, FileCode } from "lucide-react";
import { SavedQuery } from "@/types/wpquery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface SavedQueriesProps {
  queries: SavedQuery[];
  onLoad: (query: SavedQuery) => void;
  onDelete: (id: string) => void;
}

const SavedQueries = ({ queries, onLoad, onDelete }: SavedQueriesProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (queryToDelete) {
      onDelete(queryToDelete);
      toast({ title: "Requête supprimée" });
      setQueryToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  if (queries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Aucune requête sauvegardée
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {queries.map((query) => (
          <Card
            key={query.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onLoad(query)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm">{query.name}</CardTitle>
                  {query.description && (
                    <CardDescription className="text-xs mt-1">
                      {query.description}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => handleDelete(query.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la requête ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La requête sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SavedQueries;

