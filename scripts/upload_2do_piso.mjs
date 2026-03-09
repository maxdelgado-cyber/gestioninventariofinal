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
    const loc = '2do Piso';

    const items = [
        { cat: 'Iluminación', sub: 'Máquina de humo', n: 'Máquina de humo genérica', cant: 1 },
        { cat: 'Iluminación', sub: 'Estrobo LED', n: 'Luz LED Full Light 8+8 White Strobe', cant: 8 },
        { cat: 'Iluminación', sub: 'Láser', n: 'Máquina láser Glowing L108B', cant: 1 },
        { cat: 'Iluminación', sub: 'Control / Módulo', n: 'Módulo', cant: 1 },
        { cat: 'Iluminación', sub: 'Efectos especiales', n: 'Máquina de chispas', cant: 4 },
        { cat: 'Iluminación', sub: 'Foco frontal', n: 'AMK foco frontal', cant: 4 },
        { cat: 'Iluminación', sub: 'Decoración iluminación', n: 'Bola disco', cant: 1 },
        { cat: 'Iluminación', sub: 'Foco COB', n: 'COB', cant: 8 },
        { cat: 'Iluminación', sub: 'Focos PAR', n: 'Tachos aluminio', cant: 15 },
        { cat: 'Iluminación', sub: 'Tubos LED', n: 'Tubos LED rojos', cant: 17 },
        { cat: 'Iluminación', sub: 'Tubos LED', n: 'Tubos LED verdes', cant: 17 },
        { cat: 'Iluminación', sub: 'Tubos LED', n: 'Tubos LED azules', cant: 18 },
        { cat: 'Iluminación', sub: 'Tubos LED', n: 'Tubos LED amarillos', cant: 20 },
        { cat: 'Iluminación', sub: 'Tubos LED', n: 'Tubos LED rosados', cant: 17 },
        { cat: 'Iluminación', sub: 'Tubos LED', n: 'Tubos LED blancos', cant: 14 },
        { cat: 'Mobiliario', sub: 'Sillas', n: 'Sillas', cant: 240 },
        { cat: 'Climatización', sub: 'Ventiladores', n: 'Ventiladores', cant: 6 },
        { cat: 'Climatización', sub: 'Estufas', n: 'Estufas', cant: 3 },
        { cat: 'Estructura', sub: 'Truss', n: 'Truss pequeños', cant: 2 },
        { cat: 'Audio / Producción', sub: 'Atril', n: 'Atril director', cant: 1 },
        { cat: 'Energía', sub: 'Alargadores', n: 'Alargador 50 m', cant: 1 },
        { cat: 'Iluminación', sub: 'Ampolletas LED', n: 'Ampolletas LED', cant: 22 },
        { cat: 'Cases', sub: 'Case instrumentos', n: 'Case de teclado', cant: 1, isCase: true },
        { cat: 'Decoración', sub: 'Alfombras', n: 'Alfombra roja lisa', cant: 2 },
        { cat: 'Decoración', sub: 'Alfombras', n: 'Alfombra persa', cant: 2 },
        { cat: 'Iluminación', sub: 'Máquina de humo', n: 'Máquina de humo B400', cant: 1 },
        { cat: 'Escenografía', sub: 'Personaje', n: 'Titiritero', cant: 1 },
        { cat: 'Decoración', sub: 'Pantallas lámpara', n: 'Pantalla tipo barroco', cant: 13 },
        { cat: 'Decoración', sub: 'Candelabros', n: 'Candelabro', cant: 3 },
        { cat: 'Decoración', sub: 'Candelabros', n: 'Candelabro gótico cristal', cant: 3 },
        { cat: 'Energía / Decoración', sub: 'Guirnaldas', n: 'Cajón soquete guirnalda 50 m', cant: 1 }
    ];

    const inserts = items.map(i => ({
        id: randomUUID(),
        created_at: now,
        data: {
            id: randomUUID(),
            nombre: i.n,
            categoria: i.cat,
            subcategoria: i.sub,
            cantidad: i.cant,
            estado: 'Disponible',
            ubicacion: loc,
            esContenedor: i.isCase || false,
            contenidoInterno: i.isCase ? { itemsRef: [], descripcion: '' } : undefined,
            createdAt: now,
            updatedAt: now
        }
    }));

    console.log(`Inserting ${inserts.length} 2do Piso items...`);
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
    console.log('Success! All 2do Piso items registered.');
    process.exit(0);
}

run();
