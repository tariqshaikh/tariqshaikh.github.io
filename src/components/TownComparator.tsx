/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Info, ChevronRight, GripVertical } from 'lucide-react';
import { NJ_COUNTIES, NJ_ENRICHED, DIMS, COLORS } from '../constants';
import { NJ_COUNTY_PATHS, NJ_STATE_OUTLINE } from '../mapData';
import { motion, AnimatePresence, Reorder } from 'motion/react';

// Helper functions
const scoreIncome = (v: number | null) => { if (!v) return 50; return Math.min(100, Math.round((v / 180000) * 100)); };
const scoreHome = (v: number | null) => { if (!v) return 50; return Math.max(0, 100 - Math.round((v / 2000000) * 100)); };
const scoreCommute = (v: number | null) => { if (!v) return 50; return Math.max(0, 100 - Math.round((v / 90) * 100)); };
const scoreHighway = (v: number | null) => { if (!v) return 50; return v; };
const scoreSchool = (v: number | null) => { if (!v) return 50; return v; };
const scoreSafety = (v: number | null) => { if (!v) return 50; return v; };
const scoreTax = (rate: number | null) => { if (!rate) return 50; return Math.max(0, 100 - Math.round(rate * 20)); };
const scoreWalk = (v: number | null) => { if (!v) return 50; return v; };
const scoreEdu = (v: number | null) => { if (!v) return 50; return v; };
const scoreMarket = (v: number | null) => { if (v == null) return 50; return Math.min(100, Math.max(0, (v - 96) * 12)); };

const rankToWeight = (r: number, total: number) => {
  const weights = [2.5, 2.0, 1.5, 1.2, 1.0, 0.8, 0.6, 0.4];
  return weights[r] || 0.5;
};

const barColor = (v: number) => v >= 70 ? '#1E5C38' : v >= 45 ? '#7A5200' : '#A83220';
const tagClass = (v: number) => v >= 70 ? 'bg-[#D4EDDE] text-[#1E5C38]' : v >= 45 ? 'bg-[#FDEFC6] text-[#7A5200]' : 'bg-[#FAD9D3] text-[#A83220]';
const tagLabel = (v: number, hi: string, lo: string) => v >= 70 ? hi : v >= 45 ? 'Average' : lo;
const fmtNum = (n: number | null) => { if (!n || n < 0) return 'N/A'; if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'; if (n >= 1000) return (n / 1000).toFixed(0) + 'K'; return String(n); };
const fmtDollar = (n: number | null) => (n && n > 0) ? '$' + fmtNum(n) : 'N/A';

export default function TownComparator() {
  const [selectedTowns, setSelectedTowns] = useState<{name: string, county: string}[]>([]);
  const [activeCounties, setActiveCounties] = useState<string[]>([]);
  const [countySearch, setCountySearch] = useState('');
  const [townSearch, setTownSearch] = useState('');
  const [ghostText, setGhostText] = useState('');
  const [priorityOrder, setPriorityOrder] = useState(['income', 'schools', 'home', 'market', 'highway', 'safety', 'walk', 'commute', 'taxes', 'edu']);
  const [sortKey, setSortKey] = useState('fit');
  const [showResults, setShowResults] = useState(false);
  const [showPrioritySettings, setShowPrioritySettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tooltip, setTooltip] = useState<{ name: string, x: number, y: number } | null>(null);
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const [showTownDropdown, setShowTownDropdown] = useState(false);
  const [expandedTown, setExpandedTown] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const countyDropdownRef = useRef<HTMLDivElement>(null);
  const townDropdownRef = useRef<HTMLDivElement>(null);
  const townInputRef = useRef<HTMLInputElement>(null);

  const allTowns = React.useMemo(() => 
    Object.entries(NJ_COUNTIES).flatMap(([county, data]) => 
      data.towns.map(town => ({ name: town, county }))
    ), []
  );

  const handleCountySelect = (c: string) => {
    if (!activeCounties.includes(c)) {
      setActiveCounties([...activeCounties, c]);
    }
    setCountySearch('');
    setShowCountyDropdown(false);
    setShowResults(false);
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
      setShowResults(false);
      // Focus town search after a short delay to allow adding more from the same county
      setTimeout(() => townInputRef.current?.focus(), 100);
    }
  };

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
    setTimeout(() => {
      setIsLoading(false);
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  };

  const handleClearAll = () => {
    setSelectedTowns([]);
    setActiveCounties([]);
    setCountySearch('');
    setTownSearch('');
    setShowResults(false);
    setGhostText('');
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
    const d = NJ_ENRICHED[name];
    if (d) {
      return {
        name, county: county + ' County', color: COLORS[i % COLORS.length], hasFullData: true,
        income: d.income, homeVal: d.homeVal, commute: d.commute, pop: d.pop,
        saleToList: d.saleToList, eduPct: d.eduPct,
        schoolRating: d.schoolRating, schoolLabel: d.schoolLabel,
        safetyRaw: d.safetyScore, safetyLabel: d.safetyLabel,
        highwayRaw: d.highway || 70,
        taxRate: d.taxRate, avgTax: d.avgTax,
        walkRaw: d.walkScore, walkLabel: d.walkLabel,
        incomeScore: scoreIncome(d.income), homeScore: scoreHome(d.homeVal),
        commuteScore: scoreCommute(d.commute), 
        highwayScore: scoreHighway(d.highway || 70),
        schoolScore: scoreSchool(d.schoolRating),
        safetyScore: scoreSafety(d.safetyScore), taxScore: scoreTax(d.taxRate),
        walkScore2: scoreWalk(d.walkScore), marketScore: scoreMarket(d.saleToList),
        eduScore: scoreEdu(d.eduPct)
      };
    }
    return {
      name, county: county + ' County', color: COLORS[i % COLORS.length], hasFullData: false,
      income: null, homeVal: null, commute: null, pop: null, saleToList: null, eduPct: null,
      schoolRating: null, schoolLabel: null, safetyRaw: null, safetyLabel: null,
      taxRate: null, avgTax: null, walkRaw: null, walkLabel: null,
      incomeScore: 50, homeScore: 50, commuteScore: 50, schoolScore: 50,
      safetyScore: 50, taxScore: 50, walkScore2: 50, marketScore: 50,
      highwayScore: 50, eduScore: 50
    };
  });

  const sortedTowns = [...townData].sort((a, b) => {
    if (sortKey === 'fit') return calcFitScore(b) - calcFitScore(a);
    if (sortKey === 'income') return (b.income || 0) - (a.income || 0);
    if (sortKey === 'home') return (a.homeVal || 999999) - (b.homeVal || 999999);
    if (sortKey === 'commute') return (a.commute || 99) - (b.commute || 99);
    if (sortKey === 'schools') return (b.schoolRating || 0) - (a.schoolRating || 0);
    if (sortKey === 'edu') return (b.eduPct || 0) - (a.eduPct || 0);
    return 0;
  });

  return (
    <div className="bg-[#F7FBFF] min-h-screen font-sans text-[#1A1C1E]">
      <nav className="px-10 py-4 flex items-center justify-between border-b border-[#D4E8F0] bg-white">
        <div className="text-2xl leading-none">
          <span className="font-serif font-bold text-[#1A1C1E]">Homebase</span> <span className="font-sans font-black text-[#0471A4] ml-1">NJ</span>
        </div>
        <div className="font-mono text-[13px] text-[#6E8A96] px-2.5 py-0.5 border border-[#D4E8F0] rounded-full">21 counties · enriched data</div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-4xl mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="text-[clamp(48px,8vw,84px)] mb-2 leading-none">
            <span className="font-serif font-bold text-[#0471A4]">Homebase</span> <span className="font-sans font-black text-[#0471A4]/40 ml-1">NJ</span>
          </h1>
          <p className="font-mono text-base text-[#6E8A96] tracking-[0.2em] uppercase">Find your perfect New Jersey town</p>
        </div>

        <div className="w-full max-w-2xl space-y-6">
          <div className="relative group bg-white rounded-full">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="text-[#6E8A96]">🔍</span>
            </div>
            <div className="absolute inset-y-0 left-14 flex items-center pointer-events-none text-lg">
              {ghostText && ghostText.toLowerCase().startsWith(countySearch.toLowerCase()) && (
                <span className="text-[#6E8A96]/30">
                  <span className="opacity-0">{countySearch}</span>
                  {ghostText.slice(countySearch.length)}
                </span>
              )}
            </div>
            <input 
              className="w-full pl-12 pr-6 py-3 border border-[#D4E8F0] rounded-full text-base shadow-sm hover:shadow-md focus:shadow-md focus:border-[#0471A4] outline-none transition-all bg-transparent relative z-10"
              placeholder="Search for a town or county (e.g. Summit, Union, Essex)..."
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
            {showCountyDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#D4E8F0] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-80 overflow-y-auto" ref={countyDropdownRef}>
                {/* Counties Section */}
                {Object.entries(NJ_COUNTIES)
                  .filter(([name]) => name.toLowerCase().includes(countySearch.toLowerCase()))
                  .length > 0 && (
                  <>
                    <div className="px-6 py-2 text-[12px] font-bold text-[#6E8A96] uppercase tracking-wider bg-[#F7FBFF] border-b border-[#D4E8F0]">
                      Counties
                    </div>
                    {Object.entries(NJ_COUNTIES)
                      .sort(([, a], [, b]) => b.heat - a.heat)
                      .filter(([name]) => name.toLowerCase().includes(countySearch.toLowerCase()))
                      .map(([c, data]) => (
                        <div 
                          key={c}
                          className="px-6 py-4 text-base cursor-pointer hover:bg-[#F7FBFF] flex justify-between items-center border-b last:border-0 border-[#E8F4FB] group"
                          onClick={() => handleCountySelect(c)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[#0471A4]">📍</span>
                            <span className={`font-medium ${activeCounties.includes(c) ? 'text-[#0471A4] font-bold' : ''}`}>{c} County</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[13px] text-[#6E8A96] bg-[#F7FBFF] px-2 py-1 rounded group-hover:bg-[#E8F4FB] transition-colors">{data.heat}% heat</span>
                            <span className="font-mono text-[13px] text-[#6E8A96] opacity-60">{data.towns.length} towns</span>
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
                    <div className="px-6 py-2 text-[12px] font-bold text-[#6E8A96] uppercase tracking-wider bg-[#F7FBFF] border-b border-[#D4E8F0] border-t">
                      Towns
                    </div>
                    {allTowns
                      .filter(t => t.name.toLowerCase().includes(countySearch.toLowerCase()))
                      .filter(t => !selectedTowns.some(s => s.name === t.name))
                      .slice(0, 15)
                      .map(t => (
                        <div 
                          key={`${t.name}-${t.county}`}
                          className="px-6 py-4 text-base cursor-pointer hover:bg-[#F7FBFF] flex justify-between items-center border-b last:border-0 border-[#E8F4FB] group"
                          onClick={() => handleTownSelect(t)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium group-hover:text-[#0471A4] transition-colors">{t.name}</span>
                            <span className="font-mono text-[12px] text-[#6E8A96] uppercase">{t.county} County</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {NJ_ENRICHED[t.name] && (
                              <span className="font-mono text-[12px] text-[#6E8A96] bg-[#F7FBFF] px-2 py-1 rounded group-hover:bg-[#E8F4FB] transition-colors">{NJ_ENRICHED[t.name].saleToList}% heat</span>
                            )}
                            <span className="text-[#0471A4] opacity-0 group-hover:opacity-100 transition-opacity">Add +</span>
                          </div>
                        </div>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>

          {activeCounties.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {activeCounties.map(c => (
                  <div key={c} className="px-4 py-2 bg-[#E8F4FB] text-[#0471A4] rounded-full text-base font-bold border border-[#C8E6F5] flex items-center gap-2 shadow-sm">
                    <span>{c} County</span>
                    <button onClick={() => setActiveCounties(activeCounties.filter(x => x !== c))} className="hover:bg-[#0471A4] hover:text-white rounded-full p-0.5 transition-colors">✕</button>
                  </div>
                ))}
              </div>

              <div className="relative" ref={townDropdownRef}>
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <span className="text-[#6E8A96]">🏘️</span>
                </div>
                <input 
                  ref={townInputRef}
                  className="w-full pl-12 pr-6 py-3 border border-[#D4E8F0] rounded-full text-base shadow-sm hover:shadow-md focus:shadow-md focus:border-[#0471A4] outline-none transition-all bg-white"
                  placeholder={`Search towns in ${activeCounties.join(', ')}...`}
                  value={townSearch}
                  onChange={e => setTownSearch(e.target.value)}
                  onFocus={() => setShowTownDropdown(true)}
                />
                {showTownDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#D4E8F0] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[350px] overflow-y-auto">
                    {!townSearch && (
                      <div className="px-6 py-3 bg-[#F7FBFF] border-b border-[#D4E8F0] flex items-center justify-between">
                        <span className="font-mono text-[12px] text-[#0471A4] uppercase tracking-widest font-bold">Hottest Markets in {activeCounties.join(', ')}</span>
                        <span className="text-[12px] text-[#6E8A96] italic">Sorted by sale-to-list %</span>
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
                          className="px-6 py-4 text-base cursor-pointer hover:bg-[#F7FBFF] flex justify-between items-center border-b last:border-0 border-[#E8F4FB] group"
                          onClick={() => {
                            if (selectedTowns.length < 8) {
                              setSelectedTowns([...selectedTowns, t]);
                              setTownSearch('');
                              setShowTownDropdown(false);
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium group-hover:text-[#0471A4] transition-colors">{t.name}</span>
                            <span className="font-mono text-[12px] text-[#6E8A96] uppercase">{t.county} County</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {NJ_ENRICHED[t.name] && (
                              <span className="font-mono text-[12px] text-[#6E8A96] bg-[#F7FBFF] px-2 py-1 rounded group-hover:bg-[#E8F4FB] transition-colors">{NJ_ENRICHED[t.name].saleToList}% heat</span>
                            )}
                            {NJ_ENRICHED[t.name] ? 
                              <span className="font-mono text-[12px] px-2 py-1 bg-[#D4EDDE] text-[#1E5C38] rounded border border-[#A8D5B8]">✓ full data</span> : 
                              <span className="font-mono text-[12px] px-2 py-1 bg-[#FDEFC6] text-[#7A5200] rounded border border-[#F5D580]">partial</span>
                            }
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {selectedTowns.map((t) => (
              <div key={t.name} className="px-4 py-2 bg-[#E8F4FB] text-[#0471A4] rounded-full text-base font-bold border border-[#C8E6F5] flex items-center gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                <div className="flex flex-col leading-none">
                  <div className="flex items-center gap-1.5">
                    <span>{t.name}</span>
                    {NJ_ENRICHED[t.name] ? 
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E5C38]" title="Full data available"></span> : 
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A5200]" title="Partial data available"></span>
                    }
                  </div>
                  <span className="text-[11px] opacity-70 font-normal uppercase">{t.county}</span>
                </div>
                <button onClick={() => setSelectedTowns(selectedTowns.filter(x => x.name !== t.name))} className="hover:bg-[#0471A4] hover:text-white rounded-full p-0.5 transition-colors">✕</button>
              </div>
            ))}
          </div>

          <div className="bg-white/50 border border-[#D4E8F0] rounded-xl p-4 text-center max-w-lg mx-auto">
            <p className="text-[13px] text-[#6E8A96] font-mono leading-relaxed">
              <span className="font-bold text-[#1A1C1E]">Data Coverage:</span> We've enriched 50+ major towns across NJ with deep metrics (schools, safety, walkability). Other towns show "Partial Data" using basic Census estimates.
            </p>
          </div>

          {selectedTowns.length > 0 && (
            <div className="flex justify-center items-center gap-4 pt-4">
              <button 
                onClick={runComparison}
                className="px-10 py-4 bg-[#0471A4] text-white rounded-full text-lg font-bold hover:bg-[#035480] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                {selectedTowns.length === 1 ? 'View Town Data' : `Compare ${selectedTowns.length} Towns`}
              </button>
              <button 
                onClick={handleClearAll}
                className="px-8 py-4 bg-white text-[#6E8A96] border border-[#D4E8F0] rounded-full text-lg font-bold hover:bg-[#F7FBFF] hover:text-[#0471A4] transition-all shadow-sm hover:shadow-md"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {tooltip && (
        <div className="fixed bg-[#1A1C1E] text-white px-3 py-1 rounded text-sm font-mono pointer-events-none z-[100]" style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}>
          {tooltip.name} County
        </div>
      )}

      <div ref={resultsRef} className={`px-4 md:px-10 pb-20 w-full ${showResults ? 'block' : 'hidden'}`}>
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-7 h-7 border-3 border-[#C8E6F5] border-t-[#0471A4] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-mono text-sm text-[#6E8A96]">Loading comparison...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="font-serif text-3xl italic"><span className="not-italic">{selectedTowns.length === 1 ? selectedTowns[0].name : 'Town Comparison'}</span></h2>
                <div className="font-mono text-[13px] text-[#6E8A96] mt-1">{selectedTowns.length} towns · New Jersey · Enriched local data + Census ACS 2023</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[13px] text-[#6E8A96]">Sort</span>
                  {['fit', 'income', 'home', 'commute', 'schools', 'edu'].map(k => (
                    <button 
                      key={k}
                      onClick={() => setSortKey(k)}
                      className={`px-3 py-1 border border-[#D4E8F0] rounded-full text-[13px] font-mono transition-all ${sortKey === k ? 'bg-[#0471A4] text-white border-[#0471A4]' : 'bg-white text-[#3D4347] hover:border-[#0471A4]'}`}
                    >
                      {k === 'edu' ? 'Education' : k.charAt(0).toUpperCase() + k.slice(1)} {k === 'fit' ? 'score' : k === 'home' ? 'value' : ''}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleClearAll}
                  className="px-4 py-1 bg-white text-[#6E8A96] border border-[#D4E8F0] rounded-full text-[13px] font-mono hover:bg-[#F7FBFF] hover:text-[#0471A4] transition-all ml-2"
                >
                  Start Over
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#D4E8F0] rounded-xl overflow-hidden mb-10 shadow-sm">
              <button 
                onClick={() => setShowPrioritySettings(!showPrioritySettings)}
                className="w-full px-6 py-4 flex items-center justify-between bg-[#F7FBFF] hover:bg-[#E8F4FB] transition-colors"
              >
                <div className="flex items-baseline gap-3">
                  <h3 className="font-serif text-xl text-[#1A1C1E]">What matters most to you?</h3>
                  <p className="text-sm text-[#6E8A96] font-mono hidden sm:block">Drag to rank · top = highest priority</p>
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
                    <div className="p-6 pt-2 border-t border-[#D4E8F0]">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-4 py-1 font-mono text-[10px] text-[#6E8A96] uppercase tracking-widest opacity-60">
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
                                <div className="flex items-center gap-4 p-3 bg-[#F7FBFF] border border-[#D4E8F0] rounded-lg hover:border-[#0471A4] hover:bg-white transition-all shadow-sm hover:shadow-md">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-[#E8F4FB] flex items-center justify-center font-mono text-xs font-bold text-[#0471A4]">
                                      {i + 1}
                                    </div>
                                    <div>
                                      <div className="font-bold text-sm text-[#1A1C1E]">{dim.label}</div>
                                      <div className="text-[11px] text-[#6E8A96] font-mono">{dim.sub}</div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="px-2.5 py-1 bg-[#0471A4]/10 rounded-md border border-[#0471A4]/20">
                                      <span className="font-mono text-[10px] text-[#0471A4] font-bold uppercase">Weight x{rankToWeight(i, priorityOrder.length)}</span>
                                    </div>
                                    <GripVertical size={16} className="text-[#D4E8F0] group-hover/prio:text-[#0471A4] transition-colors" />
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
            <div className="hidden md:grid bg-white border border-[#D4E8F0] rounded-xl shadow-sm" style={{ gridTemplateColumns: `150px repeat(${sortedTowns.length}, 1fr)` }}>
              <div className="p-4 border-r border-[#D4E8F0] bg-white sticky left-0 z-10">
                <div className="font-mono text-[12px] text-[#6E8A96] uppercase tracking-widest">Town</div>
              </div>
              {sortedTowns.map(d => (
                <div 
                  key={d.name} 
                  className="p-4 text-white cursor-pointer hover:brightness-110 transition-all relative group/town" 
                  style={{ backgroundColor: d.color }}
                  onClick={() => setExpandedTown(expandedTown === d.name ? null : d.name)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-serif text-lg font-bold leading-tight">{d.name}</div>
                      <div className="font-mono text-[11px] opacity-60 uppercase tracking-wider">{d.county}</div>
                    </div>
                    <div className={`transition-transform duration-300 ${expandedTown === d.name ? 'rotate-180' : ''}`}>
                      <ChevronRight size={14} className="rotate-90 opacity-60 group-hover/town:opacity-100" />
                    </div>
                  </div>
                  <div className="font-mono text-[11px] opacity-60 mt-0.5">{d.hasFullData ? '✓ full data' : 'partial data'}</div>
                  <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-white/20 rounded-full font-mono text-[13px] group/fit relative">
                    <span>Fit</span><span className="text-base font-bold">{calcFitScore(d)}</span><span className="text-[12px] opacity-60">/100</span>
                    
                    {calcFitScore(d) >= 85 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FFD700] text-[#1A1C1E] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter whitespace-nowrap shadow-lg">
                        Perfect Match
                      </div>
                    )}
                  </div>

                  {/* Town Detail Dropdown */}
                  <AnimatePresence>
                    {expandedTown === d.name && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute top-full left-0 right-0 bg-[#1A1C1E] text-white z-50 shadow-2xl overflow-hidden border-t border-white/10"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="font-mono text-[11px] uppercase tracking-widest text-[#6E8A96]">Market Heat</span>
                            <span className="text-base font-bold text-[#0471A4]">{d.saleToList || 'N/A'}%</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="font-mono text-[10px] uppercase text-[#6E8A96]">Population</div>
                              <div className="text-sm font-bold">{d.pop ? d.pop.toLocaleString() : 'N/A'}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-mono text-[10px] uppercase text-[#6E8A96]">Education</div>
                              <div className="text-sm font-bold">{d.eduPct || 'N/A'}% Degree+</div>
                            </div>
                          </div>
                          <div className="pt-2">
                            <div className="font-mono text-[10px] uppercase text-[#6E8A96] mb-1">Quick Take</div>
                            <p className="text-[12px] leading-relaxed text-white/80 italic">
                              {d.hasFullData 
                                ? `${d.name} is a ${d.safetyLabel.toLowerCase()} community with ${d.schoolLabel} rated schools and a ${d.walkLabel.toLowerCase()} layout.`
                                : "Limited data available for this municipality. Estimates based on county-wide averages."}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {priorityOrder.map((key, rank) => {
                const dim = DIMS.find(d => d.key === key)!;
                return (
                  <React.Fragment key={key}>
                    <div className="p-3 border-t border-r border-[#D4E8F0] bg-[#F7FBFF] flex flex-col justify-center sticky left-0 z-20 group/dim relative">
                      <div className="flex items-center gap-1.5">
                        <div className="text-[12px] font-bold uppercase tracking-wider text-[#3D4347]">{dim.label}</div>
                        {(dim as any).hoverSub && (
                          <Info size={12} className="text-[#6E8A96] opacity-40 group-hover/dim:opacity-100 transition-opacity cursor-help" />
                        )}
                      </div>
                      <div className="text-[11px] text-[#6E8A96] font-mono leading-tight mt-0.5">{dim.sub}</div>
                      
                      {(dim as any).hoverSub && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-72 p-4 bg-[#1A1C1E] text-white text-[13px] font-mono rounded-2xl shadow-2xl z-[100] hidden group-hover/dim:block animate-in fade-in zoom-in-95 duration-200 pointer-events-none border border-white/10 backdrop-blur-xl">
                          <div className="relative">
                            <div className="absolute -left-[24px] top-1/2 -translate-y-1/2 border-[8px] border-transparent border-r-[#1A1C1E]"></div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1 h-3 bg-[#0471A4] rounded-full"></div>
                              <div className="text-[12px] text-[#6E8A96] uppercase tracking-[0.2em] font-bold opacity-80">Methodology</div>
                            </div>
                            <div className="leading-relaxed text-[#D4E8F0]">
                              {(dim as any).hoverSub}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-1 px-1.5 py-0.5 bg-[#1A1C1E] text-white text-[11px] font-mono rounded-full w-fit">x{rankToWeight(rank, priorityOrder.length)}</div>
                    </div>
                    {sortedTowns.map(d => {
                      const score = (d as any)[dim.scoreKey];
                      if (score == null) return <div key={d.name} className="p-3 border-t border-r border-[#D4E8F0] flex flex-col justify-center"><div className="text-base font-bold text-[#6E8A96]">N/A</div><div className="text-[12px] text-[#6E8A96] font-mono">data not available</div></div>;
                      
                      let valDisplay = '';
                      let subDisplay = '';
                      let tag = null;

                      if (key === 'income') { valDisplay = fmtDollar(d.income); subDisplay = 'household / yr'; tag = tagLabel(score, 'High income', 'Low income'); }
                      else if (key === 'home') { valDisplay = fmtDollar(d.homeVal); subDisplay = 'median home value'; tag = tagLabel(score, 'Affordable', 'Expensive'); }
                      else if (key === 'commute') { valDisplay = `${d.commute} min`; subDisplay = 'avg travel time'; }
                      else if (key === 'highway') { valDisplay = `${d.highwayRaw}/100`; subDisplay = 'Regional Access Score'; tag = tagLabel(score, 'Excellent', 'Limited'); }
                      else if (key === 'schools') { valDisplay = d.schoolLabel; subDisplay = 'Niche district rating'; tag = tagLabel(score, 'Top tier', 'Below avg'); }
                      else if (key === 'safety') { valDisplay = d.safetyLabel; subDisplay = `Score: ${d.safetyRaw}/100`; }
                      else if (key === 'taxes') { valDisplay = `${d.taxRate}%`; subDisplay = `~$${d.avgTax.toLocaleString()}/yr`; }
                      else if (key === 'walk') { valDisplay = `${d.walkRaw}/100`; subDisplay = d.walkLabel; }
                      else if (key === 'edu') { valDisplay = `${d.eduPct}%`; subDisplay = 'Bachelor\'s Degree+'; tag = tagLabel(score, 'Highly Educated', 'Mixed'); }
                      else if (key === 'market') { valDisplay = `${d.saleToList}%`; subDisplay = 'Sale-to-list (Last 90 Days)'; tag = tagLabel(score, 'Hot market', 'Cool market'); }

                      return (
                        <div key={d.name} className="p-3 border-t border-r border-[#D4E8F0] hover:bg-[#E8F4FB] transition-colors flex flex-col justify-center gap-1">
                          <div className="text-base font-bold text-[#1A1C1E]">{valDisplay}</div>
                          <div className="text-[12px] text-[#6E8A96] font-mono leading-tight">{subDisplay}</div>
                          <div className="h-1 bg-[#D4E8F0] rounded-full overflow-hidden mt-0.5">
                            <div className="h-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: barColor(score) }}></div>
                          </div>
                          {tag && <span className={`text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full w-fit font-mono ${tagClass(score)}`}>{tag}</span>}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden space-y-6">
              {sortedTowns.map(d => (
                <div key={d.name} className="bg-white border border-[#D4E8F0] rounded-xl overflow-hidden shadow-sm">
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
                        {calcFitScore(d) >= 85 && (
                          <span className="bg-[#FFD700] text-[#1A1C1E] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter">Perfect Match</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-[#D4E8F0]">
                    {priorityOrder.map((key, rank) => {
                      const dim = DIMS.find(dim => dim.key === key)!;
                      const score = (d as any)[dim.scoreKey];
                      if (score == null) return null;

                      let valDisplay = '';
                      let subDisplay = '';
                      if (key === 'income') { valDisplay = fmtDollar(d.income); subDisplay = 'household / yr'; }
                      else if (key === 'home') { valDisplay = fmtDollar(d.homeVal); subDisplay = 'median home value'; }
                      else if (key === 'commute') { valDisplay = `${d.commute} min`; subDisplay = 'avg travel time'; }
                      else if (key === 'highway') { valDisplay = `${d.highwayRaw}/100`; subDisplay = 'Regional Access'; }
                      else if (key === 'schools') { valDisplay = d.schoolLabel; subDisplay = 'Niche rating'; }
                      else if (key === 'safety') { valDisplay = d.safetyLabel; subDisplay = `Score: ${d.safetyRaw}/100`; }
                      else if (key === 'taxes') { valDisplay = `${d.taxRate}%`; subDisplay = `~$${d.avgTax.toLocaleString()}/yr`; }
                      else if (key === 'walk') { valDisplay = `${d.walkRaw}/100`; subDisplay = d.walkLabel; }
                      else if (key === 'edu') { valDisplay = `${d.eduPct}%`; subDisplay = 'Bachelor\'s Degree+'; }
                      else if (key === 'market') { valDisplay = `${d.saleToList}%`; subDisplay = 'Sale-to-list'; }

                      return (
                        <div key={key} className="p-4 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[10px] text-[#6E8A96] uppercase tracking-widest">#{rank + 1}</span>
                              <span className="font-bold text-[13px] text-[#3D4347] uppercase tracking-tight">{dim.label}</span>
                            </div>
                            <div className="text-base font-bold text-[#1A1C1E]">{valDisplay}</div>
                            <div className="text-[11px] text-[#6E8A96] font-mono">{subDisplay}</div>
                          </div>
                          <div className="w-24 flex flex-col items-end gap-1.5">
                            <div className="w-full h-1.5 bg-[#D4E8F0] rounded-full overflow-hidden">
                              <div className="h-full" style={{ width: `${score}%`, backgroundColor: barColor(score) }}></div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full font-mono whitespace-nowrap ${tagClass(score)}`}>
                              {tagLabel(score, 'High', 'Low')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[13px] font-mono text-[#6E8A96] mt-4 text-center">
              Sources: <a href="https://www.census.gov" className="text-[#0471A4] hover:underline">US Census ACS 2023</a> · Niche school ratings · NJ property tax records · WalkScore
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
