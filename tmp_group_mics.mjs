const BASE = 'http://localhost:3000/api/inventory';
const today = new Date().toISOString().split('T')[0];

async function main() {
    const res = await fetch(BASE);
    const rawItems = await res.json();
    const items = rawItems.map(i => ({ id: i.id, ...i.data }));

    // Find all microphones that were added earlier
    const mics = items.filter(i =>
        i.categoria === 'Audio' &&
        (i.subcategoria === 'Micrófonos' || i.subcategoria === 'Accesorios micrófono') &&
        !i.esContenedor
    );

    console.log(`Found ${mics.length} audio items to put in a case.`);
    if (mics.length === 0) {
        console.log('No mics found, exiting.');
        return;
    }

    // Find if "Case de Micrófonos" or similar exists
    let caseMics = items.find(i => i.esContenedor && i.nombre.toLowerCase().includes('case de micrófonos'));

    if (!caseMics) {
        console.log('Creating "Case de Micrófonos"...');
        // create the case
        const createRes = await fetch(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: 'Case de Micrófonos',
                categoria: 'Audio',
                subcategoria: 'Cases',
                cantidad: 1,
                estado: 'Disponible',
                ubicacion: 'Bodega Principal',
                fechaAdquisicion: today,
                historialUso: [],
                notas: 'Contiene micrófonos Shure, Sennheiser, AKG, etc.',
                esContenedor: true,
                esConsumible: false,
                esInsumo: false,
            })
        });
        caseMics = await createRes.json();
        console.log('Created case with ID:', caseMics.id);
    } else {
        console.log('Found existing case:', caseMics.nombre, caseMics.id);
    }

    // Update the case internals
    const itemsDetalle = mics.map(m => ({ id: m.id, cantidad: m.cantidad }));
    const itemsRef = mics.map(m => m.id);

    console.log('Updating case internals...');
    const updateRes = await fetch(`${BASE}/${caseMics.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contenidoInterno: {
                itemsRef,
                itemsDetalle,
                descripcion: 'Set completo de microfonía y porta micrófonos'
            }
        })
    });

    if (updateRes.ok) {
        console.log('✓ Successfully assigned all microphones to the case.');
    } else {
        console.error('✗ Failed to update case', await updateRes.text());
    }
}

main().catch(e => console.error(e));
