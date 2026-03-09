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

    const vehicles = [
        { nombre: 'KIA FRONTIER', tipo: 'Camión', marca: 'Kia', modelo: 'Frontier', patente: 'S/P' },
        { nombre: 'RAM 1500', tipo: 'Camioneta', marca: 'RAM', modelo: '1500', patente: 'S/P' }
    ];

    const inserts = vehicles.map(v => ({
        id: randomUUID(),
        created_at: now,
        data: {
            id: randomUUID(),
            nombre: v.nombre,
            tipo: v.tipo,
            marca: v.marca,
            modelo: v.modelo,
            patente: v.patente,
            año: new Date().getFullYear(),
            capacidadCarga: 0,
            estado: 'Disponible',
            mantenimientos: [],
            historialUso: [],
            anotaciones: [],
            createdAt: now,
            updatedAt: now
        }
    }));

    console.log(`Inserting ${inserts.length} vehicles...`);
    const res = await fetch(`${supabaseUrl}/rest/v1/vehicles`, {
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

    console.log('Success! Registered KIA FRONTIER and RAM 1500.');
    process.exit(0);
}

run();
