import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";
import {
  ProcessedImage,
  ImageResizeSettings,
  ImageResizerState,
} from "@/types/image-resizer";
import { getPresetById } from "@/lib/imagePresets";
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

// Core processing logic - shared between single and batch
const processSingleFile = async (
  file: File,
  currentSettings: ImageResizeSettings
): Promise<ProcessedImage> => {
  const originalDimensions = await getImageDimensions(file);
  const originalUrl = URL.createObjectURL(file);

  let targetWidth = currentSettings.width;
  let targetHeight = currentSettings.height;

  if (currentSettings.preset === "full") {
    targetWidth = originalDimensions.width;
    targetHeight = originalDimensions.height;
  } else {
    if (currentSettings.preset !== "custom") {
      const preset = getPresetById(currentSettings.preset);
      if (preset && preset.width > 0 && preset.height > 0) {
        targetWidth = preset.width;
        targetHeight = preset.height;
      }
    }

    if (currentSettings.maintainAspectRatio) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      if (targetWidth > 0 && targetHeight === 0) {
        targetHeight = Math.round(targetWidth / aspectRatio);
      } else if (targetWidth === 0 && targetHeight > 0) {
        targetWidth = Math.round(targetHeight * aspectRatio);
      } else if (targetWidth > 0 && targetHeight > 0) {
        if (targetWidth / targetHeight > aspectRatio) {
          targetWidth = Math.round(targetHeight * aspectRatio);
        } else {
          targetHeight = Math.round(targetWidth / aspectRatio);
        }
      }
    }
  }

  const options = {
    maxWidthOrHeight: Math.max(targetWidth, targetHeight),
    useWebWorker: true,
    fileType: file.type,
  };

  let resizedFile: File;
  if (targetWidth === originalDimensions.width && targetHeight === originalDimensions.height) {
    resizedFile = file;
  } else {
    resizedFile = await imageCompression(file, options);
  }

  const webpFile = await convertToWebP(resizedFile, currentSettings.quality);
  const processedDimensions = await getImageDimensions(webpFile);
  const processedUrl = URL.createObjectURL(webpFile);

  return {
    id: Date.now().toString() + "-" + Math.random().toString(36).slice(2),
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
};

export const useImageResizer = () => {
  const [state, setState] = useState<ImageResizerState>(() => ({
    currentImage: null,
    isProcessing: false,
    error: null,
    settings: loadSettings(),
    processedImages: [],
    batchProgress: 0,
    batchFailedCount: 0,
  }));

  const processImage = useCallback(
    async (file: File, customSettings?: ImageResizeSettings) => {
      if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
        toast.info("Les fichiers SVG ne nécessitent pas de redimensionnement");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.warning("Image volumineuse détectée. Le traitement peut prendre du temps.");
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const currentSettings: ImageResizeSettings = customSettings || state.settings;
        const processedImage = await processSingleFile(file, currentSettings);

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

  const processBatch = useCallback(
    async (files: File[], customSettings?: ImageResizeSettings) => {
      const imageFiles = files.filter((f) => {
        const isSvg = f.type === "image/svg+xml" || f.name.toLowerCase().endsWith(".svg");
        if (isSvg) {
          toast.info(`"${f.name}" ignoré : les SVG ne nécessitent pas de redimensionnement`);
          return false;
        }
        return true;
      });

      if (imageFiles.length === 0) {
        toast.error("Aucune image à traiter");
        return;
      }

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        processedImages: [],
        batchProgress: 0,
        batchFailedCount: 0,
      }));

      const currentSettings: ImageResizeSettings = customSettings || state.settings;
      const results: ProcessedImage[] = [];
      let failedCount = 0;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
          const processed = await processSingleFile(file, currentSettings);
          results.push(processed);
        } catch (error) {
          failedCount++;
          const msg = error instanceof Error ? error.message : "Erreur inconnue";
          toast.error(`${file.name}: ${msg}`);
        }

        setState((prev) => ({
          ...prev,
          processedImages: [...results],
          batchProgress: ((i + 1) / imageFiles.length) * 100,
          batchFailedCount: failedCount,
          isProcessing: i < imageFiles.length - 1,
        }));
      }

      setState((prev) => ({
        ...prev,
        isProcessing: false,
      }));

      if (results.length > 0) {
        toast.success(
          `${results.length} image(s) traitée(s)${failedCount > 0 ? `, ${failedCount} échec(s)` : ""}`
        );
      }
    },
    [state.settings]
  );

  const downloadAllAsZip = useCallback(async (processedImages: ProcessedImage[]) => {
    if (processedImages.length === 0) return;

    const zip = new JSZip();
    const nameCount = new Map<string, number>();

    for (const img of processedImages) {
      const baseName = img.originalFile.name.replace(/\.[^/.]+$/, "") + ".webp";
      const count = nameCount.get(baseName) ?? 0;
      nameCount.set(baseName, count + 1);
      const fileName = count === 0 ? baseName : baseName.replace(".webp", `-${count}.webp`);

      const blob = await fetch(img.processedUrl).then((r) => r.blob());
      zip.file(fileName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `images-optimisees-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Archive ZIP téléchargée !");
  }, []);

  const clearBatch = useCallback(() => {
    setState((prev) => {
      [...prev.processedImages].forEach((img) => {
        URL.revokeObjectURL(img.originalUrl);
        URL.revokeObjectURL(img.processedUrl);
      });
      return {
        ...prev,
        processedImages: [],
        batchProgress: 0,
        batchFailedCount: 0,
      };
    });
  }, []);

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

  const downloadProcessedImage = useCallback((processedImage: ProcessedImage) => {
    const link = document.createElement("a");
    link.href = processedImage.processedUrl;
    link.download = processedImage.originalFile.name.replace(/\.[^/.]+$/, "") + ".webp";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image téléchargée !");
  }, []);

  return {
    ...state,
    processImage,
    processBatch,
    updateSettings,
    clearImage,
    clearBatch,
    downloadImage,
    downloadProcessedImage,
    downloadAllAsZip,
  };
};

