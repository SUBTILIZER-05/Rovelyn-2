import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const AppDataContext = createContext({});

const DEFAULT_CONTENT = {
  chapters: [],
  pastTests: [],
  upcomingTests: [],
  sessions: [],
  tasks: [],
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

  // Normalizer for Chapter data
  const normalizeChapter = useCallback((ch) => ({
    id: ch.id || `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: user?.id,
    title: ch.title || 'Untitled Chapter',
    subject: ch.subject || 'Physics',
    status: ch.status || 'pending',
    subtasks: ch.subtasks || [
      { id: 'sub_1', title: 'Read Theory & Notes', completed: false },
      { id: 'sub_2', title: 'Solve Example Problems', completed: false },
    ],
    moduleQuestions: ch.moduleQuestions || ch.module_questions || { total: 50, completed: 0 },
    workbookQuestions: ch.workbookQuestions || ch.workbook_questions || { total: 30, completed: 0 },
    class_level: ch.class_level || ch.classLevel || 'C-11',
  }), [user?.id]);

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
      const { data, error } = await supabase
        .from('user_data')
        .select('content')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // PostgREST single row error (PGRST116) or missing table row -> initialize defaults
        console.warn('Supabase fetch user_data notice:', error.message || error);
        setAppData(DEFAULT_CONTENT);
      } else if (data?.content) {
        const content = data.content;
        setAppData({
          chapters: Array.isArray(content.chapters) ? content.chapters.map(normalizeChapter) : [],
          pastTests: Array.isArray(content.pastTests) ? content.pastTests : [],
          upcomingTests: Array.isArray(content.upcomingTests) ? content.upcomingTests : [],
          sessions: Array.isArray(content.sessions) ? content.sessions : [],
          tasks: Array.isArray(content.tasks) ? content.tasks : [],
        });
      } else {
        setAppData(DEFAULT_CONTENT);
      }
    } catch (err) {
      console.error('Failed to fetch user_data from Supabase:', err);
      setAppData(DEFAULT_CONTENT);
    } finally {
      setLoading(false);
      // Small delay before enabling auto-save to allow state initialization to settle
      setTimeout(() => {
        isInitialLoaded.current = true;
      }, 100);
    }
  }, [user?.id, normalizeChapter]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Debounced auto-sync to Supabase `user_data` table whenever `appData` changes
  useEffect(() => {
    if (!user?.id || !isInitialLoaded.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        isSyncing.current = true;
        const payload = {
          user_id: user.id,
          content: appData,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('user_data')
          .upsert(payload, { onConflict: 'user_id' });

        if (error) {
          console.error('Supabase user_data sync error:', error);
        }
      } catch (err) {
        console.error('Failed to sync user_data to Supabase:', err);
      } finally {
        isSyncing.current = false;
      }
    }, 800);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [appData, user?.id]);

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
      subtasks: [
        { id: 'sub_1', title: 'Read Theory & Notes', completed: false },
        { id: 'sub_2', title: 'Solve Example Problems', completed: false },
      ],
      moduleQuestions: { total: 50, completed: 0 },
      workbookQuestions: { total: 30, completed: 0 },
      class_level: classLevel,
    };

    setChapters((prev) => [...prev, newChapterObj]);
    return tempId;
  }, [user?.id, setChapters]);

  const deleteChapter = useCallback((chapterId) => {
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
  }, [setChapters]);

  const updateChapter = useCallback((chapterId, updates) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, ...updates } : c))
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

      const matchesClass = !classLevel || !ch.class_level || ch.class_level === classLevel;

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

  return (
    <AppDataContext.Provider
      value={{
        appData,
        loading,
        fetchUserData,
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
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
export const useChapters = () => useContext(AppDataContext);

export default AppDataContext;
