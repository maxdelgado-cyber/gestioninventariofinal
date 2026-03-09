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

        const maletas = [
            { sub: 'Cables Especiales', n: 'Maleta de cables especiales', cant: 1 },
            { sub: 'Video / Pantallas', n: 'Maleta cables señal pantalla', cant: 1 },
            { sub: 'Video / Pantallas', n: 'Maleta cables poder pantalla', cant: 1 },
            { sub: 'Cables de Energía', n: 'Maleta cables de poder', cant: 1 },
            { sub: 'Sistema Line Array', n: 'Maleta vertical array Proel', cant: 1 },
            { sub: 'Sistema Line Array', n: 'Maleta cables de array', cant: 1 },
            { sub: 'Ferretería', n: 'Maleta pernos chicos (negra)', cant: 1 },
            { sub: 'Ferretería', n: 'Maleta pernos grandes (azul)', cant: 1 },
            { sub: 'Rigging / Estructura', n: 'Maleta de clams', cant: 1 },
            { sub: 'Rigging / Estructura', n: 'Maleta corchetes', cant: 1 }
        ];

        const inserts = maletas.map(m => ({
            id: randomUUID(),
            created_at: now,
            data: {
                id: randomUUID(),
                nombre: m.n,
                categoria: 'Maletas / Cases',
                subcategoria: m.sub,
                cantidad: m.cant,
                estado: 'Disponible',
                ubicacion: 'Bodega Principal',
                esContenedor: true,
                contenidoInterno: { itemsRef: [], descripcion: '' },
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

        console.log('Success! Registered 10 Maletas/Cases via REST.');
        process.exit(0);
    } catch (err) {
        console.error('Catch error:', err);
        process.exit(1);
    }
}

run();
