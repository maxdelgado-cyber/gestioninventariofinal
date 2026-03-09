import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const itemsToRename = [
    { old: "MAQUINA DE HUMO GENERICA 2do piso", new: "MAQUINA DE HUMO GENERICA" },
    { old: "MAQUINA DE LASER GLOWING L108B 2do piso", new: "MAQUINA DE LASER GLOWING L108B" },
    { old: "MODULO 2do piso", new: "MODULO" },
    { old: "MAQUINA DE CHISPAS 2do piso", new: "MAQUINA DE CHISPAS" },
    { old: "COB 2do piso", new: "COB" },
    { old: "TRUSS PEQUEÑOS 2do piso", new: "TRUSS PEQUEÑOS" }
];

const itemsToMove = [
    "LUZ LED FULL LIGHT 8+8 WHITE STROBE",
    "AMK FOCO FRONTAL",
    "TACHOS ALUMINIO",
    "TUBOS LED ROJO",
    "TUBOS LED VERDE",
    "TUBOS LED AZUL",
    "TUBOS LED AMARILLOS",
    "TUBOS LED ROSADOS",
    "TUBOS LED BLANCOS",
    "SILLAS",
    "VENTILADORES",
    "ESTUFAS",
    "ATRIL DIRECTOR",
    "AMPOLLETAS LED",
    "CASE DE TECLADO",
    "ALFOMBRA ROJA LISA",
    "ALFOMBRA PERSA",
    "MAQUINA DE HUMO B400",
    "TITIRITERO",
    "PANTALLA LAMPARA TIPO BARROCO",
    "CANDELABRO",
    "CANDELABRO GOTICO CRISTAL",
    "CAJON SOQUETE GUIRNALDA 50M"
];

async function run() {
    console.log('Fetching inventory from Supabase...');
    const { data: inventory, error } = await supabase.from('inventory').select('*');

    if (error) {
        console.error('Error fetching inventory:', error);
        return;
    }

    console.log(`Fetched ${inventory.length} items. Processing updates...`);

    let updatedCount = 0;

    for (const item of inventory) {
        const dataObj = item.data;
        let needsUpdate = false;
        let oldName = dataObj.nombre;

        // Check if it belongs to group 1
        const renameMatch = itemsToRename.find(r => r.old === dataObj.nombre);
        if (renameMatch) {
            dataObj.nombre = renameMatch.new;
            dataObj.ubicacion = "2do Piso";
            needsUpdate = true;
        }
        // Check if it belongs to group 2
        else if (itemsToMove.includes(dataObj.nombre)) {
            dataObj.ubicacion = "2do Piso";
            needsUpdate = true;
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ data: dataObj, updated_at: new Date().toISOString() })
                .eq('id', item.id);

            if (updateError) {
                console.error(`Error updating item ${oldName}:`, updateError);
            } else {
                console.log(`Updated: ${oldName} -> ${dataObj.nombre} | ubicacion: 2do Piso`);
                updatedCount++;
            }
        }
    }

    console.log(`Update finished. Total updated records: ${updatedCount}`);
}

run();
