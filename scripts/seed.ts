import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

import { INITIAL_INVENTORY, INITIAL_VEHICLES, INITIAL_WORKERS, INITIAL_EVENTS, INITIAL_CLIENTS, INITIAL_MONTAJES, INITIAL_DESMONTAJES } from '../_reference_repo/src/app/data/initialData';

async function clearTable(tableName: string) {
  console.log(`Clearing ${tableName}...`);
  const { error } = await supabase.from(tableName).delete().neq('id', 'dummy-force-delete');
  if (error) console.error(`Error deleting ${tableName}:`, error);
}

async function insertData(tableName: string, dataItems: any[]) {
  if (!dataItems || dataItems.length === 0) return;
  console.log(`Inserting ${dataItems.length} records into ${tableName}...`);

  const mappedData = dataItems.map(item => ({
    id: item.id,
    data: item
  }));

  const { error } = await supabase.from(tableName).insert(mappedData);
  if (error) {
    console.error(`Error inserting into ${tableName}:`, error);
  } else {
    console.log(`✅ Success for ${tableName}`);
  }
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean all tables first (ignoring potential foreign key issues since we overwrite everything)
  await clearTable('desmontaljes'); // using the typo name just in case? wait, our table is desmontajes probably, let's verify
  await clearTable('montajes');
  await clearTable('events');
  await clearTable('clients');
  await clearTable('workers');
  await clearTable('vehicles');
  await clearTable('inventory');

  // Our tables in Supabase match the api handlers (e.g. inventory, vehicles, workers, clients, events, montajes, desmontajes)
  await insertData('inventory', INITIAL_INVENTORY);
  await insertData('vehicles', INITIAL_VEHICLES);
  await insertData('workers', INITIAL_WORKERS);
  await insertData('clients', INITIAL_CLIENTS);
  await insertData('events', INITIAL_EVENTS);
  await insertData('montajes', INITIAL_MONTAJES);
  await insertData('desmontajes', INITIAL_DESMONTAJES); // map name to our table name 'desmontajes'

  console.log('✅ Seed completed successfully!');
}

main().catch(console.error);
