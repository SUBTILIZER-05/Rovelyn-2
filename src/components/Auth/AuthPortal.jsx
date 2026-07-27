import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles, Activity, Target, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AuthPortal() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error.message || 'Failed to sign in. Please check your credentials.');
        }
      } else {
        const { data, error } = await signUp(email.trim(), password);
        if (error) {
          setErrorMsg(error.message || 'Failed to create account.');
        } else {
          if (data?.user && data?.session === null) {
            setSuccessMsg('Account created! Please check your email for the confirmation link to complete registration.');
          } else {
            setSuccessMsg('Account created successfully! Logging you in...');
          }
        }
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      icon: Sparkles,
      title: '3D Analytics & Focus Matrix',
      desc: 'High-precision performance breakdown & study telemetry metrics',
      glow: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/20'
    },
    {
      icon: Activity,
      title: 'Real-Time Study Telemetry',
      desc: 'Automated session logs & continuous objective tracking',
      glow: 'from-violet-500/20 to-purple-500/10 border-violet-500/20'
    },
    {
      icon: Target,
      title: 'Dynamic Test & Task Hub',
      desc: 'Seamless exam scoring, DPP tracking & target scheduling',
      glow: 'from-blue-500/20 to-indigo-500/10 border-blue-500/20'
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#04040a] text-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden select-none">
      {/* AMBIENT OBSIDIAN & BIOLUMINESCENT BACKGROUND */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 50% -10%, rgba(99, 102, 241, 0.22), transparent 70%),
            radial-gradient(circle at 15% 85%, rgba(139, 92, 246, 0.18), transparent 50%),
            radial-gradient(circle at 85% 80%, rgba(59, 130, 246, 0.15), transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(10, 10, 26, 0.95), #04040a)
          `,
        }}
      />

      {/* Grid Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* LUXURY HIGH-REFRACTION CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl rounded-3xl bg-[#080814]/75 border border-white/10 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]"
      >
        {/* LEFT COLUMN: BRANDING & FEATURE HIGHLIGHTS */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
          {/* Decorative Glow Blob */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            {/* Header / Eyebrow & Wordmark */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-mono font-semibold tracking-[0.2em] text-indigo-300 uppercase mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                JEE '27 EXECUTIVE STUDY OS
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black tracking-[0.2em] text-white font-mono uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] flex items-center">
                ROVELY<span className="text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.9)]">N</span>
              </h1>
              
              <p className="mt-3 text-sm text-slate-400 max-w-md font-sans leading-relaxed">
                Elevate your prep with hyper-focused analytics, real-time focus metrics, and dynamic execution tools designed for top rankers.
              </p>
            </div>

            {/* Bioluminescent Bullet Cards */}
            <div className="space-y-3.5 pt-2">
              {featureCards.map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.1 }}
                    className={`p-4 rounded-2xl bg-gradient-to-r ${feat.glow} border backdrop-blur-md flex items-start gap-4 group hover:border-white/20 transition-all`}
                  >
                    <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold font-mono text-slate-200 uppercase tracking-wider">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug font-sans">
                        {feat.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer Badge */}
          <div className="pt-8 mt-8 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>SECURE SUPABASE AUTH</span>
            <span>v1.0 • ENCRYPTED SESSION</span>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTH FORM SECTION */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-center relative bg-[#060610]/90">
          <div className="w-full max-w-sm mx-auto space-y-6">
            
            {/* Framer Motion Mode Tab Switcher */}
            <div className="relative p-1 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`relative flex-1 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors z-10 ${
                  mode === 'signin' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`relative flex-1 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors z-10 ${
                  mode === 'signup' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>

              {/* Animated Tab Background Pill */}
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute top-1 bottom-1 rounded-xl bg-indigo-600/60 border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                style={{
                  left: mode === 'signin' ? '4px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 6px)',
                }}
              />
            </div>

            {/* Form Title */}
            <div>
              <h2 className="text-xl font-bold font-mono tracking-tight text-white">
                {mode === 'signin' ? 'Welcome Back' : 'Join Rovelyn OS'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {mode === 'signin'
                  ? 'Enter your credentials to access your study portal.'
                  : 'Create your account to start tracking your JEE performance.'}
              </p>
            </div>

            {/* Feedback Banners */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-md flex items-start gap-3 text-xs text-red-300"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-sans">{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md flex items-start gap-3 text-xs text-emerald-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-sans">{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@rovelyn.os"
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-medium text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <span className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer font-sans">
                      Encrypted Auth
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group font-sans text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In to OS' : 'Initialize Account'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-500 font-sans">
                By accessing Rovelyn OS, you agree to secure study telemetry logging.
              </p>
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}

export default AuthPortal;
