# Agent Memory & Project Context

## Future Implementation Goals (Requested by User)

### 1. Granular Categorization Drill-down
- **Feature:** Clicking on a top-level category (e.g., Food) should reveal a sub-level breakdown.
- **Example:** Food -> Groceries vs. Restaurants vs. Fast Food.
- **Goal:** Provide higher fidelity spend analysis within the Orbit visualizer.

### 2. Merchant-Level Aggregation
- **Feature:** Bundle recurring transactions from specific vendors into single line items.
- **Merchant List:** Trader Joe's, Stop & Shop, ShopRite, etc.
- **Logic:** Total the visits over a period, annualize them, and show them as a single strategic "Orbit" item.
- **Integration:** Update the monthly orbit set-aside numbers automatically based on these merchant-specific trends.

### 3. Automation Layer
- **Goal:** Reduce manual entry by using the Statement Analyzer (AI) as the primary source of truth for merchant/category updates.
- **Dynamic Adjustments:** Real-time sync between detected statement spend and orbital reserve targets.

## Current State
- Orbit is **Live** and deployed on the Portfolio.
- Statement Analyzer (Gemini) is functional for manual uploads.
- Merging logic (Clean Clutter) is stable.
- Deletion logic is hardened with UI-based confirmation.
