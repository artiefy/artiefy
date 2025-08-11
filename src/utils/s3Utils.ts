import { v4 as uuidv4 } from "uuid";

export function sanitizeFileName(fileName: string): string {
  const ext = fileName.split(".").pop() ?? "";
  const timestamp = Date.now();
  const baseName = fileName
    .split(".")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return `${baseName}-${timestamp}-${uuidv4()}.${ext}`;
}
