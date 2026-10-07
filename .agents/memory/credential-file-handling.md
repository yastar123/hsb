---
name: Credential file handling
description: Workspace restrictions for .env files and where to keep Replit and VPS credentials.
---

Do not create or edit a populated `.env` file in the workspace. The environment blocks `.env` writes to keep credentials out of project files. Keep only safe placeholders in `.env.example`; use Replit Secrets for Replit runtime secrets and a protected, out-of-repository environment file or service manager for VPS credentials. Never copy Replit's runtime-managed database URL into VPS configuration.

**Why:** A direct `.env` write was explicitly rejected by the workspace security layer, and the managed Replit database credential is not the VPS database credential.

**How to apply:** When a request asks for `.env`, explain the restriction, update `.env.example` if useful, and configure actual values only through the appropriate secrets/runtime mechanism.
