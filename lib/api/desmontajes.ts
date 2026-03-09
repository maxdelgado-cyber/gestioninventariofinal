import { Desmontalje } from '@/types/allegra';

const BASE = '/api/desmontajes';

export const desmontajesAPI = {
    getAll: async (): Promise<Desmontalje[]> => {
        const res = await fetch(BASE);
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        return rows.map((r: any) => r.data as Desmontalje);
    },

    getByEventoId: async (eventoId: string): Promise<Desmontalje[]> => {
        const res = await fetch(`${BASE}?eventoId=${eventoId}`);
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        return rows.map((r: any) => r.data as Desmontalje);
    },

    getById: async (id: string): Promise<Desmontalje | null> => {
        const res = await fetch(`${BASE}/${id}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    create: async (data: Omit<Desmontalje, 'id'>): Promise<Desmontalje> => {
        const res = await fetch(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    update: async (id: string, data: Partial<Desmontalje>): Promise<Desmontalje> => {
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
