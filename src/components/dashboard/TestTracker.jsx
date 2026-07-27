import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Award,
  TrendingUp,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import MagneticButton from '../ui/MagneticButton';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function ThreeDTiltCard({ children, className = '' }) {
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
        className={`bg-[#06060c]/70 backdrop-blur-2xl border border-white/10 border-t border-t-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-3xl p-6 relative overflow-hidden group will-change-transform transform-gpu ${className}`}
      >
        {/* Bioluminescent Spotlight Radial Glow */}
        <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent blur-xl" />

        <div style={{ transform: 'translateZ(35px)' }} className="relative z-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// Default Seed Data for Past Tests
const INITIAL_PAST_TESTS = [
  {
    id: 'past-1',
    testName: 'Full Syllabus Mock Test #1',
    provider: 'Allen',
    testType: 'Mains',
    date: '2026-06-15',
    totalPossibleMarks: 300,
    physics: { score: 68, maxScore: 100, syllabusTags: ['Mechanics', 'Kinematics', 'Optics'] },
    chemistry: { score: 72, maxScore: 100, syllabusTags: ['GOC', 'Mole Concept', 'Thermodynamics'] },
    math: { score: 54, maxScore: 100, syllabusTags: ['Calculus', 'Algebra', 'Trigonometry'] },
  },
  {
    id: 'past-2',
    testName: 'JEE Advanced Paper 1',
    provider: 'FIITJEE',
    testType: 'Advanced',
    date: '2026-06-28',
    totalPossibleMarks: 180,
    physics: { score: 48, maxScore: 60, syllabusTags: ['Rotational Motion', 'Electrostatics'] },
    chemistry: { score: 45, maxScore: 60, syllabusTags: ['Chemical Bonding', 'Equilibrium'] },
    math: { score: 38, maxScore: 60, syllabusTags: ['Definite Integrals', 'Vectors'] },
  },
  {
    id: 'past-3',
    testName: 'Score Booster Test #4',
    provider: 'MathonGo',
    testType: 'Mains',
    date: '2026-07-10',
    totalPossibleMarks: 300,
    physics: { score: 78, maxScore: 100, syllabusTags: ['Work Energy Power', 'Waves'] },
    chemistry: { score: 80, maxScore: 100, syllabusTags: ['Organic Mechanisms', 'Atomic Structure'] },
    math: { score: 62, maxScore: 100, syllabusTags: ['Coordinate Geometry', 'Limits'] },
  },
  {
    id: 'past-4',
    testName: 'All India Open Mock #2',
    provider: 'Allen',
    testType: 'Mains',
    date: '2026-07-22',
    totalPossibleMarks: 300,
    physics: { score: 82, maxScore: 100, syllabusTags: ['Laws of Motion', 'Gravitation'] },
    chemistry: { score: 85, maxScore: 100, syllabusTags: ['Solutions', 'Electrochemistry'] },
    math: { score: 70, maxScore: 100, syllabusTags: ['Matrices & Determinants', '3D Geometry'] },
  },
];

// Default Seed Data for Upcoming Tests
const INITIAL_UPCOMING_TESTS = [
  {
    id: 'up-1',
    testName: 'JEE Mains Final Sprint Mock #5',
    provider: 'Resonance',
    testType: 'Mains',
    date: '2026-07-25', // <= current date 2026-07-26 -> triggers "Log Results" prompt
    totalPossibleMarks: 300,
    physics: { score: null, maxScore: 100, syllabusTags: ['Mechanics', 'Modern Physics'] },
    chemistry: { score: null, maxScore: 100, syllabusTags: ['Thermodynamics', 'Coordination'] },
    math: { score: null, maxScore: 100, syllabusTags: ['Probability', 'Calculus'] },
  },
  {
    id: 'up-2',
    testName: 'JEE Advanced Grand Master Paper',
    provider: 'FIITJEE',
    testType: 'Advanced',
    date: '2026-08-05',
    totalPossibleMarks: 180,
    physics: { score: null, maxScore: 60, syllabusTags: ['Electromagnetism', 'Optics'] },
    chemistry: { score: null, maxScore: 60, syllabusTags: ['Organic Reactions', 'Solid State'] },
    math: { score: null, maxScore: 60, syllabusTags: ['Complex Numbers', 'Differential Eq'] },
  },
];

export function TestTracker() {
  const auth = useAuth();
  const user = auth?.user ?? null;

  // Local Storage Persistence - Purged default mock fallbacks to enforce [] for new users
  const [pastTests, setPastTests] = useState(() => {
    try {
      const saved = localStorage.getItem('rovelyn_past_tests_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load past tests from localStorage:', e);
    }
    return [];
  });

  const [upcomingTests, setUpcomingTests] = useState(() => {
    try {
      const saved = localStorage.getItem('rovelyn_upcoming_tests_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load upcoming tests from localStorage:', e);
    }
    return [];
  });

  // Fetch tests strictly scoped to user.id
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserTests = async () => {
      try {
        const { data, error } = await supabase
          .from('user_tests')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          const past = data.filter((t) => t.is_upcoming !== true);
          const upcoming = data.filter((t) => t.is_upcoming === true);
          setPastTests(past);
          setUpcomingTests(upcoming);
        }
      } catch (err) {
        console.error('Supabase fetch user_tests error:', err);
      }
    };

    fetchUserTests();
  }, [user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem('rovelyn_past_tests_v1', JSON.stringify(pastTests));
    } catch (e) {
      console.error('Failed to save past tests to localStorage:', e);
    }
  }, [pastTests]);

  useEffect(() => {
    try {
      localStorage.setItem('rovelyn_upcoming_tests_v1', JSON.stringify(upcomingTests));
    } catch (e) {
      console.error('Failed to save upcoming tests to localStorage:', e);
    }
  }, [upcomingTests]);

  // Chart Subject Filter State: 'Total' | 'Physics' | 'Chemistry' | 'Math'
  const [chartSubjectFilter, setChartSubjectFilter] = useState('Total');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [isUpcomingTarget, setIsUpcomingTarget] = useState(false);
  const [formData, setFormData] = useState({
    testName: '',
    provider: 'Allen',
    testType: 'Mains',
    date: new Date().toISOString().split('T')[0],
    totalPossibleMarks: 300,
    phyScore: '',
    phyMax: 100,
    phyTags: '',
    chemScore: '',
    chemMax: 100,
    chemTags: '',
    mathScore: '',
    mathMax: 100,
    mathTags: '',
  });

  // Calculate Metrics
  const analytics = useMemo(() => {
    if (pastTests.length === 0) {
      return {
        avgTotalScore: 0,
        avgTotalMax: 300,
        avgPhy: 0,
        avgChem: 0,
        avgMath: 0,
        totalTests: 0,
      };
    }

    let sumTotal = 0;
    let sumTotalMax = 0;
    let sumPhy = 0;
    let sumChem = 0;
    let sumMath = 0;

    pastTests.forEach((t) => {
      const phy = Number(t.physics?.score || 0);
      const chem = Number(t.chemistry?.score || 0);
      const math = Number(t.math?.score || 0);
      const total = phy + chem + math;

      sumTotal += total;
      sumTotalMax += Number(t.totalPossibleMarks || 300);
      sumPhy += phy;
      sumChem += chem;
      sumMath += math;
    });

    const count = pastTests.length;
    return {
      avgTotalScore: Math.round(sumTotal / count),
      avgTotalMax: Math.round(sumTotalMax / count),
      avgPhy: Math.round(sumPhy / count),
      avgChem: Math.round(sumChem / count),
      avgMath: Math.round(sumMath / count),
      totalTests: count,
    };
  }, [pastTests]);

  // Open Modal for New Test
  const handleOpenCreateModal = () => {
    setEditingTestId(null);
    setIsUpcomingTarget(false);
    setFormData({
      testName: '',
      provider: 'Allen',
      testType: 'Mains',
      date: new Date().toISOString().split('T')[0],
      totalPossibleMarks: 300,
      phyScore: '',
      phyMax: 100,
      phyTags: '',
      chemScore: '',
      chemMax: 100,
      chemTags: '',
      mathScore: '',
      mathMax: 100,
      mathTags: '',
    });
    setIsModalOpen(true);
  };

  // Open Modal for Editing an existing test (past or upcoming)
  const handleOpenEditModal = (test, isUpcoming = false) => {
    setEditingTestId(test.id);
    setIsUpcomingTarget(isUpcoming);
    setFormData({
      testName: test.testName || '',
      provider: test.provider || 'Allen',
      testType: test.testType || 'Mains',
      date: test.date || new Date().toISOString().split('T')[0],
      totalPossibleMarks: test.totalPossibleMarks || 300,
      phyScore: test.physics?.score !== null && test.physics?.score !== undefined ? String(test.physics.score) : '',
      phyMax: test.physics?.maxScore || 100,
      phyTags: (test.physics?.syllabusTags || []).join(', '),
      chemScore: test.chemistry?.score !== null && test.chemistry?.score !== undefined ? String(test.chemistry.score) : '',
      chemMax: test.chemistry?.maxScore || 100,
      chemTags: (test.chemistry?.syllabusTags || []).join(', '),
      mathScore: test.math?.score !== null && test.math?.score !== undefined ? String(test.math.score) : '',
      mathMax: test.math?.maxScore || 100,
      mathTags: (test.math?.syllabusTags || []).join(', '),
    });
    setIsModalOpen(true);
  };

  // Delete Upcoming Test
  const handleDeleteUpcoming = (testId) => {
    setUpcomingTests((prev) => prev.filter((t) => t.id !== testId));
  };

  // Delete Past Test
  const handleDeletePast = (testId) => {
    setPastTests((prev) => prev.filter((t) => t.id !== testId));
  };

  // Save Modal (Create or Edit)
  const handleSaveTest = (e) => {
    e.preventDefault();
    if (!formData.testName.trim()) return;

    const parseTags = (str) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const isPhyEntered = formData.phyScore !== '';
    const isChemEntered = formData.chemScore !== '';
    const isMathEntered = formData.mathScore !== '';

    const testObject = {
      id: editingTestId || `test-${Date.now()}`,
      testName: formData.testName.trim(),
      provider: formData.provider.trim() || 'Custom',
      testType: formData.testType,
      date: formData.date,
      totalPossibleMarks: Number(formData.totalPossibleMarks) || 300,
      physics: {
        score: isPhyEntered ? Number(formData.phyScore) : null,
        maxScore: Number(formData.phyMax) || 100,
        syllabusTags: parseTags(formData.phyTags),
      },
      chemistry: {
        score: isChemEntered ? Number(formData.chemScore) : null,
        maxScore: Number(formData.chemMax) || 100,
        syllabusTags: parseTags(formData.chemTags),
      },
      math: {
        score: isMathEntered ? Number(formData.mathScore) : null,
        maxScore: Number(formData.mathMax) || 100,
        syllabusTags: parseTags(formData.mathTags),
      },
    };

    if (isUpcomingTarget || (!isPhyEntered && !isChemEntered && !isMathEntered)) {
      // Keep/Save in Upcoming Tests
      if (editingTestId) {
        setUpcomingTests((prev) => prev.map((t) => (t.id === editingTestId ? testObject : t)));
      } else {
        setUpcomingTests((prev) => [...prev, testObject]);
      }
      if (editingTestId && pastTests.some((t) => t.id === editingTestId)) {
        setPastTests((prev) => prev.filter((t) => t.id !== editingTestId));
      }
    } else {
      // Scores entered -> Move to Past Tests
      if (upcomingTests.some((t) => t.id === editingTestId)) {
        setUpcomingTests((prev) => prev.filter((t) => t.id !== editingTestId));
      }
      if (editingTestId && pastTests.some((t) => t.id === editingTestId)) {
        setPastTests((prev) => prev.map((t) => (t.id === editingTestId ? testObject : t)));
      } else {
        setPastTests((prev) => [...prev, testObject].sort((a, b) => new Date(a.date) - new Date(b.date)));
      }
    }

    setIsModalOpen(false);
  };

  const sortedTests = useMemo(() => {
    return [...pastTests].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [pastTests]);

  const currentDateStr = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full space-y-6 bg-transparent mb-28 sm:mb-32">
      {/* 1. ROUTE & HEADER RESTRUCTURE */}
      <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-white/5 mb-8">
        {/* Ambient backlighting glow */}
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-indigo-600/15 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-[0.3em] uppercase text-indigo-400/90 mb-2">
            <div className="p-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span>TEST PERFORMANCE / TEST ANALYTICS & TRACKER</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300 drop-shadow-[0_4px_20px_rgba(99,102,241,0.25)]">
            Test Analytics & Tracker
          </h1>
          <p className="text-sm text-slate-400/80 font-light tracking-normal max-w-xl leading-relaxed mt-1">
            Log mock scores with subject breakdowns, track upcoming test schedules, and analyze yield trajectory.
          </p>
        </div>

        <div className="relative z-10">
          <MagneticButton strength={0.25} onClick={handleOpenCreateModal}>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-mono font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Log Test Score</span>
            </button>
          </MagneticButton>
        </div>
      </div>

      {/* 3. TOP ANALYTICS 3D CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Overall Average Score */}
        <ThreeDTiltCard className="flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Overall Average Score</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-slate-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] font-mono">
                {analytics.avgTotalScore}
              </span>
              <span className="text-xs font-mono text-zinc-400">/ {analytics.avgTotalMax}</span>
            </div>
            <p className="text-xs font-mono text-indigo-300 mt-1.5">
              ~{analytics.avgTotalMax > 0 ? Math.round((analytics.avgTotalScore / analytics.avgTotalMax) * 100) : 0}% Average Score Ratio
            </p>
          </div>
        </ThreeDTiltCard>

        {/* Metric 2: Subject Yield Breakdown */}
        <ThreeDTiltCard className="flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Subject Yield Breakdown</span>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <span className="text-[10px] text-cyan-400 font-bold block mb-0.5">PHY</span>
              <span className="text-xl font-extrabold text-white">{analytics.avgPhy}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <span className="text-[10px] text-violet-400 font-bold block mb-0.5">CHEM</span>
              <span className="text-xl font-extrabold text-white">{analytics.avgChem}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <span className="text-[10px] text-amber-400 font-bold block mb-0.5">MATH</span>
              <span className="text-xl font-extrabold text-white">{analytics.avgMath}</span>
            </div>
          </div>
        </ThreeDTiltCard>

        {/* Metric 3: Total Tests Logged */}
        <ThreeDTiltCard className="flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Total Mock Tests Logged</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-4xl font-extrabold tracking-tight text-slate-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] font-mono">
              {analytics.totalTests}
            </span>
            <p className="text-xs font-mono text-zinc-400 mt-1.5">
              Active test trajectory tracking active
            </p>
          </div>
        </ThreeDTiltCard>
      </div>

      {/* DYNAMIC LINE CHART SECTION WITH 3D TILT PHYSICS */}
      <ThreeDTiltCard className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="text-base font-light text-white font-sans flex items-center gap-2">
              <span>Performance Yield Trajectory</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </h3>
            <p className="text-xs font-mono text-zinc-400">Interactive test score progression over time</p>
          </div>

          {/* Filter Pills */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md p-1 rounded-full flex gap-1 font-mono text-xs">
            {['Total', 'Physics', 'Chemistry', 'Math'].map((subj) => (
              <button
                key={subj}
                onClick={() => setChartSubjectFilter(subj)}
                className={`transition-all rounded-full px-4 py-1 text-xs font-semibold cursor-pointer ${
                  chartSubjectFilter === subj
                    ? 'bg-indigo-600/40 border border-indigo-400/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                    : 'text-zinc-400 hover:text-white px-3 py-1'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Interactive Line Graph */}
        <div className="relative h-64 w-full pt-4">
          {sortedTests.length < 2 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-zinc-500">
              Log at least 2 mock tests to display the performance trajectory curve.
            </div>
          ) : (
            <div className="relative h-full w-full">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 1000 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="glowAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="neonLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[0, 60, 120, 180, 240].map((yVal, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={yVal}
                    x2="1000"
                    y2={yVal}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Compute Path Coordinates */}
                {(() => {
                  const points = sortedTests.map((t, idx) => {
                    const x = (idx / (sortedTests.length - 1)) * 960 + 20;

                    let scoreVal = 0;
                    let maxVal = t.totalPossibleMarks || 300;

                    if (chartSubjectFilter === 'Total') {
                      scoreVal = (t.physics?.score || 0) + (t.chemistry?.score || 0) + (t.math?.score || 0);
                    } else if (chartSubjectFilter === 'Physics') {
                      scoreVal = t.physics?.score || 0;
                      maxVal = t.physics?.maxScore || 100;
                    } else if (chartSubjectFilter === 'Chemistry') {
                      scoreVal = t.chemistry?.score || 0;
                      maxVal = t.chemistry?.maxScore || 100;
                    } else if (chartSubjectFilter === 'Math') {
                      scoreVal = t.math?.score || 0;
                      maxVal = t.math?.maxScore || 100;
                    }

                    const ratio = maxVal > 0 ? scoreVal / maxVal : 0;
                    const y = 220 - ratio * 180;
                    return { x, y, test: t, scoreVal, maxVal };
                  });

                  let pathD = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    const controlX1 = p1.x + (p2.x - p1.x) / 2;
                    const controlY1 = p1.y;
                    const controlX2 = p1.x + (p2.x - p1.x) / 2;
                    const controlY2 = p2.y;
                    pathD += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${p2.x} ${p2.y}`;
                  }

                  const areaD = `${pathD} L ${points[points.length - 1].x} 230 L ${points[0].x} 230 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#glowAreaGradient)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="url(#neonLineGradient)"
                        strokeWidth="3"
                        style={{ filter: 'drop-shadow(0 0 10px rgba(129, 140, 248, 0.6))' }}
                      />
                      {points.map((pt, idx) => (
                        <g key={idx} className="cursor-pointer">
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="6"
                            fill="#0d0d16"
                            stroke="#c084fc"
                            strokeWidth="3"
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            className="transition-all hover:r-8 hover:stroke-white"
                          />
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>

              {/* Hover Tooltip */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none z-50 bg-[#0d0d16]/95 border border-white/15 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-zinc-200 space-y-1"
                  style={{
                    left: `${Math.min(80, Math.max(10, (hoveredPoint.x / 1000) * 100))}%`,
                    top: `${Math.max(0, hoveredPoint.y - 80)}px`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1">
                    <span className="font-bold text-white">{hoveredPoint.test.testName}</span>
                    <span className="text-[10px] text-indigo-300">{hoveredPoint.test.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span>Score: <strong className="text-white">{hoveredPoint.scoreVal} / {hoveredPoint.maxVal}</strong></span>
                    <span className="text-zinc-500">•</span>
                    <span>Provider: <strong className="text-zinc-300">{hoveredPoint.test.provider}</strong></span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-2 pt-0.5">
                    <span className="text-cyan-300">P: {hoveredPoint.test.physics?.score || 0}</span>
                    <span>|</span>
                    <span className="text-purple-300">C: {hoveredPoint.test.chemistry?.score || 0}</span>
                    <span>|</span>
                    <span className="text-rose-300">M: {hoveredPoint.test.math?.score || 0}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ThreeDTiltCard>

      {/* 4. UPCOMING TESTS & EXPIRED LOG PROMPT (WITH EDIT & DELETE ACTIONS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Upcoming Test Schedule & Log Prompts
          </h3>
          <span className="text-xs font-mono text-zinc-500">{upcomingTests.length} Scheduled</span>
        </div>

        {upcomingTests.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center text-slate-500 font-mono text-xs">
            No benchmark tests recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            <AnimatePresence>
              {upcomingTests.map((t) => {
                const isPastOrToday = t.date <= currentDateStr;

                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                    className="bg-[#0a0a12]/60 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[10px] uppercase tracking-wider text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold">
                          {t.testType} • {t.provider}
                        </span>

                        {/* Top Right Action Buttons (Pencil Edit & Trash Delete) + Date */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            {t.date}
                          </span>

                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleOpenEditModal(t, true)}
                              title="Edit Upcoming Test"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUpcoming(t.id)}
                              title="Delete Upcoming Test"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <h4 className="text-base font-normal text-white font-sans">{t.testName}</h4>
                    </div>

                    {/* Standardized Subject Syllabus Badges */}
                    <div className="space-y-1.5 text-[11px] border-t border-white/[0.06] pt-3">
                      {t.physics?.syllabusTags?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-cyan-400 font-bold text-[10px]">PHY:</span>
                          {t.physics.syllabusTags.map((tag, idx) => (
                            <span key={idx} className="bg-cyan-950/30 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded text-[10px]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {t.chemistry?.syllabusTags?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-purple-400 font-bold text-[10px]">CHEM:</span>
                          {t.chemistry.syllabusTags.map((tag, idx) => (
                            <span key={idx} className="bg-purple-950/30 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded text-[10px]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {t.math?.syllabusTags?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-rose-400 font-bold text-[10px]">MATH:</span>
                          {t.math.syllabusTags.map((tag, idx) => (
                            <span key={idx} className="bg-rose-950/30 text-rose-300 border border-rose-800/40 px-2 py-0.5 rounded text-[10px]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expired Log Prompt Action */}
                    {isPastOrToday && (
                      <div className="pt-2">
                        <button
                          onClick={() => handleOpenEditModal(t, true)}
                          className="w-full py-2 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all animate-pulse"
                        >
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>Log Results Now</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 6. PAST TEST HISTORY LIST (WITH EDIT & DELETE ACTIONS) */}
      <div className="space-y-4 font-mono">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Past Test History & Records
          </h3>
          <span className="text-xs text-zinc-500">{pastTests.length} Records</span>
        </div>

        {pastTests.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center text-slate-500 font-mono text-xs">
            No benchmark tests recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sortedTests.map((test) => {
                const phy = test.physics?.score || 0;
                const chem = test.chemistry?.score || 0;
                const math = test.math?.score || 0;
                const total = phy + chem + math;
                const max = test.totalPossibleMarks || 300;
                const pct = max > 0 ? Math.round((total / max) * 100) : 0;

                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    className="bg-[#0a0a12]/60 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    {/* Left: Test Details */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                          {test.testType}
                        </span>
                        <span className="text-xs text-zinc-400">{test.provider}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-xs text-zinc-400">{test.date}</span>
                      </div>

                      <h4 className="text-lg font-normal text-white font-sans group-hover:text-indigo-200 transition-colors truncate">
                        {test.testName}
                      </h4>

                      {/* Standardized Subject Syllabus Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        {(test.physics?.syllabusTags || []).map((tag, idx) => (
                          <span key={`p-${idx}`} className="bg-cyan-950/30 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                        {(test.chemistry?.syllabusTags || []).map((tag, idx) => (
                          <span key={`c-${idx}`} className="bg-purple-950/30 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                        {(test.math?.syllabusTags || []).map((tag, idx) => (
                          <span key={`m-${idx}`} className="bg-rose-950/30 text-rose-300 border border-rose-800/40 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Middle: Subject Score Pills */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-center min-w-[70px]">
                        <span className="text-[9px] text-cyan-400 block font-bold">PHY</span>
                        <span className="text-sm font-bold text-white">{phy}/{test.physics?.maxScore || 100}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-violet-500/5 border border-violet-500/20 text-center min-w-[70px]">
                        <span className="text-[9px] text-violet-400 block font-bold">CHEM</span>
                        <span className="text-sm font-bold text-white">{chem}/{test.chemistry?.maxScore || 100}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center min-w-[70px]">
                        <span className="text-[9px] text-rose-400 block font-bold">MATH</span>
                        <span className="text-sm font-bold text-white">{math}/{test.math?.maxScore || 100}</span>
                      </div>
                    </div>

                    {/* Right: Total Badge & Actions */}
                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                      <div className="text-right">
                        <span className="text-2xl font-light text-white font-sans block">{total} <span className="text-xs text-zinc-500 font-mono">/ {max}</span></span>
                        <span className="text-[10px] font-bold text-indigo-300">{pct}% Overall</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(test)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
                          title="Edit Test Score"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePast(test.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
                          title="Delete Test Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 5. FULL CREATE & EDIT MODAL (+ Log / Edit Test) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#0a0a12]/95 border border-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl font-mono space-y-6 z-50 my-8 max-h-[90vh] overflow-y-auto scrollbar-none"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-light text-white font-sans">
                    {editingTestId ? (isUpcomingTarget ? 'Edit Scheduled Test' : 'Edit Test Record') : 'Log New Mock Test'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTest} className="space-y-6 text-xs">
                {/* Meta Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400">Test Title / Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Full Syllabus Mock Test #3"
                      value={formData.testName}
                      onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400">Provider / Coaching</label>
                    <input
                      type="text"
                      placeholder="e.g. Allen, FIITJEE, Reso, MathonGo"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400">Test Format Type</label>
                    <select
                      value={formData.testType}
                      onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-indigo-300 focus:outline-none focus:border-indigo-400"
                    >
                      <option value="Mains">JEE Mains (300 Marks)</option>
                      <option value="Advanced">JEE Advanced (180 Marks)</option>
                      <option value="Custom">Custom / Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400">Test Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400">Total Possible Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalPossibleMarks}
                    onChange={(e) => setFormData({ ...formData, totalPossibleMarks: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Subject-Wise Input Sections */}
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <h4 className="text-zinc-300 font-semibold uppercase tracking-wider text-[11px]">Subject Breakdown & Scores</h4>

                  {/* Physics */}
                  <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
                    <span className="text-cyan-400 font-bold text-xs block">PHYSICS</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Score Obtained</label>
                        <input
                          type="number"
                          placeholder="e.g. 75"
                          value={formData.phyScore}
                          onChange={(e) => setFormData({ ...formData, phyScore: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Subject Max Marks</label>
                        <input
                          type="number"
                          value={formData.phyMax}
                          onChange={(e) => setFormData({ ...formData, phyMax: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Syllabus Topics (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Mechanics, Optics, Waves"
                        value={formData.phyTags}
                        onChange={(e) => setFormData({ ...formData, phyTags: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Chemistry */}
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                    <span className="text-purple-400 font-bold text-xs block">CHEMISTRY</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Score Obtained</label>
                        <input
                          type="number"
                          placeholder="e.g. 80"
                          value={formData.chemScore}
                          onChange={(e) => setFormData({ ...formData, chemScore: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Subject Max Marks</label>
                        <input
                          type="number"
                          value={formData.chemMax}
                          onChange={(e) => setFormData({ ...formData, chemMax: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Syllabus Topics (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Organic, Thermodynamics, Mole Concept"
                        value={formData.chemTags}
                        onChange={(e) => setFormData({ ...formData, chemTags: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Mathematics */}
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                    <span className="text-rose-400 font-bold text-xs block">MATHEMATICS</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Score Obtained</label>
                        <input
                          type="number"
                          placeholder="e.g. 60"
                          value={formData.mathScore}
                          onChange={(e) => setFormData({ ...formData, mathScore: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Subject Max Marks</label>
                        <input
                          type="number"
                          value={formData.mathMax}
                          onChange={(e) => setFormData({ ...formData, mathMax: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Syllabus Topics (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Calculus, Vectors, Coordinate Geometry"
                        value={formData.mathTags}
                        onChange={(e) => setFormData({ ...formData, mathTags: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"
                  >
                    {editingTestId ? 'Save Changes' : 'Save Test'}
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

export default TestTracker;
