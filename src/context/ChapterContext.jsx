import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const ChapterContext = createContext({});

export const ChapterProvider = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normalize raw database rows into standard chapter shape
  const normalizeChapter = useCallback((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title || 'Untitled Chapter',
    subject: row.subject || 'Physics',
    status: row.status || 'pending',
    subtasks: row.subtasks || row.sub_tasks || [
      { id: 'sub_1', title: 'Read Theory & Notes', completed: false },
      { id: 'sub_2', title: 'Solve Example Problems', completed: false },
    ],
    moduleQuestions: row.module_questions || row.moduleQuestions || { total: 50, completed: 0 },
    workbookQuestions: row.workbook_questions || row.workbookQuestions || { total: 30, completed: 0 },
    class_level: row.class_level || row.classLevel || 'C-11',
  }), []);

  // Fetch chapters from Supabase on mount and whenever user.id changes
  const fetchChapters = useCallback(async () => {
    if (!user?.id) {
      setChapters([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase fetch chapters error:', error);
        // Fallback to local cache if present for this user
        const saved = localStorage.getItem(`rovelyn_chapters_v2_${user.id}`);
        if (saved) {
          try {
            setChapters(JSON.parse(saved));
          } catch (e) {
            console.error('Failed to parse cached chapters:', e);
          }
        }
      } else if (data) {
        setChapters(data.map(normalizeChapter));
      }
    } catch (err) {
      console.error('Failed to fetch chapters from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, normalizeChapter]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  // Sync to local cache whenever chapters update for fast offline/refresh fallback
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`rovelyn_chapters_v2_${user.id}`, JSON.stringify(chapters));
      } catch (e) {
        console.error('Failed to cache chapters to localStorage:', e);
      }
    }
  }, [chapters, user?.id]);

  // PERSISTENT ADD OPERATION
  const addChapter = async ({ title, subject, classLevel = 'C-11', status = 'pending' }) => {
    const newChapterTitle = title?.trim() || 'Untitled Chapter';
    const selectedSubject = subject || 'Physics';

    // Temp ID for optimistic update
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

    // 1. In-memory Optimistic Update for immediate UI response
    setChapters((prev) => [...prev, newChapterObj]);

    // 2. Persistent INSERT query to Supabase
    if (user?.id) {
      try {
        const payload = {
          user_id: user.id,
          title: newChapterTitle,
          subject: selectedSubject,
          status: status || 'pending',
          class_level: classLevel,
          subtasks: newChapterObj.subtasks,
          module_questions: newChapterObj.moduleQuestions,
          workbook_questions: newChapterObj.workbookQuestions,
        };

        const { data, error } = await supabase
          .from('chapters')
          .insert(payload)
          .select();

        if (error) {
          console.error('Supabase insert chapter error, trying minimal payload:', error);
          // Fallback minimal insert if extra columns don't exist
          const { data: minData, error: minError } = await supabase
            .from('chapters')
            .insert({
              user_id: user.id,
              title: newChapterTitle,
              subject: selectedSubject,
              status: status || 'pending',
            })
            .select();

          if (minError) {
            console.error('Supabase minimal insert chapter error:', minError);
          } else if (minData && minData[0]) {
            const dbRow = normalizeChapter(minData[0]);
            setChapters((prev) =>
              prev.map((c) => (c.id === tempId ? { ...c, ...dbRow, id: dbRow.id } : c))
            );
          }
        } else if (data && data[0]) {
          const dbRow = normalizeChapter(data[0]);
          // Swap temp optimistic chapter with real database record
          setChapters((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, ...dbRow, id: dbRow.id } : c))
          );
        }
      } catch (err) {
        console.error('Failed to insert chapter into Supabase:', err);
      }
    }

    return tempId;
  };

  // PERSISTENT DELETE OPERATION
  const deleteChapter = async (chapterId) => {
    // 1. In-memory Optimistic Update
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));

    // 2. Persistent DELETE query to Supabase
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('chapters')
          .delete()
          .eq('id', chapterId);

        if (error) {
          console.error('Supabase delete chapter error:', error);
        }
      } catch (err) {
        console.error('Failed to delete chapter from Supabase:', err);
      }
    }
  };

  // PERSISTENT UPDATE OPERATION
  const updateChapter = async (chapterId, updates) => {
    // 1. In-memory Optimistic Update
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, ...updates } : c))
    );

    // 2. Persistent UPDATE query to Supabase
    if (user?.id) {
      try {
        const dbUpdates = { ...updates };
        if (dbUpdates.moduleQuestions) {
          dbUpdates.module_questions = dbUpdates.moduleQuestions;
          delete dbUpdates.moduleQuestions;
        }
        if (dbUpdates.workbookQuestions) {
          dbUpdates.workbook_questions = dbUpdates.workbookQuestions;
          delete dbUpdates.workbookQuestions;
        }
        if (dbUpdates.classLevel) {
          dbUpdates.class_level = dbUpdates.classLevel;
          delete dbUpdates.classLevel;
        }

        const { error } = await supabase
          .from('chapters')
          .update(dbUpdates)
          .eq('id', chapterId);

        if (error) {
          console.error('Supabase update chapter error:', error);
        }
      } catch (err) {
        console.error('Failed to update chapter in Supabase:', err);
      }
    }
  };

  // Helper to filter chapters for a specific subject & class
  const getSubjectChapters = useCallback((subjectNameOrId, classLevel) => {
    if (!subjectNameOrId) return [];
    const searchTarget = subjectNameOrId.toLowerCase();

    return chapters.filter((ch) => {
      const chSubj = (ch.subject || '').toLowerCase();
      const matchesSubject =
        chSubj === searchTarget ||
        searchTarget.includes(chSubj) ||
        chSubj.includes(searchTarget);

      const matchesClass = !classLevel || !ch.class_level || ch.class_level === classLevel;

      return matchesSubject && matchesClass;
    });
  }, [chapters]);

  return (
    <ChapterContext.Provider
      value={{
        chapters,
        loading,
        fetchChapters,
        addChapter,
        deleteChapter,
        updateChapter,
        getSubjectChapters,
      }}
    >
      {children}
    </ChapterContext.Provider>
  );
};

export const useChapters = () => useContext(ChapterContext);

export default ChapterContext;
