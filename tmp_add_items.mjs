// Script to add audio equipment and fix alargadores in inventory
const BASE = 'http://localhost:3000/api/inventory';

const today = new Date().toISOString().split('T')[0];

// ── Audio Equipment ──
const audioItems = [
    { nombre: 'Micrófono instrumento Shure Beta 98H/C (pinza)', categoria: 'Audio', subcategoria: 'Micrófonos', marca: 'Shure', modelo: 'Beta 98H/C', cantidad: 2 },
    { nombre: 'Micrófono dinámico Shure SM58', categoria: 'Audio', subcategoria: 'Micrófonos', marca: 'Shure', modelo: 'SM58', cantidad: 10 },
    { nombre: 'Micrófono dinámico Shure SM57', categoria: 'Audio', subcategoria: 'Micrófonos', marca: 'Shure', modelo: 'SM57', cantidad: 4 },
    { nombre: 'Micrófono condensador Sennheiser E865', categoria: 'Audio', subcategoria: 'Micrófonos', marca: 'Sennheiser', modelo: 'E865', cantidad: 4 },
    { nombre: 'Micrófono condensador AKG C1000S', categoria: 'Audio', subcategoria: 'Micrófonos', marca: 'AKG', modelo: 'C1000S', cantidad: 3 },
    { nombre: 'Micrófono dinámico Shure Beta 58A', categoria: 'Audio', subcategoria: 'Micrófonos', marca: 'Shure', modelo: 'Beta 58A', cantidad: 1 },
    { nombre: 'Micrófono dinámico Shure Beta 57A', categoria: 'Audio', subcategoria: 'Micrófonos', marca: 'Shure', modelo: 'Beta 57A', cantidad: 1 },
    { nombre: 'Micrófono dinámico Shure SM48', categoria: 'Audio', subcategoria: 'Micrófonos', marca: 'Shure', modelo: 'SM48', cantidad: 1 },
    { nombre: 'Micrófono condensador Behringer C-2', categoria: 'Audio', subcategoria: 'Micrófonos', marca: 'Behringer', modelo: 'C-2', cantidad: 2 },
    { nombre: 'Porta micrófono', categoria: 'Audio', subcategoria: 'Accesorios micrófono', marca: '', modelo: '', cantidad: 9 },
];

// ── Alargadores (Electricidad) ──
const alargadorItems = [
    { nombre: 'Alargador 2m', categoria: 'Electricidad', subcategoria: 'Alargadores', cantidad: 6 },
    { nombre: 'Alargador 3m', categoria: 'Electricidad', subcategoria: 'Alargadores', cantidad: 14 },
    { nombre: 'Alargador 4m', categoria: 'Electricidad', subcategoria: 'Alargadores', cantidad: 1 },
    { nombre: 'Alargador 5m', categoria: 'Electricidad', subcategoria: 'Alargadores', cantidad: 5 },
    { nombre: 'Alargador 9m', categoria: 'Electricidad', subcategoria: 'Alargadores', cantidad: 2 },
    { nombre: 'Alargador 20m', categoria: 'Electricidad', subcategoria: 'Alargadores', cantidad: 1 },
    { nombre: 'Zapatilla eléctrica 1.2m', categoria: 'Electricidad', subcategoria: 'Alargadores tipo zapatilla', cantidad: 1 },
    { nombre: 'Zapatilla eléctrica 3m', categoria: 'Electricidad', subcategoria: 'Alargadores tipo zapatilla', cantidad: 8 },
    { nombre: 'Zapatilla eléctrica 5m', categoria: 'Electricidad', subcategoria: 'Alargadores tipo zapatilla', cantidad: 2 },
    { nombre: 'Triples', categoria: 'Electricidad', subcategoria: 'Adaptadores', cantidad: 21 },
];

async function createItem(item) {
    const body = {
        nombre: item.nombre,
        categoria: item.categoria,
        subcategoria: item.subcategoria || '',
        marca: item.marca || '',
        modelo: item.modelo || '',
        cantidad: item.cantidad,
        estado: 'Disponible',
        ubicacion: 'Bodega Principal',
        fechaAdquisicion: today,
        historialUso: [],
        notas: '',
        esContenedor: false,
        esConsumible: false,
        esInsumo: false,
    };
    const res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Failed ${item.nombre}: ${res.status}`);
    const data = await res.json();
    return data;
}

async function main() {
    console.log('=== Adding Audio Equipment ===');
    const audioIds = [];
    for (const item of audioItems) {
        const result = await createItem(item);
        audioIds.push(result.id);
        console.log(`✓ ${item.nombre} (${item.cantidad} uds) → ID: ${result.id}`);
    }

    console.log('\n=== Adding Alargadores (Electricidad) ===');
    const alargadorIds = [];
    for (const item of alargadorItems) {
        const result = await createItem(item);
        alargadorIds.push(result.id);
        console.log(`✓ ${item.nombre} (${item.cantidad} uds) → ID: ${result.id}`);
    }

    // Now update the "Case de alargadores" to reference these new alargador items
    console.log('\n=== Fetching all inventory to find Case de alargadores ===');
    const allRes = await fetch(BASE);
    const allItems = await allRes.json();
    const caseAlargadores = allItems.find(i => i.nombre && i.nombre.toLowerCase().includes('case de alargadores'));

    if (caseAlargadores) {
        console.log(`Found case: ${caseAlargadores.nombre} (ID: ${caseAlargadores.id})`);
        const itemsDetalle = alargadorIds.map((id, idx) => ({
            id,
            cantidad: alargadorItems[idx].cantidad
        }));
        const updateBody = {
            contenidoInterno: {
                itemsRef: alargadorIds,
                itemsDetalle,
                descripcion: 'Alargadores, zapatillas eléctricas y triples'
            }
        };
        const updateRes = await fetch(`${BASE}/${caseAlargadores.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody)
        });
        if (updateRes.ok) {
            console.log('✓ Case de alargadores updated with new contents');
        } else {
            console.error('✗ Failed to update case:', updateRes.status, await updateRes.text());
        }
    } else {
        console.log('⚠ No "Case de alargadores" found — skipping case update');
    }

    console.log('\n=== Summary ===');
    console.log(`Audio items created: ${audioIds.length}`);
    console.log(`Alargador items created: ${alargadorIds.length}`);
    console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
