import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Atom,
  FlaskConical,
  Compass,
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import GlareCard from '../ui/GlareCard';
import MagneticButton from '../ui/MagneticButton';
import SyllabusView from './SyllabusView';
import Heatmap from './Heatmap';
import { useChapters } from '../../context/ChapterContext';
import { useAppData } from '../../context/AppDataContext';
import { calculateSubjectProgress } from '../../lib/syllabusUtils';

const GREETINGS = [
  "What are we working on today?",
  "What should we focus on?",
  "Where do you want to start?",
  "How are we approaching this today?",
  "What's on the agenda?",
  "What are we clearing today?",
  "Which module gets picked first?",
  "What's the play for this session?",
  "Where are we digging in?",
  "What's taking priority today?",
  "Ready when you are.",
  "Back at it, then.",
  "Let's knock out a few modules.",
  "Time to clear some backlogs.",
  "Let's make some progress.",
  "Let's get through this list.",
  "What's next on the board?",
  "Pick a topic and let's go.",
  "Let's break down a subject.",
  "What are we solving first?",
  "Calculus or Mechanics today?",
  "Rotational dynamics or Integration?",
  "Organic mechanisms or Coordinate Geometry?",
  "Thermodynamics or Algebra?",
  "Electrostatics or Physical Chemistry?",
  "Vectors or Chemical Bonding?",
  "Complex numbers or Optics?",
  "Definite integrals or Equilibrium?",
  "Kinematics or Periodic Table?",
  "Permutations or Fluid Mechanics?",
  "Entropy isn't decreasing itself.",
  "Another day, another reaction mechanism.",
  "Integration constants aren't going to solve themselves.",
  "Let's see if conservation of energy holds up.",
  "Time to deal with three-body problems.",
  "Friction is optional, progress isn't.",
  "Let's minimize the potential energy here.",
  "Work done equals area under the curve.",
  "Assume zero resistance for this session.",
  "Let's resolve these vectors.",
  "Balancing equations, as usual.",
  "Let's reduce the chaos factor.",
  "No approximations allowed today.",
  "Time to evaluate some limits.",
  "Still here, still working.",
  "Back to the drawing board.",
  "One topic at a time.",
  "Quiet focus mode.",
  "Let's get through the heavy lifting.",
  "Making sense of the syllabus.",
  "Checking off the hard stuff.",
  "Steady progress beats speed.",
  "Diving straight in.",
  "No fluff, just problem solving.",
  "Let's handle the trickiest chapter first."
];

// Initial Default Subject Metadata (without hardcoded chapter arrays)
const SUBJECT_METADATA = {
  'C-11': [
    {
      id: 'phy-11',
      title: 'Physics',
      subtitle: 'Class 11 Mechanics & Waves',
      icon: 'Atom',
      accentIconStyle: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
      accentProgressFill: 'bg-gradient-to-r from-indigo-500 to-cyan-400',
      accentGlow: 'from-cyan-500/20 via-indigo-500/10 to-transparent',
      accentHoverShadow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.14)]',
    },
    {
      id: 'chem-11',
      title: 'Chemistry',
      subtitle: 'Class 11 Physical & Organic',
      icon: 'FlaskConical',
      accentIconStyle: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
      accentProgressFill: 'bg-gradient-to-r from-indigo-500 to-violet-400',
      accentGlow: 'from-violet-500/20 via-purple-500/10 to-transparent',
      accentHoverShadow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.14)]',
    },
    {
      id: 'math-11',
      title: 'Mathematics',
      subtitle: 'Class 11 Calculus & Algebra',
      icon: 'Compass',
      accentIconStyle: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
      accentProgressFill: 'bg-gradient-to-r from-violet-500 to-rose-400',
      accentGlow: 'from-rose-500/20 via-pink-500/10 to-transparent',
      accentHoverShadow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.14)]',
    },
  ],
  'C-12': [
    {
      id: 'phy-12',
      title: 'Physics',
      subtitle: 'Class 12 Electromagnetism',
      icon: 'Atom',
      accentIconStyle: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
      accentProgressFill: 'bg-gradient-to-r from-indigo-500 to-cyan-400',
      accentGlow: 'from-cyan-500/20 via-indigo-500/10 to-transparent',
      accentHoverShadow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.14)]',
    },
    {
      id: 'chem-12',
      title: 'Chemistry',
      subtitle: 'Class 12 Organic Mechanisms',
      icon: 'FlaskConical',
      accentIconStyle: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
      accentProgressFill: 'bg-gradient-to-r from-indigo-500 to-violet-400',
      accentGlow: 'from-violet-500/20 via-purple-500/10 to-transparent',
      accentHoverShadow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.14)]',
    },
    {
      id: 'math-12',
      title: 'Mathematics',
      subtitle: 'Class 12 Differential & Vectors',
      icon: 'Compass',
      accentIconStyle: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
      accentProgressFill: 'bg-gradient-to-r from-violet-500 to-rose-400',
      accentGlow: 'from-rose-500/20 via-pink-500/10 to-transparent',
      accentHoverShadow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.14)]',
    },
  ],
};

// Generate 60-day study heatmap data
const generateHeatmapData = () => {
  const data = [];
  const today = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const intensity = Math.floor(Math.sin(i * 0.7) * 2.5 + 2);
    const hours = intensity === 0 ? 0 : (intensity * 1.8 + Math.random() * 0.5).toFixed(1);
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      intensity: Math.min(4, Math.max(0, intensity)),
      hours: Number(hours),
    });
  }
  return data;
};

const HEATMAP_ITEMS = generateHeatmapData();

// Animation Variants for 3D Curved Orbital Flow
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const orbitalCardVariants = {
  hidden: {
    opacity: 0,
    x: 120,
    z: -180,
    rotateY: -15,
    scale: 0.88,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    x: 0,
    z: 0,
    rotateY: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 190,
      damping: 22,
      mass: 0.85,
    },
  },
  exit: {
    opacity: 0,
    x: -120,
    z: -220,
    rotateY: 15,
    scale: 0.85,
    filter: 'blur(10px)',
    transition: {
      duration: 0.22,
      ease: 'easeIn',
    },
  },
};

export function StudyDashboard({ onNavigate, navigationTarget }) {
  const [activeClass, setActiveClass] = useState('C-11');
  const [hoveredDot, setHoveredDot] = useState(null);

  // Active Subject for Full-Page Syllabus Tab View
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [targetChapterId, setTargetChapterId] = useState(null);

  // Handle deep navigation target from search autocomplete
  useEffect(() => {
    if (navigationTarget?.subjectId) {
      if (navigationTarget.classLevel) {
        setActiveClass(navigationTarget.classLevel);
      }
      setActiveSubjectId(navigationTarget.subjectId);
      if (navigationTarget.chapterId) {
        setTargetChapterId(navigationTarget.chapterId);
      }
    }
  }, [navigationTarget]);

  // Consume dynamic chapter state from global ChapterContext and task state from AppDataContext
  const { chapters, getSubjectChapters, deleteChapter } = useChapters();
  const { tasks = [], toggleTask } = useAppData();

  const highPriorityTasks = useMemo(() => {
    return (tasks || [])
      .filter(
        (t) =>
          t &&
          !t.completed &&
          t.priority &&
          String(t.priority).toLowerCase() === 'high'
      )
      .slice(0, 4);
  }, [tasks]);

  // Typewriter State & Animation Logic
  const [targetPhrase] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < targetPhrase.length) {
        setDisplayedText(targetPhrase.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [targetPhrase]);

  // Icon component mapper
  const getSubjectIcon = (iconName) => {
    if (iconName === 'Atom') return Atom;
    if (iconName === 'FlaskConical') return FlaskConical;
    if (iconName === 'Compass') return Compass;
    return Atom;
  };

  const subjectMetadataList = SUBJECT_METADATA[activeClass] || [];

  // Build current subjects array with dynamic chapters attached from ChapterContext
  const currentSubjects = subjectMetadataList.map((subj) => ({
    ...subj,
    class_level: activeClass,
    chapters: getSubjectChapters(subj.title, activeClass),
  }));

  const activeSubject = currentSubjects.find((s) => s.id === activeSubjectId);

  // FULL-PAGE TAB VIEW FOR SYLLABUS MANAGEMENT
  if (activeSubject) {
    return (
      <AnimatePresence mode="wait">
        <SyllabusView
          key={`${activeSubject.id}_${targetChapterId || 'list'}_${navigationTarget?.timestamp || ''}`}
          subject={activeSubject}
          initialChapterId={targetChapterId}
          onBackToDashboard={() => {
            setActiveSubjectId(null);
            setTargetChapterId(null);
          }}
        />
      </AnimatePresence>
    );
  }

  // BASE DASHBOARD VIEW: Transparent container over root ambient glow
  return (
    <div className="w-full space-y-6 bg-transparent">
      <div className="w-full min-h-[calc(100vh-200px)] flex flex-col justify-between gap-10 font-sans">
      {/* 1. Dynamic Typewriter Hero Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-4 border-b border-white/[0.06]">
        <div className="min-h-[48px] flex items-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight text-white tracking-tight font-sans leading-tight">
            <span>{displayedText}</span>
            <span
              className={`inline-block w-[2px] h-6 sm:h-7 bg-indigo-400/80 ml-1.5 align-middle ${
                isTyping ? 'opacity-100' : 'animate-pulse'
              }`}
            />
          </h1>
        </div>

        {/* Minimalist Class 11 | Class 12 Text Toggle */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono shrink-0">
          <button
            onClick={() => setActiveClass('C-11')}
            className={`transition-colors duration-200 min-h-[44px] px-2 flex items-center ${
              activeClass === 'C-11' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Class 11
          </button>
          <span className="text-zinc-700 font-sans">|</span>
          <button
            onClick={() => setActiveClass('C-12')}
            className={`transition-colors duration-200 min-h-[44px] px-2 flex items-center ${
              activeClass === 'C-12' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Class 12
          </button>
        </div>
      </div>

      {/* 2. Dedicated High Priority Tasks Shelf */}
      <div className="bg-neutral-900/40 border border-white/[0.07] backdrop-blur-md rounded-2xl p-4 sm:p-5 space-y-3 font-mono">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.2em] text-neutral-400 uppercase">
              HIGH PRIORITY TARGETS
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('tasks')}
            className="text-xs font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>

        {highPriorityTasks.length === 0 ? (
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 py-2 px-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[1.5] shrink-0" />
            <span>No high-priority targets remaining · Clear runway ahead</span>
          </div>
        ) : (
          <div className="space-y-1.5 font-sans">
            {highPriorityTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigate && onNavigate('tasks')}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-white/[0.05] transition-all group cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(t.id);
                    }}
                    className="w-4 h-4 rounded-full border border-rose-500/50 hover:border-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                    title="Mark task as complete"
                  />
                  <span className="text-sm font-medium text-neutral-200 tracking-tight truncate">
                    {t.title || t.text || 'Untitled Task'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {t.subject && (
                    <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono px-2 py-0.5 rounded-md">
                      {t.subject}
                    </span>
                  )}
                  {t.due && (
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span>{t.due}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Luminescent Subject Modules Bento Grid */}
      <div className="space-y-6 flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-mono">
            Modules • Class {activeClass.replace('C-', '')}
          </span>

          <MagneticButton strength={0.25} onClick={() => onNavigate && onNavigate('Library')}>
            <button className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors min-h-[44px] px-2 py-1">
              <span>Full Syllabus</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </MagneticButton>
        </div>

        {/* 3D Perspective Parent Container */}
        <div className="min-h-[380px]" style={{ perspective: 1200 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeClass}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ transformStyle: 'preserve-3d' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8"
            >
              {currentSubjects.map((subj) => {
                let activeChapterName = null;

                subj.chapters.forEach((ch) => {
                  const chTitle = ch.title || ch.name || ch.chapterName || ch.chapter_name || ch.chapter;
                  if (!activeChapterName && chTitle && (ch.status === 'in_progress' || ch.status === 'pending')) {
                    activeChapterName = chTitle;
                  }
                });

                if (!activeChapterName && subj.chapters.length > 0) {
                  const firstCh = subj.chapters[0];
                  activeChapterName = firstCh.title || firstCh.name || firstCh.chapterName || firstCh.chapter_name || firstCh.chapter || 'Untitled';
                }

                const overallProgress = calculateSubjectProgress(subj.chapters);
                const SubjectIcon = getSubjectIcon(subj.icon);

                return (
                  <motion.div
                    key={subj.id}
                    variants={orbitalCardVariants}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <GlareCard
                      id={subj.id}
                      title={subj.title}
                      subtitle={subj.subtitle}
                      icon={SubjectIcon}
                      progress={overallProgress}
                      activeChapter={activeChapterName}
                      totalChapters={subj.chapters.length}
                      accentIconStyle={subj.accentIconStyle}
                      accentProgressFill={subj.accentProgressFill}
                      accentGlow={subj.accentGlow}
                      accentHoverShadow={subj.accentHoverShadow}
                      onManageClick={() => setActiveSubjectId(subj.id)}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Floating Natural Reactive Heatmap Matrix Grid (Relocated Below Glare Cards) */}
      <Heatmap days={60} title="60-Day Focus Matrix" />
    </div>
  </div>
);
}

export default StudyDashboard;
