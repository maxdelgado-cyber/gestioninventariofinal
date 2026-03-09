import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

async function run() {
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const getVal = (key) => {
        const line = envContent.split('\n').find(l => l.startsWith(key + '='));
        return line ? line.split('=')[1].trim().replace(/^['\"]|['\"]$/g, '') : null;
    };

    const supabaseUrl = getVal('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getVal('SUPABASE_SERVICE_ROLE_KEY');
    const now = new Date().toISOString();

    const items = [
        { cat: 'Computadores', sub: 'Laptop', n: 'MacBook Pro', mod: '2012', cant: 1 },
        { cat: 'Computadores', sub: 'Laptop', n: 'MacBook Pro', mod: '2017 Touch Bar', cant: 1 },
        { cat: 'Computadores', sub: 'Laptop', n: 'Notebook', mod: 'Windows', cant: 1 }
    ];

    const inserts = items.map(i => ({
        id: randomUUID(),
        created_at: now,
        data: {
            id: randomUUID(),
            nombre: i.n,
            categoria: i.cat,
            subcategoria: i.sub,
            modelo: i.mod,
            marca: i.n === 'MacBook Pro' ? 'Apple' : 'Windows',
            cantidad: i.cant,
            estado: 'Disponible',
            ubicacion: 'Bodega Principal',
            createdAt: now,
            updatedAt: now
        }
    }));

    const res = await fetch(`${supabaseUrl}/rest/v1/inventory`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(inserts)
    });

    if (!res.ok) { console.error('Error:', res.status, await res.text()); process.exit(1); }
    console.log('Success! Registered 3 computers.');
    process.exit(0);
}

run();
