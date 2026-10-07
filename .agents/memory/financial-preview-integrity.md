---
name: Real-finance integrity
description: The user's no-demo product direction and safeguards for real financial activity.
---

The user wants no demo flows in this product ("tidak ada demo, semua real"). Do not present simulated balances, prices, deposits, withdrawals, trade executions, or compounding results as real.

**Why:** the current app has browser-local financial state and no connected identity, payment, live-market, or brokerage service. The user asked for real operation, so unverified features must not imply real outcomes.

**How to apply:** enable live flows only through authoritative providers or explicit, auditable manual settlement. Until the needed service and verification exist, keep live actions unavailable or clearly identify test-only behavior. Do not claim regulatory status or guaranteed returns without verified evidence.
