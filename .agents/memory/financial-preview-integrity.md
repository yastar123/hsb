---
name: Real-finance integrity
description: The user's no-demo product direction and safeguards for real financial activity.
---

The user wants no demo flows in this product ("tidak ada demo, semua real"). Do not present simulated balances, prices, deposits, withdrawals, trade executions, or compounding results as real.

For this app, the Pasar pages are informational only: do not implement buy/sell order flows or broker execution there.

**Why:** the user explicitly ruled out broker buy/sell on the Pasar pages, and this app has no connected identity, payment, live-market, or brokerage service. Unverified features must not imply real outcomes.

**How to apply:** keep the Pasar catalog and charts read-only; do not add broker APIs or executable orders to those routes. Enable other live financial flows only through authoritative providers or explicit, auditable manual settlement. Until the needed service and verification exist, keep live actions unavailable or clearly identify test-only behavior. Do not claim regulatory status or guaranteed returns without verified evidence.
