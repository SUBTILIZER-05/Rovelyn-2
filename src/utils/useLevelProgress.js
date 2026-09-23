import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppData } from '../context/AppDataContext';
import { calculateLevel, getLevelThreshold, getLevelDetails, formatMinutesLabel } from './levelSystem';

const LOCAL_STORAGE_TARGET_KEY = 'rovelyn_weekly_target';

const DEFAULT_TARGET_CONFIG = {
  mode: 'hours', // 'hours' | 'level'
  targetHours: 25,
  targetLevel: 5,
};

/**
 * Custom hook to calculate quadratic level progression & manage weekly targets.
 */
export function useLevelProgress() {
  const { sessions = [], weeklyTarget: contextWeeklyTarget, updateWeeklyTarget: contextUpdateWeeklyTarget } = useAppData();

  // Load weekly target preference from localStorage with context fallback
  const [weeklyTarget, setWeeklyTargetState] = useState(() => {
    try {
      if (contextWeeklyTarget && typeof contextWeeklyTarget === 'object') {
        return { ...DEFAULT_TARGET_CONFIG, ...contextWeeklyTarget };
      }
      const stored = localStorage.getItem(LOCAL_STORAGE_TARGET_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_TARGET_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse rovelyn_weekly_target from localStorage:', e);
    }
    return DEFAULT_TARGET_CONFIG;
  });

  // Keep local state updated if context changes from Supabase sync
  useEffect(() => {
    if (contextWeeklyTarget && typeof contextWeeklyTarget === 'object') {
      setWeeklyTargetState((prev) => {
        if (
          prev.mode !== contextWeeklyTarget.mode ||
          prev.targetHours !== contextWeeklyTarget.targetHours ||
          prev.targetLevel !== contextWeeklyTarget.targetLevel
        ) {
          return { ...DEFAULT_TARGET_CONFIG, ...contextWeeklyTarget };
        }
        return prev;
      });
    }
  }, [contextWeeklyTarget]);

  // Persist weekly target update to localStorage and AppDataContext
  const updateWeeklyTarget = useCallback((newConfig) => {
    setWeeklyTargetState((prev) => {
      const updated = {
        ...prev,
        ...(typeof newConfig === 'function' ? newConfig(prev) : newConfig),
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_TARGET_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to set rovelyn_weekly_target in localStorage:', e);
      }
      if (typeof contextUpdateWeeklyTarget === 'function') {
        contextUpdateWeeklyTarget(updated);
      }
      return updated;
    });
  }, [contextUpdateWeeklyTarget]);

  // Calculate lifetime cumulative study minutes across all sessions
  const totalMinutes = useMemo(() => {
    if (!Array.isArray(sessions) || sessions.length === 0) return 0;
    return sessions.reduce((acc, s) => {
      const secMins = s.durationSeconds ? Number(s.durationSeconds) / 60 : 0;
      const minVal = Number(s.durationMinutes) || 0;
      const sessionMins = secMins > 0 ? secMins : minVal;
      return acc + (isNaN(sessionMins) ? 0 : sessionMins);
    }, 0);
  }, [sessions]);

  // Calculate current week's total study minutes (since Monday 00:00:00)
  const weeklyMinutes = useMemo(() => {
    if (!Array.isArray(sessions) || sessions.length === 0) return 0;

    const now = new Date();
    const day = now.getDay();
    // Monday as start of week (0 is Sunday -> -6, 1 is Monday -> 0, 2 is Tue -> -1, etc.)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const startOfWeekTs = monday.getTime();

    return sessions.reduce((acc, s) => {
      const sessTs = Number(s.timestamp) || (s.date ? new Date(s.date).getTime() : 0);
      if (sessTs >= startOfWeekTs) {
        const secMins = s.durationSeconds ? Number(s.durationSeconds) / 60 : 0;
        const minVal = Number(s.durationMinutes) || 0;
        const sessionMins = secMins > 0 ? secMins : minVal;
        return acc + (isNaN(sessionMins) ? 0 : sessionMins);
      }
      return acc;
    }, 0);
  }, [sessions]);

  // Calculate Level Details
  const levelDetails = useMemo(() => {
    return getLevelDetails(totalMinutes);
  }, [totalMinutes]);

  // Weekly Target Status Calculation
  const weeklyTargetStatus = useMemo(() => {
    const isLevelMode = weeklyTarget.mode === 'level';
    const weeklyHoursNum = weeklyMinutes / 60;
    const weeklyHoursStr = weeklyHoursNum.toFixed(1);

    if (isLevelMode) {
      const targetLevel = Math.max(1, Number(weeklyTarget.targetLevel) || 5);
      const targetThreshold = getLevelThreshold(targetLevel);
      const targetReached = levelDetails.currentLevel >= targetLevel;
      const minsRemaining = Math.max(0, targetThreshold - totalMinutes);
      const hoursRemaining = (minsRemaining / 60).toFixed(1);
      const levelsRemaining = Math.max(0, targetLevel - levelDetails.currentLevel);

      return {
        mode: 'level',
        targetLevel,
        targetHours: weeklyTarget.targetHours || 25,
        targetReached,
        minsRemaining,
        hoursRemaining,
        levelsRemaining,
        displayText: `LVL ${levelDetails.currentLevel} / Target: LVL ${targetLevel}`,
        valueLabel: `LVL ${levelDetails.currentLevel}`,
        targetLabel: `Target: LVL ${targetLevel}`,
        deltaText: targetReached
          ? `Target LVL ${targetLevel} reached! 🎉`
          : `${hoursRemaining}h (${formatMinutesLabel(minsRemaining)}) to LVL ${targetLevel}`,
        weeklyHoursLogged: weeklyHoursStr,
      };
    } else {
      const targetHours = Math.max(1, Number(weeklyTarget.targetHours) || 25);
      const hoursRemaining = Math.max(0, targetHours - weeklyHoursNum).toFixed(1);
      const targetReached = weeklyHoursNum >= targetHours;

      return {
        mode: 'hours',
        targetHours,
        targetLevel: weeklyTarget.targetLevel || 5,
        targetReached,
        hoursRemaining,
        weeklyHoursLogged: weeklyHoursStr,
        displayText: `${weeklyHoursStr} / ${targetHours}h`,
        valueLabel: `${weeklyHoursStr}h`,
        targetLabel: `/ ${targetHours}h`,
        deltaText: targetReached
          ? `Weekly goal of ${targetHours}h reached! 🎉`
          : `${hoursRemaining} hours remaining this week`,
      };
    }
  }, [weeklyTarget, weeklyMinutes, totalMinutes, levelDetails.currentLevel]);

  return {
    totalMinutes,
    totalHours: levelDetails.totalHours,
    weeklyMinutes,
    weeklyHours: (weeklyMinutes / 60).toFixed(1),
    levelDetails,
    weeklyTarget,
    updateWeeklyTarget,
    weeklyTargetStatus,
  };
}

export default useLevelProgress;
