import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Users, Bell, TrendingDown, TrendingUp, 
  Share2, MapPin, Search, ArrowRight, Sun, 
  ThermometerSun, CheckCircle2, RefreshCw, Sparkles, Plane,
  Bookmark, SlidersHorizontal, Clock, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { logVisit } from '../lib/analytics';

// --- Types ---
interface TripIntelligence {
  title: string;
  subtitle: string;
  summary: string;
  whyVisit: string;
  whenToVisit: string;
  weatherCard: {
    condition: "Sunny" | "Partly Cloudy" | "Rainy" | "Snow";
    tempHigh: number;
    tempLow: number;
    note: string;
    month: string;
  };
  monthlyData: { month: string; flightCost: number; temp: number; isIdeal: boolean }[];
  topActivities: {
    title: string;
    description: string;
    imageKeyword: string;
  }[];
  seasonalHighlights: {
    title: string;
    description: string;
    timeOfYear: string;
  }[];
}

// --- Fallback Data ---
const fallbackIntelligence: TripIntelligence = {
  title: "The Ultimate",
  subtitle: "Kyoto Experience",
  summary: "The perfect balance of pleasant autumn weather, stunning fall foliage, and manageable crowds.",
  whyVisit: "Kyoto is the cultural heart of Japan, offering an unparalleled glimpse into the country's rich history. Visitors are drawn to its thousands of classical Buddhist temples, Shinto shrines, traditional wooden houses, and geisha districts.",
  whenToVisit: "Spring (March-May) for cherry blossoms and Autumn (September-November) for vibrant red foliage are the most popular and beautiful times to visit, though they bring the largest crowds.",
  weatherCard: {
    condition: "Sunny",
    tempHigh: 68,
    tempLow: 52,
    note: "Crisp autumn air, perfect for temple walks.",
    month: "October"
  },
  monthlyData: [
    { month: "JAN", flightCost: 850, temp: 48, isIdeal: false },
    { month: "FEB", flightCost: 820, temp: 50, isIdeal: false },
    { month: "MAR", flightCost: 1100, temp: 57, isIdeal: false },
    { month: "APR", flightCost: 1450, temp: 68, isIdeal: true },
    { month: "MAY", flightCost: 1200, temp: 75, isIdeal: false },
    { month: "JUN", flightCost: 1350, temp: 82, isIdeal: false },
    { month: "JUL", flightCost: 1500, temp: 89, isIdeal: false },
    { month: "AUG", flightCost: 1450, temp: 91, isIdeal: false },
    { month: "SEP", flightCost: 1100, temp: 84, isIdeal: false },
    { month: "OCT", flightCost: 950, temp: 73, isIdeal: true },
    { month: "NOV", flightCost: 1250, temp: 62, isIdeal: true },
    { month: "DEC", flightCost: 1050, temp: 53, isIdeal: false },
  ],
  topActivities: [
    {
      title: "Fushimi Inari Shrine",
      description: "Hike through thousands of iconic vermilion torii gates winding up the sacred mountain.",
      imageKeyword: "torii"
    },
    {
      title: "Arashiyama Bamboo Grove",
      description: "Walk along the serene paths surrounded by towering, swaying bamboo stalks.",
      imageKeyword: "bamboo"
    },
    {
      title: "Traditional Tea Ceremony",
      description: "Experience the tranquil art of matcha preparation in a centuries-old teahouse.",
      imageKeyword: "matcha"
    },
    {
      title: "Gion District Stroll",
      description: "Wander through the historic entertainment district, keeping an eye out for geiko and maiko.",
      imageKeyword: "gion"
    }
  ],
  seasonalHighlights: [
    {
      title: "Cherry Blossom Season",
      description: "The city turns pink as sakura bloom along the Philosopher's Path and Maruyama Park.",
      timeOfYear: "Early April"
    },
    {
      title: "Gion Matsuri",
      description: "One of Japan's most famous festivals, featuring massive, ornate floats parading through the streets.",
      timeOfYear: "July"
    },
    {
      title: "Autumn Foliage Illuminations",
      description: "Historic temples light up their gardens at night, creating a magical atmosphere among the red maple leaves.",
      timeOfYear: "Late November"
    }
  ]
};

// --- Demo Data for Featured Destinations ---
const DEMO_DATA: Record<string, TripIntelligence> = {
  "Paris, France": {
    title: "The Romantic",
    subtitle: "Parisian Escape",
    summary: "Experience the City of Light during its most enchanting months with mild weather and fewer crowds.",
    whyVisit: "Paris is a global center for art, fashion, gastronomy, and culture. Its 19th-century cityscape is crisscrossed by wide boulevards and the River Seine.",
    whenToVisit: "Late Spring (May-June) and Early Fall (September-October) offer the best balance of pleasant weather and manageable tourist numbers.",
    weatherCard: {
      condition: "Partly Cloudy",
      tempHigh: 68,
      tempLow: 54,
      note: "Perfect for cafe sitting and museum hopping.",
      month: "June"
    },
    monthlyData: [
      { month: "JAN", flightCost: 650, temp: 45, isIdeal: false },
      { month: "FEB", flightCost: 620, temp: 47, isIdeal: false },
      { month: "MAR", flightCost: 750, temp: 54, isIdeal: false },
      { month: "APR", flightCost: 950, temp: 61, isIdeal: false },
      { month: "MAY", flightCost: 1100, temp: 68, isIdeal: true },
      { month: "JUN", flightCost: 1300, temp: 73, isIdeal: true },
      { month: "JUL", flightCost: 1500, temp: 77, isIdeal: false },
      { month: "AUG", flightCost: 1450, temp: 77, isIdeal: false },
      { month: "SEP", flightCost: 1100, temp: 70, isIdeal: true },
      { month: "OCT", flightCost: 850, temp: 61, isIdeal: false },
      { month: "NOV", flightCost: 700, temp: 52, isIdeal: false },
      { month: "DEC", flightCost: 900, temp: 46, isIdeal: false },
    ],
    topActivities: [
      { title: "Louvre Museum", description: "Explore the world's largest art museum and a historic monument in Paris.", imageKeyword: "louvre" },
      { title: "Eiffel Tower Picnic", description: "Enjoy a classic French picnic on the Champ de Mars with stunning tower views.", imageKeyword: "eiffel" },
      { title: "Montmartre Wander", description: "Climb the hill to Sacré-Cœur for panoramic views and artistic history.", imageKeyword: "montmartre" },
      { title: "Seine River Cruise", description: "See the city's iconic landmarks from a different perspective at sunset.", imageKeyword: "seine" }
    ],
    seasonalHighlights: [
      { title: "Paris Fashion Week", description: "The city buzzes with style and high-profile events.", timeOfYear: "Sept/Oct" },
      { title: "Bastille Day", description: "National celebrations with fireworks and parades.", timeOfYear: "July 14" },
      { title: "Christmas Markets", description: "Festive lights and artisanal crafts across the city.", timeOfYear: "December" }
    ]
  },
  "Tokyo, Japan": {
    title: "The Neon",
    subtitle: "Tokyo Odyssey",
    summary: "A seamless blend of futuristic technology and ancient tradition in the world's most populous city.",
    whyVisit: "Tokyo offers an unlimited choice of shopping, entertainment, culture, and dining. It's a city that never sleeps, yet maintains incredible order and safety.",
    whenToVisit: "Spring (March-April) for cherry blossoms and Autumn (October-November) for mild weather and fall colors.",
    weatherCard: {
      condition: "Sunny",
      tempHigh: 72,
      tempLow: 58,
      note: "Crisp, clear days ideal for urban exploration.",
      month: "November"
    },
    monthlyData: [
      { month: "JAN", flightCost: 950, temp: 50, isIdeal: false },
      { month: "FEB", flightCost: 920, temp: 51, isIdeal: false },
      { month: "MAR", flightCost: 1200, temp: 57, isIdeal: true },
      { month: "APR", flightCost: 1500, temp: 66, isIdeal: true },
      { month: "MAY", flightCost: 1300, temp: 73, isIdeal: false },
      { month: "JUN", flightCost: 1100, temp: 78, isIdeal: false },
      { month: "JUL", flightCost: 1400, temp: 85, isIdeal: false },
      { month: "AUG", flightCost: 1450, temp: 88, isIdeal: false },
      { month: "SEP", flightCost: 1150, temp: 80, isIdeal: false },
      { month: "OCT", flightCost: 1000, temp: 71, isIdeal: true },
      { month: "NOV", flightCost: 950, temp: 62, isIdeal: true },
      { month: "DEC", flightCost: 1100, temp: 54, isIdeal: false },
    ],
    topActivities: [
      { title: "Shibuya Crossing", description: "Experience the world's busiest pedestrian intersection.", imageKeyword: "shibuya" },
      { title: "Senso-ji Temple", description: "Visit Tokyo's oldest and most significant Buddhist temple.", imageKeyword: "temple" },
      { title: "Akihabara Tech Tour", description: "Dive into the heart of anime, gaming, and electronics culture.", imageKeyword: "akihabara" },
      { title: "Tsukiji Outer Market", description: "Sample the freshest sushi and street food in the city.", imageKeyword: "sushi" }
    ],
    seasonalHighlights: [
      { title: "Sakura Season", description: "Cherry blossoms transform the city into a pink wonderland.", timeOfYear: "Late March" },
      { title: "Sumida River Fireworks", description: "One of the oldest and largest fireworks displays in Japan.", timeOfYear: "July" },
      { title: "Meiji Jingu New Year", description: "Join millions for the first shrine visit of the year.", timeOfYear: "Jan 1" }
    ]
  }
};

// --- Sleek Modern Logo ---
const WavesLogo = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20C4 20 10 12 16 20C22 28 28 20 28 20" stroke="url(#logo_grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 14C8 14 12 8 16 14C20 20 24 14 24 14" stroke="url(#logo_grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    <defs>
      <linearGradient id="logo_grad" x1="4" y1="20" x2="28" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#818CF8" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Waves() {
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [intelligence, setIntelligence] = useState<TripIntelligence | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Geocoding Search
  useEffect(() => {
    if (destination.length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=5`);
        const data = await res.json();
        if (data.results) {
          setSuggestions(data.results.map((r: any) => `${r.name}, ${r.admin1 ? r.admin1 + ', ' : ''}${r.country}`));
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        console.error("Geocoding error", e);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [destination]);

  useEffect(() => {
    document.title = "Waves | Dream Trip Planner";
    logVisit('/waves');
  }, []);

  const fetchDestinationIntelligence = async (dest: string) => {
    // Check for Demo Data first to bypass API
    const demoMatch = Object.keys(DEMO_DATA).find(key => 
      key.toLowerCase().includes(dest.toLowerCase()) || dest.toLowerCase().includes(key.toLowerCase())
    );

    if (demoMatch) {
      setIsSearching(true);
      setTimeout(() => {
        setIntelligence(DEMO_DATA[demoMatch]);
        setHasSearched(true);
        setIsSearching(false);
      }, 800);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are an expert travel planner. The user wants to travel to: ${dest}.
        Provide a comprehensive, highly detailed destination guide.
        Format the response exactly as a JSON object with these keys:
        - "title": Catchy title (e.g., "The Ultimate").
        - "subtitle": Destination name (e.g., "Kyoto Experience").
        - "summary": 2-3 sentences summarizing the vibe and overall appeal.
        - "whyVisit": 2-3 sentences on why people visit this location.
        - "whenToVisit": 2-3 sentences on the best times to visit and crowd levels.
        - "weatherCard": { "condition": "Sunny" | "Partly Cloudy" | "Rainy" | "Snow", "tempHigh": number, "tempLow": number, "note": string (e.g., "Perfect beach weather"), "month": string (e.g., "October" or "Peak Summer") } representing the absolute BEST time to visit.
        - "monthlyData": Array of exactly 12 objects (Jan-Dec). Each has: "month" (e.g., "JAN"), "flightCost" (estimated average round-trip flight cost in USD from a major global hub, number), "temp" (average high temperature in Fahrenheit, number), and "isIdeal" (boolean, true for the 2-3 best months to visit).
        - "topActivities": Array of exactly 4 objects representing the best things to do year-round. Each has "title", "description", and "imageKeyword" (single word for fetching an image).
        - "seasonalHighlights": Array of exactly 3 objects for specific times of year. Each has "title", "description", "timeOfYear" (e.g., "Late Autumn").
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      
      const text = response.text || "{}";
      const data = JSON.parse(text);
      setIntelligence(data);
      setHasSearched(true);
    } catch (err: any) {
      console.error("Failed to fetch insights:", err);
      if (err?.message?.includes('429') || err?.message?.toLowerCase().includes('quota')) {
        setError("Search limit reached. Please wait a minute or add your own Gemini API key in Settings.");
      } else {
        setError("Failed to analyze destination. Please try another location or try again.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      fetchDestinationIntelligence(destination);
    }
  };

  if (!hasSearched) {
    return (
      <div className="min-h-screen bg-[#050B14] text-slate-300 font-sans selection:bg-cyan-500/30 flex flex-col">
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050B14]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <WavesLogo />
              <span className="text-white font-medium tracking-widest text-sm uppercase group-hover:text-cyan-400 transition-colors">Waves</span>
            </Link>
          </div>
        </nav>

        <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-3xl"
          >
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white mb-8 text-center font-serif">
              Where will the <span className="italic text-cyan-400">waves</span> take you?
            </h1>
            
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-[2rem] blur-lg opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-[#0B1221]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 flex flex-col md:flex-row items-center gap-4 shadow-2xl">
                
                <div className="flex-1 flex items-center w-full bg-white/5 rounded-2xl px-6 py-4 border border-white/5 hover:border-white/10 transition-colors">
                  <Sparkles size={24} className="text-cyan-400 mr-4" />
                  <div className="flex-1 relative">
                    <label className="block text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">Dream Location</label>
                    <input 
                      type="text" 
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full bg-transparent border-none outline-none font-light text-lg md:text-xl text-white placeholder:text-slate-600 tracking-wide"
                      placeholder="e.g., Kyoto, Japan or The Amalfi Coast"
                      autoFocus
                    />
                    
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && destination.trim() && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-4 bg-[#0B1221]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl">
                        {suggestions.map((dest) => (
                          <button
                            key={dest}
                            type="button"
                            onClick={() => {
                              setDestination(dest);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-6 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                          >
                            {dest}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSearching || !destination.trim()}
                  className="w-full md:w-auto h-full min-h-[72px] px-10 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl text-white text-[11px] uppercase tracking-[0.2em] font-medium hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSearching ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                  <span className="md:hidden">Analyze Trip</span>
                </button>
              </div>
              {error && (
                <div className="absolute -bottom-12 left-0 w-full text-center text-rose-400 text-sm">
                  {error}
                </div>
              )}
            </form>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <p className="w-full text-center text-[10px] uppercase tracking-widest text-slate-500 mb-2">Featured Destinations (Instant Load)</p>
              {Object.keys(DEMO_DATA).map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setDestination(city);
                    fetchDestinationIntelligence(city);
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
                >
                  <MapPin size={12} className="text-cyan-400" />
                  {city.split(',')[0]}
                </button>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const data = intelligence || fallbackIntelligence;

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-300 font-sans selection:bg-cyan-500/30 flex flex-col lg:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full lg:w-[380px] bg-[#0B1221] border-r border-white/5 flex flex-col shrink-0 lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
        <div className="p-8 pb-4">
          <Link to="/" className="flex items-center gap-3 group mb-12">
            <WavesLogo />
            <span className="text-white font-medium tracking-widest text-sm uppercase group-hover:text-cyan-400 transition-colors">Waves</span>
          </Link>

          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">Trip Overview</p>
          <h2 className="text-4xl text-white font-serif leading-tight mb-12">
            {data.title} <br/>
            <span className="italic text-cyan-400">{data.subtitle}.</span>
          </h2>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"></span>
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-medium">Optimal Window Found</span>
            </div>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              Analyzing historical weather data, crowd levels, and local events to find the perfect time for your trip.
            </p>
          </div>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Change Destination..."
              className="w-full bg-transparent border border-white/10 rounded-full py-3 px-5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/50 outline-none transition-colors"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-cyan-400 transition-colors">
              {isSearching ? <RefreshCw size={14} className="animate-spin" /> : <SlidersHorizontal size={14} />}
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        
        {/* Top Nav */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-6 text-xs uppercase tracking-widest text-slate-400 font-medium">
            <button 
              onClick={() => setHasSearched(false)}
              className="flex items-center gap-2 hover:text-white transition-colors text-cyan-400"
            >
              <ArrowRight size={14} className="rotate-180" /> Back to Search
            </button>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <MapPin size={14} /> Region View
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all">
              <Bookmark size={16} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all">
              <Share2 size={16} />
            </button>
          </div>
        </header>

        {/* The Draw: Why & When */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl text-white font-serif mb-4">The Draw</h3>
            <p className="text-slate-400 font-light leading-relaxed">
              {data.whyVisit}
            </p>
          </div>
          <div>
            <h3 className="text-2xl text-white font-serif mb-4">When to Go</h3>
            <p className="text-slate-400 font-light leading-relaxed">
              {data.whenToVisit}
            </p>
          </div>
        </section>

        {/* Year-Round Flights & Climate */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl text-white font-serif">Year-Round Flights & Climate</h2>
          </div>

          <div className="bg-[#0B1221]/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
            
            {/* Weather Card Overlay */}
            <div className="absolute top-8 right-8 z-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl max-w-[240px]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-medium">Ideal in {data.weatherCard.month}</span>
                {data.weatherCard.condition.includes('Sun') ? <Sun size={20} className="text-amber-400" /> : <ThermometerSun size={20} className="text-cyan-400" />}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl text-white font-light">{data.weatherCard.tempHigh}°</span>
                <span className="text-lg text-slate-400">/ {data.weatherCard.tempLow}°F</span>
              </div>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                {data.weatherCard.note}
              </p>
            </div>

            {/* 12-Month Chart */}
            <div className="pt-24 pb-4">
              <div className="flex items-end justify-between h-64 gap-1 md:gap-2 relative z-10">
                {(() => {
                  const maxCost = Math.max(...data.monthlyData.map(d => d.flightCost), 500);
                  return data.monthlyData.map((item, i) => {
                    const heightPercent = Math.max(15, (item.flightCost / maxCost) * 100);
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full">
                        <div className="w-full relative flex items-end justify-center h-full">
                          {item.isIdeal && (
                            <div className="absolute -top-6 flex flex-col items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] animate-pulse"></span>
                            </div>
                          )}
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                            className={`w-full max-w-[48px] rounded-t-sm transition-all duration-500 relative group-hover:opacity-100 ${
                              item.isIdeal 
                                ? 'bg-gradient-to-t from-cyan-900/50 to-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] opacity-100' 
                                : 'bg-white/10 opacity-50 group-hover:bg-white/20'
                            }`}
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#050B14] border border-white/10 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap flex flex-col items-center shadow-xl">
                              <span className="text-white font-medium text-sm">${item.flightCost}</span>
                              <span className="text-slate-400 text-[10px] uppercase tracking-widest">{item.temp}°F Avg</span>
                            </div>
                          </motion.div>
                        </div>
                        <span className={`text-[10px] tracking-widest uppercase ${item.isIdeal ? 'text-cyan-400 font-medium' : 'text-slate-500'}`}>
                          {item.month}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Split Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          
          {/* Top Activities */}
          <section className="xl:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles size={20} className="text-white" />
              <h3 className="text-2xl text-white font-serif">Top Activities</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.topActivities.map((item, i) => (
                <div key={i} className="relative rounded-3xl overflow-hidden h-64 group">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                    style={{ backgroundImage: `url(https://picsum.photos/seed/${item.imageKeyword}/600/400)` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/60 to-transparent" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <h4 className="text-xl text-white font-serif mb-2">{item.title}</h4>
                    <p className="text-slate-400 font-light text-xs leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Seasonal Highlights */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Calendar size={20} className="text-white" />
              <h3 className="text-2xl text-white font-serif">Seasonal Highlights</h3>
            </div>
            
            <div className="relative pl-6 border-l border-white/10 space-y-10">
              {data.seasonalHighlights.map((item, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-[#050B14] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]`} />
                  
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[9px] uppercase tracking-widest font-medium text-cyan-400">
                      {item.timeOfYear}
                    </span>
                  </div>
                  
                  <h4 className="text-white font-medium mb-2">{item.title}</h4>
                  <p className="text-slate-400 text-sm font-light leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl flex gap-4">
              <AlertCircle size={20} className="text-cyan-400 shrink-0" />
              <div>
                <h5 className="text-sm text-white font-medium mb-1">System Confidence: 94%</h5>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Predictive model based on aggregated hospitality data, satellite weather history spanning 1990-2023.
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
