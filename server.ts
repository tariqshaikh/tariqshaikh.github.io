import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { NJ_COUNTIES, NJ_ENRICHED } from "./src/constants";
import { ASHBY_COMPANIES, GREENHOUSE_COMPANIES, PM_KEYWORDS, LOCATION_KEYWORDS, type AshbyJob } from "./src/services/ashbyService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route for Town Data
  app.get("/api/towns", (req, res) => {
    const enrichedData = { ...NJ_ENRICHED };
    
    // 1. Ensure EVERY town in NJ_COUNTIES exists in enrichedData
    Object.entries(NJ_COUNTIES).forEach(([county, info]) => {
      info.towns.forEach(town => {
        if (!enrichedData[town]) {
          // Generate synthetic data for missing towns
          const baseHeat = info.heat || 100;
          const seed = town.length; // simple seed
          enrichedData[town] = {
            income: 65000 + (seed * 1500) % 100000,
            homeVal: 350000 + (seed * 5000) % 800000,
            commute: 30 + (seed * 2) % 45,
            pop: 5000 + (seed * 1000) % 50000,
            saleToList: baseHeat + (seed % 5) - 2,
            eduPct: 25 + (seed * 3) % 50,
            schoolRating: 40 + (seed * 4) % 55,
            schoolLabel: (seed % 3 === 0) ? 'A' : (seed % 3 === 1 ? 'B' : 'C'),
            safetyScore: 40 + (seed * 5) % 55,
            safetyLabel: (seed % 2 === 0) ? 'Safe' : 'Average',
            taxRate: 1.5 + (seed * 0.1) % 2.5,
            avgTax: 8000 + (seed * 200) % 15000,
            walkScore: 10 + (seed * 7) % 80,
            walkLabel: (seed % 2 === 0) ? 'Car-Dependent' : 'Walkable',
            highway: 30 + (seed * 6) % 65,
          };
        }
      });
    });

    // 2. Enrich all towns with hottestThings, marketHistory, commuteMetros, and taxHistory
    Object.keys(enrichedData).forEach(town => {
      const d = enrichedData[town];
      const seed = town.length;

      if (!d.hottestThings) {
        d.hottestThings = [
          "Local Farmers Market",
          "Historic Downtown Walk",
          "Community Park Events",
          "Seasonal Town Festivals",
          "Highly-rated Local Bistro",
          "New Arts Center",
          "Boutique Shopping District"
        ];
      }

      if (!d.marketHistory) {
        const base = d.saleToList || 100;
        d.marketHistory = {
          '90d': base,
          '6m': base - 1,
          '1y': base - 3,
          '3y': base - 8,
          '5y': base - 12
        };
      }

      // Add Commute Metros
      if (!d.commuteMetros) {
        const baseCommute = d.commute || 45;
        d.commuteMetros = {
          'NYC': baseCommute,
          'PHI': Math.max(20, 120 - baseCommute), // Inverse-ish for demo
          'JC': Math.max(10, baseCommute - 15)
        };
      }

      // Add Tax History
      if (!d.taxHistory) {
        const baseTax = d.taxRate || 2.2;
        d.taxHistory = {
          '1y': baseTax,
          '3y': Math.max(1.0, baseTax - 0.2),
          '5y': Math.max(1.0, baseTax - 0.5)
        };
      }
    });
    
    res.json(enrichedData);
  });

  // ── Ashby Jobs Proxy ──────────────────────────────────────────────────────
  // Fetches job board pages server-side (bypasses browser CORS restrictions).
  // Results are cached in memory for 30 minutes.

  interface JobsCache { jobs: AshbyJob[]; timestamp: number; }
  let jobsCache: JobsCache | null = null;
  const JOBS_CACHE_TTL = 30 * 60 * 1000;

  function stripHtml(html: string): string {
    return html
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&bull;/g, '•')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function extractSalaryFromText(text: string): string | undefined {
    if (!text) return undefined;
    const plain = stripHtml(text);
    // Match patterns like "$180,000 - $225,000", "$150K - $200K", "€58K – €73K"
    const patterns = [
      /[\$€£]\s*[\d,]+[Kk]?\s*[-–—]\s*[\$€£]?\s*[\d,]+[Kk]?\s*(?:USD|EUR|GBP)?/,
      /[\d,]+[Kk]\s*[-–—]\s*[\d,]+[Kk]\s*(?:USD|EUR|GBP)?/i,
      // Two adjacent currency amounts with a small gap (e.g. from stripped HTML spans)
      /[\$€£]\s*([\d,]+)\s+[\$€£]?\s*([\d,]+)\s*(?:USD|EUR|GBP)/,
    ];
    for (const re of patterns) {
      const m = plain.match(re);
      if (m) return m[0].replace(/\s+/g, ' ').trim();
    }
    return undefined;
  }

  function extractAppData(html: string): any {
    const marker = 'window.__appData = ';
    const markerIdx = html.indexOf(marker);
    if (markerIdx === -1) return null;
    let start = html.indexOf('{', markerIdx);
    if (start === -1) return null;
    let depth = 0, inString = false, escape = false;
    for (let i = start; i < html.length; i++) {
      const ch = html[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (!inString) {
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) { try { return JSON.parse(html.slice(start, i + 1)); } catch { return null; } } }
      }
    }
    return null;
  }

  async function fetchHandleJobs(handle: string): Promise<AshbyJob[]> {
    const res = await fetch(`https://jobs.ashbyhq.com/${handle}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-jobverse/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const data = extractAppData(html);
    if (!data) return [];
    const orgName: string = data?.organization?.name ?? handle;
    const logoUrl: string | undefined = data?.organization?.theme?.logoSquareImageUrl || undefined;
    const postings: any[] = data?.jobBoard?.jobPostings ?? [];
    return postings.map((p: any): AshbyJob => ({
      id: p.id,
      title: p.title ?? '',
      company: orgName,
      companyHandle: handle,
      department: p.departmentName ?? '',
      location: p.locationName ?? '',
      isRemote: p.workplaceType === 'Remote' || p.workplaceType === 'Distributed',
      employmentType: p.employmentType ?? '',
      publishedDate: p.publishedDate ?? '',
      source: 'ashby' as const,
      ...(logoUrl ? { logoUrl } : {}),
      ...(p.shouldDisplayCompensationOnJobBoard && p.compensationTierSummary
        ? { salary: p.compensationTierSummary }
        : {}),
      applyUrl: `https://jobs.ashbyhq.com/${handle}/${p.id}`,
    }));
  }

  const GREENHOUSE_DOMAINS: Record<string, string> = {
    airbnb: 'airbnb.com', benchling: 'benchling.com', brex: 'brex.com',
    canva: 'canva.com', carta: 'carta.com', chime: 'chime.com',
    coda: 'coda.io', coinbase: 'coinbase.com', confluent: 'confluent.io',
    coursera: 'coursera.org', databricks: 'databricks.com', descript: 'descript.com',
    discord: 'discord.com', doordash: 'doordash.com', dropbox: 'dropbox.com',
    duolingo: 'duolingo.com', etsy: 'etsy.com', faire: 'faire.com',
    fastly: 'fastly.com', figma: 'figma.com', flexport: 'flexport.com',
    gem: 'gem.com', gofundme: 'gofundme.com', gusto: 'gusto.com',
    headspace: 'headspace.com', heap: 'heap.io', hex: 'hex.tech',
    hopin: 'hopin.com', hubspot: 'hubspot.com', instacart: 'instacart.com',
    ironclad: 'ironcladapp.com', klaviyo: 'klaviyo.com', lob: 'lob.com',
    looker: 'looker.com', lyft: 'lyft.com', masterclass: 'masterclass.com',
    mercury: 'mercury.com', mixpanel: 'mixpanel.com', modernhealth: 'modernhealth.com',
    mongodb: 'mongodb.com', mux: 'mux.com', navan: 'navan.com',
    nerdwallet: 'nerdwallet.com', notion: 'notion.so', okta: 'okta.com',
    opendoor: 'opendoor.com', outreach: 'outreach.io', pagerduty: 'pagerduty.com',
    patreon: 'patreon.com', peloton: 'onepeloton.com', pilot: 'pilot.com',
    pinterest: 'pinterest.com', plaid: 'plaid.com', podium: 'podium.com',
    postman: 'postman.com', productboard: 'productboard.com', quora: 'quora.com',
    ramp: 'ramp.com', reddit: 'reddit.com', retool: 'retool.com',
    robinhood: 'robinhood.com', rubrik: 'rubrik.com', segment: 'segment.com',
    sentry: 'sentry.io', servicetitan: 'servicetitan.com', shopify: 'shopify.com',
    snyk: 'snyk.io', sourcegraph: 'sourcegraph.com', squarespace: 'squarespace.com',
    stripe: 'stripe.com', superhuman: 'superhuman.com', talkdesk: 'talkdesk.com',
    teachable: 'teachable.com', thoughtspot: 'thoughtspot.com', tipalti: 'tipalti.com',
    toast: 'toasttab.com', twilio: 'twilio.com', twitch: 'twitch.tv',
    udemy: 'udemy.com', unqork: 'unqork.com', vimeo: 'vimeo.com',
    wealthsimple: 'wealthsimple.com', webflow: 'webflow.com', whoop: 'whoop.com',
    wiz: 'wiz.io', workato: 'workato.com', wrike: 'wrike.com',
    zendesk: 'zendesk.com',
  };

  async function fetchGreenhouseJobs(handle: string): Promise<AshbyJob[]> {
    const res = await fetch(`https://boards.greenhouse.io/v1/boards/${handle}/jobs`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-jobverse/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    const postings: any[] = data?.jobs ?? [];
    const domain = GREENHOUSE_DOMAINS[handle];
    return postings.map((p: any): AshbyJob => {
      const location: string = p.location?.name ?? '';
      return {
        id: `gh_${p.id}`,
        title: p.title ?? '',
        company: p.company_name ?? handle,
        companyHandle: handle,
        department: '',
        location,
        isRemote: /remote/i.test(location),
        employmentType: 'FullTime',
        publishedDate: p.first_published ? p.first_published.slice(0, 10) : '',
        source: 'greenhouse',
        ...(domain ? { logoUrl: `https://icon.horse/icon/${domain}` } : {}),
        applyUrl: p.absolute_url ?? `https://boards.greenhouse.io/${handle}`,
      };
    });
  }

  async function fetchJobSalary(job: AshbyJob): Promise<string | undefined> {
    try {
      const res = await fetch(job.applyUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-jobverse/1.0)' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return undefined;
      const html = await res.text();
      const data = extractAppData(html);
      if (!data) return undefined;
      const posting = data?.posting ?? {};
      // 1. Structured fields (most reliable)
      const structured = posting.scrapeableCompensationSalarySummary || posting.compensationTierSummary;
      if (structured) return structured;
      // 2. Fall back to parsing salary range from the description text
      return extractSalaryFromText(posting.descriptionPlainText ?? '');
    } catch {
      return undefined;
    }
  }

  app.get('/api/jobs', async (req, res) => {
    if (jobsCache && Date.now() - jobsCache.timestamp < JOBS_CACHE_TTL) {
      res.json(jobsCache.jobs);
      return;
    }
    try {
      // Step 1: fetch Ashby + Greenhouse boards in parallel
      const ashbyPromise = (async () => {
        const jobs: AshbyJob[] = [];
        for (let i = 0; i < ASHBY_COMPANIES.length; i += 30) {
          const batch = ASHBY_COMPANIES.slice(i, i + 30);
          const results = await Promise.allSettled(batch.map(fetchHandleJobs));
          for (const r of results) { if (r.status === 'fulfilled') jobs.push(...r.value); }
        }
        return jobs;
      })();

      const greenhousePromise = (async () => {
        const jobs: AshbyJob[] = [];
        for (let i = 0; i < GREENHOUSE_COMPANIES.length; i += 30) {
          const batch = GREENHOUSE_COMPANIES.slice(i, i + 30);
          const results = await Promise.allSettled(batch.map(fetchGreenhouseJobs));
          for (const r of results) { if (r.status === 'fulfilled') jobs.push(...r.value); }
        }
        return jobs;
      })();

      const [ashbyJobs, greenhouseJobs] = await Promise.all([ashbyPromise, greenhousePromise]);
      const allJobs = [...ashbyJobs, ...greenhouseJobs];

      const filtered = allJobs.filter(job => {
        const t = job.title.toLowerCase();
        const l = (job.location ?? '').toLowerCase();
        return PM_KEYWORDS.some(kw => t.includes(kw)) &&
               (job.isRemote || LOCATION_KEYWORDS.some(kw => l.includes(kw)));
      });
      filtered.sort((a, b) => {
        const da = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const db = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return db - da;
      });

      // Step 2: enrich ALL filtered jobs with salary from detail pages
      async function fetchGreenhouseSalary(job: AshbyJob): Promise<string | undefined> {
        try {
          // Greenhouse individual job API includes description content
          const id = job.id.replace('gh_', '');
          const res = await fetch(
            `https://boards.greenhouse.io/v1/boards/${job.companyHandle}/jobs/${id}`,
            { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-jobverse/1.0)' },
              signal: AbortSignal.timeout(10000) }
          );
          if (!res.ok) return undefined;
          const data: any = await res.json();
          return extractSalaryFromText(data?.content ?? '');
        } catch { return undefined; }
      }

      const salaryResults = await Promise.allSettled(
        filtered.map(j => j.source === 'ashby' ? fetchJobSalary(j) : fetchGreenhouseSalary(j))
      );
      const salaryMap = new Map<string, string>();
      filtered.forEach((job, i) => {
        const salary = salaryResults[i].status === 'fulfilled' ? salaryResults[i].value : undefined;
        if (salary) salaryMap.set(job.id, salary);
      });
      const enriched = filtered.map(job =>
        salaryMap.has(job.id) ? { ...job, salary: salaryMap.get(job.id) } : job
      );

      jobsCache = { jobs: enriched, timestamp: Date.now() };
      res.json(enriched);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // API Route for Hottest Things (specific town)
  app.get("/api/hottest-things/:town", (req, res) => {
    const town = req.params.town;
    const data = NJ_ENRICHED[town];
    if (data && data.hottestThings) {
      res.json({ town, hottestThings: data.hottestThings });
    } else {
      res.status(404).json({ error: "Town not found or no data available" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
