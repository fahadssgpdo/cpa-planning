import { randomUUID } from "node:crypto";
import { Storage, type File } from "@google-cloud/storage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const DOCUMENT_PREFIX = "documents/";

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

function parseObjectPath(value: string) {
  const parts = value.replace(/^\/+/, "").split("/");
  const bucketName = parts.shift();
  if (!bucketName || parts.length === 0) throw new Error("PRIVATE_OBJECT_DIR is invalid.");
  return { bucketName, objectName: parts.join("/") };
}

function documentFile(storageKey: string): File {
  if (!storageKey.startsWith(DOCUMENT_PREFIX) || storageKey.includes("..")) {
    throw new Error("Invalid document storage key.");
  }
  const { bucketName, objectName } = parseObjectPath(`${privateObjectDirectory()}/${storageKey}`);
  return storage.bucket(bucketName).file(objectName);
}

export async function saveDocumentFile(file: Express.Multer.File) {
  const storageKey = `${DOCUMENT_PREFIX}${randomUUID()}`;
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
  const file = documentFile(storageKey);
  const [exists] = await file.exists();
  return exists ? file : null;
}

export async function deleteDocumentFile(storageKey: string) {
  await documentFile(storageKey).delete({ ignoreNotFound: true });
}