import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

async function run() {
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const getVal = (key) => envContent.split('\n').find(l => l.startsWith(key + '='))?.split('=')[1].trim().replace(/^['\"]|['\"]$/g, '');

    const supabaseUrl = getVal('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getVal('SUPABASE_SERVICE_ROLE_KEY');
    const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

    console.log('Cleaning up old records...');
    // Delete by name to be sure
    const deleteUrl = `${supabaseUrl}/rest/v1/vehicles?nombre=in.("KIA FRONTIER","RAM 1500")`;
    await fetch(deleteUrl, { method: 'DELETE', headers });

    const now = new Date().toISOString();
    const vehicles = [
        { nombre: 'KIA FRONTIER', tipo: 'Camión', marca: 'Kia', modelo: 'Frontier', patente: 'S/P' },
        { nombre: 'RAM 1500', tipo: 'Camioneta', marca: 'RAM', modelo: '1500', patente: 'S/P' }
    ];

    const inserts = vehicles.map(v => {
        const id = randomUUID();
        return {
            id: id, // Row ID
            created_at: now,
            data: {
                id: id, // JSON ID (MUST MATCH ROW ID)
                nombre: v.nombre,
                tipo: v.tipo,
                marca: v.marca,
                modelo: v.modelo,
                patente: v.patente,
                año: 2024,
                capacidadCarga: 0,
                estado: 'Disponible',
                mantenimientos: [],
                historialUso: [],
                anotaciones: [],
                createdAt: now,
                updatedAt: now
            }
        };
    });

    console.log(`Re-inserting ${inserts.length} vehicles with matching IDs...`);
    const res = await fetch(`${supabaseUrl}/rest/v1/vehicles`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify(inserts)
    });

    if (!res.ok) {
        console.error('Error:', res.status, await res.text());
        process.exit(1);
    }

    console.log('SUCCESS! Vehicles repaired.');
}
run();
