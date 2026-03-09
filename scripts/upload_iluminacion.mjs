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
        // Iluminación — Cabezas Móviles (case containers)
        { cat: 'Iluminación', sub: 'Cabezas Móviles', n: 'Case cabezas móviles Beam 295 (delgado)', cant: 3, isCase: true, desc: '6 x Cabeza móvil Beam 295 por case' },
        { cat: 'Iluminación', sub: 'Cabezas Móviles', n: 'Case cabezas móviles Beam 295 (cuadrado)', cant: 6, isCase: true, desc: '12 x Cabeza móvil Beam 295 por case' },
        { cat: 'Iluminación', sub: 'Cabezas Móviles', n: 'Case cabezas móviles LED Zoom', cant: 2, isCase: true, desc: '8 x Cabeza móvil LED Zoom por case' },
        // Focos COB
        { cat: 'Iluminación', sub: 'Focos COB', n: 'Case COB 400W grandes', cant: 1, isCase: true, desc: '3 x COB 400W por case' },
        { cat: 'Iluminación', sub: 'Focos COB', n: 'COB 400W', cant: 1, isCase: false },
        { cat: 'Iluminación', sub: 'Focos COB', n: 'COB 200W RGB', cant: 4, isCase: false },
        { cat: 'Iluminación', sub: 'Focos COB', n: 'Case COB 240V Eastman', cant: 1, isCase: true, desc: '8 x COB 240V por case' },
        { cat: 'Iluminación', sub: 'Focos COB', n: 'COB 240V LightSolution', cant: 1, isCase: false },
        // Focos
        { cat: 'Iluminación', sub: 'Focos', n: 'Case Mini Brut SLT113', cant: 1, isCase: true, desc: '4 x Mini Brut por case' },
        { cat: 'Iluminación', sub: 'Focos', n: 'Mini Brut 200W Eastman', cant: 2, isCase: false },
        // Panel LED
        { cat: 'Iluminación', sub: 'Panel LED', n: 'Case Pad LED plástico ZF10142', cant: 1, isCase: true, desc: '17 x Pad LED plástico por case' },
        { cat: 'Iluminación', sub: 'Panel LED', n: 'Pad LED metálicos LPC006', cant: 1, isCase: true, desc: '8 x Pad LED metálico por case' },
        // Focos Par / Metálicos
        { cat: 'Iluminación', sub: 'Focos Par / Metálicos', n: 'Case focos metálicos pequeños ATV Lights', cant: 1, isCase: true, desc: '10 x Focos metálicos pequeños por case' },
        // Focos Fluorescentes
        { cat: 'Iluminación', sub: 'Focos Fluorescentes', n: 'Case focos fluor genéricos', cant: 1, isCase: true, desc: '6 x Focos fluorescentes por case' },
        // Efectos Especiales
        { cat: 'Iluminación', sub: 'Efectos Especiales', n: 'Máquina chispas frías Lux-Spark', cant: 2, isCase: true, desc: '3 x Máquina de chispas frías por case' },
        { cat: 'Iluminación', sub: 'Efectos Especiales', n: 'Chispas frías nuevas', cant: 4, isCase: false },
        // Efectos Atmosféricos
        { cat: 'Iluminación', sub: 'Efectos Atmosféricos', n: 'Máquina de humo MLB X600', cant: 1, isCase: false },
        { cat: 'Iluminación', sub: 'Efectos Atmosféricos', n: 'Máquina humo LED WildPro', cant: 1, isCase: false },
        // Láser
        { cat: 'Iluminación', sub: 'Láser', n: 'Láser Glowing L108B', cant: 2, isCase: false },
        // Video LED
        { cat: 'Video LED', sub: 'Pantallas LED', n: 'Case pantalla LED Novastar', cant: 4, isCase: true, desc: '6 x Paneles LED Novastar por case' },
        { cat: 'Video LED', sub: 'Procesadores Video', n: 'Procesadores video LED VLP', cant: 2, isCase: false },
        // Estructura LED
        { cat: 'Estructura LED', sub: 'Rigging pantalla', n: 'Bumper delgado', cant: 3, isCase: false },
        { cat: 'Estructura LED', sub: 'Rigging pantalla', n: 'Bumper ancho', cant: 2, isCase: false },
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
            ubicacion: 'Bodega Principal',
            esContenedor: i.isCase || false,
            contenidoInterno: i.isCase ? { itemsRef: [], descripcion: i.desc || '' } : undefined,
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

    if (!res.ok) {
        console.error('Error:', res.status, await res.text());
        process.exit(1);
    }

    console.log('Success! Registered Iluminación, Video LED, Estructura LED.');
    process.exit(0);
}

run();
