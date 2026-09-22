import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

const documentDirectory = await mkdtemp(path.join(tmpdir(), "cpa-documents-test-"));
process.env["DOCUMENT_UPLOAD_DIR"] = documentDirectory;

const {
  deleteDocumentFile,
  getDocumentFile,
  saveDocumentFile,
} = await import("../src/lib/document-storage");

const contents = Buffer.from("private document contents");
let storageKey: string;

before(async () => {
  storageKey = await saveDocumentFile({
    buffer: contents,
    originalname: "private.pdf",
    mimetype: "application/pdf",
  } as Express.Multer.File);
});

after(async () => {
  await rm(documentDirectory, { recursive: true, force: true });
});

test("stores and reads private documents from the configured local directory", async () => {
  assert.match(storageKey, /^documents\/[0-9a-f-]+$/);
  assert.deepEqual(await readdir(documentDirectory), [storageKey.slice("documents/".length)]);
  assert.deepEqual(
    await readFile(path.join(documentDirectory, storageKey.slice("documents/".length))),
    contents,
  );

  const storedFile = await getDocumentFile(storageKey);
  assert.ok(storedFile);
  const chunks: Buffer[] = [];
  for await (const chunk of storedFile.createReadStream()) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  assert.deepEqual(Buffer.concat(chunks), contents);
});

test("deletes local documents and treats repeated deletion as successful", async () => {
  await deleteDocumentFile(storageKey);
  assert.equal(await getDocumentFile(storageKey), null);
  await deleteDocumentFile(storageKey);
});

test("rejects storage keys outside the generated document namespace", async () => {
  await assert.rejects(() => getDocumentFile("../outside"), /Invalid document storage key/);
  await assert.rejects(() => deleteDocumentFile("documents/not-a-uuid"), /Invalid document storage key/);
});