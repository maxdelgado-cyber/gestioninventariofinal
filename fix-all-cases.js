const fs = require('fs');

async function fixAllCases() {
    console.log("Fetching inventory...");
    const res = await fetch('http://localhost:3000/api/inventory');
    const items = await res.json();

    const cases = items.filter(i => i.data.esContenedor);
    const nonCases = items.filter(i => !i.data.esContenedor);

    console.log(`Found ${cases.length} cases and ${nonCases.length} regular items`);

    let changesCount = 0;

    for (const c of cases) {
        // Skip cases that already have items
        if (c.data.contenidoInterno?.itemsRef?.length > 0) {
            console.log(`Skipping ${c.data.nombre}, already has items.`);
            continue;
        }

        let refs = [];
        let detalles = [];
        let desc = "";

        const caseName = c.data.nombre.toLowerCase();

        // Specific rules
        if (caseName.includes('teclado')) {
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('teclado'));
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('chuco')) {
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('chuco'));
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('novastar') || caseName.includes('pantalla led')) {
            const children = nonCases.filter(i => i.data.nombre.toLowerCase().includes('procesador') || i.data.nombre.toLowerCase().includes('novastar') || i.data.nombre.toLowerCase().includes('módulo'));
            children.forEach(child => { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); });
        } else if (caseName.includes('focos fluor')) {
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('fluor'));
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('focos metálicos pequeños') || caseName.includes('atv')) {
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('atv') || i.data.nombre.toLowerCase().includes('foco metálico'));
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('mini brut')) {
            const children = nonCases.filter(i => i.data.nombre.toLowerCase().includes('mini brut'));
            children.forEach(child => { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); });
        } else if (caseName.includes('cob 240v') || caseName.includes('eastman')) {
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('cob 240v') && !i.data.esContenedor);
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('cob 400w')) {
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('cob 400w') && !i.data.esContenedor);
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('cabezas móviles led zoom')) {
            const children = nonCases.filter(i => i.data.nombre.toLowerCase().includes('cabeza móvil') || i.data.nombre.toLowerCase().includes('led zoom'));
            children.forEach(child => { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); });
        } else if (caseName.includes('beam 295')) {
            const children = nonCases.filter(i => i.data.nombre.toLowerCase().includes('beam 295') && !i.data.esContenedor);
            children.forEach(child => { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); });
        } else if (caseName.includes('patas de escalera')) {
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('pata') && i.data.nombre.toLowerCase().includes('escalera') && !i.data.esContenedor);
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('corchete')) {
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('corchete'));
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('clam')) {
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('clam') && !i.data.esContenedor);
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('pernop') || caseName.includes('pernos')) {
            const term = caseName.includes('azul') ? 'azul' : (caseName.includes('negra') ? 'negr' : 'perno');
            const child = nonCases.find(i => i.data.nombre.toLowerCase().includes('perno') && i.data.nombre.toLowerCase().includes(term));
            if (child) { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); }
        } else if (caseName.includes('cables') || caseName.includes('poder') || caseName.includes('señal')) {
            const children = nonCases.filter(i => i.data.nombre.toLowerCase().includes('cable'));
            // Add all cables for simplicity to these utility cases if specific match not found
            const terms = ['array', 'poder', 'señal', 'especial'];
            const term = terms.find(t => caseName.includes(t)) || 'cable';
            children.filter(i => i.data.nombre.toLowerCase().includes(term)).forEach(child => {
                refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad });
            });
        } else if (caseName.includes('herramienta')) {
            const children = nonCases.filter(i => i.data.categoria.toLowerCase() === 'herramientas');
            children.forEach(child => { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); });
        } else if (caseName.includes('micrófono') || caseName.includes('microfono')) {
            const children = nonCases.filter(i => i.data.nombre.toLowerCase().includes('micrófono') || i.data.nombre.toLowerCase().includes('microfono') || i.data.nombre.toLowerCase().includes('shure'));
            children.forEach(child => { refs.push(child.id); detalles.push({ id: child.id, cantidad: child.data.cantidad }); });
        }

        if (refs.length > 0) {
            c.data.contenidoInterno = {
                itemsRef: Array.from(new Set(refs)), // Deduplicate
                itemsDetalle: detalles.reduce((acc, curr) => {
                    if (!acc.find(item => item.id === curr.id)) {
                        acc.push(curr);
                    }
                    return acc;
                }, []),
                descripcion: `Autogenerado para ${c.data.nombre}`
            };

            console.log(`Updating case ${c.data.nombre}... Adding ${refs.length} items`);

            try {
                await fetch(`http://localhost:3000/api/inventory/${c.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(c.data)
                });
                changesCount++;
            } catch (e) {
                console.error(`Error updating ${c.data.nombre}:`, e);
            }
        } else {
            console.log(`Could not find matching generic items for case: ${c.data.nombre}`);
        }
    }

    console.log(`Updated ${changesCount} cases successfully!`);
}

fixAllCases().catch(console.error);
