import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TABLE = 'inventario_externo';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any;

export async function GET() {
    const { data, error } = await db().from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record = { ...body, id, createdAt: now, updatedAt: now };
    const { error } = await db().from(TABLE).insert({ id, data: record });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(record, { status: 201 });
}
