export type ImagePresetType = 
  | "hero"
  | "banner"
  | "container"
  | "thumbnail"
  | "medium"
  | "large"
  | "full"
  | "custom";

export interface ImagePreset {
  id: ImagePresetType;
  name: string;
  width: number;
  height: number;
  description?: string;
}

export interface ImageResizeSettings {
  preset: ImagePresetType;
  width: number;
  height: number;
  quality: number; // 50-100
  maintainAspectRatio: boolean;
}

export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string;
  originalSize: number; // bytes
  processedSize: number; // bytes
  originalDimensions: {
    width: number;
    height: number;
  };
  processedDimensions: {
    width: number;
    height: number;
  };
  settings: ImageResizeSettings;
  processedAt: string;
}

export interface ImageResizerState {
  currentImage: ProcessedImage | null;
  isProcessing: boolean;
  error: string | null;
  settings: ImageResizeSettings;
}





