import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Trash2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useChapters } from '../../context/ChapterContext';

export function SyllabusModal({
  subject,
  onClose,
}) {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'detail'
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  const { deleteChapter, updateChapter, getSubjectChapters } = useChapters();
  const chapters = getSubjectChapters(subject.title, subject.class_level || 'C-11');

  // Calculate subject overall progress
  const calculateOverallProgress = (chList) => {
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    let totalQuestions = 0;
    let completedQuestions = 0;

    (chList || []).forEach((ch) => {
      const subtasks = ch.subtasks || [];
      totalSubtasks += subtasks.length;
      completedSubtasks += subtasks.filter((s) => s.completed).length;
      totalQuestions += (ch.moduleQuestions?.total || 0) + (ch.workbookQuestions?.total || 0);
      completedQuestions += (ch.moduleQuestions?.completed || 0) + (ch.workbookQuestions?.completed || 0);
    });

    const totalItems = totalSubtasks + totalQuestions;
    const completedItems = completedSubtasks + completedQuestions;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const handleDeleteChapter = async (chId, e) => {
    if (e) e.stopPropagation();
    await deleteChapter(chId);
    if (selectedChapterId === chId) {
      setActiveView('list');
      setSelectedChapterId(null);
    }
  };

  const handleToggleStatus = async (chId, e) => {
    if (e) e.stopPropagation();
    const ch = chapters.find((c) => c.id === chId);
    if (!ch) return;

    const statusOrder = ['not_started', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(ch.status || 'not_started');
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    await updateChapter(chId, { status: nextStatus });
  };

  const overallProgress = calculateOverallProgress(chapters);

  const renderStatusBadge = (status, onClick) => {
    let badgeStyle = "bg-zinc-800/80 text-zinc-400 border-white/5 hover:border-white/20";
    let label = "Not Started";
    let icon = null;

    if (status === 'in_progress') {
      badgeStyle = "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:border-indigo-500/40";
      label = "In Progress";
    } else if (status === 'completed') {
      badgeStyle = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:border-emerald-500/40 font-bold";
      label = "Completed";
      icon = <CheckCircle2 className="w-3.5 h-3.5" />;
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className={`text-xs font-mono px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 ${badgeStyle}`}
        title="Click to cycle status"
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#080810]/95 border border-white/10 backdrop-blur-2xl shadow-2xl p-6 md:p-8 z-50 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
      >
        {/* Top Close & Navigation Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            {activeView === 'detail' && (
              <button
                onClick={() => setActiveView('list')}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="text-xl font-medium text-white">{subject.title}</h3>
              <p className="text-xs font-mono text-zinc-400">{subject.subtitle} • {overallProgress}% Complete</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list / detail view */}
        {activeView === 'list' && (
          <div className="space-y-4 font-mono">
            {chapters.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">No chapters added for this subject.</div>
            ) : (
              chapters.map((ch) => {
                const subtasks = ch.subtasks || [];
                return (
                  <div key={ch.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm text-white font-sans">
                        {ch.title || ch.name || ch.chapterName || ch.chapter_name || 'Untitled'}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {subtasks.filter((s) => s.completed).length}/{subtasks.length} Subtasks
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {renderStatusBadge(ch.status, (e) => handleToggleStatus(ch.id, e))}
                      <button onClick={(e) => handleDeleteChapter(ch.id, e)} className="p-1.5 text-zinc-400 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default SyllabusModal;
