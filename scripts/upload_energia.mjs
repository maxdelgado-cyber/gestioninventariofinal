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

    const caseDesc = [
        '6 x Alargador 2 m',
        '14 x Alargador 3 m',
        '1 x Alargador 4 m',
        '5 x Alargador 5 m',
        '2 x Alargador 9 m',
        '1 x Alargador 20 m',
        '1 x Alargador tipo zapatilla 1.2 m',
        '8 x Alargador tipo zapatilla 3 m',
        '2 x Alargador tipo zapatilla 5 m',
        '21 x Triple eléctrico'
    ].join('\n');

    const items = [
        // Container
        { cat: 'Energía', sub: 'Case / Kit', n: 'Case de corriente', mod: 'Maleta', cant: 1, isCase: true, desc: caseDesc },
        // Contents
        { cat: 'Energía', sub: 'Alargadores', n: 'Alargador', mod: '2 m', cant: 6, isCase: false },
        { cat: 'Energía', sub: 'Alargadores', n: 'Alargador', mod: '3 m', cant: 14, isCase: false },
        { cat: 'Energía', sub: 'Alargadores', n: 'Alargador', mod: '4 m', cant: 1, isCase: false },
        { cat: 'Energía', sub: 'Alargadores', n: 'Alargador', mod: '5 m', cant: 5, isCase: false },
        { cat: 'Energía', sub: 'Alargadores', n: 'Alargador', mod: '9 m', cant: 2, isCase: false },
        { cat: 'Energía', sub: 'Alargadores', n: 'Alargador', mod: '20 m', cant: 1, isCase: false },
        { cat: 'Energía', sub: 'Zapatillas eléctricas', n: 'Alargador tipo zapatilla', mod: '1.2 m', cant: 1, isCase: false },
        { cat: 'Energía', sub: 'Zapatillas eléctricas', n: 'Alargador tipo zapatilla', mod: '3 m', cant: 8, isCase: false },
        { cat: 'Energía', sub: 'Zapatillas eléctricas', n: 'Alargador tipo zapatilla', mod: '5 m', cant: 2, isCase: false },
        { cat: 'Energía', sub: 'Adaptadores', n: 'Triple eléctrico', mod: '—', cant: 21, isCase: false }
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
            modelo: i.mod || '',
            cantidad: i.cant,
            estado: 'Disponible',
            ubicacion: 'Bodega Principal',
            esContenedor: i.isCase,
            contenidoInterno: i.isCase ? { itemsRef: [], descripcion: i.desc } : undefined,
            createdAt: now,
            updatedAt: now
        }
    }));

    console.log(`Inserting ${inserts.length} Energía items...`);
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

    if (!res.ok) {
        console.error('Error:', res.status, await res.text());
        process.exit(1);
    }
    console.log('Success! Registered Case de corriente and all contents.');
    process.exit(0);
}

run();
