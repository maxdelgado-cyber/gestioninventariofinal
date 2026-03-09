import fs from 'fs';
import path from 'path';

async function run() {
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const getVal = (key) => {
        const line = envContent.split('\n').find(l => l.startsWith(key + '='));
        return line ? line.split('=')[1].trim().replace(/^['\"]|['\"]$/g, '') : null;
    }

    const supabaseUrl = getVal('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getVal('SUPABASE_SERVICE_ROLE_KEY');

    const getUrl = `${supabaseUrl}/rest/v1/inventory?select=id,data`;
    const res = await fetch(getUrl, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });

    const allItems = await res.json();

    const deleteNames = ['Niveles', 'Niveles escalera', 'Peldaños escalera', 'Base escalera', 'Escalera 2', 'Escalera 2 grande', 'Escalera 4', 'Escalera 6', 'Pasa manos', 'Media cercha', 'Cerchas grandes', 'Cercha plana', 'Cercha chica', 'Diagonales rosado', 'Diagonales azul', 'Diagonales amarillo', 'Patas', 'Case patas de escalera', 'Planchas escenario', 'Planchas pista de baile', 'Largueros'];

    const byName = {};
    allItems.forEach(i => {
        const name = i.data.nombre;
        if (deleteNames.includes(name)) {
            if (!byName[name]) byName[name] = [];
            byName[name].push(i);
        }
    });

    let toDeleteIds = [];
    Object.values(byName).forEach(list => {
        // sort by created_at descending (newest first)
        list.sort((a, b) => new Date(b.data.createdAt || b.created_at) - new Date(a.data.createdAt || a.created_at));
        // we keep the FIRST one (index 0), delete the rest
        const redundant = list.slice(1).map(i => i.id);
        toDeleteIds.push(...redundant);
    });

    if (toDeleteIds.length === 0) {
        console.log('No duplicates found!');
        process.exit(0);
    }

    console.log(`Deleting ${toDeleteIds.length} redundant items...`);
    const deleteUrl = `${supabaseUrl}/rest/v1/inventory?id=in.(${toDeleteIds.join(',')})`;
    const delRes = await fetch(deleteUrl, { method: 'DELETE', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } });

    if (!delRes.ok) {
        console.error('Delete failed', await delRes.text());
    } else {
        console.log('Successfully eliminated duplicates.');
    }
}
run();
