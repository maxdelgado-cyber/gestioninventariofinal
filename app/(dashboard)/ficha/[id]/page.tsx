'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Event, InventoryItem, Worker } from '@/types/allegra';
import { eventsAPI } from '@/lib/api/events';
import { inventoryAPI } from '@/lib/api/inventory';
import { workersAPI } from '@/lib/api/workers';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FichaPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params.id as string;
    const type = searchParams.get('type') || 'evento'; // evento | montaje | desmontaje

    const [event, setEvent] = useState<Event | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                const [evt, inv, wrk] = await Promise.all([
                    eventsAPI.getById(id),
                    inventoryAPI.getAll(),
                    workersAPI.getAll()
                ]);
                setEvent(evt || null);
                setInventory(inv || []);
                setWorkers(wrk || []);
            } catch (err) {
                console.error("Error loading ficha data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando ficha...</div>;
    }

    if (!event) {
        return <div className="p-8 text-center text-red-500">Evento no encontrado.</div>;
    }

    let titleStyle = "text-purple-600";
    let typeLabel = "Ficha de Evento";
    if (type === 'montaje') {
        typeLabel = "Ficha de Montaje (Salida)";
        titleStyle = "text-blue-600";
    } else if (type === 'desmontaje') {
        typeLabel = "Ficha de Desmontaje (Retorno)";
        titleStyle = "text-orange-600";
    }

    // Process equipment
    const equipmentList = (event.equipamientoAsignado || []).map(item => {
        const itemId = typeof item === 'string' ? item : item.id;
        const qty = typeof item === 'string' ? 1 : item.cantidad;
        const invItem = inventory.find(i => i.id === itemId);
        return {
            id: itemId,
            nombre: invItem?.nombre || 'Desconocido',
            categoria: invItem?.categoria || '-',
            cantidad: qty,
            esContenedor: invItem?.esContenedor,
            contenido: invItem?.contenidoInterno?.descripcion
        };
    });

    const workersList = (event.trabajadoresAsignados || [])
        .map(wId => workers.find(w => w.id === wId)?.nombre || 'Desconocido')
        .join(', ');

    return (
        <div className="bg-gray-100 min-h-screen pb-10">
            {/* Action bar — hidden on print */}
            <div className="max-w-4xl mx-auto p-4 md:p-8 no-print flex justify-between items-center">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Printer className="mr-2 h-4 w-4" /> Imprimir Ficha
                </Button>
            </div>

            {/* Print document */}
            <div className="print-container max-w-4xl mx-auto bg-white p-8 md:p-10 shadow-sm rounded-lg border border-gray-200">

                {/* ── Header ── */}
                <div className="ficha-header flex justify-between items-start border-b-2 border-gray-900 pb-5 mb-5">
                    <div>
                        <h1 className={`text-2xl font-black uppercase tracking-tight ${titleStyle}`}>{typeLabel}</h1>
                        <h2 className="text-lg font-bold text-gray-900 mt-1">{event.nombre}</h2>
                        <div className="mt-1 text-xs text-gray-500 font-medium">ID Evento: {event.id.substring(0, 8)}</div>
                    </div>
                    <div className="text-right">
                        <div className="bg-gray-900 text-white px-3 py-1 rounded text-xs font-bold inline-block mb-1.5">
                            ESTADO: {event.estado}
                        </div>
                        <p className="text-xs text-gray-600"><strong>Fecha de emisión:</strong> {new Date().toLocaleDateString('es-CL')}</p>
                    </div>
                </div>

                {/* ── Info grid ── */}
                <div className="ficha-info-grid grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                        <div>
                            <h3 className="ficha-section-title text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b pb-1 mb-1.5">Cliente / Receptor</h3>
                            <p className="ficha-section-text text-sm font-bold text-gray-900">{event.cliente}</p>
                            {event.contactoResponsable && <p className="ficha-section-text text-xs text-gray-700">Encargado: {event.contactoResponsable}</p>}
                            {event.telefono && <p className="ficha-section-text text-xs text-gray-700">Tel: {event.telefono}</p>}
                            {event.direccion && <p className="ficha-section-text text-xs text-gray-700 mt-0.5">Dir: {event.direccion}</p>}
                        </div>
                        <div>
                            <h3 className="ficha-section-title text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b pb-1 mb-1.5">Fechas y Horarios</h3>
                            <p className="ficha-section-text text-xs text-gray-900">
                                <strong>Inicio:</strong> {new Date(event.fechaInicio.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-CL')} / {event.horaInicio || '--'}
                            </p>
                            {event.fechaFin && (
                                <p className="ficha-section-text text-xs text-gray-900">
                                    <strong>Término:</strong> {new Date(event.fechaFin.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-CL')} / {event.horaFin || '--'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <h3 className="ficha-section-title text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b pb-1 mb-1.5">Personal y Logística</h3>
                            <p className="ficha-section-text text-xs text-gray-700"><strong>Personal:</strong> {workersList || 'Ninguno asignado'}</p>
                            {event.vehiculoNombre && (
                                <p className="ficha-section-text text-xs text-gray-700 mt-0.5">
                                    <strong>Transporte:</strong> {event.vehiculoNombre}
                                    {event.choferNombre ? ` (Conductor: ${event.choferNombre})` : ''}
                                </p>
                            )}
                        </div>
                        {event.notas && (
                            <div>
                                <h3 className="ficha-section-title text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b pb-1 mb-1.5">Notas Adicionales</h3>
                                <p className="ficha-section-text text-xs text-gray-800 whitespace-pre-wrap">{event.notas}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Equipment table ── */}
                <div>
                    <h3 className="ficha-equipment-title text-base font-bold text-gray-900 border-b-2 border-gray-200 pb-1.5 mb-3">
                        Listado de Equipamiento ({equipmentList.length} ítems)
                    </h3>

                    {equipmentList.length > 0 ? (
                        <table className="ficha-table w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-300">
                                    <th className="py-2 px-3 font-bold text-gray-700 w-14 text-center text-xs">Cant.</th>
                                    <th className="py-2 px-3 font-bold text-gray-700 text-xs">Descripción / Equipo</th>
                                    <th className="py-2 px-3 font-bold text-gray-700 w-40 text-xs">Categoría</th>
                                    <th className="py-2 px-3 font-bold text-gray-700 w-20 text-center text-xs">Check</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {equipmentList.map((eq, idx) => (
                                    <tr key={idx} className="break-inside-avoid">
                                        <td className="py-1.5 px-3 text-center font-bold text-sm">{eq.cantidad}</td>
                                        <td className="py-1.5 px-3">
                                            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                                                {eq.nombre}
                                                {eq.esContenedor && (
                                                    <span className="kit-badge bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Kit</span>
                                                )}
                                            </div>
                                            {eq.esContenedor && eq.contenido && (
                                                <div className="kit-detail mt-0.5 text-[10px] text-gray-500 font-mono pl-2.5 border-l-2 border-gray-300">
                                                    Inc: {eq.contenido}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-1.5 px-3 text-gray-600 capitalize text-sm">{eq.categoria}</td>
                                        <td className="py-1.5 px-3 text-center">
                                            <div className="ficha-check-box w-5 h-5 border-2 border-gray-400 mx-auto rounded" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-4 bg-gray-50 text-center text-gray-500 rounded border text-sm">No hay equipamiento asignado a este evento.</div>
                    )}
                </div>

                {/* ── Incidents ── */}
                {event.incidencias && event.incidencias.length > 0 && (
                    <div className="mt-6 break-inside-avoid">
                        <h3 className="text-sm font-bold text-red-700 border-b-2 border-red-200 pb-1.5 mb-3">Reportes de Incidentes</h3>
                        <div className="space-y-1.5">
                            {event.incidencias.map((inc, i) => (
                                <div key={i} className="p-2 bg-red-50 text-red-800 text-xs rounded border border-red-100 whitespace-pre-wrap">
                                    {inc}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Signatures ── */}
                <div className="ficha-signatures mt-14 pt-6 grid grid-cols-2 gap-16 break-inside-avoid">
                    <div className="text-center">
                        <div className="border-t border-gray-400 w-full mb-2"></div>
                        <p className="font-bold text-gray-800 text-sm">Entregado por (Firma)</p>
                        <p className="text-xs text-gray-500">Nombre / Cargo</p>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-gray-400 w-full mb-2"></div>
                        <p className="font-bold text-gray-800 text-sm">Recibido por (Firma)</p>
                        <p className="text-xs text-gray-500">Nombre / Cargo</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
