# Product Requirements Document: Orbit

## 1. Executive Summary
"Most people know what they spent yesterday, but they have no idea how today's decisions impact their life 10 years from now. Orbit is a 'What-If' engine for your financial future."

Orbit is a strategic wealth simulator designed to help users move beyond backward-looking expense tracking. By focusing on forward-looking scenarios (e.g., career changes, home purchases, aggressive investing), Orbit provides a "Financial North Star" that helps users understand the long-term opportunity cost of their current decisions.

## 2. Problem Statement
### The User Pain
- Financial tools are either too simple (expense trackers like Mint/Rocket Money) or too complex (Excel spreadsheets with 50 tabs). Users lack a middle ground that provides strategic clarity.
- Users suffer from "Decision Paralysis" because they cannot easily visualize the trade-offs between competing priorities (e.g., "Should I pay off my student loans or max out my Roth IRA?").

### The Goal
To create a tool that turns "Net Worth" from a static number into a living, breathing trajectory. We want to move users from "What did I spend?" to "What can I become?"

## 3. Core Features (MVP)
### The "What-If" Engine
Interactive sliders to simulate career changes, market returns, and major purchases with real-time impact on "Retirement Date."

### Opportunity Cost Tracker
Translates current spending into future value. "That $100 dinner is actually $1,200 of your future house downpayment."

### Retirement Intelligence
A robust retirement planner with a workflow similar to Root Financial's planner. It includes comprehensive cash flow modeling, scenario analysis, and projections for required vs. projected portfolio at retirement age.

### AI Wealth Coach
A Gemini-powered advisor that analyzes your specific scenario and suggests the most efficient "Next Move."

### Financial Position Ledger (Live)
- **Real-time Net Worth:** Accurate calculation based on categorized assets and liabilities.
- **Auto-Save:** Instant synchronization of ledger entries to ensure data integrity without manual intervention.
- **Multi-Currency Support:** Support for 15+ major global currencies with real-time conversion capabilities.

## 4. Success Metrics
- **Retention:** Users returning monthly to update their "Wealth Pulse."
- **Scenario Creation:** Average number of "What-If" scenarios saved per user.
- **AI Engagement:** Number of strategic insights generated and acted upon.

## 5. Technical Constraints
- **Security:** Firestore Security Rules must strictly enforce data ownership and validation.
- **Performance:** Real-time updates must be debounced to prevent excessive database writes while maintaining a responsive UI.
- **Privacy:** Personally Identifiable Information (PII) must be handled with extreme care and isolated from public access.
