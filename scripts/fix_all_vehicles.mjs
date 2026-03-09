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
    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
    };

    console.log('Fetching all vehicles...');
    const res = await fetch(`${supabaseUrl}/rest/v1/vehicles?select=*`, { headers });
    if (!res.ok) {
        console.error('Error fetching vehicles:', res.status, await res.text());
        process.exit(1);
    }

    const rows = await res.json();
    console.log(`Found ${rows.length} vehicles.`);

    const mismatched = rows.filter(r => r.data?.id !== r.id);
    console.log(`Vehicles with mismatched IDs: ${mismatched.length}`);

    if (mismatched.length === 0) {
        console.log('All vehicles OK — no fix needed.');
        process.exit(0);
    }

    let fixed = 0;
    for (const row of mismatched) {
        const correctedData = { ...row.data, id: row.id };
        const patchRes = await fetch(`${supabaseUrl}/rest/v1/vehicles?id=eq.${row.id}`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ data: correctedData })
        });
        if (!patchRes.ok) {
            console.error(`Failed to fix vehicle ${row.id}:`, await patchRes.text());
        } else {
            console.log(`Fixed: ${row.data?.nombre || row.id} (old data.id: ${row.data?.id} → ${row.id})`);
            fixed++;
        }
    }

    console.log(`\nDone. Fixed ${fixed}/${mismatched.length} vehicles.`);
}

run();
