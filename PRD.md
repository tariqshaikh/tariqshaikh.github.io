# Product Requirements Document: Orbit

## 1. Executive Summary
"Most people know what they spent yesterday, but they are blindsided by the 'Orbiting' expenses that hit once or twice a year. Orbit is a strategic cash flow engine for your annual financial cycle."

Orbit is a cash flow intelligence tool designed to help users manage irregular, non-monthly expenses (car insurance, annual fees, taxes). By visualizing the "Orbit" of these expenses, the app provides a clear 12-month trajectory, helping users build sinking funds and avoid financial surprises.

## 2. Problem Statement
### The User Pain
- Monthly budgeting tools focus on the 30-day cycle, but fail to prepare users for the "Big Hits"—those irregular expenses that orbit your life and cause stress when they land.
- Users often feel "broke" during months with insurance premiums or annual fees, even if their annual income is sufficient. They lack a tool that smooths these spikes into a predictable monthly set-aside.

### The Goal
To create a tool that turns "Annual Cash Flow" from a guessing game into a precise orbit. We want to move users from "Surprise Expenses" to "Strategic Sinking Funds."

## 3. Core Features (MVP)
### Orbit Expense Engine
A dedicated system for logging non-monthly expenses (Annual, Semi-Annual, Quarterly, Monthly, Weekly) with specific month-of-impact tracking.

### 12-Month Cash Flow Visualizer
An interactive grid showing projected annual spend, highlighting "Danger Zones" and categorizing irregular hits into a clear visual dashboard.

### Sinking Fund Logic
Automatically calculates the exact monthly amount needed to be set aside to cover all orbiting expenses without stress.

### AI Wealth Coach
A Gemini-powered advisor that analyzes your specific annual cash flow scenario and suggests high-impact strategic insights on managing the annual cycle.

## 4. Success Metrics
- **Retention:** Users returning monthly to update their "Orbit."
- **Expense Logging:** Average number of orbiting expenses tracked per user.
- **AI Engagement:** Number of strategic insights generated and acted upon.

## 5. Future Ideas
- **Surplus Investments:** Actionable strategies for deploying the "Annual Surplus" into investments, high-yield savings, or other wealth-building vehicles.
- **Statement Analyzer:** Upload financial statements to automatically detect and categorize orbiting expenses. (Implemented)
- **High-Fidelity Categorization:** Drill-down views for major categories (e.g., Food → Groceries vs. Restaurants/Fast Food).
- **Merchant Intelligence:** Aggregation of merchant-specific data (Trader Joe’s, ShopRite) to show annualized monthly impact per vendor.
- **Dynamic Orbit Adjustment:** Automatically update monthly orbit set-asides based on granular merchant-level spend trends.

## 6. Technical Constraints
- **Security:** Firestore Security Rules must strictly enforce data ownership and validation.
- **Privacy:** Personally Identifiable Information (PII) must be handled with extreme care and isolated from public access.
