import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, Heart, ArrowRight, Filter, ChevronDown, Bell, Bookmark, Settings, Home, Building2, User, RefreshCw, Loader2, Calendar, Star, X } from 'lucide-react';
import { fetchAshbyJobs, AshbyJob } from '../../services/ashbyService';

const SAVED_JOBS_KEY = 'jobverse_saved';
const DREAM_COMPANIES_KEY = 'jobverse_dream_companies';

function resolveLogoUrl(job: AshbyJob): string | undefined {
  return job.logoUrl;
}

function loadDreamCompanies(): Set<string> {
  try {
    const raw = localStorage.getItem(DREAM_COMPANIES_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function persistDreamCompanies(set: Set<string>): void {
  try {
    localStorage.setItem(DREAM_COMPANIES_KEY, JSON.stringify(Array.from(set)));
  } catch { /* ignore */ }
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
}

function logoInitials(company: string): string {
  return company.slice(0, 2).toUpperCase();
}

function loadSavedJobs(): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_JOBS_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // ignore
  }
  return new Set();
}

function persistSavedJobs(saved: Set<string>): void {
  try {
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(Array.from(saved)));
  } catch {
    // ignore
  }
}

type DateFilter = 'all' | '1d' | '3d' | '7d' | '30d';

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '1d', label: 'Today' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

function cutoffDate(filter: DateFilter): Date | null {
  if (filter === 'all') return null;
  const days = filter === '1d' ? 1 : filter === '3d' ? 3 : filter === '7d' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

type SalaryFilter = 'all' | 'disclosed' | '100k' | '125k' | '150k' | '175k' | '200k';

const SALARY_FILTER_OPTIONS: { value: SalaryFilter; label: string; min: number | null; disclosedOnly: boolean }[] = [
  { value: 'all',      label: 'Any salary',      min: null,   disclosedOnly: false },
  { value: 'disclosed',label: 'Disclosed only',  min: null,   disclosedOnly: true  },
  { value: '100k',     label: '$100K+',           min: 100000, disclosedOnly: true  },
  { value: '125k',     label: '$125K+',           min: 125000, disclosedOnly: true  },
  { value: '150k',     label: '$150K+',           min: 150000, disclosedOnly: true  },
  { value: '175k',     label: '$175K+',           min: 175000, disclosedOnly: true  },
  { value: '200k',     label: '$200K+',           min: 200000, disclosedOnly: true  },
];

type JobTypeFilter = 'all' | 'remote' | 'hybrid' | 'onsite';

const JOB_TYPE_OPTIONS: { value: JobTypeFilter; label: string }[] = [
  { value: 'all',    label: 'All types' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

function matchesJobType(job: AshbyJob, filter: JobTypeFilter): boolean {
  if (filter === 'all') return true;
  const loc = (job.location ?? '').toLowerCase();
  const isHybrid = /hybrid/.test(loc);
  if (filter === 'remote') return job.isRemote && !isHybrid;
  if (filter === 'hybrid') return isHybrid;
  if (filter === 'onsite') return !job.isRemote && !isHybrid;
  return true;
}

type LocationFilter = 'all' | 'remote' | 'nyc' | 'sf' | 'seattle' | 'austin' | 'boston' | 'nj';

const LOCATION_FILTER_OPTIONS: { value: LocationFilter; label: string }[] = [
  { value: 'all',     label: 'All locations' },
  { value: 'remote',  label: 'Remote' },
  { value: 'nyc',     label: 'New York' },
  { value: 'sf',      label: 'San Francisco' },
  { value: 'seattle', label: 'Seattle' },
  { value: 'austin',  label: 'Austin' },
  { value: 'boston',  label: 'Boston' },
  { value: 'nj',      label: 'New Jersey' },
];

function matchesLocation(job: AshbyJob, filter: LocationFilter): boolean {
  if (filter === 'all') return true;
  const loc = (job.location ?? '').toLowerCase();
  if (filter === 'remote') return job.isRemote;
  if (filter === 'nyc') return /new york|, ny\b/.test(loc);
  if (filter === 'sf') return /san francisco|bay area|, ca\b|south bay|menlo park|palo alto|mountain view|sunnyvale|san jose/.test(loc);
  if (filter === 'seattle') return /seattle|, wa\b|bellevue|redmond/.test(loc);
  if (filter === 'austin') return /austin|, tx\b/.test(loc);
  if (filter === 'boston') return /boston|cambridge|, ma\b/.test(loc);
  if (filter === 'nj') return /new jersey|, nj\b/.test(loc);
  return true;
}

type ExperienceFilter = 'all' | 'mid' | 'senior' | 'staff' | 'leadership';

const EXPERIENCE_FILTER_OPTIONS: { value: ExperienceFilter; label: string; description: string }[] = [
  { value: 'all',        label: 'All levels',    description: '' },
  { value: 'mid',        label: 'Product Manager', description: 'PM, Product Lead' },
  { value: 'senior',     label: 'Senior',        description: 'Senior PM, Sr. PM' },
  { value: 'staff',      label: 'Staff / Principal', description: 'Staff, Principal, Group PM' },
  { value: 'leadership', label: 'Leadership',    description: 'Head of, Director, VP, CPO' },
];

function matchesExperience(title: string, filter: ExperienceFilter): boolean {
  if (filter === 'all') return true;
  const t = title.toLowerCase();
  const isLeadership = /\b(head of|director|vp |vice president|chief product|cpo)\b/.test(t);
  const isStaff = /\b(staff|principal|group product|group pm)\b/.test(t);
  const isSenior = /\b(senior|sr\.?)\b/.test(t);
  if (filter === 'leadership') return isLeadership;
  if (filter === 'staff') return !isLeadership && isStaff;
  if (filter === 'senior') return !isLeadership && !isStaff && isSenior;
  if (filter === 'mid') return !isLeadership && !isStaff && !isSenior;
  return true;
}

function parseSalaryMin(salary: string | undefined): number | null {
  if (!salary) return null;
  const match = salary.match(/([\d,]+)\s*[Kk]/);
  if (match) return parseFloat(match[1].replace(/,/g, '')) * 1000;
  const m2 = salary.match(/([\d,]+)/);
  return m2 ? parseFloat(m2[1].replace(/,/g, '')) : null;
}

function DipperJ({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <defs>
        <filter id="djGlow">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="djGlowSm">
          <feGaussianBlur stdDeviation="1.3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="djLine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.25"/>
        </linearGradient>
      </defs>
      {/* dust */}
      <circle cx="8" cy="10" r="0.6" fill="white" opacity="0.18"/>
      <circle cx="48" cy="8" r="0.7" fill="white" opacity="0.12"/>
      <circle cx="50" cy="34" r="0.5" fill="white" opacity="0.12"/>
      {/* J handle — stars descending */}
      <line x1="36" y1="8" x2="34" y2="18" stroke="url(#djLine)" strokeWidth="0.9"/>
      <line x1="34" y1="18" x2="32" y2="28" stroke="url(#djLine)" strokeWidth="0.9"/>
      {/* J curve — bowl curling left */}
      <line x1="32" y1="28" x2="27" y2="36" stroke="#818cf8" strokeWidth="0.9" opacity="0.45"/>
      <line x1="27" y1="36" x2="19" y2="42" stroke="#818cf8" strokeWidth="0.9" opacity="0.4"/>
      <line x1="19" y1="42" x2="13" y2="38" stroke="#818cf8" strokeWidth="0.9" opacity="0.35"/>
      <line x1="13" y1="38" x2="14" y2="29" stroke="#818cf8" strokeWidth="0.9" opacity="0.3"/>
      {/* dipper cross */}
      <line x1="32" y1="28" x2="14" y2="29" stroke="#6366f1" strokeWidth="0.5" opacity="0.18"/>
      {/* anchor star — brightest */}
      <circle cx="36" cy="8" r="4.5" fill="white" filter="url(#djGlow)"/>
      <circle cx="36" cy="8" r="2" fill="white"/>
      {/* handle stars */}
      <circle cx="34" cy="18" r="2.2" fill="#e0d9ff" filter="url(#djGlowSm)"/>
      <circle cx="32" cy="28" r="2.5" fill="#c4b5fd" filter="url(#djGlowSm)"/>
      {/* bowl stars */}
      <circle cx="27" cy="36" r="2" fill="#a78bfa"/>
      <circle cx="19" cy="42" r="2.5" fill="#c4b5fd" filter="url(#djGlowSm)"/>
      <circle cx="13" cy="38" r="2" fill="#a78bfa"/>
      <circle cx="14" cy="29" r="1.8" fill="#818cf8" opacity="0.9"/>
    </svg>
  );
}

export default function JobverseApp() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const [salaryFilter, setSalaryFilter] = useState<SalaryFilter>('all');
  const [salaryDropdownOpen, setSalaryDropdownOpen] = useState(false);
  const salaryDropdownRef = useRef<HTMLDivElement>(null);
  const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>('all');
  const [experienceDropdownOpen, setExperienceDropdownOpen] = useState(false);
  const experienceDropdownRef = useRef<HTMLDivElement>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<JobTypeFilter>('all');
  const [jobTypeDropdownOpen, setJobTypeDropdownOpen] = useState(false);
  const jobTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [jobs, setJobs] = useState<AshbyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => loadSavedJobs());
  const [dreamCompanies, setDreamCompanies] = useState<Set<string>>(() => loadDreamCompanies());
  const [dreamSearch, setDreamSearch] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchAshbyJobs();
      setJobs(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setDateDropdownOpen(false);
      }
      if (salaryDropdownRef.current && !salaryDropdownRef.current.contains(e.target as Node)) {
        setSalaryDropdownOpen(false);
      }
      if (experienceDropdownRef.current && !experienceDropdownRef.current.contains(e.target as Node)) {
        setExperienceDropdownOpen(false);
      }
      if (jobTypeDropdownRef.current && !jobTypeDropdownRef.current.contains(e.target as Node)) {
        setJobTypeDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleDream = (company: string) => {
    setDreamCompanies(prev => {
      const next = new Set<string>(prev);
      if (next.has(company)) next.delete(company); else next.add(company);
      persistDreamCompanies(next);
      return next;
    });
  };

  const toggleSave = (jobId: string) => {
    setSavedJobs(prev => {
      const next = new Set<string>(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      persistSavedJobs(next);
      return next;
    });
  };

  const cutoff = cutoffDate(dateFilter);
  const salaryOption = SALARY_FILTER_OPTIONS.find(o => o.value === salaryFilter)!;

  const filteredJobs = jobs.filter(job => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      (job.department ?? '').toLowerCase().includes(q)
    );
    const matchesDate = !cutoff || !job.publishedDate || new Date(job.publishedDate) >= cutoff;
    const matchesSalary = (() => {
      if (salaryOption.disclosedOnly && !job.salary) return false;
      if (salaryOption.min !== null) {
        const min = parseSalaryMin(job.salary);
        if (min === null || min < salaryOption.min) return false;
      }
      return true;
    })();
    const matchesExperienceLevel = matchesExperience(job.title, experienceFilter);
    const matchesType = matchesJobType(job, jobTypeFilter);
    const matchesLoc = matchesLocation(job, locationFilter);
    return matchesSearch && matchesDate && matchesSalary && matchesExperienceLevel && matchesType && matchesLoc;
  });

  const displayedJobs = (() => {
    const base = activeTab === 'saved'
      ? filteredJobs.filter(job => savedJobs.has(job.id))
      : filteredJobs;
    if (dreamCompanies.size === 0) return base;
    return [...base].sort((a, b) => {
      const aDream = dreamCompanies.has(a.company) ? 1 : 0;
      const bDream = dreamCompanies.has(b.company) ? 1 : 0;
      return bDream - aDream;
    });
  })();

  const uniqueCompanies = new Set(jobs.map(j => j.company)).size;
  const withSalary = jobs.filter(j => j.salary).length;

  if (showLanding) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center relative overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {/* Background glow orbs */}
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl w-full">

          {/* Logo mark — Dipper J */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-950 to-violet-950 border border-white/10 flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/20">
            <DipperJ size={44} />
          </div>

          {/* Wordmark */}
          <h1 className="text-7xl font-black text-white tracking-tight leading-none mb-4">
            Jobverse
          </h1>

          {/* Tagline */}
          <p className="text-lg text-zinc-400 font-medium mb-14 tracking-wide">
            Top tech. Rising startups. One feed.
          </p>

          {/* Live stats */}
          <div className="flex items-center gap-8 mb-14">
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-black text-white tabular-nums">
                {loading ? '—' : jobs.length}
              </span>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Open roles</span>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-black text-white tabular-nums">
                {loading ? '—' : uniqueCompanies}
              </span>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Companies</span>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-black text-white tabular-nums">
                {loading ? '—' : withSalary}
              </span>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">With salary</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => setShowLanding(false)}
            disabled={loading}
            className="group flex items-center gap-3 bg-white text-zinc-900 px-10 py-4 rounded-full text-base font-bold hover:bg-indigo-50 transition-all shadow-2xl shadow-black/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-zinc-400" />
                Loading roles...
              </>
            ) : (
              <>
                Find your next role
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Footer note */}
          {!loading && !error && (
            <p className="mt-8 text-xs text-zinc-500 font-medium tracking-wide">
              Updated daily &nbsp;·&nbsp; Ashby & Greenhouse &nbsp;·&nbsp; Remote, NYC & NJ
            </p>
          )}
          {error && (
            <p className="mt-8 text-xs text-red-500 font-medium">
              Could not load jobs.{' '}
              <button onClick={loadJobs} className="underline hover:text-red-400">Retry</button>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col fixed h-full inset-y-0 z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0] mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-950 to-violet-950 border border-white/10 flex items-center justify-center shadow-sm">
              <DipperJ size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Jobverse</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveTab('board')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'board' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Home size={18} />
            Job Board
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'companies' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Building2 size={18} />
            Companies
          </button>

          <button
            onClick={() => setActiveTab('dream')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'dream' ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Star size={18} />
            Dream Role
            {dreamCompanies.size > 0 && (
              <span className="ml-auto bg-violet-100 text-violet-700 py-0.5 px-2 rounded-full text-[10px] font-bold">
                {dreamCompanies.size}
              </span>
            )}
          </button>

          <div className="pt-6 pb-2 px-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Workspace</p>
          </div>
          <button
            onClick={() => setActiveTab('saved')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'saved' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <div className="flex items-center gap-3">
              <Bookmark size={18} />
              Saved Jobs
            </div>
            {savedJobs.size > 0 && (
              <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-[10px] font-bold">
                {savedJobs.size}
              </span>
            )}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900">
            <Briefcase size={18} />
            Applications
          </button>
        </nav>

        <div className="p-4 border-t border-[#E2E8F0]">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <User size={18} />
            Profile
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by title, company, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-6">
            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              TS
            </div>
          </div>
        </header>

        {/* Companies Page */}
        {activeTab === 'companies' && (() => {
          const companyMap = new Map<string, { job: AshbyJob; count: number }>();
          jobs.forEach(j => {
            const existing = companyMap.get(j.company);
            if (existing) { existing.count++; }
            else { companyMap.set(j.company, { job: j, count: 1 }); }
          });
          const companies = Array.from(companyMap.values()).sort((a, b) => {
            const aDream = dreamCompanies.has(a.job.company) ? 1 : 0;
            const bDream = dreamCompanies.has(b.job.company) ? 1 : 0;
            if (bDream !== aDream) return bDream - aDream;
            return b.count - a.count;
          });
          return (
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Companies</h1>
                  <p className="text-slate-500 text-sm">{companies.length} companies hiring PMs right now. Star any to add them to your Dream Role list.</p>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <Loader2 size={32} className="text-indigo-400 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {companies.map(({ job, count }) => {
                      const isDream = dreamCompanies.has(job.company);
                      return (
                        <div
                          key={job.company}
                          className={`flex items-center gap-4 p-4 rounded-xl border bg-white transition-all ${
                            isDream ? 'border-violet-300 shadow-[0_2px_12px_rgb(139,92,246,0.12)]' : 'border-[#E2E8F0] hover:border-slate-300'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {(() => { const src = resolveLogoUrl(job); return src ? <img src={src} alt={job.company} className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex'); }} /> : null; })()}
                            <span className="text-xs font-bold text-slate-600 w-full h-full items-center justify-center" style={{ display: resolveLogoUrl(job) ? 'none' : 'flex' }}>
                              {logoInitials(job.company)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{job.company}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              {count} open role{count !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => { setSearchQuery(job.company); setActiveTab('board'); }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1 rounded-full transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => toggleDream(job.company)}
                              className={`p-1.5 rounded-full transition-colors ${isDream ? 'text-violet-500 bg-violet-50' : 'text-slate-300 hover:text-violet-400 hover:bg-violet-50'}`}
                            >
                              <Star size={15} fill={isDream ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Dream Role Page */}
        {activeTab === 'dream' && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Dream Role</h1>
                <p className="text-slate-500 text-sm">Select companies you'd love to work at. Their jobs will be pinned to the top of your feed with a purple highlight.</p>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={dreamSearch}
                  onChange={e => setDreamSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-full text-sm focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all outline-none"
                />
                {dreamSearch && (
                  <button onClick={() => setDreamSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Selected count */}
              {dreamCompanies.size > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                    {dreamCompanies.size} dream compan{dreamCompanies.size === 1 ? 'y' : 'ies'} selected
                  </span>
                  <button onClick={() => { setDreamCompanies(new Set()); persistDreamCompanies(new Set()); }} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                    Clear all
                  </button>
                </div>
              )}

              {/* Company grid */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 size={32} className="text-violet-400 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from(new Map<string, AshbyJob>(jobs.map(j => [j.company, j])).values())
                    .sort((a, b) => a.company.localeCompare(b.company))
                    .filter(j => !dreamSearch || j.company.toLowerCase().includes(dreamSearch.toLowerCase()))
                    .map(job => {
                      const selected = dreamCompanies.has(job.company);
                      return (
                        <button
                          key={job.company}
                          onClick={() => toggleDream(job.company)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
                            selected
                              ? 'border-violet-400 bg-violet-50 shadow-[0_2px_12px_rgb(139,92,246,0.15)]'
                              : 'border-[#E2E8F0] bg-white hover:border-violet-200 hover:bg-violet-50/30'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {(() => { const src = resolveLogoUrl(job); return src ? <img src={src} alt={job.company} className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex'); }} /> : null; })()}
                            <span className="text-xs font-bold text-slate-600 w-full h-full items-center justify-center" style={{ display: resolveLogoUrl(job) ? 'none' : 'flex' }}>
                              {logoInitials(job.company)}
                            </span>
                          </div>
                          <span className={`text-xs font-semibold truncate flex-1 ${selected ? 'text-violet-800' : 'text-slate-700'}`}>
                            {job.company}
                          </span>
                          {selected && <Star size={12} className="text-violet-500 shrink-0" fill="currentColor" />}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        {activeTab !== 'dream' && activeTab !== 'companies' && (
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              {/* Job Type dropdown */}
              <div className="relative" ref={jobTypeDropdownRef}>
                <button
                  onClick={() => setJobTypeDropdownOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm border ${
                    jobTypeFilter !== 'all'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Briefcase size={14} />
                  {JOB_TYPE_OPTIONS.find(o => o.value === jobTypeFilter)?.label ?? 'Job Type'}
                  <ChevronDown size={14} className={`transition-transform ${jobTypeDropdownOpen ? 'rotate-180' : ''} ${jobTypeFilter !== 'all' ? 'text-indigo-400' : 'text-slate-400'}`} />
                </button>
                {jobTypeDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 z-30 w-40 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 overflow-hidden">
                    {JOB_TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setJobTypeFilter(opt.value); setJobTypeDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          jobTypeFilter === opt.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location dropdown */}
              <div className="relative" ref={locationDropdownRef}>
                <button
                  onClick={() => setLocationDropdownOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm border ${
                    locationFilter !== 'all'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <MapPin size={14} />
                  {LOCATION_FILTER_OPTIONS.find(o => o.value === locationFilter)?.label ?? 'Location'}
                  <ChevronDown size={14} className={`transition-transform ${locationDropdownOpen ? 'rotate-180' : ''} ${locationFilter !== 'all' ? 'text-indigo-400' : 'text-slate-400'}`} />
                </button>
                {locationDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 z-30 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 overflow-hidden">
                    {LOCATION_FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setLocationFilter(opt.value); setLocationDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          locationFilter === opt.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Posted dropdown */}
              <div className="relative" ref={dateDropdownRef}>
                <button
                  onClick={() => setDateDropdownOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm border ${
                    dateFilter !== 'all'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Calendar size={14} />
                  {DATE_FILTER_OPTIONS.find(o => o.value === dateFilter)?.label ?? 'Date Posted'}
                  <ChevronDown size={14} className={`transition-transform ${dateDropdownOpen ? 'rotate-180' : ''} ${dateFilter !== 'all' ? 'text-indigo-400' : 'text-slate-400'}`} />
                </button>
                {dateDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 z-30 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 overflow-hidden">
                    {DATE_FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setDateFilter(opt.value); setDateDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          dateFilter === opt.value
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience filter dropdown */}
              <div className="relative" ref={experienceDropdownRef}>
                <button
                  onClick={() => setExperienceDropdownOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm border ${
                    experienceFilter !== 'all'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Briefcase size={14} />
                  {EXPERIENCE_FILTER_OPTIONS.find(o => o.value === experienceFilter)?.label ?? 'Level'}
                  <ChevronDown size={14} className={`transition-transform ${experienceDropdownOpen ? 'rotate-180' : ''} ${experienceFilter !== 'all' ? 'text-indigo-400' : 'text-slate-400'}`} />
                </button>
                {experienceDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 z-30 w-52 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 overflow-hidden">
                    {EXPERIENCE_FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setExperienceFilter(opt.value); setExperienceDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 transition-colors ${
                          experienceFilter === opt.value
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm font-semibold block">{opt.label}</span>
                        {opt.description && <span className="text-xs text-slate-400">{opt.description}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Salary filter dropdown */}
              <div className="relative" ref={salaryDropdownRef}>
                <button
                  onClick={() => setSalaryDropdownOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm border ${
                    salaryFilter !== 'all'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <DollarSign size={14} />
                  {SALARY_FILTER_OPTIONS.find(o => o.value === salaryFilter)?.label ?? 'Salary'}
                  <ChevronDown size={14} className={`transition-transform ${salaryDropdownOpen ? 'rotate-180' : ''} ${salaryFilter !== 'all' ? 'text-indigo-400' : 'text-slate-400'}`} />
                </button>
                {salaryDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 z-30 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 overflow-hidden">
                    {SALARY_FILTER_OPTIONS.map((opt, i) => (
                      <React.Fragment key={opt.value}>
                        {i === 2 && <div className="my-1 border-t border-slate-100" />}
                        <button
                          onClick={() => { setSalaryFilter(opt.value); setSalaryDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                            salaryFilter === opt.value
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">
                <Filter size={14} />
                All Filters
              </button>
            </div>

            <div className="flex items-end justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Recommended for you</h1>
                {loading ? (
                  <p className="text-slate-500 text-sm">Loading jobs...</p>
                ) : error ? (
                  <p className="text-slate-500 text-sm">Could not load jobs</p>
                ) : (
                  <p className="text-slate-500 text-sm">
                    {jobs.length} role{jobs.length === 1 ? '' : 's'} across {uniqueCompanies} compan{uniqueCompanies === 1 ? 'y' : 'ies'}
                  </p>
                )}
              </div>
              {!loading && !error && (
                <div className="flex items-center gap-3">
                  {jobTypeFilter !== 'all' && (
                    <button onClick={() => setJobTypeFilter('all')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors">
                      Clear type ×
                    </button>
                  )}
                  {locationFilter !== 'all' && (
                    <button onClick={() => setLocationFilter('all')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors">
                      Clear location ×
                    </button>
                  )}
                  {dateFilter !== 'all' && (
                    <button
                      onClick={() => setDateFilter('all')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
                    >
                      Clear date ×
                    </button>
                  )}
                  {salaryFilter !== 'all' && (
                    <button
                      onClick={() => setSalaryFilter('all')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
                    >
                      Clear salary ×
                    </button>
                  )}
                  {experienceFilter !== 'all' && (
                    <button
                      onClick={() => setExperienceFilter('all')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
                    >
                      Clear level ×
                    </button>
                  )}
                  <p className="text-sm font-medium text-slate-400">Showing {displayedJobs.length} job{displayedJobs.length === 1 ? '' : 's'}</p>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 size={36} className="text-indigo-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">Scanning companies...</p>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <p className="text-slate-500 text-sm font-medium">Failed to load jobs. Please try again.</p>
                <button
                  onClick={loadJobs}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && displayedJobs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <p className="text-slate-500 text-sm font-medium">
                  {activeTab === 'saved'
                    ? 'No saved jobs yet. Heart a job to save it.'
                    : 'No jobs match your search. Try a different keyword.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-indigo-600 text-sm font-semibold hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Job Grid */}
            {!loading && !error && displayedJobs.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedJobs.map((job) => {
                  const isSaved = savedJobs.has(job.id);
                  const isDream = dreamCompanies.has(job.company);
                  const locationLabel = job.isRemote ? 'Remote' : (job.location ?? 'Flexible');
                  return (
                    <div
                      key={job.id}
                      className={`bg-white rounded-2xl p-6 border transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl ${
                        isDream
                          ? 'border-violet-400 shadow-[0_8px_30px_rgb(139,92,246,0.15)]'
                          : 'border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                            {(() => { const src = resolveLogoUrl(job); return src ? <img src={src} alt={job.company} className="w-full h-full object-contain p-1.5" onError={(e) => { const t = e.currentTarget; t.style.display = 'none'; const f = t.nextElementSibling as HTMLElement | null; if (f) f.style.display = 'flex'; }} /> : null; })()}
                            <span
                              className="font-bold text-lg text-slate-700 w-full h-full items-center justify-center"
                              style={{ display: resolveLogoUrl(job) ? 'none' : 'flex' }}
                            >
                              {logoInitials(job.company)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">{job.company}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSave(job.id)}
                          className={`p-2 rounded-full transition-colors ${isSaved ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                          aria-label={isSaved ? 'Unsave job' : 'Save job'}
                        >
                          <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <div className="flex flex-col gap-2.5 mb-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <MapPin size={14} className="text-slate-400" />
                          <span>{locationLabel}</span>
                          {job.isRemote && (
                            <span className="ml-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                              Remote
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <Briefcase size={14} className="text-slate-400" />
                          {job.employmentType ?? 'Full-time'}
                          {job.department ? ` • ${job.department}` : ''}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <DollarSign size={14} className="text-slate-400" />
                          {job.salary
                            ? <span className="text-emerald-700">{job.salary}</span>
                            : <span className="text-slate-400">Not disclosed</span>
                          }
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {job.publishedDate ? timeAgo(job.publishedDate) : 'Recently posted'}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="capitalize">{job.source}</span>
                        </div>
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                        >
                          Apply
                          <ArrowRight size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
