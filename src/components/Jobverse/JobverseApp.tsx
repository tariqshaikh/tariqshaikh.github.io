import React, { useState } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, Heart, ArrowRight, Filter, ChevronDown, Bell, Bookmark, Settings, Home, Building2, User } from 'lucide-react';

const MOCK_JOBS = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    company: 'Vultron',
    location: 'Remote (US)',
    type: 'Full-time',
    seniority: 'Senior',
    salary: '$150k - $200k',
    posted: '2 hours ago',
    logo: 'V',
    tags: ['React', 'TypeScript', 'Next.js'],
  },
  {
    id: 2,
    title: 'Product Manager, AI',
    company: 'DatologyAI',
    location: 'New York, NY',
    type: 'Full-time',
    seniority: 'Mid-Level',
    salary: '$160k - $210k',
    posted: '5 hours ago',
    logo: 'D',
    tags: ['AI/ML', 'Strategy', 'B2B'],
  },
  {
    id: 3,
    title: 'Machine Learning Architect',
    company: 'Cohere',
    location: 'San Francisco, CA',
    type: 'Full-time',
    seniority: 'Staff',
    salary: '$220k - $300k',
    posted: '1 day ago',
    logo: 'C',
    tags: ['NLP', 'PyTorch', 'LLMs'],
  },
  {
    id: 4,
    title: 'Founding Product Designer',
    company: 'Distyl',
    location: 'Remote',
    type: 'Full-time',
    seniority: 'Lead',
    salary: '$140k - $190k',
    posted: '1 day ago',
    logo: 'Ds',
    tags: ['UI/UX', 'Figma', 'Prototyping'],
  },
  {
    id: 5,
    title: 'Backend Engineer',
    company: 'Supabase',
    location: 'Remote (Global)',
    type: 'Full-time',
    seniority: 'Mid-Level',
    salary: '$130k - $180k',
    posted: '2 days ago',
    logo: 'S',
    tags: ['PostgreSQL', 'Go', 'TypeScript'],
  },
  {
    id: 6,
    title: 'Data Engineer',
    company: 'Dashworks',
    location: 'San Francisco, CA',
    type: 'Full-time',
    seniority: 'Senior',
    salary: '$160k - $200k',
    posted: '3 days ago',
    logo: 'Dw',
    tags: ['Data Pipelines', 'Python', 'SQL'],
  }
];

export default function JobverseApp() {
  const [activeTab, setActiveTab] = useState('board');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col fixed h-full inset-y-0 z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0] mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-[#D8B4FE] text-white flex items-center justify-center font-bold font-serif italic text-lg shadow-sm">
              J
            </div>
            <span className="font-serif font-black italic text-xl tracking-tight text-slate-900">Jobverse</span>
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
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900">
            <Bookmark size={18} />
            Saved Jobs
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
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                Level
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                <DollarSign size={14} />
                Salary
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">
                <Filter size={14} />
                All Filters
              </button>
            </div>

            <div className="flex items-end justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Recommended for you</h1>
                <p className="text-slate-500 text-sm">Based on your activity and saved alerts</p>
              </div>
              <p className="text-sm font-medium text-slate-400">Showing {MOCK_JOBS.length} jobs</p>
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {MOCK_JOBS.map((job, idx) => (
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
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-700 border border-slate-200 shadow-sm shrink-0">
                        {job.logo}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">{job.company}</p>
                      </div>
                    </div>
                    <button className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                      <Heart size={18} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <MapPin size={14} className="text-slate-400" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Briefcase size={14} className="text-slate-400" />
                      {job.type} • {job.seniority}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <DollarSign size={14} className="text-slate-400" />
                      {job.salary}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {job.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Clock size={12} />
                      {job.posted}
                    </div>
                    <button className="bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
                      Apply
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
