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

## Strategic Portfolio Positioning & PM Storytelling (Feedback Log)

### 1. From "What I Built" to "How I Think"
- **Goal:** Move beyond README style. Instead of just listing features, focus on the "PM Case Study" angle.
- **Storytelling Pillars:**
    - What did I get wrong in V1?
    - What user behavior surprised me?
    - What technical/strategic trade-offs did I make?
    - What would I do with a full engineering team?

### 2. The Indeed & Avanade Inversion
- **Critical Correction:** Stop treating professional experience as a footnote. Shift the hierarchy so the 8+ years at Indeed/Avanade prove ability to ship with real stakeholders and constraints.
- **Deepening Impact:** Connect data strategy work at Indeed (1.5 billion+ records) directly to product outcomes and user decisions.

### 3. Positioning Specificity
- **The Angle:** A technical PM who builds from scratch, with deep data intuition from Indeed, who understands product internals. 
- **Refinement:** Avoid "Open to everything" (generic SaaS/Consumer). Focus on growth-stage, post-PMF companies that value builder-archetypes who don't wait for permission.

### 4. Portfolio Projects Context
- **HomebaseNJ:** Needs a "Product Story" – why the specific data strategy was chosen over others.
- **Orbit:** Highlight the move to manual-first as a strategic decision based on user friction vs. accuracy trade-offs.
- **Waves:** Focus on the "Thinking" behind the real-time collaboration logic.

## Current State
- Orbit is **Live** and deployed on the Portfolio.
- **Default Baseline:** Rent/Mortgage, Car Payment, and Student Loans are now pre-loaded for all new users in Monthly Fixed.
- **AI Architect:** The "Uncover My Orbit" feature and Statement Import logic have been removed/de-emphasized to favor a cleaner, more manual-first onboarding experience.
- Merging logic (Clean Clutter) is stable.
- Deletion logic is hardened with UI-based confirmation.
