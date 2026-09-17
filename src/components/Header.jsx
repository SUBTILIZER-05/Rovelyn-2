import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconLogout } from '@tabler/icons-react';
import { CheckCircle2, Clock, BookOpen, X, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from './ui/MagneticButton';
import { useAuth } from '../context/AuthContext';
import { useChapters } from '../context/ChapterContext';
import { useTimer } from '../context/TimerContext';
import { useAppData } from '../context/AppDataContext';
import { calculateChapterProgress } from '../lib/syllabusUtils';

export function Header({ onSearchClick, onSelectChapter }) {
  const { user, signOut } = useAuth();
  const { chapters } = useChapters();
  const { syncStatus, pendingSyncCount, isOnline, flushSync } = useAppData();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Close profile menu & search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Chapter Data Extraction & Flattening into SearchableChapter interface
  const searchableChapters = useMemo(() => {
    if (!Array.isArray(chapters)) return [];

    return chapters
      .map((ch) => {
        const title = ch.title || ch.name || ch.chapterName || ch.chapter_name || ch.chapter || '';
        const name = typeof title === 'string' ? title.trim() : '';

        // Exclude any chapters that the user has not added or that are empty/untitled
        if (!name || name.toLowerCase() === 'untitled chapter' || name.toLowerCase() === 'untitled') {
          return null;
        }

        const subtasks = ch.subtasks || [];
        const chProgress = calculateChapterProgress(subtasks);

        const completed =
          ch.status === 'completed' || chProgress === 100;

        const rawClass = ch.class_level || ch.classLevel || 'C-11';
        const classLevel = String(rawClass).includes('12') ? '12' : '11';
        const subject = ch.subject || 'Physics';

        return {
          id: ch.id,
          name: name,
          subject: subject,
          classLevel: classLevel,
          completed: completed,
          status: ch.status || 'pending',
          rawChapterData: ch,
        };
      })
      .filter(Boolean);
  }, [chapters]);

  // 2. Filter list based on case-insensitive match against name or subject
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    return searchableChapters.filter((ch) => {
      const nameMatch = ch.name.toLowerCase().includes(q);
      const subjectMatch = ch.subject.toLowerCase().includes(q);
      const classMatch = `class ${ch.classLevel}`.toLowerCase().includes(q);
      return nameMatch || subjectMatch || classMatch;
    });
  }, [searchQuery, searchableChapters]);

  const handleSelect = (chapter) => {
    setSearchQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    if (inputRef.current) inputRef.current.blur();
    if (onSelectChapter) {
      onSelectChapter(chapter);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (filteredChapters.length > 0) {
        setSelectedIndex((prev) => (prev < filteredChapters.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && filteredChapters.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredChapters.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && filteredChapters.length > 0) {
        e.preventDefault();
        const target = selectedIndex >= 0 ? filteredChapters[selectedIndex] : filteredChapters[0];
        if (target) handleSelect(target);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      if (inputRef.current) inputRef.current.blur();
    }
  };

  const { isRunning: isTimerRunning, currentSeconds, formatTime: formatTimerTime, selectedSubject } = useTimer();

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

        {/* Center: Autocomplete Search Bar & Dynamic Dropdown */}
        <div className="flex-1 max-w-md w-full flex justify-center relative" ref={searchRef}>
          <div className="relative w-full">
            <div className="w-full bg-white/[0.04] focus-within:bg-black/80 border border-white/10 focus-within:border-indigo-500/50 transition-all rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 min-h-[44px] flex items-center justify-between text-slate-400 focus-within:text-slate-200 shadow-inner group font-sans">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <IconSearch size={15} stroke={2} className="text-slate-400 group-focus-within:text-indigo-400 transition-colors shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsOpen(true);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setIsOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search chapters, topics, or subjects..."
                  className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsOpen(false);
                    }}
                    className="p-1 text-slate-400 hover:text-white shrink-0"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onSearchClick}
                className="bg-white/10 hover:bg-white/20 border border-white/15 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300 shadow-sm shrink-0 ml-2 cursor-pointer transition-colors hidden sm:block"
                title="Open Command Palette (⌘K)"
              >
                ⌘K
              </button>
            </div>

            {/* Floating Glassmorphic Dropdown */}
            <AnimatePresence>
              {isOpen && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full left-0 right-0 mt-2.5 rounded-2xl bg-[#080814]/95 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2 z-50 font-sans max-h-80 overflow-y-auto"
                >
                  {filteredChapters.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                      No matching chapters found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-white/5">
                        <span>Chapters ({filteredChapters.length})</span>
                        <span className="hidden sm:inline">Use ↑↓ to navigate, Enter to jump</span>
                      </div>

                      {filteredChapters.map((ch, idx) => {
                        const isFocused = selectedIndex === idx;

                        let subjectPillStyle = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
                        const subjLower = ch.subject.toLowerCase();
                        if (subjLower.includes('phys')) {
                          subjectPillStyle = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
                        } else if (subjLower.includes('chem')) {
                          subjectPillStyle = 'bg-violet-500/10 text-violet-300 border-violet-500/20';
                        } else if (subjLower.includes('math')) {
                          subjectPillStyle = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
                        }

                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => handleSelect(ch)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isFocused
                                ? 'bg-indigo-500/20 border border-indigo-500/40 shadow-lg text-white'
                                : 'hover:bg-white/[0.06] text-slate-200 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {ch.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : ch.status === 'in_progress' ? (
                                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                              ) : (
                                <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                              )}

                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-medium truncate block">{ch.name}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${subjectPillStyle}`}>
                                {ch.subject}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                Class {ch.classLevel}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: User Profile Avatar, Active Session & Sync Status Indicator */}
        <div className="flex items-center justify-end relative gap-2 sm:gap-3" ref={menuRef}>
          {/* Offline / Syncing Status Indicator Pill */}
          {!isOnline || syncStatus === 'offline' ? (
            <button
              type="button"
              onClick={flushSync}
              className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-mono cursor-pointer hover:bg-amber-500/20 transition-colors shadow-sm"
              title="Offline · Changes saved locally. Click to retry sync."
            >
              <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="hidden sm:inline font-medium">Offline</span>
              {pendingSyncCount > 0 && (
                <span className="bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                  {pendingSyncCount}
                </span>
              )}
            </button>
          ) : syncStatus === 'syncing' || pendingSyncCount > 0 ? (
            <div
              className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-full text-[11px] font-mono transition-colors shadow-sm"
              title="Syncing pending changes with cloud..."
            >
              <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
              <span className="hidden sm:inline font-medium">Syncing</span>
            </div>
          ) : null}

          {isTimerRunning && (
            <div className="flex items-center gap-2 font-mono">
              <div className="flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tabular-nums">{formatTimerTime(currentSeconds)}</span>
                <span className="hidden md:inline text-[10px] text-indigo-300/70 border-l border-indigo-500/30 pl-2">{selectedSubject}</span>
              </div>
            </div>
          )}

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


