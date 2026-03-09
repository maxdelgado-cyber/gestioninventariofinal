import { Montaje } from '@/types/allegra';

const BASE = '/api/montajes';

export const montajesAPI = {
    getAll: async (): Promise<Montaje[]> => {
        const res = await fetch(BASE);
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        return rows.map((r: any) => r.data as Montaje);
    },

    getByEventoId: async (eventoId: string): Promise<Montaje[]> => {
        const res = await fetch(`${BASE}?eventoId=${eventoId}`);
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        return rows.map((r: any) => r.data as Montaje);
    },

    getById: async (id: string): Promise<Montaje | null> => {
        const res = await fetch(`${BASE}/${id}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    create: async (data: Omit<Montaje, 'id'>): Promise<Montaje> => {
        const res = await fetch(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    update: async (id: string, data: Partial<Montaje>): Promise<Montaje> => {
        const res = await fetch(`${BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    delete: async (id: string): Promise<void> => {
        const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
    },
};
