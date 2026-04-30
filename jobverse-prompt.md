# Jobverse — Full Build Prompt

## Project Overview
Build a job aggregator called Jobverse that pulls job listings from hundreds of companies using the Ashby public jobs API (`https://api.ashbyhq.com/posting-public/apiKey` or `https://jobs.ashbyhq.com/{company}/api`). The goal is to give job seekers one place to search, filter, save, and get alerted about jobs across all companies currently using Ashby as their ATS.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router, TypeScript) + Tailwind CSS + shadcn/ui
- **Auth**: Firebase Auth (email/password + Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **Scraper**: Python script run on GitHub Actions (cron schedule)
- **Email alerts**: Resend (free tier)
- **Hosting**: Vercel

## Data Pipeline
- Maintain a static list of Ashby company slugs (hundreds of companies, provided separately)
- Python scraper hits each company's Ashby JSON endpoint to fetch all active job postings
- Runs via GitHub Actions on a cron schedule (every 1–2 hours to maximize freshness on free tier)
- Upserts job data into Supabase — new jobs added, removed jobs marked inactive
- Each job record stores: `title`, `company`, `company_logo_url`, `location`, `job_type` (full-time/part-time/contract), `seniority`, `department`, `salary_min`, `salary_max`, `date_posted`, `apply_url`, `is_active`
- Each company record stores: `name`, `slug`, `logo_url`, `ashby_url`, `industry`

## Pages & Features

### `/` — Job Board (main page)
- Filter bar at top with dropdowns: Type, Time Posted, Seniority, Location, Salary range
- Keyword search bar (searches title + company + department)
- Responsive card grid layout — each card shows:
    - Company logo + name
    - Job title (bold)
    - Tags: job type, location, salary range
    - "Save" heart icon (requires auth)
    - "Apply →" button (links to Ashby posting)
- Selected/featured card has a colorful gradient border accent
- Pagination or infinite scroll

### `/jobs/[id]` — Job Detail
- Full job description
- All metadata (company, location, type, seniority, salary, posted date)
- Apply button linking to original Ashby posting
- Save job button
- Similar jobs from the same company

### `/companies` — Company Directory
- Grid of all companies in the system
- Click to see all open roles at that company
- Save/follow company button (requires auth)

### `/dashboard` — User Dashboard (requires auth)
- Left sidebar navigation: Home, Jobs, Saved Jobs, Saved Companies, Alerts, Settings
- "Saved Jobs" tab: list view showing saved jobs with salary, seniority, type columns
- "Saved Companies" tab: followed companies with job count
- "Alerts" tab: manage alert rules (keyword + filter combos that trigger notifications)
- Application tracking: user can manually mark jobs as Applied / Interviewing / Offer / Rejected

### `/alerts` — Alert Setup
- User creates alerts by saving a search query + filter combination
- Choose notification method: email digest or in-app badge (or both)
- Email via Resend when new jobs match the alert criteria (checked on each scrape run)
- In-app: unread badge count in sidebar nav

## Auth (Firebase)
- Email/password + Google sign-in
- Protected routes redirect to `/login`
- Firebase JWT passed to Supabase for row-level security (RLS) so users only see their own saved jobs/alerts

## UI Design
- Light mode default with a dark mode toggle (stored in user preference / localStorage)
- Light mode: white cards, soft gray background, rounded corners, subtle shadows — inspired by the card grid design with colorful gradient borders on hover/selected state
- Dark mode: dark sidebar (`#0f0f0f`), dark card backgrounds, white text — inspired by the Hirepeak dashboard aesthetic
- Company logos are circular and prominent on every card
- Job type badge (e.g. "Full Time", "Freelance", "Employee") styled as a colored pill in the top-right of each card
- Filter dropdowns are pill-shaped with chevrons
- Apply button is a solid black (light mode) / white (dark mode) rounded button with arrow

## Responsive / Mobile
- Filters collapse into a bottom sheet or modal on mobile
- Card grid goes 1-column on mobile, 2-column on tablet, 3-column on desktop
- Sidebar collapses to bottom tab bar on mobile

## V1 Scope (launch)
- Job board with search + all filters
- Job detail page
- Company directory
- Firebase Auth (email + Google)
- Save jobs and companies
- Basic alerts (email + in-app badge)
- Dashboard with saved jobs/companies and manual application tracking
- Dark mode toggle
- Python scraper + GitHub Actions cron
- Mobile responsive

## Out of scope for V1
- Recruiter-facing features
- Direct in-platform applications
- Monetization
- Native mobile app

## Ashby Company List
(See the user's prompt for the full list of 150+ companies)
