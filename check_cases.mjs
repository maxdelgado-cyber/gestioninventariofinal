const BASE = 'http://localhost:3000/api/inventory';

async function main() {
    const res = await fetch(BASE);
    const items = await res.json();
    const cases = items.filter(i => i.esContenedor);
    console.log('--- Cases ---');
    cases.forEach(c => console.log(c.nombre));
}
main();
