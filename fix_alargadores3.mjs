import fetch from 'node-fetch';

const BASE = 'http://localhost:3000/api/inventory';

async function main() {
    const res = await fetch(BASE);
    const rows = await res.json();

    // Map like the frontend does
    const allItems = rows.map(r => ({ ...r.data, id: r.id }));

    // Find Case de alargadores
    const caseAlargadores = allItems.find(i => i.nombre && i.nombre.toLowerCase().includes('case de alargadores'));
    if (!caseAlargadores) {
        console.error('Case de alargadores not found');
        return;
    }
    console.log('Found Case:', caseAlargadores.nombre, caseAlargadores.id);

    // Find all valid items that should be in this case
    const validItems = allItems.filter(i =>
        i.categoria === 'Electricidad' &&
        !i.esContenedor &&
        (i.nombre.toLowerCase().includes('alargador') ||
            i.nombre.toLowerCase().includes('triple') ||
            i.nombre.toLowerCase().includes('zapatilla'))
    );

    console.log(`Found ${validItems.length} valid electric items for the case:`);
    validItems.forEach(i => console.log(`- ${i.nombre} (${i.cantidad})`));

    const newItemsRef = validItems.map(i => i.id);
    const newItemsDetalle = validItems.map(i => ({
        id: i.id,
        cantidad: i.cantidad
    }));

    // Update case. Note that we must mimic how the frontend PUT works
    // The frontend sends the entire object (merged) to `/api/inventory/[id]`
    // Or just the fields we want to update if the backend handles partial updates.
    // The backend `api/inventory/[id]` merges the existing data with the body.
    const updateBody = {
        contenidoInterno: {
            itemsRef: newItemsRef,
            itemsDetalle: newItemsDetalle,
            descripcion: 'Todos los alargadores, zapatillas y triples (Auto-reparado)'
        }
    };

    const updateRes = await fetch(`${BASE}/${caseAlargadores.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody)
    });

    if (updateRes.ok) {
        console.log('Successfully updated Case de alargadores!');
    } else {
        console.error('Failed to update case:', await updateRes.text());
    }
}

main().catch(console.error);
