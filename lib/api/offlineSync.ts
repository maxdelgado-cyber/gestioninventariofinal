export interface SyncAction {
    id: string;
    url: string;
    method: string;
    body?: string;
    timestamp: number;
}

const STORAGE_KEY = 'allegra_offline_sync_queue';

export const offlineQueue = {
    get(): SyncAction[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    add(action: Omit<SyncAction, 'id' | 'timestamp'>) {
        if (typeof window === 'undefined') return;
        const current = this.get();
        current.push({
            ...action,
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now()
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        window.dispatchEvent(new Event('offline-sync-queued'));
    },

    remove(id: string) {
        if (typeof window === 'undefined') return;
        const current = this.get();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter(a => a.id !== id)));
    },

    clear() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
    }
};

/**
 * CR-4 FIX: Distinguishable offline-queued response.
 * Returns a special sentinel object instead of a real entity so callers
 * can detect when the request was queued (not actually persisted) and
 * avoid using the fake response as real data.
 */
export const OFFLINE_QUEUED_SENTINEL = Symbol('OFFLINE_QUEUED');

/**
 * Drop-in replacement for fetch() for mutations (POST, PUT, DELETE).
 * If offline or network fails → queues the action locally and returns a
 * stable Response carrying { _offlineQueued: true } so callers can test
 * for this and skip using the body as a real entity.
 */
export async function fetchWithOffline(url: string, options: RequestInit): Promise<Response> {
    const method = options.method?.toUpperCase() || 'GET';
    const isMutation = ['POST', 'PUT', 'DELETE'].includes(method);

    try {
        if (typeof navigator !== 'undefined' && !navigator.onLine && isMutation) {
            throw new Error('OFFLINE');
        }
        const res = await fetch(url, options);
        return res;

    } catch {
        if (isMutation) {
            // CR-3 FIX: Don't include body for DELETE (it has no entity body)
            offlineQueue.add({
                url,
                method,
                body: method !== 'DELETE' ? options.body as string | undefined : undefined
            });

            return new Response(JSON.stringify({ _offlineQueued: true }), {
                status: 202, // 202 Accepted (not 200) to distinguish from real success
                headers: { 'Content-Type': 'application/json' }
            });
        }
        throw new Error(`Network error during ${method} ${url}`);
    }
}
