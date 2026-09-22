import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Storage, type File } from "@google-cloud/storage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const DOCUMENT_PREFIX = "documents/";
const DOCUMENT_KEY_PATTERN = /^documents\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function privateObjectDirectory() {
  const value = process.env["PRIVATE_OBJECT_DIR"]?.trim();
  if (!value) throw new Error("PRIVATE_OBJECT_DIR is required for document storage.");
  return value.replace(/\/+$/, "");
}

function localDocumentDirectory() {
  const value = process.env["DOCUMENT_UPLOAD_DIR"]?.trim();
  return value ? path.resolve(value) : null;
}

function validateStorageKey(storageKey: string) {
  if (!DOCUMENT_KEY_PATTERN.test(storageKey)) {
    throw new Error("Invalid document storage key.");
  }
}

function parseObjectPath(value: string) {
  const parts = value.replace(/^\/+/, "").split("/");
  const bucketName = parts.shift();
  if (!bucketName || parts.length === 0) throw new Error("PRIVATE_OBJECT_DIR is invalid.");
  return { bucketName, objectName: parts.join("/") };
}

function documentFile(storageKey: string): File {
  validateStorageKey(storageKey);
  const { bucketName, objectName } = parseObjectPath(`${privateObjectDirectory()}/${storageKey}`);
  return storage.bucket(bucketName).file(objectName);
}

function localDocumentPath(storageKey: string) {
  validateStorageKey(storageKey);
  const directory = localDocumentDirectory();
  if (!directory) throw new Error("DOCUMENT_UPLOAD_DIR is required for local document storage.");
  const filePath = path.resolve(directory, storageKey.slice(DOCUMENT_PREFIX.length));
  const relativePath = path.relative(directory, filePath);
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid document storage key.");
  }
  return filePath;
}

export async function saveDocumentFile(file: Express.Multer.File) {
  const storageKey = `${DOCUMENT_PREFIX}${randomUUID()}`;
  const directory = localDocumentDirectory();
  if (directory) {
    await mkdir(directory, { recursive: true });
    await writeFile(localDocumentPath(storageKey), file.buffer, { flag: "wx", mode: 0o600 });
    return storageKey;
  }

  await documentFile(storageKey).save(file.buffer, {
    resumable: false,
    metadata: {
      contentType: file.mimetype,
      metadata: { originalName: file.originalname },
    },
  });
  return storageKey;
}

export async function getDocumentFile(storageKey: string) {
  if (localDocumentDirectory()) {
    const filePath = localDocumentPath(storageKey);
    try {
      const details = await stat(filePath);
      return details.isFile() ? { createReadStream: () => createReadStream(filePath) } : null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  const file = documentFile(storageKey);
  const [exists] = await file.exists();
  return exists ? file : null;
}

export async function deleteDocumentFile(storageKey: string) {
  if (localDocumentDirectory()) {
    await rm(localDocumentPath(storageKey), { force: true });
    return;
  }
  await documentFile(storageKey).delete({ ignoreNotFound: true });
}