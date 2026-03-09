import fs from 'fs';
import path from 'path';

async function run() {
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const getVal = (key) => {
        const line = envContent.split('\n').find(l => l.startsWith(key + '='));
        return line ? line.split('=')[1].trim().replace(/^['\"]|['\"]$/g, '') : null;
    };

    const supabaseUrl = getVal('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getVal('SUPABASE_SERVICE_ROLE_KEY');
    const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

    // 1. Find the Case de chucos record
    const getRes = await fetch(`${supabaseUrl}/rest/v1/inventory?select=id,data`, { headers });
    const all = await getRes.json();

    const caseItem = all.find(i => i.data?.nombre === 'Case de chucos');
    if (!caseItem) {
        console.log('Case de chucos not found!');
        process.exit(1);
    }

    console.log('Found Case de chucos, id:', caseItem.id);

    // 2. Update its data to empty the contenidoInterno description
    const updatedData = {
        ...caseItem.data,
        contenidoInterno: { itemsRef: [], descripcion: '' }
    };

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/inventory?id=eq.${caseItem.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ data: updatedData })
    });

    if (!patchRes.ok) {
        console.error('Patch failed:', patchRes.status, await patchRes.text());
        process.exit(1);
    }

    console.log('Done! Case de chucos now has empty contenidoInterno — it is standalone.');
    process.exit(0);
}

run();
