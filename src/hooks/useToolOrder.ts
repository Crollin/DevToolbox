import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { tools, Tool } from '@/data/tools';
import { toast } from '@/hooks/use-toast';

interface UseToolOrderReturn {
  orderedTools: Tool[];
  isLoading: boolean;
  saveOrder: (toolIds: string[]) => Promise<void>;
}

export function useToolOrder(filteredTools: Tool[]): UseToolOrderReturn {
  const { isAuthenticated } = useAuth();
  const [customOrder, setCustomOrder] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer l'ordre personnalisé depuis l'API
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await api.get<{ toolIds: string[] }>('/tools/order');
        // Si le tableau est vide, traiter comme null (pas d'ordre personnalisé)
        setCustomOrder(data.toolIds.length > 0 ? data.toolIds : null);
      } catch (error) {
        // Si l'utilisateur n'a pas encore d'ordre personnalisé, ce n'est pas une erreur
        console.log('Aucun ordre personnalisé trouvé, utilisation de l\'ordre par défaut');
        setCustomOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [isAuthenticated]);

  // Sauvegarder l'ordre personnalisé
  const saveOrder = useCallback(async (toolIds: string[]) => {
    if (!isAuthenticated) {
      console.warn('Tentative de sauvegarde sans authentification');
      return;
    }

    if (!toolIds || toolIds.length === 0) {
      console.warn('Tentative de sauvegarde avec un tableau vide');
      return;
    }

    try {
      console.log('[useToolOrder] Tentative de sauvegarde avec toolIds:', toolIds);
      console.log('[useToolOrder] Nombre d\'outils:', toolIds.length);
      const response = await api.put('/tools/order', { toolIds });
      console.log('[useToolOrder] Réponse reçue:', response);
      setCustomOrder(toolIds);
      // Message de succès silencieux (pas de toast pour ne pas être intrusif)
      console.log('Ordre des outils sauvegardé avec succès');
    } catch (error) {
      console.error('[useToolOrder] Erreur complète:', error);
      console.error('[useToolOrder] Type d\'erreur:', typeof error);
      console.error('[useToolOrder] Stack:', error instanceof Error ? error.stack : 'N/A');
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Afficher un message d'erreur plus détaillé
      toast({
        title: 'Erreur de sauvegarde',
        description: errorMessage.includes('401') 
          ? 'Vous devez être connecté pour sauvegarder l\'ordre'
          : errorMessage.includes('500')
          ? 'Erreur serveur. Veuillez redémarrer le serveur backend.'
          : errorMessage,
        variant: 'destructive',
      });
    }
  }, [isAuthenticated]);

  // Appliquer l'ordre personnalisé aux outils filtrés
  const orderedTools = (() => {
    if (!customOrder || customOrder.length === 0) {
      // Pas d'ordre personnalisé, utiliser l'ordre par défaut
      return filteredTools;
    }

    // Créer un Map pour un accès rapide aux outils par ID
    const toolsMap = new Map(filteredTools.map(tool => [tool.id, tool]));

    // Trier selon l'ordre personnalisé, puis ajouter les outils non présents dans l'ordre
    const ordered: Tool[] = [];
    const usedIds = new Set<string>();

    // Ajouter les outils dans l'ordre personnalisé
    customOrder.forEach(toolId => {
      const tool = toolsMap.get(toolId);
      if (tool) {
        ordered.push(tool);
        usedIds.add(toolId);
      }
    });

    // Ajouter les outils non présents dans l'ordre personnalisé (nouveaux outils)
    filteredTools.forEach(tool => {
      if (!usedIds.has(tool.id)) {
        ordered.push(tool);
      }
    });

    return ordered;
  })();

  return {
    orderedTools,
    isLoading,
    saveOrder,
  };
}

