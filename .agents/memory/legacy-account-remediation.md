---
name: Legacy account remediation
description: Retiring an account-bootstrap path requires invalidating credentials it previously seeded.
---

Removing a bootstrap endpoint or fixed credentials from source is incomplete unless every database it previously initialized also has those accounts disabled, deleted, or given newly controlled passwords.

**Why:** Password hashes created by an old provisioning flow survive source changes, so known credentials can remain usable despite otherwise correct server-side authorization.

**How to apply:** When decommissioning sample accounts or a bootstrap flow, include a controlled account-remediation step for development and every production-like database, then verify former credentials cannot obtain a session.