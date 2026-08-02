import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';
import MagneticButton from '../components/ui/MagneticButton';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

export function TaskPlanner() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const { tasks = [], setTasks, toggleTask, deleteTask } = useAppData();

  // Task Creation Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Physics');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('20:00');

  // Filter State
  const [filterSubject, setFilterSubject] = useState('All');

  const formatDueString = (dateVal, timeVal) => {
    if (!dateVal) return 'Today, 8:00 PM';
    const d = new Date(`${dateVal}T${timeVal || '00:00'}`);
    if (isNaN(d.getTime())) return dateVal;

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateVal === todayStr;

    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) return `Today, ${timeFormatted}`;
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dateFormatted}, ${timeFormatted}`;
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      subject: newSubject,
      priority: newPriority,
      due: formatDueString(newDueDate, newDueTime),
      completed: false,
      user_id: user?.id,
    };

    setTasks((prev) => [newTask, ...prev]);

    setNewTaskTitle('');
    setNewDueDate('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterSubject === 'All') return true;
    return t.subject === filterSubject;
  });

  return (
    <div className="w-full space-y-6 bg-transparent select-none">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
            <CheckSquare className="w-4 h-4" />
            <span>Target Execution Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Task & DPP Planner</h1>
          <p className="text-sm text-slate-400 font-light">Set daily objectives, practice problem targets, and subject milestones.</p>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md font-mono text-xs overflow-x-auto scrollbar-none">
          {['All', 'Physics', 'Chemistry', 'Mathematics', 'General'].map((subj) => (
            <button
              key={subj}
              onClick={() => setFilterSubject(subj)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterSubject === subj
                  ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* QUICK ADD TASK FORM */}
      <form onSubmit={handleAddTask} className="bg-[#06060c]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new target task (e.g. Solve 30 PYQs on Electrostatics)..."
            className="flex-1 bg-white/[0.04] border border-white/10 focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none font-mono transition-all"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Subject Selector */}
            <select
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="bg-white/[0.04] border border-white/10 text-slate-200 text-xs font-mono rounded-xl px-3 py-3 outline-none cursor-pointer"
            >
              <option value="Physics" className="bg-[#080814] text-slate-200">Physics</option>
              <option value="Chemistry" className="bg-[#080814] text-slate-200">Chemistry</option>
              <option value="Mathematics" className="bg-[#080814] text-slate-200">Mathematics</option>
              <option value="General" className="bg-[#080814] text-slate-200">General</option>
            </select>

            {/* Date & Time Picker */}
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 px-3 py-2.5 rounded-xl font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              />
              <input
                type="time"
                value={newDueTime}
                onChange={(e) => setNewDueTime(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              />
            </div>

            {/* Priority Toggle */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl font-mono text-xs">
              {['High', 'Medium', 'Low'].map((prio) => (
                <button
                  key={prio}
                  type="button"
                  onClick={() => setNewPriority(prio)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    newPriority === prio
                      ? prio === 'High'
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : prio === 'Medium'
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-500/30 text-slate-200 border border-slate-400/40 shadow-[0_0_10px_rgba(148,163,184,0.3)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prio}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action Button */}
          <MagneticButton strength={0.3}>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] cursor-pointer transition-all active:scale-95 font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Add Target Task</span>
            </button>
          </MagneticButton>
        </div>
      </form>

      {/* TASK LIST OR SLEEK GLASSMORPHIC EMPTY STATE */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center text-slate-500 font-mono text-xs">
          No active tasks. Create your first target to initialize.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.5 }}
                onClick={() => toggleTask(task.id)}
                className={`bg-[#06060c]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden group shadow-lg will-change-transform transform-gpu ${
                  task.completed ? 'opacity-40 line-through bg-[#06060c]/30' : 'group-hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]'
                }`}
              >
                <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-md" />

                <div className="flex items-center gap-4 min-w-0 relative z-10">
                  <div className="shrink-0 text-indigo-400 group-hover:scale-110 transition-transform">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p className={`text-sm font-medium transition-colors ${task.completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                      {task.title}
                    </p>

                    <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {task.due}
                      </span>
                      <span>•</span>
                      <span
                        className={`font-semibold ${
                          task.subject === 'Physics'
                            ? 'text-cyan-400'
                            : task.subject === 'Chemistry'
                            ? 'text-purple-400'
                            : task.subject === 'Mathematics'
                            ? 'text-indigo-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {task.subject}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 shrink-0 font-mono">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      task.priority === 'High'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : task.priority === 'Medium'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-slate-500/10 border-slate-500/30 text-slate-300'
                    }`}
                  >
                    {task.priority} Priority
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export const TasksView = TaskPlanner;
export default TaskPlanner;
