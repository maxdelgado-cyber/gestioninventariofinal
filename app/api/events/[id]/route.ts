import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TABLE = 'events';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any;

const VALID_TRANSITIONS: Record<string, string[]> = {
    'Agendado': ['En Montaje', 'Montado', 'Cancelado'],
    'En Montaje': ['Montado', 'Agendado', 'Cancelado'],
    'Montado': ['En Desmontaje', 'Cerrado'],
    'En Desmontaje': ['Cerrado'],
    'Cerrado': [],
    'Cancelado': ['Agendado'],
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data, error } = await db().from(TABLE).select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data.data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const { data: existing, error: fetchErr } = await db().from(TABLE).select('*').eq('id', id).single();
    if (fetchErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Validate state transition if estado is being changed
    if (body.estado && existing.data.estado && body.estado !== existing.data.estado) {
        const allowed = VALID_TRANSITIONS[existing.data.estado] ?? [];
        if (!allowed.includes(body.estado)) {
            return NextResponse.json(
                { error: `Transición de estado inválida: "${existing.data.estado}" → "${body.estado}". Estados permitidos: ${allowed.join(', ') || 'ninguno'}` },
                { status: 400 }
            );
        }
    }

    const updated = { ...existing.data, ...body, updatedAt: new Date().toISOString() };
    const { error } = await db().from(TABLE).update({ data: updated, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error } = await db().from(TABLE).delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
