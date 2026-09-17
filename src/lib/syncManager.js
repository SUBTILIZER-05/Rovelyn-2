/**
 * ROVELYN Offline-First Sync Manager
 * Handles local persistence, network state tracking, mutation queuing, and background synchronization with Supabase.
 */

const SYNC_QUEUE_KEY = 'rovelyn_sync_queue';

// Listeners for sync status changes
const statusListeners = new Set();
let currentStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online';
let isFlushing = false;
let retryTimeoutId = null;

// Get current online status
export const getIsOnline = () => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

// Get stored sync queue from localStorage
export const getSyncQueue = () => {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse rovelyn_sync_queue from localStorage:', e);
    return [];
  }
};

// Save sync queue array to localStorage
export const saveSyncQueue = (queue) => {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    notifyListeners();
  } catch (e) {
    console.warn('Failed to save rovelyn_sync_queue to localStorage:', e);
  }
};

// Enqueue a mutation into localStorage queue
export const enqueueMutation = (table, action, payload) => {
  const queue = getSyncQueue();

  // For full document upserts like user_data, replace any pending payload for same user_id to prevent redundant requests
  if (table === 'user_data' && payload?.user_id) {
    const filtered = queue.filter(
      (item) => !(item.table === 'user_data' && item.payload?.user_id === payload.user_id)
    );
    const newItem = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      table,
      action,
      payload,
      timestamp: Date.now(),
    };
    filtered.push(newItem);
    saveSyncQueue(filtered);
    return newItem;
  }

  const newItem = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    table,
    action,
    payload,
    timestamp: Date.now(),
  };

  queue.push(newItem);
  saveSyncQueue(queue);
  return newItem;
};

// Remove single item from queue by ID
export const removeFromQueue = (mutationId) => {
  const queue = getSyncQueue();
  const updated = queue.filter((item) => item.id !== mutationId);
  saveSyncQueue(updated);
};

// Clear entire queue
export const clearSyncQueue = () => {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
    notifyListeners();
  } catch (e) {
    console.warn('Failed to clear sync queue:', e);
  }
};

// Notify all subscribers of status or queue length change
const notifyListeners = () => {
  const pendingCount = getSyncQueue().length;
  statusListeners.forEach((listener) => {
    try {
      listener({
        status: currentStatus,
        isOnline: getIsOnline(),
        pendingCount,
        isFlushing,
      });
    } catch (e) {
      console.error('Error in sync status listener:', e);
    }
  });
};

// Subscribe to status updates
export const subscribeSyncStatus = (listener) => {
  statusListeners.add(listener);
  // Initial notification
  listener({
    status: currentStatus,
    isOnline: getIsOnline(),
    pendingCount: getSyncQueue().length,
    isFlushing,
  });

  return () => {
    statusListeners.delete(listener);
  };
};

// Process and flush all pending mutations in background
export const flushSyncQueue = async (supabaseClient, backoffMs = 2000) => {
  if (isFlushing) return;
  if (!getIsOnline()) {
    currentStatus = 'offline';
    notifyListeners();
    return;
  }

  const queue = getSyncQueue();
  if (queue.length === 0) {
    currentStatus = 'online';
    notifyListeners();
    return;
  }

  isFlushing = true;
  currentStatus = 'syncing';
  notifyListeners();

  // Sort queue chronologically by timestamp
  const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);
  let hasFailed = false;

  for (const item of sortedQueue) {
    if (!getIsOnline()) {
      hasFailed = true;
      break;
    }

    try {
      if (item.table === 'user_data') {
        const { error } = await supabaseClient
          .from('user_data')
          .upsert(item.payload, { onConflict: 'user_id' });

        if (error) {
          console.warn('Supabase queue flush notice:', error.message || error);
          // If non-network constraint error, remove item to avoid blocking queue
          if (error.code && error.code !== 'FETCH_ERROR' && !error.message?.includes('Fetch')) {
            removeFromQueue(item.id);
          } else {
            hasFailed = true;
            break;
          }
        } else {
          removeFromQueue(item.id);
        }
      } else {
        // Generic table support (e.g. study_sessions, chapters, tasks)
        if (item.action === 'UPSERT') {
          const { error } = await supabaseClient
            .from(item.table)
            .upsert(item.payload);
          if (!error) removeFromQueue(item.id);
          else hasFailed = true;
        } else if (item.action === 'DELETE') {
          const { error } = await supabaseClient
            .from(item.table)
            .delete()
            .eq('id', item.payload.id);
          if (!error) removeFromQueue(item.id);
          else hasFailed = true;
        }
      }
    } catch (err) {
      console.warn('Network exception during background sync flush:', err);
      hasFailed = true;
      break;
    }
  }

  isFlushing = false;

  if (hasFailed && getSyncQueue().length > 0) {
    currentStatus = getIsOnline() ? 'syncing' : 'offline';
    notifyListeners();

    // Schedule exponential backoff retry if network is restored
    if (getIsOnline()) {
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      const nextBackoff = Math.min(backoffMs * 2, 30000);
      retryTimeoutId = setTimeout(() => {
        flushSyncQueue(supabaseClient, nextBackoff);
      }, backoffMs);
    }
  } else {
    currentStatus = getIsOnline() ? 'online' : 'offline';
    notifyListeners();
  }
};

// Initialize global window event listeners for online & offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentStatus = 'syncing';
    notifyListeners();
  });

  window.addEventListener('offline', () => {
    currentStatus = 'offline';
    notifyListeners();
  });
}
