import { Router, type IRouter, type RequestHandler } from "express";
import { eq, desc } from "drizzle-orm";
import multer, { MulterError } from "multer";
import sharp from "sharp";
import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, unlink, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { z } from "zod/v4";
import { db, announcementsTable, usersTable } from "@workspace/db";
import { getSessionUser, requireManagerOrAdmin, requirePlanningStaff, requireSession } from "../middlewares/announcement-auth";
import {
  UpdateAnnouncementParams,
  DeleteAnnouncementParams,
  ListAnnouncementsResponse,
  CreateAnnouncementResponse,
  UpdateAnnouncementResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const MAX_FLYER_SIZE = 10 * 1024 * 1024;
const FLYER_URL_PREFIX = "/uploads/announcements";
const flyerDirectory = path.resolve(
  process.env["ANNOUNCEMENT_UPLOAD_DIR"] ?? path.join(process.cwd(), "uploads", "announcements"),
);

const acceptedFlyerTypes = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
} as const;

const announcementCategory = z.enum(["announcement", "update", "circular", "deadline"]);
const createAnnouncementData = z.object({
  title: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1),
  category: announcementCategory,
  flyerPath: z.string().nullable().optional(),
});
const updateAnnouncementData = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  body: z.string().trim().min(1).optional(),
  category: announcementCategory.optional(),
  archived: z.coerce.boolean().optional(),
  removeFlyer: z.coerce.boolean().optional(),
});

function getFileExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

const flyerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FLYER_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    const acceptedExtensions = acceptedFlyerTypes[file.mimetype as keyof typeof acceptedFlyerTypes];
    if (!acceptedExtensions || !acceptedExtensions.includes(getFileExtension(file.originalname) as never)) {
      callback(new Error("Only JPEG, PNG, WebP, and GIF flyer images are allowed."));
      return;
    }
    callback(null, true);
  },
}).single("flyer");

const parseFlyerUpload: RequestHandler = (req, res, next) => {
  flyerUpload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Flyer image must not exceed 10 MB." });
      return;
    }

    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to upload flyer image." });
  });
};

function parseRequestData(body: unknown) {
  if (body && typeof body === "object" && "data" in body && typeof body.data === "string") {
    return JSON.parse(body.data) as unknown;
  }
  return body;
}

function isManagedFlyerPath(value: string) {
  if (!value.startsWith(`${FLYER_URL_PREFIX}/`)) return false;
  const fileName = value.slice(`${FLYER_URL_PREFIX}/`.length);
  return (
    !!fileName &&
    fileName === path.posix.basename(fileName) &&
    /^[0-9a-f-]+\.(?:jpe?g|png|webp|gif)$/i.test(fileName)
  );
}

function resolveManagedFlyerPath(value: string) {
  return path.join(flyerDirectory, path.posix.basename(value));
}

async function removeFileIfPresent(flyerPath: string | null | undefined) {
  if (!flyerPath || !isManagedFlyerPath(flyerPath)) return;
  const absolutePath = resolveManagedFlyerPath(flyerPath);
  try {
    await unlink(absolutePath);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function removeUnusedFlyer(flyerPath: string | null | undefined) {
  if (!flyerPath) return;
  const references = await db
    .select({ id: announcementsTable.id })
    .from(announcementsTable)
    .where(eq(announcementsTable.flyerPath, flyerPath))
    .limit(1);

  if (references.length === 0) await removeFileIfPresent(flyerPath);
}

type FlyerFields = { flyerPath: string; flyerName: string; flyerMimeType: string; flyerSize: number };

function emptyFlyerFields() {
  return { flyerPath: null, flyerName: null, flyerMimeType: null, flyerSize: null };
}

async function saveValidatedFlyer(file: Express.Multer.File): Promise<FlyerFields> {
  const metadata = await sharp(file.buffer, { animated: true, limitInputPixels: 40_000_000 }).metadata();
  const formats = {
    jpeg: { extension: "jpg", mimeType: "image/jpeg" },
    png: { extension: "png", mimeType: "image/png" },
    webp: { extension: "webp", mimeType: "image/webp" },
    gif: { extension: "gif", mimeType: "image/gif" },
  } as const;
  const format = metadata.format as keyof typeof formats;
  if (!formats[format] || !metadata.width || !metadata.height) {
    throw new Error("Uploaded file is not a supported image.");
  }

  await mkdir(flyerDirectory, { recursive: true });
  const fileName = `${randomUUID()}.${formats[format].extension}`;
  const flyerPath = `${FLYER_URL_PREFIX}/${fileName}`;
  const absolutePath = resolveManagedFlyerPath(flyerPath);
  await sharp(file.buffer, { animated: true, limitInputPixels: 40_000_000 })
    .rotate()
    .toFormat(format)
    .toFile(absolutePath);
  const fileStats = await stat(absolutePath);
  return {
    flyerPath,
    flyerName: path.basename(file.originalname),
    flyerMimeType: formats[format].mimeType,
    flyerSize: fileStats.size,
  };
}

async function announcementResponse(row: typeof announcementsTable.$inferSelect) {
  const [author] = await db
    .select({ nameAr: usersTable.nameAr })
    .from(usersTable)
    .where(eq(usersTable.id, row.authorId));

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    date: row.createdAt.toISOString().slice(0, 10),
    authorId: row.authorId,
    authorName: author?.nameAr ?? "",
    archived: row.archived,
    flyerPath: row.flyerPath,
    flyerName: row.flyerName,
    flyerMimeType: row.flyerMimeType,
    flyerSize: row.flyerSize,
  };
}

router.get("/announcements", async (req, res): Promise<void> => {
  const rawArchived = Array.isArray(req.query.archived) ? req.query.archived[0] : req.query.archived;
  if (rawArchived !== undefined && rawArchived !== "true" && rawArchived !== "false") {
    res.status(400).json({ error: "archived must be true or false" });
    return;
  }
  const archivedFilter = rawArchived === undefined ? undefined : rawArchived === "true";

  const rows = await db
    .select({
      id: announcementsTable.id,
      title: announcementsTable.title,
      body: announcementsTable.body,
      category: announcementsTable.category,
      authorId: announcementsTable.authorId,
      authorName: usersTable.nameAr,
      archived: announcementsTable.archived,
      flyerPath: announcementsTable.flyerPath,
      flyerName: announcementsTable.flyerName,
      flyerMimeType: announcementsTable.flyerMimeType,
      flyerSize: announcementsTable.flyerSize,
      createdAt: announcementsTable.createdAt,
    })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.authorId, usersTable.id))
    .orderBy(desc(announcementsTable.createdAt));

  const filtered = archivedFilter !== undefined
    ? rows.filter((r) => r.archived === archivedFilter)
    : rows;

  res.json(
    ListAnnouncementsResponse.parse(
      filtered.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        category: r.category,
        date: r.createdAt.toISOString().slice(0, 10),
        authorId: r.authorId,
        authorName: r.authorName ?? "",
        archived: r.archived,
        flyerPath: r.flyerPath,
        flyerName: r.flyerName,
        flyerMimeType: r.flyerMimeType,
        flyerSize: r.flyerSize,
      }))
    )
  );
});

router.post("/announcements", requireSession, requirePlanningStaff, parseFlyerUpload, async (req, res): Promise<void> => {
  let rawData: unknown;
  try {
    rawData = parseRequestData(req.body);
  } catch {
    res.status(400).json({ error: "Announcement data must be valid JSON." });
    return;
  }

  const parsed = createAnnouncementData.safeParse(rawData);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let existingFlyerPath: string | null = null;
  if (!req.file && parsed.data.flyerPath) {
    if (!isManagedFlyerPath(parsed.data.flyerPath) || !existsSync(resolveManagedFlyerPath(parsed.data.flyerPath))) {
      res.status(400).json({ error: "The selected flyer image is no longer available." });
      return;
    }
    existingFlyerPath = parsed.data.flyerPath;
  }

  let uploadedFlyer: FlyerFields | null = null;
  if (req.file) {
    try {
      uploadedFlyer = await saveValidatedFlyer(req.file);
    } catch {
      res.status(400).json({ error: "Uploaded file is not a supported image." });
      return;
    }
  }

  try {
    const [row] = await db
      .insert(announcementsTable)
      .values({
        title: parsed.data.title,
        body: parsed.data.body,
        category: parsed.data.category,
        authorId: getSessionUser(res).id,
        archived: false,
        ...(uploadedFlyer ?? { flyerPath: existingFlyerPath }),
      })
      .returning();

    res.status(201).json(CreateAnnouncementResponse.parse(await announcementResponse(row)));
  } catch (error) {
    await removeFileIfPresent(uploadedFlyer?.flyerPath);
    throw error;
  }
});

router.patch("/announcements/:id", requireSession, requirePlanningStaff, parseFlyerUpload, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAnnouncementParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let rawData: unknown;
  try {
    rawData = parseRequestData(req.body);
  } catch {
    res.status(400).json({ error: "Announcement data must be valid JSON." });
    return;
  }

  const parsed = updateAnnouncementData.safeParse(rawData);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.archived !== undefined && !requireManagerOrAdmin(req, res)) {
    return;
  }

  const [existing] = await db
    .select()
    .from(announcementsTable)
    .where(eq(announcementsTable.id, params.data.id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.body !== undefined) updateData.body = parsed.data.body;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.archived !== undefined) updateData.archived = parsed.data.archived;
  let uploadedFlyer: FlyerFields | null = null;
  if (req.file) {
    try {
      uploadedFlyer = await saveValidatedFlyer(req.file);
      Object.assign(updateData, uploadedFlyer);
    } catch {
      res.status(400).json({ error: "Uploaded file is not a supported image." });
      return;
    }
  }
  if (parsed.data.removeFlyer && !req.file) Object.assign(updateData, emptyFlyerFields());

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No announcement changes were supplied." });
    return;
  }

  try {
    const [row] = await db
      .update(announcementsTable)
      .set(updateData)
      .where(eq(announcementsTable.id, params.data.id))
      .returning();

    if ((req.file || parsed.data.removeFlyer) && existing.flyerPath !== row.flyerPath) {
      await removeUnusedFlyer(existing.flyerPath);
    }

    res.json(UpdateAnnouncementResponse.parse(await announcementResponse(row)));
  } catch (error) {
    await removeFileIfPresent(uploadedFlyer?.flyerPath);
    throw error;
  }
});

router.delete("/announcements/:id", requireSession, requirePlanningStaff, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAnnouncementParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db.delete(announcementsTable).where(eq(announcementsTable.id, params.data.id)).returning();
  if (!rows.length) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  await removeUnusedFlyer(rows[0].flyerPath);
  res.sendStatus(204);
});

export default router;
