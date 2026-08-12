import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const DEV_MOCK = import.meta.env.DEV;

// ─── Mock answer (dev mode only — triggered on localhost when DEV_MOCK=true) ──
const MOCK_QUESTION = 'How would you improve Spotify for podcast listeners?';
const MOCK_MIND_MAPS: Record<string, MindMapData> = {
  'product-sense': {
    branches: [
      {
        label: 'Who is the User',
        insight: 'The podcast listener on Spotify is a commuter or gym-goer who consumes long-form audio serially — they\'re not discovering, they\'re completing. This is fundamentally different from music listeners.',
        points: [
          'Core segment: 25–40yo knowledge workers using podcasts as a productivity ritual, not entertainment',
          'They have 3–8 active shows and a backlog of 20+ episodes — queue anxiety is real',
          'Discovery mostly happens off-platform (Twitter, friends) — Spotify is a player, not an explorer',
        ],
      },
      {
        label: 'What They Truly Need',
        insight: 'They need intelligent queue management and cross-device continuity, not more content. The job-to-be-done is "get through my shows efficiently without losing my place or missing what matters."',
        points: [
          'Resume exactly where they left off across every device, including car bluetooth',
          'AI-generated episode summaries so they can decide to skip without FOMO',
          'Smart playback speed that auto-adjusts per show type (interviews at 1.2×, dense lectures at 0.9×)',
        ],
      },
      {
        label: 'What Success Looks Like',
        insight: 'Success is measured by podcast episode completion rate (not starts) and weekly active podcast listeners — the two metrics Spotify controls that correlate with subscriber retention.',
        points: [
          'Episode completion rate > 70% (estimated 40–50% today)',
          'Cross-device listening sessions per user per week as a leading indicator',
          'Churn rate delta between podcast-heavy users vs. music-only users',
        ],
      },
      {
        label: 'The Non-Obvious Insight',
        insight: 'The biggest opportunity isn\'t features — it\'s the social layer. Every episode you finish should have a "5 people in your network also finished this" moment. Podcasts are inherently conversation-starting but Spotify is completely silent.',
        points: [
          'Shared timestamps: "your friend flagged this moment at 34:22" drives re-engagement',
          'Podcast clubs (like book clubs) would differentiate Spotify from Apple and YouTube entirely',
          'Creators get social proof signals that drive episode quality — a flywheel Apple doesn\'t have',
        ],
      },
      {
        label: 'Risks & Failure Modes',
        insight: 'The social feature risks feeling surveillance-like — "who knows I listened to this?" is a real concern for sensitive topics. Sharing must always be explicit, never passive.',
        points: [
          'Recommendation algorithm gets confused when social signals conflict with personal taste graph',
          'Creator backlash if AI summaries reduce full-episode listens and hurt ad revenue',
          'Apple Podcasts will copy any feature within 18 months — the moat must be the social graph, not the feature itself',
        ],
      },
    ],
    provocation: 'If Spotify removed all podcast discovery features tomorrow and only focused on finishing what users already started — would engagement go up or down? And what does your answer reveal about where you\'re actually losing users?',
    followUps: [
      'How would you prioritize the social feature vs. the AI summary feature given Spotify\'s current growth challenges?',
      'What would the creator monetization implications be of adding episode summaries — and how do you get creator buy-in?',
      'How would you measure whether the social layer is driving retention vs. just surface-level engagement?',
      'If Apple announced a Spotify Wrapped equivalent for podcast listening tomorrow, what does your competitive response look like?',
    ],
  },
};

const FRAMEWORKS = [
  { id: 'product-sense', label: 'Product Sense' },
  { id: 'jtbd', label: 'Jobs to Be Done' },
  { id: 'circles', label: 'CIRCLES' },
  { id: 'north-star', label: 'North Star' },
  { id: 'sizing', label: 'Opportunity Sizing' },
  { id: 'competitive', label: 'Competitive Analysis' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'star', label: 'STAR Method' },
  { id: 'case-study', label: 'Case Study' },
];

const BRANCH_COLORS = ['#7c3aed', '#0891b2', '#059669', '#ca8a04', '#dc2626', '#db2777', '#2563eb', '#9333ea', '#0e7490'];

const FRAMEWORK_COLORS: Record<string, string> = {
  'product-sense': '#8b5cf6',
  'jtbd':          '#0891b2',
  'circles':       '#059669',
  'north-star':    '#f59e0b',
  'sizing':        '#ef4444',
  'competitive':   '#ec4899',
  'strategy':      '#3b82f6',
  'star':          '#a855f7',
  'case-study':    '#14b8a6',
};

const STARS_BG = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  left: (i * 137.508) % 100,
  top: (i * 97.3) % 100,
  size: (i % 3) * 0.6 + 0.4,
  opacity: (i % 6) * 0.05 + 0.06,
  duration: 2 + (i % 4) * 0.8,
  delay: (i % 5) * 0.6,
}));

// ─── Framework schemas ────────────────────────────────────────────────────────
interface FrameworkSchema { branches: string[]; description: string; instruction: string; }

const FRAMEWORK_SCHEMAS: Record<string, FrameworkSchema> = {
  'star': {
    branches: ['Situation', 'Task', 'Action', 'Result'],
    description: 'STAR (Situation → Task → Action → Result): a behavioral storytelling framework',
    instruction: 'Use each STAR stage as a branch. For each: explain what it means in this context, then give 3 concrete, specific points the PM should actually say/do at that stage.',
  },
  'circles': {
    branches: ['Comprehend', 'Identify Customer', 'Report Needs', 'Cut Priorities', 'List Solutions', 'Evaluate Tradeoffs', 'Summarize'],
    description: 'CIRCLES: a 7-step product design framework — each letter is a step',
    instruction: 'Each branch is one step of CIRCLES. The insight explains what this step requires for this specific question. The points are concrete actions or outputs for this step.',
  },
  'jtbd': {
    branches: ['Functional Job', 'Emotional Job', 'Social Job', 'Struggling Moment'],
    description: 'Jobs to Be Done: people hire products to do a job — functional, emotional, and social',
    instruction: 'Functional: what they are trying to accomplish. Emotional: how they want to feel. Social: how they want to be perceived. Struggling Moment: the specific trigger that caused them to seek this solution.',
  },
  'north-star': {
    branches: ['North Star Metric', 'Input Metrics', 'Guardrail Metrics', 'Leading Indicators'],
    description: 'North Star Metric framework: define the one metric that best captures delivered value, then map what drives it',
    instruction: 'North Star Metric: the single number. Input Metrics: 2-3 leading metrics that directly drive the north star. Guardrail Metrics: what must not regress. Leading Indicators: early signals before the north star moves.',
  },
  'sizing': {
    branches: ['Total Addressable Market', 'Serviceable Market', 'Obtainable Share', 'Key Assumptions', 'How to Validate'],
    description: 'Opportunity Sizing: TAM → SAM → SOM with explicit assumptions and validation path',
    instruction: 'Walk through each layer of the market sizing funnel. Be explicit about the math and assumptions. The final branch is critical — state how to pressure-test each assumption.',
  },
  'competitive': {
    branches: ['Market Landscape', 'Player Positioning', 'Moats & Defensibility', 'Market Gaps', 'Where to Win'],
    description: 'Competitive Analysis: map the landscape, understand positioning, find gaps, define the winning move',
    instruction: 'Market Landscape: who the real players are. Positioning: how each is positioned. Moats: what makes incumbents hard to displace. Market Gaps: unserved segments. Where to Win: the specific bet.',
  },
  'strategy': {
    branches: ['Where to Play', 'How to Win', 'Required Capabilities', '3-Year Vision', '12-Month Bets'],
    description: "Playing to Win (Roger Martin): strategy is a cascade of choices that work together",
    instruction: 'Where to Play: which markets/segments. How to Win: the sustainable advantage. Required Capabilities: what must be true to execute. 3-Year Vision: success at scale. 12-Month Bets: specific near-term moves.',
  },
  'product-sense': {
    branches: ['Who is the User', 'What They Truly Need', 'What Success Looks Like', 'The Non-Obvious Insight', 'Risks & Failure Modes'],
    description: 'Product Sense: deep empathy and clarity on user, need, success, and the insight most PMs miss',
    instruction: 'Go beyond the surface. Who is the User: specific, not a persona cliché. What They Truly Need: underlying need, not stated request. Success: quantified. Non-Obvious Insight: what a junior PM misses. Risks: concrete failure modes.',
  },
  'case-study': {
    branches: ['Problem Space', 'Target User', 'Opportunity', 'Solution Approach', 'Key Tradeoffs', 'Success Criteria'],
    description: 'Case Study: full product review structure from problem framing to success definition',
    instruction: 'Problem Space: frame clearly, show why it matters. Target User: specific. Opportunity: sized or scoped. Solution: directional. Key Tradeoffs: what you choose NOT to do. Success: measurable outcomes.',
  },
};

// ─── Lens info ────────────────────────────────────────────────────────────────
interface LensInfo { name: string; origin: string; when: string; bestFor: string[]; notFor: string; color: string; }

const LENS_INFO: Record<string, LensInfo> = {
  'product-sense': {
    name: 'Product Sense',
    origin: 'Evolved from design thinking and user research. Popularized as a core PM competency at Google and Meta, where interviews test whether candidates can build and use deep user empathy.',
    when: 'When the question asks you to understand a user, evaluate a product decision, or identify what truly matters to customers.',
    bestFor: ['Product improvement questions', 'User empathy deep-dives', 'Feature evaluation', 'Identifying non-obvious user needs'],
    notFor: 'Quantitative go/no-go decisions or market sizing exercises.',
    color: '#7c3aed',
  },
  'jtbd': {
    name: 'Jobs to Be Done',
    origin: "Developed by Clayton Christensen (Harvard Business School) in the 1990s. The core idea: customers don't buy products, they hire them to do a job. Popularized by the milkshake example and Competing Against Luck (2016).",
    when: 'When you need to understand the true motivation behind user behavior — especially for positioning, pricing, or prioritization decisions.',
    bestFor: ['Understanding why users switch products', 'Market segmentation by motivation', 'Uncovering underserved needs', 'Positioning against competitors'],
    notFor: 'Step-by-step product design or behavioral interview answers.',
    color: '#0891b2',
  },
  'circles': {
    name: 'CIRCLES Method',
    origin: 'Created by Lewis Lin, author of Decode and Conquer (2013) — the first book specifically written for PM interview prep. Gives candidates a repeatable structure for "design a product" questions.',
    when: 'When asked to design or improve a specific product: "How would you design X?" or "How would you improve Y?"',
    bestFor: ['Product design prompts', 'Feature ideation', 'Customer-first product thinking', 'Any "design a product for [user]" question'],
    notFor: 'Metric analysis, strategy decisions, or behavioral storytelling.',
    color: '#059669',
  },
  'north-star': {
    name: 'North Star Metric',
    origin: "Popularized by Sean Ellis (who coined 'growth hacking') and widely adopted by Airbnb, Amplitude, and Spotify. Traces back to W. Edwards Deming's principle: manage what you measure.",
    when: 'When you need to align a team around a single success metric, diagnose metric drops, or define what "winning" looks like for a product.',
    bestFor: ['Defining product success', 'Metric diagnosis questions', 'Aligning growth and product teams', 'Prioritizing features by impact'],
    notFor: 'Product design or behavioral interview stories.',
    color: '#ca8a04',
  },
  'sizing': {
    name: 'Opportunity Sizing',
    origin: 'Rooted in consulting (McKinsey, Bain) and VC due diligence. TAM/SAM/SOM is a standard venture capital and market entry framework, applied to PM interviews to test structured quantitative thinking.',
    when: 'When asked "how big is the market?", "is this worth building?", or "estimate the revenue impact of X."',
    bestFor: ['Market sizing interview questions', 'Build vs. buy decisions', 'New product opportunity assessment', 'Back-of-napkin estimation prompts'],
    notFor: 'User empathy questions or behavioral stories.',
    color: '#dc2626',
  },
  'competitive': {
    name: 'Competitive Analysis',
    origin: "Rooted in Michael Porter's Five Forces (1979) and Blue Ocean Strategy (Kim & Mauborgne, 2005). Applied to PM practice to map competitive positioning and find strategic whitespace.",
    when: 'When evaluating whether to enter a market, understanding why a product is losing or winning, or deciding where to differentiate.',
    bestFor: ['Market entry decisions', '"Should we build X?" questions', 'Positioning and differentiation', 'Evaluating competitive threats'],
    notFor: 'Step-by-step design frameworks or behavioral stories.',
    color: '#db2777',
  },
  'strategy': {
    name: 'Playing to Win',
    origin: "Roger Martin and A.G. Lafley's framework from Playing to Win (2013). Strategy is a set of integrated choices: where to play and how to win. Widely used at P&G and in business school strategy courses.",
    when: 'When the question is about long-term direction, market selection, or sustainable competitive advantage.',
    bestFor: ['"What\'s your 3-year strategy for X?" questions', 'Market entry and expansion decisions', 'Executive-level roadmap framing', 'Aligning capabilities to vision'],
    notFor: 'Tactical product decisions, user research, or estimation.',
    color: '#2563eb',
  },
  'star': {
    name: 'STAR Method',
    origin: "Developed in organizational psychology for structured behavioral interviewing. Adopted widely by Amazon for Leadership Principles questions and popularized in PM circles through Cracking the PM Interview (McDowell, 2013).",
    when: 'When the question starts with "Tell me about a time..." or "Describe a situation where..." — any behavioral prompt.',
    bestFor: ['Amazon Leadership Principle questions', 'Conflict and influence stories', 'Failure and learning narratives', 'Cross-functional alignment examples'],
    notFor: 'Hypothetical product design, strategy, or estimation questions.',
    color: '#9333ea',
  },
  'case-study': {
    name: 'Case Study',
    origin: "Borrowed from MBA case method (Harvard Business School, 1908) and adapted for product reviews. Used by Stripe, Figma, and Linear as a take-home or live interview format to evaluate PM thinking end-to-end.",
    when: 'When given a full product scenario to analyze — a take-home case or a live "walk me through how you\'d approach X" prompt.',
    bestFor: ['Take-home PM case exercises', 'Full product review presentations', 'Senior PM and APM program interviews', '"How would you approach building X from scratch?" questions'],
    notFor: 'Quick behavioral answers or single-metric analysis.',
    color: '#0e7490',
  },
};

// ─── Question bank ────────────────────────────────────────────────────────────
interface QCategory { id: string; label: string; questions: string[]; }

const QUESTION_BANK: QCategory[] = [
  {
    id: 'design',
    label: 'Product Design',
    questions: [
      'How would you improve Instagram Stories for creators?',
      'How would you improve Spotify as a podcast app?',
      'How would you improve LinkedIn\'s user profile page?',
      'How would you improve Google Calendar for remote teams?',
      'How would you improve Reddit?',
      'Design a shopping experience tailored for elderly users.',
      'You\'re the PM for Waymo. How would you build and launch a fully driverless car service?',
      'Google has invented the first quantum computer. How would you productize it?',
      'Meta wants to build an education product. Design it.',
      'Design WhatsApp for university students.',
      'You have a technology that converts text to music. How do you take it to market?',
      'Design an AI assistant in Gemini for college students. Sketch a rough prototype.',
      'Design a feature that lets Uber riders order a ride on someone else\'s behalf.',
      'How would you improve Google Maps?',
      'How would you improve the digital experience for a major city\'s transit system?',
      'Design a product that helps remote workers feel less isolated.',
      'How would you redesign the airport experience using technology?',
      'You\'re the PM for YouTube Kids. What\'s the most important thing you\'d improve?',
      'Design a feature that helps Airbnb hosts manage multiple listings more effectively.',
    ],
  },
  {
    id: 'strategy',
    label: 'Product Strategy',
    questions: [
      'Imagine you\'re the CPO of Zoom, facing heavy competition from Google Meet. What do you do?',
      'Should Google compete with StubHub by selling sports, concert, and theater tickets?',
      'Google wants to acquire iRobot. What would you look for, and how would you position the acquisition?',
      'Should Amazon offer a cheaper "Prime Lite" with just a few perks? What would it cost?',
      'Should Meta enter the dating or jobs market? Walk me through how you\'d evaluate that decision.',
      'How would you launch Spotify in sub-Saharan Africa?',
      'Triple Spotify\'s revenue in the next 3 years. What\'s your strategy?',
      'OpenAI is testing ads on ChatGPT. How would you decide which advertisers to test with first?',
      'Google builds self-driving cars. What new businesses could you build on top of that technology?',
      'What new vertical should Amazon enter next? Walk me through your evaluation framework.',
      'Should Samsung build a video game console? Make the call.',
      'How would you 2x Grammarly\'s paid subscribers?',
      'You\'re the PM on Uber Eats. Only 30% of first-time users order again within a month. How do you fix that?',
      'Should Airbnb offer furniture retail services? Why or why not?',
      'Why is YouTube Premium priced the way it is? Should the pricing model change?',
      'Spotify is losing podcast creators to competitors. What do you do?',
      'Apple is considering entering the financial services space beyond Apple Pay. Should they? How?',
      'How would you help Netflix expand meaningfully into gaming?',
      'A startup wants to compete with Slack in enterprise. What\'s their wedge and go-to-market?',
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & Metrics',
    questions: [
      'Define the success metrics for Facebook Marketplace.',
      'You are the PM of the Facebook Feed. How would you measure retention?',
      'How would you measure the success of Netflix\'s recommendation engine?',
      'What is the most important metric for Google Docs, and why?',
      'What should Airbnb\'s north star metric be?',
      'What\'s YouTube\'s north star metric, and why? What are the 3-5 supporting metrics underneath it?',
      'How would you measure the success of Apple\'s WWDC developer conference?',
      'There\'s been a 15% drop in usage of Facebook Groups. How do you investigate and fix it?',
      'The "Yes, I\'m going" response on Facebook Events dropped 30% overnight. What do you look at?',
      'Instagram Stories engagement is suddenly down 7% today. What do you do?',
      'YouTube\'s DAUs jumped 10% in Indonesia compared to yesterday. What happened?',
      'A key metric for a video streaming service dropped 80%. What do you do?',
      'You notice a 20% drop in Amazon\'s checkout funnel. What do you do?',
      'How would you design an A/B test to measure the impact of a new onboarding flow?',
      'Devise an A/B test to improve Google Maps. What metric would you use as your primary success measure?',
      'Lyft\'s driver supply in Chicago dropped 18% last week with no clear external cause. Walk me through your investigation.',
      'Define success metrics for a B2B SaaS onboarding flow. What\'s your north star and what are the 3 supporting metrics?',
      'How would you use data to decide whether to sunset a feature that 8% of users love but the rest ignore?',
      'LinkedIn\'s connection request acceptance rate fell 12% this quarter. What happened and what do you do?',
    ],
  },
  {
    id: 'execution',
    label: 'Execution & Root Cause',
    questions: [
      'YouTube comments are up, but watch time is down. What do you do?',
      'Daily active users dropped 15% over the last two weeks. Walk me through your root cause analysis.',
      'You committed to a launch date but engineering says it can\'t ship on time. What do you do?',
      'Legal has concerns about your feature one week before launch. Walk me through your approach.',
      '40% of reviews on Amazon are fake. How do you tackle this — identify, act, and measure?',
      'Your most important enterprise customer is pushing for a feature not on your roadmap. Sales escalated directly to engineering. What do you do?',
      'Should Uber Eats be a separate app from regular Uber? Make the call and defend it.',
      'How would you reduce ride cancellations on Uber?',
      'Users are complaining that an AI assistant gives confident but factually wrong answers. How do you fix this?',
      'Drivers are abandoning a specific neighborhood. How do you find out what\'s happening and what do you do?',
      'Two competing product teams want the same engineering resources in Q3. How do you resolve it?',
      'You\'re 4 months into building a feature and beta users keep asking for something you never planned. Do you pivot? How do you decide?',
      'Walk me through how you\'d run a post-mortem after a feature caused a measurable spike in churn.',
      'You shipped a feature that got great qualitative feedback but zero measurable impact on your north star. What does that tell you — wrong measurement, wrong build, or right build wrong users? How do you find out?',
      'A team of three engineers has been blocked on a cross-team dependency for two weeks. Describe exactly what you do — who you talk to, in what order, and what you say if the answer is no.',
      'Your team shipped a feature behind a flag. Two weeks in, only 3% of eligible users have turned it on. What do you do?',
      'A competitor just shipped the feature you\'ve been building for 6 months but with a worse UX. Do you speed up, pivot, or stay the course?',
      'How do you decide what goes into the next sprint when you have 30 items and only capacity for 6?',
      'Your net promoter score dropped 15 points after a major release. How do you diagnose whether it\'s the release or something external?',
      'A data scientist on your team flagged that your most-used feature is being abused by a small set of power users in a way that degrades experience for everyone else. What do you do?',
      'You\'re inheriting a product that shipped a lot of features over 3 years with no coherent vision. How do you establish one?',
    ],
  },
  {
    id: 'estimation',
    label: 'Estimation',
    questions: [
      'Estimate the number of Uber drivers in San Francisco.',
      'Estimate the number of videos watched on YouTube per day.',
      'What is the market size for driverless cars in the US?',
      'What storage space is required to host all images on Google Street View?',
      'Estimate the number of Google Docs created in any given day.',
      'How much ad revenue does Gmail generate per year?',
      'How many queries does Google Search answer per second?',
      'How many passengers are in the air on a plane at any given moment in the US?',
      'Estimate the market size for hamburgers in the US.',
      'Google is launching a high-end smart speaker. What is the total addressable market?',
      'You are opening a new Walmart store. How many cash registers do you need?',
      'Estimate online grocery delivery sales per year in New York City.',
      'Estimate the total hours of content uploaded to YouTube per day.',
      'Estimate the number of restaurants in San Francisco.',
      'How many kindergarten teachers are there in the US?',
      'Estimate the total revenue Starbucks earns from mobile app orders in a year in the US.',
      'How many electric vehicle charging stations does the US need to support 50% EV adoption?',
      'Estimate how much Amazon spends on packaging materials globally each year.',
      'How many photos are uploaded to Instagram per day globally?',
    ],
  },
  {
    id: 'behavioral',
    label: 'Behavioral & Leadership',
    questions: [
      'Tell me about a time you influenced a major product decision without having direct authority.',
      'Tell me about a time one of your products failed. What did you learn?',
      'Tell me about a time you made short-term sacrifices for long-term gains.',
      'Tell me about a time you disagreed strongly with your engineering lead. How did you handle it?',
      'Tell me about a calculated risk you took. What was the outcome?',
      'Describe a time you had to prioritize ruthlessly under real time and resource pressure. What got cut and why?',
      'Tell me about a time you used data to overturn a decision you had already made.',
      'Tell me about navigating competing priorities between two senior leaders who disagreed with each other.',
      'Tell me about a time you introduced a process change that measurably improved team efficiency.',
      'Tell me about a product you led from idea to launch. What would you do differently today?',
      'How do you earn the trust of engineers and designers who\'ve never worked with you before?',
      'Tell me about a time you tried to convince your manager of a direction — and you were wrong.',
      'Tell me about leading a cross-functional launch involving design, engineering, legal, and marketing simultaneously.',
      'When did you say no to a customer or stakeholder request you knew they\'d push back hard on?',
      'Tell me about a time you had to explain a complex product decision to a non-technical executive under pressure.',
      'Tell me about a time your team\'s culture directly caused a product failure — not a process or strategy failure, but something in how you collectively made decisions. What specifically changed?',
      'Tell me about a time you had to make a critical product decision with incomplete data and a tight deadline. How did you frame the uncertainty?',
      'Describe a time you changed a stakeholder\'s mind on a product direction they had already committed to.',
      'Tell me about a time you set an aggressive product goal that your team thought was unrealistic. What happened?',
    ],
  },
  {
    id: 'philosophy',
    label: 'Product Philosophy',
    questions: [
      'Jensen Huang says NVIDIA deliberately invests in "zero-billion-dollar markets" — markets that don\'t yet exist. Where are the zero-billion-dollar problems hiding inside your existing product surface area?',
      'Stewart Butterfield wrote: "What we\'re selling is organizational transformation. Software is the part we happen to be able to build." If your product doesn\'t change how users think about themselves — only how they perform a task — is it a product or an elaborate feature?',
      'Patrick Collison asks: why do we have canonical texts on economics and physics, but nothing rigorous on how to choose a career or raise children? What does this tell you about which product categories are the most underbuilt?',
      'Paul Graham argues the most valuable opportunities are hidden by "schlep blindness" — your unconscious refuses to see problems involving painful, unglamorous work. What opportunities has your team collectively stopped seeing?',
      'Marc Andreessen: "When a great team meets a lousy market, market wins." What decisions are you making today — segment choices, pricing, roadmap bets — that determine which market you actually end up serving in three years?',
      'Peter Thiel\'s interview question: "What important truth do very few people agree with you on?" Apply it directly to your product. What do you believe about your users that your four closest competitors fundamentally do not?',
      'Jensen Huang defines NVIDIA\'s purpose as a problem type: "We solve problems normal computers can\'t." If you articulated your product\'s purpose as the class of problems it exists to solve — not the features — what would that sentence be?',
      'Clayton Christensen found that companies fail precisely because they listened too closely to their best customers. Which customer segment is so vocal in your product that their feedback is crowding out signals from everyone else?',
      'Reed Hastings: "Adequate performance gets a generous severance package." If you applied that to product features — mediocre features get cut — what would your product look like after the first round?',
      'Butterfield: "Innovation is the sum of change across the whole system, not a thing which causes a change." Describe a change your team shipped that you called innovative but that failed to change the system around it.',
      'Marty Cagan\'s central argument is that most teams operate as feature factories — shipping output rather than discovering outcomes. What percentage of your roadmap this quarter represents genuine discovery work versus known solutions to known problems?',
      'Shreyas Doshi\'s LNO framework: leverage (10x return), neutral (1-for-1), overhead (less than 1x). Name two overhead tasks consuming your week that produce no leverage. How would you eliminate or delegate them before adding the next initiative to your plate?',
      'Gibson Biddle\'s DHM model: delight customers in hard-to-copy, margin-enhancing ways. Of your product\'s most delightful moments, how many are defensible against a well-funded competitor who copies them in six months?',
      'Lenny Rachitsky on great PMs: they are world-class at one skill and actively compensate for the rest. What is the one product skill you are genuinely world-class at — and what is the compensating mechanism for the skill you most consistently avoid?',
      'Shishir Mehrotra: "The greatest enemy of good decision-making is a false sense of shared understanding." Describe a product decision your team made where everyone agreed but understood the decision differently. What was the actual outcome?',
    ],
  },
  {
    id: 'first-principles',
    label: 'First Principles',
    questions: [
      'Jensen Huang\'s first-principles method: "Given conditions today, given my motivation, given the instruments available — how would I reinvent this whole thing?" Apply that to the most sacred assumption in your product. What are you treating as given that is actually a historical accident?',
      'Patrick Collison asks: why was the Empire State Building built in 410 days, but a modern subway station takes 10 years? In software, what is the equivalent of institutional drag? If you stripped every process that exists only because "it\'s how we do things," how much faster would your team ship?',
      'The milkshake\'s real competitor wasn\'t a smoothie — it was a banana and silence. Without naming your product category, describe the job your most engaged users actually hire your product to do. Then list every alternative they considered — including ones with nothing to do with software.',
      'Charlie Munger on inversion: "Rather than asking how to succeed, ask what would guarantee failure, then avoid it." List five product decisions you\'ve made in the last year that appear on a list of failure guarantees.',
      'Tobi Lütke says great tools "raise the floor without constraining the ceiling" — but most products do the opposite. Pick a core feature. How does it constrain your most sophisticated users? What would the no-ceiling version look like?',
      'Peter Thiel: durable monopolies rest on four pillars — proprietary technology 10x better, network effects, economies of scale, and branding. Which of those four does your product actually have today — not aspire to, not have a story for — actually have?',
      'Naval Ravikant: specific knowledge is what you can\'t be trained to have. Your product likely rests on an assumption that your team has specific knowledge your users lack. Is that assumption correct, or have you built a product that assumes you\'re smarter than your users in ways that aren\'t actually true?',
      'Nassim Taleb: fragile breaks under stress, robust is unchanged, antifragile gets stronger. Map your product onto those three categories. Is the most important, defensible part of your product fragile or antifragile?',
      'Ben Thompson\'s aggregation theory: aggregators win by owning the user relationship, not the supply. Does your product own the user relationship or the supply side? If you own supply, what would it take to flip — and should you?',
      'Collison: why are all pleasant urban neighborhoods old? Why can\'t we build new ones? In your product category: why do all the premium products look like they were built a decade ago? What constraint is preventing something genuinely new — and is that constraint fixed or just assumed to be?',
      'Why does every product team ship a roadmap? A roadmap is future uncertainty stated as certainty. If you replaced it with explicit probability distributions — "60% chance this produces a 10% retention lift" — which planned work would you immediately deprioritize?',
      'Charlie Munger\'s circle of competence: the danger isn\'t not knowing something — it\'s not knowing where your knowledge ends. Map the three edges of your team\'s competence. What adjacent territory looks attractive but sits just outside genuine understanding?',
      'Elon Musk\'s 5-step method: make requirements less dumb, delete the part, simplify, optimize, automate — in that order. Most teams skip to step 5. Where in your product did you automate a process before questioning whether the process should exist at all?',
      'Jeff Bezos\'s regret minimization framework: at 80, you regret inaction more than failure. Apply this to your current product bets. Which initiative are you delaying because of short-term risk that your 80-year-old self would call simply fear?',
      'Inversion applied to product reviews: instead of asking why this feature succeeded, ask what would have to be false for this to have been the wrong decision. List three things currently true that make your biggest ongoing bet fragile.',
    ],
  },
  {
    id: 'moonshot',
    label: 'Visionary / Moonshot',
    questions: [
      'Jensen Huang: we are moving from retrieval-based systems — fetching pre-stored knowledge — to generative systems that produce intelligence in real time. If your product is rebuilt entirely on generative premises in 10 years, what becomes unnecessary? What becomes newly possible that currently seems absurd?',
      'Brian Chesky\'s 11-star exercise: 5-star is expected, 7-star is surprisingly delightful, 10-star is absurd but imaginable, 11-star is impossible. Apply this to your product\'s core use case. What is specifically preventing you from reliably delivering 7-star today — technical, organizational, or cultural?',
      'Bezos 1997: "We will make bold rather than timid investment decisions where we see sufficient probability of gaining market leadership advantages." Describe the boldest investment your product roadmap could justify. Construct the "sufficient probability" argument for it.',
      'Kevin Kelly: in a world of perfect copies, the only things worth monetizing are the "generatives" — immediacy, personalization, interpretation, authenticity, findability. If AI commoditizes all your product features in three years, which generatives does your product own?',
      'Patrick Collison cites Bloom\'s Two Sigma problem: one-on-one tutoring produces outcomes two standard deviations better than classroom instruction, but doesn\'t scale. Is there a "two sigma" version of your product — one that delivers dramatically better outcomes when it has complete attention — that is currently unscalable? What specifically would make it scale?',
      'Geoffrey Moore: every disruptive product must "cross the chasm" from early adopters to pragmatists. But what if your product was deliberately designed to never cross it — to remain the permanent choice of the visionary fringe? Describe that product\'s business model and the market conditions under which that strategy beats mainstream success.',
      'Thiel: "The next Bill Gates will not build an operating system. The next Larry Page won\'t make a search engine." Finish the sentence for your category: the next dominant player in your market will not build what you\'re building. What will they build instead?',
      'Huang\'s "AI factories" concept: data centers consume energy and produce tokens — manufactured intelligence. Apply this metaphor to your product. What is the raw material? What is the transformation? Who controls the factory — you, your users, or a platform you depend on?',
      'Bezos: "Day 2 is stasis. Followed by irrelevance. Followed by excruciating, painful decline." Describe the Day 2 version of your current product in specific, painful detail. Then identify the forces already moving your product in that direction.',
      'Shishir Mehrotra built Coda on the premise that documents and applications are the same thing — a false boundary the industry accepted for 40 years. In your product category, what two things are currently treated as fundamentally different that are actually the same? What does the unified version look like, and who loses?',
      'Sam Altman: the most important products of the next decade will treat human potential as the scarcest resource — not compute, not capital. If your product treated unlocking human potential as its primary constraint, what would it do fundamentally differently?',
      'Andrej Karpathy: Software 2.0 replaces explicit rules with learned parameters — a different paradigm for building, not just a different tool. Which parts of your product\'s core logic are still Software 1.0 that should become learned behavior? What specifically would you lose in that transition?',
      'If your product had a written constitution — values it can never violate even to maximize engagement or revenue — what would be in it? And what does its current implicit constitution actually say based on the decisions you\'ve already made?',
    ],
  },
  {
    id: 'human-behavior',
    label: 'Human Behavior',
    questions: [
      'Christensen\'s core JTBD finding: people hired a milkshake at 8am not for taste but to occupy themselves during a boring commute. What job does your most engaged user segment actually hire your product to do — and is it the job you designed the product for?',
      'Butterfield in the Slack memo: "Almost all of them have no idea that they want Slack." If your most important user segment currently doesn\'t know they want your product, what would the product itself need to look like for "not knowing they want it" to stop being a barrier?',
      'Paul Graham: users have become blind to their own pain. They\'ve adapted so thoroughly to their current tools that they no longer experience the friction as friction. Describe a painful workflow your users perform routinely that they no longer recognize as painful.',
      'Munger\'s lollapalooza effect: when multiple psychological biases reinforce each other, the outcome is exponential. What combination of cognitive biases makes your product sticky in its best moments? What combination is causing your worst churn?',
      'Naval Ravikant: "Escape competition through authenticity — nobody can beat you at being you." Most products treat all users as interchangeable. What would your product look like if it was designed to surface and leverage each user\'s unique expertise?',
      'Nassim Taleb on skin in the game: people make better decisions when they bear consequences. Most products are designed to reduce friction — which also reduces stakes. If you deliberately gave users more skin in the game, how would behavior change?',
      'Chesky\'s 7-star insight: the best experiences make users feel the product "knows" them. At what moment in your product\'s journey does it first feel like it knows the user? What percentage of users ever reach that moment, and what is the bottleneck?',
      'Kevin Kelly\'s 1,000 True Fans: a creator needs only 1,000 people who will buy everything they make. What does a "true fan" of your product look like behaviorally? How many do you actually have? What drove them from user to true fan, and is that pathway repeatable?',
      'Do you actually have good taste? If you had to demonstrate that your product taste is better than your users\' taste — not with data but with a decision users initially rejected and later came to prefer — what example would you give?',
      'Christensen\'s disruption applied to psychology: the customer segment that abandons an incumbent doesn\'t do so because the new product is better — their circumstance changed and the incumbent stopped fitting. What circumstance change among your users is happening right now that your product is not yet responding to?',
      'Richard Thaler\'s endowment effect: people value what they own more than identical things they don\'t. Where in your product do users have "ownership" that makes switching painful — and is that stickiness genuine delivered value, or friction disguised as loyalty?',
      'Nir Eyal\'s Hook model: trigger → action → variable reward → investment. Most products over-optimize the reward and neglect the investment phase — the action that makes the product better for the user on their next visit. What is the investment moment in your product, and what fraction of users actually complete it?',
      'Dan Ariely: humans are predictably irrational in consistent, mappable ways. Name one predictable irrationality your product currently exploits. Now name one your competitors exploit that you\'re ignoring — and explain why.',
      'Mihaly Csikszentmihalyi\'s flow state: fully absorbed engagement requires challenge to slightly exceed skill. Map your product\'s skill curve. Where does it bore experts and overwhelm beginners? Is there a moment where even a skilled user can reach flow?',
    ],
  },
  {
    id: 'biz-model',
    label: 'Business Model',
    questions: [
      'Peter Thiel: "Superior distribution by itself can create a monopoly, even with no product differentiation." If you had to win your market through distribution innovation alone — ignoring product quality entirely — what would you build?',
      'Kevin Kelly\'s generatives: you monetize what can\'t be copied — immediacy, personalization, interpretation, authenticity, findability. Which generative quality in your product are you currently giving away that you should be monetizing?',
      'Ben Thompson\'s aggregation theory: aggregators commoditize suppliers over time. If you depend on Apple, Google, AWS, or any platform for distribution — what is the aggregator doing right now to commoditize you?',
      'Naval Ravikant: "Earn with your mind, not your time." Most SaaS products charge for seats — units of time and access — rather than units of leverage or impact. Design a pricing model for your product that charges for the actual value produced, not for access.',
      'Christensen\'s disruption: incumbents lose not because they make bad decisions but because they make good ones — they focus on profitable customers and ignore the fringe. In your market, where is your "below" — the segment too small or too low-margin to bother with?',
      'Taleb\'s barbell strategy: be extremely conservative at one end, extremely aggressive at the other, never in the middle. What would a barbell pricing model look like — completely free at the low end, shockingly expensive at the high end? Who inside your company would fight it and why?',
      'Thiel on bundling: big companies get disrupted when one piece of their bundle can be done better standalone. What is the one piece of your product that a focused startup could extract, build better, and charge less for — and is that startup being built right now?',
      'Bezos 1997: Amazon made bold price reductions that hurt short-term margins for long-term market position. Where are you protecting a margin that, if you gave it up, would produce dramatically better long-term positioning?',
      'Reed Hastings removed the vacation policy because it was a process proxy. Where has your monetization become a proxy for value? What pricing structure exists not because it captures real value but because it\'s easy to explain to a board?',
      'Where are you spending an order of magnitude more than you should because you\'ve inherited cost assumptions that no longer hold? If you rebuilt the business model from zero today, what would you stop paying for first?',
      'Gokul Rajaram\'s reversibility test: the best product and business decisions are made reversible before they\'re made. Which business model decision currently on your roadmap is genuinely irreversible — and do you have 10x the evidence you\'d normally require?',
      'Retention is the foundation; every other growth lever is a multiplier on top of it. If your 30-day retention improved by 15%, what would that compound to in lifetime value over three years? Is that calculation in your weekly product review, or does acquisition dominate the room?',
      'The Innovator\'s Solution: disruptive business models serve users who previously couldn\'t participate at all — not slightly worse users at slightly lower prices. Who is entirely excluded from your product category today, and what would the business model need to look like to include them?',
      'Hamilton Helmer\'s 7 Powers: counter-positioning, switching costs, cornered resource, scale economies, network effects, branding, process power. Which power does your business model actually generate — not aspire to, not have a story for — and which did you think you had but actually don\'t?',
    ],
  },
  {
    id: 'distribution',
    label: 'Distribution & Growth',
    questions: [
      'Andrew Chen\'s cold start: every network is useless at zero users, and the gap between zero and useful is where most products die. Define your product\'s "atomic network" — the minimum viable group for which your product delivers complete value. Is that atomic network growing or contracting?',
      'Paul Graham: "One of the most common types of advice we give at YC is to do things that don\'t scale." What is the unscalable thing your product currently relies on — the thing one human is doing that a feature hasn\'t replaced? Is the reason technical, or is the human judgment actually irreplaceable?',
      'Thiel: "If you\'ve invented something new but haven\'t invented an effective way to sell it, you have a bad business." Describe the distribution innovation in your product — not your marketing channel, but the structural reason why your product spreads in a way competitors can\'t replicate.',
      'Bezos on Day 2: "Process becomes a proxy for results." Describe two growth processes inside your organization — A/B testing cadences, funnel reviews, launch checklists — that have become proxies. You run them not because they move outcomes but because they constitute "doing growth work."',
      'Chesky and Gebbia flew to New York and knocked on their hosts\' doors personally. That hand-to-hand tactic didn\'t scale — and didn\'t need to, because it taught them everything. What is the equivalent tactic for your product that you\'ve never tried because it doesn\'t scale?',
      'Andrew Chen\'s five stages: cold start, tipping point, escape velocity, ceiling, moat. Locate your product precisely in this model — not the stage you pitch to investors but the stage your data actually supports. What is the single hardest thing required to move to the next stage?',
      'Ben Thompson: aggregators reduce customer acquisition costs over time as network effects pull users in. Plot your CAC over the last three years. If it\'s going up as you scale, that is empirical evidence you\'re not an aggregator. What does that tell you about your distribution strategy?',
      'Geoffrey Moore: crossing the chasm requires brutal discipline to focus on one segment until you dominate it. Define your current beachhead market with precision. Do you own more than 50% of it? If not, describe the exact reason you haven\'t dominated it before expanding.',
      'Kevin Kelly: a creator needs only 1,000 true fans — people who would pay 5x before switching. How does your growth model deliberately leverage those users to acquire the next 1,000? Or are you optimizing for acquisition volume at the expense of fan depth?',
      'Taleb\'s via negativa: sometimes removal creates more value than addition. What one screen, one approval, one step in onboarding — if removed entirely — would most improve conversion or retention? You\'ve been adding. You\'ve been optimizing. What have you never seriously considered deleting?',
      'Casey Winters: most growth teams optimize acquisition while ignoring that retention is the multiplier acquisition compounds against. If you had to choose between cutting your CAC by 50% or improving 30-day retention by 20% — without changing anything else — which produces more long-term value? When did you last run that calculation?',
      'Brian Balfour\'s four-fit framework: market-product fit, product-channel fit, channel-model fit, model-market fit. Which of these four fits in your product is most misaligned right now — and which one do your reviews least often discuss?',
      'Alex Schultz on magic moments: every product has a specific activation moment where retention permanently shifts upward. Describe your magic moment with precision — not a feature, but the specific experience. What percentage of new users reach it within their first session, and what is the single biggest bottleneck preventing the rest?',
    ],
  },
];

// ─── Framework suggestion engine ─────────────────────────────────────────────
function suggestFrameworks(input: string): string[] {
  const text = input.toLowerCase();
  const scores: Record<string, number> = {};

  const rules: [string, string[]][] = [
    ['star',         [
      'tell me about a time', 'describe a time', 'describe a situation', 'example of when',
      'behavioral', 'leadership principle', 'when you had to', 'walk me through a time',
      'time you', 'situation where', 'how did you handle', 'how have you', 'tell me when',
      'i once', 'i had to', 'i led', 'i managed', 'conflict', 'disagreement', 'difficult',
      'tough situation', 'failure', 'mistake', 'challenge i', 'cross-functional',
      'stakeholder', 'pushback', 'missed', 'learned from', 'decision i made',
    ]],
    ['circles',      [
      'how would you design', 'design a product', 'design a feature', 'how would you improve',
      'improve ', 'redesign', 'build a product for', 'create a product', 'build a feature',
      'make it better', 'what would you change', 'how would you build', 'make spotify',
      'make instagram', 'make google', 'make apple', 'make amazon', 'make uber', 'make airbnb',
      'make twitter', 'make facebook', 'make linkedin', 'make netflix', 'new feature',
      'add to', 'better for', 'experience for', 'ux for', 'product for',
    ]],
    ['jtbd',         [
      'why do users', 'why do people', 'motivation', 'struggling moment', 'hire this product',
      'switching from', 'what drives', 'underlying need', 'what makes people', 'why would someone',
      'behavior', 'habit', 'psychology', 'job to be done', 'what are users really', 'why users',
      'what are people really', 'actually trying to', 'real reason', 'underlying',
    ]],
    ['north-star',   [
      'metric', 'measure success', 'success metric', 'kpi', 'north star', 'dropped', 'decline',
      'fell by', 'engagement', 'dau', 'mau', 'retention', 'diagnose', 'a/b test', 'experiment',
      'analytics', 'data', 'down by', 'went down', 'decreased', 'investigate', 'root cause',
      'measure', 'track', 'dashboard', 'report', 'usage dropped', 'spike', 'anomaly',
    ]],
    ['sizing',       [
      'estimate', 'how many', 'market size', 'tam', 'how much revenue', 'how large', 'sizing',
      'addressable market', 'back of napkin', 'how big', 'how much', 'total market',
      'opportunity size', 'revenue potential', 'number of', 'ballpark', 'rough estimate',
      'back of envelope', 'how large is', 'size of the', 'market opportunity',
      'total users', 'how many people use', 'how many people', 'per year', 'per day',
      'global market', 'worth', 'valued at',
    ]],
    ['competitive',  [
      'competitor', 'competitive', 'compete with', 'vs ', 'versus', 'differentiate',
      'market landscape', 'players', 'moat', 'should we enter', 'market entry', 'win against',
      'beat', 'alternative', 'incumbent', 'threat', 'defensib', 'should google', 'should apple',
      'should amazon', 'should meta', 'should microsoft', 'against', 'better than',
      'losing to', 'winning against', 'market share', 'category leader',
    ]],
    ['strategy',     [
      'strategy', 'should we build', 'expand into', 'long-term', '3 year', 'three year',
      'roadmap', 'vision', 'where to play', 'how to win', 'acquire', 'launch in', 'should we',
      'enter the', 'next five', 'next three', 'grow', 'business model', 'monetize', 'pricing',
      'tier', 'partnership', 'platform', 'next bet', 'investment', 'bet on', 'build vs',
      'make or buy', 'pivot', 'strategic', 'direction', 'future of', 'where should we',
      'what should we', 'next product', 'new vertical', 'new market', 'new business',
    ]],
    ['product-sense',['user need', 'customer need', 'pain point', 'empathy', 'who is the user',
      'what do users want', 'user research', 'what would you build', 'how would you prioritize',
      'solve for', 'problem to solve', 'who uses', 'target user', 'persona', 'friction',
      'insight', 'opportunity', 'what problem', 'priorities',
    ]],
    ['case-study',   [
      'case study', 'end to end', 'from scratch', 'walk me through how you\'d', 'launch plan',
      'post-mortem', 'go to market', 'from idea to', 'full plan', 'gtm', 'launch strategy',
      'rollout', 'end-to-end', 'step by step', 'zero to one', 'design and launch',
      'take to market', 'product launch', 'ship a', 'launch a', 'build and ship',
    ]],
  ];

  for (const [fw, keywords] of rules) {
    for (const kw of keywords) {
      if (text.includes(kw)) scores[fw] = (scores[fw] || 0) + 1;
    }
  }

  // Boost open-ended exploratory questions toward sense + circles + strategy
  const openEnded = ['what should', 'how do i think', 'what to think', 'what are the', 'how should',
    'what do i', 'making a', 'building a', 'launching a', 'creating a', 'starting a',
    'new product', 'new app', 'new service', 'thinking about', 'working on', 'i want to'];
  for (const kw of openEnded) {
    if (text.includes(kw)) {
      scores['product-sense'] = (scores['product-sense'] || 0) + 0.5;
      scores['circles']       = (scores['circles']       || 0) + 0.5;
      scores['strategy']      = (scores['strategy']      || 0) + 0.5;
    }
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([fw]) => fw);
  return ranked.length > 0 ? ranked : ['product-sense', 'circles', 'jtbd'];
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildSystemPrompt(frameworkId: string): string {
  const schema = FRAMEWORK_SCHEMAS[frameworkId] || FRAMEWORK_SCHEMAS['product-sense'];
  const branchList = schema.branches.map((b, i) => `  ${i + 1}. "${b}"`).join('\n');
  const exampleBranches = schema.branches.map(b => `    {"label": "${b}", "insight": "...", "points": ["...", "...", "..."]}`).join(',\n');
  return `You are Prism — a Jarvis-level product thinking partner trained on the canon of PM excellence: Cracking the PM Interview (McDowell), Decode and Conquer (Lewis Lin), Inspired (Marty Cagan), Playing to Win (Roger Martin), The Lean Startup, Swipe to Unlock, and years of wisdom from Exponent, IGotAnOffer, and Blind.

Framework: ${schema.description}
${schema.instruction}

You must use EXACTLY these branch labels in EXACTLY this order:
${branchList}

For each branch: write a sharp 1-2 sentence insight a top PM would actually say for this specific question (not generic), then 3 concrete, specific bullet points. Name real products, real metrics, real failure modes where relevant.

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "branches": [
${exampleBranches}
  ],
  "provocation": "One sharp question that pushes their thinking further or exposes a blind spot",
  "followUps": ["3-4 pointed follow-up questions the user should explore next, based specifically on what was revealed in this analysis — not generic, but rooted in what the framework surfaced"]
}`;
}

// ─── Prism wordmark ───────────────────────────────────────────────────────────
function PrismWordmark({ size = 'hero' }: { size?: 'hero' | 'nav' }) {
  if (size === 'nav') {
    return (
      <div className="relative flex items-center">
        <svg width="20" height="20" viewBox="0 0 40 36" fill="none" className="mr-2.5 shrink-0">
          <defs><filter id="ng"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <line x1="0" y1="16" x2="14" y2="19" stroke="white" strokeWidth="1.5" opacity="0.7" filter="url(#ng)"/>
          <polygon points="20,1 6,34 34,34" fill="rgba(160,200,255,0.10)" stroke="rgba(200,225,255,0.4)" strokeWidth="0.9"/>
          <line x1="20" y1="1" x2="6" y2="34" stroke="rgba(220,235,255,0.5)" strokeWidth="0.7"/>
          {[{ c:'#ff2050',y:6 },{ c:'#ff7700',y:13 },{ c:'#ffe500',y:20 },{ c:'#00e055',y:27 },{ c:'#0099ff',y:34 }].map((b,i)=>(
            <line key={i} x1="27" y1="20" x2="42" y2={b.y} stroke={b.c} strokeWidth="1.3" opacity="0.85" filter="url(#ng)"/>
          ))}
        </svg>
        <span className="font-mono text-xs uppercase tracking-[0.25em] font-bold text-white">PM Prism</span>
      </div>
    );
  }
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="absolute pointer-events-none" style={{ width:'115%', height:'220%', left:'-7%', top:'-60%', zIndex:0 }} viewBox="0 0 500 200" preserveAspectRatio="none">
        <defs>
          <filter id="hg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <linearGradient id="gf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a8c8ff" stopOpacity="0.08"/><stop offset="100%" stopColor="#c4aaff" stopOpacity="0.05"/></linearGradient>
        </defs>
        <line x1="0" y1="100" x2="175" y2="100" stroke="white" strokeWidth="2" opacity="0.35" filter="url(#hg)"/>
        <polygon points="250,15 155,185 345,185" fill="url(#gf)" stroke="rgba(180,210,255,0.22)" strokeWidth="1.2"/>
        <line x1="250" y1="15" x2="155" y2="185" stroke="rgba(220,235,255,0.28)" strokeWidth="0.8"/>
        {[{color:'#ff2050',y:48},{color:'#ff7700',y:68},{color:'#ffe500',y:88},{color:'#00e055',y:108},{color:'#0099ff',y:128},{color:'#5533ff',y:148},{color:'#cc00ff',y:168}].map((b,i)=>(
          <line key={i} x1="325" y1="100" x2="510" y2={b.y} stroke={b.color} strokeWidth="1.8" opacity="0.65" filter="url(#hg)"/>
        ))}
      </svg>
      <h1 className="relative font-black uppercase leading-[0.88] tracking-[-0.02em]" style={{ fontSize:'clamp(52px, 9vw, 100px)', zIndex:1 }}>
        <span className="text-white/90">PM </span>
        <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">Prism</span>
      </h1>
    </div>
  );
}

// ─── Framework pills (always visible) ────────────────────────────────────────
function FrameworkPills({ selected, onChange }: { selected: string[]; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {FRAMEWORKS.map(f => {
        const color = FRAMEWORK_COLORS[f.id] || '#8b5cf6';
        const isSelected = selected.includes(f.id);
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider font-bold border transition-all duration-200 ${
              isSelected ? 'scale-105' : 'bg-white/3 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
            }`}
            style={isSelected ? { backgroundColor:`${color}22`, borderColor:`${color}70`, color } : undefined}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Lens card (collapsible, always mounted) ──────────────────────────────────
function LensCard({ frameworkId }: { frameworkId: string }) {
  const [open, setOpen] = useState(false);
  const info = LENS_INFO[frameworkId];
  if (!info) return null;
  return (
    <div className="rounded-2xl border overflow-hidden transition-colors duration-300" style={{ borderColor:`${info.color}25`, backgroundColor:`${info.color}08` }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-black" style={{ backgroundColor:`${info.color}20`, color:info.color }}>
            {info.name[0]}
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color:info.color }}>About this lens</div>
            <div className="text-white font-semibold text-sm">{info.name}</div>
          </div>
        </div>
        <div className={`text-slate-500 text-lg transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</div>
      </button>
      <div
        style={{
          maxHeight: open ? '520px' : '0px',
          opacity: open ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease',
        }}
      >
        <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor:`${info.color}15` }}>
          <p className="text-slate-400 text-sm leading-relaxed pt-4">{info.origin}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-2">When to use</div>
              <p className="text-slate-300 text-sm leading-relaxed">{info.when}</p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-2">Best for</div>
              <ul className="space-y-1">{info.bestFor.map((b,i)=>(
                <li key={i} className="text-slate-300 text-sm flex gap-2"><span style={{ color:info.color }} className="shrink-0">·</span>{b}</li>
              ))}</ul>
            </div>
          </div>
          <div className="pt-1 border-t" style={{ borderColor:`${info.color}15` }}>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Not for: </span>
            <span className="text-slate-500 text-sm">{info.notFor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Question catalog ─────────────────────────────────────────────────────────
const CLASSIC_IDS = ['design', 'strategy', 'analytics', 'execution', 'estimation', 'behavioral'];
const TARIQ_IDS   = ['philosophy', 'first-principles', 'moonshot', 'human-behavior', 'biz-model', 'distribution'];

function QuestionCatalog({ onSelect, inline = false }: { onSelect: (q: string) => void; inline?: boolean }) {
  const [open, setOpen] = useState(inline);
  const [activeTab, setActiveTab] = useState('design');
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const active = QUESTION_BANK.find(c => c.id === activeTab) || QUESTION_BANK[0];
  const totalQ = QUESTION_BANK.reduce((n,c)=>n+c.questions.length,0);
  const isTariq = TARIQ_IDS.includes(activeTab);

  function handleSelect(q: string) {
    setJustSelected(q);
    setTimeout(() => setJustSelected(null), 700);
    onSelect(q);
  }

  const classicGroups = QUESTION_BANK.filter(c => CLASSIC_IDS.includes(c.id));
  const tariqGroups   = QUESTION_BANK.filter(c => TARIQ_IDS.includes(c.id));

  function PillGroup({ cats, group }: { cats: typeof QUESTION_BANK; group: 'classic' | 'tariq' }) {
    const isT = group === 'tariq';
    return (
      <div className="space-y-2">
        {/* Group header */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="h-px flex-1" style={{ background: isT ? 'linear-gradient(to right, rgba(109,40,217,0.4), transparent)' : 'linear-gradient(to right, rgba(14,116,144,0.3), transparent)' }}/>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] shrink-0" style={{ color: isT ? 'rgba(139,92,246,0.7)' : 'rgba(34,211,238,0.55)' }}>
            {isT ? '✦ Tariq\'s Lens' : 'Classic PM'}
          </span>
          <div className="h-px flex-1" style={{ background: isT ? 'linear-gradient(to left, rgba(109,40,217,0.4), transparent)' : 'linear-gradient(to left, rgba(14,116,144,0.3), transparent)' }}/>
        </div>
        {/* Pills */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {cats.map(c => {
            const isActive = activeTab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide transition-all border ${
                  isT ? 'rounded-lg' : 'rounded-full'
                } ${
                  isActive
                    ? isT
                      ? 'bg-violet-600/25 border-violet-400/55 text-violet-300'
                      : 'bg-cyan-600/20 border-cyan-400/50 text-cyan-300'
                    : isT
                      ? 'bg-violet-950/20 border-violet-900/40 text-slate-500 hover:border-violet-700/50 hover:text-slate-300'
                      : 'bg-white/3 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={inline ? '' : 'rounded-2xl border border-white/6'}>
      {!inline && (
        <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition-colors rounded-2xl">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-slate-400 font-bold">Question Catalog</div>
            <div className="text-slate-600 text-sm mt-0.5">{totalQ} questions — classic PM &amp; Tariq's lens</div>
          </div>
          <div className={`text-slate-500 text-lg transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</div>
        </button>
      )}
      {(open || inline) && (
        <div className={inline ? '' : 'border-t border-white/6'}>
          <div className="px-4 pt-4 pb-3 space-y-3">
            <PillGroup cats={classicGroups} group="classic"/>
            <PillGroup cats={tariqGroups}   group="tariq"/>
          </div>
          <div className={`px-4 pb-4 pt-1 space-y-1 border-t ${isTariq ? 'border-violet-900/30' : 'border-white/6'}`}>
            {active.questions.map((q, i) => {
              const isFlashing = justSelected === q;
              return (
                <button key={i} onClick={() => handleSelect(q)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all group flex items-start gap-3 ${
                    isFlashing
                      ? 'text-violet-200'
                      : isTariq
                        ? 'text-slate-400 hover:bg-violet-950/30 hover:text-violet-200'
                        : 'text-slate-400 hover:bg-white/4 hover:text-white'
                  }`}
                  style={isFlashing ? { backgroundColor:'rgba(139,92,246,0.18)', animation:'q-flash 0.7s ease' } : undefined}
                >
                  <span className={`shrink-0 font-mono text-[10px] mt-0.5 transition-colors w-5 text-center ${
                    isFlashing ? 'text-violet-400' : isTariq ? 'text-violet-900 group-hover:text-violet-600' : 'text-slate-700 group-hover:text-slate-500'
                  }`}>
                    {isFlashing ? '✓' : String(i+1).padStart(2,'0')}
                  </span>
                  <span className="leading-snug min-w-0 break-words">{q}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Grid columns ─────────────────────────────────────────────────────────────
function gridCols(n: number): string {
  if (n <= 2) return 'grid-cols-1 sm:grid-cols-2';
  if (n === 4) return 'grid-cols-1 sm:grid-cols-2';
  if (n <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
}

// ─── Mind map ─────────────────────────────────────────────────────────────────
interface Branch { label: string; insight: string; points: string[]; }
interface MindMapData { branches: Branch[]; provocation: string; followUps?: string[]; }

function MindMap({ data, question, frameworkId }: { data: MindMapData; question: string; frameworkId: string }) {
  const schema = FRAMEWORK_SCHEMAS[frameworkId] || FRAMEWORK_SCHEMAS['product-sense'];
  const [modal, setModal] = useState<{ branch: Branch; color: string } | null>(null);
  const [elaboration, setElaboration] = useState('');
  const [elaborating, setElaborating] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  function closeModal() { setModal(null); setElaboration(''); setChatHistory([]); setChatInput(''); }

  async function openModal(branch: Branch, color: string) {
    setModal({ branch, color });
    setElaboration('');
    setChatHistory([]);
    setChatInput('');
    setElaborating(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization:`Bearer ${GROQ_API_KEY}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role:'system', content:`You are Prism, a world-class PM thinking partner. The user analyzed a question using the ${schema.description.split(':')[0]} framework. Elaborate deeply on the "${branch.label}" branch. Go 3 levels deeper: expose the non-obvious, cite real examples from Figma, Stripe, Notion, Linear, Duolingo or similar, give a concrete mental model, and end with one sharp action the PM should take this week. 4-6 focused paragraphs. No generic advice.` },
            { role:'user', content:`Original question: ${question}\n\nBranch: ${branch.label}\nInsight: ${branch.insight}\nPoints: ${branch.points.join('; ')}\n\nGo deeper.` },
          ],
          max_tokens: 900,
          stream: false,
        }),
      });
      const json = await res.json();
      setElaboration(json.choices?.[0]?.message?.content || '');
    } catch {
      setElaboration('Could not load elaboration. Try again.');
    } finally {
      setElaborating(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading || !modal) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);
    const nextHistory: { role: 'user' | 'assistant'; content: string }[] = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(nextHistory);
    setTimeout(() => chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization:`Bearer ${GROQ_API_KEY}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role:'system', content:`You are Prism, a PM thinking partner. The user is doing a deep dive into the "${modal.branch.label}" branch of a ${schema.description.split(':')[0]} analysis of: "${question}". Your elaboration so far: "${elaboration.slice(0,400)}...". Answer follow-up questions sharply and concisely. No fluff.` },
            ...nextHistory.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 500,
          stream: false,
        }),
      });
      const json = await res.json();
      const reply = json.choices?.[0]?.message?.content || 'No response.';
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
      setTimeout(() => chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Could not get a response. Try again.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/5"/>
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500">{schema.description.split(':')[0]}</span>
        <div className="h-px flex-1 bg-white/5"/>
      </div>
      <div className="flex justify-center">
        <div className="max-w-xl w-full px-6 py-5 border border-white/15 rounded-2xl text-center" style={{ backgroundColor:'rgba(255,255,255,0.04)' }}>
          <p className="text-white text-base font-semibold leading-relaxed">{question}</p>
        </div>
      </div>
      <div className="flex justify-center"><div className="w-px h-5 bg-white/10"/></div>
      <div className={`grid ${gridCols(data.branches.length)} gap-4`}>
        {data.branches.map((b,i) => {
          const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
          return (
            <div key={i} className="rounded-xl p-5 flex flex-col gap-3" style={{ backgroundColor:`${color}10`, border:`1px solid ${color}30` }}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black text-white/25">{String(i+1).padStart(2,'0')}</span>
                <span className="font-mono text-xs font-black uppercase tracking-widest" style={{ color }}>{b.label}</span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">{b.insight}</p>
              <ul className="space-y-1.5 pt-1 border-t flex-1" style={{ borderColor:`${color}20` }}>
                {b.points.map((p,j)=>(
                  <li key={j} className="text-slate-400 text-sm flex gap-2 leading-snug">
                    <span style={{ color }} className="shrink-0 mt-0.5 font-bold">·</span><span>{p}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openModal(b, color)}
                className="mt-1 w-full py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider border transition-all duration-200 hover:opacity-90"
                style={{ borderColor:`${color}35`, color, backgroundColor:`${color}08` }}
              >
                Expand & Elaborate →
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center pt-2">
        <div className="border border-violet-500/25 rounded-xl px-6 py-5 max-w-2xl w-full" style={{ backgroundColor:'rgba(109,40,217,0.08)' }}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-violet-500 mb-2">Provocation</div>
          <p className="text-slate-400 text-xs mb-3">The question a great PM coach would ask after hearing your answer — the blind spot, the assumption unchecked, the thing that separates good from great.</p>
          <p className="text-violet-300 text-sm italic leading-relaxed">→ {data.provocation}</p>
        </div>
      </div>

      {/* Elaborate modal */}
      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-8" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm"/>
          <div
            className="relative z-10 w-full max-w-2xl lg:max-w-6xl max-h-[88vh] rounded-2xl border flex flex-col"
            style={{ backgroundColor:'#07091A', borderColor:`${modal.color}35` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header — full width */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor:`${modal.color}20` }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: modal.color }}/>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color: modal.color, opacity: 0.8 }}>
                    {schema.description.split(':')[0]} · Deep Analysis
                  </div>
                  <div className="font-mono text-sm font-black uppercase tracking-wider text-white">{modal.branch.label}</div>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-xl leading-none">×</button>
            </div>

            {/* Body — single column mobile, two columns desktop */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

              {/* Left panel: insight + elaboration */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0 lg:border-r scrollbar-hide" style={{ borderColor:`${modal.color}18` }}>
                <div className="rounded-xl px-4 py-3 border-l-2" style={{ backgroundColor:`${modal.color}0d`, borderLeftColor: modal.color }}>
                  <p className="text-slate-300 text-sm leading-relaxed italic">{modal.branch.insight}</p>
                </div>
                {elaborating && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex gap-1">{[0,1,2].map(k=><div key={k} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor:modal.color, animationDelay:`${k*0.15}s` }}/>)}</div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Going deeper…</span>
                  </div>
                )}
                {elaboration && (
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{elaboration}</p>
                )}
                {/* On mobile: chat history sits here inline */}
                {chatHistory.length > 0 && (
                  <div className="lg:hidden space-y-3 pt-2 border-t" style={{ borderColor:`${modal.color}15` }}>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-slate-600 pt-1">Follow-up</div>
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'user' ? (
                          <div className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white" style={{ backgroundColor:`${modal.color}28`, border:`1px solid ${modal.color}35` }}>{msg.content}</div>
                        ) : (
                          <p className="text-slate-300 text-sm leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex gap-1">{[0,1,2].map(k=><div key={k} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor:modal.color, animationDelay:`${k*0.15}s` }}/>)}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Right panel: chat — desktop only layout */}
              <div className="hidden lg:flex lg:w-96 xl:w-[26rem] flex-col border-t lg:border-t-0" style={{ borderColor:`${modal.color}18` }}>
                <div className="px-4 py-3 border-b shrink-0" style={{ borderColor:`${modal.color}12` }}>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600">Ask a follow-up</span>
                </div>
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scrollbar-hide">
                  {chatHistory.length === 0 && !chatLoading && (
                    <p className="text-slate-600 text-xs text-center mt-8 leading-relaxed">Ask anything about this branch — dig into the details, challenge the insight, or explore what it means for your product.</p>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'user' ? (
                        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white" style={{ backgroundColor:`${modal.color}28`, border:`1px solid ${modal.color}35` }}>{msg.content}</div>
                      ) : (
                        <div className="max-w-[90%] text-slate-300 text-sm leading-relaxed">{msg.content}</div>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">{[0,1,2].map(k=><div key={k} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor:modal.color, animationDelay:`${k*0.15}s` }}/>)}</div>
                    </div>
                  )}
                </div>
                {/* Chat input inside right panel */}
                <div className="px-4 pb-4 pt-3 border-t shrink-0" style={{ borderColor:`${modal.color}18` }}>
                  <div className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                      placeholder="Ask about this branch…"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 outline-none focus:border-white/25 transition-colors"
                    />
                    <button
                      onClick={sendChat}
                      disabled={!chatInput.trim() || chatLoading || elaborating}
                      className="px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-wider font-bold border disabled:opacity-30 transition-all hover:opacity-85"
                      style={{ backgroundColor:`${modal.color}22`, borderColor:`${modal.color}45`, color: modal.color }}
                    >
                      {chatLoading ? '…' : 'Ask →'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-only chat input at the bottom */}
            <div className="lg:hidden px-4 pb-4 pt-3 border-t shrink-0" style={{ borderColor:`${modal.color}18` }}>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="Ask a follow-up about this branch…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 outline-none focus:border-white/25 transition-colors"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatLoading || elaborating}
                  className="px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-wider font-bold border disabled:opacity-30 transition-all hover:opacity-85"
                  style={{ backgroundColor:`${modal.color}22`, borderColor:`${modal.color}45`, color: modal.color }}
                >
                  {chatLoading ? '…' : 'Ask →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PMPrism() {
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['product-sense']);
  const [input, setInput] = useState('');
  const [mindMaps, setMindMaps] = useState<Record<string, MindMapData>>({});
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [submittedFrameworks, setSubmittedFrameworks] = useState<string[]>(['product-sense']);
  const [loadingFrameworks, setLoadingFrameworks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('product-sense');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dictOpen, setDictOpen] = useState(false);
  const [dictClosing, setDictClosing] = useState(false);
  const [questionLoaded, setQuestionLoaded] = useState(false);
  const [bottomChats, setBottomChats] = useState<Record<string, { role: 'user' | 'assistant'; content: string }[]>>({});
  const [bottomChatInput, setBottomChatInput] = useState('');
  const [bottomChatSending, setBottomChatSending] = useState(false);

  function closeDict() {
    setDictClosing(true);
  }
  const responseRef = useRef<HTMLDivElement>(null);
  const bottomChatEndRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bottomChats, bottomChatSending]);

  async function sendBottomChat() {
    const userMsg = bottomChatInput.trim();
    const currentData = mindMaps[activeTab];
    if (!userMsg || bottomChatSending || !currentData) return;
    setBottomChatInput('');
    setBottomChatSending(true);
    const prev = bottomChats[activeTab] ?? [];
    const withUser = [...prev, { role: 'user' as const, content: userMsg }];
    setBottomChats(c => ({ ...c, [activeTab]: withUser }));

    if (DEV_MOCK) {
      await new Promise(r => setTimeout(r, 700));
      const mock = "Sharp question. The key tension is between retaining existing podcast listeners vs. converting music-only users. The social layer I surfaced is a retention bet — compounding flywheel, 5× cheaper than acquisition. Discovery features help conversion but commoditize quickly. Given Spotify's plateau in streaming, I'd bet retention first, discovery second.";
      setBottomChats(c => ({ ...c, [activeTab]: [...withUser, { role: 'assistant', content: mock }] }));
      setBottomChatSending(false);
      return;
    }

    try {
      const fw = FRAMEWORKS.find(f => f.id === activeTab);
      const ctx = currentData.branches.map(b => `${b.label}: ${b.insight}\n${b.points.join('; ')}`).join('\n\n');
      const sys = `You are Prism, a sharp PM thinking partner. The user analyzed this question using the ${fw?.label ?? activeTab} framework: "${submittedQuestion}"\n\nAnalysis:\n${ctx}\n\nAnswer concisely and directly, grounded in what this specific analysis revealed. Max 3 short paragraphs. Be opinionated.`;
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: sys }, ...withUser],
          temperature: 0.7,
          max_tokens: 400,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      const reply = json.choices?.[0]?.message?.content ?? 'No response.';
      setBottomChats(c => ({ ...c, [activeTab]: [...withUser, { role: 'assistant', content: reply }] }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setBottomChats(c => ({ ...c, [activeTab]: [...withUser, { role: 'assistant', content: `Error: ${msg}` }] }));
    } finally {
      setBottomChatSending(false);
    }
  }

  async function runAnalysis(question: string, frameworkIds: string[]) {
    setMindMaps({});
    setError('');
    setLoadingFrameworks([...frameworkIds]);

    if (DEV_MOCK) {
      await new Promise(r => setTimeout(r, 800));
      const result: Record<string, MindMapData> = {};
      for (const fw of frameworkIds) {
        result[fw] = MOCK_MIND_MAPS[fw] ?? MOCK_MIND_MAPS['product-sense'];
      }
      setMindMaps(result);
      setLoadingFrameworks([]);
      return;
    }

    await Promise.all(frameworkIds.map(async (frameworkId) => {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization:`Bearer ${GROQ_API_KEY}`, 'Content-Type':'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role:'system', content:buildSystemPrompt(frameworkId) },
              { role:'user', content:question },
            ],
            max_tokens: 1600,
            stream: false,
            response_format: { type:'json_object' },
          }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message || 'API error');
        const raw = json.choices?.[0]?.message?.content;
        if (!raw) throw new Error('Empty response from model');
        const parsed: MindMapData = JSON.parse(raw);
        setMindMaps(prev => ({ ...prev, [frameworkId]: parsed }));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setError(`Analysis failed: ${msg}. Try again or select fewer lenses.`);
      } finally {
        setLoadingFrameworks(prev => prev.filter(f => f !== frameworkId));
      }
    }));
  }

  function handleSubmit() {
    if (!input.trim() || loadingFrameworks.length > 0) return;
    const fws = [...selectedFrameworks];
    setSubmitted(true);
    setSubmittedQuestion(input);
    setSubmittedFrameworks(fws);
    setActiveTab(fws[0]);
    setBottomChats({});
    setTimeout(() => responseRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 150);
    runAnalysis(input, fws);
  }

  function toggleFramework(fw: string) {
    setSelectedFrameworks(prev =>
      prev.includes(fw)
        ? prev.length > 1 ? prev.filter(f => f !== fw) : prev
        : [...prev, fw]
    );
  }

  function reset() {
    setSubmitted(false);
    setMindMaps({});
    setInput('');
    setSubmittedQuestion('');
    setError('');
    setDictOpen(false);
    setBottomChats({});
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#07091A] text-white relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        {STARS_BG.map(s => (
          <div key={s.id} className="absolute rounded-full bg-white" style={{
            left:`${s.left}%`, top:`${s.top}%`, width:s.size, height:s.size, opacity:s.opacity,
            animation:`prism-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
          }}/>
        ))}
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <PrismWordmark size="nav"/>
        <Link to="/" className="font-mono text-xs uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">← Portfolio</Link>
      </nav>

      {/* Hero — collapses after submit */}
      <div
        className="relative z-10 text-center px-6 overflow-hidden"
        style={{
          maxHeight: submitted ? '0px' : '420px',
          opacity: submitted ? 0 : 1,
          paddingTop: submitted ? '0px' : undefined,
          paddingBottom: submitted ? '0px' : undefined,
          transition: 'max-height 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease, padding 0.5s ease',
        }}
      >
        <div style={{ paddingTop: '8rem', paddingBottom: '2.5rem' }}>
          <div className="flex justify-center mb-6">
            <PrismWordmark size="hero"/>
          </div>
          <p className="text-slate-400 text-base max-w-sm mx-auto leading-relaxed mt-16">
            Bring any product question. Prism refracts it through every framework lens.
          </p>
        </div>
      </div>

      {/* Controls — sticky compact bar after submit, full layout before */}
      <div
        className="relative z-20"
        style={submitted ? {
          position: 'sticky',
          top: 0,
          backgroundColor: 'rgba(7,9,26,0.94)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '10px',
          paddingBottom: '10px',
        } : undefined}
      >
        {/* Framework pills — always visible */}
        <div className={`relative z-10 max-w-3xl mx-auto px-6 ${submitted ? 'mb-2' : 'mb-6'}`}>
          <FrameworkPills selected={selectedFrameworks} onChange={toggleFramework}/>
        </div>

        {/* Pre-submit: lens card + full input */}
        {!submitted && (
          <>
            <div className="relative z-10 max-w-2xl mx-auto px-6 mb-4">
              <LensCard frameworkId={selectedFrameworks[selectedFrameworks.length - 1]}/>
            </div>
            <div className="relative z-10 max-w-2xl mx-auto px-6">
              <div className={`rounded-2xl border transition-all duration-500 ${questionLoaded ? 'border-violet-400/70 bg-violet-950/20' : input ? 'border-violet-500/30 bg-violet-950/10' : 'border-white/8 bg-white/3'}`}
                style={questionLoaded ? { boxShadow:'0 0 20px rgba(139,92,246,0.25)' } : undefined}
              >
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="What product problem are you working through?"
                  className="w-full bg-transparent text-white placeholder-slate-600 text-base leading-relaxed p-5 resize-none outline-none overflow-hidden"
                  style={{ height: 120 }}
                  onKeyDown={e => { if (e.key==='Enter' && (e.metaKey||e.ctrlKey) && loadingFrameworks.length === 0) handleSubmit(); }}
                />
                {(() => {
                  const suggestions = input.trim().length > 10 ? suggestFrameworks(input) : [];
                  return suggestions.length > 0 ? (
                    <div className="flex items-center gap-2 px-5 py-2 border-t border-white/5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-700 shrink-0">Suggested lens:</span>
                      {suggestions.map(fw => {
                        const label = FRAMEWORKS.find(f => f.id === fw)?.label;
                        return (
                          <button key={fw} onClick={() => toggleFramework(fw)}
                            className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wide border transition-all ${
                              selectedFrameworks.includes(fw)
                                ? 'bg-violet-600/25 border-violet-400/60 text-violet-300'
                                : 'bg-white/4 border-white/15 text-slate-400 hover:text-white hover:border-white/30'
                            }`}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null;
                })()}
                <div className="flex items-center justify-end gap-3 px-4 pb-4 pt-2 border-t border-white/5">
                  <span className="font-mono text-xs text-slate-600 hidden sm:block">⌘↵</span>
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || loadingFrameworks.length > 0}
                    className="px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-mono text-xs uppercase tracking-wide font-bold rounded-lg disabled:opacity-20 hover:opacity-90 transition-opacity"
                  >
                    {loadingFrameworks.length > 0 ? 'Analyzing...' : `Analyze${selectedFrameworks.length > 1 ? ` (${selectedFrameworks.length} lenses)` : ''} →`}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Post-submit: prominent question display */}
        {submitted && (
          <div className="relative z-10 max-w-3xl mx-auto px-6">
            <div className="relative flex items-center rounded-2xl border border-white/10 px-5 py-3.5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <p className="flex-1 min-w-0 text-white text-base font-medium text-center truncate">{submittedQuestion}</p>
              <button
                onClick={reset}
                className="absolute right-3 shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-600 hover:text-slate-300 border border-white/8 hover:border-white/20 px-2.5 py-1 rounded-lg transition-colors"
              >
                ↺
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Question catalog — pre-submit only */}
      {!submitted && (
        <div className="relative z-10 max-w-5xl mx-auto px-6 mt-4">
          <QuestionCatalog onSelect={q => { setInput(q); setQuestionLoaded(true); setTimeout(() => setQuestionLoaded(false), 900); }}/>
        </div>
      )}

      {/* Floating catalog button + panel — post-submit */}
      {submitted && (
        <>
          <button
            onClick={() => dictOpen ? closeDict() : setDictOpen(true)}
            title="Question Catalog"
            className="fixed z-50 flex flex-col items-center justify-center gap-1 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              top: '5.5rem',
              left: '1.25rem',
              width: '3.5rem',
              height: '3.5rem',
              background: (dictOpen && !dictClosing)
                ? 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)'
                : 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
              border: '2px solid rgba(255,255,255,0.22)',
              boxShadow: (dictOpen && !dictClosing)
                ? '0 0 32px rgba(20,184,166,0.9), 0 0 64px rgba(20,184,166,0.35), 0 4px 20px rgba(0,0,0,0.6)'
                : '0 0 22px rgba(13,148,136,0.7), 0 4px 20px rgba(0,0,0,0.5)',
              animation: 'dict-fly-in 0.9s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* 3×3 catalog grid icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {[0,1,2].flatMap(row => [0,1,2].map(col => (
                <rect key={`${row}-${col}`} x={col*6+0.5} y={row*6+0.5} width="4.5" height="4.5" rx="1" fill="white" opacity={0.9}/>
              )))}
            </svg>
            <span className="font-mono text-[6px] uppercase tracking-wide text-white font-bold leading-none" style={{ opacity:0.92 }}>Catalog</span>
          </button>

          {/* Expanded panel */}
          {(dictOpen || dictClosing) && (
            <div
              className="fixed top-20 left-16 z-50 max-h-[80vh] overflow-y-auto rounded-2xl border shadow-2xl"
              style={{
                width: 'min(46rem, calc(100vw - 5rem))',
                backgroundColor:'rgba(9,11,28,0.97)',
                borderColor:'rgba(13,148,136,0.3)',
                animation: dictClosing
                  ? 'dict-panel-out 0.22s cubic-bezier(0.4,0,1,1) forwards'
                  : 'dict-panel-in 0.3s cubic-bezier(0.16,1,0.3,1)',
              }}
              onAnimationEnd={() => {
                if (dictClosing) { setDictOpen(false); setDictClosing(false); }
              }}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 sticky top-0" style={{ backgroundColor:'rgba(9,11,28,0.97)' }}>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-teal-400 font-bold">Question Catalog</div>
                  <div className="text-slate-600 text-xs mt-0.5">{QUESTION_BANK.reduce((n,c)=>n+c.questions.length,0)} questions</div>
                </div>
                <button onClick={closeDict} className="text-slate-600 hover:text-slate-300 text-xl leading-none transition-colors">×</button>
              </div>
              <QuestionCatalog inline onSelect={q => {
                setInput(q);
                closeDict();
                setQuestionLoaded(true);
                setTimeout(() => setQuestionLoaded(false), 900);
                window.scrollTo({top:300,behavior:'smooth'});
              }}/>
            </div>
          )}
        </>
      )}

      {/* Output */}
      {submitted && (
        <div className="relative z-10 max-w-5xl mx-auto px-6 mt-12 pb-28" ref={responseRef}>
          {/* Framework tabs — only shown when multiple lenses selected */}
          {submittedFrameworks.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {submittedFrameworks.map(fw => {
                const label = FRAMEWORKS.find(f => f.id === fw)?.label;
                const isLoading = loadingFrameworks.includes(fw);
                const isDone = !!mindMaps[fw];
                return (
                  <button
                    key={fw}
                    onClick={() => setActiveTab(fw)}
                    className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider font-bold border transition-all duration-200 flex items-center gap-2 ${
                      activeTab === fw
                        ? 'bg-violet-600/25 border-violet-400/60 text-violet-300 scale-105'
                        : 'bg-white/3 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {isLoading && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block"/>}
                    {isDone && !isLoading && <span className="opacity-60 text-[9px]">✓</span>}
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          {/* Loading state for the active tab */}
          {loadingFrameworks.includes(activeTab) && (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="flex gap-2">
                {[0,1,2,3,4].map(i=>(
                  <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay:`${i*0.12}s` }}/>
                ))}
              </div>
              <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">
                Mapping through {FRAMEWORKS.find(f=>f.id===activeTab)?.label}...
              </span>
            </div>
          )}
          {error && <div className="text-center text-red-400 text-sm py-8">{error}</div>}
          {mindMaps[activeTab] && !loadingFrameworks.includes(activeTab) && (
            <>
              <MindMap data={mindMaps[activeTab]} question={submittedQuestion} frameworkId={activeTab}/>
              {loadingFrameworks.length === 0 && (() => {
                const data = mindMaps[activeTab];
                if (!data) return null;
                const msgs = bottomChats[activeTab] ?? [];
                const hasMsgs = msgs.length > 0;
                return (
                  <div className="mt-10 space-y-4">
                    <div className="rounded-xl border border-white/8 overflow-hidden" style={{ backgroundColor:'rgba(255,255,255,0.02)' }}>
                      {/* Header */}
                      <div className="px-5 py-3.5 border-b border-white/6 flex items-center gap-2">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-bold">Dig deeper</div>
                        <div className="text-slate-700 text-[10px]">— ask anything about this analysis</div>
                      </div>

                      {/* Chat messages */}
                      {hasMsgs && (
                        <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
                          {msgs.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {msg.role === 'assistant' && (
                                <div className="shrink-0 w-6 h-6 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-[10px] font-black mt-0.5">P</div>
                              )}
                              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-violet-600/20 text-violet-100 rounded-tr-sm'
                                  : 'bg-white/6 text-slate-300 rounded-tl-sm'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          {bottomChatSending && (
                            <div className="flex gap-3 justify-start">
                              <div className="shrink-0 w-6 h-6 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-[10px] font-black">P</div>
                              <div className="bg-white/6 text-slate-500 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">
                                <span className="animate-pulse">thinking…</span>
                              </div>
                            </div>
                          )}
                          <div ref={bottomChatEndRef}/>
                        </div>
                      )}

                      {/* Suggested questions — full rows before chat starts, chips after */}
                      {data.followUps && data.followUps.length > 0 && !hasMsgs && (
                        <div className="p-3 space-y-1">
                          {data.followUps.map((q, i) => (
                            <button key={i} onClick={() => setBottomChatInput(q)}
                              className="w-full text-left px-4 py-3 rounded-lg text-slate-400 text-sm hover:bg-white/5 hover:text-white border border-transparent hover:border-violet-400/20 transition-all flex items-start gap-3 group">
                              <span className="shrink-0 text-violet-600 group-hover:text-violet-400 transition-colors mt-0.5">→</span>
                              <span className="leading-snug min-w-0">{q}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {data.followUps && data.followUps.length > 0 && hasMsgs && (
                        <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5 border-t border-white/5">
                          {data.followUps.map((q, i) => (
                            <button key={i} onClick={() => setBottomChatInput(q)}
                              className="text-xs px-3 py-1.5 rounded-full text-slate-500 border border-white/8 hover:border-violet-400/30 hover:text-slate-300 transition-all text-left" style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {q}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Input */}
                      <div className="px-4 pb-4 pt-3 border-t border-white/6">
                        <div className="flex gap-2">
                          <input
                            value={bottomChatInput}
                            onChange={e => setBottomChatInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBottomChat(); }}}
                            placeholder="Ask anything about this analysis…"
                            className="flex-1 bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/6 transition-all"
                          />
                          <button
                            onClick={sendBottomChat}
                            disabled={!bottomChatInput.trim() || bottomChatSending}
                            className="px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/35 hover:border-violet-400/50"
                          >
                            {bottomChatSending ? '…' : 'Ask →'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button onClick={reset} className="w-full py-3 border border-white/6 text-slate-600 font-mono text-[10px] uppercase tracking-wider hover:border-white/15 hover:text-slate-400 transition-all rounded-xl">
                      Start over ↑
                    </button>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes prism-twinkle { from { opacity: 0.04; } to { opacity: 0.3; } }
        @keyframes dict-fly-in {
          0%   { opacity:0; transform: translate(calc(50vw - 3rem), calc(50vh - 7.5rem)) scale(1.6); }
          22%  { opacity:1; }
          80%  { transform: translate(4px, 4px) scale(1.07); }
          100% { opacity:1; transform: translate(0,0) scale(1); }
        }
        @keyframes dict-panel-in  { from { opacity: 0; transform: scale(0.95) translateX(-8px); } to { opacity: 1; transform: scale(1) translateX(0); } }
        @keyframes dict-panel-out { from { opacity: 1; transform: scale(1) translateX(0); } to { opacity: 0; transform: scale(0.95) translateX(-8px); } }
        @keyframes q-flash { 0%,100% { background-color: transparent; } 40% { background-color: rgba(139,92,246,0.2); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
