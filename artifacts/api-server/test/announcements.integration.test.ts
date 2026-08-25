import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";
import { inArray } from "drizzle-orm";
import sharp from "sharp";

const uploadDirectory = await mkdtemp(path.join(tmpdir(), "cpa-announcements-test-"));
process.env["ANNOUNCEMENT_UPLOAD_DIR"] = uploadDirectory;
process.env["NODE_ENV"] = "test";

const [{ default: app }, database] = await Promise.all([
  import("../src/app"),
  import("@workspace/db"),
]);
const { db, pool, announcementsTable, usersTable } = database;

type AnnouncementResponse = {
  id: number;
  title: string;
  archived: boolean;
  flyerPath: string | null;
  flyerName: string | null;
  flyerMimeType: string | null;
  flyerSize: number | null;
};

const password = "TestPassword@123";
const planningUsername = `planning-${randomUUID()}`;
const employeeUsername = `employee-${randomUUID()}`;
const createdAnnouncementIds: number[] = [];
const createdFlyerPaths = new Set<string>();

let server: Server;
let baseUrl: string;
let planningCookie: string;
let employeeCookie: string;

function listen(): Promise<void> {
  return new Promise((resolve, reject) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("The test server did not expose a TCP address."));
        return;
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
    server.once("error", reject);
  });
}

async function login(username: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie, "Login should issue a session cookie.");
  return cookie.split(";")[0];
}

async function request(
  route: string,
  init: RequestInit = {},
  cookie?: string,
) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  return fetch(`${baseUrl}${route}`, { ...init, headers });
}

function flyerForm(data: Record<string, unknown>, file?: {
  name: string;
  mimeType: string;
  contents: Uint8Array;
}) {
  const form = new FormData();
  form.append("data", JSON.stringify(data));
  if (file) {
    const blobContents = new ArrayBuffer(file.contents.byteLength);
    new Uint8Array(blobContents).set(file.contents);
    form.append("flyer", new Blob([blobContents], { type: file.mimeType }), file.name);
  }
  return form;
}

async function image(format: "png" | "jpeg", color: { r: number; g: number; b: number }) {
  return sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: color,
    },
  })
    .toFormat(format)
    .toBuffer();
}

async function responseBody<T>(response: Response) {
  return response.json() as Promise<T>;
}

before(async () => {
  const passwordHash = await bcrypt.hash(password, 4);
  await db.insert(usersTable).values([
    {
      nameAr: `موظف تخطيط ${randomUUID()}`,
      username: planningUsername,
      passwordHash,
      directorate: "Planning Directorate",
      role: "officer",
      active: true,
    },
    {
      nameAr: `موظف عادي ${randomUUID()}`,
      username: employeeUsername,
      passwordHash,
      directorate: "Operations Directorate",
      role: "employee",
      active: true,
    },
  ]);

  await listen();
  planningCookie = await login(planningUsername);
  employeeCookie = await login(employeeUsername);
});

after(async () => {
  if (createdAnnouncementIds.length > 0) {
    const rows = await db
      .delete(announcementsTable)
      .where(inArray(announcementsTable.id, createdAnnouncementIds))
      .returning({ flyerPath: announcementsTable.flyerPath });
    for (const row of rows) {
      if (row.flyerPath) createdFlyerPaths.add(row.flyerPath);
    }
  }

  await db
    .delete(usersTable)
    .where(inArray(usersTable.username, [planningUsername, employeeUsername]));

  await Promise.all(
    [...createdFlyerPaths].map(async (flyerPath) => {
      await unlink(path.join(uploadDirectory, path.basename(flyerPath))).catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      });
    }),
  );
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await pool.end();
  await rm(uploadDirectory, { recursive: true, force: true });
});

test("authorized planning staff can upload, replace, remove, and delete a flyer", async () => {
  const originalImage = await image("png", { r: 20, g: 120, b: 220 });
  const createResponse = await request(
    "/api/announcements",
    {
      method: "POST",
      body: flyerForm(
        { title: `Flyer lifecycle ${randomUUID()}`, body: "Initial flyer", category: "announcement" },
        { name: "original.png", mimeType: "image/png", contents: originalImage },
      ),
    },
    planningCookie,
  );
  assert.equal(createResponse.status, 201);
  const created = await responseBody<AnnouncementResponse>(createResponse);
  createdAnnouncementIds.push(created.id);
  assert.match(created.flyerPath ?? "", /^\/uploads\/announcements\/[0-9a-f-]+\.png$/);
  assert.equal(created.flyerName, "original.png");
  assert.equal(created.flyerMimeType, "image/png");
  createdFlyerPaths.add(created.flyerPath!);

  const originalFileResponse = await request(created.flyerPath!);
  assert.equal(originalFileResponse.status, 200);
  assert.match(originalFileResponse.headers.get("content-type") ?? "", /^image\/png/);

  const replacementImage = await image("jpeg", { r: 230, g: 80, b: 40 });
  const replaceResponse = await request(
    `/api/announcements/${created.id}`,
    {
      method: "PATCH",
      body: flyerForm(
        {},
        { name: "replacement.jpg", mimeType: "image/jpeg", contents: replacementImage },
      ),
    },
    planningCookie,
  );
  assert.equal(replaceResponse.status, 200);
  const replaced = await responseBody<AnnouncementResponse>(replaceResponse);
  assert.notEqual(replaced.flyerPath, created.flyerPath);
  assert.equal(replaced.flyerName, "replacement.jpg");
  assert.equal(replaced.flyerMimeType, "image/jpeg");
  createdFlyerPaths.add(replaced.flyerPath!);

  const oldFileResponse = await request(created.flyerPath!);
  assert.equal(oldFileResponse.status, 404, "Replacing a flyer should remove the old file.");
  const replacementFileResponse = await request(replaced.flyerPath!);
  assert.equal(replacementFileResponse.status, 200);

  const removeResponse = await request(
    `/api/announcements/${created.id}`,
    { method: "PATCH", body: flyerForm({ removeFlyer: true }) },
    planningCookie,
  );
  assert.equal(removeResponse.status, 200);
  const removed = await responseBody<AnnouncementResponse>(removeResponse);
  assert.equal(removed.flyerPath, null);
  assert.equal(removed.flyerName, null);
  assert.equal(removed.flyerMimeType, null);
  assert.equal((await request(replaced.flyerPath!)).status, 404);

  const deleteResponse = await request(
    `/api/announcements/${created.id}`,
    { method: "DELETE" },
    planningCookie,
  );
  assert.equal(deleteResponse.status, 204);
});

test("rejects unauthenticated, unauthorized, and fake-image flyer requests", async () => {
  const noSessionResponse = await request("/api/announcements", {
    method: "POST",
    body: flyerForm({ title: "No session", body: "Denied", category: "announcement" }),
  });
  assert.equal(noSessionResponse.status, 401);

  const employeeResponse = await request(
    "/api/announcements",
    {
      method: "POST",
      body: flyerForm({ title: "Employee attempt", body: "Denied", category: "announcement" }),
    },
    employeeCookie,
  );
  assert.equal(employeeResponse.status, 403);

  const fakeImageResponse = await request(
    "/api/announcements",
    {
      method: "POST",
      body: flyerForm(
        { title: `Fake image ${randomUUID()}`, body: "Should not save", category: "announcement" },
        { name: "spoofed.png", mimeType: "image/png", contents: new TextEncoder().encode("not an image") },
      ),
    },
    planningCookie,
  );
  assert.equal(fakeImageResponse.status, 400);
  assert.deepEqual(await responseBody<{ error: string }>(fakeImageResponse), {
    error: "Uploaded file is not a supported image.",
  });
});

test("active announcement filtering includes newly created announcements", async () => {
  const title = `New active announcement ${randomUUID()}`;
  const createResponse = await request(
    "/api/announcements",
    {
      method: "POST",
      body: flyerForm({ title, body: "Visible immediately", category: "announcement" }),
    },
    planningCookie,
  );
  assert.equal(createResponse.status, 201);
  const created = await responseBody<AnnouncementResponse>(createResponse);
  createdAnnouncementIds.push(created.id);

  const activeResponse = await request("/api/announcements?archived=false");
  assert.equal(activeResponse.status, 200);
  const activeAnnouncements = await responseBody<AnnouncementResponse[]>(activeResponse);
  assert.ok(
    activeAnnouncements.some((announcement) => announcement.id === created.id && announcement.title === title),
    "A new non-archived announcement must be returned by the active filter.",
  );

  const archivedResponse = await request("/api/announcements?archived=true");
  assert.equal(archivedResponse.status, 200);
  const archivedAnnouncements = await responseBody<AnnouncementResponse[]>(archivedResponse);
  assert.ok(!archivedAnnouncements.some((announcement) => announcement.id === created.id));
});