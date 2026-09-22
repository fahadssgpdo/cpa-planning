# Private document file migration

Legacy document rows may contain an external `file_url`. The API no longer returns or redirects to that URL, so knowing a previously shared link cannot bypass the application's authentication boundary.

## Rollout order

1. Provision private storage:
   - Replit: ensure `DEFAULT_OBJECT_STORAGE_BUCKET_ID` and `PRIVATE_OBJECT_DIR` are available.
   - Standalone Windows Server: set `DOCUMENT_UPLOAD_DIR` to a persistent folder writable only by the application service account.
2. Add the nullable storage metadata columns and `deletion_pending` by applying the updated schema. Replit Publish applies the development schema diff to its managed production database; standalone installations can rerun the idempotent `setup-database.sql`.
3. Deploy the updated API and web app only after the columns exist.
4. Verify one authenticated upload/download and one anonymous `401` before migrating legacy records.

## Migration procedure

1. Identify records where `storage_key` is null and `file_url` is not null. These records are returned by the API with `migrationRequired: true` and no `downloadUrl`.
2. A planning officer downloads the source file through the approved source system and re-uploads it through the Knowledge Base form.
3. Confirm the new record downloads through `/api/documents/{id}/download` for an authenticated user and returns `401` anonymously.
4. Delete the legacy record after confirming the private replacement. Deletion removes the obsolete external URL from the database.

Do not automate server-side fetching of legacy URLs. That would introduce server-side request forgery risk and could copy content from an untrusted location without review.

## Rollback

Deploy the previous application version before reverting any schema. Leave the new nullable columns in place during rollback; they are backward compatible and preserve the object keys needed to recover uploaded files. Do not delete App Storage objects, remove the Windows `DOCUMENT_UPLOAD_DIR`, or drop storage metadata columns until the replacement version is stable and all required files have been retained elsewhere.