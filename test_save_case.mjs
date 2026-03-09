const BASE = 'http://localhost:3000/api/inventory';
const today = new Date().toISOString().split('T')[0];

async function main() {
    const payload = {
        nombre: 'Case de Prueba Backend',
        categoria: 'Audio',
        subcategoria: 'Cases',
        cantidad: 1,
        estado: 'Disponible',
        ubicacion: 'Bodega Principal',
        fechaAdquisicion: today,
        historialUso: [],
        notas: 'Prueba de array interno',
        esContenedor: true,
        esConsumible: false,
        esInsumo: false,
        contenidoInterno: {
            itemsRef: ["fake-id-1", "fake-id-2"],
            itemsDetalle: [
                { id: "fake-id-1", cantidad: 2 },
                { id: "fake-id-2", cantidad: 4 }
            ],
            descripcion: "Prueba"
        }
    };

    const createRes = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const created = await createRes.json();
    console.log('Created payload:', JSON.stringify(created, null, 2));

    // Now immediately get it back to see if it saved.
    const getRes = await fetch(`${BASE}/${created.id}`);
    const fetched = await getRes.json();
    console.log('\nFetched back payload:', JSON.stringify(fetched, null, 2));
}

main().catch(e => console.error(e));
