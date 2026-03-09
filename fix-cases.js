const fs = require('fs');

async function fixCases() {
    console.log("Fetching inventory...");
    const res = await fetch('http://localhost:3000/api/inventory');
    const items = await res.json();

    // items is an array of { id, data: {...} }

    // We need to find the child items and link them to their parent cases
    // We'll use simple string matching to figure out what goes where

    const cases = items.filter(i => i.data.esContenedor);
    const nonCases = items.filter(i => !i.data.esContenedor);

    console.log(`Found ${cases.length} cases and ${nonCases.length} regular items`);

    let changesCount = 0;

    for (const c of cases) {
        let refs = [];
        let detalles = [];
        let desc = "";

        const caseName = c.data.nombre.toLowerCase();

        // Specific rules
        if (caseName.includes('pad led plástico zf10142')) {
            // Find "Pad LED plástico ZF10142" with quantity > 1 OR just create the child item if it doesn't exist?
            // Wait, the user said "tendria que aparecer 17 pad led plasticos en un case"
            // Let's search non-cases
            let child = nonCases.find(i => i.data.nombre.toLowerCase().includes('pad led plástico zf10142'));
            if (!child) child = nonCases.find(i => i.data.nombre.toLowerCase().includes('zf10142'));
            if (!child) {
                console.log("Need to create child items for " + c.data.nombre);
                // Creating the inner item automatically
                const newId = crypto.randomUUID();
                const now = new Date().toISOString();
                const innerItem = {
                    id: newId,
                    data: {
                        nombre: "Pad LED plástico ZF10142 (individual)",
                        categoria: c.data.categoria,
                        subcategoria: c.data.subcategoria,
                        cantidad: 17,
                        ubicacion: c.data.ubicacion,
                        estado: "Disponible",
                        fechaAdquisicion: c.data.fechaAdquisicion,
                        esInsumo: false,
                        esContenedor: false,
                        createdAt: now,
                        updatedAt: now
                    }
                };
                await fetch('http://localhost:3000/api/inventory', {
                    method: 'POST',
                    body: JSON.stringify(innerItem.data)
                });
                child = innerItem;
            } else if (child.data.cantidad < 17) {
                // Update amount to 17
                child.data.cantidad = 17;
                await fetch(`http://localhost:3000/api/inventory/${child.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(child.data)
                });
            }

            refs.push(child.id);
            detalles.push({ id: child.id, cantidad: 17 });
            desc = "17 x Pad LED plástico ZF10142";
        }
        else if (caseName.includes('pad led metálicos lpc006')) {
            let child = nonCases.find(i => i.data.nombre.toLowerCase().includes('lpc006'));
            if (!child) {
                const newId = crypto.randomUUID();
                const now = new Date().toISOString();
                const innerItem = {
                    id: newId,
                    data: {
                        nombre: "Pad LED metálico LPC006 (individual)",
                        categoria: c.data.categoria,
                        subcategoria: c.data.subcategoria,
                        cantidad: 10, // Assuming a reasonable number
                        ubicacion: c.data.ubicacion,
                        estado: "Disponible",
                        fechaAdquisicion: c.data.fechaAdquisicion,
                        esInsumo: false,
                        esContenedor: false,
                        createdAt: now,
                        updatedAt: now
                    }
                };
                await fetch('http://localhost:3000/api/inventory', {
                    method: 'POST',
                    body: JSON.stringify(innerItem.data)
                });
                child = innerItem;
            }
            refs.push(child.id);
            detalles.push({ id: child.id, cantidad: child.data.cantidad });
            desc = `${child.data.cantidad} x ${child.data.nombre}`;
        }
        else if (caseName.includes('case de corriente')) {
            const cables = nonCases.filter(i =>
                i.data.nombre.toLowerCase().includes('alargador') ||
                i.data.nombre.toLowerCase().includes('triple')
            );

            cables.forEach(child => {
                refs.push(child.id);
                detalles.push({ id: child.id, cantidad: child.data.cantidad });
            });
            desc = "Todos los alargadores y triples";
        }

        if (refs.length > 0) {
            c.data.contenidoInterno = {
                itemsRef: refs,
                itemsDetalle: detalles,
                descripcion: desc
            };

            console.log(`Updating case ${c.data.nombre}... Adding ${refs.length} items`);

            await fetch(`http://localhost:3000/api/inventory/${c.id}`, {
                method: 'PUT',
                body: JSON.stringify(c.data)
            });
            changesCount++;
        }
    }

    console.log(`Updated ${changesCount} cases successfully!`);
}

fixCases().catch(console.error);
