/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Info, ChevronRight, GripVertical, Zap } from 'lucide-react';
import { NJ_COUNTIES, NJ_ENRICHED, DIMS, COLORS } from '../constants';
import { fetchLiveTownData } from '../services/geminiService';
import { NJ_COUNTY_PATHS, NJ_STATE_OUTLINE, COUNTY_CENTERS } from '../mapData';
import { motion, AnimatePresence, Reorder } from 'motion/react';

// Regional Data
const REGIONS = [
  {
    id: 'north',
    name: 'North Jersey',
    sub: 'NYC Hubs & Skylines',
    counties: ['Bergen', 'Essex', 'Hudson', 'Morris', 'Passaic', 'Sussex', 'Union', 'Warren'],
    color: '#0471A4',
    bg: 'bg-blue-50'
  },
  {
    id: 'central',
    name: 'Central Jersey',
    sub: 'Suburban Bliss & Tech',
    counties: ['Hunterdon', 'Mercer', 'Middlesex', 'Monmouth', 'Somerset', 'Ocean'],
    color: '#035480',
    bg: 'bg-slate-50'
  },
  {
    id: 'south',
    name: 'South Jersey',
    sub: 'Philly Metro & Shore',
    counties: ['Atlantic', 'Burlington', 'Camden', 'Cape May', 'Cumberland', 'Gloucester', 'Salem'],
    color: '#5BA8CC',
    bg: 'bg-indigo-50'
  }
];

// Helper functions
const scoreIncome = (v: number | null) => { if (!v) return 50; return Math.min(100, Math.round((v / 180000) * 100)); };
const scoreHome = (v: number | null) => { if (!v) return 50; return Math.max(0, 100 - Math.round((v / 2000000) * 100)); };
const scoreCommute = (v: any) => { if (!v || v === 'N/A') return 50; return Math.max(0, 100 - Math.round((Number(v) / 90) * 100)); };
const scoreHighway = (v: number | null) => { if (!v) return 50; return v; };
const scoreSchool = (v: number | null) => { if (!v) return 50; return v; };
const scoreSafety = (v: number | null) => { if (!v) return 50; return v; };
const scoreTax = (rate: any) => { if (!rate || rate === 'N/A') return 50; return Math.max(0, 100 - Math.round(Number(rate) * 20)); };
const scoreWalk = (v: number | null) => { if (!v) return 50; return v; };
const scoreEdu = (v: number | null) => { if (!v) return 50; return v; };
const scoreMarket = (v: number | null) => { if (v == null) return 50; return Math.min(100, Math.max(0, (v - 96) * 12)); };
const scoreLocalScene = (v: number | null) => { if (!v) return 50; return v; };

const rankToWeight = (r: number, total: number) => {
  const weights = [2.5, 2.0, 1.5, 1.2, 1.0, 0.8, 0.6, 0.4];
  return weights[r] || 0.5;
};

const barColor = (v: number) => v >= 70 ? '#1E5C38' : v >= 45 ? '#7A5200' : '#A83220';
const tagClass = (v: number) => v >= 70 ? 'bg-[#D4EDDE] text-[#1E5C38]' : v >= 45 ? 'bg-[#FDEFC6] text-[#7A5200]' : 'bg-[#FAD9D3] text-[#A83220]';
const tagLabel = (v: number, hi: string, lo: string) => v >= 70 ? hi : v >= 45 ? 'Average' : lo;
const fmtNum = (n: number | null) => { if (!n || n < 0) return 'N/A'; if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'; if (n >= 1000) return (n / 1000).toFixed(0) + 'K'; return String(n); };
const fmtDollar = (n: number | null) => (n && n > 0) ? '$' + fmtNum(n) : 'N/A';

export default function Homebase() {
  const [selectedTowns, setSelectedTowns] = useState<{name: string, county: string}[]>([]);
  const [activeCounties, setActiveCounties] = useState<string[]>([]);
  const [countySearch, setCountySearch] = useState('');
  const [townSearch, setTownSearch] = useState('');
  const [ghostText, setGhostText] = useState('');
  const [priorityOrder, setPriorityOrder] = useState(['schools', 'safety', 'walk', 'home', 'highway', 'income', 'edu', 'market', 'commute', 'taxes', 'localScene']);
  const [sortKey, setSortKey] = useState('fit');
  const [showResults, setShowResults] = useState(false);
  const [showPrioritySettings, setShowPrioritySettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tooltip, setTooltip] = useState<{ name: string, x: number, y: number } | null>(null);
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const [showTownDropdown, setShowTownDropdown] = useState(false);
  const [expandedTown, setExpandedTown] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [marketPeriods, setMarketPeriods] = useState<Record<string, string>>({});
  const [commuteMetros, setCommuteMetros] = useState<Record<string, string>>({});
  const [taxPeriods, setTaxPeriods] = useState<Record<string, string>>({});
  const [apiTownData, setApiTownData] = useState<Record<string, any>>({});
  const [liveTownData, setLiveTownData] = useState<Record<string, any>>({});
  const [liveLoading, setLiveLoading] = useState<Record<string, boolean>>({});
  const [isLiveMode, setIsLiveMode] = useState(true);

  const resultsRef = useRef<HTMLDivElement>(null);
  const countyDropdownRef = useRef<HTMLDivElement>(null);
  const townDropdownRef = useRef<HTMLDivElement>(null);
  const townInputRef = useRef<HTMLInputElement>(null);

  const allTowns = React.useMemo(() => 

    Object.entries(NJ_COUNTIES).flatMap(([county, data]) => 
      data.towns.map(town => ({ name: town, county }))
    ), []
  );

  useEffect(() => {
    const fetchTownData = async () => {
      try {
        const res = await fetch('/api/towns');
        const data = await res.json();
        setApiTownData(data);
      } catch (err) {
        console.error('Failed to fetch town data:', err);
      }
    };
    fetchTownData();
  }, []);

  const handleCountySelect = (c: string) => {
    if (!activeCounties.includes(c)) {
      setActiveCounties([...activeCounties, c]);
    }
    setCountySearch('');
    setShowCountyDropdown(false);
    // Focus town search after a short delay
    setTimeout(() => townInputRef.current?.focus(), 100);
  };

  const handleTownSelect = (t: {name: string, county: string}) => {
    if (selectedTowns.length < 8) {
      setSelectedTowns([...selectedTowns, t]);
      if (!activeCounties.includes(t.county)) {
        setActiveCounties([...activeCounties, t.county]);
      }
      setCountySearch('');
      setShowCountyDropdown(false);
      // Focus town search after a short delay to allow adding more from the same county
      setTimeout(() => townInputRef.current?.focus(), 100);

      // Always fetch live data for the new town
      fetchTownLive(t.name, t.county);
    }
  };

  const fetchTownLive = async (name: string, county: string) => {
    setLiveLoading(prev => ({ ...prev, [name]: true }));
    const data = await fetchLiveTownData(name, county);
    if (data) {
      setLiveTownData(prev => ({ ...prev, [name]: data }));
    }
    setLiveLoading(prev => ({ ...prev, [name]: false }));
  };

  useEffect(() => {
    document.title = "Homebase NJ";
  }, []);

  useEffect(() => {
    if (countySearch.length < 2) {
      setGhostText('');
      return;
    }
    const match = allTowns.find(t => t.name.toLowerCase().startsWith(countySearch.toLowerCase()));
    if (match) {
      setGhostText(match.name);
    } else {
      const cMatch = Object.keys(NJ_COUNTIES).find(c => c.toLowerCase().startsWith(countySearch.toLowerCase()));
      setGhostText(cMatch ? cMatch + ' County' : '');
    }
  }, [countySearch, allTowns]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countyDropdownRef.current && !countyDropdownRef.current.contains(event.target as Node)) {
        setShowCountyDropdown(false);
      }
      if (townDropdownRef.current && !townDropdownRef.current.contains(event.target as Node)) {
        setShowTownDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calcFitScore = (d: any) => {
    let sum = 0, total = 0;
    for (let i = 0; i < priorityOrder.length; i++) {
      const dimKey = priorityOrder[i];
      const dim = DIMS.find(d => d.key === dimKey);
      if (!dim) continue;
      const score = d[dim.scoreKey];
      if (score == null) continue;
      const w = rankToWeight(i, priorityOrder.length);
      sum += score * w;
      total += w;
    }
    return total > 0 ? Math.round(sum / total) : 0;
  };

  const runComparison = () => {
    setIsLoading(true);
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const handleClearAll = () => {
    setSelectedTowns([]);
    setActiveCounties([]);
    setCountySearch('');
    setTownSearch('');
    setShowResults(false);
    setGhostText('');
    setLiveTownData({});
    setLiveLoading({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDragStart = (e: React.DragEvent, dim: string) => {
    e.dataTransfer.setData('text/plain', dim);
  };

  const handleDrop = (e: React.DragEvent, targetDim: string) => {
    e.preventDefault();
    const sourceDim = e.dataTransfer.getData('text/plain');
    if (sourceDim === targetDim) return;

    const newOrder = [...priorityOrder];
    const sourceIdx = newOrder.indexOf(sourceDim);
    const targetIdx = newOrder.indexOf(targetDim);
    newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, sourceDim);
    setPriorityOrder(newOrder);
  };

  const townData = selectedTowns.map((townObj, i) => {
    const { name, county } = townObj;
    const d = liveTownData[name] || apiTownData[name] || NJ_ENRICHED[name];
    const isLive = !!liveTownData[name];
    const isLoadingLive = !!liveLoading[name];

    if (d) {
      const currentHeat = d.saleToList;
      const derivedLocalScene = d.localScene || Math.min(100, Math.round(((d.walkScore || 50) * 0.6) + ((d.pop || 10000) / 1000)));
      return {
        name, county: county + ' County', color: COLORS[i % COLORS.length], hasFullData: true,
        isLive, isLoadingLive,
        income: d.income, homeVal: d.homeVal, commute: d.commute, pop: d.pop,
        saleToList: currentHeat, eduPct: d.eduPct,
        schoolRating: d.schoolRating, schoolLabel: d.schoolLabel,
        safetyRaw: d.safetyScore, safetyLabel: d.safetyLabel,
        highwayRaw: d.highway || 50,
        localSceneRaw: derivedLocalScene,
        taxRate: d.taxRate, avgTax: d.avgTax,
        walkRaw: d.walkScore, walkLabel: d.walkLabel,
        incomeScore: scoreIncome(d.income), homeScore: scoreHome(d.homeVal),
        commuteScore: scoreCommute(d.commute), 
        highwayScore: scoreHighway(d.highway || 50),
        schoolScore: scoreSchool(d.schoolRating),
        safetyScore: scoreSafety(d.safetyScore), taxScore: scoreTax(d.taxRate),
        walkScore2: scoreWalk(d.walkScore), marketScore: scoreMarket(currentHeat),
        eduScore: scoreEdu(d.eduPct), localSceneScore: scoreLocalScene(derivedLocalScene),
        hottestThings: d.hottestThings || [],
        marketHistory: d.marketHistory || null,
        commuteMetros: d.commuteMetros || null,
        taxHistory: d.taxHistory || null
      };
    }
    return {
      name, county: county + ' County', color: COLORS[i % COLORS.length], hasFullData: false,
      income: null, homeVal: null, commute: null, pop: null, saleToList: null, eduPct: null,
      schoolRating: null, schoolLabel: null, safetyRaw: null, safetyLabel: null,
      taxRate: null, avgTax: null, walkRaw: null, walkLabel: null, localSceneRaw: null,
      incomeScore: 50, homeScore: 50, commuteScore: 50, schoolScore: 50,
      safetyScore: 50, taxScore: 50, walkScore2: 50, marketScore: 50,
      highwayScore: 50, eduScore: 50, localSceneScore: 50,
      hottestThings: [],
      marketHistory: null,
      commuteMetros: null,
      taxHistory: null,
      isLive: false,
      isLoadingLive: false
    };
  });

  const sortedTowns = [...townData].sort((a, b) => {
    if (sortKey === 'fit') return calcFitScore(b) - calcFitScore(a);
    if (sortKey === 'income') return (b.income || 0) - (a.income || 0);
    if (sortKey === 'home') return (a.homeVal || 999999) - (b.homeVal || 999999);
    if (sortKey === 'commute') return (a.commute || 99) - (b.commute || 99);
    if (sortKey === 'schools') return (b.schoolRating || 0) - (a.schoolRating || 0);
    if (sortKey === 'edu') return (b.eduPct || 0) - (a.eduPct || 0);
    if (sortKey === 'safety') return (b.safetyRaw || 0) - (a.safetyRaw || 0);
    if (sortKey === 'walk') return (b.walkRaw || 0) - (a.walkRaw || 0);
    if (sortKey === 'highway') return (b.highwayRaw || 0) - (a.highwayRaw || 0);
    if (sortKey === 'market') return (b.saleToList || 0) - (a.saleToList || 0);
    if (sortKey === 'taxes') return (a.taxRate || 99) - (b.taxRate || 99);
    if (sortKey === 'localScene') return (b.localSceneRaw || 0) - (a.localSceneRaw || 0);
    return 0;
  });

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 flex flex-col">
      <nav className="px-10 py-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={handleClearAll} className="text-2xl leading-none hover:opacity-80 transition-opacity cursor-pointer text-left">
            <span className="font-serif font-bold text-slate-900">Homebase</span> <span className="font-sans font-black text-[#0471A4] ml-1">NJ</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[13px] text-slate-500 px-2.5 py-0.5 border border-slate-200 rounded-full">21 counties · live verified data</div>
        </div>
      </nav>

      <motion.div 
        className={`transition-all duration-500 ease-in-out ${showResults ? 'bg-white border-b border-slate-200 sticky top-0 z-40 py-4 px-6 shadow-sm' : 'flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-4xl mx-auto w-full'}`}
      >
        <AnimatePresence mode="wait">
          {!showResults && (
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onClick={handleClearAll}
                className="text-center mb-10 hover:opacity-90 transition-opacity cursor-pointer bg-transparent border-none p-0 w-full"
              >
                <h1 className="text-[clamp(48px,8vw,84px)] mb-2 leading-none">
                  <span className="font-serif font-bold text-[#0471A4]">Homebase</span> <span className="font-sans font-black text-[#0471A4]/20 ml-1">NJ</span>
                </h1>
                <p className="font-mono text-base text-slate-500 tracking-[0.2em] uppercase">Find your perfect New Jersey town</p>
              </motion.button>
          )}
        </AnimatePresence>

        <motion.div className={`w-full ${showResults ? 'max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-start gap-6' : 'max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12'}`}>
          
          {/* Search Inputs */}
          <motion.div className={`flex ${showResults ? 'flex-row gap-6 w-full lg:w-auto shrink-0' : 'flex-col gap-6 w-full lg:flex-1'}`}>
            
            {/* County Section */}
            <motion.div 
              className={`flex flex-col gap-2 ${showResults ? 'w-full lg:w-[420px]' : 'w-full'} relative ${showCountyDropdown ? 'z-30' : 'z-20'}`} 
              ref={countyDropdownRef}
            >
              <div className="flex items-center justify-between mb-0 px-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">County Selection</span>
              </div>
              <div className={`relative flex flex-wrap items-center w-full min-h-[44px] pl-12 pr-6 py-1 border border-slate-200 rounded-[24px] bg-white shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-[#0471A4] transition-all gap-2`}>
                <div className="absolute top-1/2 -translate-y-1/2 left-5 flex items-center pointer-events-none z-20">
                  <span className="text-slate-400">🔍</span>
                </div>
                
                {/* Pills inside input ONLY if !showResults */}
                {!showResults && activeCounties.map(c => (
                  <span key={c} className="px-2 py-0.5 bg-blue-50 text-[#0471A4] rounded-full text-[12px] font-bold border border-blue-100 flex items-center gap-1.5 z-20">
                    {c} County
                    <button onClick={(e) => { e.stopPropagation(); setActiveCounties(activeCounties.filter(x => x !== c)); }} className="hover:bg-[#0471A4] hover:text-white rounded-full p-0.5 transition-colors">✕</button>
                  </span>
                ))}

                <div className="relative flex-1 min-w-[120px]">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-lg">
                    {ghostText && ghostText.toLowerCase().startsWith(countySearch.toLowerCase()) && (
                      <span className="text-slate-300">
                        <span className="opacity-0">{countySearch}</span>
                        {ghostText.slice(countySearch.length)}
                      </span>
                    )}
                  </div>
                  <input 
                    className={`w-full py-1.5 outline-none bg-transparent relative z-10 ${showResults ? 'text-sm' : 'text-base'}`}
                    placeholder={(!showResults && activeCounties.length > 0) ? "Add another..." : (showResults ? "Add county..." : "Search for a town or county (e.g. Summit, Union, Essex)...")}
                    value={countySearch}
                    onChange={e => {
                      setCountySearch(e.target.value);
                      setShowCountyDropdown(true);
                    }}
                    onFocus={() => setShowCountyDropdown(true)}
                    onKeyDown={e => {
                      if (e.key === 'Tab' && ghostText && ghostText.toLowerCase().startsWith(countySearch.toLowerCase())) {
                        e.preventDefault();
                        setCountySearch(ghostText);
                      }
                      if (e.key === 'Enter' && countySearch.length >= 2) {
                        const firstCounty = Object.entries(NJ_COUNTIES)
                          .filter(([name]) => name.toLowerCase().includes(countySearch.toLowerCase()))[0];
                        const firstTown = allTowns
                          .filter(t => t.name.toLowerCase().includes(countySearch.toLowerCase()))
                          .filter(t => !selectedTowns.some(s => s.name === t.name))[0];
                        
                        if (firstTown) {
                          handleTownSelect(firstTown);
                        } else if (firstCounty) {
                          handleCountySelect(firstCounty[0]);
                        }
                      }
                    }}
                  />
                </div>

                {/* Dropdown for County */}
                {showCountyDropdown && (
                  <div className={`absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-80 overflow-y-auto ${showResults ? 'w-[420px]' : 'w-full'}`}>
                    {/* Counties Section */}
                    {Object.entries(NJ_COUNTIES)
                      .filter(([name]) => name.toLowerCase().includes(countySearch.toLowerCase()))
                      .length > 0 && (
                      <>
                        <div className="px-4 py-2 text-[12px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                          Counties
                        </div>
                        {Object.entries(NJ_COUNTIES)
                          .sort(([, a], [, b]) => b.heat - a.heat)
                          .filter(([name]) => name.toLowerCase().includes(countySearch.toLowerCase()))
                          .map(([c, data]) => (
                            <div 
                              key={c}
                              className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 flex justify-between items-center border-b last:border-0 border-slate-100 group"
                              onClick={() => handleCountySelect(c)}
                            >
                              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                <span className="text-[#0471A4] shrink-0">📍</span>
                                <span className={`font-medium truncate ${activeCounties.includes(c) ? 'text-[#0471A4] font-bold' : ''}`}>{c} County</span>
                              </div>
                              <div className="flex items-center gap-2 whitespace-nowrap shrink-0 ml-2">
                                <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded group-hover:bg-slate-100 transition-colors">{data.heat}% heat</span>
                                <span className="font-mono text-[11px] text-slate-400 opacity-60">{data.towns.length} towns</span>
                              </div>
                            </div>
                          ))}
                      </>
                    )}

                    {/* Towns Section */}
                    {countySearch.length >= 2 && allTowns
                      .filter(t => t.name.toLowerCase().includes(countySearch.toLowerCase()))
                      .filter(t => !selectedTowns.some(s => s.name === t.name))
                      .length > 0 && (
                      <>
                        <div className="px-4 py-2 text-[12px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 border-t">
                          Towns
                        </div>
                        {allTowns
                          .filter(t => t.name.toLowerCase().includes(countySearch.toLowerCase()))
                          .filter(t => !selectedTowns.some(s => s.name === t.name))
                          .slice(0, 15)
                          .map(t => (
                            <div 
                              key={`${t.name}-${t.county}`}
                              className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 flex justify-between items-center border-b last:border-0 border-slate-100 group"
                              onClick={() => handleTownSelect(t)}
                            >
                              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                <span className="font-medium group-hover:text-[#0471A4] transition-colors truncate">{t.name}</span>
                                <span className="font-mono text-[10px] text-slate-400 uppercase shrink-0">{t.county}</span>
                              </div>
                              <div className="flex items-center gap-2 whitespace-nowrap shrink-0 ml-2">
                                {NJ_ENRICHED[t.name] && (
                                  <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded group-hover:bg-slate-100 transition-colors">{NJ_ENRICHED[t.name].saleToList}% heat</span>
                                )}
                                <span className="text-[#0471A4] text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">Add +</span>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Pills under search bar for showResults */}
              {showResults && activeCounties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <AnimatePresence>
                    {activeCounties.map(c => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key={c} 
                        className="px-2 py-0.5 bg-blue-50 text-[#0471A4] rounded-full text-[12px] font-bold border border-blue-100 flex items-center gap-2 shadow-sm shrink-0"
                      >
                        <span>{c} County</span>
                        <button onClick={() => setActiveCounties(activeCounties.filter(x => x !== c))} className="hover:bg-[#0471A4] hover:text-white rounded-full p-0.5 transition-colors">✕</button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Town Section */}
            <AnimatePresence>
              {activeCounties.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex flex-col gap-2 ${showResults ? 'w-full lg:w-[420px]' : 'w-full'} relative ${showTownDropdown ? 'z-30' : 'z-10'}`} 
                  ref={townDropdownRef}
                >
                  <div className="flex items-center justify-between mb-0 px-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Town Selection</span>
                    <span className={`text-[10px] font-mono ${selectedTowns.length >= 8 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                      {selectedTowns.length}/8 Towns Max
                    </span>
                  </div>
                  <div className={`relative flex flex-wrap items-center w-full min-h-[44px] pl-12 pr-6 py-1 border border-slate-200 rounded-[24px] bg-white shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-[#0471A4] transition-all gap-2`}>
                    <div className="absolute top-1/2 -translate-y-1/2 left-5 flex items-center pointer-events-none z-20">
                      <span className="text-slate-400">🏘️</span>
                    </div>

                    {!showResults && selectedTowns.map(t => (
                      <span key={t.name} className="px-2 py-0.5 bg-blue-50 text-[#0471A4] rounded-full text-[12px] font-bold border border-blue-100 flex items-center gap-1.5 z-20">
                        {t.name}
                        <button onClick={(e) => { e.stopPropagation(); setSelectedTowns(selectedTowns.filter(x => x.name !== t.name)); }} className="hover:bg-[#0471A4] hover:text-white rounded-full p-0.5 transition-colors">✕</button>
                      </span>
                    ))}

                    <div className="relative flex-1 min-w-[120px]">
                      <input 
                        ref={townInputRef}
                        className={`w-full py-1.5 outline-none bg-transparent relative z-10 ${showResults ? 'text-sm' : 'text-base'}`}
                        placeholder={(!showResults && selectedTowns.length > 0) ? "Add another..." : (showResults ? "Add town..." : `Search towns in ${activeCounties.join(', ')}...`)}
                        value={townSearch}
                        onChange={e => setTownSearch(e.target.value)}
                        onFocus={() => setShowTownDropdown(true)}
                      />
                    </div>

                    {/* Dropdown for Town */}
                    {showTownDropdown && (
                      <div className={`absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[350px] overflow-y-auto ${showResults ? 'w-[420px]' : 'w-full'}`}>
                        {!townSearch && (
                          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-mono text-[11px] text-[#0471A4] uppercase tracking-widest font-bold">Hottest Markets</span>
                            <span className="text-[11px] text-slate-400 italic">Sorted by sale-to-list %</span>
                          </div>
                        )}
                        {activeCounties.flatMap(c => (NJ_COUNTIES as any)[c].towns.map((t: string) => ({ name: t, county: c })))
                          .filter(t => !selectedTowns.some(s => s.name === t.name) && (townSearch ? t.name.toLowerCase().includes(townSearch.toLowerCase()) : true))
                          .sort((a, b) => {
                            const heatA = NJ_ENRICHED[a.name]?.saleToList || 0;
                            const heatB = NJ_ENRICHED[b.name]?.saleToList || 0;
                            return heatB - heatA;
                          })
                          .slice(0, townSearch ? 15 : 30)
                          .map(t => (
                            <div 
                              key={`${t.name}-${t.county}`}
                              className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 flex justify-between items-center border-b last:border-0 border-slate-100 group"
                              onClick={() => {
                                if (selectedTowns.length < 8) {
                                  setSelectedTowns([...selectedTowns, t]);
                                  setTownSearch('');
                                  setShowTownDropdown(false);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                <span className="font-medium group-hover:text-[#0471A4] transition-colors truncate">{t.name}</span>
                                <span className="font-mono text-[10px] text-slate-400 uppercase shrink-0">{t.county}</span>
                              </div>
                              <div className="flex items-center gap-2 whitespace-nowrap shrink-0 ml-2">
                                {NJ_ENRICHED[t.name] && (
                                  <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded group-hover:bg-slate-100 transition-colors">{NJ_ENRICHED[t.name].saleToList}% heat</span>
                                )}
                                {NJ_ENRICHED[t.name] && (
                                  <span className="font-mono text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">✓ full data</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Pills under search bar for showResults */}
                  {showResults && selectedTowns.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <AnimatePresence>
                        {selectedTowns.map((t) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            key={t.name} 
                            className="px-2 py-0.5 bg-blue-50 text-[#0471A4] rounded-full text-[12px] font-bold border border-blue-100 flex items-center gap-2 shadow-sm shrink-0"
                          >
                            <div className="flex flex-col leading-none">
                              <div className="flex items-center gap-1.5">
                                <span>{t.name}</span>
                                {NJ_ENRICHED[t.name] ? 
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-600" title="Full data available"></span> : 
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" title="Partial data available"></span>
                                }
                              </div>
                            </div>
                            <button onClick={() => setSelectedTowns(selectedTowns.filter(x => x.name !== t.name))} className="hover:bg-[#0471A4] hover:text-white rounded-full p-0.5 transition-colors">✕</button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Geo Explorer Section - REMOVED */}

          {showResults && selectedTowns.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 shrink-0">
              <button onClick={handleClearAll} className="px-4 py-2 text-sm text-slate-400 hover:text-[#0471A4] transition-all">Clear All</button>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!showResults && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl space-y-6 mt-6"
            >
              <div className="bg-white/50 border border-slate-200 rounded-xl p-4 text-center max-w-lg mx-auto">
                <p className="text-[13px] text-slate-500 font-mono leading-relaxed">
                  <span className="font-bold text-slate-900">Data Coverage:</span> We've enriched 300+ major towns across NJ with deep metrics including schools, safety, and walkability.
                </p>
              </div>

              {selectedTowns.length > 0 && (
                <div className="flex justify-center items-center gap-3 pt-4">
                  <button 
                    onClick={runComparison}
                    className="px-6 py-2.5 bg-[#0471A4] text-white rounded-full text-sm font-bold hover:bg-[#035480] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {selectedTowns.length === 1 ? 'View Town Data' : `Compare ${selectedTowns.length} Towns`}
                  </button>
                  <button 
                    onClick={handleClearAll}
                    className="px-5 py-2.5 bg-white text-slate-500 border border-slate-200 rounded-full text-sm font-bold hover:bg-slate-50 hover:text-[#0471A4] transition-all shadow-sm hover:shadow-md"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

        {tooltip && (
          <div className="fixed bg-slate-900 text-white px-3 py-1 rounded text-sm font-mono pointer-events-none z-[100]" style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}>
            {tooltip.name} County
          </div>
        )}

      <div ref={resultsRef} className={`px-4 md:px-10 pt-8 pb-20 w-full ${showResults ? 'block' : 'hidden'}`}>
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-7 h-7 border-3 border-blue-100 border-t-[#0471A4] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-mono text-sm text-slate-400">Loading comparison...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="font-serif text-3xl italic"><span className="not-italic">{selectedTowns.length === 1 ? selectedTowns[0].name : 'Town Comparison'}</span></h2>
                <div className="font-mono text-[13px] text-slate-400 mt-1">{selectedTowns.length} towns · New Jersey · Enriched local data + Census ACS 2023</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] text-slate-400">Sort by</span>
                  <select 
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[13px] font-mono text-slate-900 focus:outline-none focus:border-[#0471A4] cursor-pointer hover:border-[#0471A4] transition-all"
                  >
                    <option value="fit">Fit Score</option>
                    <option value="income">Income</option>
                    <option value="home">Home Value</option>
                    <option value="commute">Commute</option>
                    <option value="schools">Schools</option>
                    <option value="edu">Education</option>
                    <option value="safety">Safety</option>
                    <option value="walk">Walkability</option>
                    <option value="highway">Regional Access</option>
                    <option value="market">Market Heat</option>
                    <option value="taxes">Property Taxes</option>
                    <option value="localScene">Local Scene</option>
                  </select>
                </div>
                <button 
                  onClick={handleClearAll}
                  className="px-4 py-1.5 bg-white text-slate-500 border border-slate-200 rounded-full text-[13px] font-mono hover:bg-slate-50 hover:text-[#0471A4] transition-all ml-2"
                >
                  Start Over
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-10 shadow-sm">
              <button 
                onClick={() => setShowPrioritySettings(!showPrioritySettings)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-baseline gap-3">
                  <h3 className="font-serif text-xl text-slate-900">What matters most to you?</h3>
                  <p className="text-sm text-slate-400 font-mono hidden sm:block">Drag to rank · top = highest priority</p>
                </div>
                <div className={`transition-transform duration-300 ${showPrioritySettings ? 'rotate-180' : ''}`}>
                  <ChevronRight size={20} className="rotate-90 text-[#0471A4]" />
                </div>
              </button>

              <AnimatePresence>
                {showPrioritySettings && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-2 border-t border-slate-100">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-4 py-1 font-mono text-[10px] text-slate-400 uppercase tracking-widest opacity-60">
                          <span>Highest Priority</span>
                          <span>Lowest Priority</span>
                        </div>
                        
                        <Reorder.Group 
                          axis="y" 
                          values={priorityOrder} 
                          onReorder={setPriorityOrder}
                          className="space-y-2"
                        >
                          {priorityOrder.map((key, i) => {
                            const dim = DIMS.find(d => d.key === key)!;
                            return (
                              <Reorder.Item 
                                key={key} 
                                value={key}
                                className="group/prio cursor-grab active:cursor-grabbing"
                              >
                                <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg hover:border-[#0471A4] hover:bg-slate-50 transition-all shadow-sm hover:shadow-md">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-mono text-xs font-bold text-[#0471A4]">
                                      {i + 1}
                                    </div>
                                    <div>
                                      <div className="font-bold text-sm text-slate-900">{dim.label}</div>
                                      <div className="text-[11px] text-slate-400 font-mono">{dim.sub}</div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="px-2.5 py-1 bg-[#0471A4]/10 rounded-md border border-[#0471A4]/20">
                                      <span className="font-mono text-[10px] text-[#0471A4] font-bold uppercase">Weight x{rankToWeight(i, priorityOrder.length)}</span>
                                    </div>
                                    <GripVertical size={16} className="text-slate-300 group-hover/prio:text-[#0471A4] transition-colors" />
                                  </div>
                                </div>
                              </Reorder.Item>
                            );
                          })}
                        </Reorder.Group>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Grid View */}
            <div className="hidden md:grid bg-white border border-slate-200 rounded-xl shadow-sm" style={{ gridTemplateColumns: `150px repeat(${sortedTowns.length}, 1fr)` }}>
              <div className="p-4 border-r border-slate-100 bg-slate-50 sticky left-0 z-10">
                <div className="font-mono text-[12px] text-slate-400 uppercase tracking-widest">Town</div>
              </div>
              {sortedTowns.map(d => {
                const isPerfectMatch = calcFitScore(d) >= 85;
                return (
                <div 
                  key={d.name} 
                  className={`p-4 text-white cursor-pointer hover:brightness-110 transition-all relative group/town ${isPerfectMatch ? 'border-t-4 border-amber-400' : ''} ${expandedTown === d.name ? 'z-50' : 'z-30'}`} 
                  style={{ backgroundColor: d.color }}
                  onClick={() => setExpandedTown(expandedTown === d.name ? null : d.name)}
                >
                  {isPerfectMatch && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-400 text-amber-950 text-[9px] font-bold text-center uppercase tracking-widest py-0.5 shadow-sm">
                      Excellent Town
                    </div>
                  )}
                  <div className={`flex justify-between items-start ${isPerfectMatch ? 'mt-2' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-serif text-lg font-bold leading-tight">{d.name}</div>
                        {d.isLive && (
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" title="Live Data Active"></div>
                        )}
                      </div>
                      <div className="font-mono text-[11px] opacity-60 uppercase tracking-wider">{d.county}</div>
                    </div>
                    <div className={`transition-transform duration-300 ${expandedTown === d.name ? 'rotate-180' : ''}`}>
                      <ChevronRight size={14} className="opacity-60 group-hover/town:opacity-100" />
                    </div>
                  </div>
                  <div className="font-mono text-[11px] opacity-60 mt-0.5">
                    {d.isLoadingLive ? (
                      <span className="flex items-center gap-1.5 italic animate-pulse">
                        <Zap size={10} className="text-yellow-400 fill-yellow-400" />
                        Fetching live...
                      </span>
                    ) : d.isLive ? (
                      <span className="text-green-300 font-bold uppercase tracking-tighter text-[9px]">Live Verified</span>
                    ) : d.hasFullData ? (
                      '✓ full data'
                    ) : (
                      ''
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-white/20 rounded-full font-mono text-[13px] group/fit relative">
                    <span>Fit</span><span className="text-base font-bold">{calcFitScore(d)}</span><span className="text-[12px] opacity-60">/100</span>
                  </div>

                  {/* Town Detail Dropdown */}
                  <AnimatePresence>
                    {expandedTown === d.name && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute top-full left-0 right-0 bg-white text-slate-900 z-50 shadow-2xl overflow-hidden border-t border-slate-100"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-400">Market Heat</span>
                            <span className="text-base font-bold text-[#0471A4]">{d.saleToList || 'N/A'}%</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="font-mono text-[10px] uppercase text-slate-400">Population</div>
                              <div className="text-sm font-bold">{d.pop ? d.pop.toLocaleString() : 'N/A'}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-mono text-[10px] uppercase text-slate-400">Education</div>
                              <div className="text-sm font-bold">{d.eduPct || 'N/A'}% Degree+</div>
                            </div>
                          </div>
                          <div className="pt-2">
                            <div className="font-mono text-[10px] uppercase text-slate-400 mb-1">Quick Take</div>
                            <p className="text-[12px] leading-relaxed text-slate-600 italic">
                              {d.hasFullData 
                                ? `${d.name} is a ${d.safetyLabel.toLowerCase()} community with ${d.schoolLabel} rated schools and a ${d.walkLabel.toLowerCase()} layout.`
                                : "Detailed metrics coming soon for this municipality."}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                );
              })}

              {priorityOrder.map((key, rank) => {
                const dim = DIMS.find(d => d.key === key)!;
                return (
                  <React.Fragment key={key}>
                    <div className="p-3 border-t border-r border-slate-100 bg-slate-50 flex flex-col justify-center sticky left-0 z-20 group/dim relative">
                      <div className="flex items-center gap-1.5">
                        <div className="text-[12px] font-bold uppercase tracking-wider text-slate-900">{dim.label}</div>
                        {(dim as any).hoverSub && (
                          <Info size={12} className="text-slate-400 opacity-40 group-hover/dim:opacity-100 transition-opacity cursor-help" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono leading-tight mt-0.5">{dim.sub}</div>
                      
                      {(dim as any).hoverSub && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-72 p-4 bg-white text-slate-900 text-[13px] font-mono rounded-2xl shadow-2xl z-[100] hidden group-hover/dim:block animate-in fade-in zoom-in-95 duration-200 pointer-events-none border border-slate-100 backdrop-blur-xl">
                          <div className="relative">
                            <div className="absolute -left-[24px] top-1/2 -translate-y-1/2 border-[8px] border-transparent border-r-white"></div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1 h-3 bg-[#0471A4] rounded-full"></div>
                              <div className="text-[12px] text-slate-400 uppercase tracking-[0.2em] font-bold opacity-80">Methodology</div>
                            </div>
                            <div className="leading-relaxed text-slate-600">
                              {(dim as any).hoverSub}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-1 px-1.5 py-0.5 bg-slate-900 text-white text-[11px] font-mono rounded-full w-fit">x{rankToWeight(rank, priorityOrder.length)}</div>
                    </div>
                    {sortedTowns.map(d => {
                      const score = (d as any)[dim.scoreKey];
                      if (!d.hasFullData) return <div key={d.name} className="p-3 border-t border-r border-slate-100 flex flex-col justify-center"><div className="text-base font-bold text-slate-400">N/A</div><div className="text-[12px] text-slate-400 font-mono">data not available</div></div>;
                      
                      let valDisplay = '';
                      let subDisplay = '';
                      let tag = null;

                      if (key === 'income') { valDisplay = fmtDollar(d.income); subDisplay = 'household / yr'; tag = tagLabel(score, 'High income', 'Low income'); }
                      else if (key === 'home') { valDisplay = fmtDollar(d.homeVal); subDisplay = 'median home value'; tag = tagLabel(score, 'Affordable', 'Expensive'); }
                      else if (key === 'commute') { 
                        const metro = commuteMetros[d.name] || 'Avg';
                        const commuteVal = metro === 'Avg' ? d.commute : (d.commuteMetros?.[metro] || 'N/A');
                        valDisplay = `${commuteVal}${commuteVal === 'N/A' ? '' : ' min'}`; 
                        subDisplay = metro === 'Avg' ? 'avg travel time' : `to ${metro}`; 
                      }
                      else if (key === 'highway') { valDisplay = `${d.highwayRaw}/100`; subDisplay = 'Regional Access Score'; tag = tagLabel(score, 'Excellent', 'Limited'); }
                      else if (key === 'schools') { valDisplay = d.schoolLabel; subDisplay = 'Niche district rating'; tag = tagLabel(score, 'Top tier', 'Below avg'); }
                      else if (key === 'safety') { valDisplay = d.safetyLabel; subDisplay = `Score: ${d.safetyRaw}/100`; }
                      else if (key === 'taxes') { 
                        const period = taxPeriods[d.name] || '1y';
                        const taxVal = period === '1y' ? d.taxRate : (d.taxHistory?.[period] || 'N/A');
                        valDisplay = `${taxVal}${taxVal === 'N/A' ? '' : '%'}`; 
                        subDisplay = period === '1y' ? `~$${d.avgTax ? d.avgTax.toLocaleString() : 'N/A'}/yr` : `Tax Rate (${period})`; 
                      }
                      else if (key === 'localScene') { 
                        valDisplay = `${d.localSceneRaw}/100`; 
                        subDisplay = 'Local Scene Score'; 
                        tag = tagLabel(score, 'Vibrant', 'Quiet'); 
                      }
                      else if (key === 'walk') { valDisplay = `${d.walkRaw}/100`; subDisplay = d.walkLabel; }
                      else if (key === 'edu') { valDisplay = `${d.eduPct}%`; subDisplay = 'Bachelor\'s Degree+'; tag = tagLabel(score, 'Highly Educated', 'Mixed'); }
                      else if (key === 'market') { 
                        const period = marketPeriods[d.name] || '90d';
                        const marketVal = d.marketHistory?.[period] || d.saleToList;
                        valDisplay = `${marketVal}%`; 
                        subDisplay = `Sale-to-list (${period})`; 
                        tag = tagLabel(scoreMarket(marketVal), 'Hot market', 'Cool market'); 
                      }

                      const isExpandable = key === 'localScene' || key === 'market' || key === 'commute' || key === 'taxes';
                      const isExpanded = expandedCard === `${d.name}-${key}`;
                      
                      // Calculate dynamic score for period/metro selections
                      const mPeriod = marketPeriods[d.name] || '90d';
                      const marketVal = key === 'market' ? (d.marketHistory?.[mPeriod] || d.saleToList) : 0;
                      
                      const metro = commuteMetros[d.name] || 'Avg';
                      const commuteVal = key === 'commute' ? (metro === 'Avg' ? d.commute : d.commuteMetros?.[metro]) : 0;
                      
                      const tPeriod = taxPeriods[d.name] || '1y';
                      const taxVal = key === 'taxes' ? (tPeriod === '1y' ? d.taxRate : d.taxHistory?.[tPeriod]) : 0;

                      let dynamicScore = score;
                      if (key === 'market') dynamicScore = scoreMarket(marketVal);
                      if (key === 'commute') dynamicScore = scoreCommute(commuteVal);
                      if (key === 'taxes') dynamicScore = scoreTax(taxVal);

                      return (
                        <div 
                          key={d.name} 
                          className={`p-3 border-t border-r border-slate-100 hover:bg-blue-50 transition-all flex flex-col justify-center gap-1 relative ${isExpandable ? 'cursor-pointer group/card' : ''}`}
                          onClick={() => {
                            if (isExpandable) {
                              setExpandedCard(isExpanded ? null : `${d.name}-${key}`);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-base font-bold text-slate-900">{valDisplay}</div>
                            </div>
                            {isExpandable && (
                              <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronRight size={14} className="text-[#0471A4] opacity-40 group-hover/card:opacity-100" />
                              </div>
                            )}
                          </div>
                          
                          <div className="text-[12px] text-slate-400 font-mono leading-tight flex items-center justify-between">
                            <span>{subDisplay}</span>
                            {isExpandable && !isExpanded && (
                              <span className="text-[9px] font-bold text-[#0471A4] uppercase tracking-tighter opacity-0 group-hover/card:opacity-100 transition-opacity">
                                {key === 'localScene' ? 'What\'s hot' : 'History'}
                              </span>
                            )}
                          </div>

                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                            <div className="h-full transition-all duration-500" style={{ width: `${dynamicScore}%`, backgroundColor: barColor(dynamicScore) }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2">
                            {tag && <span className={`text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full w-fit font-mono ${tagClass(dynamicScore)}`}>{tag}</span>}
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-2 pt-2 border-t border-slate-100"
                              >
                                {key === 'localScene' && (
                                  <>
                                    <div className="font-mono text-[10px] text-[#0471A4] uppercase tracking-widest font-bold mb-2">Hottest Lately:</div>
                                    <div className="space-y-2">
                                      {(d.hottestThings && d.hottestThings.length > 0) ? (
                                        d.hottestThings.map((thing: string, idx: number) => (
                                          <div key={idx} className="flex items-start gap-2 group/item">
                                            <div className="w-5 h-5 rounded-lg bg-[#0471A4]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-[#0471A4]/20 transition-colors">
                                              <Zap size={10} className="text-[#0471A4]" />
                                            </div>
                                            <span className="text-[11px] text-slate-900 leading-tight font-medium">{thing}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-[11px] text-slate-400 italic">New spots opening soon...</div>
                                      )}
                                    </div>
                                  </>
                                )}
                                {key === 'commute' && (
                                  <>
                                    <div className="font-mono text-[10px] text-[#0471A4] uppercase tracking-widest font-bold mb-2">Select Metro:</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {['Avg', 'NYC', 'PHI', 'JC'].map((m) => {
                                        const isActive = (commuteMetros[d.name] || 'Avg') === m;
                                        return (
                                          <button
                                            key={m}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCommuteMetros(prev => ({ ...prev, [d.name]: m }));
                                            }}
                                            className={`px-2 py-1 rounded-full text-[10px] font-bold font-mono transition-all ${
                                              isActive 
                                                ? 'bg-[#0471A4] text-white shadow-sm' 
                                                : 'bg-slate-100 text-slate-500 hover:bg-blue-50'
                                            }`}
                                          >
                                            {m}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                                {key === 'taxes' && (
                                  <>
                                    <div className="font-mono text-[10px] text-[#0471A4] uppercase tracking-widest font-bold mb-2">Select Period:</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {['1y', '3y', '5y'].map((p) => {
                                        const isActive = (taxPeriods[d.name] || '1y') === p;
                                        return (
                                          <button
                                            key={p}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTaxPeriods(prev => ({ ...prev, [d.name]: p }));
                                            }}
                                            className={`px-2 py-1 rounded-full text-[10px] font-bold font-mono transition-all ${
                                              isActive 
                                                ? 'bg-[#0471A4] text-white shadow-sm' 
                                                : 'bg-slate-100 text-slate-500 hover:bg-blue-50'
                                            }`}
                                          >
                                            {p.toUpperCase()}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                                {key === 'market' && (
                                  <>
                                    <div className="font-mono text-[10px] text-[#0471A4] uppercase tracking-widest font-bold mb-2">Select Period:</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {['90d', '6m', '1y', '3y', '5y'].map((p) => {
                                        const isActive = (marketPeriods[d.name] || '90d') === p;
                                        return (
                                          <button
                                            key={p}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setMarketPeriods(prev => ({ ...prev, [d.name]: p }));
                                            }}
                                            className={`px-2 py-1 rounded-full text-[10px] font-bold font-mono transition-all ${
                                              isActive 
                                                ? 'bg-[#0471A4] text-white shadow-sm' 
                                                : 'bg-slate-100 text-slate-500 hover:bg-blue-50'
                                            }`}
                                          >
                                            {p.toUpperCase()}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden space-y-6">
              {sortedTowns.map(d => {
                const isPerfectMatch = calcFitScore(d) >= 85;
                return (
                <div key={d.name} className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative ${isPerfectMatch ? 'border-t-4 border-t-amber-400' : ''}`}>
                  {isPerfectMatch && (
                    <div className="bg-amber-400 text-amber-950 text-[10px] font-bold text-center uppercase tracking-widest py-1 shadow-sm">
                      Excellent Town
                    </div>
                  )}
                  <div className="p-4 text-white" style={{ backgroundColor: d.color }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-serif text-xl font-bold">{d.name}</div>
                        <div className="font-mono text-[11px] opacity-70 uppercase tracking-wider">{d.county} County</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="bg-white/20 px-3 py-1 rounded-full font-mono text-sm font-bold flex items-center gap-2">
                          <span className="opacity-70 text-[10px] uppercase">Fit</span>
                          <span>{calcFitScore(d)}/100</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 border-t border-white/10 pt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-[#0471A4] rounded-full"></div>
                        <span className="text-[9px] font-mono uppercase opacity-60 tracking-tighter">Source: Census ACS + 2026 Projections</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-mono uppercase opacity-60 tracking-tighter">Verified: April 2026</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {priorityOrder.map((key, rank) => {
                      const dim = DIMS.find(dim => dim.key === key)!;
                      const score = (d as any)[dim.scoreKey];
                      if (!d.hasFullData) return (
                        <div key={key} className="p-4 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">#{rank + 1}</span>
                              <span className="font-bold text-[13px] text-slate-900 uppercase tracking-tight">{dim.label}</span>
                            </div>
                            <div className="text-base font-bold text-slate-400">N/A</div>
                            <div className="text-[11px] text-slate-400 font-mono leading-tight">data not available</div>
                          </div>
                        </div>
                      );

                      let valDisplay = '';
                      let subDisplay = '';
                      if (key === 'income') { valDisplay = fmtDollar(d.income); subDisplay = 'household / yr'; }
                      else if (key === 'home') { valDisplay = fmtDollar(d.homeVal); subDisplay = 'median home value'; }
                      else if (key === 'commute') { 
                        const metro = commuteMetros[d.name] || 'Avg';
                        const commuteVal = metro === 'Avg' ? d.commute : d.commuteMetros?.[metro];
                        valDisplay = `${commuteVal} min`; 
                        subDisplay = metro === 'Avg' ? 'avg travel time' : `to ${metro}`; 
                      }
                      else if (key === 'highway') { valDisplay = `${d.highwayRaw}/100`; subDisplay = 'Regional Access'; }
                      else if (key === 'schools') { valDisplay = d.schoolLabel; subDisplay = 'Niche rating'; }
                      else if (key === 'safety') { valDisplay = d.safetyLabel; subDisplay = `Score: ${d.safetyRaw}/100`; }
                      else if (key === 'taxes') { 
                        const period = taxPeriods[d.name] || '1y';
                        const taxVal = period === '1y' ? d.taxRate : d.taxHistory?.[period];
                        valDisplay = `${taxVal}%`; 
                        subDisplay = period === '1y' ? `~$${d.avgTax ? d.avgTax.toLocaleString() : 'N/A'}/yr` : `Tax Rate (${period})`; 
                      }
                      else if (key === 'localScene') { valDisplay = `${d.localSceneRaw}/100`; subDisplay = 'Local Scene Score'; }
                      else if (key === 'walk') { valDisplay = `${d.walkRaw}/100`; subDisplay = d.walkLabel; }
                      else if (key === 'edu') { valDisplay = `${d.eduPct}%`; subDisplay = 'Bachelor\'s Degree+'; }
                      else if (key === 'market') { 
                        const period = marketPeriods[d.name] || '90d';
                        const marketVal = d.marketHistory?.[period] || d.saleToList;
                        valDisplay = `${marketVal}%`; 
                        subDisplay = `Sale-to-list (${period})`; 
                      }

                      const isExpandable = key === 'localScene' || key === 'market' || key === 'commute' || key === 'taxes';
                      const isExpanded = expandedCard === `${d.name}-${key}-mobile`;
                      
                      // Calculate dynamic score for period/metro selections
                      const mPeriod = marketPeriods[d.name] || '90d';
                      const marketVal = key === 'market' ? (d.marketHistory?.[mPeriod] || d.saleToList) : 0;
                      
                      const metro = commuteMetros[d.name] || 'Avg';
                      const commuteVal = key === 'commute' ? (metro === 'Avg' ? d.commute : d.commuteMetros?.[metro]) : 0;
                      
                      const tPeriod = taxPeriods[d.name] || '1y';
                      const taxVal = key === 'taxes' ? (tPeriod === '1y' ? d.taxRate : d.taxHistory?.[tPeriod]) : 0;

                      let dynamicScore = score;
                      if (key === 'market') dynamicScore = scoreMarket(marketVal);
                      if (key === 'commute') dynamicScore = scoreCommute(commuteVal);
                      if (key === 'taxes') dynamicScore = scoreTax(taxVal);

                      return (
                        <div 
                          key={key} 
                          className={`p-4 flex flex-col gap-2 transition-colors ${isExpandable ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                          onClick={() => {
                            if (isExpandable) {
                              setExpandedCard(isExpanded ? null : `${d.name}-${key}-mobile`);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">#{rank + 1}</span>
                                <span className="font-bold text-[13px] text-slate-900 uppercase tracking-tight">{dim.label}</span>
                                {isExpandable && (
                                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <ChevronRight size={12} className="text-[#0471A4]" />
                                  </div>
                                )}
                              </div>
                              <div className="text-base font-bold text-slate-900">{valDisplay}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{subDisplay}</div>
                            </div>
                            <div className="w-24 flex flex-col items-end gap-1.5">
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full" style={{ width: `${dynamicScore}%`, backgroundColor: barColor(dynamicScore) }}></div>
                              </div>
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full font-mono whitespace-nowrap ${tagClass(dynamicScore)}`}>
                                {tagLabel(dynamicScore, 'High', 'Low')}
                              </span>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-1 pt-3 border-t border-slate-100"
                              >
                                {key === 'localScene' && (
                                  <>
                                    <div className="font-mono text-[10px] text-[#0471A4] uppercase tracking-widest font-bold mb-2">Hottest Lately:</div>
                                    <div className="space-y-2">
                                      {(d.hottestThings && d.hottestThings.length > 0) ? (
                                        d.hottestThings.map((thing: string, idx: number) => (
                                          <div key={idx} className="flex items-start gap-2 group/item">
                                            <div className="w-5 h-5 rounded-lg bg-[#0471A4]/10 flex items-center justify-center shrink-0 mt-0.5">
                                              <Zap size={10} className="text-[#0471A4]" />
                                            </div>
                                            <span className="text-[12px] text-slate-900 leading-tight font-medium">{thing}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-[12px] text-slate-400 italic">New spots opening soon...</div>
                                      )}
                                    </div>
                                  </>
                                )}
                                {key === 'commute' && (
                                  <>
                                    <div className="font-mono text-[10px] text-[#0471A4] uppercase tracking-widest font-bold mb-2">Select Metro:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {['Avg', 'NYC', 'PHI', 'JC'].map((m) => {
                                        const isActive = (commuteMetros[d.name] || 'Avg') === m;
                                        return (
                                          <button
                                            key={m}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCommuteMetros(prev => ({ ...prev, [d.name]: m }));
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold font-mono transition-all ${
                                              isActive 
                                                ? 'bg-[#0471A4] text-white shadow-sm' 
                                                : 'bg-slate-100 text-slate-500'
                                            }`}
                                          >
                                            {m}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                                {key === 'taxes' && (
                                  <>
                                    <div className="font-mono text-[10px] text-[#0471A4] uppercase tracking-widest font-bold mb-2">Select Period:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {['1y', '3y', '5y'].map((p) => {
                                        const isActive = (taxPeriods[d.name] || '1y') === p;
                                        return (
                                          <button
                                            key={p}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTaxPeriods(prev => ({ ...prev, [d.name]: p }));
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold font-mono transition-all ${
                                              isActive 
                                                ? 'bg-[#0471A4] text-white shadow-sm' 
                                                : 'bg-slate-100 text-slate-500'
                                            }`}
                                          >
                                            {p.toUpperCase()}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                                {key === 'market' && (
                                  <>
                                    <div className="font-mono text-[10px] text-[#0471A4] uppercase tracking-widest font-bold mb-2">Select Period:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {['90d', '6m', '1y', '3y', '5y'].map((p) => {
                                        const isActive = (marketPeriods[d.name] || '90d') === p;
                                        return (
                                          <button
                                            key={p}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setMarketPeriods(prev => ({ ...prev, [d.name]: p }));
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold font-mono transition-all ${
                                              isActive 
                                                ? 'bg-[#0471A4] text-white shadow-sm' 
                                                : 'bg-slate-100 text-slate-500'
                                            }`}
                                          >
                                            {p.toUpperCase()}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
            <div className="text-[13px] font-mono text-slate-400 mt-4 text-center">
              Sources: <a href="https://www.census.gov" className="text-[#0471A4] hover:underline">US Census ACS 2023</a> · Niche school ratings · NJ property tax records · WalkScore
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
