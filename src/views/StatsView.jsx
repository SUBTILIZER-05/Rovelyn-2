import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Clock, Flame, Target, Layers, Sparkles, Award, Pencil, X, Check } from 'lucide-react';
import { IconChartDonut } from '@tabler/icons-react';
import { useStudySessions } from '../lib/useStudySessions';
import { useLevelProgress } from '../utils/useLevelProgress';
import { getLevelThreshold, formatMinutesLabel } from '../utils/levelSystem';

function Metric3DCard({ children, className = '' }) {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 25, mass: 0.5 });
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 25, mass: 0.5 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
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

  return (
    <div style={{ perspective: '1000px' }} className="w-full">
      <motion.div
        ref={cardRef}
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
        className={`bg-[#06060c]/60 backdrop-blur-3xl border border-white/10 border-t border-t-white/20 shadow-2xl rounded-3xl p-6 relative overflow-hidden group will-change-transform transform-gpu ${className}`}
      >
        {/* Bioluminescent Spotlight Radial Glow */}
        <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent blur-xl" />

        <div style={{ transform: 'translateZ(35px)' }} className="relative z-10 flex flex-col justify-between h-full space-y-4">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function AnalyticsView({ tests }) {
  // Load session history dynamically from centralized useStudySessions hook
  const { sessions } = useStudySessions();
  // Quadratic level progression & weekly target system
  const {
    totalHours,
    levelDetails,
    weeklyTarget,
    updateWeeklyTarget,
    weeklyTargetStatus,
  } = useLevelProgress();

  // Weekly Target Configuration Modal State
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(weeklyTarget.mode || 'hours');
  const [modalHours, setModalHours] = useState(weeklyTarget.targetHours || 25);
  const [modalLevel, setModalLevel] = useState(weeklyTarget.targetLevel || levelDetails.nextLevel);

  const handleOpenModal = () => {
    setModalMode(weeklyTarget.mode || 'hours');
    setModalHours(weeklyTarget.targetHours || 25);
    setModalLevel(weeklyTarget.targetLevel || levelDetails.nextLevel);
    setIsTargetModalOpen(true);
  };

  const handleSaveTarget = () => {
    updateWeeklyTarget({
      mode: modalMode,
      targetHours: Number(modalHours) || 25,
      targetLevel: Number(modalLevel) || levelDetails.nextLevel,
    });
    setIsTargetModalOpen(false);
  };

  // Calculate Real-Time Totals & Distribution
  const totalSeconds = sessions.reduce((acc, s) => acc + (Number(s.durationSeconds) || 0), 0);

  // Subject colors and definitions
  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'General'];
  const subjectColors = {
    Physics: { text: 'text-cyan-400', bar: 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' },
    Chemistry: { text: 'text-purple-400', bar: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]' },
    Mathematics: { text: 'text-indigo-400', bar: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]' },
    General: { text: 'text-slate-300', bar: 'bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.3)]' },
  };

  const subjectStats = subjects.map((subj) => {
    const subjSecs = sessions
      .filter((s) => s.subject === subj)
      .reduce((acc, s) => acc + (Number(s.durationSeconds) || 0), 0);
    const hours = (subjSecs / 3600).toFixed(1);
    const percentage = totalSeconds > 0 ? Math.round((subjSecs / totalSeconds) * 100) : 0;
    return {
      name: subj,
      hours,
      percentage,
      ...subjectColors[subj],
    };
  });

  // Calculate current streak (consecutive days with at least one logged session)
  const calculateStreak = () => {
    if (sessions.length === 0) return 0;
    const uniqueDates = Array.from(
      new Set(
        sessions.map((s) => {
          const d = new Date(s.timestamp || Date.now());
          return d.toISOString().slice(0, 10);
        })
      )
    ).sort((a, b) => b.localeCompare(a));

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(uniqueDates[0]);

    for (let i = 0; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i]);
      const diffDays = Math.round((checkDate - current) / 86400000);
      if (diffDays <= 1) {
        streak++;
        checkDate = current;
      } else {
        break;
      }
    }

    return streak;
  };

  const streakDays = calculateStreak();

  return (
    <div className="w-full space-y-8 bg-transparent mb-28 sm:mb-32 font-sans">
      {/* 1. PREMIUM HEADER */}
      <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-white/5 mb-8">
        {/* Ambient backlighting glow */}
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-indigo-600/15 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 text-xs font-mono font-semibold tracking-[0.3em] uppercase text-indigo-400/90 mb-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <IconChartDonut className="w-4 h-4" />
            </div>
            <span>MASTERY & METRICS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300 drop-shadow-[0_4px_20px_rgba(99,102,241,0.25)]">
            Performance & Study Metrics
          </h1>
          <p className="text-sm text-slate-400/80 font-light max-w-xl leading-relaxed mt-1">
            Track study consistency, subject weight distribution, quadratic level progression, and weekly targets.
          </p>
        </div>
      </div>

      {/* 2. ACETERNETY 3D METRIC CARDS GRID (4 RESPONSIVE CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Total Study Hours */}
        <Metric3DCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Total Study Hours</span>
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div style={{ transform: 'translateZ(50px)' }} className="transition-transform">
              <p className="text-4xl md:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {totalHours}h
              </p>
            </div>
            <p className="text-xs font-mono text-slate-400/80 font-light mt-2 truncate">
              {sessions.length} session{sessions.length === 1 ? '' : 's'} logged
            </p>
          </div>
        </Metric3DCard>

        {/* Metric 2: Current Streak */}
        <Metric3DCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Current Streak</span>
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div style={{ transform: 'translateZ(50px)' }} className="transition-transform">
              <p className="text-4xl md:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {streakDays} <span className="text-2xl md:text-3xl font-extralight text-slate-300">Days</span>
              </p>
            </div>
            <p className="text-xs font-mono text-slate-400/80 font-light mt-2 truncate">
              {streakDays > 0 ? 'Active daily streak' : 'Log a session to start streak'}
            </p>
          </div>
        </Metric3DCard>

        {/* Metric 3: Current Level / Lifetime Rank */}
        <Metric3DCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Lifetime Rank</span>
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div style={{ transform: 'translateZ(50px)' }} className="transition-transform">
              <p className="text-4xl md:text-5xl font-black font-mono tracking-tight text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                LVL {levelDetails.currentLevel}
              </p>
            </div>
            <p className="text-xs font-mono text-slate-400/80 font-light mt-2 truncate">
              {levelDetails.progressPercent.toFixed(0)}% towards LVL {levelDetails.nextLevel}
            </p>
          </div>
        </Metric3DCard>

        {/* Metric 4: Weekly Target (Interactive Edit Trigger) */}
        <Metric3DCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              <span>Weekly Target</span>
            </span>
            <button
              type="button"
              onClick={handleOpenModal}
              className="p-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.15)] cursor-pointer group"
              title="Configure Weekly Target"
            >
              <Pencil className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          <div>
            <div style={{ transform: 'translateZ(50px)' }} className="transition-transform">
              {weeklyTargetStatus.mode === 'level' ? (
                <p className="text-3xl sm:text-4xl md:text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  LVL {levelDetails.currentLevel} <span className="text-xl md:text-2xl font-extralight text-slate-400">/ LVL {weeklyTargetStatus.targetLevel}</span>
                </p>
              ) : (
                <p className="text-4xl md:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {weeklyTargetStatus.weeklyHoursLogged} <span className="text-2xl md:text-3xl font-extralight text-slate-400">/ {weeklyTargetStatus.targetHours}h</span>
                </p>
              )}
            </div>
            <p className="text-xs font-mono text-slate-400/80 font-light mt-2 truncate">
              {weeklyTargetStatus.deltaText}
            </p>
          </div>
        </Metric3DCard>
      </div>

      {/* 3. HIGH-REFRACTION GLASSMORPHIC CONTENT PANEL (SUBJECT TIME DISTRIBUTION) */}
      <div className="bg-[#06060c]/60 backdrop-blur-3xl border border-white/10 border-t border-t-white/20 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl font-mono">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">
              Subject Time Distribution
            </h3>
          </div>
          <span className="text-xs text-slate-400/80 font-light">
            Real-time session breakdown
          </span>
        </div>

        {totalSeconds === 0 ? (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center text-slate-500 font-mono text-xs">
            0.0h logged. Complete a focus session to light up your activity grid.
          </div>
        ) : (
          <div className="space-y-4 font-mono">
            {subjectStats.map((subj) => (
              <div key={subj.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={subj.text}>
                    {subj.name} <span className="text-slate-400 font-normal">({subj.hours}h)</span>
                  </span>
                  <span className="text-slate-300 font-bold">{subj.percentage}%</span>
                </div>
                <div className="h-3 w-full bg-zinc-900/80 border border-white/5 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full ${subj.bar} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${subj.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. WEEKLY TARGET CONFIGURATION MODAL */}
      <AnimatePresence>
        {isTargetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTargetModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md rounded-3xl bg-[#080814]/95 border border-white/15 backdrop-blur-2xl shadow-2xl p-6 z-50 space-y-5 font-mono text-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Configure Weekly Target
                    </h3>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Set goal type for the current week
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Toggle Switch */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Target Mode
                </label>
                <div className="grid grid-cols-2 gap-2 bg-white/[0.04] p-1.5 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalMode('hours')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      modalMode === 'hours'
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Weekly Hours</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('level')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      modalMode === 'level'
                        ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Target Level</span>
                  </button>
                </div>
              </div>

              {/* Input section based on selected mode */}
              {modalMode === 'hours' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Study Hours Goal (Hours / Week)
                    </label>
                    <span className="text-xs font-bold text-indigo-300">
                      {modalHours}h / week
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="1"
                    value={modalHours}
                    onChange={(e) => setModalHours(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-white/10 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between gap-2 pt-1">
                    {[15, 25, 35, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setModalHours(preset)}
                        className={`flex-1 py-1.5 text-xs rounded-xl border transition-colors ${
                          modalHours === preset
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                            : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.08]'
                        }`}
                      >
                        {preset}h
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Target Level to Reach
                    </label>
                    <span className="text-xs font-bold text-amber-300">
                      LVL {modalLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setModalLevel((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg border border-white/10"
                    >
                      -
                    </button>
                    <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl py-2 px-4 text-center font-bold text-lg text-white">
                      LVL {modalLevel}
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalLevel((prev) => prev + 1)}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg border border-white/10"
                    >
                      +
                    </button>
                  </div>

                  {/* Level calculation info preview */}
                  {(() => {
                    const reqMins = getLevelThreshold(modalLevel);
                    const reqHours = (reqMins / 60).toFixed(1);
                    return (
                      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 text-xs text-slate-300">
                        <p className="flex justify-between">
                          <span className="text-slate-400">Total Lifetime Requirement:</span>
                          <span className="font-bold text-white">{reqHours}h</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Current Level:</span>
                          <span className="font-bold text-amber-300">LVL {levelDetails.currentLevel}</span>
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTarget}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white text-xs font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Target</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const StatsView = AnalyticsView;
export default AnalyticsView;
