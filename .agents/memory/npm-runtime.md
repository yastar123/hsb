---
name: npm runtime on Replit
description: How to keep npm available to this project's workflows and shell.
---

Configure the Node.js 20 module together with the `nodejs_20` package under `[nix].packages` in `.replit`. Keep `package-lock.json` tarball URLs on the public npm registry rather than Replit's internal package-firewall host.

**Why:** the module alone did not expose `node` or `npm` to this project's shell and workflow. The internal package-firewall hostname is not resolvable by external VPS clients cloning this repository.

**How to apply:** if npm becomes unavailable, check the Nix package entry before changing the workflow or scripts back to Bun. After an install inside Replit, verify that resolved lockfile URLs remain public so `npm ci` also works on VPS hosts.
