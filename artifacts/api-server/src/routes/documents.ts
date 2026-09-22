import { Router, type IRouter, type RequestHandler } from "express";
import { and, eq, desc } from "drizzle-orm";
import multer, { MulterError } from "multer";
import path from "node:path";
import { z } from "zod/v4";
import { db, documentsTable } from "@workspace/db";
import {
  ListDocumentsQueryParams,
  DeleteDocumentParams,
  ListDocumentsResponse,
  UploadDocumentResponse,
} from "@workspace/api-zod";
import { requirePlanningStaff, requireSession } from "../middlewares/announcement-auth";
import {
  deleteDocumentFile,
  getDocumentFile,
  saveDocumentFile,
} from "../lib/document-storage";

const router: IRouter = Router();
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
const documentMetadata = z.object({
  name: z.string().trim().min(1).max(300),
  category: z.enum(["manuals", "guidelines", "kpi", "policies", "templates", "annual-plans", "reports", "other"]),
  description: z.string().trim().min(1),
});
const acceptedDocumentTypes = new Map<string, readonly string[]>([
  ["application/pdf", [".pdf"]],
  ["application/msword", [".doc"]],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", [".docx"]],
  ["application/vnd.ms-excel", [".xls"]],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [".xlsx"]],
  ["application/vnd.ms-powerpoint", [".ppt"]],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", [".pptx"]],
  ["image/png", [".png"]],
  ["image/jpeg", [".jpg", ".jpeg"]],
]);

function startsWithBytes(buffer: Buffer, bytes: readonly number[]) {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function hasValidFileSignature(file: Express.Multer.File) {
  switch (file.mimetype) {
    case "application/pdf":
      return file.buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    case "image/png":
      return startsWithBytes(file.buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWithBytes(file.buffer, [0xff, 0xd8, 0xff]);
    case "application/msword":
    case "application/vnd.ms-excel":
    case "application/vnd.ms-powerpoint":
      return startsWithBytes(file.buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    default:
      return startsWithBytes(file.buffer, [0x50, 0x4b, 0x03, 0x04]);
  }
}

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extensions = acceptedDocumentTypes.get(file.mimetype);
    if (!extensions?.includes(path.extname(file.originalname).toLowerCase())) {
      callback(new Error("Only PDF, Office, PNG, and JPEG document files are allowed."));
      return;
    }
    callback(null, true);
  },
}).single("file");

const parseDocumentUpload: RequestHandler = (req, res, next) => {
  documentUpload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Document files must not exceed 25 MB." });
      return;
    }
    res.status(400).json({
      error: error instanceof Error ? error.message : "Unable to upload document file.",
    });
  });
};

function parseDocumentData(body: unknown) {
  if (body && typeof body === "object" && "data" in body && typeof body.data === "string") {
    return JSON.parse(body.data) as unknown;
  }
  return body;
}

function documentResponse(row: typeof documentsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    date: row.createdAt.toISOString().slice(0, 10),
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    downloadUrl: row.storageKey ? `/api/documents/${row.id}/download` : null,
    migrationRequired: !row.storageKey && Boolean(row.fileUrl),
  };
}

router.get("/documents", requireSession, async (req, res): Promise<void> => {
  const qp = ListDocumentsQueryParams.safeParse(req.query);
  const category = qp.success ? qp.data.category : undefined;

  const query = db
    .select()
    .from(documentsTable)
    .where(and(
      eq(documentsTable.deletionPending, false),
      category ? eq(documentsTable.category, category) : undefined,
    ))
    .orderBy(desc(documentsTable.createdAt));

  const rows = await query;
  res.json(
    ListDocumentsResponse.parse(
      rows.map(documentResponse)
    )
  );
});

router.post("/documents", requireSession, requirePlanningStaff, parseDocumentUpload, async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "A document file is required. External links are not accepted." });
    return;
  }
  if (!hasValidFileSignature(req.file)) {
    res.status(400).json({ error: "The uploaded file content does not match its declared file type." });
    return;
  }

  let rawData: unknown;
  try {
    rawData = parseDocumentData(req.body);
  } catch {
    res.status(400).json({ error: "Document data must be valid JSON." });
    return;
  }

  const parsed = documentMetadata.safeParse(rawData);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const storageKey = await saveDocumentFile(req.file);
  let row: typeof documentsTable.$inferSelect;
  try {
    [row] = await db
      .insert(documentsTable)
      .values({
        name: parsed.data.name,
        category: parsed.data.category,
        description: parsed.data.description,
        storageKey,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileUrl: null,
      })
      .returning();
  } catch (error) {
    await deleteDocumentFile(storageKey);
    throw error;
  }

  res.status(201).json(UploadDocumentResponse.parse(documentResponse(row)));
});

router.delete("/documents/:id", requireSession, requirePlanningStaff, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteDocumentParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  await db
    .update(documentsTable)
    .set({ deletionPending: true })
    .where(eq(documentsTable.id, row.id));
  try {
    if (row.storageKey) await deleteDocumentFile(row.storageKey);
  } catch (error) {
    await db
      .update(documentsTable)
      .set({ deletionPending: false })
      .where(eq(documentsTable.id, row.id));
    throw error;
  }
  await db.delete(documentsTable).where(eq(documentsTable.id, row.id));
  res.sendStatus(204);
});

router.get("/documents/:id/download", requireSession, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteDocumentParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id))
    .limit(1);
  if (!row || row.deletionPending) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  if (!row.storageKey) {
    res.status(409).json({
      error: "This legacy external document must be re-uploaded before it can be downloaded.",
    });
    return;
  }

  const file = await getDocumentFile(row.storageKey);
  if (!file) {
    res.status(404).json({ error: "Document file not found" });
    return;
  }

  const fileName = row.fileName ?? row.name;
  const asciiName = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  res.setHeader("Content-Type", row.mimeType ?? "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const stream = file.createReadStream();
  stream.on("error", (error) => {
    req.log.error({ err: error, documentId: row.id }, "Document download stream failed");
    if (!res.headersSent) {
      res.status(502).json({ error: "Unable to read the stored document file." });
    } else {
      res.destroy(error);
    }
  });
  stream.pipe(res);
});

export default router;
