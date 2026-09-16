export const CORE_PRESETS = [
  'Read Theory & Notes',
  'Solve Example Problems',
  'Problem Practice',
];

export const DEFAULT_SUBTASKS = [
  { id: 'sub_1', title: 'Read Theory & Notes', completed: false },
  { id: 'sub_2', title: 'Solve Example Problems', completed: false },
  { id: 'sub_3', title: 'Problem Practice', completed: false },
];

/**
 * Checks if a subtask title matches one of the three core default presets.
 */
export function isCorePreset(title) {
  if (!title || typeof title !== 'string') return false;
  const norm = title.trim().toLowerCase();
  return CORE_PRESETS.some((preset) => preset.toLowerCase() === norm);
}

/**
 * Ensures all three core subtask presets exist in the subtasks array.
 * Backfills missing presets without overriding existing checked states or custom subtasks.
 */
export function ensureCoreSubtasks(subtasks) {
  const current = Array.isArray(subtasks) ? [...subtasks] : [];

  CORE_PRESETS.forEach((presetTitle, idx) => {
    const exists = current.some(
      (st) => st && st.title && st.title.trim().toLowerCase() === presetTitle.toLowerCase()
    );
    if (!exists) {
      current.push({
        id: `sub_preset_${idx + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: presetTitle,
        completed: false,
      });
    }
  });

  return current;
}

/**
 * Calculates total chapter progress based on subtasks:
 * - "Problem Practice" = 50% when completed (0% when unchecked)
 * - Remaining other subtasks pool = 50% total, divided equally (50 / N % each)
 * - Formula: (isProblemPracticeDone * 50) + ((completedOther / totalOther) * 50)
 * - If all subtasks are done, result is strictly 100%
 * - Rounded to nearest whole integer
 */
export function calculateChapterProgress(subtasks = []) {
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return 0;
  }

  // If all subtasks are done, result is strictly 100%
  if (subtasks.every((st) => st && st.completed)) {
    return 100;
  }

  const ppTask = subtasks.find(
    (st) => st && st.title && st.title.trim().toLowerCase() === 'problem practice'
  );
  const isProblemPracticeDone = ppTask && ppTask.completed ? 1 : 0;

  const otherTasks = subtasks.filter(
    (st) => !st || !st.title || st.title.trim().toLowerCase() !== 'problem practice'
  );
  const totalOtherTasks = otherTasks.length;
  const completedOtherTasks = otherTasks.filter((st) => st && st.completed).length;

  const ppContribution = isProblemPracticeDone * 50;
  const otherContribution =
    totalOtherTasks > 0 ? (completedOtherTasks / totalOtherTasks) * 50 : 0;

  return Math.round(ppContribution + otherContribution);
}

/**
 * Calculates aggregate Subject Mastery / Module percentage as the unweighted mean
 * of all constituent chapter percentages.
 */
export function calculateSubjectProgress(chapters = []) {
  if (!Array.isArray(chapters) || chapters.length === 0) {
    return 0;
  }

  const sum = chapters.reduce((acc, ch) => {
    const subtasks = ch ? ch.subtasks : [];
    return acc + calculateChapterProgress(subtasks);
  }, 0);

  return Math.round(sum / chapters.length);
}
