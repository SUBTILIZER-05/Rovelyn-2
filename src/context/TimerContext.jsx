import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAppData } from './AppDataContext';

const TimerContext = createContext({});

const LOCAL_STORAGE_KEY = 'rovelyn_active_timer';

// Web Audio API chime helper for completed focus sessions
const playCompletionChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.15);
      osc.stop(ctx.currentTime + idx * 0.15 + 0.45);
    });
  } catch (e) {
    console.warn('Could not play audio completion chime:', e);
  }
};

const getInitialState = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      const now = Date.now();
      let isRunning = Boolean(data.isRunning);
      let targetEndTime = data.targetEndTime || null;
      let startTime = data.startTime || null;
      let activeMode = data.activeMode || data.mode || 'countdown';
      let targetMinutes = Number(data.targetMinutes) || 25;
      let secondsLeft = typeof data.secondsLeft === 'number' ? data.secondsLeft : (data.remainingSeconds ?? targetMinutes * 60);
      let secondsElapsed = typeof data.secondsElapsed === 'number' ? data.secondsElapsed : 0;

      if (isRunning) {
        if (activeMode === 'stopwatch') {
          if (startTime) {
            secondsElapsed = Math.max(0, Math.floor((now - startTime) / 1000));
          } else {
            startTime = now - secondsElapsed * 1000;
          }
        } else {
          // countdown / focus / shortBreak / longBreak
          if (targetEndTime) {
            const remaining = Math.max(0, Math.round((targetEndTime - now) / 1000));
            secondsLeft = remaining;
            if (remaining <= 0) {
              isRunning = false;
              targetEndTime = null;
              secondsLeft = 0;
            }
          } else {
            targetEndTime = now + secondsLeft * 1000;
          }
        }
      }

      return {
        activeMode,
        isRunning,
        targetEndTime,
        startTime,
        secondsLeft,
        secondsElapsed,
        targetMinutes,
        customInputHrs: data.customInputHrs || '0',
        customInputMins: data.customInputMins || String(targetMinutes),
        selectedSubject: data.selectedSubject || 'Physics',
        activeChapterId: data.activeChapterId || data.sessionTag || null,
      };
    }
  } catch (e) {
    console.warn('Failed to parse timer localStorage:', e);
  }

  return {
    activeMode: 'countdown',
    isRunning: false,
    targetEndTime: null,
    startTime: null,
    secondsLeft: 25 * 60,
    secondsElapsed: 0,
    targetMinutes: 25,
    customInputHrs: '0',
    customInputMins: '25',
    selectedSubject: 'Physics',
    activeChapterId: null,
  };
};

export function TimerProvider({ children }) {
  const { addSession } = useAppData();

  const initialState = getInitialState();

  const [activeMode, setActiveMode] = useState(initialState.activeMode);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [targetEndTime, setTargetEndTime] = useState(initialState.targetEndTime);
  const [startTime, setStartTime] = useState(initialState.startTime);
  const [secondsLeft, setSecondsLeft] = useState(initialState.secondsLeft);
  const [secondsElapsed, setSecondsElapsed] = useState(initialState.secondsElapsed);
  const [targetMinutes, setTargetMinutes] = useState(initialState.targetMinutes);
  const [customInputHrs, setCustomInputHrs] = useState(initialState.customInputHrs);
  const [customInputMins, setCustomInputMins] = useState(initialState.customInputMins);
  const [selectedSubject, setSelectedSubject] = useState(initialState.selectedSubject);
  const [activeChapterId, setActiveChapterId] = useState(initialState.activeChapterId);

  // Refs for tracking latest values in callback listeners without re-subscribing
  const stateRef = useRef({
    activeMode,
    isRunning,
    targetEndTime,
    startTime,
    secondsLeft,
    secondsElapsed,
    targetMinutes,
    selectedSubject,
    activeChapterId,
    addSession,
  });

  useEffect(() => {
    stateRef.current = {
      activeMode,
      isRunning,
      targetEndTime,
      startTime,
      secondsLeft,
      secondsElapsed,
      targetMinutes,
      selectedSubject,
      activeChapterId,
      addSession,
    };
  }, [
    activeMode,
    isRunning,
    targetEndTime,
    startTime,
    secondsLeft,
    secondsElapsed,
    targetMinutes,
    selectedSubject,
    activeChapterId,
    addSession,
  ]);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      const payload = {
        activeMode,
        mode: activeMode,
        isRunning,
        targetEndTime,
        startTime,
        secondsLeft,
        remainingSeconds: secondsLeft,
        secondsElapsed,
        targetMinutes,
        customInputHrs,
        customInputMins,
        selectedSubject,
        activeChapterId,
        sessionTag: activeChapterId,
        updatedAt: Date.now(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save timer state to localStorage:', e);
    }
  }, [
    activeMode,
    isRunning,
    targetEndTime,
    startTime,
    secondsLeft,
    secondsElapsed,
    targetMinutes,
    customInputHrs,
    customInputMins,
    selectedSubject,
    activeChapterId,
  ]);

  // Session Logger Helper
  const handleAutoLogCompletion = useCallback((durSecs) => {
    const { addSession: addSessFn, selectedSubject: subj, activeMode: mode } = stateRef.current;
    if (typeof addSessFn === 'function') {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const minsDecimal = durSecs / 60;
      const durationMinutes = Math.max(1, Math.round(minsDecimal));
      const durationText =
        minsDecimal >= 60
          ? `${(minsDecimal / 60).toFixed(1)} hrs`
          : `${durationMinutes} mins`;

      const isoDate = now.toISOString().split('T')[0];

      addSessFn({
        id: 'sess_' + now.getTime(),
        subject: subj || 'Physics',
        durationSeconds: durSecs,
        durationMinutes,
        durationText,
        mode: mode === 'stopwatch' ? 'Stopwatch' : 'Countdown Timer',
        date: isoDate,
        formattedDate: `${formattedDate}, ${formattedTime}`,
        timestamp: now.getTime(),
      });
    }
  }, []);

  // Main Root-Level Tick Loop (Timestamp-based calculation)
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      const now = Date.now();
      const { activeMode: mode, targetEndTime: endT, startTime: startT, targetMinutes: tgtMins } = stateRef.current;

      if (mode === 'stopwatch') {
        if (startT) {
          const elapsed = Math.max(0, Math.floor((now - startT) / 1000));
          setSecondsElapsed(elapsed);
        }
      } else {
        // Countdown mode
        if (endT) {
          const remaining = Math.max(0, Math.round((endT - now) / 1000));
          setSecondsLeft(remaining);

          if (remaining <= 0) {
            setIsRunning(false);
            setTargetEndTime(null);
            playCompletionChime();

            // Auto-log session on countdown completion
            handleAutoLogCompletion(tgtMins * 60);

            // Reset countdown seconds
            setSecondsLeft(tgtMins * 60);
          }
        }
      }
    };

    // Immediate calculation on mount/resume
    tick();

    const intervalId = setInterval(tick, 1000);

    // Visibility change listener: immediately update state when switching back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, handleAutoLogCompletion]);

  // Actions
  const startTimer = useCallback(() => {
    const now = Date.now();
    if (activeMode === 'stopwatch') {
      const newStart = now - secondsElapsed * 1000;
      setStartTime(newStart);
      setIsRunning(true);
    } else {
      const secsToRun = secondsLeft > 0 ? secondsLeft : targetMinutes * 60;
      const newEnd = now + secsToRun * 1000;
      setSecondsLeft(secsToRun);
      setTargetEndTime(newEnd);
      setIsRunning(true);
    }
  }, [activeMode, secondsElapsed, secondsLeft, targetMinutes]);

  const pauseTimer = useCallback(() => {
    const now = Date.now();
    setIsRunning(false);

    if (activeMode === 'stopwatch') {
      if (startTime) {
        const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
        setSecondsElapsed(elapsed);
      }
      setStartTime(null);
    } else {
      if (targetEndTime) {
        const remaining = Math.max(0, Math.round((targetEndTime - now) / 1000));
        setSecondsLeft(remaining);
      }
      setTargetEndTime(null);
    }
  }, [activeMode, startTime, targetEndTime]);

  const toggleTimer = useCallback(() => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [isRunning, pauseTimer, startTimer]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTargetEndTime(null);
    setStartTime(null);

    if (activeMode === 'stopwatch') {
      setSecondsElapsed(0);
    } else {
      setSecondsLeft(targetMinutes * 60);
    }
  }, [activeMode, targetMinutes]);

  const switchMode = useCallback((mode) => {
    setActiveMode(mode);
    setIsRunning(false);
    setTargetEndTime(null);
    setStartTime(null);

    if (mode === 'stopwatch') {
      setSecondsElapsed(0);
    } else {
      setSecondsLeft(targetMinutes * 60);
    }
  }, [targetMinutes]);

  const applyCustomTime = useCallback((hrsVal, minsVal) => {
    const parsedHrs = Math.max(0, parseInt(hrsVal, 10) || 0);
    const parsedMins = Math.max(0, parseInt(minsVal, 10) || 0);
    const totalMins = parsedHrs * 60 + parsedMins;
    const finalMins = Math.max(1, totalMins);

    setTargetMinutes(finalMins);
    setIsRunning(false);
    setTargetEndTime(null);
    setStartTime(null);
    setSecondsLeft(finalMins * 60);
  }, []);

  const handlePresetClick = useCallback((hrs, mins) => {
    setCustomInputHrs(String(hrs));
    setCustomInputMins(String(mins));
    applyCustomTime(hrs, mins);
  }, [applyCustomTime]);

  const logSession = useCallback((elapsedSecsOverride, modeName) => {
    const elapsedSecs =
      elapsedSecsOverride !== undefined
        ? elapsedSecsOverride
        : activeMode === 'stopwatch'
        ? secondsElapsed
        : targetMinutes * 60 - secondsLeft;

    if (elapsedSecs < 5) {
      // Avoid logging zero/accidental sessions
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const minsDecimal = elapsedSecs / 60;
    const durationMinutes = Math.max(1, Math.round(minsDecimal));
    const durationText =
      minsDecimal >= 60
        ? `${(minsDecimal / 60).toFixed(1)} hrs`
        : `${durationMinutes} mins`;

    const isoDate = now.toISOString().split('T')[0];

    if (typeof addSession === 'function') {
      addSession({
        id: 'sess_' + now.getTime(),
        subject: selectedSubject,
        durationSeconds: elapsedSecs,
        durationMinutes,
        durationText,
        mode: modeName || (activeMode === 'stopwatch' ? 'Stopwatch' : 'Countdown Timer'),
        date: isoDate,
        formattedDate: `${formattedDate}, ${formattedTime}`,
        timestamp: now.getTime(),
      });
    }

    resetTimer();
  }, [activeMode, secondsElapsed, targetMinutes, secondsLeft, addSession, selectedSubject, resetTimer]);

  const currentSeconds = activeMode === 'stopwatch' ? secondsElapsed : secondsLeft;

  // Utility to format seconds into HH:MM:SS or MM:SS
  const formatTime = useCallback((totalSecs = currentSeconds) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [currentSeconds]);

  return (
    <TimerContext.Provider
      value={{
        // State
        activeMode,
        mode: activeMode,
        isRunning,
        targetEndTime,
        startTime,
        secondsLeft,
        remainingSeconds: secondsLeft,
        secondsElapsed,
        targetMinutes,
        customInputHrs,
        customInputMins,
        selectedSubject,
        activeChapterId,
        sessionTag: activeChapterId,
        currentSeconds,

        // Setters & Actions
        setActiveMode,
        setCustomInputHrs,
        setCustomInputMins,
        setSelectedSubject,
        setActiveChapterId,
        setSessionTag: setActiveChapterId,
        startTimer,
        pauseTimer,
        toggleTimer,
        resetTimer,
        switchMode,
        applyCustomTime,
        handlePresetClick,
        logSession,
        formatTime,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
export const useTimerStore = useTimer;

export default TimerContext;
