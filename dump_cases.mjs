import fetch from 'node-fetch';
const BASE = 'http://localhost:3000/api/inventory';

async function main() {
    const res = await fetch(BASE);
    const data = await res.json();
    const namedCases = data.filter(i => i.nombre && i.nombre.toLowerCase().includes('case'));
    console.log(`Found ${namedCases.length} items with "case" in the name:`);
    namedCases.forEach(c => {
        console.log(JSON.stringify(c, null, 2));
    });
}
main().catch(console.error);
