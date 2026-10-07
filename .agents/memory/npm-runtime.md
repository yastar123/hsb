---
name: npm runtime on Replit
description: How to keep npm available to this project's workflows and shell.
---

Configure the Node.js 20 module together with the `nodejs_20` package under `[nix].packages` in `.replit`. The module alone did not expose `node` or `npm` to this project's shell and workflow.

**Why:** the npm package installer and app workflow both failed with `npm: command not found` until the Nix package was installed.

**How to apply:** if npm becomes unavailable, check the Nix package entry before changing the workflow or scripts back to Bun.
