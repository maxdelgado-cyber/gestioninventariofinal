import { Vehicle } from '@/types/allegra';
import { fetchWithOffline } from './offlineSync';

const BASE = '/api/vehicles';

export const vehiclesAPI = {
    getAll: async (): Promise<Vehicle[]> => {
        const res = await fetch(BASE, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        return rows.map((r: any) => ({ ...r.data, id: r.id } as Vehicle));
    },

    getById: async (id: string): Promise<Vehicle | null> => {
        const res = await fetch(`${BASE}/${id}`, { cache: 'no-store' });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    create: async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> => {
        const res = await fetchWithOffline(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    update: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
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
