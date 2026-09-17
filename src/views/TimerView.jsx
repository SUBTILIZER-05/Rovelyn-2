import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Activity,
  Timer,
  Clock,
  Trash2,
  CheckCircle2,
  BookOpen,
  Sparkles
} from 'lucide-react';
import MagneticButton from '../components/ui/MagneticButton';
import { useStudySessions } from '../lib/useStudySessions';
import { useTimer } from '../context/TimerContext';

const SUBJECT_OPTIONS = [
  { id: 'Physics', label: 'Physics', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'Chemistry', label: 'Chemistry', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'Mathematics', label: 'Mathematics', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { id: 'General', label: 'General Study', color: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
];

export function FocusTimer() {
  // Global Timer Store Context
  const {
    activeMode,
    switchMode,
    targetMinutes,
    customInputHrs,
    setCustomInputHrs,
    customInputMins,
    setCustomInputMins,
    secondsElapsed,
    secondsLeft,
    isRunning,
    selectedSubject,
    setSelectedSubject,
    toggleTimer,
    resetTimer,
    applyCustomTime,
    handlePresetClick,
    logSession,
    formatTime,
  } = useTimer();

  // Centralized Session History Hook
  const { sessions, deleteSession } = useStudySessions();

  // 3D Physics Card Mouse Movement Logic
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 25, mass: 0.5 });
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 25, mass: 0.5 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleDeleteSession = (sessionId) => {
    deleteSession(sessionId);
  };

  const currentSeconds = activeMode === 'stopwatch' ? secondsElapsed : secondsLeft;
  const formattedTimeStr = formatTime(currentSeconds);
  const isLongFormat = formattedTimeStr.length > 5; // e.g. "01:26:00"

  const totalCountdownSecs = targetMinutes * 60;
  const progressPercent =
    activeMode === 'countdown'
      ? ((totalCountdownSecs - secondsLeft) / totalCountdownSecs) * 100
      : ((secondsElapsed % 3600) / 3600) * 100;

  return (
    <div className="w-full space-y-8 bg-transparent flex flex-col items-center font-sans">
      {/* 1. GLASSMORPHIC MODE TOGGLE (Stopwatch vs Countdown) */}
      <div className="relative bg-[#0a0a14]/60 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full flex gap-1 shadow-2xl w-full max-w-xs mx-auto font-sans">
        {[
          { id: 'stopwatch', label: 'Stopwatch', icon: Timer },
          { id: 'countdown', label: 'Countdown', icon: Clock },
        ].map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`relative flex-1 px-5 py-2.5 text-xs font-medium rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer z-10 ${
                isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full bg-indigo-600/30 border border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* PRESET PILLS & DUAL HOURS/MINUTES CUSTOM INPUT BAR */}
      {activeMode === 'countdown' && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono text-xs max-w-xl mx-auto bg-[#0a0a14]/60 backdrop-blur-2xl border border-white/10 p-2.5 rounded-full shadow-xl">
          <span className="text-zinc-400 text-[11px] uppercase tracking-wider pl-2 font-medium">Presets:</span>
          {[
            { label: '15m', h: 0, m: 15 },
            { label: '25m', h: 0, m: 25 },
            { label: '45m', h: 0, m: 45 },
            { label: '1h', h: 1, m: 0 },
            { label: '2h', h: 2, m: 0 },
          ].map((p) => {
            const isSelected = targetMinutes === p.h * 60 + p.m;
            return (
              <button
                key={p.label}
                onClick={() => handlePresetClick(p.h, p.m)}
                className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200 font-bold shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            );
          })}

          <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* DUAL HOURS + MINUTES INPUT PICKER */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 backdrop-blur-md">
            <span className="text-[11px] text-slate-400">Custom:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="23"
                value={customInputHrs}
                onChange={(e) => {
                  setCustomInputHrs(e.target.value);
                  applyCustomTime(e.target.value, customInputMins);
                }}
                className="bg-white/5 border border-white/10 rounded-lg text-slate-100 text-center w-9 py-0.5 text-xs font-mono font-semibold focus:outline-none focus:border-indigo-400/50"
              />
              <span className="text-[11px] text-slate-400 font-semibold">h</span>
            </div>

            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="59"
                value={customInputMins}
                onChange={(e) => {
                  setCustomInputMins(e.target.value);
                  applyCustomTime(customInputHrs, e.target.value);
                }}
                className="bg-white/5 border border-white/10 rounded-lg text-slate-100 text-center w-9 py-0.5 text-xs font-mono font-semibold focus:outline-none focus:border-indigo-400/50"
              />
              <span className="text-[11px] text-slate-400 font-semibold">m</span>
            </div>
          </div>
        </div>
      )}

      {/* CLOCK CONTAINER WITH EXPANDED DIAMETER & DYNAMIC TYPOGRAPHY SCALING */}
      <div className="relative flex flex-col items-center justify-center my-4">
        {/* Ambient Radial Backlight Glow */}
        <div
          className={`absolute w-[400px] h-[400px] sm:w-[440px] sm:h-[440px] rounded-full blur-3xl opacity-35 transition-all duration-700 ${
            isRunning ? 'bg-indigo-500 scale-110' : 'bg-zinc-800 scale-95'
          }`}
        />

        {/* Expanded Circular Progress Ring (440px x 440px) */}
        <svg className="w-[380px] h-[380px] sm:w-[440px] sm:h-[440px] transform -rotate-90">
          <circle
            cx="220"
            cy="220"
            r="195"
            className="stroke-zinc-800/80"
            strokeWidth="8"
            fill="transparent"
          />
          <motion.circle
            cx="220"
            cy="220"
            r="195"
            className="stroke-indigo-500"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 195}
            strokeDashoffset={2 * Math.PI * 195 * (1 - Math.min(100, Math.max(0, progressPercent)) / 100)}
            strokeLinecap="round"
            fill="transparent"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </svg>

        {/* Center Display: Dynamic Font Scaling & Padded Layout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 px-6">
          <span className="text-xs uppercase tracking-[0.25em] text-indigo-400/80 font-medium font-mono flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? `${activeMode === 'stopwatch' ? 'Session Active' : 'Countdown Active'}` : 'Timer Ready'}
          </span>

          {/* Dynamic Typography Scaling: HH:MM:SS fits cleanly with zero overflow */}
          <h1
            className={`font-mono text-slate-50 tabular-nums drop-shadow-[0_0_35px_rgba(255,255,255,0.15)] transition-all duration-300 ${
              isLongFormat
                ? 'text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter px-2'
                : 'text-7xl sm:text-8xl font-extrabold tracking-tight'
            }`}
          >
            {formattedTimeStr}
          </h1>

          {/* SUBJECT DROPDOWN PILL */}
          <div className="relative font-mono">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs px-5 py-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer appearance-none text-center pr-8 shadow-lg focus:outline-none focus:border-indigo-400/50"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub.id} value={sub.id} className="bg-zinc-900 text-white">
                  {sub.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* PRIMARY ACTION CONTROLS */}
      <div className="flex flex-wrap items-center justify-center gap-4 font-mono">
        <MagneticButton strength={0.3} onClick={toggleTimer}>
          <button
            className={`h-12 px-8 rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-mono active:scale-95 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)]'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunning ? 'PAUSE' : 'START SESSION'}</span>
          </button>
        </MagneticButton>

        {/* LOG SESSION BUTTON */}
        <MagneticButton strength={0.25} onClick={() => logSession()}>
          <button
            className="h-12 px-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 active:scale-95 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
            title="Log current study session to history & analytics"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>LOG SESSION</span>
          </button>
        </MagneticButton>

        {/* RESET ICON BUTTON */}
        <MagneticButton strength={0.25} onClick={resetTimer}>
          <button
            className="h-12 w-12 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-lg font-mono"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </MagneticButton>
      </div>

      {/* ACETERNETY 3D TILT SESSION HISTORY CONTAINER WITH HIGH-REFRACTION GLASS STYLING */}
      <div
        className="w-full max-w-3xl mb-24 sm:mb-32"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.5 }}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          className="relative w-full bg-[#06060c]/60 backdrop-blur-2xl border border-white/10 border-t border-t-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] rounded-3xl p-6 sm:p-8 space-y-5 group/history font-mono overflow-hidden will-change-transform transform-gpu"
        >
          {/* Bioluminescent radial gradient glow */}
          <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover/history:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent blur-xl" />

          {/* Header Refinement */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
              <h3 className="text-xs font-semibold tracking-[0.2em] text-slate-300 uppercase font-mono">
                SESSION HISTORY
              </h3>
            </div>
            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-indigo-300 font-mono shadow-inner">
              {sessions.length} Logged Session{sessions.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Empty State vs Logged Session Cards */}
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3 relative z-10 font-sans">
              <div className="p-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <BookOpen className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm text-slate-400 font-light max-w-sm">
                No active sessions logged yet. Hit 'LOG SESSION' to sync your focus metrics.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 relative z-10">
              {sessions.map((sess) => {
                const subConfig =
                  SUBJECT_OPTIONS.find((s) => s.id === sess.subject) || SUBJECT_OPTIONS[3];

                return (
                  <div
                    key={sess.id}
                    className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-indigo-500/30 transition-all duration-200 rounded-xl p-3.5 flex items-center justify-between group/item"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 font-mono ${subConfig.color}`}
                      >
                        {sess.subject}
                      </span>

                      <div className="min-w-0">
                        <p className="text-xs text-white font-medium truncate font-sans">
                          {sess.durationText} • <span className="text-zinc-400 font-normal">{sess.mode}</span>
                        </p>
                        <span className="text-[10px] text-zinc-500 font-mono">{sess.date}</span>
                      </div>
                    </div>

                    {/* Smooth hover Trash Icon */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(sess.id)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-70 group-hover/item:opacity-100 transition-all shrink-0 cursor-pointer"
                      title="Delete Session Log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export const TimerView = FocusTimer;
export default FocusTimer;
