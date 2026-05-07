import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, Heart, ArrowRight, Filter, ChevronDown, Bell, Bookmark, Settings, Home, Building2, User, RefreshCw, Loader2, Calendar } from 'lucide-react';
import { fetchAshbyJobs, AshbyJob } from '../../services/ashbyService';

const SAVED_JOBS_KEY = 'jobverse_saved';

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

function parseSalaryMin(salary: string | undefined): number | null {
  if (!salary) return null;
  const match = salary.match(/([\d,]+)\s*[Kk]/);
  if (match) return parseFloat(match[1].replace(/,/g, '')) * 1000;
  const m2 = salary.match(/([\d,]+)/);
  return m2 ? parseFloat(m2[1].replace(/,/g, '')) : null;
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
  const [jobs, setJobs] = useState<AshbyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => loadSavedJobs());

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
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
    return matchesSearch && matchesDate && matchesSalary;
  });

  const displayedJobs = activeTab === 'saved'
    ? filteredJobs.filter(job => savedJobs.has(job.id))
    : filteredJobs;

  const uniqueCompanies = new Set(jobs.map(j => j.company)).size;
  const withSalary = jobs.filter(j => j.salary).length;

  if (showLanding) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center relative overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {/* Background glow orbs */}
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl w-full">
          {/* Logo mark */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-4xl mb-10 shadow-2xl shadow-indigo-500/40">
            J
          </div>

          {/* Wordmark */}
          <h1 className="text-7xl font-black text-white tracking-tight leading-none mb-4">
            Jobverse
          </h1>

          {/* Tagline */}
          <p className="text-lg text-zinc-500 font-medium mb-14 tracking-wide">
            Top tech. Rising startups. One feed.
          </p>

          {/* Live stats */}
          <div className="flex items-center gap-8 mb-14">
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-black text-white tabular-nums">
                {loading ? '—' : jobs.length}
              </span>
              <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">Open roles</span>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-black text-white tabular-nums">
                {loading ? '—' : uniqueCompanies}
              </span>
              <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">Companies</span>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-black text-white tabular-nums">
                {loading ? '—' : withSalary}
              </span>
              <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">With salary</span>
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
            <p className="mt-8 text-xs text-zinc-700 font-medium tracking-wide">
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
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col fixed h-full inset-y-0 z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0] mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-[#D8B4FE] text-white flex items-center justify-center font-bold text-lg shadow-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              J
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
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900`}>
            <Building2 size={18} />
            Companies
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
          <button className="w-full flex flex-row items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900">
            <div className="flex items-center gap-3">
              <Bell size={18} />
              Alerts
            </div>
            <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-[10px] font-bold">3</span>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                <Briefcase size={14} />
                Job Type
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                <MapPin size={14} />
                Location
                <ChevronDown size={14} className="text-slate-400" />
              </button>

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
                {displayedJobs.map((job, idx) => {
                  const isSaved = savedJobs.has(job.id);
                  const locationLabel = job.isRemote ? 'Remote' : (job.location ?? 'Flexible');
                  return (
                    <div
                      key={job.id}
                      className={`bg-white rounded-2xl p-6 border transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl ${
                        idx === 0
                          ? 'border-indigo-400 shadow-[0_8px_30px_rgb(99,102,241,0.12)]'
                          : 'border-[#E2E8F0] hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                            {job.logoUrl
                              ? <img
                                  src={job.logoUrl}
                                  alt={job.company}
                                  className="w-full h-full object-contain p-1.5"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              : null}
                            <span
                              className="font-bold text-lg text-slate-700 w-full h-full items-center justify-center"
                              style={{ display: job.logoUrl ? 'none' : 'flex' }}
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
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          <Clock size={12} />
                          {job.publishedDate ? timeAgo(job.publishedDate) : 'Recently posted'}
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
      </main>
    </div>
  );
}
