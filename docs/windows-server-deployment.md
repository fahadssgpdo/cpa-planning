# Windows Server deployment through GitHub Actions

The production deployment runs only when an operator manually starts the **Deploy Windows Server** workflow. It targets a self-hosted Windows runner with the custom label `cpa-production`.

## 1. Register the runner

1. Sign in to GitHub and open the `fahadssgpdo/cpa-planning` repository.
2. Open **Settings → Actions → Runners → New self-hosted runner**.
3. Select **Windows** and **x64**.
4. On the Windows server, open PowerShell as Administrator and run the download, extraction, and `config.cmd` commands shown by GitHub. Use a dedicated folder such as:

   ```text
   C:\actions-runner
   ```

5. When `config.cmd` asks for additional labels, enter:

   ```text
   cpa-production
   ```

6. Install and start the runner as a Windows service:

   ```powershell
   .\svc.cmd install
   .\svc.cmd start
   ```

The runner should then appear as **Idle** in the repository. Registration tokens shown by GitHub are short-lived secrets; do not paste them into chat, source files, logs, or documentation.

## 2. Prepare the runner service account

The account running the GitHub Actions runner service must be able to:

- modify `C:\Planning\CPA-Planning-Platform`;
- modify the `uploads\announcements` and `uploads\documents` subfolders;
- stop and start the `CPAPlanningAP` Windows service;
- run `node`, `pnpm`, and `psql` from `PATH`;
- connect to the production PostgreSQL database.

Install Node.js 24, pnpm 10.26.1, Git, and the PostgreSQL command-line tools for that account. The deployment supports the built-in Windows PowerShell 5.1, so PowerShell 7 is optional. The account does not need to be a local administrator if it has explicit Modify permission on the deployment parent folder and permission to control only `CPAPlanningAP`. Restart the runner service after changing machine-level environment variables or `PATH`.

## 3. Configure persistent application storage

Set these machine-level variables, then restart `CPAPlanningAP`:

```powershell
[Environment]::SetEnvironmentVariable(
  "ANNOUNCEMENT_UPLOAD_DIR",
  "C:\Planning\CPA-Planning-Platform\uploads\announcements",
  "Machine"
)
[Environment]::SetEnvironmentVariable(
  "DOCUMENT_UPLOAD_DIR",
  "C:\Planning\CPA-Planning-Platform\uploads\documents",
  "Machine"
)
[Environment]::SetEnvironmentVariable(
  "STATIC_DIR",
  "C:\Planning\CPA-Planning-Platform\artifacts\cpa-planning\dist\public",
  "Machine"
)
[Environment]::SetEnvironmentVariable("NODE_ENV", "production", "Machine")
[Environment]::SetEnvironmentVariable("PORT", "3000", "Machine")
```

Do not expose `uploads\documents` through IIS or another static-file route.

The service also requires machine-level `DATABASE_URL` and `SESSION_SECRET`. Keep their existing values and verify they are defined without printing them:

```powershell
@("DATABASE_URL", "SESSION_SECRET") | ForEach-Object {
  $isConfigured = -not [string]::IsNullOrWhiteSpace(
    [Environment]::GetEnvironmentVariable($_, "Machine")
  )
  "$_ configured: $isConfigured"
}
```

Restart `CPAPlanningAP` after setting these values so the service receives them.

## 4. Configure the production database secret

In GitHub, open **Settings → Environments** and create an environment named `production`. Add an environment secret named:

```text
WINDOWS_DATABASE_URL
```

Store the production PostgreSQL connection URL there. Do not add it as a repository variable or commit it to a file. Optionally add required reviewers to the `production` environment so a second operator must approve each deployment.

## 5. First deployment

1. Merge the Windows storage/deployment pull request into `main`.
2. Confirm the self-hosted runner is **Idle**.
3. Open **Actions → Deploy Windows Server → Run workflow** and select `main`.
4. Watch every step. The workflow:
   - installs dependencies and builds the API and frontend;
   - applies the idempotent `setup-database.sql` before starting the new code;
   - builds a complete staged release before stopping production;
   - copies the existing application into a complete rollback directory, then mirrors the staged release into `C:\Planning\CPA-Planning-Platform` without replacing the locked root directory;
   - preserves the persistent `uploads` and `logs` directories during activation and rollback;
   - recreates pnpm dependency links at the final production path from the local package cache;
   - restarts `CPAPlanningAP`;
   - retries a local database-backed readiness endpoint until it returns `200`;
   - confirms the public protected authentication endpoint returns `401` anonymously;
   - automatically restores the complete previous release if deployment or either health verification fails.

After the workflow succeeds, sign in as a planning officer and verify one document upload/download. In a private browser session, confirm the same download URL returns `401`.

## Rollback

The deployment script keeps the previous application release at `C:\Planning\CPA-Planning-Platform.previous` and mirrors it back automatically if deployment or health verification fails. Persistent `uploads` and `logs` remain in the active directory and are not overwritten during activation or rollback. For a rollback after a successful deployment, redeploy the previous known-good commit. Keep the additive database columns and retain both upload folders; they are backward-compatible and may contain files referenced by the database.