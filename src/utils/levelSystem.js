/**
 * Second-Order Arithmetic Progression Level System
 * 
 * Incremental requirement: Level k -> k + 1 requires (50 + 10k) minutes.
 * - Level 1 -> 2: 60 mins (1h)
 * - Level 2 -> 3: 70 mins (1h 10m -> Total 130 mins)
 * - Level 3 -> 4: 80 mins (1h 20m -> Total 210 mins)
 * 
 * Cumulative threshold formula to hit Level L:
 * T(L) = 5 * (L^2) + 45 * L - 50 (minutes)
 * 
 * Inversion helper to calculate current Level from totalMinutes:
 * L = Math.floor((-45 + Math.sqrt(2025 + 20 * (totalMinutes + 50))) / 10)
 * (Clamped to minimum Level 1).
 */

/**
 * Calculates current level from total cumulative study minutes.
 * @param {number} totalMinutes 
 * @returns {number} Level (minimum 1)
 */
export function calculateLevel(totalMinutes = 0) {
  const mins = Math.max(0, Number(totalMinutes) || 0);
  const l = Math.floor((-45 + Math.sqrt(2025 + 20 * (mins + 50))) / 10);
  return Math.max(1, l);
}

/**
 * Gets cumulative minutes required to hit a specific level L.
 * T(L) = 5*(L^2) + 45*L - 50
 * @param {number} level 
 * @returns {number} Cumulative minutes
 */
export function getLevelThreshold(level = 1) {
  const l = Math.max(1, Number(level) || 1);
  return 5 * (l ** 2) + 45 * l - 50;
}

/**
 * Gets comprehensive details about user's current progression level.
 * @param {number} totalMinutes 
 * @returns {Object} Level details object
 */
export function getLevelDetails(totalMinutes = 0) {
  const mins = Math.max(0, Number(totalMinutes) || 0);
  const currentLevel = calculateLevel(mins);
  const nextLevel = currentLevel + 1;

  const prevThreshold = getLevelThreshold(currentLevel);
  const nextThreshold = getLevelThreshold(nextLevel);

  const currentProgressMins = Math.max(0, mins - prevThreshold);
  const reqMinsForNext = nextThreshold - prevThreshold; // 50 + 10 * currentLevel
  const remainingMinsForNext = Math.max(0, nextThreshold - mins);

  const rawPercent = ((mins - prevThreshold) / reqMinsForNext) * 100;
  const progressPercent = Math.min(100, Math.max(0, rawPercent));

  return {
    currentLevel,
    nextLevel,
    totalMinutes: mins,
    totalHours: (mins / 60).toFixed(1),
    prevThreshold,
    nextThreshold,
    currentProgressMins,
    reqMinsForNext,
    remainingMinsForNext,
    progressPercent,
  };
}

/**
 * Formats minute values into user-friendly hours and minutes text (e.g. 1h 20m or 45m).
 * @param {number} minutes 
 * @returns {string} Formatted duration string
 */
export function formatMinutesLabel(minutes = 0) {
  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hrs > 0 && remMins > 0) {
    return `${hrs}h ${remMins}m`;
  } else if (hrs > 0) {
    return `${hrs}h`;
  } else {
    return `${remMins}m`;
  }
}
