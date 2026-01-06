import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import {
  ProcessedImage,
  ImageResizeSettings,
  ImageResizerState,
} from "@/types/image-resizer";
import { wordPressPresets, getPresetById } from "@/lib/imagePresets";
import { toast } from "sonner";

const STORAGE_KEY = "image-resizer-settings";

const defaultSettings: ImageResizeSettings = {
  preset: "hero",
  width: 1920,
  height: 1080,
  quality: 75,
  maintainAspectRatio: true,
};

const loadSettings = (): ImageResizeSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return defaultSettings;
};

const saveSettings = (settings: ImageResizeSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
};

// Convert image to WebP using Canvas API
const convertToWebP = async (
  file: File,
  quality: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert to WebP"));
              return;
            }
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(webpFile);
          },
          "image/webp",
          quality / 100
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

// Get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const useImageResizer = () => {
  const [state, setState] = useState<ImageResizerState>(() => ({
    currentImage: null,
    isProcessing: false,
    error: null,
    settings: loadSettings(),
  }));

  const processImage = useCallback(
    async (file: File, customSettings?: ImageResizeSettings) => {
      // Check if SVG
      if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
        toast.info("Les fichiers SVG ne nécessitent pas de redimensionnement");
        return;
      }

      // Check file size (warn if > 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.warning("Image volumineuse détectée. Le traitement peut prendre du temps.");
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        // Get original dimensions
        const originalDimensions = await getImageDimensions(file);
        const originalUrl = URL.createObjectURL(file);

        // Get current settings (use customSettings if provided, otherwise get from state)
        const currentSettings: ImageResizeSettings = customSettings || state.settings;
        
        let targetWidth = currentSettings.width;
        let targetHeight = currentSettings.height;

        // If preset is "full", use original dimensions
        if (currentSettings.preset === "full") {
          targetWidth = originalDimensions.width;
          targetHeight = originalDimensions.height;
        } else {
          // Apply preset dimensions if not custom
          if (currentSettings.preset !== "custom") {
            const preset = getPresetById(currentSettings.preset);
            if (preset && preset.width > 0 && preset.height > 0) {
              targetWidth = preset.width;
              targetHeight = preset.height;
            }
          }

          // Maintain aspect ratio if enabled
          if (currentSettings.maintainAspectRatio) {
            const aspectRatio = originalDimensions.width / originalDimensions.height;
            
            // Cas 1: Seulement la largeur est renseignée
            if (targetWidth > 0 && targetHeight === 0) {
              targetHeight = Math.round(targetWidth / aspectRatio);
            }
            // Cas 2: Seulement la hauteur est renseignée
            else if (targetWidth === 0 && targetHeight > 0) {
              targetWidth = Math.round(targetHeight * aspectRatio);
            }
            // Cas 3: Les deux sont renseignées (comportement actuel)
            else if (targetWidth > 0 && targetHeight > 0) {
              if (targetWidth / targetHeight > aspectRatio) {
                targetWidth = Math.round(targetHeight * aspectRatio);
              } else {
                targetHeight = Math.round(targetWidth / aspectRatio);
              }
            }
          }
        }

        // Resize image
        const options = {
          maxWidthOrHeight: Math.max(targetWidth, targetHeight),
          useWebWorker: true,
          fileType: file.type,
        };

        let resizedFile: File;
        if (targetWidth === originalDimensions.width && targetHeight === originalDimensions.height) {
          // No resizing needed
          resizedFile = file;
        } else {
          resizedFile = await imageCompression(file, options);
        }

        // Convert to WebP
        const webpFile = await convertToWebP(resizedFile, currentSettings.quality);

        // Get processed dimensions
        const processedDimensions = await getImageDimensions(webpFile);
        const processedUrl = URL.createObjectURL(webpFile);

        const processedImage: ProcessedImage = {
          id: Date.now().toString(),
          originalFile: file,
          originalUrl,
          processedUrl,
          originalSize: file.size,
          processedSize: webpFile.size,
          originalDimensions,
          processedDimensions,
          settings: { ...currentSettings, width: targetWidth, height: targetHeight },
          processedAt: new Date().toISOString(),
        };

        setState((prev) => ({
          ...prev,
          currentImage: processedImage,
          isProcessing: false,
        }));

        toast.success("Image traitée avec succès !");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur lors du traitement de l'image";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isProcessing: false,
        }));
        toast.error(errorMessage);
      }
    },
    [state.settings]
  );

  const updateSettings = useCallback((updates: Partial<ImageResizeSettings>) => {
    setState((prev) => {
      const newSettings = { ...prev.settings, ...updates };
      
      // Update dimensions if preset changed
      if (updates.preset) {
        const preset = getPresetById(updates.preset);
        if (preset && preset.width > 0 && preset.height > 0) {
          newSettings.width = preset.width;
          newSettings.height = preset.height;
        }
      }

      saveSettings(newSettings);
      return { ...prev, settings: newSettings };
    });
  }, []);

  const clearImage = useCallback(() => {
    setState((prev) => {
      if (prev.currentImage) {
        URL.revokeObjectURL(prev.currentImage.originalUrl);
        URL.revokeObjectURL(prev.currentImage.processedUrl);
      }
      return { ...prev, currentImage: null, error: null };
    });
  }, []);

  const downloadImage = useCallback(() => {
    if (!state.currentImage) return;

    const link = document.createElement("a");
    link.href = state.currentImage.processedUrl;
    link.download = state.currentImage.originalFile.name.replace(/\.[^/.]+$/, "") + ".webp";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image téléchargée !");
  }, [state.currentImage]);

  return {
    ...state,
    processImage,
    updateSettings,
    clearImage,
    downloadImage,
  };
};

