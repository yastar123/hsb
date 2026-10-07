---
name: Demo financial-data integrity
description: Constraints for demo accounts, balances, prices, deposits, withdrawals, and trading.
---

Keep disclosures that accounts, prices, balances, deposits, withdrawals, and trading are simulated until real services are connected end to end. Do not present browser-local state as actual user funds, or treat receipt uploads and admin clicks as confirmed cash transfers.

**Why:** this project does not yet have an authoritative production identity, payment, market-data, or brokerage integration; browser-only values cannot verify real financial activity.

**How to apply:** retain demo labels and disable real order actions until secure server-side services and independently verifiable transaction status are implemented.
