import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { ensureCoreSubtasks, DEFAULT_SUBTASKS } from '../lib/syllabusUtils';
import {
  subscribeSyncStatus,
  flushSyncQueue,
  enqueueMutation,
  getIsOnline,
} from '../lib/syncManager';


const AppDataContext = createContext({});

const DEFAULT_CONTENT = {
  chapters: [],
  pastTests: [],
  upcomingTests: [],
  sessions: [],
  tasks: [],
  weeklyTarget: { mode: 'hours', targetHours: 25, targetLevel: 5 },
};

// Helper to normalize class level representation (e.g., 'C-11', '11', 'Class 11' => '11')
const normalizeClassLevelStr = (cl) => {
  if (!cl) return '';
  const str = String(cl).trim().toUpperCase();
  if (str.includes('11')) return '11';
  if (str.includes('12')) return '12';
  return str;
};

// Local storage key helpers
const getLocalStorageKeys = (userId) => ({
  TASKS: 'rovelyn_tasks_v1',
  UPCOMING_TESTS: 'rovelyn_upcoming_tests_v1',
  PAST_TESTS: 'rovelyn_past_tests_v1',
  V4: 'rovelyn_v4',
  CHAPTERS_USER: userId ? `rovelyn_chapters_v2_${userId}` : 'rovelyn_chapters_v2',
  CHAPTERS_GENERIC: 'rovelyn_chapters_v2',
});

// Helper to construct v4_data structure from chapters array
const buildV4Data = (chaptersList) => {
  const c11 = (chaptersList || []).filter((ch) => {
    const cl = normalizeClassLevelStr(ch.class_level || ch.classLevel);
    return cl === '11' || cl === '';
  });
  const c12 = (chaptersList || []).filter((ch) => {
    const cl = normalizeClassLevelStr(ch.class_level || ch.classLevel);
    return cl === '12';
  });
  return {
    classes: {
      "11": { chapters: c11 },
      "12": { chapters: c12 },
    },
  };
};

// Save mirrored state to localStorage
const saveToLocalStorage = (data, userId, rawContent = null) => {
  try {
    const keys = getLocalStorageKeys(userId);
    if (data.tasks) {
      localStorage.setItem(keys.TASKS, JSON.stringify(data.tasks));
    }
    if (data.upcomingTests) {
      localStorage.setItem(keys.UPCOMING_TESTS, JSON.stringify(data.upcomingTests));
    }
    if (data.pastTests) {
      localStorage.setItem(keys.PAST_TESTS, JSON.stringify(data.pastTests));
    }
    const v4Payload = rawContent?.v4_data || rawContent?.v4Data || buildV4Data(data.chapters || []);
    localStorage.setItem(keys.V4, JSON.stringify(v4Payload));

    if (data.chapters) {
      localStorage.setItem(keys.CHAPTERS_USER, JSON.stringify(data.chapters));
      localStorage.setItem(keys.CHAPTERS_GENERIC, JSON.stringify(data.chapters));
    }
    if (data.weeklyTarget) {
      localStorage.setItem('rovelyn_weekly_target', JSON.stringify(data.weeklyTarget));
    }
  } catch (e) {
    console.warn('Failed to mirror to localStorage:', e);
  }
};

// Helper to resolve chapter title across all schema variations
const getChapterTitleStr = (ch) => {
  if (!ch) return 'Untitled Chapter';
  const rawTitle = ch.title || ch.name || ch.chapterName || ch.chapter_name || ch.chapter || ch.label;
  if (typeof rawTitle === 'string' && rawTitle.trim()) {
    return rawTitle.trim();
  }
  return 'Untitled Chapter';
};

// Helper to normalize Chapter object
const normalizeChapterObj = (ch, userId, fallbackClassLevel) => {
  const classLvl = ch.class_level || ch.classLevel || fallbackClassLevel || 'C-11';
  const title = getChapterTitleStr(ch);
  const chapterId = ch.id ? String(ch.id) : `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    ...ch,
    id: chapterId,
    user_id: userId || ch.user_id,
    title: title,
    name: ch.name || title,
    chapterName: ch.chapterName || title,
    chapter_name: ch.chapter_name || title,
    status: ch.status || 'pending',
    subtasks: ensureCoreSubtasks(ch.subtasks),
    moduleQuestions: ch.moduleQuestions || ch.module_questions || { total: 50, completed: 0 },
    workbookQuestions: ch.workbookQuestions || ch.workbook_questions || { total: 30, completed: 0 },
    class_level: classLvl,
  };
};

// Unpack chapters from both content.chapters and content.v4_data / content.v4Data
const extractChaptersFromContent = (content, userId) => {
  if (!content) return [];
  const chapterMap = new Map();

  // 1. Unpack content.chapters if present
  if (Array.isArray(content.chapters)) {
    content.chapters.forEach((ch) => {
      const norm = normalizeChapterObj(ch, userId);
      chapterMap.set(norm.id, norm);
    });
  }

  // 2. Unpack content.v4_data or content.v4Data hierarchy
  const v4 = content.v4_data || content.v4Data;
  if (v4 && v4.classes && typeof v4.classes === 'object') {
    Object.keys(v4.classes).forEach((clsKey) => {
      const classObj = v4.classes[clsKey];
      const classLevel = clsKey.includes('12') ? 'C-12' : 'C-11';

      if (classObj) {
        if (Array.isArray(classObj.chapters)) {
          classObj.chapters.forEach((ch) => {
            const norm = normalizeChapterObj(ch, userId, classLevel);
            if (!chapterMap.has(norm.id)) {
              chapterMap.set(norm.id, norm);
            }
          });
        }
        Object.keys(classObj).forEach((subKey) => {
          if (subKey !== 'chapters' && classObj[subKey]) {
            const item = classObj[subKey];
            if (Array.isArray(item)) {
              item.forEach((ch) => {
                const norm = normalizeChapterObj(ch, userId, classLevel);
                if (!chapterMap.has(norm.id)) {
                  chapterMap.set(norm.id, norm);
                }
              });
            } else if (item && Array.isArray(item.chapters)) {
              item.chapters.forEach((ch) => {
                const norm = normalizeChapterObj(ch, userId, classLevel);
                if (!chapterMap.has(norm.id)) {
                  chapterMap.set(norm.id, norm);
                }
              });
            }
          }
        });
      }
    });
  }

  return Array.from(chapterMap.values());
};

// Load fallback state from localStorage
const loadFromLocalStorage = (userId) => {
  try {
    const keys = getLocalStorageKeys(userId);
    const tasksStr = localStorage.getItem(keys.TASKS);
    const upcomingStr = localStorage.getItem(keys.UPCOMING_TESTS);
    const pastStr = localStorage.getItem(keys.PAST_TESTS);
    const v4Str = localStorage.getItem(keys.V4);
    const chaptersUserStr = localStorage.getItem(keys.CHAPTERS_USER) || localStorage.getItem(keys.CHAPTERS_GENERIC);

    const tasks = tasksStr ? JSON.parse(tasksStr) : [];
    const upcomingTests = upcomingStr ? JSON.parse(upcomingStr) : [];
    const pastTests = pastStr ? JSON.parse(pastStr) : [];
    const v4Data = v4Str ? JSON.parse(v4Str) : null;
    const chapters = chaptersUserStr ? JSON.parse(chaptersUserStr) : [];

    const extractedChapters = extractChaptersFromContent({ chapters, v4_data: v4Data }, userId);
    const targetStr = localStorage.getItem('rovelyn_weekly_target');
    const weeklyTarget = targetStr ? JSON.parse(targetStr) : { mode: 'hours', targetHours: 25, targetLevel: 5 };

    return {
      tasks: Array.isArray(tasks) ? tasks : [],
      upcomingTests: Array.isArray(upcomingTests) ? upcomingTests : [],
      pastTests: Array.isArray(pastTests) ? pastTests : [],
      chapters: extractedChapters,
      sessions: [],
      weeklyTarget,
    };
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
    return null;
  }
};

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [appData, setAppData] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  // Ref to track whether initial data fetch for current user has completed
  const isInitialLoaded = useRef(false);
  // Ref to prevent initial fetch data setting from triggering immediate upsert back
  const isSyncing = useRef(false);
  const debounceTimer = useRef(null);

  const normalizeChapter = useCallback(
    (ch) => normalizeChapterObj(ch, user?.id),
    [user?.id]
  );

  // Fetch user content from Supabase `user_data` table on auth state / user changes
  const fetchUserData = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    if (!user?.id) {
      setAppData(DEFAULT_CONTENT);
      isInitialLoaded.current = false;
      setLoading(false);
      return;
    }

    setLoading(true);
    isInitialLoaded.current = false;

    try {
      // 1. Use .maybeSingle() instead of .single() to safely handle 0 rows or 406
      const { data, error } = await supabase
        .from('user_data')
        .select('content')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Supabase fetch user_data notice:', error.message || error);
        const lsData = loadFromLocalStorage(user.id);
        setAppData(lsData || DEFAULT_CONTENT);
      } else if (data?.content) {
        const content = data.content;
        const fetchedTasks = Array.isArray(content.tasks) ? content.tasks : [];
        const fetchedPastTests = Array.isArray(content.past_tests)
          ? content.past_tests
          : Array.isArray(content.pastTests)
          ? content.pastTests
          : [];
        const fetchedUpcomingTests = Array.isArray(content.upcoming_tests)
          ? content.upcoming_tests
          : Array.isArray(content.upcomingTests)
          ? content.upcomingTests
          : [];
        const fetchedSessions = Array.isArray(content.sessions) ? content.sessions : [];
        const fetchedChapters = extractChaptersFromContent(content, user.id);
        const fetchedWeeklyTarget = content.weekly_target || content.weeklyTarget || { mode: 'hours', targetHours: 25, targetLevel: 5 };

        const newAppData = {
          chapters: fetchedChapters,
          pastTests: fetchedPastTests,
          upcomingTests: fetchedUpcomingTests,
          sessions: fetchedSessions,
          tasks: fetchedTasks,
          weeklyTarget: fetchedWeeklyTarget,
        };

        setAppData(newAppData);
        // Mirror fetched objects into localStorage
        saveToLocalStorage(newAppData, user.id, content);
      } else {
        // No row in Supabase yet -> Check localStorage as fallback
        const lsData = loadFromLocalStorage(user.id);
        if (
          lsData &&
          (lsData.chapters.length > 0 ||
            lsData.tasks.length > 0 ||
            lsData.pastTests.length > 0 ||
            lsData.upcomingTests.length > 0)
        ) {
          setAppData(lsData);
        } else {
          setAppData(DEFAULT_CONTENT);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user_data from Supabase:', err);
      const lsData = loadFromLocalStorage(user.id);
      setAppData(lsData || DEFAULT_CONTENT);
    } finally {
      setLoading(false);
      // Small delay before enabling auto-save to allow state initialization to settle
      setTimeout(() => {
        isInitialLoaded.current = true;
      }, 150);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const [syncState, setSyncState] = useState({
    status: getIsOnline() ? 'online' : 'offline',
    isOnline: getIsOnline(),
    pendingCount: 0,
    isFlushing: false,
  });

  // Subscribe to offline/online sync status and flush queue on reconnection
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((info) => {
      setSyncState(info);
      if (info.isOnline && info.pendingCount > 0 && user?.id) {
        flushSyncQueue(supabase);
      }
    });

    if (getIsOnline() && user?.id) {
      flushSyncQueue(supabase);
    }

    return unsubscribe;
  }, [user?.id]);

  // Debounced auto-sync with local persistence & offline queue fallback
  useEffect(() => {
    // STRICT AUTO-SAVE GUARD: Do NOT trigger upsert if fetch in progress, session unresolved, or initial load incomplete
    if (!user?.id || !isInitialLoaded.current || loading) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Mirror current state to localStorage immediately (Optimistic Local Execution)
    saveToLocalStorage(appData, user.id);

    debounceTimer.current = setTimeout(async () => {
      // Additional guard check before initiating remote upsert
      if (!user?.id || !isInitialLoaded.current) return;

      const v4_data = buildV4Data(appData.chapters);

      const payload = {
        user_id: user.id,
        content: {
          tasks: appData.tasks,
          upcoming_tests: appData.upcomingTests,
          past_tests: appData.pastTests,
          v4_data: v4_data,
          chapters: appData.chapters,
          sessions: appData.sessions,
          weekly_target: appData.weeklyTarget,
        },
        updated_at: new Date().toISOString(),
      };

      if (!getIsOnline()) {
        enqueueMutation('user_data', 'UPSERT', payload);
        return;
      }

      try {
        isSyncing.current = true;
        const { error } = await supabase
          .from('user_data')
          .upsert(payload, { onConflict: 'user_id' });

        if (error) {
          console.warn('Supabase user_data sync notice (enqueueing to offline queue):', error.message || error);
          enqueueMutation('user_data', 'UPSERT', payload);
        }
      } catch (err) {
        console.warn('Network exception during user_data sync (enqueueing to offline queue):', err);
        enqueueMutation('user_data', 'UPSERT', payload);
      } finally {
        isSyncing.current = false;
      }
    }, 800);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [appData, user?.id, loading]);


  // --- CHAPTER ACTIONS ---
  const setChapters = useCallback((updater) => {
    setAppData((prev) => ({
      ...prev,
      chapters: typeof updater === 'function' ? updater(prev.chapters) : updater,
    }));
  }, []);

  const addChapter = useCallback(({ title, subject, classLevel = 'C-11', status = 'pending' }) => {
    const newChapterTitle = title?.trim() || 'Untitled Chapter';
    const selectedSubject = subject || 'Physics';
    const tempId = 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const newChapterObj = {
      id: tempId,
      user_id: user?.id,
      title: newChapterTitle,
      subject: selectedSubject,
      status: status || 'pending',
      subtasks: DEFAULT_SUBTASKS.map((st) => ({ ...st })),
      moduleQuestions: { total: 50, completed: 0 },
      workbookQuestions: { total: 30, completed: 0 },
      class_level: classLevel,
    };

    setChapters((prev) => [...prev, newChapterObj]);
    return tempId;
  }, [user?.id, setChapters]);

  const deleteChapter = useCallback((chapterId) => {
    setChapters((prev) => prev.filter((c) => String(c.id) !== String(chapterId)));
  }, [setChapters]);

  const updateChapter = useCallback((chapterId, updates) => {
    setChapters((prev) =>
      prev.map((c) => {
        if (String(c.id) === String(chapterId)) {
          const updated = { ...c, ...updates };
          const newTitle = updates.title || updates.name || updates.chapterName || updates.chapter_name;
          if (newTitle) {
            updated.title = newTitle;
            updated.name = newTitle;
            updated.chapterName = newTitle;
            updated.chapter_name = newTitle;
          }
          return updated;
        }
        return c;
      })
    );
  }, [setChapters]);

  const getSubjectChapters = useCallback((subjectNameOrId, classLevel) => {
    if (!subjectNameOrId) return [];
    const searchTarget = subjectNameOrId.toLowerCase();

    return (appData.chapters || []).filter((ch) => {
      const chSubj = (ch.subject || '').toLowerCase();
      const matchesSubject =
        chSubj === searchTarget ||
        searchTarget.includes(chSubj) ||
        chSubj.includes(searchTarget);

      const chClassNorm = normalizeClassLevelStr(ch.class_level || ch.classLevel);
      const targetClassNorm = normalizeClassLevelStr(classLevel);

      const matchesClass = !targetClassNorm || !chClassNorm || chClassNorm === targetClassNorm;

      return matchesSubject && matchesClass;
    });
  }, [appData.chapters]);

  // --- PAST & UPCOMING TESTS ACTIONS ---
  const setPastTests = useCallback((updater) => {
    setAppData((prev) => ({
      ...prev,
      pastTests: typeof updater === 'function' ? updater(prev.pastTests) : updater,
    }));
  }, []);

  const setUpcomingTests = useCallback((updater) => {
    setAppData((prev) => ({
      ...prev,
      upcomingTests: typeof updater === 'function' ? updater(prev.upcomingTests) : updater,
    }));
  }, []);

  // --- STUDY SESSIONS ACTIONS ---
  const setSessions = useCallback((updater) => {
    setAppData((prev) => ({
      ...prev,
      sessions: typeof updater === 'function' ? updater(prev.sessions) : updater,
    }));
  }, []);

  const addSession = useCallback((sessionData) => {
    const timestamp = sessionData.timestamp || Date.now();
    const durationSeconds = Number(sessionData.durationSeconds) || (Number(sessionData.durationMinutes) * 60) || 0;
    const durationMinutes = Number(sessionData.durationMinutes) || Math.max(1, Math.round(durationSeconds / 60));

    const newSess = {
      id: sessionData.id || `sess_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      date: sessionData.date || new Date(timestamp).toISOString().split('T')[0],
      durationMinutes,
      durationSeconds,
      subject: sessionData.subject || 'General',
      timestamp,
      mode: sessionData.mode || 'Focus Timer',
      durationText: sessionData.durationText || (durationMinutes >= 60 ? `${(durationMinutes / 60).toFixed(1)} hrs` : `${durationMinutes} mins`),
      formattedDate: sessionData.formattedDate || new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      user_id: user?.id,
    };

    setSessions((prev) => [newSess, ...prev]);
    return newSess;
  }, [user?.id, setSessions]);

  const deleteSession = useCallback((sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, [setSessions]);

  // --- TASKS ACTIONS ---
  const setTasks = useCallback((updater) => {
    setAppData((prev) => ({
      ...prev,
      tasks: typeof updater === 'function' ? updater(prev.tasks) : updater,
    }));
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, [setTasks]);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [setTasks]);

  const updateWeeklyTarget = useCallback((updater) => {
    setAppData((prev) => ({
      ...prev,
      weeklyTarget: typeof updater === 'function' ? updater(prev.weeklyTarget) : updater,
    }));
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        appData,
        loading,
        fetchUserData,
        // Sync & Offline State
        syncStatus: syncState.status,
        isOnline: syncState.isOnline,
        pendingSyncCount: syncState.pendingCount,
        isSyncing: syncState.isFlushing,
        flushSync: () => flushSyncQueue(supabase),
        // Chapters
        chapters: appData.chapters,
        setChapters,
        addChapter,
        deleteChapter,
        updateChapter,
        getSubjectChapters,
        fetchChapters: fetchUserData,
        // Tests
        pastTests: appData.pastTests,
        setPastTests,
        upcomingTests: appData.upcomingTests,
        setUpcomingTests,
        // Sessions
        sessions: appData.sessions,
        setSessions,
        addSession,
        deleteSession,
        // Tasks
        tasks: appData.tasks,
        setTasks,
        toggleTask,
        deleteTask,
        // Weekly Target
        weeklyTarget: appData.weeklyTarget,
        updateWeeklyTarget,
      }}
    >

      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
export const useChapters = () => useContext(AppDataContext);

export default AppDataContext;
