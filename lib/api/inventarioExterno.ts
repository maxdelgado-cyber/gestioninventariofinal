import { InventarioExterno } from '@/types/allegra';
import { fetchWithOffline } from './offlineSync';

const BASE = '/api/inventario-externo';

export const inventarioExternoAPI = {
    getAll: async (): Promise<InventarioExterno[]> => {
        const res = await fetch(BASE, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        return rows.map((r: any) => ({ ...r.data, id: r.id } as InventarioExterno));
    },

    create: async (data: Omit<InventarioExterno, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventarioExterno> => {
        const res = await fetchWithOffline(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    update: async (id: string, data: Partial<InventarioExterno>): Promise<InventarioExterno> => {
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
