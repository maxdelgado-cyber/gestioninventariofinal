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
        { cat: 'Energía', sub: 'Case / Kit', n: 'Case de chucos', mod: 'Maleta', cant: 1, isCase: true, desc: '3 x Tableros eléctricos\n1 x COXX CT-02 (Test de cables)' },
        { cat: 'Energía', sub: 'Distribución eléctrica', n: 'Tableros eléctricos', mod: '', cant: 3, isCase: false },
        { cat: 'Energía', sub: 'Herramienta de diagnóstico', n: 'COXX CT-02 (Test de cables)', mod: 'Tester', cant: 1, isCase: false }
    ];

    const inserts = items.map(i => ({
        id: randomUUID(),
        created_at: now,
        data: {
            id: randomUUID(),
            nombre: i.n,
            categoria: i.cat,
            subcategoria: i.sub,
            marca: i.mod || '',
            cantidad: i.cant,
            estado: 'Disponible',
            ubicacion: 'Bodega Principal',
            esContenedor: i.isCase,
            contenidoInterno: i.isCase ? { itemsRef: [], descripcion: i.desc } : undefined,
            createdAt: now,
            updatedAt: now
        }
    }));

    console.log(`Inserting ${inserts.length} items...`);
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
    console.log('Success! Registered Case de chucos and electrical items.');
    process.exit(0);
}

run();
