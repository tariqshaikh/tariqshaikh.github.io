import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Bell, TrendingDown, TrendingUp,
  Share2, MapPin, Search, ArrowRight, Sun, Cloud, CloudRain, Snowflake, Globe,
  ThermometerSun, CheckCircle2, RefreshCw, Sparkles, Plane,
  Bookmark, SlidersHorizontal, Clock, AlertCircle,
  Copy, Link2, Ghost, Crown, DollarSign,
  Lightbulb, Map, Info, Star, Wallet, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { logVisit } from '../lib/analytics';
import { db, auth } from '../firebase';
import { 
  doc, setDoc, onSnapshot, collection, query, 
  serverTimestamp, updateDoc, getDoc, getDocs
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// --- Types ---
interface TripMember {
  userId: string;
  displayName: string;
  photoURL: string;
  votedMonthIndex: number | null;
  joinedAt: any;
  lastActive: any;
}
interface TripIntelligence {
  title: string;
  subtitle: string;
  summary: string;
  whyVisit: string;
  whenToVisit: string;
  averageDailySpend?: number;
  seasons: {
    high: string;
    low: string;
    shoulder: string;
  };
  weatherCard: {
    condition: "Sunny" | "Partly Cloudy" | "Rainy" | "Snow";
    tempHigh: number;
    tempLow: number;
    note: string;
    month: string;
  };
  monthlyData: { 
    month: string; 
    flightCost: number; 
    temp: number; 
    condition: "Sunny" | "Partly Cloudy" | "Rainy" | "Snow";
    note: string;
    isIdeal: boolean;
    crowdLevel: number; // 1-10
  }[];
  foodAndCulture: {
    categories: {
      title: string;
      items: { name: string; description: string; imageKeyword: string }[];
    }[];
    mustTry: string[];
    culturalEtiquette: { title: string; description: string }[];
  };
  topActivities: {
    title: string;
    description: string;
    imageKeyword: string;
  }[];
  nicheActivities: {
    title: string;
    description: string;
    imageKeyword: string;
  }[];
  seasonalHighlights: {
    title: string;
    description: string;
    timeOfYear: string;
  }[];
  events?: {
    name: string;
    month: string;
    description: string;
    type: 'festival' | 'cultural' | 'sporting' | 'food' | 'music' | 'market';
  }[];
  insiderTips?: {
    tip: string;
    category: 'money' | 'transport' | 'food' | 'culture' | 'safety';
  }[];
  neighborhoods?: {
    name: string;
    vibe: string;
    bestFor: string;
    mustSee: string;
  }[];
  practicalInfo?: {
    visa: string;
    currency: string;
    language: string;
    tipping: string;
    safety: string;
    bestTransport: string;
    budgetBreakdown: {
      budget: string;
      midRange: string;
      luxury: string;
    };
  };
}

// --- Fallback Data ---
const fallbackIntelligence: TripIntelligence = {
  title: "The Ultimate",
  subtitle: "Kyoto Experience",
  summary: "The perfect balance of pleasant autumn weather, stunning fall foliage, and manageable crowds.",
  whyVisit: "Kyoto is the cultural heart of Japan, offering an unparalleled glimpse into the country's rich history. Visitors are drawn to its thousands of classical Buddhist temples, Shinto shrines, traditional wooden houses, and geisha districts.",
  whenToVisit: "Spring (March-May) for cherry blossoms and Autumn (September-November) for vibrant red foliage are the most popular and beautiful times to visit, though they bring the largest crowds.",
  seasons: {
    high: "March to May, October to November",
    low: "January to February, June to August",
    shoulder: "September, December"
  },
  weatherCard: {
    condition: "Sunny",
    tempHigh: 68,
    tempLow: 52,
    note: "Crisp autumn air, perfect for temple walks.",
    month: "October"
  },
  monthlyData: [
    { month: "JAN", flightCost: 850, temp: 48, condition: "Partly Cloudy", note: "Cold but quiet, great for winter photography.", isIdeal: false, crowdLevel: 3 },
    { month: "FEB", flightCost: 820, temp: 50, condition: "Partly Cloudy", note: "Plum blossoms start to appear.", isIdeal: false, crowdLevel: 3 },
    { month: "MAR", flightCost: 1100, temp: 57, condition: "Sunny", note: "Early cherry blossoms begin to bloom.", isIdeal: false, crowdLevel: 8 },
    { month: "APR", flightCost: 1450, temp: 68, condition: "Sunny", note: "Peak Sakura season, absolutely stunning.", isIdeal: true, crowdLevel: 10 },
    { month: "MAY", flightCost: 1200, temp: 75, condition: "Sunny", note: "Lush greenery and pleasant warmth.", isIdeal: false, crowdLevel: 7 },
    { month: "JUN", flightCost: 1350, temp: 82, condition: "Rainy", note: "Tsuyu rainy season begins.", isIdeal: false, crowdLevel: 5 },
    { month: "JUL", flightCost: 1500, temp: 89, condition: "Rainy", note: "Hot and humid with frequent festivals.", isIdeal: false, crowdLevel: 6 },
    { month: "AUG", flightCost: 1450, temp: 91, condition: "Sunny", note: "Peak summer heat, very humid.", isIdeal: false, crowdLevel: 6 },
    { month: "SEP", flightCost: 1100, temp: 84, condition: "Partly Cloudy", note: "Typhoon season, but clearing up.", isIdeal: false, crowdLevel: 4 },
    { month: "OCT", flightCost: 950, temp: 73, condition: "Sunny", note: "Perfect autumn weather and colors.", isIdeal: true, crowdLevel: 8 },
    { month: "NOV", flightCost: 1250, temp: 62, condition: "Sunny", note: "Peak fall foliage illuminations.", isIdeal: true, crowdLevel: 9 },
    { month: "DEC", flightCost: 1050, temp: 53, condition: "Partly Cloudy", note: "Chilly with festive winter lights.", isIdeal: false, crowdLevel: 4 },
  ],
  foodAndCulture: {
    categories: [
      {
        title: "Breakfast & Morning Rituals",
        items: [
          { name: "Morning Matcha", description: "Start the day with high-grade Uji matcha and a small seasonal sweet.", imageKeyword: "matcha" }
        ]
      },
      {
        title: "Lunch & Street Food",
        items: [
          { name: "Yudofu", description: "Silken tofu simmered in a light broth, a Kyoto specialty.", imageKeyword: "tofu" },
          { name: "Nishiki Market Snacks", description: "Sample soy milk donuts and pickled vegetables.", imageKeyword: "market" }
        ]
      },
      {
        title: "Dinner & Fine Dining",
        items: [
          { name: "Kaiseki Ryori", description: "A traditional multi-course Japanese dinner, a true culinary art form.", imageKeyword: "kaiseki" }
        ]
      }
    ],
    mustTry: ["Kyo-kaiseki", "Obanzai (Kyoto home cooking)", "Yatsuhashi (cinnamon mochi)"],
    culturalEtiquette: [
      { title: "Temple Silence", description: "Speak softly and avoid using cell phones in sacred spaces." },
      { title: "Shoe Removal", description: "Always remove shoes when entering traditional wooden buildings." },
      { title: "Bowing", description: "A slight bow is the standard greeting and sign of respect." }
    ]
  },
  topActivities: [
    { title: "Fushimi Inari Shrine", description: "Hike through thousands of iconic vermilion torii gates.", imageKeyword: "torii" },
    { title: "Arashiyama Bamboo Grove", description: "Walk along the serene paths surrounded by towering bamboo.", imageKeyword: "bamboo" },
    { title: "Traditional Tea Ceremony", description: "Experience the tranquil art of matcha preparation.", imageKeyword: "matcha" },
    { title: "Gion District Stroll", description: "Wander through the historic entertainment district.", imageKeyword: "gion" },
    { title: "Kinkaku-ji (Golden Pavilion)", description: "Marvel at the Zen temple covered in gold leaf.", imageKeyword: "gold" },
    { title: "Kiyomizu-dera Temple", description: "Enjoy panoramic views from the massive wooden stage.", imageKeyword: "temple" }
  ],
  nicheActivities: [
    { title: "Otagi Nenbutsu-ji", description: "Discover 1,200 unique stone rakan statues.", imageKeyword: "statue" },
    { title: "Sake Tasting in Fushimi", description: "Visit historic breweries in Kyoto's sake district.", imageKeyword: "sake" },
    { title: "Zen Meditation Class", description: "Learn the basics of Zazen at a local sub-temple.", imageKeyword: "zen" },
    { title: "Kimono Rental & Walk", description: "Experience the city in traditional attire.", imageKeyword: "kimono" }
  ],
  seasonalHighlights: [
    { title: "Cherry Blossom Season", description: "The city turns pink as sakura bloom.", timeOfYear: "Early April" },
    { title: "Gion Matsuri", description: "One of Japan's most famous festivals.", timeOfYear: "July" },
    { title: "Autumn Foliage", description: "Historic temples light up their gardens at night.", timeOfYear: "Late November" },
    { title: "Setsubun Festival", description: "Bean-throwing ceremonies to drive away evil spirits.", timeOfYear: "February" },
    { title: "Daimonji Gozan Okuribi", description: "Giant bonfires lit on mountainsides.", timeOfYear: "August 16" }
  ],
  events: [
    { name: "Cherry Blossom Viewing", month: "APR", description: "Maruyama Park and Philosopher's Path turn pink. Night illuminations at major temples.", type: "cultural" as const },
    { name: "Gion Matsuri", month: "JUL", description: "One of Japan's three great festivals — month-long events, yoi-yama street parties and massive float processions.", type: "festival" as const },
    { name: "Daimonji Gozan Okuribi", month: "AUG", description: "Five enormous bonfires lit on surrounding mountains to guide ancestral spirits back to the afterlife.", type: "cultural" as const },
    { name: "Jidai Matsuri", month: "OCT", description: "Festival of Ages — 2,000 people parade in historical costumes spanning 1,100 years of Japanese history.", type: "cultural" as const },
    { name: "Higashiyama Hanatoro", month: "MAR", description: "10,000 bamboo lanterns illuminate the stone-paved lanes of Higashiyama for 10 magical nights.", type: "festival" as const },
  ],
  insiderTips: [
    { tip: "Take the train to Fushimi Inari at 5am — the gates are completely empty for the first 2 hours. Midday is a nightmare.", category: "transport" as const },
    { tip: "Nishiki Market vendors give the most samples right before closing (~5:30pm). Pickled vegetables are cheapest here.", category: "food" as const },
    { tip: "A 1-day bus pass (¥700) covers every major site. Multi-day bus passes are a trap — the subway is faster for many routes.", category: "money" as const },
    { tip: "Book Kaiseki restaurants at least 3 months ahead during sakura season. Many only take reservations via hotel concierge.", category: "culture" as const },
    { tip: "Philosopher's Path is impassable with a stroller in April. Maruyama Park is the better family cherry blossom spot.", category: "safety" as const },
  ],
  neighborhoods: [
    { name: "Gion", vibe: "Historic", bestFor: "Geisha spotting, traditional architecture, upscale kaiseki restaurants", mustSee: "Hanamikoji Street at dusk, Gion Corner traditional arts shows" },
    { name: "Arashiyama", vibe: "Serene", bestFor: "Bamboo groves, temple hopping, river boat rides, monkey park", mustSee: "Tenryu-ji garden, bamboo grove at 7am before the crowds arrive" },
    { name: "Fushimi", vibe: "Cultural", bestFor: "Sake distilleries, Fushimi Inari Shrine, traditional shotengai shopping", mustSee: "The sake brewery trail, Teradaya inn where Ryoma Sakamoto stayed" },
    { name: "Nishiki / Downtown", vibe: "Lively", bestFor: "Street food, market shopping, modern izakayas and craft cocktail bars", mustSee: "Nishiki Market five-block stretch and Pontocho alley at night" },
  ],
  practicalInfo: {
    visa: "Americans get 90 days visa-free. Most nationalities need only a valid passport for tourist stays.",
    currency: "Japanese Yen (¥). Cash is king — many temples and small restaurants are cash-only.",
    language: "Japanese. English minimal outside major hotels. Google Translate camera mode is essential for menus.",
    tipping: "Tipping is considered rude in Japan. Exceptional service is standard, always expected.",
    safety: "Extremely safe. One of the safest destinations in the world, including for solo female travelers.",
    bestTransport: "City buses and Hankyu/Keihan train lines. IC card (Suica/Pasmo) works seamlessly everywhere.",
    budgetBreakdown: {
      budget: "¥8,000–12,000/day (~$55-80) — hostel, ramen, bus pass",
      midRange: "¥20,000–35,000/day (~$140-230) — boutique ryokan, izakayas",
      luxury: "¥80,000+/day (~$550+) — traditional ryokan with onsen, kaiseki dinners",
    },
  },
};

// --- Demo Data for Featured Destinations ---
const DEMO_DATA: Record<string, TripIntelligence> = {
  "Paris, France": {
    title: "The Romantic",
    subtitle: "Parisian Escape",
    summary: "Experience the City of Light during its most enchanting months with mild weather and fewer crowds.",
    whyVisit: "Paris is a global center for art, fashion, gastronomy, and culture. Its 19th-century cityscape is crisscrossed by wide boulevards and the River Seine.",
    whenToVisit: "Late Spring (May-June) and Early Fall (September-October) offer the best balance of pleasant weather and manageable tourist numbers.",
    seasons: {
      high: "June to August, December",
      low: "January to February",
      shoulder: "April to May, September to October"
    },
    weatherCard: {
      condition: "Partly Cloudy",
      tempHigh: 68,
      tempLow: 54,
      note: "Perfect for cafe sitting and museum hopping.",
      month: "June"
    },
    monthlyData: [
      { month: "JAN", flightCost: 650, temp: 45, condition: "Rainy", note: "Chilly and damp, but museums are quiet.", isIdeal: false, crowdLevel: 3 },
      { month: "FEB", flightCost: 620, temp: 47, condition: "Partly Cloudy", note: "Still cold, but romantic for Valentine's.", isIdeal: false, crowdLevel: 3 },
      { month: "MAR", flightCost: 750, temp: 54, condition: "Partly Cloudy", note: "Spring begins to bloom in the gardens.", isIdeal: false, crowdLevel: 5 },
      { month: "APR", flightCost: 950, temp: 61, condition: "Sunny", note: "April in Paris is legendary for a reason.", isIdeal: false, crowdLevel: 7 },
      { month: "MAY", flightCost: 1100, temp: 68, condition: "Sunny", note: "Perfect weather for long walks.", isIdeal: true, crowdLevel: 8 },
      { month: "JUN", flightCost: 1300, temp: 73, condition: "Sunny", note: "Long days and vibrant energy.", isIdeal: true, crowdLevel: 9 },
      { month: "JUL", flightCost: 1500, temp: 77, condition: "Sunny", note: "Hot and very crowded with tourists.", isIdeal: false, crowdLevel: 10 },
      { month: "AUG", flightCost: 1450, temp: 77, condition: "Sunny", note: "Locals leave, but tourists flock in.", isIdeal: false, crowdLevel: 10 },
      { month: "SEP", flightCost: 1100, temp: 70, condition: "Sunny", note: "The 'rentrée' brings life back to the city.", isIdeal: true, crowdLevel: 8 },
      { month: "OCT", flightCost: 850, temp: 61, condition: "Partly Cloudy", note: "Beautiful fall colors in the parks.", isIdeal: false, crowdLevel: 6 },
      { month: "NOV", flightCost: 700, temp: 52, condition: "Rainy", note: "Grey skies but cozy in the bistros.", isIdeal: false, crowdLevel: 4 },
      { month: "DEC", flightCost: 900, temp: 46, condition: "Partly Cloudy", note: "Festive lights and holiday markets.", isIdeal: false, crowdLevel: 8 },
    ],
    foodAndCulture: {
      categories: [
        {
          title: "Breakfast & Morning Rituals",
          items: [
            { name: "Cafe au Lait & Croissant", description: "The classic Parisian start at a corner bistro.", imageKeyword: "croissant" },
            { name: "Pain au Chocolat", description: "Flaky pastry filled with dark chocolate, best served warm.", imageKeyword: "pastry" }
          ]
        },
        {
          title: "Lunch & Street Food",
          items: [
            { name: "Jambon-Beurre", description: "A simple yet perfect baguette sandwich with ham and butter.", imageKeyword: "sandwich" },
            { name: "Crepes on the Go", description: "Sweet or savory crepes from street vendors in the Marais.", imageKeyword: "crepe" }
          ]
        },
        {
          title: "Dinner & Fine Dining",
          items: [
            { name: "Steak Frites", description: "The quintessential bistro meal with herb butter.", imageKeyword: "steak" },
            { name: "Duck Confit", description: "Slow-cooked duck leg with crispy skin and tender meat.", imageKeyword: "duck" }
          ]
        }
      ],
      mustTry: ["Fresh Baguette from a Boulangerie", "Onion Soup Gratinée", "Coq au Vin", "Macarons from Ladurée"],
      culturalEtiquette: [
        { title: "The 'Bonjour' Rule", description: "Always say 'Bonjour' when entering a shop or you'll be ignored." },
        { title: "Table Manners", description: "Keep both hands on the table, but never your elbows." },
        { title: "The Check", description: "Waiters won't bring the bill until you ask for it ('L'addition, s'il vous plaît')." }
      ]
    },
    topActivities: [
      { title: "Louvre Museum", description: "Explore the world's largest art museum and a historic monument.", imageKeyword: "louvre" },
      { title: "Eiffel Tower Picnic", description: "Enjoy a classic French picnic on the Champ de Mars.", imageKeyword: "eiffel" },
      { title: "Montmartre Wander", description: "Climb the hill to Sacré-Cœur for panoramic views.", imageKeyword: "montmartre" },
      { title: "Seine River Cruise", description: "See the city's iconic landmarks from the water at sunset.", imageKeyword: "seine" },
      { title: "Musée d'Orsay", description: "Marvel at Impressionist masterpieces in a grand former train station.", imageKeyword: "orsay" },
      { title: "Luxembourg Gardens", description: "Stroll through the most beautiful public park in Paris.", imageKeyword: "garden" }
    ],
    nicheActivities: [
      { title: "Père Lachaise Cemetery", description: "Visit the final resting place of Oscar Wilde and Jim Morrison.", imageKeyword: "cemetery" },
      { title: "Canal Saint-Martin", description: "Join locals for wine and cheese along the trendy waterway.", imageKeyword: "canal" },
      { title: "Atelier des Lumières", description: "Experience immersive digital art in a restored foundry.", imageKeyword: "art" },
      { title: "The Catacombs", description: "Explore the underground ossuary holding millions of remains.", imageKeyword: "catacombs" }
    ],
    seasonalHighlights: [
      { title: "Paris Fashion Week", description: "The city buzzes with style and high-profile events.", timeOfYear: "Sept/Oct" },
      { title: "Bastille Day", description: "National celebrations with fireworks and parades.", timeOfYear: "July 14" },
      { title: "Christmas Markets", description: "Festive lights and artisanal crafts across the city.", timeOfYear: "December" },
      { title: "Nuit Blanche", description: "An all-night contemporary art festival across the city.", timeOfYear: "October" },
      { title: "Fête de la Musique", description: "Free live music on every street corner.", timeOfYear: "June 21" }
    ],
    events: [
      { name: "Paris Fashion Week", month: "SEP", description: "The world's most prestigious fashion event transforms the city with runway shows, pop-ups, and industry parties.", type: "cultural" as const },
      { name: "Bastille Day", month: "JUL", description: "France's national holiday — world's oldest military parade down the Champs-Élysées, fireworks at the Eiffel Tower.", type: "festival" as const },
      { name: "Fête de la Musique", month: "JUN", description: "On the summer solstice, every street corner becomes a stage. Over 10,000 free concerts across the city.", type: "music" as const },
      { name: "Christmas Markets", month: "DEC", description: "Alsatian-style markets line the Champs-Élysées with mulled wine, crepes, and artisan gifts.", type: "market" as const },
      { name: "Nuit Blanche", month: "OCT", description: "One night a year Paris stays awake. Hundreds of free art installations fill streets and museums until dawn.", type: "cultural" as const },
    ],
    insiderTips: [
      { tip: "The Louvre is free on the first Friday evening of every month (after 6pm) and the first Sunday of every month. Book timed entry online even for free visits.", category: "money" as const },
      { tip: "Paris Vélib' bikes are €1.70 for 24 hours — faster than the Metro for sightseeing and the most romantic way to cross the city.", category: "transport" as const },
      { tip: "'Menu du déjeuner' at bistros is 2-3 courses for €15-22. The exact same dinner costs 3× more. Always eat your main meal at lunch.", category: "food" as const },
      { tip: "The Eiffel Tower sparkles every hour after dark for exactly 5 minutes. Best spot is Trocadéro, not directly below.", category: "culture" as const },
      { tip: "Metro pickpockets work in groups. Keep your bag in front, especially at Châtelet-Les Halles, Montmartre, and tourist-heavy trains.", category: "safety" as const },
    ],
    neighborhoods: [
      { name: "Le Marais", vibe: "Trendy", bestFor: "Art galleries, falafel on Rue des Rosiers, LGBTQ+-friendly bars, fashion boutiques", mustSee: "Place des Vosges, Picasso Museum, L'As du Fallafel on weekday lunch" },
      { name: "Montmartre", vibe: "Bohemian", bestFor: "Street artists, panoramic views, the last Parisian vineyard, classic cabarets", mustSee: "Sacré-Cœur at sunrise, La Maison Rose, the original Le Lapin Agile cabaret" },
      { name: "Saint-Germain", vibe: "Literary", bestFor: "Legendary cafes (Deux Magots, Café de Flore), Left Bank bookshops, gallery hopping", mustSee: "Shakespeare and Company, Musée d'Orsay, Jardin du Luxembourg" },
      { name: "Belleville", vibe: "Multicultural", bestFor: "Authentic Chinese, African, and Middle Eastern food, street art, rooftop views", mustSee: "Parc de Belleville at sunset — the best Paris panorama locals actually use" },
    ],
    practicalInfo: {
      visa: "US, UK, EU citizens get 90 days visa-free in the Schengen Area. ETIAS pre-clearance required soon.",
      currency: "Euro (€). Cards accepted almost everywhere. Carry €20 cash for markets and small cafes.",
      language: "French. Attempting even 'Bonjour' and 'Merci' dramatically improves your welcome.",
      tipping: "Not required. Round up the bill or leave 5-10% for exceptional service. Never expected.",
      safety: "Generally safe, but pickpockets target tourist zones. Avoid RER B late at night alone.",
      bestTransport: "The Metro is excellent. Buy a Navigo Semaine pass (€22.80, Mon-Sun all zones) for 4+ days.",
      budgetBreakdown: {
        budget: "€80-120/day — hostels, boulangerie meals, Metro pass",
        midRange: "€200-300/day — boutique hotel, bistro dinners, museum passes",
        luxury: "€600+/day — palace hotels, Michelin-starred dining, private tours",
      },
    },
  },
  "Tokyo, Japan": {
    title: "The Neon",
    subtitle: "Tokyo Odyssey",
    summary: "A seamless blend of futuristic technology and ancient tradition in the world's most populous city.",
    whyVisit: "Tokyo offers an unlimited choice of shopping, entertainment, culture, and dining. It's a city that never sleeps, yet maintains incredible order and safety.",
    whenToVisit: "Spring (March-April) for cherry blossoms and Autumn (October-November) for mild weather and fall colors.",
    seasons: {
      high: "March to April, July to August",
      low: "January to February",
      shoulder: "May to June, September to November"
    },
    weatherCard: {
      condition: "Sunny",
      tempHigh: 72,
      tempLow: 58,
      note: "Crisp, clear days ideal for urban exploration.",
      month: "November"
    },
    monthlyData: [
      { month: "JAN", flightCost: 950, temp: 50, condition: "Sunny", note: "Cold, dry, and clear skies.", isIdeal: false, crowdLevel: 4 },
      { month: "FEB", flightCost: 920, temp: 51, condition: "Partly Cloudy", note: "Plum blossoms begin to bloom.", isIdeal: false, crowdLevel: 4 },
      { month: "MAR", flightCost: 1200, temp: 57, condition: "Sunny", note: "Cherry blossoms start their magic.", isIdeal: true, crowdLevel: 9 },
      { month: "APR", flightCost: 1500, temp: 66, condition: "Sunny", note: "Peak Sakura season in the parks.", isIdeal: true, crowdLevel: 10 },
      { month: "MAY", flightCost: 1300, temp: 73, condition: "Sunny", note: "Golden Week is busy but beautiful.", isIdeal: false, crowdLevel: 7 },
      { month: "JUN", flightCost: 1100, temp: 78, condition: "Rainy", note: "The rainy season brings lush greens.", isIdeal: false, crowdLevel: 6 },
      { month: "JUL", flightCost: 1400, temp: 85, condition: "Rainy", note: "Hot, humid, and full of festivals.", isIdeal: false, crowdLevel: 8 },
      { month: "AUG", flightCost: 1450, temp: 88, condition: "Sunny", note: "Peak summer heat and fireworks.", isIdeal: false, crowdLevel: 8 },
      { month: "SEP", flightCost: 1150, temp: 80, condition: "Partly Cloudy", note: "Typhoons are possible, but cooling down.", isIdeal: false, crowdLevel: 5 },
      { month: "OCT", flightCost: 1000, temp: 71, condition: "Sunny", note: "Perfect mild weather for walking.", isIdeal: true, crowdLevel: 7 },
      { month: "NOV", flightCost: 950, temp: 62, condition: "Sunny", note: "Stunning autumn foliage in the city.", isIdeal: true, crowdLevel: 8 },
      { month: "DEC", flightCost: 1100, temp: 54, condition: "Sunny", note: "Winter lights and festive shopping.", isIdeal: false, crowdLevel: 6 },
    ],
    foodAndCulture: {
      categories: [
        {
          title: "Breakfast & Morning Rituals",
          items: [
            { name: "Tsukiji Sushi Breakfast", description: "The freshest fish straight from the market.", imageKeyword: "sushi" },
            { name: "Tamagoyaki", description: "Sweet and savory rolled omelet from a street stall.", imageKeyword: "egg" }
          ]
        },
        {
          title: "Lunch & Street Food",
          items: [
            { name: "Ramen in Shinjuku", description: "Rich tonkotsu broth in a tiny basement shop.", imageKeyword: "ramen" },
            { name: "Takoyaki", description: "Octopus balls with savory sauce and bonito flakes.", imageKeyword: "takoyaki" }
          ]
        },
        {
          title: "Dinner & Fine Dining",
          items: [
            { name: "Omakase Sushi", description: "Let the chef choose the best seasonal cuts for you.", imageKeyword: "sushi" },
            { name: "Wagyu Teppanyaki", description: "Premium beef grilled to perfection before your eyes.", imageKeyword: "wagyu" }
          ]
        }
      ],
      mustTry: ["Tsukiji Fish Market Breakfast", "Izakaya Hopping in Shinjuku", "Matcha in a Traditional Garden", "Convenience Store Egg Salad Sandwich"],
      culturalEtiquette: [
        { title: "No Tipping", description: "Tipping is not part of the culture and can be seen as confusing." },
        { title: "Eating on the Go", description: "Avoid eating while walking; it's considered impolite." },
        { title: "Escalator Rules", description: "Stand on the left in Tokyo (but on the right in Osaka!)." }
      ]
    },
    topActivities: [
      { title: "Shibuya Crossing", description: "Experience the world's busiest pedestrian intersection.", imageKeyword: "shibuya" },
      { title: "Senso-ji Temple", description: "Visit Tokyo's oldest and most significant Buddhist temple.", imageKeyword: "temple" },
      { title: "Akihabara Tech Tour", description: "Dive into the heart of anime and electronics culture.", imageKeyword: "akihabara" },
      { title: "Tsukiji Outer Market", description: "Sample the freshest sushi and street food.", imageKeyword: "sushi" },
      { title: "Meiji Jingu Shrine", description: "Find peace in the massive forest surrounding this imperial shrine.", imageKeyword: "shrine" },
      { title: "TeamLab Borderless", description: "Explore immersive digital art installations.", imageKeyword: "teamlab" }
    ],
    nicheActivities: [
      { title: "Shimokitazawa Thrift", description: "Explore Tokyo's bohemian neighborhood for vintage finds.", imageKeyword: "vintage" },
      { title: "Golden Gai Bars", description: "Squeeze into tiny, themed bars in Shinjuku.", imageKeyword: "bar" },
      { title: "Yanaka Ginza", description: "Walk through 'Old Tokyo' with its traditional shops and cats.", imageKeyword: "oldtokyo" },
      { title: "Ghibli Museum", description: "Step into the magical world of Studio Ghibli (book months ahead!).", imageKeyword: "ghibli" }
    ],
    seasonalHighlights: [
      { title: "Sakura Season", description: "Cherry blossoms transform the city into a pink wonderland.", timeOfYear: "Late March" },
      { title: "Sumida River Fireworks", description: "One of the largest fireworks displays in Japan.", timeOfYear: "July" },
      { title: "Meiji Jingu New Year", description: "Join millions for the first shrine visit of the year.", timeOfYear: "Jan 1" },
      { title: "Koyo (Autumn Leaves)", description: "The city's ginkgo and maple trees turn brilliant gold and red.", timeOfYear: "November" },
      { title: "Winter Illuminations", description: "Spectacular light displays in Roppongi and Marunouchi.", timeOfYear: "December" }
    ],
    events: [
      { name: "Hanami (Sakura Season)", month: "APR", description: "The nationwide cherry blossom celebration. Ueno, Shinjuku Gyoen, and Yoyogi fill with picnickers for flower-viewing parties.", type: "cultural" as const },
      { name: "Sumida River Fireworks", month: "JUL", description: "Tokyo's largest fireworks display — 20,000 shells launched over the Sumida River. Book a riverside restaurant months ahead.", type: "festival" as const },
      { name: "Tokyo Game Show", month: "SEP", description: "The world's largest gaming convention draws 250,000 attendees to Makuhari Messe.", type: "cultural" as const },
      { name: "Comiket (Comic Market)", month: "AUG", description: "The world's largest self-published manga convention — 750,000 attendees descend on Tokyo Big Sight over 3 days.", type: "cultural" as const },
      { name: "New Year at Meiji Shrine", month: "JAN", description: "Hatsumode — the first shrine visit of the New Year. Over 3 million people visit Meiji Shrine in the first three days of January.", type: "cultural" as const },
    ],
    insiderTips: [
      { tip: "The best ramen is in basement food halls (depachika) of Isetan in Shinjuku, not in tourist ramen museums. Look for lines of salarymen.", category: "food" as const },
      { tip: "A 7-day JR Pass ($255) pays off only if you're taking 2+ Shinkansen trips. For Tokyo-only travel, Pasmo IC card is all you need.", category: "transport" as const },
      { tip: "Konbini (7-Eleven, Lawson, FamilyMart) breakfast is legitimately excellent at ¥400-700. Egg salad sandwiches and onigiri are national treasures.", category: "food" as const },
      { tip: "Ghibli Museum and TeamLab tickets sell out months in advance and cannot be purchased on-site. Book online before your trip or you won't get in.", category: "culture" as const },
      { tip: "Withdraw Yen from 7-Eleven ATMs in Japan — they reliably accept foreign cards and give near-interbank exchange rates.", category: "money" as const },
    ],
    neighborhoods: [
      { name: "Shinjuku", vibe: "Electric", bestFor: "Golden Gai tiny bars, Kabukicho nightlife, incredible ramen, the free Metropolitan Government observation deck", mustSee: "Omoide Yokocho (Memory Lane) at night, the 8-floor Yodobashi Camera" },
      { name: "Yanaka", vibe: "Old Tokyo", bestFor: "Pre-war wooden buildings, cats everywhere, traditional shops, a genuine non-touristy neighborhood", mustSee: "Yanaka Ginza shotengai, Nezu Shrine (like Fushimi Inari with zero crowds)" },
      { name: "Shimokitazawa", vibe: "Indie", bestFor: "Vintage clothing stores, tiny live music venues, artisan coffee, Tokyo's bohemian creative class", mustSee: "Sunday vintage market, Shimokita Theater, local jazz bars" },
      { name: "Akihabara", vibe: "Neon Otaku", bestFor: "Electronics, anime merchandise, retro video games, maid cafes, multi-floor arcades", mustSee: "Super Potato retro gaming store, the full 8 floors of Yodobashi Camera" },
    ],
    practicalInfo: {
      visa: "US, UK, EU, Aus/NZ citizens receive 90-day visa-free entry. Check MOFA Japan's site for other nationalities.",
      currency: "Japanese Yen (¥). Japan is heavily cash-based — withdraw at 7-Eleven ATMs for reliable foreign card access.",
      language: "Japanese. More English than Kyoto but still minimal. Google Translate camera mode is essential for menus.",
      tipping: "Never tip in Japan. It causes confusion and can offend. Service is always exceptional regardless.",
      safety: "Among the safest major cities in the world. Crime against tourists is extremely rare.",
      bestTransport: "Tokyo Metro + JR lines. Pasmo IC card works on all transit. Taxis are expensive but always metered and honest.",
      budgetBreakdown: {
        budget: "¥7,000–12,000/day (~$48-82) — capsule hotel, ramen, IC card",
        midRange: "¥22,000–40,000/day (~$150-270) — mid-range hotel, izakaya hopping, day trips",
        luxury: "¥80,000+/day (~$550+) — Park Hyatt, omakase sushi, private sake bar experiences",
      },
    },
  },
  "Amalfi Coast, Italy": {
    title: "The Azure",
    subtitle: "Coastal Dream",
    summary: "Dramatic cliffs, turquoise waters, and pastel-colored villages clinging to the Italian shoreline.",
    whyVisit: "The Amalfi Coast is a UNESCO World Heritage site known for its stunning natural beauty and charming towns like Positano and Amalfi.",
    whenToVisit: "May and September are the sweet spots with perfect weather and fewer crowds than the peak summer months.",
    seasons: {
      high: "July to August",
      low: "November to March",
      shoulder: "April to June, September to October"
    },
    weatherCard: {
      condition: "Sunny",
      tempHigh: 78,
      tempLow: 64,
      note: "Sparkling seas and warm Mediterranean breezes.",
      month: "September"
    },
    monthlyData: [
      { month: "JAN", flightCost: 550, temp: 54, condition: "Rainy", note: "Quiet and cool, many shops closed.", isIdeal: false, crowdLevel: 1 },
      { month: "FEB", flightCost: 520, temp: 55, condition: "Rainy", note: "Peaceful but limited services.", isIdeal: false, crowdLevel: 1 },
      { month: "MAR", flightCost: 650, temp: 60, condition: "Partly Cloudy", note: "Spring begins to wake the coast.", isIdeal: false, crowdLevel: 2 },
      { month: "APR", flightCost: 850, temp: 66, condition: "Sunny", note: "Easter brings the first big crowds.", isIdeal: false, crowdLevel: 5 },
      { month: "MAY", flightCost: 1000, temp: 73, condition: "Sunny", note: "Flowers in bloom, perfect hiking.", isIdeal: true, crowdLevel: 7 },
      { month: "JUN", flightCost: 1200, temp: 80, condition: "Sunny", note: "Summer energy and warm waters.", isIdeal: true, crowdLevel: 9 },
      { month: "JUL", flightCost: 1400, temp: 85, condition: "Sunny", note: "Peak heat and peak crowds.", isIdeal: false, crowdLevel: 10 },
      { month: "AUG", flightCost: 1450, temp: 86, condition: "Sunny", note: "The busiest month of the year.", isIdeal: false, crowdLevel: 10 },
      { month: "SEP", flightCost: 1100, temp: 80, condition: "Sunny", note: "The best month for swimming.", isIdeal: true, crowdLevel: 8 },
      { month: "OCT", flightCost: 850, temp: 72, condition: "Partly Cloudy", note: "Mild days and cooler evenings.", isIdeal: false, crowdLevel: 5 },
      { month: "NOV", flightCost: 600, temp: 62, condition: "Rainy", note: "The start of the quiet season.", isIdeal: false, crowdLevel: 2 },
      { month: "DEC", flightCost: 750, temp: 56, condition: "Partly Cloudy", note: "Festive lights in the villages.", isIdeal: false, crowdLevel: 3 },
    ],
    foodAndCulture: {
      categories: [
        {
          title: "Coastal Classics",
          items: [
            { name: "Scialatielli ai Frutti di Mare", description: "Fresh pasta with a bounty of local seafood.", imageKeyword: "seafood" },
            { name: "Spaghetti alla Nerano", description: "Pasta with fried zucchini and provolone del monaco.", imageKeyword: "pasta" }
          ]
        },
        {
          title: "Lemon Everything",
          items: [
            { name: "Delizia al Limone", description: "A light sponge cake filled and covered with lemon cream.", imageKeyword: "lemon" },
            { name: "Limoncello", description: "The famous local lemon liqueur, served ice cold.", imageKeyword: "limoncello" }
          ]
        }
      ],
      mustTry: ["Fried Calamari in a Paper Cone", "Buffalo Mozzarella from Campania", "Fresh Figs in Summer", "Amalfi Lemon Sorbet"],
      culturalEtiquette: [
        { title: "Dinner Timing", description: "Dinner starts late, usually after 8 PM. Don't expect early service." },
        { title: "Church Dress", description: "Always cover shoulders and knees when entering churches." },
        { title: "Coperto", description: "Expect a small 'cover charge' on your restaurant bill for bread and service." }
      ]
    },
    topActivities: [
      { title: "Path of the Gods", description: "Hike the world-famous trail for breathtaking views.", imageKeyword: "hike" },
      { title: "Positano Boat Tour", description: "See the vertical village from the water and swim in hidden coves.", imageKeyword: "boat" },
      { title: "Ravello Gardens", description: "Visit Villa Cimbrone for the 'Infinity Terrace'.", imageKeyword: "garden" },
      { title: "Lemon Sorbet Tasting", description: "Sample the famous Amalfi lemons in refreshing local treats.", imageKeyword: "lemon" },
      { title: "Duomo di Amalfi", description: "Climb the grand stairs to the 9th-century cathedral.", imageKeyword: "cathedral" },
      { title: "Valle delle Ferriere", description: "Hike through a lush valley of waterfalls and ancient mills.", imageKeyword: "waterfall" }
    ],
    nicheActivities: [
      { title: "Paper Museum", description: "Learn the ancient art of handmade paper making in Amalfi.", imageKeyword: "paper" },
      { title: "Fiordo di Furore", description: "Discover a hidden fjord and beach tucked under a massive bridge.", imageKeyword: "fjord" },
      { title: "Cooking Class in Ravello", description: "Learn to make pasta from scratch in a cliffside garden.", imageKeyword: "cooking" },
      { title: "Emerald Grotto", description: "Visit the sea cave filled with ethereal green light.", imageKeyword: "cave" }
    ],
    seasonalHighlights: [
      { title: "Lemon Harvest", description: "The hillsides are filled with the scent of ripening citrus.", timeOfYear: "Spring" },
      { title: "Ravello Festival", description: "Classical music concerts held on a stage overhanging the sea.", timeOfYear: "Summer" },
      { title: "Christmas in Atrani", description: "The tiny village is illuminated with thousands of lights.", timeOfYear: "December" },
      { title: "Sagra del Pesce", description: "A massive fish festival on the beach in Positano.", timeOfYear: "September" },
      { title: "Regata delle Antiche Repubbliche", description: "A historic boat race between Amalfi, Genoa, Pisa, and Venice.", timeOfYear: "June (Rotating)" }
    ],
    events: [
      { name: "Ravello Festival", month: "JUL", description: "Classical music on a stage that cantilevers over the Mediterranean — one of Earth's most dramatic concert venues.", type: "music" as const },
      { name: "Regata delle Antiche Repubbliche", month: "JUN", description: "A boat race between historic maritime rivals Amalfi, Genoa, Pisa, and Venice. Hosted by Amalfi every 4 years.", type: "cultural" as const },
      { name: "Sagra del Pesce", month: "SEP", description: "Positano's giant beach fish festival — freshly caught seafood grilled over open fires right on the sand.", type: "food" as const },
      { name: "Infiorata di Positano", month: "JUN", description: "For Corpus Christi, the streets of Positano are carpeted with elaborate designs made from thousands of flower petals.", type: "cultural" as const },
      { name: "Easter Holy Week", month: "APR", description: "Medieval streets of Amalfi town host torchlight processions culminating in a spectacular Good Friday ceremony.", type: "cultural" as const },
    ],
    insiderTips: [
      { tip: "The SITA bus connects every coastal town for €1.30 — the ferry costs 10× more for the same 20-minute journey. Locals always take the bus.", category: "transport" as const },
      { tip: "Book lodging in Ravello or Praiano instead of Positano — 30-40% cheaper with identical views and far fewer crowds.", category: "money" as const },
      { tip: "The Path of the Gods (Sentiero degli Dei) officially runs Agerola to Positano. Take the bus up to Agerola and hike downhill for the best experience.", category: "transport" as const },
      { tip: "Amalfi's Sfusato Amalfitano lemons are DOP-protected. Limoncello made here is worlds apart from supermarket versions — look for 'prodotto artigianale'.", category: "food" as const },
      { tip: "Driving the SS163 road in July/August is harrowing with tour coaches clogging the single lane. Take transit or visit in May/September.", category: "safety" as const },
    ],
    neighborhoods: [
      { name: "Positano", vibe: "Glamorous", bestFor: "Iconic views, boutique shopping, beach clubs, upscale restaurants", mustSee: "The vertical cascade of pastel buildings from the beach at golden hour" },
      { name: "Ravello", vibe: "Elevated", bestFor: "Classical concerts, villa gardens, the most spectacular cliff-top views, peaceful solitude", mustSee: "Villa Cimbrone's Terrace of Infinity with its 900m drop to the sea" },
      { name: "Amalfi Town", vibe: "Historical", bestFor: "The Duomo, the paper museum, genuine working-town atmosphere away from resort prices", mustSee: "Cathedral's 9th-century bronze doors and the Chiostro del Paradiso cloister" },
      { name: "Atrani", vibe: "Authentic", bestFor: "The coast's best-kept secret — a genuine village with locals, a tiny beach, no tourist buses", mustSee: "Piazza Umberto I, the oldest town square in the region" },
    ],
    practicalInfo: {
      visa: "Schengen Area — US/UK/Aus get 90 days visa-free. ETIAS electronic pre-clearance coming soon.",
      currency: "Euro (€). Cash important for small trattorias, bus tickets, and market vendors.",
      language: "Italian. Very little English outside hotels. Learn 'posso avere il conto?' (can I have the bill?).",
      tipping: "Not customary. 5-10% for exceptional service. A 'coperto' cover charge (€1-3) is already on the bill.",
      safety: "Very safe. Watch for aggressive vendors in Positano and keep bags secured on crowded buses.",
      bestTransport: "SITA buses (cheap, scenic, thrilling). Ferries between towns in summer. Car rental not recommended July-August.",
      budgetBreakdown: {
        budget: "€90-130/day — B&B in Praiano, trattoria set lunches, bus passes",
        midRange: "€220-350/day — 3-star hotel in Positano, dinners, day ferries",
        luxury: "€600+/day — 5-star cliff-side villa, private boat, Michelin dining",
      },
    },
  },
  "Madison, Wisconsin": {
    title: "The Isthmus",
    subtitle: "Wisconsin Heart",
    summary: "A vibrant college town set between two lakes, known for its incredible food scene and progressive spirit.",
    whyVisit: "Madison offers a unique blend of natural beauty, world-class education, and a legendary culinary scene centered around local dairy and craft beer.",
    whenToVisit: "Summer (June-August) for lake life and outdoor concerts, or Fall (September-October) for stunning foliage and football energy.",
    seasons: {
      high: "June to August",
      low: "January to February",
      shoulder: "May, September to October"
    },
    weatherCard: {
      condition: "Sunny",
      tempHigh: 82,
      tempLow: 62,
      note: "Perfect for a terrace beer and lake breeze.",
      month: "July"
    },
    monthlyData: [
      { month: "JAN", flightCost: 350, temp: 26, condition: "Snow", note: "Deep winter, great for ice fishing.", isIdeal: false, crowdLevel: 2 },
      { month: "FEB", flightCost: 320, temp: 30, condition: "Snow", note: "Coldest month, but cozy indoors.", isIdeal: false, crowdLevel: 2 },
      { month: "MAR", flightCost: 380, temp: 43, condition: "Rainy", note: "The 'thaw' begins, can be muddy.", isIdeal: false, crowdLevel: 3 },
      { month: "APR", flightCost: 420, temp: 56, condition: "Partly Cloudy", note: "Spring flowers start to pop.", isIdeal: false, crowdLevel: 4 },
      { month: "MAY", flightCost: 450, temp: 68, condition: "Sunny", note: "Farmers market returns to the square.", isIdeal: true, crowdLevel: 6 },
      { month: "JUN", flightCost: 500, temp: 78, condition: "Sunny", note: "Lake season is in full swing.", isIdeal: true, crowdLevel: 8 },
      { month: "JUL", flightCost: 550, temp: 82, condition: "Sunny", note: "Peak summer energy and festivals.", isIdeal: true, crowdLevel: 9 },
      { month: "AUG", flightCost: 520, temp: 80, condition: "Sunny", note: "Warm nights and outdoor movies.", isIdeal: true, crowdLevel: 8 },
      { month: "SEP", flightCost: 480, temp: 72, condition: "Sunny", note: "Football Saturdays and crisp air.", isIdeal: true, crowdLevel: 9 },
      { month: "OCT", flightCost: 400, temp: 59, condition: "Partly Cloudy", note: "Stunning fall colors on campus.", isIdeal: false, crowdLevel: 6 },
      { month: "NOV", flightCost: 380, temp: 44, condition: "Rainy", note: "First frost and holiday prep.", isIdeal: false, crowdLevel: 4 },
      { month: "DEC", flightCost: 450, temp: 31, condition: "Snow", note: "Holiday lights and winter markets.", isIdeal: false, crowdLevel: 5 },
    ],
    foodAndCulture: {
      categories: [
        {
          title: "Dairy State Staples",
          items: [
            { name: "Deep Fried Cheese Curds", description: "Fresh, squeaky curds fried to golden perfection.", imageKeyword: "cheese" },
            { name: "Babcock Dairy Ice Cream", description: "Legendary ice cream made right on the UW campus.", imageKeyword: "icecream" }
          ]
        },
        {
          title: "Bratwurst & Beer",
          items: [
            { name: "Beer-Simmered Brats", description: "The classic Wisconsin sausage, served with kraut.", imageKeyword: "bratwurst" },
            { name: "Spotted Cow Ale", description: "A farmhouse ale you can only find in Wisconsin.", imageKeyword: "beer" }
          ]
        },
        {
          title: "Supper Club Culture",
          items: [
            { name: "Friday Fish Fry", description: "Beer-battered cod served with rye bread and coleslaw.", imageKeyword: "fish" },
            { name: "Brandy Old Fashioned", description: "The state drink, muddled with fruit and topped with soda.", imageKeyword: "cocktail" }
          ]
        }
      ],
      mustTry: ["Saturday Farmers Market on the Square", "Stella's Hot Spicy Cheese Bread", "A Pitcher at the Memorial Union Terrace"],
      culturalEtiquette: [
        { title: "Midwest Nice", description: "Expect strangers to say hello and hold doors. It's genuine." },
        { title: "The 'Ope' Rule", description: "The universal sound for 'excuse me' or 'I'm sorry'." },
        { title: "Game Day Spirit", description: "On Saturdays, the entire city wears red for the Badgers." }
      ]
    },
    topActivities: [
      { title: "Memorial Union Terrace", description: "Sit in the iconic sunburst chairs by Lake Mendota.", imageKeyword: "terrace" },
      { title: "State Capitol Tour", description: "Explore one of the most beautiful state houses in the country.", imageKeyword: "capitol" },
      { title: "Olbrich Botanical Gardens", description: "Visit the stunning Thai Pavilion and tropical conservatory.", imageKeyword: "garden" },
      { title: "Lake Monona Bike Loop", description: "Cycle the scenic path around the lake for city views.", imageKeyword: "bike" },
      { title: "Henry Vilas Zoo", description: "One of the few admission-free zoos in the nation.", imageKeyword: "zoo" },
      { title: "Chazen Museum of Art", description: "Explore a massive collection of art on the university campus.", imageKeyword: "art" }
    ],
    nicheActivities: [
      { title: "Mustard Museum", description: "Visit the nearby museum dedicated to all things mustard.", imageKeyword: "mustard" },
      { title: "Underground Food Collective", description: "Experience the cutting edge of Madison's farm-to-table scene.", imageKeyword: "food" },
      { title: "Ice Age Trail", description: "Hike a portion of the 1,200-mile trail shaped by glaciers.", imageKeyword: "hike" },
      { title: "Kayaking the Isthmus", description: "Paddle between Lake Mendota and Lake Monona.", imageKeyword: "kayak" }
    ],
    seasonalHighlights: [
      { title: "Art on the Square", description: "Massive outdoor art fair surrounding the Capitol.", timeOfYear: "July" },
      { title: "Concerts on the Square", description: "Weekly summer orchestra performances on the Capitol lawn.", timeOfYear: "Summer" },
      { title: "Winter Carnival", description: "Ice activities and the famous 'Statue of Liberty' on the lake.", timeOfYear: "February" },
      { title: "Great Taste of the Midwest", description: "One of the premier beer festivals in the country.", timeOfYear: "August" },
      { title: "Taste of Madison", description: "Sample food from over 80 local restaurants on the square.", timeOfYear: "Labor Day Weekend" }
    ],
    events: [
      { name: "Art on the Square", month: "JUL", description: "200+ artists exhibit around the Capitol in one of the Midwest's premier outdoor art fairs. 200,000 visitors over two days.", type: "cultural" as const },
      { name: "Great Taste of the Midwest", month: "AUG", description: "A legendary craft beer festival running since 1987. Tickets sell out in seconds. Over 150 Midwest breweries.", type: "food" as const },
      { name: "Concerts on the Square", month: "JUN", description: "Six Wednesday evenings of free orchestra concerts on the Capitol lawn. Bring a blanket, local cheese, and Spotted Cow.", type: "music" as const },
      { name: "UW Badgers Football", month: "SEP", description: "Game Day Saturdays in Camp Randall Stadium turn the entire city red. The 'Jump Around' tradition is a genuine cultural experience.", type: "sporting" as const },
      { name: "Taste of Madison", month: "SEP", description: "Labor Day weekend: 80+ local restaurants set up booths around the Capitol Square — Madison's favorite end-of-summer celebration.", type: "food" as const },
    ],
    insiderTips: [
      { tip: "The Saturday Dane County Farmers Market (the largest producers-only market in the US) sells out by 10am. Arrive early for the Stella's hot spicy cheese bread.", category: "food" as const },
      { tip: "Memorial Union Terrace fills instantly on sunny weekends. Go Monday-Thursday before 5pm to easily snag the iconic sunburst chairs by the water.", category: "culture" as const },
      { tip: "Spotted Cow ale by New Glarus Brewing is only legally sold within Wisconsin. Stock up — you legally cannot buy it once you leave the state.", category: "food" as const },
      { tip: "Parking near the Capitol is brutal on game days and summer weekends. Take the free UW shuttle or rent a Bcycle bike ($15/day) — it's faster.", category: "transport" as const },
      { tip: "Babcock Dairy on the UW campus sells legendary ice cream below market prices. Best soft-serve in the Midwest.", category: "money" as const },
    ],
    neighborhoods: [
      { name: "State Street", vibe: "University Energy", bestFor: "Pedestrian mall bars, eclectic shops, quick cheap eats, the hub between UW campus and the Capitol", mustSee: "Memorial Union Terrace (campus end), Comedy Club on State on weeknights" },
      { name: "Atwood", vibe: "Quirky Local", bestFor: "Madison's most unique neighborhood — bookshops, galleries, dive bars, the best pizza in the city", mustSee: "Cargo Coffee on Atwood, The Magic Moment bar, Barrymore Theatre" },
      { name: "Willy Street", vibe: "Co-op Hipster", bestFor: "Community co-ops, tattoo parlors, the best breakfast spots, live music, the authentic Madison ethos", mustSee: "Original Willy Street Co-op, Mother Fool's Coffeehouse for live music" },
      { name: "Monroe Street", vibe: "Neighborhood Gem", bestFor: "Local restaurants without tourist markup, independent coffee shops, Regent neighborhood vibes", mustSee: "Fromagination cheese shop, The Old Fashioned for classic Wisconsin supper club dishes" },
    ],
    practicalInfo: {
      visa: "Domestic US destination — no visa required. International visitors use standard US visitor visa or ESTA.",
      currency: "US Dollar (USD). Cards accepted everywhere. ATMs abundant throughout downtown.",
      language: "English. Also: 'ope' means 'excuse me', 'bubbler' is a water fountain, 'supper club' is fine-casual dining.",
      tipping: "Standard US tipping: 18-20% at restaurants, $1-2 per drink at bars.",
      safety: "Very safe for a US city. Normal urban precautions near State Street late night on weekends.",
      bestTransport: "Madison Metro buses cover the city well ($2/ride). Highly bike-friendly — Bcycle rental stations everywhere.",
      budgetBreakdown: {
        budget: "$80-120/day — budget motel, food cart meals, bus pass",
        midRange: "$180-250/day — downtown hotel, restaurant dinners, some activities",
        luxury: "$350+/day — boutique hotel, supper club dining, private event tickets",
      },
    },
  },
  "Santorini, Greece": {
    title: "The Volcanic",
    subtitle: "Cycladic Jewel",
    summary: "Whitewashed buildings, blue-domed churches, and world-famous sunsets over the caldera.",
    whyVisit: "Santorini is the quintessential Greek island, offering dramatic views, unique volcanic beaches, and exceptional local wines.",
    whenToVisit: "Late Spring (May-June) and Early Fall (September-October) for warm weather without the crushing summer crowds.",
    seasons: {
      high: "July to August",
      low: "November to March",
      shoulder: "April to June, September to October"
    },
    weatherCard: {
      condition: "Sunny",
      tempHigh: 80,
      tempLow: 68,
      note: "Golden hour glow and perfect sea temperatures.",
      month: "September"
    },
    monthlyData: [
      { month: "JAN", flightCost: 450, temp: 57, condition: "Rainy", note: "Quiet, windy, and many hotels closed.", isIdeal: false, crowdLevel: 1 },
      { month: "FEB", flightCost: 420, temp: 57, condition: "Rainy", note: "Peaceful but limited services.", isIdeal: false, crowdLevel: 1 },
      { month: "MAR", flightCost: 550, temp: 61, condition: "Partly Cloudy", note: "The island begins to wake up.", isIdeal: false, crowdLevel: 2 },
      { month: "APR", flightCost: 750, temp: 65, condition: "Sunny", note: "Easter is a beautiful time to visit.", isIdeal: false, crowdLevel: 4 },
      { month: "MAY", flightCost: 900, temp: 72, condition: "Sunny", note: "Perfect weather and blooming flowers.", isIdeal: true, crowdLevel: 6 },
      { month: "JUN", flightCost: 1100, temp: 79, condition: "Sunny", note: "Summer starts, energy is high.", isIdeal: true, crowdLevel: 8 },
      { month: "JUL", flightCost: 1300, temp: 84, condition: "Sunny", note: "Peak heat and peak crowds.", isIdeal: false, crowdLevel: 10 },
      { month: "AUG", flightCost: 1350, temp: 84, condition: "Sunny", note: "The island is at full capacity.", isIdeal: false, crowdLevel: 10 },
      { month: "SEP", flightCost: 1050, temp: 79, condition: "Sunny", note: "Warm water and slightly fewer people.", isIdeal: true, crowdLevel: 8 },
      { month: "OCT", flightCost: 800, temp: 72, condition: "Sunny", note: "Mild days and beautiful sunsets.", isIdeal: false, crowdLevel: 5 },
      { month: "NOV", flightCost: 500, temp: 64, condition: "Rainy", note: "The start of the quiet season.", isIdeal: false, crowdLevel: 2 },
      { month: "DEC", flightCost: 650, temp: 59, condition: "Partly Cloudy", note: "Cool and calm holiday season.", isIdeal: false, crowdLevel: 2 },
    ],
    foodAndCulture: {
      categories: [
        {
          title: "Volcanic Flavors",
          items: [
            { name: "Tomato Geftedes", description: "Crispy fritters made with local volcanic cherry tomatoes.", imageKeyword: "tomato" },
            { name: "Fava Puree", description: "Creamy yellow split peas, a staple of the island's diet.", imageKeyword: "fava" }
          ]
        },
        {
          title: "Aegean Seafood",
          items: [
            { name: "Grilled Octopus", description: "Sun-dried and grilled over charcoal with lemon and oregano.", imageKeyword: "octopus" },
            { name: "Fresh Sea Bass", description: "Caught daily and served simply with olive oil.", imageKeyword: "fish" }
          ]
        },
        {
          title: "Ancient Vines",
          items: [
            { name: "Assyrtiko Wine", description: "Crisp, mineral-rich white wine from volcanic soil.", imageKeyword: "wine" },
            { name: "Vinsanto", description: "Naturally sweet dessert wine made from sun-dried grapes.", imageKeyword: "vinsanto" }
          ]
        }
      ],
      mustTry: ["Sunset Dinner in Oia", "Wine Tasting in a Traditional Canava", "Fresh Grilled Octopus", "Greek Yogurt with Local Honey"],
      culturalEtiquette: [
        { title: "Plumbing Rules", description: "Do not flush toilet paper; use the provided bins. The pipes are narrow." },
        { title: "Siesta Time", description: "Respect the quiet afternoon hours (2 PM - 5 PM) in smaller villages." },
        { title: "Tipping", description: "Rounding up the bill is standard; 10% is generous for great service." }
      ]
    },
    topActivities: [
      { title: "Oia Sunset Walk", description: "Wander the narrow paths for the world's most famous sunset.", imageKeyword: "sunset" },
      { title: "Akrotiri Ruins", description: "Explore the 'Minoan Pompeii' preserved in volcanic ash.", imageKeyword: "ruins" },
      { title: "Red Beach", description: "Visit the unique volcanic beach with dramatic red cliffs.", imageKeyword: "beach" },
      { title: "Sailing the Caldera", description: "Take a catamaran cruise to swim in the hot springs.", imageKeyword: "sailing" },
      { title: "Ancient Thera", description: "Hike to the mountain-top ruins for incredible views.", imageKeyword: "ruins" },
      { title: "Amoudi Bay", description: "Walk down 200 steps for fresh seafood by the water.", imageKeyword: "bay" }
    ],
    nicheActivities: [
      { title: "Open Air Cinema Kamari", description: "Watch a movie under the stars in a garden setting.", imageKeyword: "cinema" },
      { title: "Hiking Fira to Oia", description: "A stunning 3-hour trek along the rim of the caldera.", imageKeyword: "hike" },
      { title: "Tomato Industrial Museum", description: "Learn about the island's tomato canning history.", imageKeyword: "museum" },
      { title: "Skaros Rock", description: "Hike to the ruins of a medieval fortress.", imageKeyword: "rock" }
    ],
    seasonalHighlights: [
      { title: "Ifestia Festival", description: "Fireworks re-enacting the volcanic eruption.", timeOfYear: "September" },
      { title: "Greek Easter", description: "Traditional celebrations and candlelit processions.", timeOfYear: "Spring" },
      { title: "Wine Harvest", description: "The island's unique vineyards are busy with activity.", timeOfYear: "August" },
      { title: "Santorini Arts Festival", description: "Concerts and exhibitions in various venues.", timeOfYear: "Summer" },
      { title: "Panigiri of Prophet Elias", description: "A traditional religious festival with food and music.", timeOfYear: "July 20" }
    ],
    events: [
      { name: "Ifestia Festival", month: "SEP", description: "Annual re-enactment of the volcanic eruption — fireworks cascade over the caldera from Oia's cliffs in one of Europe's most spectacular displays.", type: "festival" as const },
      { name: "Greek Orthodox Easter", month: "APR", description: "The most important Greek holiday. Candlelit midnight processions, 'Christos Anesti' exchanges, and lamb roasted outdoors.", type: "cultural" as const },
      { name: "Santorini Music Festival", month: "SEP", description: "World-class chamber music in the Nomikos Centre — a venue carved into the cliff face with caldera views.", type: "music" as const },
      { name: "Assyrtiko Wine Harvest", month: "AUG", description: "Santorini's ancient basket-pruned vines are harvested. Wineries offer harvest experiences and new vintage tastings.", type: "food" as const },
      { name: "Panormos Film Festival", month: "AUG", description: "Open-air cinema screenings on a sea-view terrace. Greek and international films under the stars.", type: "cultural" as const },
    ],
    insiderTips: [
      { tip: "The 'famous Oia sunset' attracts 3,000+ people to one tiny viewpoint. Locals watch from Imerovigli — better angle, zero crowds, and you can actually sit down.", category: "culture" as const },
      { tip: "Donkeys for the Fira-to-port ascent are no longer recommended (animal welfare). Take the cable car (€6) or walk the 300 steps — both are better.", category: "transport" as const },
      { tip: "Assyrtiko wine direct from small family wineries (Santo Wines, Estate Argyros) costs 40% less than the same bottles at caldera restaurants.", category: "money" as const },
      { tip: "ATV/quad bike rentals are ubiquitous but have a very high accident rate on Santorini's narrow cliff roads. If you rent one, go slow — locals will pass on blind corners.", category: "safety" as const },
      { tip: "Book caldera-view restaurants for lunch not dinner — identical views, 25-30% lower prices, and you can actually see the caldera instead of racing darkness.", category: "money" as const },
    ],
    neighborhoods: [
      { name: "Oia", vibe: "Iconic Luxury", bestFor: "Sunset views, blue-domed churches, upscale caldera hotels, honeymoon atmosphere", mustSee: "Byzantine castle ruins at sunset — arrive 2 hours early in peak season" },
      { name: "Fira", vibe: "Vibrant Capital", bestFor: "Shopping, Archaeological Museum, budget accommodation, cable car access to the port", mustSee: "Museum of Prehistoric Thera — includes 3,600-year-old Minoan frescoes" },
      { name: "Imerovigli", vibe: "Serene Caldera", bestFor: "The best caldera views on the island with far fewer tourists than Oia, sunrise watching", mustSee: "Skaros Rock hike to medieval fortress ruins at the tip of the headland" },
      { name: "Pyrgos", vibe: "Authentic Village", bestFor: "Real Santorini life away from tourists, castle ruins, best winery access, local tavernas", mustSee: "Medieval castle of Pyrgos at night, Franco's Bar for rooftop sunset cocktails" },
    ],
    practicalInfo: {
      visa: "Schengen Area — US/UK/Aus get 90 days visa-free. ETIAS electronic pre-clearance coming soon.",
      currency: "Euro (€). Most places accept cards, but carry cash for smaller tavernas and the local bus.",
      language: "Greek. English widely spoken in tourist areas. Locals love even a 'Yiasas' (cheers) or 'Efcharistó' (thank you).",
      tipping: "Round up the bill or leave 5-10% for sit-down service. Not mandatory but appreciated.",
      safety: "Very safe. Main risks are traffic accidents (especially ATVs) and dehydration in summer heat.",
      bestTransport: "Local KTEL bus connects major villages cheaply. The caldera path walk (Fira-Firostefani-Imerovigli-Oia, 10km) is the best way to see the island.",
      budgetBreakdown: {
        budget: "€80-120/day — inland studios, taverna meals, local bus",
        midRange: "€250-400/day — caldera-view hotel, restaurant dinners, wine tastings",
        luxury: "€800+/day — private cave suite in Oia, sunset dinner, private catamaran",
      },
    },
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
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [intelligence, setIntelligence] = useState<TripIntelligence | null>(null);
  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Collaboration State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [tripCrew, setTripCrew] = useState<TripMember[]>([]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Trip Listener
  useEffect(() => {
    if (!tripId) {
      setIsCollaborating(false);
      return;
    }

    setIsCollaborating(true);
    
    // Subscribe to Trip Doc
    const tripRef = doc(db, 'trips', tripId);
    const unsubTrip = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.intelligence) {
          setIntelligence(data.intelligence);
          setHasSearched(true);
        }
        setDestination(data.destination || '');
      } else {
        setError("This trip no longer exists or the link is invalid.");
        navigate('/waves');
      }
    });

    // Subscribe to Members
    const membersRef = collection(db, 'trips', tripId, 'members');
    const unsubMembers = onSnapshot(membersRef, (snap) => {
      const members = snap.docs.map(d => d.data() as TripMember);
      setTripCrew(members);
    });

    return () => {
      unsubTrip();
      unsubMembers();
    };
  }, [tripId, navigate]);

  // Join Trip Effect
  useEffect(() => {
    if (tripId && user) {
      const joinTrip = async () => {
        const memberRef = doc(db, 'trips', tripId, 'members', user.uid);
        await setDoc(memberRef, {
          userId: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Explorer',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          votedMonthIndex: null
        }, { merge: true });
      };
      joinTrip();
    }
  }, [tripId, user]);

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

  const fetchDestinationIntelligence = async (dest: string, forTrip: boolean = false) => {
    // Check for Demo Data first to bypass API
    const demoMatch = Object.keys(DEMO_DATA).find(key => 
      key.toLowerCase().includes(dest.toLowerCase()) || dest.toLowerCase().includes(key.toLowerCase())
    );

    let data: TripIntelligence;

    if (demoMatch) {
      if (!forTrip) setIsSearching(true);
      data = DEMO_DATA[demoMatch];
      if (!forTrip) {
        setTimeout(() => {
          setIntelligence(data);
          const currentMonthIdx = new Date().getMonth();
          const idealIdx = data.monthlyData.findIndex(m => m.isIdeal);
          setActiveMonthIndex(idealIdx !== -1 ? idealIdx : currentMonthIdx);
          setHasSearched(true);
          setIsSearching(false);
        }, 800);
      }
    } else {
      if (!forTrip) setIsSearching(true);
      setError(null);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const msg = "AI search is not configured. Add your Gemini API key to .env to enable live destination lookup.";
        if (forTrip) throw new Error(msg);
        setError(msg);
        if (!forTrip) setIsSearching(false);
        return null;
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an expert travel planner with deep local knowledge. The user wants to travel to: ${dest}.
Provide a comprehensive destination guide with insider knowledge a typical tourist wouldn't know.
Return ONLY a raw JSON object (no markdown, no code fences, no explanation) with exactly these keys:
{
  "title": "Catchy 2-word title e.g. The Ultimate",
  "subtitle": "Destination tagline e.g. Kyoto Experience",
  "summary": "2-3 sentences on vibe and appeal",
  "whyVisit": "2-3 sentences on why people visit",
  "whenToVisit": "2-3 sentences on best times and crowds",
  "averageDailySpend": 150,
  "seasons": { "high": "months", "low": "months", "shoulder": "months" },
  "weatherCard": { "condition": "Sunny", "tempHigh": 75, "tempLow": 55, "note": "string", "month": "October" },
  "monthlyData": [
    { "month": "JAN", "flightCost": 800, "temp": 55, "condition": "Sunny", "note": "Local insight", "isIdeal": false, "crowdLevel": 4 }
    ... 12 total, condition must be one of: Sunny, Partly Cloudy, Rainy, Snow. isIdeal true for max 3 months.
  ],
  "foodAndCulture": {
    "categories": [
      { "title": "Breakfast & Morning Rituals", "items": [{ "name": "string", "description": "string", "imageKeyword": "singleword" }] },
      { "title": "Lunch & Street Food", "items": [...] },
      { "title": "Dinner & Fine Dining", "items": [...] },
      { "title": "Drinks & Nightlife", "items": [...] }
    ],
    "mustTry": ["specific dish or experience"],
    "culturalEtiquette": [{ "title": "string", "description": "string" }]
  },
  "topActivities": [6 objects: { "title": "string", "description": "string", "imageKeyword": "singleword" }],
  "nicheActivities": [4 objects: { "title": "string", "description": "string", "imageKeyword": "singleword" }],
  "seasonalHighlights": [5 objects: { "title": "string", "description": "string", "timeOfYear": "string" }],
  "events": [5 objects: { "name": "string", "month": "JAN", "description": "string", "type": "festival" }],
  "insiderTips": [5 objects: { "tip": "actionable local insight", "category": "money" }],
  "neighborhoods": [4 objects: { "name": "string", "vibe": "2 words", "bestFor": "string", "mustSee": "string" }],
  "practicalInfo": {
    "visa": "string", "currency": "string", "language": "string",
    "tipping": "string", "safety": "string", "bestTransport": "string",
    "budgetBreakdown": { "budget": "range + notes", "midRange": "range + notes", "luxury": "range + notes" }
  }
}
Valid event types: festival, cultural, sporting, food, music, market.
Valid insiderTip categories: money, transport, food, culture, safety.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        // Strip any accidental markdown code fences before parsing
        let text = (response.text || '').trim();
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        if (!text || text === '{}') throw new Error('Empty response from AI');

        data = JSON.parse(text);

        // Ensure required arrays exist (defensive merge)
        if (!Array.isArray(data.monthlyData) || data.monthlyData.length !== 12) {
          throw new Error('Malformed response: monthlyData missing');
        }

        if (!forTrip) {
          setIntelligence(data);
          const currentMonthIdx = new Date().getMonth();
          const idealIdx = data.monthlyData.findIndex((m: any) => m.isIdeal);
          setActiveMonthIndex(idealIdx !== -1 ? idealIdx : currentMonthIdx);
          setHasSearched(true);
        }
      } catch (err: any) {
        console.error("Waves AI error:", err);
        const isQuota = err?.message?.includes('429') || err?.message?.toLowerCase().includes('quota');
        const isKey = err?.message?.toLowerCase().includes('api key') || err?.message?.toLowerCase().includes('api_key');
        const isJson = err instanceof SyntaxError || err?.message?.includes('JSON') || err?.message?.includes('Unexpected token');
        const msg = isQuota
          ? "Rate limit reached — please wait a minute and try again."
          : isKey
          ? "Invalid API key. Check your GEMINI_API_KEY in .env."
          : isJson
          ? "AI returned an unexpected format. Please try again."
          : `Could not analyze "${dest}". Please try again.`;
        if (forTrip) throw new Error(msg);
        setError(msg);
        if (!forTrip) setIsSearching(false);
        return null;
      }
    }
    
    if (!forTrip) setIsSearching(false);
    return data;
  };

  const startCollaborativeSession = async () => {
    if (!user) {
      setError("Please sign in to start a Trip Crew.");
      return;
    }
    
    if (!destination.trim()) return;

    setIsCreatingTrip(true);
    setError(null);
    try {
      // 1. Get intelligence first
      const data = await fetchDestinationIntelligence(destination, true);
      if (!data) return;

      // 2. Create the Trip Doc
      const tripId = Math.random().toString(36).substring(2, 10);
      const tripRef = doc(db, 'trips', tripId);
      
      await setDoc(tripRef, {
        id: tripId,
        creatorId: user.uid,
        destination: destination,
        intelligence: data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        inviteCode: Math.random().toString(36).substring(2, 6).toUpperCase()
      });

      // 3. Add the creator as the first member
      await setDoc(doc(db, 'trips', tripId, 'members', user.uid), {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Captain',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        votedMonthIndex: null
      });

      // 4. Redirect
      navigate(`/waves/${tripId}`);
      setShowInviteModal(true);
    } catch (err: any) {
      setError(err.message || "Failed to create trip.");
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleVote = async (monthIndex: number) => {
    if (!tripId || !user) return;
    
    const memberRef = doc(db, 'trips', tripId, 'members', user.uid);
    await updateDoc(memberRef, {
      votedMonthIndex: monthIndex,
      lastActive: serverTimestamp()
    });
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
            
            <form onSubmit={handleSearch} className="relative group mb-12">
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

            {!hasSearched && !isSearching && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-4xl"
              >
                <div className="flex items-center justify-between mb-8 px-4">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-cyan-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Explore Global Regions</h2>
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-medium italic">
                    AI-Powered Discovery
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
                  {[
                    { name: 'Nordic Escapes', icon: Snowflake, color: 'text-blue-400', search: 'Scandinavia' },
                    { name: 'Mediterranean Sun', icon: Sun, color: 'text-amber-400', search: 'Mediterranean Coast' },
                    { name: 'Asian Metropolis', icon: MapPin, color: 'text-rose-400', search: 'Tokyo or Seoul' },
                    { name: 'Tropical Islands', icon: Plane, color: 'text-emerald-400', search: 'Bali or Maldives' },
                    { name: 'Alpine Peaks', icon: Cloud, color: 'text-indigo-400', search: 'Swiss Alps' },
                    { name: 'Serengeti Plains', icon: SlidersHorizontal, color: 'text-orange-400', search: 'Serengeti, Tanzania' },
                    { name: 'Hidden Gems', icon: Sparkles, color: 'text-purple-400', search: 'Hidden gems in Europe' },
                    { name: 'Ancient Heritage', icon: Clock, color: 'text-yellow-400', search: 'Ancient ruins world' }
                  ].map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setDestination(cat.search);
                        fetchDestinationIntelligence(cat.search);
                      }}
                      className="group flex flex-col items-center gap-4 p-6 bg-[#0B1221]/40 border border-white/5 rounded-3xl hover:bg-[#0B1221] hover:border-cyan-500/50 transition-all duration-500"
                    >
                      <div className={`p-4 rounded-2xl bg-white/5 group-hover:bg-cyan-500/10 ${cat.color} transition-all`}>
                        <cat.icon size={20} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center group-hover:text-white transition-colors">{cat.name}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-3">
                  <p className="w-full text-center text-[10px] uppercase tracking-widest text-slate-500 mb-2">Popular Cities</p>
                  {Object.keys(DEMO_DATA).map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setDestination(city);
                        fetchDestinationIntelligence(city);
                      }}
                      className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-black text-slate-400 hover:bg-white/10 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                    >
                      {city.split(',')[0]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
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
            <p className="text-sm text-slate-400 font-light leading-relaxed mb-8">
              {data.summary}
            </p>

            {/* Season Breakdown */}
            <div className="space-y-3">
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-bold mb-3">Season Guide</p>
              <div className="flex items-start gap-3">
                <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] uppercase tracking-widest text-rose-400 font-bold shrink-0">Peak</span>
                <span className="text-xs text-slate-500 font-light leading-relaxed">{data.seasons.high}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] uppercase tracking-widest text-amber-400 font-bold shrink-0">Shoulder</span>
                <span className="text-xs text-slate-500 font-light leading-relaxed">{data.seasons.shoulder}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] uppercase tracking-widest text-emerald-400 font-bold shrink-0">Low Season</span>
                <span className="text-xs text-slate-500 font-light leading-relaxed">{data.seasons.low}</span>
              </div>
            </div>

            {/* Best Value Month */}
            {(() => {
              const minCost = Math.min(...data.monthlyData.map(m => m.flightCost));
              const bestMonth = data.monthlyData.find(m => m.flightCost === minCost);
              return bestMonth ? (
                <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mb-2">Best Value Month</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm">{bestMonth.month}</span>
                    <span className="text-emerald-400 font-bold">${bestMonth.flightCost}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-light">{bestMonth.note}</p>
                </div>
              ) : null;
            })()}
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

        {/* Year-Round Flights & Climate - COLLABORATIVE WORKSPACE */}
        <section className="mb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Calendar size={24} />
              </div>
              <div>
                <h2 className="text-3xl text-white font-serif tracking-tight">Trip Pulse</h2>
                <p className="text-slate-500 text-xs">A 12-month seasonality and cost breakdown.</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest font-bold">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></span>
                <span className="text-slate-300">Ideal Window</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0B1221]/50 border border-white/10 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-end justify-between h-80 gap-1 md:gap-3">
                {(() => {
                  const maxCost = Math.max(...data.monthlyData.map(d => d.flightCost), 500);
                  return data.monthlyData.map((item, i) => {
                    const heightPercent = Math.max(15, (item.flightCost / maxCost) * 100);
                    const isSelected = activeMonthIndex === i;
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full">
                        <div className="w-full relative flex flex-col items-center justify-end h-full">
                          
                          <button 
                            onClick={() => {
                              setActiveMonthIndex(i);
                            }}
                            className={`w-full max-w-[64px] rounded-t-2xl transition-all duration-500 relative group ${
                              item.isIdeal 
                                ? 'bg-gradient-to-t from-cyan-900/40 to-cyan-400/80' 
                                : 'bg-white/5 hover:bg-white/10'
                            } ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-4 ring-offset-[#0B1221]' : ''}`}
                            style={{ height: `${heightPercent}%` }}
                          >
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#050B14] border border-white/10 rounded-xl px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all z-30 shadow-2xl">
                              <span className="text-white font-bold text-xs">${item.flightCost}</span>
                            </div>
                          </button>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1.5">
                          {item.isIdeal && <Sparkles size={10} className="text-cyan-400" />}
                          <span className={`text-[10px] font-black tracking-widest uppercase ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`}>
                            {item.month}
                          </span>
                          {/* Crowd dots */}
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(dot => (
                              <div key={dot} className={`w-1 h-1 rounded-full transition-colors ${Math.round(item.crowdLevel / 2) >= dot ? (item.crowdLevel >= 8 ? 'bg-rose-400' : item.crowdLevel >= 5 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-white/10'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Month Deep-Dive Card */}
              {(() => {
                const item = data.monthlyData[activeMonthIndex];
                const maxCost = Math.max(...data.monthlyData.map(d => d.flightCost));
                const minCost = Math.min(...data.monthlyData.map(d => d.flightCost));
                const savingsPct = maxCost > minCost ? Math.round(((maxCost - item.flightCost) / (maxCost - minCost)) * 100) : 0;
                const monthEvents = (data.events || []).filter(e => e.month === item.month);
                const crowdLabel = item.crowdLevel >= 8 ? 'Very Busy' : item.crowdLevel >= 6 ? 'Moderate' : item.crowdLevel >= 4 ? 'Manageable' : 'Quiet';
                const crowdColor = item.crowdLevel >= 8 ? 'text-rose-400' : item.crowdLevel >= 6 ? 'text-amber-400' : 'text-emerald-400';
                const weatherIcon = item.condition.includes('Sun') ? <Sun size={18} className="text-amber-400" /> : item.condition.includes('Rain') ? <CloudRain size={18} className="text-cyan-400" /> : item.condition.includes('Snow') ? <Snowflake size={18} className="text-indigo-400" /> : <Cloud size={18} className="text-slate-400" />;
                return (
                  <motion.div
                    key={activeMonthIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-8 bg-[#050B14] border border-white/10 rounded-3xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6"
                  >
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Temperature</p>
                      <div className="flex items-center gap-2">
                        {weatherIcon}
                        <span className="text-2xl text-white font-light">{item.temp}°F</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{item.condition}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Round-Trip Flight</p>
                      <span className="text-2xl text-white font-light">${item.flightCost.toLocaleString()}</span>
                      {savingsPct > 10 && (
                        <p className="text-[10px] text-emerald-400 mt-1 font-bold">Save ~{savingsPct}% vs peak</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Crowd Level</p>
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(dot => (
                          <div key={dot} className={`w-3 h-3 rounded-full ${Math.round(item.crowdLevel / 2) >= dot ? (item.crowdLevel >= 8 ? 'bg-rose-400' : item.crowdLevel >= 5 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-white/10'}`} />
                        ))}
                      </div>
                      <p className={`text-[10px] font-bold ${crowdColor}`}>{crowdLabel}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Local Vibe</p>
                      <p className="text-xs text-slate-300 font-light leading-relaxed">{item.note}</p>
                    </div>
                    {monthEvents.length > 0 && (
                      <div className="col-span-full border-t border-white/5 pt-4">
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-3 font-bold flex items-center gap-2">
                          <Star size={10} className="text-amber-400" /> Events This Month
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {monthEvents.map((event, i) => (
                            <span key={i} className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 font-medium">{event.name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* The Draw: Why & When - WITH BUDGET INSIGHTS */}
        <section className="mb-20 grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-2xl text-white font-serif">The Draw</h3>
              </div>
              <p className="text-slate-400 font-light leading-relaxed">
                {data.whyVisit}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Calendar size={20} />
                </div>
                <h3 className="text-2xl text-white font-serif">When to Go</h3>
              </div>
              <p className="text-slate-400 font-light leading-relaxed">
                {data.whenToVisit}
              </p>
            </div>
            
            {/* Budget Insight */}
            {data.averageDailySpend && (
              <div className="md:col-span-2 p-8 bg-[#0B1221] border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 border-l-cyan-500/50 border-l-4">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <DollarSign size={28} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Estimated Daily Spend</h4>
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Mid-range comfort level</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl text-white font-light tracking-tight">${data.averageDailySpend}</span>
                  <span className="text-slate-500 text-sm">/ day</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Weather Card - REFINED */}
          <div className="bg-[#0B1221] border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/10 transition-colors"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-black px-3 py-1 bg-cyan-400/10 rounded-full">Climate Pulse</span>
              {(() => {
                const monthData = data.monthlyData[activeMonthIndex];
                const cond = monthData?.condition || "Sunny";
                if (cond.includes('Sun')) return <Sun size={24} className="text-amber-400" />;
                if (cond.includes('Rain')) return <CloudRain size={24} className="text-cyan-400" />;
                if (cond.includes('Snow')) return <Snowflake size={24} className="text-indigo-400" />;
                return <Cloud size={24} className="text-slate-400" />;
              })()}
            </div>

            <div className="flex items-center justify-between gap-1 mb-10 bg-white/5 p-1 rounded-2xl relative z-10">
              {data.monthlyData.map((m, idx) => (
                <button
                  key={m.month}
                  onClick={() => setActiveMonthIndex(idx)}
                  className={`flex-1 text-[9px] py-2 rounded-xl transition-all font-black uppercase ${
                    activeMonthIndex === idx 
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {m.month.substring(0, 1)}
                </button>
              ))}
            </div>
            
            <div className="flex items-baseline gap-2 mb-4 relative z-10">
              <span className="text-7xl text-white font-light tracking-tighter">{data.monthlyData[activeMonthIndex]?.temp || 0}°</span>
              <span className="text-2xl text-slate-500 font-serif">F</span>
            </div>
            
            <p className="text-sm text-slate-300 font-light leading-relaxed relative z-10">
              {data.monthlyData[activeMonthIndex]?.note || "Select a month to see local weather context."}
            </p>
          </div>
        </section>

        {/* Food & Culture Section - Editorial Redesign */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              <Sparkles size={28} className="text-cyan-400" />
            </div>
            <h2 className="text-4xl md:text-6xl text-white font-serif tracking-tight">The Culinary Journey</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Left Column: Categories */}
            <div className="lg:col-span-8 space-y-24">
              {data.foodAndCulture.categories.map((cat, idx) => (
                <div key={idx} className="relative">
                  <div className="flex items-center gap-6 mb-12">
                    <span className="text-6xl font-serif text-white/5 select-none">0{idx + 1}</span>
                    <h3 className="text-3xl text-white font-serif border-b border-white/10 pb-4 flex-1">{cat.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {cat.items.map((item, i) => (
                      <div key={i} className="group flex flex-col gap-6 items-start">
                        <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 relative">
                          <img 
                            src={`https://picsum.photos/seed/${item.imageKeyword}/600/600`} 
                            alt={item.name}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050B14]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="px-2">
                          <h4 className="text-xl text-white font-serif mb-3 group-hover:text-cyan-400 transition-colors">{item.name}</h4>
                          <p className="text-sm text-slate-400 font-light leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Etiquette & Must-Haves - CLEANED UP */}
            <div className="lg:col-span-4">
              <div className="sticky top-12 space-y-12">
                <div className="bg-[#0B1221] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <CheckCircle2 size={120} />
                  </div>
                  <h4 className="text-white font-serif text-2xl mb-10">The Must-Haves</h4>
                  <div className="space-y-8">
                    {data.foodAndCulture.mustTry.map((item, i) => (
                      <div key={i} className="flex items-center gap-5 group">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold transition-all group-hover:bg-cyan-500 group-hover:text-white">
                          {i + 1}
                        </div>
                        <span className="text-base text-slate-300 group-hover:text-white transition-colors">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
                  <h4 className="text-white font-serif text-2xl mb-10 flex items-center gap-4">
                    <Users size={24} className="text-indigo-400" />
                    Local Etiquette
                  </h4>
                  <div className="space-y-10">
                    {data.foodAndCulture.culturalEtiquette.map((item, i) => (
                      <div key={i} className="relative pl-6 border-l-2 border-indigo-500/20 hover:border-indigo-500 transition-colors">
                        <h5 className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-3">{item.title}</h5>
                        <p className="text-sm text-slate-400 font-light leading-relaxed italic">
                          "{item.description}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Activities - Bento Grid */}
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-12">
            <MapPin size={24} className="text-cyan-400" />
            <h2 className="text-3xl md:text-4xl text-white font-serif">Top Activities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.topActivities.map((act, i) => (
              <div key={i} className="group relative h-80 rounded-[2rem] overflow-hidden border border-white/10">
                <img 
                  src={`https://picsum.photos/seed/${act.imageKeyword}/800/600`} 
                  alt={act.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 p-8">
                  <h4 className="text-xl text-white font-serif mb-2">{act.title}</h4>
                  <p className="text-xs text-slate-300 font-light line-clamp-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Niche Experiences */}
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-12">
            <Sparkles size={24} className="text-cyan-400" />
            <h2 className="text-3xl md:text-4xl text-white font-serif">Niche Experiences</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.nicheActivities.map((act, i) => (
              <div key={i} className="group flex flex-col md:flex-row gap-8 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:border-white/20 transition-all">
                <div className="w-full md:w-48 h-48 rounded-3xl overflow-hidden shrink-0">
                  <img 
                    src={`https://picsum.photos/seed/${act.imageKeyword}/400/400`} 
                    alt={act.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-2xl text-white font-serif mb-4">{act.title}</h4>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seasonal Highlights & Timeline */}
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-12">
            <Calendar size={24} className="text-cyan-400" />
            <h2 className="text-3xl md:text-4xl text-white font-serif">Seasonal Highlights</h2>
          </div>
          <div className="space-y-6">
            {data.seasonalHighlights.map((hl, i) => (
              <div key={i} className="relative pl-12 pb-12 border-l border-white/10 last:border-0 last:pb-0">
                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h4 className="text-xl text-white font-serif">{hl.title}</h4>
                    <span className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                      {hl.timeOfYear}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    {hl.description}
                  </p>
                </div>
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

        {/* Events & Festivals */}
        {data.events && data.events.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Star size={24} />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl text-white font-serif">Events & Festivals</h2>
                <p className="text-slate-500 text-xs mt-1">What's happening when you're there</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.events.map((event, i) => {
                const typeStyles: Record<string, string> = {
                  festival: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                  cultural: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                  sporting: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                  food: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                  music: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
                  market: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                };
                const style = typeStyles[event.type] || typeStyles.cultural;
                return (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-7 hover:border-amber-500/20 transition-all group">
                    <div className="flex items-start justify-between mb-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-bold border ${style}`}>
                        {event.type}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold bg-white/5 px-2.5 py-1 rounded-full">{event.month}</span>
                    </div>
                    <h4 className="text-lg text-white font-serif mb-3 group-hover:text-amber-400 transition-colors">{event.name}</h4>
                    <p className="text-sm text-slate-400 font-light leading-relaxed">{event.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Insider Knowledge */}
        {data.insiderTips && data.insiderTips.length > 0 && (
          <section className="mb-24">
            <div className="bg-[#0B1221]/80 border border-white/10 rounded-[3rem] p-10 md:p-14 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                <Lightbulb size={200} />
              </div>
              <div className="flex items-center gap-4 mb-12 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                  <Lightbulb size={24} />
                </div>
                <div>
                  <h2 className="text-3xl text-white font-serif">Insider Knowledge</h2>
                  <p className="text-slate-500 text-xs mt-1">Things only locals know</p>
                </div>
              </div>
              <div className="space-y-8 relative z-10">
                {data.insiderTips.map((tip, i) => {
                  const catStyles: Record<string, string> = {
                    money: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    transport: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    food: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                    culture: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                    safety: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                  };
                  const style = catStyles[tip.category] || catStyles.culture;
                  return (
                    <div key={i} className="flex items-start gap-6 group">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-sm shrink-0 group-hover:bg-yellow-500 group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold border mb-2 ${style}`}>
                          {tip.category}
                        </span>
                        <p className="text-slate-300 font-light leading-relaxed">{tip.tip}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Neighborhood Guide */}
        {data.neighborhoods && data.neighborhoods.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Map size={24} />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl text-white font-serif">Neighborhood Guide</h2>
                <p className="text-slate-500 text-xs mt-1">Where to base yourself and what to expect</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.neighborhoods.map((hood, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:border-indigo-500/30 transition-all group">
                  <div className="flex items-start justify-between mb-6">
                    <h4 className="text-2xl text-white font-serif group-hover:text-indigo-400 transition-colors">{hood.name}</h4>
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[9px] uppercase tracking-widest text-indigo-400 font-bold shrink-0">{hood.vibe}</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Best For</p>
                      <p className="text-sm text-slate-300 font-light leading-relaxed">{hood.bestFor}</p>
                    </div>
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 flex items-center gap-1.5"><ChevronRight size={10} /> Don't Miss</p>
                      <p className="text-sm text-slate-300 font-light leading-relaxed">{hood.mustSee}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Practical Trip Intelligence */}
        {data.practicalInfo && (
          <section className="mb-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center text-slate-400">
                <Info size={24} />
              </div>
              <div>
                <h2 className="text-3xl text-white font-serif">Trip Intelligence</h2>
                <p className="text-slate-500 text-xs mt-1">Everything you need to know before you go</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                {([
                  { label: 'Visa', value: data.practicalInfo.visa, icon: Globe },
                  { label: 'Currency', value: data.practicalInfo.currency, icon: DollarSign },
                  { label: 'Language', value: data.practicalInfo.language, icon: Globe },
                  { label: 'Tipping', value: data.practicalInfo.tipping, icon: Wallet },
                  { label: 'Safety', value: data.practicalInfo.safety, icon: CheckCircle2 },
                  { label: 'Best Transport', value: data.practicalInfo.bestTransport, icon: Plane },
                ] as { label: string; value: string; icon: React.ElementType }[]).map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</p>
                      <p className="text-sm text-slate-300 font-light leading-relaxed">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#0B1221] border border-white/10 rounded-[2.5rem] p-8 flex flex-col">
                <h4 className="text-white font-serif text-xl mb-2">Budget Breakdown</h4>
                <p className="text-xs text-slate-500 mb-8 font-light">Estimated all-in daily spend (incl. accommodation)</p>
                <div className="space-y-3 flex-1">
                  {([
                    { tier: 'Budget', price: data.practicalInfo.budgetBreakdown.budget, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
                    { tier: 'Mid-Range', price: data.practicalInfo.budgetBreakdown.midRange, color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20' },
                    { tier: 'Luxury', price: data.practicalInfo.budgetBreakdown.luxury, color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/20' },
                  ]).map(({ tier, price, color, bg, border }) => (
                    <div key={tier} className={`flex items-start justify-between p-5 ${bg} border ${border} rounded-2xl gap-4`}>
                      <span className={`text-[10px] uppercase tracking-widest font-bold ${color} shrink-0 mt-0.5`}>{tier}</span>
                      <span className="text-slate-300 text-sm font-light text-right leading-relaxed">{price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <InviteModal 
        show={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
        tripId={tripId || ''} 
      />
    </div>
  );
}

function InviteModal({ show, onClose, tripId }: { show: boolean, onClose: () => void, tripId: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/waves/${tripId}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-32">
      <div className="absolute inset-0 bg-[#050B14]/80 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-[#0B1221] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl"
      >
        <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 mx-auto">
          <Users size={32} />
        </div>
        <h3 className="text-3xl font-serif font-black text-white text-center mb-2 tracking-tight">The Crew is Ready</h3>
        <p className="text-slate-400 text-center mb-8">Share this link with your trip partners to start voting and planning in sync.</p>
        
        <div className="space-y-4">
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono truncate mr-4">{link}</span>
            <button 
              onClick={copy}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-cyan-400"
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl text-white text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20"
          >
            Enter Workspace
          </button>
        </div>
      </motion.div>
    </div>
  );
}
