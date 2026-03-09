const fs = require('fs');

async function reportCases() {
    const res = await fetch('http://localhost:3000/api/inventory');
    const data = await res.json();

    const cases = data.filter(d => d.data.esContenedor);
    const itemIds = new Set(data.map(d => d.id));

    const report = cases.map(c => {
        const refs = c.data.contenidoInterno?.itemsRef || [];
        const missing = refs.filter(id => !itemIds.has(id));
        return {
            name: c.data.nombre,
            refs: refs.length,
            missing: missing.length,
            missingIds: missing
        };
    });

    fs.writeFileSync('report.json', JSON.stringify(report, null, 2));
    console.log("Report generated.");
}

reportCases().catch(console.error);
