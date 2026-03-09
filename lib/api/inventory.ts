import { InventoryItem } from '@/types/allegra';
import { fetchWithOffline } from './offlineSync';

const BASE = '/api/inventory';

export const inventoryAPI = {
    getAll: async (): Promise<InventoryItem[]> => {
        const res = await fetch(BASE, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        // Crucial fix: Inject the true DB row ID into the object, overriding any internal 'data.id'
        return rows.map((r: any) => ({ ...r.data, id: r.id } as InventoryItem));
    },

    getById: async (id: string): Promise<InventoryItem | null> => {
        const res = await fetch(`${BASE}/${id}`, { cache: 'no-store' });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return { ...data, id } as InventoryItem; // Ensure id is correct
    },

    create: async (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
        const res = await fetchWithOffline(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    update: async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
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
