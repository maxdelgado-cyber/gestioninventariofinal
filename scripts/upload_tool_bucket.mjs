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

        const bucketContainer = {
            id: randomUUID(),
            created_at: now,
            data: {
                id: randomUUID(),
                nombre: 'Balde herramientas',
                categoria: 'Herramientas',
                subcategoria: 'Kit de Herramientas',
                marca: 'Contenedor / Kit',
                cantidad: 1,
                estado: 'Disponible',
                ubicacion: 'Bodega Principal',
                esContenedor: true,
                contenidoInterno: {
                    itemsRef: [],
                    descripcion: '2 x Llave inglesa (Herramientas Manuales)\n2 x Nivel (Herramientas de Medición)\nN/A x Pernos escaleras (Accesorios / Ferretería)'
                },
                createdAt: now,
                updatedAt: now
            }
        };

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
            body: JSON.stringify([bucketContainer])
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Error in response:', response.status, text);
            process.exit(1);
        }

        console.log('Success! Registered Balde Herramientas via REST.');
        process.exit(0);
    } catch (err) {
        console.error('Catch error:', err);
        process.exit(1);
    }
}

run();
