import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TABLE = 'inventory';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any;

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
    const updated = { ...existing.data, ...body, updatedAt: new Date().toISOString() };
    const { error } = await db().from(TABLE).update({ data: updated, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // Verificar que no esté asignado a eventos activos
    const { data: allEvents } = await db().from('events').select('id, data');
    const activeEvents = (allEvents || []).filter(
        (e: any) => !['Cerrado', 'Cancelado'].includes(e.data?.estado) &&
            Array.isArray(e.data?.equipamientoAsignado) &&
            e.data.equipamientoAsignado.some((eq: any) =>
                    typeof eq === 'string' ? eq === id : eq?.id === id
                )
    );
    if (activeEvents.length > 0) {
        return NextResponse.json(
            { error: `No se puede eliminar: el equipo está asignado a ${activeEvents.length} evento(s) activo(s).` },
            { status: 409 }
        );
    }
    const { error } = await db().from(TABLE).delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
