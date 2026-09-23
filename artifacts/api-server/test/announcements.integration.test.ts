import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm, unlink } from "node:fs/promises";
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

const [{ default: app }, database, documentStorage] = await Promise.all([
  import("../src/app"),
  import("@workspace/db"),
  import("../src/lib/document-storage"),
]);
const {
  db,
  pool,
  announcementsTable,
  documentsTable,
  inquiriesTable,
  suggestionsTable,
  usersTable,
} = database;
const { deleteDocumentFile } = documentStorage;

type AnnouncementResponse = {
  id: number;
  title: string;
  archived: boolean;
  flyerPath: string | null;
  flyerName: string | null;
  flyerMimeType: string | null;
  flyerSize: number | null;
};

type PrivateSubmissionResponse = {
  id: number;
  userId: number;
};

type DocumentResponse = {
  id: number;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  downloadUrl: string | null;
  migrationRequired: boolean;
};

const password = "TestPassword@123";
const planningUsername = `planning-${randomUUID()}`;
const employeeUsername = `employee-${randomUUID()}`;
const secondEmployeeUsername = `employee-${randomUUID()}`;
const createdAnnouncementIds: number[] = [];
const createdDocumentIds: number[] = [];
const createdInquiryIds: number[] = [];
const createdSuggestionIds: number[] = [];
const createdFlyerPaths = new Set<string>();

let server: Server;
let baseUrl: string;
let planningCookie: string;
let employeeCookie: string;
let secondEmployeeCookie: string;

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

function documentForm(data: Record<string, unknown>, file?: {
  name: string;
  mimeType: string;
  contents: Uint8Array;
}) {
  const form = new FormData();
  form.append("data", JSON.stringify(data));
  if (file) {
    const blobContents = new ArrayBuffer(file.contents.byteLength);
    new Uint8Array(blobContents).set(file.contents);
    form.append("file", new Blob([blobContents], { type: file.mimeType }), file.name);
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
    {
      nameAr: `موظف عادي ${randomUUID()}`,
      username: secondEmployeeUsername,
      passwordHash,
      directorate: "Services Directorate",
      role: "employee",
      active: true,
    },
  ]);

  await listen();
  planningCookie = await login(planningUsername);
  employeeCookie = await login(employeeUsername);
  secondEmployeeCookie = await login(secondEmployeeUsername);
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

  if (createdInquiryIds.length > 0) {
    await db.delete(inquiriesTable).where(inArray(inquiriesTable.id, createdInquiryIds));
  }
  if (createdDocumentIds.length > 0) {
    const rows = await db
      .delete(documentsTable)
      .where(inArray(documentsTable.id, createdDocumentIds))
      .returning({ storageKey: documentsTable.storageKey });
    await Promise.all(rows.map((row) => row.storageKey ? deleteDocumentFile(row.storageKey) : undefined));
  }
  if (createdSuggestionIds.length > 0) {
    await db.delete(suggestionsTable).where(inArray(suggestionsTable.id, createdSuggestionIds));
  }
  await db
    .delete(usersTable)
    .where(inArray(usersTable.username, [
      planningUsername,
      employeeUsername,
      secondEmployeeUsername,
    ]));

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

  const anonymousFileResponse = await request(created.flyerPath!);
  assert.equal(anonymousFileResponse.status, 401);
  const originalFileResponse = await request(created.flyerPath!, {}, planningCookie);
  assert.equal(originalFileResponse.status, 200);
  assert.match(originalFileResponse.headers.get("content-type") ?? "", /^image\/png/);
  assert.equal(originalFileResponse.headers.get("cache-control"), "private, no-store");

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

  const oldFileResponse = await request(created.flyerPath!, {}, planningCookie);
  assert.equal(oldFileResponse.status, 404, "Replacing a flyer should remove the old file.");
  const replacementFileResponse = await request(replaced.flyerPath!, {}, planningCookie);
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
  assert.equal((await request(replaced.flyerPath!, {}, planningCookie)).status, 404);

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

test("stores document files privately and requires authentication to download them", async () => {
  const contents = new TextEncoder().encode("%PDF-1.4\nPrivate integration test document\n%%EOF");
  const uploadResponse = await request(
    "/api/documents",
    {
      method: "POST",
      body: documentForm(
        {
          name: `Private document ${randomUUID()}`,
          description: "Must only download through the authenticated API.",
          category: "policies",
        },
        { name: "private-policy.pdf", mimeType: "application/pdf", contents },
      ),
    },
    planningCookie,
  );
  assert.equal(uploadResponse.status, 201);
  const document = await responseBody<DocumentResponse>(uploadResponse);
  createdDocumentIds.push(document.id);
  assert.equal(document.fileName, "private-policy.pdf");
  assert.equal(document.mimeType, "application/pdf");
  assert.equal(document.fileSize, contents.byteLength);
  assert.equal(document.downloadUrl, `/api/documents/${document.id}/download`);
  assert.equal(document.migrationRequired, false);

  const anonymousDownload = await request(document.downloadUrl!);
  assert.equal(anonymousDownload.status, 401);

  const authenticatedDownload = await request(document.downloadUrl!, {}, employeeCookie);
  assert.equal(authenticatedDownload.status, 200);
  assert.equal(authenticatedDownload.headers.get("cache-control"), "private, no-store");
  assert.match(authenticatedDownload.headers.get("content-disposition") ?? "", /attachment/);
  assert.deepEqual(
    new Uint8Array(await authenticatedDownload.arrayBuffer()),
    contents,
  );

  const deleteResponse = await request(
    `/api/documents/${document.id}`,
    { method: "DELETE" },
    planningCookie,
  );
  assert.equal(deleteResponse.status, 204);
  createdDocumentIds.splice(createdDocumentIds.indexOf(document.id), 1);
  assert.equal((await request(document.downloadUrl!, {}, employeeCookie)).status, 404);
});

test("rejects external document URLs and marks legacy records for re-upload", async () => {
  const externalResponse = await request(
    "/api/documents",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "External URL attempt",
        description: "Must not be accepted.",
        category: "policies",
        fileUrl: "https://public.example/document.pdf",
      }),
    },
    planningCookie,
  );
  assert.equal(externalResponse.status, 400);

  const spoofedFileResponse = await request(
    "/api/documents",
    {
      method: "POST",
      body: documentForm(
        {
          name: "Spoofed PDF",
          description: "The content does not match the declared type.",
          category: "policies",
        },
        {
          name: "spoofed.pdf",
          mimeType: "application/pdf",
          contents: new TextEncoder().encode("This is not a PDF."),
        },
      ),
    },
    planningCookie,
  );
  assert.equal(spoofedFileResponse.status, 400);
  assert.deepEqual(await responseBody<{ error: string }>(spoofedFileResponse), {
    error: "The uploaded file content does not match its declared file type.",
  });

  const [legacy] = await db
    .insert(documentsTable)
    .values({
      name: `Legacy document ${randomUUID()}`,
      description: "Requires reviewed re-upload.",
      category: "policies",
      fileUrl: "https://public.example/legacy.pdf",
    })
    .returning();
  createdDocumentIds.push(legacy.id);

  const listResponse = await request("/api/documents?category=policies", {}, employeeCookie);
  assert.equal(listResponse.status, 200);
  const listed = (await responseBody<Array<DocumentResponse & { id: number }>>(listResponse))
    .find((item) => item.id === legacy.id);
  assert.ok(listed);
  assert.equal(listed.downloadUrl, null);
  assert.equal(listed.migrationRequired, true);
  assert.ok(!("fileUrl" in listed), "The legacy external URL must not be returned.");

  const legacyDownload = await request(`/api/documents/${legacy.id}/download`, {}, employeeCookie);
  assert.equal(legacyDownload.status, 409);
});

test("protects all internal content reads and user-management mutations", async () => {
  for (const route of [
    "/api/users",
    "/api/dashboard/stats",
    "/api/discussions",
    "/api/inquiries",
    "/api/suggestions",
    "/api/announcements",
    "/api/documents",
    "/api/faqs",
    "/api/glossary",
    "/api/discussions/1",
  ]) {
    const response = await request(route);
    assert.equal(response.status, 401, `Anonymous ${route} access should be denied.`);
  }

  const employeeUsersResponse = await request("/api/users", {}, employeeCookie);
  assert.equal(employeeUsersResponse.status, 403);

  const employeeRoleChangeResponse = await request(
    "/api/users/1",
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    },
    employeeCookie,
  );
  assert.equal(employeeRoleChangeResponse.status, 403);
});

test("health check confirms the API can query its database", async () => {
  const response = await request("/api/healthz");
  assert.equal(response.status, 200);
  assert.deepEqual(await responseBody<{ status: string }>(response), { status: "ok" });
});

test("scopes private inquiries and suggestions to the authenticated employee", async () => {
  async function createSubmission(
    route: "/api/inquiries" | "/api/suggestions",
    cookie: string,
    body: Record<string, unknown>,
  ) {
    const response = await request(
      route,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      cookie,
    );
    assert.equal(response.status, 201);
    return responseBody<PrivateSubmissionResponse>(response);
  }

  const ownInquiry = await createSubmission("/api/inquiries", employeeCookie, {
    subject: `Own inquiry ${randomUUID()}`,
    details: "Visible only to its owner and planning staff.",
    category: "other",
  });
  const otherInquiry = await createSubmission("/api/inquiries", secondEmployeeCookie, {
    subject: `Other inquiry ${randomUUID()}`,
    details: "Must not be visible to another employee.",
    category: "other",
  });
  createdInquiryIds.push(ownInquiry.id, otherInquiry.id);

  const ownSuggestion = await createSubmission("/api/suggestions", employeeCookie, {
    category: "improvement",
    text: `Own suggestion ${randomUUID()}`,
  });
  const otherSuggestion = await createSubmission("/api/suggestions", secondEmployeeCookie, {
    category: "improvement",
    text: `Other suggestion ${randomUUID()}`,
  });
  createdSuggestionIds.push(ownSuggestion.id, otherSuggestion.id);

  for (const [route, ownId, otherId, otherUserId] of [
    ["/api/inquiries", ownInquiry.id, otherInquiry.id, otherInquiry.userId],
    ["/api/suggestions", ownSuggestion.id, otherSuggestion.id, otherSuggestion.userId],
  ] as const) {
    const ownListResponse = await request(route, {}, employeeCookie);
    assert.equal(ownListResponse.status, 200);
    const ownList = await responseBody<PrivateSubmissionResponse[]>(ownListResponse);
    assert.ok(ownList.some((item) => item.id === ownId));
    assert.ok(!ownList.some((item) => item.id === otherId));

    const crossUserResponse = await request(`${route}?userId=${otherUserId}`, {}, employeeCookie);
    assert.equal(crossUserResponse.status, 403);

    const planningResponse = await request(`${route}?userId=${otherUserId}`, {}, planningCookie);
    assert.equal(planningResponse.status, 200);
    const planningList = await responseBody<PrivateSubmissionResponse[]>(planningResponse);
    assert.ok(planningList.some((item) => item.id === otherId));
  }
});

test("rejects registration privilege fields", async () => {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      nameAr: `محاولة تصعيد ${randomUUID()}`,
      username: `privilege-${randomUUID()}`,
      password,
      role: "admin",
      active: true,
      id: 1,
    }),
  });
  assert.equal(response.status, 400);
});

test("rejects flyer uploads larger than 10 MB before saving anything", async () => {
  const oversizedFlyerTitle = `Oversized flyer ${randomUUID()}`;
  const oversizedFlyer = new Uint8Array(10 * 1024 * 1024 + 1);
  const filesBefore = await readdir(uploadDirectory);

  const response = await request(
    "/api/announcements",
    {
      method: "POST",
      body: flyerForm(
        { title: oversizedFlyerTitle, body: "Should not save", category: "announcement" },
        { name: "oversized.png", mimeType: "image/png", contents: oversizedFlyer },
      ),
    },
    planningCookie,
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await responseBody<{ error: string }>(response), {
    error: "Flyer image must not exceed 10 MB.",
  });
  assert.deepEqual(await readdir(uploadDirectory), filesBefore);

  const announcements = await db
    .select({ title: announcementsTable.title })
    .from(announcementsTable);
  assert.ok(!announcements.some((announcement) => announcement.title === oversizedFlyerTitle));
});

test("rejects cross-site management requests before changing announcements or files", async () => {
  const crossSiteTitle = `Cross-site flyer ${randomUUID()}`;
  const filesBefore = await readdir(uploadDirectory);
  const validFlyer = await image("png", { r: 90, g: 160, b: 30 });

  const response = await request(
    "/api/announcements",
    {
      method: "POST",
      headers: { origin: "https://malicious.example" },
      body: flyerForm(
        { title: crossSiteTitle, body: "Should not save", category: "announcement" },
        { name: "cross-site.png", mimeType: "image/png", contents: validFlyer },
      ),
    },
    planningCookie,
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await responseBody<{ error: string }>(response), {
    error: "Cross-site requests are not allowed.",
  });
  assert.deepEqual(await readdir(uploadDirectory), filesBefore);

  const announcements = await db
    .select({ title: announcementsTable.title })
    .from(announcementsTable);
  assert.ok(!announcements.some((announcement) => announcement.title === crossSiteTitle));
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

  const activeResponse = await request("/api/announcements?archived=false", {}, employeeCookie);
  assert.equal(activeResponse.status, 200);
  const activeAnnouncements = await responseBody<AnnouncementResponse[]>(activeResponse);
  assert.ok(
    activeAnnouncements.some((announcement) => announcement.id === created.id && announcement.title === title),
    "A new non-archived announcement must be returned by the active filter.",
  );

  const archivedResponse = await request("/api/announcements?archived=true", {}, employeeCookie);
  assert.equal(archivedResponse.status, 200);
  const archivedAnnouncements = await responseBody<AnnouncementResponse[]>(archivedResponse);
  assert.ok(!archivedAnnouncements.some((announcement) => announcement.id === created.id));
});
