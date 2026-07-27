import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudySessions, calculateHeatmapData } from '../../lib/useStudySessions';

const SUBJECT_COLORS = {
  Physics: 'text-cyan-400',
  Chemistry: 'text-purple-400',
  Mathematics: 'text-indigo-400',
  General: 'text-slate-300',
};

export function Heatmap({ days = 60, title = '60-Day Focus Matrix' }) {
  const { sessions } = useStudySessions();
  const [hoveredCell, setHoveredCell] = useState(null);

  // Compute heatmap items dynamically whenever sessions array changes
  const heatmapItems = useMemo(() => {
    return calculateHeatmapData(sessions, days);
  }, [sessions, days]);

  return (
    <div className="space-y-3 font-mono">
      {/* Legend & Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <span className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-mono">
          {title}
        </span>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-white/[0.03] border border-white/5" title="0 mins" />
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-950/60 border border-indigo-500/20 text-indigo-300" title="1 - 59 mins" />
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-800/60 border border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]" title="60 - 119 mins" />
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 border border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.4)]" title="120 - 239 mins" />
            <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 border border-violet-300 shadow-[0_0_18px_rgba(139,92,246,0.6)]" title="240+ mins" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid Container or Sleek Glassmorphic Zero-State */}
      {sessions.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center text-slate-500 font-mono text-xs">
          0.0h logged. Complete a focus session to light up your activity grid.
        </div>
      ) : (
        <div className="relative pt-1">
          <div className="grid grid-flow-col grid-rows-5 gap-2 overflow-x-auto pb-2 scrollbar-none">
            {heatmapItems.map((item) => (
              <div key={item.dateIso} className="relative group">
                <motion.div
                  whileHover={{ scale: 1.4, zIndex: 30 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onMouseEnter={() => setHoveredCell(item)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-3.5 h-3.5 rounded-sm cursor-pointer transition-colors duration-500 ${item.bgClass}`}
                />
              </div>
            ))}
          </div>

          {/* High-Refraction Glass Hover Tooltip */}
          <AnimatePresence>
            {hoveredCell && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute top-0 right-0 z-50 pointer-events-none bg-[#0a0a14]/90 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-lg text-xs shadow-2xl font-mono text-zinc-200 min-w-[200px]"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                  <span className="font-semibold text-white">{hoveredCell.date}</span>
                  <span className="text-indigo-300 font-bold">
                    {hoveredCell.totalHours} hrs ({hoveredCell.totalMinutes}m)
                  </span>
                </div>

                {hoveredCell.subjectBreakdown.length > 0 ? (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-zinc-500 tracking-wider block">Subject Breakdown:</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                      {hoveredCell.subjectBreakdown.map((sb) => {
                        const colorClass = SUBJECT_COLORS[sb.subject] || 'text-zinc-300';
                        return (
                          <span key={sb.subject} className="flex items-center gap-1">
                            <span className={colorClass}>{sb.subject}:</span>
                            <span className="text-white font-medium">{sb.mins}m</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-zinc-500 italic block">No study sessions logged</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default Heatmap;
