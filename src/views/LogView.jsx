import React from 'react';
import { History, Clock, Sparkles, Filter } from 'lucide-react';
import { useStudySessions } from '../lib/useStudySessions';

export function BacklogManager() {
  const { sessions } = useStudySessions();

  return (
    <div className="w-full space-y-6 bg-transparent select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
            <History className="w-4 h-4" />
            <span>Activity Ledger & Backlogs</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Backlog Manager & Session Logs</h1>
          <p className="text-sm text-zinc-400">Detailed record of study hours, subject breakdown, and backlog items.</p>
        </div>

        <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0a0a12]/60 backdrop-blur-2xl border border-white/10 text-xs text-zinc-300 hover:text-white font-mono shadow-xl">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Logs</span>
        </button>
      </div>

      {/* Timeline Feed or Zero-State */}
      {sessions.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center text-slate-500 font-mono text-xs">
          0.0h logged. Complete a focus session to light up your activity grid.
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((log) => (
            <div key={log.id} className="bg-[#0a0a12]/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 border-l-4 border-l-indigo-500 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-indigo-400 font-mono text-xs font-bold">
                  {log.durationText || `${log.durationMinutes} mins`}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{log.mode || 'Focus Session'}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {log.subject}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {log.formattedDate || log.date}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-sm font-bold text-indigo-400 flex items-center gap-1 justify-end">
                  <Sparkles className="w-3.5 h-3.5" />
                  +{Math.round(log.durationMinutes * 2)} XP
                </span>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Deep Focus
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const LogView = BacklogManager;
export default BacklogManager;
