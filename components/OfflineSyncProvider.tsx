'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { offlineQueue } from '@/lib/api/offlineSync';

export function OfflineSyncProvider() {
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // Update the pending count badge whenever the queue changes
        const updateCount = () => {
            setPendingCount(offlineQueue.get().length);
        };

        // Initial count
        updateCount();

        // ME-5: Listen for the custom event fired when actions get queued offline
        window.addEventListener('offline-sync-queued', updateCount);

        // CR-3 FIX: Proper sequential sync with no premature reload
        const handleOnline = async () => {
            const queue = offlineQueue.get();
            if (queue.length === 0) return;

            toast.loading(`Conexión recuperada. Sincronizando ${queue.length} cambios...`, { id: 'offline-sync' });

            let successCount = 0;
            let errorCount = 0;

            // Process sequentially to avoid race conditions
            for (const action of queue) {
                try {
                    const fetchOptions: RequestInit = {
                        method: action.method,
                        headers: { 'Content-Type': 'application/json' },
                    };
                    // CR-3 FIX: Only include body when it exists (not DELETE)
                    if (action.body) {
                        fetchOptions.body = action.body;
                    }

                    const res = await fetch(action.url, fetchOptions);

                    if (res.ok) {
                        offlineQueue.remove(action.id);
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch {
                    errorCount++;
                }
            }

            // Update pending count
            updateCount();

            // CR-3 FIX: Only reload AFTER all operations complete + only if all succeeded
            if (errorCount === 0 && successCount > 0) {
                toast.success(`Sincronización completa — ${successCount} cambio${successCount > 1 ? 's' : ''} guardado${successCount > 1 ? 's' : ''} ✓`, {
                    id: 'offline-sync',
                    duration: 3000,
                });
                // Wait for the toast to show before reloading
                await new Promise(resolve => setTimeout(resolve, 3000));
                window.location.reload();
            } else if (errorCount > 0) {
                toast.error(
                    `${successCount} guardados, ${errorCount} fallaron. Intenta refrescar manualmente.`,
                    { id: 'offline-sync', duration: 6000 }
                );
            }
        };

        const handleOffline = () => {
            toast.warning(
                'Sin conexión. Los cambios se guardarán localmente y se sincronizarán cuando vuelva el internet.',
                { duration: 5000 }
            );
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Try to sync pending actions on app startup (in case we closed while offline)
        if (navigator.onLine && offlineQueue.get().length > 0) {
            handleOnline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('offline-sync-queued', updateCount);
        };
    }, []);

    // ME-5: Expose pending count via a global dataset attribute so header can read it
    useEffect(() => {
        const el = document.getElementById('offline-sync-badge');
        if (el) {
            el.setAttribute('data-count', String(pendingCount));
            el.style.display = pendingCount > 0 ? 'flex' : 'none';
        }
    }, [pendingCount]);

    return null;
}

/**
 * Hook for reading the current offline queue count reactively.
 */
export function useOfflinePendingCount() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const update = () => setCount(offlineQueue.get().length);
        update();
        window.addEventListener('offline-sync-queued', update);
        window.addEventListener('online', update);
        return () => {
            window.removeEventListener('offline-sync-queued', update);
            window.removeEventListener('online', update);
        };
    }, []);

    return count;
}
