import { Search, FolderOpen } from "lucide-react";

interface EmptyStateProps {
  searchQuery: string;
}

const EmptyState = ({ searchQuery }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {searchQuery ? (
          <Search className="w-8 h-8 text-muted-foreground" />
        ) : (
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {searchQuery ? "Aucun résultat" : "Aucun outil"}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {searchQuery
          ? `Aucun outil ne correspond à "${searchQuery}". Essayez une autre recherche.`
          : "Commencez par ajouter votre premier outil à la collection."}
      </p>
    </div>
  );
};

export default EmptyState;
