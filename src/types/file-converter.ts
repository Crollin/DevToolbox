export type FileConverterPhase =
  | "idle"
  | "uploading"
  | "ready"
  | "converting"
  | "done"
  | "error";

export interface UploadedFileMeta {
  id: string;
  originalFilename: string;
  mediaType: string;
  extension: string;
  sizeBytes: number;
  compatibleFormats: string[];
}

export interface ConvertedFileMeta {
  id: string;
  originalFilename: string;
  mediaType: string;
  extension: string;
  sizeBytes: number;
}
