---
name: Admin authentication checks
description: Test admin credentials through both the protected page and API layers.
---

Admin authentication is enforced separately for page requests and admin API requests. Tests of the credential matcher alone do not exercise request identity assignment or both access paths.

**Why:** A credential refactor passed matcher tests and authenticated the admin page, but a removed identifier variable still caused API authentication to return 401.

**How to apply:** When changing admin identifiers or password parsing, verify both protected page and API requests with valid and invalid credentials.
