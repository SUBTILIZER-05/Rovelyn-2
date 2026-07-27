import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'rovelyn_study_sessions_v1';

// Helper to normalize session object
export function normalizeSession(s) {
  const timestamp = Number(s.timestamp) || Date.now();
  
  let date = s.date;
  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    try {
      date = new Date(timestamp).toISOString().split('T')[0];
    } catch (e) {
      date = new Date().toISOString().split('T')[0];
    }
  }

  const durationSeconds = Number(s.durationSeconds) || (Number(s.durationMinutes) * 60) || 0;
  const durationMinutes = Number(s.durationMinutes) || Math.max(1, Math.round(durationSeconds / 60));

  return {
    id: s.id || `sess_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
    date, // "YYYY-MM-DD"
    durationMinutes,
    durationSeconds,
    subject: s.subject || 'General',
    timestamp,
    mode: s.mode || 'Focus Timer',
    durationText: s.durationText || (durationMinutes >= 60 ? `${(durationMinutes / 60).toFixed(1)} hrs` : `${durationMinutes} mins`),
    formattedDate: s.formattedDate || s.date || new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };
}

export function loadSessionsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeSession);
      }
    }
  } catch (e) {
    console.error('Failed to load study sessions from localStorage:', e);
  }
  return [];
}

export function saveSessionsToStorage(sessions) {
  try {
    const normalized = sessions.map(normalizeSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event('study_sessions_updated'));
    return normalized;
  } catch (e) {
    console.error('Failed to save study sessions to localStorage:', e);
    return sessions;
  }
}

export function useStudySessions() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const [sessions, setSessions] = useState(() => loadSessionsFromStorage());

  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      setSessions(loadSessionsFromStorage());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        // DO NOT fall back to mock constants if data.length === 0. Returns [] for new users.
        const normalized = data.map(normalizeSession);
        setSessions(normalized);
        saveSessionsToStorage(normalized);
      } else {
        setSessions(loadSessionsFromStorage());
      }
    } catch (err) {
      console.error('Supabase fetch user_sessions error:', err);
      setSessions(loadSessionsFromStorage());
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const handleUpdate = () => {
      setSessions(loadSessionsFromStorage());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('study_sessions_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('study_sessions_updated', handleUpdate);
    };
  }, []);

  const addSession = useCallback((sessionData) => {
    const current = loadSessionsFromStorage();
    const newSess = normalizeSession({
      ...sessionData,
      date: sessionData.date || new Date().toISOString().split('T')[0],
      timestamp: sessionData.timestamp || Date.now(),
      user_id: user?.id,
    });
    const updated = [newSess, ...current];
    saveSessionsToStorage(updated);
    setSessions(updated);

    if (user?.id) {
      supabase.from('user_sessions').insert([newSess]).catch((err) => {
        console.error('Error saving session to Supabase:', err);
      });
    }

    return newSess;
  }, [user?.id]);

  const deleteSession = useCallback((sessionId) => {
    const current = loadSessionsFromStorage();
    const updated = current.filter((s) => s.id !== sessionId);
    saveSessionsToStorage(updated);
    setSessions(updated);

    if (user?.id) {
      supabase.from('user_sessions').delete().eq('id', sessionId).eq('user_id', user.id).catch((err) => {
        console.error('Error deleting session from Supabase:', err);
      });
    }
  }, [user?.id]);

  return {
    sessions,
    addSession,
    deleteSession,
    fetchUserData,
  };
}

// Compute Heatmap intensity and data for given number of days (default 60 days)
export function calculateHeatmapData(sessions, days = 60) {
  const data = [];
  const today = new Date();

  // Create lookup dictionary: "YYYY-MM-DD" -> array of sessions
  const sessionsByDate = {};
  sessions.forEach((s) => {
    const norm = normalizeSession(s);
    if (!sessionsByDate[norm.date]) {
      sessionsByDate[norm.date] = [];
    }
    sessionsByDate[norm.date].push(norm);
  });

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isoDate = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const daySessions = sessionsByDate[isoDate] || [];
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    // Subject breakdown
    const subjectMap = {};
    daySessions.forEach((s) => {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.durationMinutes;
    });

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, mins]) => ({
      subject,
      mins,
      hours: (mins / 60).toFixed(1),
    }));

    let intensity = 0;
    let bgClass = 'bg-white/[0.03] border border-white/5';

    if (totalMinutes >= 240) {
      intensity = 4;
      bgClass = 'bg-violet-500 border border-violet-300 shadow-[0_0_18px_rgba(139,92,246,0.6)]';
    } else if (totalMinutes >= 120) {
      intensity = 3;
      bgClass = 'bg-indigo-600 border border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.4)]';
    } else if (totalMinutes >= 60) {
      intensity = 2;
      bgClass = 'bg-indigo-800/60 border border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]';
    } else if (totalMinutes >= 1) {
      intensity = 1;
      bgClass = 'bg-indigo-950/60 border border-indigo-500/20 text-indigo-300';
    }

    data.push({
      dateIso: isoDate,
      date: displayDate,
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1),
      intensity,
      bgClass,
      subjectBreakdown,
      sessionCount: daySessions.length,
    });
  }

  return data;
}
