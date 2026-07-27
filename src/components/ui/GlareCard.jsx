import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Layers, Trash2, MoreVertical } from 'lucide-react';
import MagneticButton from './MagneticButton';

export function GlareCard({
  id,
  title = 'Physics',
  subtitle = 'Class 11 Mechanics',
  icon: Icon,
  progress = 68,
  activeChapter = 'Rotational Dynamics & Rigid Bodies',
  totalChapters = 5,
  accentIconStyle = 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
  accentProgressFill = 'bg-gradient-to-r from-indigo-500 to-cyan-400',
  accentGlow = 'from-cyan-500/20 via-indigo-500/10 to-transparent',
  accentHoverShadow = 'hover:shadow-[0_0_30px_rgba(6,182,212,0.14)]',
  className = '',
  onManageClick,
  handleDeleteCard,
}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Raw target motion values (normalized relative to center: -1.0 to 1.0)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Snappy, light spring physics configuration
  const springConfig = { stiffness: 250, damping: 20, mass: 0.8 };
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-15, 15]), springConfig);

  // Dynamic glare sheen position based on cursor relative coordinates (0% to 100%)
  const glareX = useSpring(useTransform(rawX, [-1, 1], ['0%', '100%']), springConfig);
  const glareY = useSpring(useTransform(rawY, [-1, 1], ['0%', '100%']), springConfig);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative strictly to center point (0,0 is middle)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);

    rawX.set(Math.max(-1, Math.min(1, normalizedX)));
    rawY.set(Math.max(-1, Math.min(1, normalizedY)));
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <div className="w-full flex justify-center" style={{ perspective: '1200px' }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.03, z: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={`relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 p-5 sm:p-6 md:p-8 min-h-[360px] sm:min-h-[380px] shadow-2xl transition-colors duration-300 hover:border-white/25 ${accentHoverShadow} ${className}`}
      >
        {/* Holographic Glare Sheen Layer */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30"
          style={{
            background: `radial-gradient(600px circle at ${glareX} ${glareY}, rgba(99,102,241,0.2), rgba(192,132,252,0.15), transparent 50%)`,
          }}
        />

        {/* Ambient Top Glow */}
        <div
          className={`pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br ${accentGlow} blur-3xl opacity-35 group-hover:opacity-75 transition-opacity duration-500`}
        />

        {/* Card Body Content */}
        <div style={{ transform: 'translateZ(30px)' }} className="relative z-20 flex flex-col h-full justify-between gap-5 sm:gap-6 font-sans">
          {/* 1. Subject Name & Icon Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl border ${accentIconStyle} shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                {Icon ? <Icon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-normal tracking-tight text-white font-sans">
                  {title}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              <span className="text-xs font-mono font-semibold text-zinc-200">
                {progress}%
              </span>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen((prev) => !prev);
                  }}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Card Actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div
                    className="absolute right-0 mt-1 w-32 bg-zinc-900 border border-white/10 rounded-xl shadow-xl py-1 z-50 font-mono text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        if (handleDeleteCard) {
                          handleDeleteCard(id);
                        }
                      }}
                      className="w-full px-3 py-2 min-h-[44px] text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Overall Subject Completion Percentage Bar */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400 text-[11px]">Overall Completion</span>
              <span className="text-zinc-200 font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className={`h-full rounded-full ${accentProgressFill} shadow-[0_0_12px_rgba(129,140,248,0.35)]`}
              />
            </div>
          </div>

          {/* 3. Active Chapter Focus */}
          <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between text-xs font-mono">
            <div className="space-y-0.5 overflow-hidden pr-2">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">Active Focus</span>
              <p className="text-xs font-medium text-zinc-200 truncate">
                {activeChapter || 'No active chapter'}
              </p>
            </div>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono shrink-0">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              {totalChapters} ch
            </span>
          </div>

          {/* 4. Full-Width Centered Glassmorphic Action Button */}
          <div className="pt-3 border-t border-white/[0.06]">
            <MagneticButton strength={0.2} onClick={onManageClick} className="w-full">
              <button className="w-full min-h-[44px] py-2.5 sm:py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition-all duration-300 shadow-inner group font-mono">
                <span>Manage Syllabus</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </MagneticButton>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

export default GlareCard;
