import React, { useState, useRef, useEffect } from 'react';
import { IconSearch, IconLogout, IconUser } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from './ui/MagneticButton';
import { useAuth } from '../context/AuthContext';

export function Header({ onSearchClick }) {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userEmail = user?.email || 'student@rovelyn.os';
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'R';

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-3.5 backdrop-blur-2xl bg-[#06060c]/70 border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center">
          <MagneticButton strength={0.2}>
            <div className="flex items-center group cursor-pointer">
              <span className="text-lg sm:text-xl font-black tracking-[0.2em] text-white flex items-center gap-2 font-mono uppercase">
                ROVELY<span className="text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]">N</span>
              </span>
              <span className="text-[10px] font-mono tracking-[0.25em] text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full uppercase ml-3 hidden sm:inline-block">
                OS • JEE '27
              </span>
            </div>
          </MagneticButton>
        </div>

        {/* Center: Expanded Command Search Bar */}
        <div className="flex-1 max-w-md w-full flex justify-center">
          <button
            onClick={onSearchClick}
            type="button"
            className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 transition-all rounded-full px-3 sm:px-4 py-1.5 sm:py-2 min-h-[44px] flex items-center justify-between text-slate-400 hover:text-slate-200 cursor-pointer shadow-inner group font-sans"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <IconSearch size={15} stroke={2} className="text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
              <span className="text-[11px] sm:text-xs font-light text-slate-400 group-hover:text-slate-200 transition-colors truncate">
                Search commands, topics, or tasks...
              </span>
            </div>
            <kbd className="bg-white/10 border border-white/15 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300 shadow-sm shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: User Profile Avatar & Dropdown Menu */}
        <div className="flex items-center justify-end relative" ref={menuRef}>
          <MagneticButton strength={0.25}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] shadow-[0_0_15px_rgba(99,102,241,0.4)] cursor-pointer hover:scale-105 transition-transform flex items-center justify-center outline-none"
              title="Profile menu"
            >
              <div className="w-full h-full bg-[#0a0a14] rounded-full flex items-center justify-center text-xs font-bold text-white font-mono">
                {initial}
              </div>
            </button>
          </MagneticButton>

          {/* Profile Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-12 w-64 rounded-2xl bg-[#080814]/95 border border-white/10 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-3 space-y-3 z-50"
              >
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold font-mono text-indigo-300 shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-100 truncate font-mono">
                      {userEmail}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-slate-400 font-mono">Active Session</span>
                    </div>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div className="h-[1px] bg-white/10" />

                {/* Logout Action */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors group cursor-pointer text-left"
                >
                  <IconLogout size={16} className="text-slate-400 group-hover:text-red-400 transition-colors shrink-0" />
                  <span>Sign Out of Rovelyn OS</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}

export default Header;

