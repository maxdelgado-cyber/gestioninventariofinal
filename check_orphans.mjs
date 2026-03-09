import fetch from 'node-fetch';

const BASE = 'http://localhost:3000/api/inventory';

async function main() {
    const res = await fetch(BASE);
    const rows = await res.json();
    const allItems = rows.map(r => ({ ...r.data, id: r.id }));

    const cases = allItems.filter(i => i.esContenedor);
    let orphansFound = false;

    cases.forEach(c => {
        if (!c.contenidoInterno?.itemsDetalle) return;

        const details = c.contenidoInterno.itemsDetalle;
        const missing = details.filter(d => !allItems.find(i => i.id === d.id));

        if (missing.length > 0) {
            console.log(`Case "${c.nombre}" has ${missing.length} orphaned/missing items!`);
            orphansFound = true;
        }
    });

    if (!orphansFound) {
        console.log('All cases are healthy. No orphaned items found.');
    }
}

main().catch(console.error);
