import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface SaveUploadedFileResult {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

export async function saveUploadedFile(file: File): Promise<SaveUploadedFileResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" exceeds the maximum 5MB size limit.`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`File type "${file.type}" is not allowed. Only images, PDFs, and text docs are supported.`);
  }

  // Ensure upload directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const rawExt = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const safeExt = rawExt || ".bin";
  const uniqueToken = crypto.randomBytes(16).toString("hex");
  const storedFileName = `${Date.now()}-${uniqueToken}${safeExt}`;
  const filePath = path.join(UPLOAD_DIR, storedFileName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.promises.writeFile(filePath, buffer);

  return {
    fileName: file.name.replace(/[^\w.-]/gi, "_"),
    fileUrl: `/uploads/${storedFileName}`,
    fileSize: file.size,
    fileType: file.type,
  };
}
