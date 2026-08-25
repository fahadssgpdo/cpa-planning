---
name: API upload test isolation
description: Reliability rule for integration tests covering file-backed uploads
---

Integration tests for file-backed uploads must isolate storage from the shared development upload directory and clean up their database rows and generated files.

**Why:** Shared upload directories can make tests pass because of stale artifacts, leave test files visible to users, or delete files created by another run.

**How to apply:** Use a per-run temporary upload directory while exercising the real API and database session flow; track and remove every test record and generated asset afterward.