import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

// Use Service Role Key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndClearDatabase() {
    console.log('🧹 Iniciando limpieza FORZADA de la base de datos (Bypassing RLS)...');

    const tables = [
        'events',
        'vehicles',
        'workers',
        'inventory',
        'clients'
    ];

    for (const table of tables) {
        try {
            // Check count first
            const { count, error: countErr } = await supabase.from(table).select('*', { count: 'exact', head: true });
            console.log(`Tabla ${table} tiene ${count} registros.`);

            if (count && count > 0) {
                console.log(`Borrando datos de la tabla: ${table}...`);
                const { error, data } = await supabase
                    .from(table)
                    .delete()
                    .not('id', 'is', null);

                if (error) {
                    console.error(`❌ Error borrando ${table}:`, error.message);
                } else {
                    console.log(`✅ Tabla ${table} vaciada correctamente (Bypass RLS).`);
                }
            }
        } catch (err) {
            console.error(`❌ Error inesperado con ${table}:`, err);
        }
    }

    console.log('✨ Proceso completado.');
}

checkAndClearDatabase();
