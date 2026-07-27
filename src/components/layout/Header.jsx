import React from 'react';
import { IconSearch } from '@tabler/icons-react';
import MagneticButton from '../ui/MagneticButton';

export function Header({ onSearchClick }) {
  return (
    <header className="sticky top-0 z-50 px-6 py-3.5 backdrop-blur-2xl bg-[#06060c]/70 border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center">
          <MagneticButton strength={0.2}>
            <div className="flex items-center group cursor-pointer">
              <span className="text-xl font-black tracking-[0.2em] text-white flex items-center gap-2 font-mono uppercase">
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
            className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 transition-all rounded-full px-4 py-2 flex items-center justify-between text-slate-400 hover:text-slate-200 cursor-pointer shadow-inner group font-sans"
          >
            <div className="flex items-center gap-3 min-w-0">
              <IconSearch size={15} stroke={2} className="text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
              <span className="text-xs font-light text-slate-400 group-hover:text-slate-200 transition-colors truncate">
                Search commands, topics, or tasks...
              </span>
            </div>
            <kbd className="bg-white/10 border border-white/15 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300 shadow-sm shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: User Profile Avatar */}
        <div className="flex items-center justify-end">
          <MagneticButton strength={0.25}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] shadow-[0_0_15px_rgba(99,102,241,0.4)] cursor-pointer hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0a0a14] rounded-full flex items-center justify-center text-xs font-bold text-white font-mono">
                R
              </div>
            </div>
          </MagneticButton>
        </div>

      </div>
    </header>
  );
}

export default Header;
