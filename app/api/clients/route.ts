import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TABLE = 'clients';

export async function GET() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const body = await req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record = { ...body, id, createdAt: now, updatedAt: now };
    const { error } = await supabase.from(TABLE).insert({ id, data: record });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(record, { status: 201 });
}
