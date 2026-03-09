import { Event } from '@/types/allegra';
import { fetchWithOffline } from './offlineSync';

const BASE = '/api/events';

export const eventsAPI = {
    getAll: async (): Promise<Event[]> => {
        const res = await fetch(BASE, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        // Crucial fix: Inject the true DB row ID into the object, overriding any internal 'data.id'
        return rows.map((r: any) => ({ ...r.data, id: r.id } as Event));
    },

    getById: async (id: string): Promise<Event | null> => {
        const res = await fetch(`${BASE}/${id}`, { cache: 'no-store' });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return { ...data, id } as Event; // Ensure id is correct
    },

    create: async (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
        const res = await fetchWithOffline(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    update: async (id: string, data: Partial<Event>): Promise<Event> => {
        const res = await fetchWithOffline(`${BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    delete: async (id: string): Promise<void> => {
        const res = await fetchWithOffline(`${BASE}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
    },
};
