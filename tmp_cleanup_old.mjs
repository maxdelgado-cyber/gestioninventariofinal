// Find old alargador items with any category
const BASE = 'http://localhost:3000/api/inventory';

async function main() {
    const res = await fetch(BASE);
    const items = await res.json();

    const alargadores = items.filter(i => {
        const name = (i.nombre || '').toLowerCase();
        return name.includes('alargador') || name.includes('zapatilla');
    });

    console.log(`Found ${alargadores.length} alargador/zapatilla items:`);
    for (const item of alargadores) {
        console.log(`  ${item.nombre} | Cat: "${item.categoria}" | Sub: "${item.subcategoria}" | Qty: ${item.cantidad} | ID: ${item.id}`);
    }

    // Delete old ones (not under "Electricidad")
    const oldOnes = alargadores.filter(i => i.categoria !== 'Electricidad');
    console.log(`\nOld items to delete (not Electricidad): ${oldOnes.length}`);
    for (const item of oldOnes) {
        console.log(`  Deleting: ${item.nombre} (${item.categoria})`);
        const delRes = await fetch(`${BASE}/${item.id}`, { method: 'DELETE' });
        console.log(`    ${delRes.ok ? '✓ Deleted' : '✗ Failed: ' + delRes.status}`);
    }
}

main().catch(e => { console.error(e); process.exit(1); });
