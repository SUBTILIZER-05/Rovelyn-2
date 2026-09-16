import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Timer, CheckSquare, FileText, X } from 'lucide-react';
import {
  IconHome,
  IconClipboardList,
  IconChartDots,
  IconClock,
  IconChecklist
} from '@tabler/icons-react';
import { Header } from './components/Header';
import StudyDashboard from './components/dashboard/StudyDashboard';
import { TestTracker } from './components/dashboard/TestTracker';
import { AnalyticsView } from './views/StatsView';
import { FocusTimer } from './views/TimerView';
import { TaskPlanner } from './views/TasksView';
import { FloatingDock } from './components/ui/floating-dock';
import { useAuth } from './context/AuthContext';
import { useAppData } from './context/AppDataContext';
import { AuthPortal } from './components/Auth/AuthPortal';
import { useChapters } from './context/ChapterContext';
import { BrandSplashScreen } from './components/ui/BrandSplashScreen';

export function App() {
  const { user, loading: authLoading } = useAuth();
  const { loading: appDataLoading } = useAppData();
  const { chapters } = useChapters();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tests, setTests] = useState([]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navigationTarget, setNavigationTarget] = useState(null);

  const isHydrated = !authLoading && (!user || !appDataLoading);

  // Deep-navigation chapter click handler
  const handleSelectChapter = (chapter) => {
    if (!chapter) return;

    const rawClass = chapter.classLevel || chapter.rawChapterData?.class_level || chapter.rawChapterData?.classLevel || '11';
    const normClass = String(rawClass).includes('12') ? 'C-12' : 'C-11';
    const normSubj = (chapter.subject || '').toLowerCase();

    let subjectId = 'phy-11';
    if (normSubj.includes('phys')) {
      subjectId = normClass === 'C-12' ? 'phy-12' : 'phy-11';
    } else if (normSubj.includes('chem')) {
      subjectId = normClass === 'C-12' ? 'chem-12' : 'chem-11';
    } else if (normSubj.includes('math')) {
      subjectId = normClass === 'C-12' ? 'math-12' : 'math-11';
    }

    setNavigationTarget({
      tab: 'dashboard',
      classLevel: normClass,
      subjectId: subjectId,
      chapterId: String(chapter.id),
      timestamp: Date.now(),
    });

    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Shortcut key handling (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <IconHome className="h-full w-full text-slate-300" />,
      onClick: () => setActiveTab("dashboard")
    },
    {
      id: "tests",
      title: "Test Tracker",
      icon: <IconClipboardList className="h-full w-full text-slate-300" />,
      onClick: () => setActiveTab("tests")
    },
    {
      id: "analytics",
      title: "Analytics & Stats",
      icon: <IconChartDots className="h-full w-full text-slate-300" />,
      onClick: () => setActiveTab("analytics")
    },
    {
      id: "timer",
      title: "Focus Session",
      icon: <IconClock className="h-full w-full text-slate-300" />,
      onClick: () => setActiveTab("timer")
    },
    {
      id: "tasks",
      title: "Daily Tasks",
      icon: <IconChecklist className="h-full w-full text-slate-300" />,
      onClick: () => setActiveTab("tasks")
    }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <StudyDashboard tests={tests} onNavigate={handleTabChange} navigationTarget={navigationTarget} />;
      case "tests":
        return <TestTracker tests={tests} setTests={setTests} />;
      case "analytics":
        return <AnalyticsView tests={tests} />;
      case "timer":
        return <FocusTimer />;
      case "tasks":
        return <TaskPlanner />;
      default:
        return <StudyDashboard tests={tests} onNavigate={handleTabChange} navigationTarget={navigationTarget} />;
    }
  };

  const commandModules = [
    { label: 'Go to Workspace Dashboard', tab: 'dashboard', icon: BookOpen, keywords: 'dashboard main home workspace' },
    { label: 'Open Test Tracker', tab: 'tests', icon: FileText, keywords: 'tests test tracker exam mock scores' },
    { label: 'Open Analytics & Stats', tab: 'analytics', icon: CheckSquare, keywords: 'analytics stats metrics performance study hours' },
    { label: 'Open Focus Session', tab: 'timer', icon: Timer, keywords: 'focus session timer pomodoro stopwatch' },
    { label: 'View Daily Tasks', tab: 'tasks', icon: CheckSquare, keywords: 'view daily tasks planner target objectives dpp' },
  ];

  const filteredCommandItems = commandModules.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      item.label.toLowerCase().includes(query) ||
      (item.keywords && item.keywords.toLowerCase().includes(query))
    );
  });

  const searchableChaptersInModal = useMemo(() => {
    if (!Array.isArray(chapters) || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    return chapters
      .map((ch) => {
        const title = ch.title || ch.name || ch.chapterName || ch.chapter_name || ch.chapter || '';
        const name = typeof title === 'string' ? title.trim() : '';

        if (!name || name.toLowerCase() === 'untitled chapter' || name.toLowerCase() === 'untitled') {
          return null;
        }

        const rawClass = ch.class_level || ch.classLevel || 'C-11';
        const classLevel = String(rawClass).includes('12') ? '12' : '11';
        const subject = ch.subject || 'Physics';

        return {
          id: ch.id,
          name: name,
          subject: subject,
          classLevel: classLevel,
          rawChapterData: ch,
        };
      })
      .filter(Boolean)
      .filter((ch) => {
        const nameMatch = ch.name.toLowerCase().includes(q);
        const subjectMatch = ch.subject.toLowerCase().includes(q);
        return nameMatch || subjectMatch;
      });
  }, [chapters, searchQuery]);

  return (
    <>
      {showSplash && (
        <BrandSplashScreen
          isHydrated={isHydrated}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {!authLoading && !user ? (
        <AuthPortal />
      ) : (
        <div className="relative min-h-screen w-full bg-[#030308] text-slate-100 overflow-x-hidden antialiased selection:bg-purple-500/30">
      {/* PERSISTENT AMBIENT OBSIDIAN GLOW - DO NOT REMOVE */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.25), rgba(255, 255, 255, 0)), radial-gradient(circle at 50% 50%, rgba(30, 27, 75, 0.35), transparent 70%), radial-gradient(circle at 80% 80%, rgba(15, 23, 42, 0.4), transparent 50%)',
          backgroundColor: '#030308'
        }}
      />

      {/* Top Navigation Header */}
      <Header
        onSearchClick={() => setIsCommandOpen(true)}
        onSelectChapter={handleSelectChapter}
      />

      {/* Main Workspace Area with Proper Top & Bottom Clearance */}
      <main className="relative z-10 w-full max-w-7xl mx-auto pt-6 sm:pt-8 pb-28 md:pb-32 px-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Dock Container Wrapper */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <FloatingDock items={navItems} />
        </div>
      </div>

      {/* Command Palette Modal (⌘K) */}
      <AnimatePresence>
        {isCommandOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCommandOpen(false);
                setSearchQuery('');
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg rounded-2xl bg-[#080810]/90 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden z-50 p-4 space-y-3 font-mono"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5 flex-1">
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type a command or search modules..."
                    className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                  />
                </div>
                <button
                  onClick={() => {
                    setIsCommandOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Command Options List */}
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                <span className="text-[10px] uppercase text-zinc-500 px-2 font-mono tracking-widest block mb-1">
                  Active Modules
                </span>
                {filteredCommandItems.length === 0 && searchableChaptersInModal.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                    No matching items found
                  </div>
                ) : (
                  filteredCommandItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => {
                          handleTabChange(item.tab);
                          setIsCommandOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-mono text-zinc-300 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">Jump</span>
                      </button>
                    );
                  })
                )}

                {searchableChaptersInModal.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                    <span className="text-[10px] uppercase text-zinc-500 px-2 font-mono tracking-widest block mb-1">
                      Chapters ({searchableChaptersInModal.length})
                    </span>
                    {searchableChaptersInModal.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => {
                          handleSelectChapter(ch);
                          setIsCommandOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-mono text-zinc-300 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="truncate">{ch.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                            {ch.subject}
                          </span>
                          <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                            Class {ch.classLevel}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )}
</>
  );
}

export default App;
