import { useState, useEffect, useCallback } from "react";
import { Licence, NtfyConfig } from "@/types/licence";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const LICENCES_KEY = "licence-key-hub-licences";
const NTFY_CONFIG_KEY = "licence-key-hub-ntfy";
const MIGRATION_DONE_KEY = "licence-migration-done";

const defaultNtfyConfig: NtfyConfig = {
  enabled: false,
  serverUrl: "https://ntfy.sh",
  topic: "",
  token: "",
};

export function useLicences() {
  const { isAuthenticated } = useAuth();
  const [licences, setLicences] = useState<Licence[]>([]);
  const [ntfyConfig, setNtfyConfig] = useState<NtfyConfig>(defaultNtfyConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les licences depuis l'API
  const loadLicences = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoaded(true);
      return;
    }

    try {
      const data = await api.get<{ licences: Licence[] }>('/licences');
      setLicences(data.licences || []);
    } catch (error) {
      console.error("Erreur lors du chargement des licences:", error);
      setLicences([]);
    }
  }, [isAuthenticated]);

  // Charger la configuration Ntfy depuis l'API
  const loadNtfyConfig = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const data = await api.get<NtfyConfig>('/licences/ntfy-config');
      setNtfyConfig(data || defaultNtfyConfig);
    } catch (error) {
      console.error("Erreur lors du chargement de la config Ntfy:", error);
      setNtfyConfig(defaultNtfyConfig);
    }
  }, [isAuthenticated]);

  // Migration depuis localStorage vers l'API
  const migrateFromLocalStorage = useCallback(async () => {
    if (!isAuthenticated) return;

    // Vérifier si la migration a déjà été effectuée
    if (localStorage.getItem(MIGRATION_DONE_KEY) === 'true') {
      return;
    }

    try {
      const storedLicences = localStorage.getItem(LICENCES_KEY);
      if (storedLicences) {
        const parsedLicences: Licence[] = JSON.parse(storedLicences);
        
        // Importer chaque licence dans l'API
        for (const licence of parsedLicences) {
          try {
            await api.post('/licences', {
              name: licence.name,
              key: licence.key,
              type: licence.type,
              isLifetime: licence.isLifetime,
              renewalDate: licence.renewalDate,
              notes: licence.notes,
            });
          } catch (error) {
            console.error(`Erreur lors de l'import de la licence ${licence.name}:`, error);
          }
        }

        // Marquer la migration comme effectuée
        localStorage.setItem(MIGRATION_DONE_KEY, 'true');
        
        // Optionnel : supprimer les données du localStorage après migration
        // localStorage.removeItem(LICENCES_KEY);
      }

      // Migrer aussi la config Ntfy
      const storedNtfy = localStorage.getItem(NTFY_CONFIG_KEY);
      if (storedNtfy) {
        try {
          const parsedNtfy: NtfyConfig = JSON.parse(storedNtfy);
          await api.put('/licences/ntfy-config', parsedNtfy);
        } catch (error) {
          console.error("Erreur lors de l'import de la config Ntfy:", error);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la migration:", error);
    }
  }, [isAuthenticated]);

  // Charger les données au montage et quand l'authentification change
  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        // D'abord migrer depuis localStorage si nécessaire
        await migrateFromLocalStorage();
        // Puis charger depuis l'API
        await Promise.all([loadLicences(), loadNtfyConfig()]);
        setIsLoaded(true);
      };
      loadData();
    } else {
      setIsLoaded(true);
    }
  }, [isAuthenticated, loadLicences, loadNtfyConfig, migrateFromLocalStorage]);

  const addLicence = useCallback(async (licence: Omit<Licence, "id" | "createdAt">) => {
    if (!isAuthenticated) {
      throw new Error("Vous devez être connecté pour ajouter une licence");
    }

    try {
      const newLicence = await api.post<Licence>('/licences', licence);
      setLicences((prev) => [newLicence, ...prev]);
      return newLicence;
    } catch (error) {
      console.error("Erreur lors de l'ajout de la licence:", error);
      throw error;
    }
  }, [isAuthenticated]);

  const updateLicence = useCallback(async (id: string, updates: Partial<Omit<Licence, "id" | "createdAt">>) => {
    if (!isAuthenticated) {
      throw new Error("Vous devez être connecté pour modifier une licence");
    }

    try {
      const updatedLicence = await api.put<Licence>(`/licences/${id}`, updates);
      setLicences((prev) =>
        prev.map((l) => (l.id === id ? updatedLicence : l))
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la licence:", error);
      throw error;
    }
  }, [isAuthenticated]);

  const deleteLicence = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      throw new Error("Vous devez être connecté pour supprimer une licence");
    }

    try {
      await api.delete(`/licences/${id}`);
      setLicences((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression de la licence:", error);
      throw error;
    }
  }, [isAuthenticated]);

  const updateNtfyConfig = useCallback(async (config: Partial<NtfyConfig>) => {
    if (!isAuthenticated) {
      throw new Error("Vous devez être connecté pour modifier la configuration Ntfy");
    }

    try {
      const updatedConfig = { ...ntfyConfig, ...config };
      await api.put('/licences/ntfy-config', updatedConfig);
      setNtfyConfig(updatedConfig);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la config Ntfy:", error);
      throw error;
    }
  }, [isAuthenticated, ntfyConfig]);

  return {
    licences,
    ntfyConfig,
    isLoaded,
    addLicence,
    updateLicence,
    deleteLicence,
    updateNtfyConfig,
    refreshLicences: loadLicences,
  };
}
