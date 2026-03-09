import fetch from 'node-fetch';
const BASE = 'http://localhost:3000/api/inventory';

async function main() {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    console.log('Total items:', data.length);
    const cases = data.filter(i => i.esContenedor);
    console.log('Found', cases.length, 'cases:');
    cases.forEach(c => {
        console.log(`- ID: ${c.id}`);
        console.log(`  Name: ${c.nombre}`);
        console.log(`  Items Ref length: ${c.contenidoInterno?.itemsRef?.length || 0}`);
        console.log(`  Items Detalle length: ${c.contenidoInterno?.itemsDetalle?.length || 0}`);
    });
}
main().catch(console.error);
