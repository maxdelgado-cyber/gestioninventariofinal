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

        const insumos = [
            { n: 'Pólvora (fuegos fríos / chispas)', sub: 'Spirot / Máquina de Chispas', cant: 0, unidad: 'sobres' },
            { n: 'Líquido Máquina de Humo', sub: 'Máquina de Humo', cant: 0, unidad: 'litros' }
        ];

        const inserts = insumos.map(i => ({
            id: randomUUID(),
            created_at: now,
            data: {
                id: randomUUID(),
                nombre: i.n,
                categoria: 'Insumos',
                subcategoria: i.sub,
                cantidad: i.cant,
                estado: 'Disponible',
                ubicacion: 'Bodega Principal',
                esInsumo: true,
                unidadMedida: i.unidad,
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

        console.log('Success! Registered Insumos via REST.');
        process.exit(0);
    } catch (err) {
        console.error('Catch error:', err);
        process.exit(1);
    }
}

run();
