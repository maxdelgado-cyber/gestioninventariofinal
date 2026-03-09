import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

async function run() {
    try {
        const envPath = path.resolve('.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const getVal = (key) => {
            const line = envContent.split('\n').find(l => l.startsWith(key + '='));
            return line ? line.split('=')[1].trim() : null;
        };

        const clean = (s) => s ? s.replace(/^['\"]|['\"]$/g, '') : s;
        const supabaseUrl = clean(getVal('NEXT_PUBLIC_SUPABASE_URL'));
        const supabaseKey = clean(getVal('SUPABASE_SERVICE_ROLE_KEY'));

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing keys');
            process.exit(1);
        }

        const now = new Date().toISOString();

        const items = [
            { cat: 'Escenario', sub: 'Plataformas', n: 'Niveles', mod: '—', cant: 32 },
            { cat: 'Escenario', sub: 'Escaleras', n: 'Niveles escalera', mod: '—', cant: 6 },
            { cat: 'Escenario', sub: 'Escaleras', n: 'Peldaños escalera', mod: '—', cant: 15 },
            { cat: 'Escenario', sub: 'Escaleras', n: 'Base escalera', mod: '—', cant: 2 },
            { cat: 'Escenario', sub: 'Escaleras', n: 'Escalera 2', mod: '—', cant: 2 },
            { cat: 'Escenario', sub: 'Escaleras', n: 'Escalera 2 grande', mod: '—', cant: 2 },
            { cat: 'Escenario', sub: 'Escaleras', n: 'Escalera 4', mod: '—', cant: 4 },
            { cat: 'Escenario', sub: 'Escaleras', n: 'Escalera 6', mod: '—', cant: 4 },
            { cat: 'Escenario', sub: 'Barandas / Seguridad', n: 'Pasa manos', mod: '—', cant: 7 },
            { cat: 'Escenario', sub: 'Estructura', n: 'Media cercha', mod: '—', cant: 6 },
            { cat: 'Escenario', sub: 'Estructura', n: 'Cerchas grandes', mod: '—', cant: 30 },
            { cat: 'Escenario', sub: 'Estructura', n: 'Cercha plana', mod: '—', cant: 63 },
            { cat: 'Escenario', sub: 'Estructura', n: 'Cercha chica', mod: '—', cant: 56 },
            { cat: 'Escenario', sub: 'Refuerzos', n: 'Diagonales rosado', mod: '—', cant: 15 },
            { cat: 'Escenario', sub: 'Refuerzos', n: 'Diagonales azul', mod: '—', cant: 17 },
            { cat: 'Escenario', sub: 'Refuerzos', n: 'Diagonales amarillo', mod: '—', cant: 8 },
            { cat: 'Escenario', sub: 'Patas de escenario', n: 'Patas', mod: '1 m', cant: 23 },
            { cat: 'Escenario', sub: 'Patas de escenario', n: 'Patas', mod: '1.5 m', cant: 23 },
            { cat: 'Escenario', sub: 'Patas de escenario', n: 'Patas', mod: '2 m', cant: 13 },
            { cat: 'Escenario', sub: 'Patas de escenario', n: 'Patas', mod: '60 cm', cant: 11 },
            { cat: 'Escenario', sub: 'Cases / Transporte', n: 'Case patas de escalera', mod: '—', cant: 1, esContenedor: true },
            { cat: 'Escenario', sub: 'Superficie escenario', n: 'Planchas escenario', mod: '—', cant: 47 },
            { cat: 'Escenario', sub: 'Superficie escenario', n: 'Planchas pista de baile', mod: '—', cant: 60 },
            { cat: 'Escenario', sub: 'Estructura', n: 'Largueros', mod: '—', cant: 39 }
        ];

        const nombresAEliminar = [...new Set(items.map(i => i.n))];
        const namesQuery = nombresAEliminar.map(n => `"${n}"`).join(',');

        console.log('Deleting duplicates...');
        const deleteUrl = `${supabaseUrl}/rest/v1/inventory?nombre=in.(${encodeURIComponent(namesQuery)})`;
        const deleteRes = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (!deleteRes.ok) {
            console.warn('Delete failed, might be no items found or syntax error. Proceeding to insert anyway.', await deleteRes.text());
        }

        const inserts = items.map(i => ({
            id: randomUUID(),
            created_at: now,
            data: {
                id: randomUUID(),
                nombre: i.n,
                categoria: i.cat,
                subcategoria: i.sub,
                modelo: i.mod !== '—' ? i.mod : '',
                cantidad: i.cant,
                estado: 'Disponible',
                ubicacion: 'Bodega Principal',
                esContenedor: i.esContenedor || false,
                contenidoInterno: i.esContenedor ? { itemsRef: [], descripcion: '' } : undefined,
                createdAt: now,
                updatedAt: now
            }
        }));

        console.log(`Inserting ${inserts.length} clean items...`);
        const insertUrl = `${supabaseUrl}/rest/v1/inventory`;
        const insertRes = await fetch(insertUrl, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(inserts)
        });

        if (!insertRes.ok) {
            const text = await insertRes.text();
            console.error('Error in insert:', insertRes.status, text);
            process.exit(1);
        }

        console.log('Success! Registered Escenario items correctly.');
        process.exit(0);
    } catch (err) {
        console.error('Catch error:', err);
        process.exit(1);
    }
}

run();
