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
        const tools = [
            { n: 'Taladro', sub: 'Herramientas Eléctricas', m: 'Bauker', mod: 'ID900E', cant: 1 },
            { n: 'Kit desatornillador de precisión', sub: 'Herramientas Manuales', m: '(5 unidades)', mod: 'Pro', cant: 1 },
            { n: 'Galletero chico', sub: 'Herramientas Eléctricas', m: 'Bauker', mod: '', cant: 1 },
            { n: 'Martillos', sub: 'Herramientas Manuales', m: '—', mod: '', cant: 5 },
            { n: 'Sierra de mano', sub: 'Herramientas Manuales', m: 'Bauker', mod: '', cant: 1 },
            { n: 'Motosierra', sub: 'Herramientas Eléctricas', m: 'Karson', mod: '', cant: 1 },
            { n: 'Soplador', sub: 'Herramientas Eléctricas', m: 'Makita', mod: '', cant: 1 },
            { n: 'Taladro inalámbrico', sub: 'Herramientas Inalámbricas', m: 'Bauker', mod: '', cant: 2 },
            { n: 'Taladro inalámbrico', sub: 'Herramientas Inalámbricas', m: 'Bosch', mod: '', cant: 1 }
        ];

        const inserts = tools.map(t => ({
            id: randomUUID(),
            created_at: now,
            data: {
                id: randomUUID(),
                nombre: t.n,
                categoria: 'Herramientas',
                subcategoria: t.sub,
                marca: t.m,
                modelo: t.mod,
                cantidad: t.cant,
                estado: 'Disponible',
                ubicacion: 'Bodega Principal',
                createdAt: now,
                updatedAt: now
            }
        }));

        console.log('Fetching REST API...');
        const url = `${supabaseUrl}/rest/v1/inventory`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(inserts)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Error in response:', response.status, text);
            process.exit(1);
        }

        console.log('Success! Registered 9 tools via REST.');
        process.exit(0);
    } catch (err) {
        console.error('Catch error:', err);
        process.exit(1);
    }
}

run();
