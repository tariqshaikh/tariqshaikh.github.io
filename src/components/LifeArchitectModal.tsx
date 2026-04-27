import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Car, 
  Home, 
  Dog, 
  Laptop, 
  Plane, 
  Zap,
  Save,
  HelpCircle,
  Database,
  RefreshCw,
  ShoppingCart,
  ShoppingBag
} from 'lucide-react';

interface ArchitectModalProps {
  onClose: () => void;
  onAddOrbits: (orbits: any[]) => void;
}

interface Question {
  id: string;
  text: string;
  options: {
    label: string;
    icon: React.ReactNode;
    suggestion: {
      name: string;
      amount: number;
      category: string;
      description: string;
    } | null;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'utilities',
    text: "Which of these keep your home running?",
    options: [
      { 
        label: "Natural Gas & Electricity", 
        icon: <Zap size={20} />, 
        suggestion: { name: "Natural Gas (High Estimate)", amount: 180, category: "utilities", description: "Variable utility. We recommend estimating for winter peaks to ensure a safe orbit." } 
      },
      { 
        label: "Water & Garbage", 
        icon: <Database size={20} />, 
        suggestion: { name: "Water / Waste Mgmt", amount: 90, category: "utilities", description: "Steady recurring maintenance for the home base." } 
      }
    ]
  },
  {
    id: 'wellbeing',
    text: "How do you invest in your health?",
    options: [
      { 
        label: "I have a Gym Membership", 
        icon: <RefreshCw size={20} />, 
        suggestion: { name: "Gym / Wellness Club", amount: 65, category: "health", description: "Recurring investment in your personal infrastructure." } 
      },
      { 
        label: "Home Workouts / Apps", 
        icon: <Laptop size={20} />, 
        suggestion: { name: "Fitness Subscriptions", amount: 25, category: "health", description: "Digital wellness orbits (Peloton, Calm, etc)." } 
      }
    ]
  },
  {
    id: 'retail',
    text: "Where does your standard retail spend go?",
    options: [
      { 
        label: "Regular Amazon Purchases", 
        icon: <ShoppingCart size={20} />, 
        suggestion: { name: "Retail Reserve (Amazon/General)", amount: 200, category: "retail", description: "Monthly buffer for standard household retail needs." } 
      },
      { 
        label: "Big Box (Target/Walmart)", 
        icon: <ShoppingBag size={20} />, 
        suggestion: { name: "Home Essentials Reserve", amount: 150, category: "retail", description: "Planned monthly orbit for basic home essentials." } 
      }
    ]
  },
  {
    id: 'transport',
    text: "How do you navigate your world?",
    options: [
      { 
        label: "I own a car", 
        icon: <Car size={20} />, 
        suggestion: { name: "Car Maintenance & Insurance", amount: 150, category: "transportation", description: "Conceptual reserve for oil changes, tires, and premiums." } 
      },
      { 
        label: "Public Transit", 
        icon: <Plane size={20} />, 
        suggestion: { name: "Transit Pass / Commute", amount: 100, category: "transportation", description: "Monthly orbit for commuting and city travel." } 
      }
    ]
  },
  {
    id: 'companions',
    text: "Any furry co-pilots in your life?",
    options: [
      { 
        label: "Yes, Pets", 
        icon: <Dog size={20} />, 
        suggestion: { name: "Pet Health & Food", amount: 120, category: "lifestyle", description: "Recurring orbit for vet visits and premium sustenance." } 
      },
      { 
        label: "No Pets", 
        icon: <X size={20} />, 
        suggestion: null 
      }
    ]
  }
];

export default function LifeArchitectModal({ onClose, onAddOrbits }: ArchitectModalProps) {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<any[]>([]);

  const handleSelect = (suggestion: any) => {
    if (suggestion) {
      setSelections(prev => {
        // Prevent duplicate names
        if (prev.find(s => s.name === suggestion.name)) return prev;
        return [...prev, suggestion];
      });
    }
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setStep(QUESTIONS.length); // Final review step
    }
  };

  const currentQuestion = QUESTIONS[step];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#2C3338]/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-[#E8E4D0]"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center text-white">
                <HelpCircle size={18} />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold text-[#8C8670]">Life Architect Wizard</p>
            </div>
            <button onClick={onClose} className="text-[#8C8670] hover:text-[#2C3338] transition-colors">
              <X size={24} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step < QUESTIONS.length ? (
              <motion.div 
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-[#C5A059] font-bold">Step {step + 1} of {QUESTIONS.length}</p>
                  <h2 className="text-3xl font-serif font-bold text-[#2C3338] leading-tight italic">
                    {currentQuestion.text}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(opt.suggestion)}
                      className="w-full p-5 bg-[#FAF9F6] border border-[#E8E4D0] rounded-2xl flex items-center justify-between group hover:border-[#C5A059] hover:bg-white transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white border border-[#E8E4D0] rounded-xl flex items-center justify-center text-[#8C8670] group-hover:text-[#C5A059] group-hover:border-[#C5A059] transition-all">
                          {opt.icon}
                        </div>
                        <span className="font-bold text-[#2C3338]">{opt.label}</span>
                      </div>
                      <ChevronRight size={18} className="text-[#E8E4D0] group-hover:text-[#C5A059] transition-all" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-[#1E5C38]/10 text-[#1E5C38] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-[#2C3338] italic">Architecture Mapped</h2>
                  <p className="text-sm text-[#8C8670]">We've identified {selections.length} Orbits to anchor your finances.</p>
                </div>

                <div className="space-y-3">
                  {selections.map((s, idx) => (
                    <div key={idx} className="p-4 border border-[#E8E4D0] rounded-xl bg-[#FAF9F6]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-[#2C3338]">{s.name}</span>
                        <span className="font-mono text-xs font-bold text-[#1E5C38]">${s.amount}/mo</span>
                      </div>
                      <p className="text-[10px] text-[#8C8670] leading-normal">{s.description}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex gap-3">
                   <button 
                    onClick={() => setStep(0)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Redesign
                  </button>
                  <button 
                    onClick={() => {
                      onAddOrbits(selections);
                      onClose();
                    }}
                    className="flex-[2] py-4 bg-[#C5A059] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#B38F48] transition-all shadow-lg shadow-[#C5A059]/20 flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Add to My Orbit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
