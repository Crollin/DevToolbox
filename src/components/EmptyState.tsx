import { FolderOpen, Filter } from "lucide-react";

interface EmptyStateProps {
  hasCategoryFilter?: boolean;
}

const EmptyState = ({ hasCategoryFilter }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {hasCategoryFilter ? (
          <Filter className="w-8 h-8 text-muted-foreground" />
        ) : (
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {hasCategoryFilter ? "Aucun outil dans cette catégorie" : "Aucun outil"}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {hasCategoryFilter
          ? "Essayez une autre catégorie ou utilisez ⌘K pour rechercher un outil."
          : "Commencez par ajouter votre premier outil à la collection."}
      </p>
    </div>
  );
};

export default EmptyState;
