import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { TrendingUp, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import { auth, signInWithGoogle } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/orbit/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/orbit/dashboard');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for Google Sign-In. Please add this URL to your Firebase Authorized Domains list.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C3338] font-sans flex flex-col selection:bg-[#C5A059]/30">
      <header className="px-6 py-6 absolute top-0 left-0 w-full z-10">
        <Link to="/portfolio" className="inline-flex items-center gap-2 text-[#8C8670] hover:text-[#2C3338] transition-colors font-mono text-[11px] uppercase tracking-widest">
          <ChevronLeft size={14} /> Back to Portfolio
        </Link>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side - Branding */}
        <div className="flex-1 flex flex-col justify-center px-12 lg:px-24 py-20 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#E8E4D0]">
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#E8E4D0] clip-path-hero z-0 hidden lg:block opacity-30" />
          
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-[#C5A059] rounded-xl flex items-center justify-center">
                <TrendingUp size={32} className="text-[#FAF9F6]" />
              </div>
              <div>
                <h1 className="text-4xl font-serif font-bold text-[#2C3338] italic leading-none">Orbit</h1>
                <p className="text-[12px] font-mono uppercase tracking-[0.2em] text-[#C5A059] mt-2">Strategic Wealth Intelligence</p>
              </div>
            </div>
            
            <h2 className="text-[clamp(32px,4vw,48px)] font-serif font-bold text-[#2C3338] leading-[1.1] mb-6">
              Master your financial trajectory.
            </h2>
            <p className="text-[#8C8670] text-lg leading-relaxed mb-10 max-w-md">
              A comprehensive dashboard for tracking net worth, analyzing historical performance, and planning your retirement strategy.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-[#2C3338]">
                <ShieldCheck size={18} className="text-[#1E5C38]" />
                <span>Secure, private, and encrypted data storage</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#2C3338]">
                <ShieldCheck size={18} className="text-[#1E5C38]" />
                <span>Real-time currency conversion and tracking</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#2C3338]">
                <ShieldCheck size={18} className="text-[#1E5C38]" />
                <span>Advanced retirement modeling and forecasting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-20 bg-[#FAF9F6]">
          <div className="w-full max-w-md">
            <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-10 rounded-xl shadow-2xl">
              <h3 className="text-2xl font-serif font-bold text-[#2C3338] mb-2">Welcome to Orbit</h3>
              <p className="text-[#8C8670] text-sm mb-8">Sign in to start tracking your financial future.</p>
              
              {error && (
                <div className="mb-6 p-4 bg-[#8B0000]/10 border border-[#8B0000]/30 rounded-xl text-[#8B0000] text-sm leading-relaxed">
                  {error}
                </div>
              )}

              <div className="space-y-2 mb-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-[#2C3338] text-[#FAF9F6] py-3.5 px-4 rounded-xl font-semibold hover:bg-[#3D464D] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#FAF9F6]/20 border-t-[#FAF9F6] rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>
                <p className="text-center text-[#8C8670] text-[10px] font-mono uppercase tracking-widest">No account creation required</p>
              </div>

              <div className="relative flex items-center py-4 mb-6">
                <div className="flex-grow border-t border-[#E8E4D0]"></div>
                <span className="flex-shrink-0 mx-4 text-[#8C8670] text-xs font-mono uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-[#E8E4D0]"></div>
              </div>

              <Link 
                to="/orbit/dashboard"
                className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#E8E4D0] text-[#2C3338] py-3.5 px-4 rounded-xl font-semibold hover:border-[#C5A059] hover:text-[#C5A059] transition-all group"
              >
                Continue as Guest <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <p className="text-center text-[#8C8670] text-xs mt-6 leading-relaxed">
                Guest mode allows you to explore the interface, but data will not be saved permanently.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
