---
name: OpenAPI multipart codegen
description: Shared-library type-generation constraint for multipart upload contracts.
---

For upload endpoints generated into the shared API client and Zod libraries, describe multipart file fields as opaque strings with a clear multipart-file description rather than using OpenAPI `format: binary`.

**Why:** The current generator emits `File`/`Blob` references for binary fields, while the shared library TypeScript configuration intentionally omits DOM typings. This breaks monorepo type checking even though the API server correctly receives the multipart file.

**How to apply:** Keep the server-side multipart parsing and file validation explicit (for example, via Multer). Use the JSON metadata field in the multipart body as the typed contract, and avoid reintroducing browser-only generated types unless the shared-library TypeScript configuration is deliberately changed.