import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Search,
  BookOpen,
  CheckSquare,
  Sparkles,
  BarChart3,
  Atom,
  FlaskConical,
  Compass,
  X
} from 'lucide-react';
import { useChapters } from '../../context/ChapterContext';
import {
  calculateChapterProgress,
  calculateSubjectProgress,
  isCorePreset,
} from '../../lib/syllabusUtils';

export function SyllabusView({ subject, initialChapterId, onBackToDashboard }) {
  const { chapters, addChapter, updateChapter, deleteChapter, getSubjectChapters } = useChapters();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'in_progress', 'pending'
  const [expandedChapters, setExpandedChapters] = useState({});
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState({});

  // Resolve Subject title & class level safely
  const subjectTitle = subject?.title || subject?.name || 'Physics';
  const classLevel = subject?.class_level || subject?.classLevel || 'C-11';
  const normClassLevel = String(classLevel).includes('12') ? 'C-12' : 'C-11';

  // Get subject icon component
  const getSubjectIcon = (title) => {
    const norm = (title || '').toLowerCase();
    if (norm.includes('phys')) return Atom;
    if (norm.includes('chem')) return FlaskConical;
    if (norm.includes('math')) return Compass;
    return BookOpen;
  };
  const SubjectIcon = getSubjectIcon(subjectTitle);

  // Fetch chapters for this subject dynamically from context
  const currentSubjectChapters = useMemo(() => {
    return getSubjectChapters(subjectTitle, normClassLevel);
  }, [getSubjectChapters, subjectTitle, normClassLevel, chapters]);

  // Handle external trigger for search redirection / auto-expansion & scrolling
  useEffect(() => {
    if (initialChapterId) {
      const targetId = String(initialChapterId);
      setExpandedChapters((prev) => ({ ...prev, [targetId]: true }));

      const timer = setTimeout(() => {
        const el = document.getElementById(`chapter-card-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [initialChapterId]);

  // Toggle chapter accordion expansion state
  const toggleChapterExpand = (chapterId) => {
    const key = String(chapterId);
    setExpandedChapters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filtered chapters list based on search and status tabs
  const filteredChapters = useMemo(() => {
    return currentSubjectChapters.filter((ch) => {
      const title = ch.title || ch.name || ch.chapterName || ch.chapter_name || '';
      const matchesQuery = !searchQuery.trim() || title.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesStatus = filterStatus === 'all' || ch.status === filterStatus;
      return matchesQuery && matchesStatus;
    });
  }, [currentSubjectChapters, searchQuery, filterStatus]);

  // Subject level statistics calculations
  const stats = useMemo(() => {
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    let totalQuestions = 0;
    let completedQuestions = 0;
    let completedChaptersCount = 0;

    currentSubjectChapters.forEach((ch) => {
      const chProgress = calculateChapterProgress(ch.subtasks);
      if (ch.status === 'completed' || chProgress === 100) completedChaptersCount++;

      const subtasks = ch.subtasks || [];
      totalSubtasks += subtasks.length;
      completedSubtasks += subtasks.filter((s) => s.completed).length;

      const modTotal = Number(ch.moduleQuestions?.total || 0);
      const modComp = Number(ch.moduleQuestions?.completed || 0);
      const wbTotal = Number(ch.workbookQuestions?.total || 0);
      const wbComp = Number(ch.workbookQuestions?.completed || 0);

      totalQuestions += modTotal + wbTotal;
      completedQuestions += modComp + wbComp;
    });

    const overallProgress = calculateSubjectProgress(currentSubjectChapters);

    return {
      totalChapters: currentSubjectChapters.length,
      completedChapters: completedChaptersCount,
      totalSubtasks,
      completedSubtasks,
      totalQuestions,
      completedQuestions,
      overallProgress,
    };
  }, [currentSubjectChapters]);

  // Actions for Chapters & Subtasks
  const handleCreateChapter = (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    const newId = addChapter({
      title: newChapterTitle.trim(),
      subject: subjectTitle,
      classLevel: normClassLevel,
      status: 'pending',
    });

    setNewChapterTitle('');
    setIsAddModalOpen(false);

    if (newId) {
      setExpandedChapters((prev) => ({ ...prev, [String(newId)]: true }));
    }
  };

  const handleToggleSubtask = (chapter, subtaskId) => {
    const updatedSubtasks = (chapter.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    updateChapter(chapter.id, { subtasks: updatedSubtasks });
  };

  const handleAddSubtask = (chapterId) => {
    const text = (newSubtaskInputs[chapterId] || '').trim();
    if (!text) return;

    const targetChapter = currentSubjectChapters.find((c) => String(c.id) === String(chapterId));
    if (!targetChapter) return;

    const newSubtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: text,
      completed: false,
    };

    const updatedSubtasks = [...(targetChapter.subtasks || []), newSubtask];
    updateChapter(chapterId, { subtasks: updatedSubtasks });
    setNewSubtaskInputs((prev) => ({ ...prev, [chapterId]: '' }));
  };

  const handleDeleteSubtask = (chapter, subtaskId) => {
    const targetSubtask = (chapter.subtasks || []).find((s) => s.id === subtaskId);
    if (targetSubtask && isCorePreset(targetSubtask.title)) {
      return;
    }
    const updatedSubtasks = (chapter.subtasks || []).filter((s) => s.id !== subtaskId);
    updateChapter(chapter.id, { subtasks: updatedSubtasks });
  };

  const handleStatusChange = (chapterId, newStatus) => {
    updateChapter(chapterId, { status: newStatus });
  };

  const handleUpdateQuestions = (chapterId, type, field, val) => {
    const targetChapter = currentSubjectChapters.find((c) => String(c.id) === String(chapterId));
    if (!targetChapter) return;

    const key = type === 'module' ? 'moduleQuestions' : 'workbookQuestions';
    const current = targetChapter[key] || { total: 0, completed: 0 };
    const numVal = Math.max(0, parseInt(val, 10) || 0);

    const updatedObj = {
      ...current,
      [field]: field === 'completed' ? Math.min(numVal, current.total || numVal) : numVal,
    };

    updateChapter(chapterId, { [key]: updatedObj });
  };

  // Status Micro-Pill Renderer
  const renderStatusPill = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono tracking-wide flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono tracking-wide flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-[11px] font-mono tracking-wide flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6 bg-transparent font-sans text-slate-100 selection:bg-indigo-500/30 pb-36 sm:pb-40">
      {/* 1. Header & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="h-9 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-2 font-mono group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-neutral-400" />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${subject?.accentIconStyle || 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
              <SubjectIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{subjectTitle}</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  Class {normClassLevel.replace('C-', '')}
                </span>
              </h1>
              <p className="text-xs text-neutral-400 font-mono">
                {subject?.subtitle || `${subjectTitle} Syllabus & Chapter Tracker`}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="h-9 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-medium text-neutral-200 hover:text-white flex items-center gap-2 font-mono cursor-pointer self-start sm:self-auto bg-white/[0.03]"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>Add Chapter</span>
        </button>
      </div>

      {/* 2. Top Metric Glass Panel Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Completion Progress Glass Tile */}
        <div className="md:col-span-2 bg-neutral-900/50 border border-white/[0.07] backdrop-blur-xl rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-neutral-400 font-mono tracking-wider uppercase block mb-1">
                Subject Mastery
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono tracking-tight font-semibold text-white">
                  {stats.overallProgress}%
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  ({stats.completedChapters}/{stats.totalChapters} Chapters Completed)
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.overallProgress}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full ${subject?.accentProgressFill || 'bg-gradient-to-r from-indigo-500 to-cyan-400'}`}
              />
            </div>
          </div>
        </div>

        {/* Subtasks Progress Glass Tile */}
        <div className="bg-neutral-900/50 border border-white/[0.07] backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span className="text-xs text-neutral-400 font-mono tracking-wider uppercase">Subtasks</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-mono tracking-tight font-semibold text-white">
              {stats.completedSubtasks} / {stats.totalSubtasks}
            </div>
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
              {stats.totalSubtasks > 0 ? `${Math.round((stats.completedSubtasks / stats.totalSubtasks) * 100)}% checklist done` : 'No subtasks created'}
            </p>
          </div>
        </div>

        {/* Question Target Progress Glass Tile */}
        <div className="bg-neutral-900/50 border border-white/[0.07] backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span className="text-xs text-neutral-400 font-mono tracking-wider uppercase">Questions Solved</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-mono tracking-tight font-semibold text-white">
              {stats.completedQuestions} / {stats.totalQuestions}
            </div>
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
              {stats.totalQuestions > 0 ? `${Math.round((stats.completedQuestions / stats.totalQuestions) * 100)}% problem quota` : 'No questions assigned'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters in this syllabus..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900/50 border border-white/[0.07] focus:border-indigo-500/50 rounded-xl text-xs font-mono text-white placeholder-neutral-500 focus:outline-none transition-colors backdrop-blur-md"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-neutral-900/50 border border-white/[0.07] rounded-xl font-mono text-xs overflow-x-auto backdrop-blur-md">
          {[
            { id: 'all', label: 'All' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'pending', label: 'Pending' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? 'bg-white/10 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 font-normal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Chapter Accordion List */}
      <div className="space-y-3">
        {filteredChapters.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-white/[0.07] text-neutral-500 font-mono text-xs space-y-2 backdrop-blur-md">
            <BookOpen className="w-8 h-8 mx-auto text-neutral-600 stroke-[1.5]" />
            <p>No chapters match your search or filter criteria.</p>
          </div>
        ) : (
          filteredChapters.map((ch, index) => {
            const chIdStr = String(ch.id);
            const isExpanded = !!expandedChapters[chIdStr];

            const title = ch.title || ch.name || ch.chapterName || ch.chapter_name || 'Untitled Chapter';
            const subtasks = ch.subtasks || [];
            const completedSubtasks = subtasks.filter((s) => s.completed).length;

            const modTotal = Number(ch.moduleQuestions?.total || 0);
            const modComp = Number(ch.moduleQuestions?.completed || 0);
            const wbTotal = Number(ch.workbookQuestions?.total || 0);
            const wbComp = Number(ch.workbookQuestions?.completed || 0);

            const chapterProgress = calculateChapterProgress(subtasks);

            return (
              <div
                key={ch.id}
                id={`chapter-card-${ch.id}`}
                className={`bg-neutral-950/60 border border-white/[0.08] backdrop-blur-md rounded-2xl overflow-hidden hover:border-white/[0.14] transition-all ${
                  isExpanded ? 'border-white/[0.16] shadow-[0_0_30px_rgba(0,0,0,0.4)]' : ''
                }`}
              >
                {/* Collapsed Header Bar */}
                <div
                  onClick={() => toggleChapterExpand(ch.id)}
                  className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <span className="font-mono text-xs text-neutral-500 w-6 shrink-0 pt-0.5 sm:pt-0">
                      #{index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-medium text-sm text-neutral-200 tracking-normal truncate">
                          {title}
                        </h3>
                        {renderStatusPill(ch.status)}
                      </div>

                      {/* Summary Metrics */}
                      <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                        <span>{completedSubtasks}/{subtasks.length} Subtasks</span>
                        <span>•</span>
                        <span>{modComp + wbComp}/{modTotal + wbTotal} Questions</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Micro-Bar & Chevron Toggle */}
                  <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                    <div className="flex items-center gap-2.5 w-32">
                      <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full transition-all duration-500 ${
                            ch.status === 'completed'
                              ? 'bg-emerald-400'
                              : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                          }`}
                          style={{ width: `${chapterProgress}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-neutral-400 w-8 text-right">
                        {chapterProgress}%
                      </span>
                    </div>

                    <div className="p-1 rounded-lg text-neutral-500">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180 text-white' : 'text-neutral-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Submenu Container */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="border-t border-white/[0.06] bg-black/30 p-4 sm:p-5 space-y-5"
                    >
                      {/* Top Control Bar: Compact Segmented Status Selector & Discrete Delete */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.05]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 font-mono">Status:</span>
                          <div className="bg-black/40 p-1 rounded-xl border border-white/5 inline-flex gap-1 font-mono">
                            {[
                              { id: 'pending', label: 'Pending' },
                              { id: 'in_progress', label: 'In Progress' },
                              { id: 'completed', label: 'Completed' },
                            ].map((st) => (
                              <button
                                key={st.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(ch.id, st.id);
                                }}
                                className={`transition-all ${
                                  ch.status === st.id
                                    ? 'bg-white/10 text-white font-medium text-xs rounded-lg px-3 py-1 shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-200 font-normal text-xs rounded-lg px-3 py-1 transition-colors'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Discrete Trash Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete chapter "${title}"?`)) {
                              deleteChapter(ch.id);
                            }
                          }}
                          title="Delete Chapter"
                          className="text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>

                      {/* Subtasks Checklist */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                            Subtasks Checklist
                          </span>
                          <span className="text-[11px] font-mono text-neutral-500">
                            {completedSubtasks}/{subtasks.length} done
                          </span>
                        </div>

                        {/* Minimalist Subtask Rows */}
                        <div className="space-y-1">
                          {subtasks.length === 0 ? (
                            <p className="text-xs text-neutral-500 italic pl-1 font-mono py-1">
                              No subtasks created yet.
                            </p>
                          ) : (
                            subtasks.map((st) => {
                              const isCore = isCorePreset(st.title);
                              return (
                                <div
                                  key={st.id}
                                  className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
                                >
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSubtask(ch, st.id)}
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                                        st.completed
                                          ? 'bg-indigo-500 border-indigo-500 text-white'
                                          : 'border-neutral-600 hover:border-indigo-400'
                                      }`}
                                    >
                                      {st.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </button>
                                    <span
                                      className={`text-xs text-neutral-300 font-sans truncate ${
                                        st.completed ? 'line-through text-neutral-500' : ''
                                      }`}
                                    >
                                      {st.title}
                                    </span>
                                  </div>

                                  {!isCore && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubtask(ch, st.id)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Minimalist Ghost Input & Inline Add Button */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={newSubtaskInputs[ch.id] || ''}
                            onChange={(e) =>
                              setNewSubtaskInputs((prev) => ({ ...prev, [ch.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubtask(ch.id);
                              }
                            }}
                            placeholder="Add subtask (e.g. Read Theory, Solve DPP)..."
                            className="bg-transparent border-b border-white/10 focus:border-indigo-400/60 text-xs text-neutral-200 placeholder-neutral-500 py-1.5 focus:outline-none flex-1 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSubtask(ch.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono px-2.5 py-1 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>

                      {/* Practice Quotas / Micro-Stat Tiles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Module Questions Tile */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 font-mono">
                          <div>
                            <span className="text-xs text-neutral-300 font-medium block">
                              Module Questions
                            </span>
                            <span className="text-[10px] text-neutral-500 block mt-0.5">
                              {modComp} of {modTotal} completed
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max={modTotal}
                              value={modComp}
                              onChange={(e) =>
                                handleUpdateQuestions(ch.id, 'module', 'completed', e.target.value)
                              }
                              className="bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-center w-12 py-1 text-white focus:outline-none focus:border-indigo-400/60"
                            />
                            <span className="text-neutral-500 text-xs">/</span>
                            <input
                              type="number"
                              min="0"
                              value={modTotal}
                              onChange={(e) =>
                                handleUpdateQuestions(ch.id, 'module', 'total', e.target.value)
                              }
                              className="bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-center w-12 py-1 text-neutral-400 focus:outline-none focus:border-indigo-400/60"
                            />
                          </div>
                        </div>

                        {/* Workbook / PYQs Tile */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 font-mono">
                          <div>
                            <span className="text-xs text-neutral-300 font-medium block">
                              Workbook / PYQs
                            </span>
                            <span className="text-[10px] text-neutral-500 block mt-0.5">
                              {wbComp} of {wbTotal} completed
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max={wbTotal}
                              value={wbComp}
                              onChange={(e) =>
                                handleUpdateQuestions(ch.id, 'workbook', 'completed', e.target.value)
                              }
                              className="bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-center w-12 py-1 text-white focus:outline-none focus:border-indigo-400/60"
                            />
                            <span className="text-neutral-500 text-xs">/</span>
                            <input
                              type="number"
                              min="0"
                              value={wbTotal}
                              onChange={(e) =>
                                handleUpdateQuestions(ch.id, 'workbook', 'total', e.target.value)
                              }
                              className="bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-center w-12 py-1 text-neutral-400 focus:outline-none focus:border-indigo-400/60"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Add Chapter Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-neutral-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl z-50 space-y-5 font-mono backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Add Chapter to {subjectTitle}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateChapter} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 block">Chapter Title / Name</label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="e.g. Rotational Motion, Integration..."
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-9 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-medium text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg cursor-pointer transition-colors"
                  >
                    Create Chapter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Re-export SyllabusTracker as an alias to SyllabusView for full backward compatibility
export function SyllabusTracker(props) {
  return <SyllabusView {...props} />;
}

export default SyllabusView;