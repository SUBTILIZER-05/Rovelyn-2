import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  CheckSquare,
  Square,
  Minus
} from 'lucide-react';
import MagneticButton from '../ui/MagneticButton';
import { useChapters } from '../../context/ChapterContext';

export function SyllabusView({
  subject,
  onBackToDashboard,
}) {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'detail'
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  // Consume live chapter state from ChapterContext
  const { addChapter, deleteChapter, updateChapter, getSubjectChapters } = useChapters();

  // Dynamic cards for this subject derived from global ChapterContext
  const cards = getSubjectChapters(subject.title, subject.class_level || 'C-11');

  // New chapter inline creation state
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  // Inline editing state for chapter cards
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingModuleTotal, setEditingModuleTotal] = useState(0);
  const [editingModuleComp, setEditingModuleComp] = useState(0);
  const [editingWorkbookTotal, setEditingWorkbookTotal] = useState(0);
  const [editingWorkbookComp, setEditingWorkbookComp] = useState(0);

  // Subtask creation state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtaskInline, setIsAddingSubtaskInline] = useState(false);

  // Selected chapter object
  const selectedChapter = (cards || []).find((c) => String(c.id) === String(selectedChapterId));

  // Calculate subject overall progress
  const calculateOverallProgress = (chapters) => {
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    let totalQuestions = 0;
    let completedQuestions = 0;

    (chapters || []).forEach((ch) => {
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

  // Helper to auto-update chapter status if all subtasks are 100% complete
  const checkAutoCompletion = (chapter) => {
    const subtasks = chapter.subtasks || [];
    const totalSub = subtasks.length;
    const completedSub = subtasks.filter((s) => s.completed).length;
    
    if (totalSub > 0 && completedSub === totalSub) {
      return 'completed';
    } else if (completedSub > 0) {
      return chapter.status === 'not_started' ? 'in_progress' : chapter.status;
    }
    return chapter.status === 'completed' ? 'in_progress' : chapter.status;
  };

  // 1. PERSISTENT CHAPTER DELETE
  const handleDeleteCard = async (cardId, e) => {
    if (e) e.stopPropagation();
    await deleteChapter(cardId);
    if (selectedChapterId === cardId) {
      setActiveView('list');
      setSelectedChapterId(null);
    }
  };

  const handleDeleteChapter = handleDeleteCard;

  // 2. EDIT MODE & INLINE UPDATES
  const startEditingChapter = (ch, e) => {
    if (e) e.stopPropagation();
    setEditingChapterId(ch.id);
    setEditingTitle(ch.title || ch.name || ch.chapterName || ch.chapter_name || '');
    setEditingModuleTotal(ch.moduleQuestions?.total || 0);
    setEditingModuleComp(ch.moduleQuestions?.completed || 0);
    setEditingWorkbookTotal(ch.workbookQuestions?.total || 0);
    setEditingWorkbookComp(ch.workbookQuestions?.completed || 0);
  };

  const handleSaveEditChapter = async (chId, e) => {
    if (e) e.stopPropagation();
    if (!editingTitle.trim()) return;

    const modTotal = Math.max(1, parseInt(editingModuleTotal, 10) || 1);
    const modComp = Math.max(0, Math.min(modTotal, parseInt(editingModuleComp, 10) || 0));
    const wbTotal = Math.max(1, parseInt(editingWorkbookTotal, 10) || 1);
    const wbComp = Math.max(0, Math.min(wbTotal, parseInt(editingWorkbookComp, 10) || 0));

    await updateChapter(chId, {
      title: editingTitle.trim(),
      moduleQuestions: { total: modTotal, completed: modComp },
      workbookQuestions: { total: wbTotal, completed: wbComp },
    });

    setEditingChapterId(null);
  };

  // 5. STATUS PILL TOGGLE
  const handleToggleStatus = async (chId, e) => {
    if (e) e.stopPropagation();
    const ch = cards.find((c) => c.id === chId);
    if (!ch) return;

    const statusOrder = ['not_started', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(ch.status || 'not_started');
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    await updateChapter(chId, { status: nextStatus });
  };

  // PERSISTENT ADD CHAPTER OPERATION
  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    await addChapter({
      title: newChapterTitle.trim(),
      subject: subject.title,
      classLevel: subject.class_level || 'C-11',
      status: 'pending',
    });

    setNewChapterTitle('');
    setIsAddingChapter(false);
  };

  // 4. SUBTASK MANAGEMENT & CHECKBOXES
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedChapterId) return;

    const ch = cards.find((c) => c.id === selectedChapterId);
    if (!ch) return;

    const newSubtask = {
      id: 'st_' + Date.now(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    const updatedSubtasks = [...(ch.subtasks || []), newSubtask];
    const nextStatus = checkAutoCompletion({ ...ch, subtasks: updatedSubtasks });

    await updateChapter(selectedChapterId, {
      subtasks: updatedSubtasks,
      status: nextStatus,
    });

    setNewSubtaskTitle('');
    setIsAddingSubtaskInline(false);
  };

  const handleToggleSubtask = async (subtaskId) => {
    if (!selectedChapterId) return;
    const ch = cards.find((c) => c.id === selectedChapterId);
    if (!ch) return;

    const updatedSubtasks = (ch.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const nextStatus = checkAutoCompletion({ ...ch, subtasks: updatedSubtasks });

    await updateChapter(selectedChapterId, {
      subtasks: updatedSubtasks,
      status: nextStatus,
    });
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!selectedChapterId) return;
    const ch = cards.find((c) => c.id === selectedChapterId);
    if (!ch) return;

    const updatedSubtasks = (ch.subtasks || []).filter((st) => st.id !== subtaskId);
    const nextStatus = checkAutoCompletion({ ...ch, subtasks: updatedSubtasks });

    await updateChapter(selectedChapterId, {
      subtasks: updatedSubtasks,
      status: nextStatus,
    });
  };

  // 3. QUESTION COUNT INCREMENT / DECREMENT
  const handleUpdateQuestions = async (type, field, val) => {
    if (!selectedChapterId) return;
    const ch = cards.find((c) => c.id === selectedChapterId);
    if (!ch) return;

    const num = Math.max(0, parseInt(val, 10) || 0);
    const currentTracker = ch[type] || { total: 0, completed: 0 };
    const updatedTracker = { ...currentTracker, [field]: num };

    if (field === 'completed' && num > updatedTracker.total) {
      updatedTracker.total = num;
    }

    await updateChapter(selectedChapterId, { [type]: updatedTracker });
  };

  const handleIncrementQuestions = async (type, delta) => {
    if (!selectedChapterId) return;
    const ch = cards.find((c) => c.id === selectedChapterId);
    if (!ch) return;

    const currentTracker = ch[type] || { total: 50, completed: 0 };
    const nextComp = Math.max(0, (currentTracker.completed || 0) + delta);
    const nextTotal = Math.max(currentTracker.total || 1, nextComp);

    await updateChapter(selectedChapterId, {
      [type]: { ...currentTracker, completed: nextComp, total: nextTotal },
    });
  };

  const overallProgress = calculateOverallProgress(cards);

  // Status Badge Component Helper
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
        title="Click to cycle status (Not Started → In Progress → Completed)"
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-6 bg-transparent"
    >
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <MagneticButton strength={0.2}>
            <button
              onClick={() => {
                if (activeView === 'detail') {
                  setActiveView('list');
                } else {
                  onBackToDashboard();
                }
              }}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[44px] rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white flex items-center gap-2 text-xs font-mono transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{activeView === 'detail' ? 'Back to Chapters' : 'Back to Dashboard'}</span>
            </button>
          </MagneticButton>

          <div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight flex flex-wrap items-center gap-2 sm:gap-3 font-sans">
              <span>{subject.title}</span>
              <span className="text-xs font-mono text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                {subject.subtitle}
              </span>
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              {cards.length} Chapters • {overallProgress}% Complete Overall
            </p>
          </div>
        </div>

        {/* Action Controls */}
        {activeView === 'list' && (
          <MagneticButton strength={0.2} onClick={() => setIsAddingChapter(true)}>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono transition-all w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span>Add Chapter</span>
            </button>
          </MagneticButton>
        )}
      </div>

      {/* Overall Progress Summary Banner */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-3">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-400">Overall Subject Syllabus Progress</span>
          <span className="text-indigo-300 font-bold">{overallProgress}%</span>
        </div>
        <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-400 shadow-[0_0_12px_rgba(129,140,248,0.4)]"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBMENU 1: CHAPTER DIRECTORY FULL-PAGE LIST VIEW */}
      {/* ========================================================= */}
      {activeView === 'list' && (
        <div className="space-y-4">
          {/* Inline Add Chapter Form */}
          {isAddingChapter && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddChapter}
              className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono"
            >
              <input
                type="text"
                autoFocus
                placeholder="Enter new chapter title (e.g. Rotational Mechanics)..."
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="w-full sm:flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 transition-colors"
                >
                  Save Chapter
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingChapter(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-zinc-400 text-xs hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}

          {/* Chapters Directory List */}
          {cards.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 font-mono text-xs border border-white/[0.06] rounded-2xl bg-white/[0.01]">
              No chapters added yet. Click "Add Chapter" above to start populating this module.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {cards.map((ch) => {
                const subtasks = ch.subtasks || [];
                const totalSub = subtasks.length;
                const compSub = subtasks.filter((s) => s.completed).length;
                const totalQ = (ch.moduleQuestions?.total || 0) + (ch.workbookQuestions?.total || 0);
                const compQ = (ch.moduleQuestions?.completed || 0) + (ch.workbookQuestions?.completed || 0);
                const cardProgress = (totalSub + totalQ) > 0 ? Math.round(((compSub + compQ) / (totalSub + totalQ)) * 100) : 0;

                const isEditingThis = editingChapterId === ch.id;

                return (
                  <div
                    key={ch.id}
                    className="p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
                    onClick={() => {
                      if (!isEditingThis) {
                        setSelectedChapterId(ch.id);
                        setActiveView('detail');
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-indigo-300 shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>

                      {/* 2. EDIT MODE & INLINE UPDATES */}
                      {isEditingThis ? (
                        <div className="flex flex-col gap-2.5 flex-1 p-3 bg-black/60 rounded-xl border border-indigo-500/40" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              placeholder="Chapter Title"
                              className="bg-black/80 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-400 w-full"
                            />
                            <button
                              type="button"
                              onClick={(e) => handleSaveEditChapter(ch.id, e)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-mono font-medium flex items-center gap-1 shrink-0"
                            >
                              <Check className="w-4 h-4" /> Save
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-zinc-400">
                            <div>
                              <span className="block text-[9px] text-zinc-500">Module Solved</span>
                              <input
                                type="number"
                                min="0"
                                value={editingModuleComp}
                                onChange={(e) => setEditingModuleComp(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] text-zinc-500">Module Target</span>
                              <input
                                type="number"
                                min="1"
                                value={editingModuleTotal}
                                onChange={(e) => setEditingModuleTotal(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] text-zinc-500">Workbook Solved</span>
                              <input
                                type="number"
                                min="0"
                                value={editingWorkbookComp}
                                onChange={(e) => setEditingWorkbookComp(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] text-zinc-500">Workbook Target</span>
                              <input
                                type="number"
                                min="1"
                                value={editingWorkbookTotal}
                                onChange={(e) => setEditingWorkbookTotal(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-medium text-white truncate group-hover:text-indigo-200 transition-colors">
                              {ch.title || ch.name || ch.chapterName || ch.chapter_name || 'Untitled'}
                            </h4>
                            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                              {cardProgress}%
                            </span>
                          </div>
                          <p className="text-xs font-mono text-zinc-400 mt-1">
                            {compSub}/{totalSub} Subtasks Done • Module Qs: {ch.moduleQuestions?.completed || 0}/{ch.moduleQuestions?.total || 0} • Workbook: {ch.workbookQuestions?.completed || 0}/{ch.workbookQuestions?.total || 0}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status & Controls */}
                    <div
                      className="flex items-center gap-3 shrink-0 justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 5. STATUS PILL TOGGLE */}
                      {renderStatusBadge(ch.status, (e) => handleToggleStatus(ch.id, e))}

                      {/* 2. EDIT BUTTON (Pencil Icon) */}
                      {!isEditingThis && (
                        <button
                          onClick={(e) => startEditingChapter(ch, e)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit Chapter Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* 1. CHAPTER / CARD DELETE (Trash Icon) */}
                      <button
                        onClick={(e) => handleDeleteCard(ch.id, e)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBMENU 2: CHAPTER DETAIL & SUBTASK INSPECTOR */}
      {/* ========================================================= */}
      {activeView === 'detail' && selectedChapter && (
        <div className="space-y-8 font-mono">
          {/* Chapter Focus Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.08] p-6 rounded-2xl">
            <div className="flex-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 block">Chapter Focus</span>
              
              {editingChapterId === selectedChapter.id ? (
                <div className="flex items-center gap-2 mt-1 max-w-md">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="bg-black/80 border border-indigo-400 rounded-xl px-3 py-1.5 text-sm text-white font-sans focus:outline-none w-full"
                  />
                  <button
                    onClick={(e) => handleSaveEditChapter(selectedChapter.id, e)}
                    className="p-2 rounded-xl bg-indigo-500 text-white shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-0.5">
                  <h3 className="text-2xl font-light text-white font-sans">
                    {selectedChapter ? (selectedChapter.title || selectedChapter.name || selectedChapter.chapterName || selectedChapter.chapter_name || 'Untitled') : 'Untitled'}
                  </h3>
                  <button
                    onClick={(e) => startEditingChapter(selectedChapter, e)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Edit Title"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">Status:</span>
              {/* 5. STATUS PILL TOGGLE */}
              {renderStatusBadge(selectedChapter.status, (e) => handleToggleStatus(selectedChapter.id, e))}

              {/* 1. CHAPTER / CARD DELETE (Trash Icon) */}
              <button
                onClick={(e) => handleDeleteCard(selectedChapter.id, e)}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-2 cursor-pointer"
                title="Delete Card"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subtasks Inspector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                Subtasks & Objectives
              </h4>
              <span className="text-xs text-zinc-400">
                {(selectedChapter.subtasks || []).filter((s) => s.completed).length} / {(selectedChapter.subtasks || []).length} Completed
              </span>
            </div>

            {/* 4. "Add Subtask" Button & Inline Form */}
            {isAddingSubtaskInline ? (
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Add a new subtask (e.g. Solve HC Verma ex 1-15)..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 bg-white/[0.03] border border-indigo-500/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSubtaskInline(false)}
                  className="px-3 py-2.5 rounded-xl bg-white/5 text-zinc-400 text-xs hover:text-white"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a new subtask (e.g. Solve HC Verma ex 1-15)..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs hover:bg-indigo-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Subtask
                </button>
              </form>
            )}

            {/* 4. SUBTASK CHECKBOXES */}
            <div className="space-y-2.5">
              {(selectedChapter.subtasks || []).map((st) => (
                <div
                  key={st.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    st.completed
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-400 line-through'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-200 hover:border-white/20'
                  }`}
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => handleToggleSubtask(st.id)}
                  >
                    <button type="button" className="text-indigo-400 hover:scale-110 transition-transform">
                      {st.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-500" />
                      )}
                    </button>
                    <span className="text-xs">{st.title}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. QUESTION TRACKERS SECTION & INCREMENT/DECREMENT */}
          <div className="space-y-4 border-t border-white/[0.08] pt-6">
            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              Problem Solving Tracker
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Module Questions */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Module Questions</span>
                  <span className="text-xs text-indigo-300 font-bold">
                    {selectedChapter.moduleQuestions?.total > 0
                      ? Math.round(
                          ((selectedChapter.moduleQuestions?.completed || 0) /
                            selectedChapter.moduleQuestions.total) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Completed</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleIncrementQuestions('moduleQuestions', -1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 flex items-center justify-center font-bold text-sm transition-all shrink-0"
                        title="Decrement solved"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={selectedChapter.moduleQuestions?.completed || 0}
                        onChange={(e) => handleUpdateQuestions('moduleQuestions', 'completed', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleIncrementQuestions('moduleQuestions', 1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 flex items-center justify-center font-bold text-sm transition-all shrink-0"
                        title="Increment solved"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Total Target</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedChapter.moduleQuestions?.total || 0}
                      onChange={(e) => handleUpdateQuestions('moduleQuestions', 'total', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-indigo-400 mt-1"
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        selectedChapter.moduleQuestions?.total > 0
                          ? Math.min(
                              100,
                              ((selectedChapter.moduleQuestions?.completed || 0) /
                                selectedChapter.moduleQuestions.total) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Workbook Questions */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Workbook / PYQs</span>
                  <span className="text-xs text-violet-300 font-bold">
                    {selectedChapter.workbookQuestions?.total > 0
                      ? Math.round(
                          ((selectedChapter.workbookQuestions?.completed || 0) /
                            selectedChapter.workbookQuestions.total) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Completed</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleIncrementQuestions('workbookQuestions', -1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 flex items-center justify-center font-bold text-sm transition-all shrink-0"
                        title="Decrement solved"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={selectedChapter.workbookQuestions?.completed || 0}
                        onChange={(e) => handleUpdateQuestions('workbookQuestions', 'completed', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-violet-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleIncrementQuestions('workbookQuestions', 1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 flex items-center justify-center font-bold text-sm transition-all shrink-0"
                        title="Increment solved"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Total Target</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedChapter.workbookQuestions?.total || 0}
                      onChange={(e) => handleUpdateQuestions('workbookQuestions', 'total', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-violet-400 mt-1"
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        selectedChapter.workbookQuestions?.total > 0
                          ? Math.min(
                              100,
                              ((selectedChapter.workbookQuestions?.completed || 0) /
                                selectedChapter.workbookQuestions.total) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function SyllabusTracker({ subject, onBackToDashboard }) {
  return (
    <SyllabusView
      subject={subject}
      onBackToDashboard={onBackToDashboard || (() => {})}
    />
  );
}

export default SyllabusTracker;
