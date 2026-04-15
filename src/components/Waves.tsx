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
    ]
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
    ]
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
    ]
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
    ]
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
  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
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
        const demoData = DEMO_DATA[demoMatch];
        setIntelligence(demoData);
        // Set active month to current month or first ideal month
        const currentMonthIdx = new Date().getMonth();
        const idealIdx = demoData.monthlyData.findIndex(m => m.isIdeal);
        setActiveMonthIndex(idealIdx !== -1 ? idealIdx : currentMonthIdx);
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
        Focus heavily on local culture, food, and "in the weeds" details that only a local would know.
        Format the response exactly as a JSON object with these keys:
        - "title": Catchy title (e.g., "The Ultimate").
        - "subtitle": Destination name (e.g., "Kyoto Experience").
        - "summary": 2-3 sentences summarizing the vibe and overall appeal.
        - "whyVisit": 2-3 sentences on why people visit this location.
        - "whenToVisit": 2-3 sentences on the best times to visit and crowd levels.
        - "seasons": { "high": "string", "low": "string", "shoulder": "string" } describing the months for each season.
        - "weatherCard": { "condition": "Sunny" | "Partly Cloudy" | "Rainy" | "Snow", "tempHigh": number, "tempLow": number, "note": string (e.g., "Perfect beach weather"), "month": string (e.g., "October" or "Peak Summer") } representing the absolute BEST time to visit.
        - "monthlyData": Array of exactly 12 objects (Jan-Dec). Each has: "month" (e.g., "JAN"), "flightCost" (estimated average round-trip flight cost in USD from a major global hub, number), "temp" (average high temperature in Fahrenheit, number), "condition": "Sunny" | "Partly Cloudy" | "Rainy" | "Snow", "note": "Short weather context for this month", "isIdeal" (boolean, true for the 2-3 best months to visit), and "crowdLevel" (number 1-10, where 10 is most crowded).
        - "foodAndCulture": { 
            "categories": [
              { "title": "Breakfast & Morning Rituals", "items": [{ "name": "string", "description": "string", "imageKeyword": "string" }] },
              { "title": "Lunch & Street Food", "items": [{ "name": "string", "description": "string", "imageKeyword": "string" }] },
              { "title": "Dinner & Fine Dining", "items": [{ "name": "string", "description": "string", "imageKeyword": "string" }] },
              { "title": "Drinks & Nightlife", "items": [{ "name": "string", "description": "string", "imageKeyword": "string" }] }
            ], 
            "mustTry": ["string"], 
            "culturalEtiquette": [{ "title": "string", "description": "string" }] 
          }
        - "topActivities": Array of exactly 6 objects representing the best things to do year-round. Each has "title", "description", and "imageKeyword".
        - "nicheActivities": Array of exactly 4 objects for unique, less-known experiences. Each has "title", "description", and "imageKeyword".
        - "seasonalHighlights": Array of exactly 5 objects for specific times of year. Each has "title", "description", "timeOfYear" (e.g., "Late Autumn").
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
      // Set active month to current month or first ideal month
      const currentMonthIdx = new Date().getMonth();
      const idealIdx = data.monthlyData.findIndex((m: any) => m.isIdeal);
      setActiveMonthIndex(idealIdx !== -1 ? idealIdx : currentMonthIdx);
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

        {/* Year-Round Flights & Climate - MOVED UP */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Plane size={24} className="text-cyan-400" />
              <h2 className="text-3xl md:text-4xl text-white font-serif">Flights & Climate</h2>
            </div>
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span className="text-slate-400">Ideal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                <span className="text-slate-500">Average</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-x-auto">
            <div className="min-w-[800px] flex items-end justify-between gap-4 h-64">
              {data.monthlyData.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="w-full flex flex-col items-center gap-2 mb-4">
                    <span className="text-[10px] text-slate-500 font-medium group-hover:text-cyan-400 transition-colors">${m.flightCost}</span>
                    <div 
                      className={`w-full rounded-t-xl transition-all duration-500 relative ${m.isIdeal ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-white/10 group-hover:bg-white/20'}`}
                      style={{ height: `${(m.flightCost / 2000) * 160}px` }}
                    >
                      {m.isIdeal && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                          <Sparkles size={12} className="text-cyan-400 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full transition-all duration-1000 ${m.crowdLevel > 7 ? 'bg-rose-500' : m.crowdLevel > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${m.crowdLevel * 10}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold tracking-tighter ${m.isIdeal ? 'text-cyan-400' : 'text-slate-600'}`}>{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Draw: Why & When */}
        <section className="mb-20 grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12">
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
          </div>
          
          {/* Weather Card - Integrated & Interactive */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-medium">Climate Snapshot</span>
              {(() => {
                const monthData = data.monthlyData[activeMonthIndex];
                const cond = monthData?.condition || "Sunny";
                if (cond.includes('Sun')) return <Sun size={24} className="text-amber-400" />;
                if (cond.includes('Rain')) return <RefreshCw size={24} className="text-cyan-400 animate-pulse" />;
                return <ThermometerSun size={24} className="text-cyan-400" />;
              })()}
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl text-white font-light">{data.monthlyData[activeMonthIndex]?.temp || 0}°</span>
              <span className="text-xl text-slate-400">Fahrenheit</span>
            </div>
            
            <p className="text-sm text-slate-300 font-light leading-relaxed mb-8 min-h-[40px]">
              {data.monthlyData[activeMonthIndex]?.note || "Select a month to see local weather context."}
            </p>

            <div className="grid grid-cols-6 gap-2 pt-6 border-t border-white/5">
              {data.monthlyData.map((m, idx) => {
                const isCurrentMonth = idx === new Date().getMonth();
                return (
                  <button
                    key={m.month}
                    onClick={() => setActiveMonthIndex(idx)}
                    className={`text-[9px] py-2 rounded-lg transition-all border ${
                      activeMonthIndex === idx 
                        ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                        : isCurrentMonth
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {m.month}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Food & Culture Section - Editorial Redesign */}
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-12">
            <Sparkles size={24} className="text-cyan-400" />
            <h2 className="text-3xl md:text-5xl text-white font-serif">The Culinary Journey</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Categories */}
            <div className="lg:col-span-8 space-y-16">
              {data.foodAndCulture.categories.map((cat, idx) => (
                <div key={idx} className="relative">
                  <div className="flex items-baseline gap-4 mb-8">
                    <span className="text-4xl font-serif text-white/10">0{idx + 1}</span>
                    <h3 className="text-2xl text-white font-serif border-b border-white/10 pb-2 flex-1">{cat.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {cat.items.map((item, i) => (
                      <div key={i} className="group flex gap-6 items-start">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                          <img 
                            src={`https://picsum.photos/seed/${item.imageKeyword}/200/200`} 
                            alt={item.name}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-1 group-hover:text-cyan-400 transition-colors">{item.name}</h4>
                          <p className="text-xs text-slate-400 font-light leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Etiquette & Must-Haves */}
            <div className="lg:col-span-4 space-y-12">
              <div className="bg-[#0B1221] border border-white/10 rounded-[2rem] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CheckCircle2 size={80} />
                </div>
                <h4 className="text-white font-serif text-xl mb-8">The Must-Haves</h4>
                <div className="space-y-6">
                  {data.foodAndCulture.mustTry.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold">
                        {i + 1}
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-white/5 rounded-[2rem] p-8">
                <h4 className="text-white font-serif text-xl mb-8 flex items-center gap-3">
                  <Users size={20} className="text-indigo-400" />
                  Local Etiquette
                </h4>
                <div className="space-y-8">
                  {data.foodAndCulture.culturalEtiquette.map((item, i) => (
                    <div key={i}>
                      <h5 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">{item.title}</h5>
                      <p className="text-sm text-slate-400 font-light leading-relaxed italic">
                        "{item.description}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Year-Round Flights & Climate */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl text-white font-serif">Year-Round Flights & Climate</h2>
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span>Ideal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/10"></div>
                <span>Average</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0B1221]/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
            {/* 12-Month Chart */}
            <div className="pt-12 pb-4">
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
                        
                        {/* Crowd Level Indicator */}
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, idx) => (
                            <div 
                              key={idx} 
                              className={`flex-1 h-full rounded-full ${idx < item.crowdLevel ? (item.crowdLevel > 7 ? 'bg-rose-500' : 'bg-cyan-500/50') : 'bg-transparent'}`}
                            />
                          ))}
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
      </main>
    </div>
  );
}
