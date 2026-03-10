'use client';

import { useState, useEffect } from 'react';
import { PackageCheck, Search, CalendarDays, CheckCircle2, XCircle, Printer, Users, Truck, ArrowRight, Edit, Copy, ChevronRight, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Event, InventoryItem, Worker } from '@/types/allegra';
import { eventsAPI } from '@/lib/api/events';
import { inventoryAPI } from '@/lib/api/inventory';
import { workersAPI } from '@/lib/api/workers';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function MontajePage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
    const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmEvent, setConfirmEvent] = useState<Event | null>(null);
    const [checklistEvent, setChecklistEvent] = useState<Event | null>(null);
    const [selectedEquipment, setSelectedEquipment] = useState<Record<string, number>>({});
    const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
    const [quantityDialogItem, setQuantityDialogItem] = useState<InventoryItem | null>(null);
    const [tempQuantity, setTempQuantity] = useState(1);
    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('todas');
    const [filterSubcategoria, setFilterSubcategoria] = useState('todas');
    const [filterEstado, setFilterEstado] = useState('Disponibles');
    const [incidentesReportados, setIncidentesReportados] = useState('');

    // ── Copiar de evento pasado ──
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [copyOpen, setCopyOpen] = useState(false);
    const [copySearch, setCopySearch] = useState('');
    const [copySelected, setCopySelected] = useState<Event | null>(null);

    useEffect(() => { loadEvents(); }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const [data, inv, wrk] = await Promise.all([
                eventsAPI.getAll(),
                inventoryAPI.getAll(),
                workersAPI.getAll()
            ]);
            const all = data || [];
            // Show events that are pending montaje or already mounted (as history)
            const relevant = all.filter(e =>
                ['Agendado', 'En Montaje', 'Montado'].includes(e.estado)
            );
            setEvents(relevant);
            // Past events with equipment (for the copy feature)
            const past = all.filter(e =>
                e.estado === 'Cerrado' &&
                e.equipamientoAsignado && e.equipamientoAsignado.length > 0
            ).sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
            setPastEvents(past);
            setAllInventory(inv || []);
            setAllWorkers(wrk || []);
        } catch { toast.error('Error al cargar eventos para montaje'); }
        finally { setLoading(false); }
    };

    const ejecutarMontaje = async (event: Event) => {
        setConfirmEvent(null);
        setActionLoading(event.id);
        try {
            // 1. Check for items that are NOT available dynamically
            const usageMap: Record<string, number> = {};
            const todayStr = new Date().toISOString().split('T')[0];
            events.forEach(e => {
                if (e.id === event.id) return; // No contamos el propio evento que estamos editando
                const isMounted = ['En Montaje', 'Montado', 'En Desmontaje'].includes(e.estado);
                const isStarted = e.fechaInicio <= todayStr;
                if (isMounted && isStarted) {
                    e.equipamientoAsignado?.forEach(eq => {
                        const id = typeof eq === 'string' ? eq : eq.id;
                        const qty = typeof eq === 'string' ? 1 : eq.cantidad;
                        usageMap[id] = (usageMap[id] || 0) + qty;
                    });
                }
            });

            const conflictos: string[] = [];
            const selectedIds = Object.keys(selectedEquipment);
            if (selectedIds.length > 0) {
                for (const itemId of selectedIds) {
                    const item = allInventory.find(i => i.id === itemId);
                    if (item) {
                        const enUsoHoy = usageMap[item.id] || 0;
                        const available = item.cantidad - enUsoHoy;
                        const required = selectedEquipment[item.id];
                        if (available < required) {
                            conflictos.push(`"${item.nombre}" (${required} requeridos, ${available} disp.)`);
                        }
                    }
                }
            }

            if (conflictos.length > 0) {
                toast.warning(
                    `Advertencia: ${conflictos.length} equipo(s) no disponibles: ${conflictos.slice(0, 3).join(', ')}${conflictos.length > 3 ? '...' : ''}. Se continuará igualmente.`,
                    { duration: 5000 }
                );
            }

            // 2. Update all assigned inventory items to "En Uso"
            // REMOVED: Database item state should not be forced. Inventory page computers dynamic usage.
            let actualizados = 0;
            const fallidos = 0;
            if (selectedIds.length > 0) {
                actualizados = selectedIds.length;
            }

            // 3. Update event state and final equipment list
            const finalEquipment = Object.entries(selectedEquipment).map(([id, cantidad]) => ({ id, cantidad }));
            const incidencias: string[] = [];
            if (incidentesReportados.trim()) {
                incidencias.push(...incidentesReportados.trim().split('\n').map(s => s.trim()).filter(Boolean));
            }

            try {
                await eventsAPI.update(event.id, {
                    equipamientoAsignado: finalEquipment as any,
                    montajeRealizado: true,
                    estado: 'Montado',
                    ...(incidencias.length > 0 ? { incidencias } : {})
                });
            } catch (eventErr: any) {
                console.error('[Montaje] Error actualizando evento:', eventErr);
                toast.error(`Error al actualizar el evento: ${eventErr?.message || 'No se pudo guardar'}. Intente de nuevo.`);
                return; // Don't show success if the event failed
            }

            const totalSeleccionados = Object.keys(selectedEquipment).length;
            if (fallidos > 0) {
                toast.warning(`Montaje confirmado con advertencias. ${actualizados}/${totalSeleccionados} equipo(s) actualizados. ${fallidos} no pudieron actualizarse.`, { duration: 5000 });
            } else {
                toast.success(`✓ Montaje confirmado. ${totalSeleccionados} equipo(s) asignados al evento.`);
            }
            setChecklistEvent(null);
            setIncidentesReportados('');
            loadEvents();
        } catch (e: any) {
            console.error('[Montaje] Error general:', e);
            toast.error(e?.message || 'Error al confirmar el montaje');
        } finally {
            setActionLoading(null);
        }
    };

    const confirmarMontaje = (event: Event) => {
        if (Object.keys(selectedEquipment).length === 0) {
            toast.error('No has seleccionado ningún equipo para este evento.');
            return;
        }
        setConfirmEvent(event);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Agendado': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Montaje': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Montado': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filtered = events.filter(e =>
        e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.cliente.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = ['todas', ...Array.from(new Set(allInventory.map(i => i.categoria))).sort()];
    const itemsForSub = filterCategoria === 'todas' ? allInventory : allInventory.filter(i => i.categoria === filterCategoria);
    const subcategories = ['todas', ...Array.from(new Set(itemsForSub.map(i => i.subcategoria).filter(Boolean) as string[])).sort()];

    const itemUsageMap: Record<string, number> = {};
    const todayStr = new Date().toISOString().split('T')[0];

    events.forEach(e => {
        const isMounted = ['En Montaje', 'Montado', 'En Desmontaje'].includes(e.estado);
        const isStarted = e.fechaInicio <= todayStr;
        if (isMounted && isStarted) {
            e.equipamientoAsignado?.forEach(eq => {
                const id = typeof eq === 'string' ? eq : eq.id;
                const qty = typeof eq === 'string' ? 1 : eq.cantidad;
                itemUsageMap[id] = (itemUsageMap[id] || 0) + qty;
            });
        }
    });

    const filteredInventory = allInventory.filter(i => {
        const isSelected = !!selectedEquipment[i.id];
        const matchSearch = i.nombre.toLowerCase().includes(equipmentSearch.toLowerCase()) || i.categoria.toLowerCase().includes(equipmentSearch.toLowerCase()) || (i.subcategoria || '').toLowerCase().includes(equipmentSearch.toLowerCase());
        const matchCategory = filterCategoria === 'todas' || i.categoria === filterCategoria;
        const matchSubcategoria = filterSubcategoria === 'todas' || i.subcategoria === filterSubcategoria;

        const enUsoHoy = itemUsageMap[i.id] || 0;
        const disponible = Math.max(0, i.cantidad - enUsoHoy);

        let computedStatus = i.estado;
        if (computedStatus === 'En Uso' && enUsoHoy === 0) {
            computedStatus = 'Disponible';
        }
        if (computedStatus === 'Disponible' && disponible <= 0) {
            computedStatus = 'En Uso';
        }

        let matchStatus = true;
        if (filterEstado === 'Disponibles') {
            matchStatus = computedStatus === 'Disponible' || isSelected;
        } else if (filterEstado !== 'todos') {
            matchStatus = computedStatus === filterEstado;
        }

        return matchSearch && matchCategory && matchSubcategoria && matchStatus;
    });

    const handlePrint = () => {
        window.print();
    };

    const applyFromPastEvent = (ev: Event, mode: 'replace' | 'merge') => {
        const incoming: Record<string, number> = {};
        (ev.equipamientoAsignado || []).forEach(item => {
            if (typeof item === 'string') incoming[item] = 1;
            else incoming[item.id] = item.cantidad;
        });

        if (mode === 'replace') {
            setSelectedEquipment(incoming);
        } else {
            // Merge: take the max quantity between current and incoming
            const merged = { ...selectedEquipment };
            Object.entries(incoming).forEach(([id, qty]) => {
                merged[id] = Math.max(merged[id] || 0, qty);
            });
            setSelectedEquipment(merged);
        }
        setCopyOpen(false);
        setCopySelected(null);
        setCopySearch('');
        toast.success(`${mode === 'replace' ? 'Reemplazado' : 'Combinado'} con el equipamiento de "${ev.nombre}"`);
    };

    return (
        <div className="space-y-6">
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
                    .no-print { display: none !important; }
                }
            `}</style>
            <ConfirmDialog
                open={!!confirmEvent}
                title="Confirmar Montaje"
                description={confirmEvent
                    ? `¿Confirmar que el montaje del evento "${confirmEvent.nombre}" ha sido completado con ${Object.keys(selectedEquipment).length} equipo(s) asignados?`
                    : ''}
                confirmLabel="Confirmar Montaje"
                variant="primary"
                loading={!!actionLoading}
                onConfirm={() => confirmEvent && ejecutarMontaje(confirmEvent)}
                onCancel={() => setConfirmEvent(null)}
            />

            <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Cantidad</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-gray-600">
                            ¿Cuántas unidades de <strong>{quantityDialogItem?.nombre}</strong> desea montar?{' '}
                            <span className="text-xs text-gray-500">(Disp: {quantityDialogItem ? Math.max(0, quantityDialogItem.cantidad - (itemUsageMap[quantityDialogItem.id] || 0)) : 0})</span>
                        </p>
                        <Input
                            type="number"
                            min={1}
                            max={quantityDialogItem ? Math.max(1, quantityDialogItem.cantidad - (itemUsageMap[quantityDialogItem.id] || 0)) : 1}
                            value={tempQuantity}
                            onChange={(e) => setTempQuantity(+e.target.value)}
                            className="w-full text-lg font-bold"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuantityDialogOpen(false)}>Cancelar</Button>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
                            if (quantityDialogItem) {
                                const enUsoHoyD = itemUsageMap[quantityDialogItem.id] || 0;
                                const maxAvailable = Math.max(0, quantityDialogItem.cantidad - enUsoHoyD);
                                const minVal = 1;
                                const maxVal = maxAvailable || 1;
                                let finalQty = parseInt(tempQuantity as any) || 1;
                                if (finalQty < minVal) finalQty = minVal;
                                if (finalQty > maxVal) finalQty = maxVal;

                                const next = { ...selectedEquipment, [quantityDialogItem.id]: finalQty };
                                if (quantityDialogItem.esContenedor && quantityDialogItem.contenidoInterno?.itemsRef?.length) {
                                    quantityDialogItem.contenidoInterno.itemsRef.forEach(refId => {
                                        const internalItem = allInventory.find(i => i.id === refId);
                                        const detalle = quantityDialogItem.contenidoInterno?.itemsDetalle?.find(d => d.id === refId);
                                        const qtyPerCase = detalle ? detalle.cantidad : 1;
                                        if (internalItem) next[refId] = finalQty * qtyPerCase;
                                    });
                                }
                                setSelectedEquipment(next);
                            }
                            setQuantityDialogOpen(false);
                        }}>Guardar Cantidad</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Copiar equipamiento de evento pasado ── */}
            <Dialog open={copyOpen} onOpenChange={(v) => { setCopyOpen(v); if (!v) { setCopySelected(null); setCopySearch(''); } }}>
                <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Copy className="h-5 w-5 text-purple-600" />
                            Copiar equipamiento de evento pasado
                        </DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">Selecciona un evento cerrado para pre-cargar su equipamiento en el checklist.</p>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col gap-3 py-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar evento o cliente..."
                                className="pl-9"
                                value={copySearch}
                                onChange={(e) => { setCopySearch(e.target.value); setCopySelected(null); }}
                                autoFocus
                            />
                        </div>

                        {pastEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 gap-2">
                                <Package className="h-10 w-10 text-gray-300" />
                                <p className="text-sm font-medium">No hay eventos cerrados con equipamiento registrado.</p>
                            </div>
                        ) : (
                            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                                {pastEvents
                                    .filter(e =>
                                        e.nombre.toLowerCase().includes(copySearch.toLowerCase()) ||
                                        e.cliente.toLowerCase().includes(copySearch.toLowerCase())
                                    )
                                    .map(ev => {
                                        const isSelected = copySelected?.id === ev.id;
                                        const itemCount = ev.equipamientoAsignado?.length || 0;
                                        const equipNames = (ev.equipamientoAsignado || [])
                                            .slice(0, 4)
                                            .map(eq => {
                                                const id = typeof eq === 'string' ? eq : eq.id;
                                                return allInventory.find(i => i.id === id)?.nombre || '?';
                                            });

                                        return (
                                            <button
                                                key={ev.id}
                                                onClick={() => setCopySelected(isSelected ? null : ev)}
                                                className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-purple-800' : 'text-gray-900'}`}>
                                                            {ev.nombre}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">{ev.cliente}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {new Date(ev.fechaInicio.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-CL')}
                                                        </p>
                                                        {equipNames.length > 0 && (
                                                            <p className="text-[11px] text-gray-500 mt-1.5 truncate">
                                                                {equipNames.join(' • ')}{itemCount > 4 ? ` +${itemCount - 4} más` : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                            {itemCount} ítem{itemCount !== 1 ? 's' : ''}
                                                        </span>
                                                        <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'text-purple-600 rotate-90' : 'text-gray-400'}`} />
                                                    </div>
                                                </div>

                                                {/* Equipment preview when selected */}
                                                {isSelected && (
                                                    <div className="mt-3 pt-3 border-t border-purple-200 grid grid-cols-2 gap-1">
                                                        {(ev.equipamientoAsignado || []).map((eq, idx) => {
                                                            const id = typeof eq === 'string' ? eq : eq.id;
                                                            const qty = typeof eq === 'string' ? 1 : eq.cantidad;
                                                            const inv = allInventory.find(i => i.id === id);
                                                            return (
                                                                <div key={idx} className="flex items-center gap-1.5 text-xs text-purple-800">
                                                                    <span className="font-bold bg-purple-100 rounded px-1 min-w-[20px] text-center">{qty}x</span>
                                                                    <span className="truncate">{inv?.nombre || 'Desconocido'}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 flex-col sm:flex-row border-t pt-4">
                        <Button variant="outline" onClick={() => setCopyOpen(false)}>Cancelar</Button>
                        <div className="flex gap-2 flex-1 sm:justify-end">
                            <Button
                                variant="outline"
                                disabled={!copySelected}
                                onClick={() => copySelected && applyFromPastEvent(copySelected, 'merge')}
                                className="border-purple-300 text-purple-700 hover:bg-purple-50 flex-1 sm:flex-none"
                            >
                                Añadir a selección
                            </Button>
                            <Button
                                disabled={!copySelected}
                                onClick={() => copySelected && applyFromPastEvent(copySelected, 'replace')}
                                className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-none"
                            >
                                Reemplazar selección
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Control de Montaje</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Confirme la salida de equipos desde la bodega hacia los eventos.</p>
                </div>
            </div>



            {checklistEvent && (
                <div className="bg-white dark:bg-gray-900 border-2 border-purple-200 dark:border-purple-900/60 rounded-xl p-5 shadow-sm space-y-4" id="print-area">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Checklist de Equipamiento para: <span className="text-purple-600">{checklistEvent.nombre}</span>
                        </h2>
                        <div className="flex gap-2 no-print">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/ficha/${checklistEvent.id}?type=montaje`} target="_blank">
                                    <Printer className="mr-2 h-4 w-4" />Imprimir Ficha
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setChecklistEvent(null)}>Cerrar</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/40 p-4 rounded-lg border border-gray-100 dark:border-gray-700/60 mt-4 mb-6">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Receptor / Cliente</p>
                            <p className="text-sm font-medium text-gray-900 mt-1 cursor-text select-all">{checklistEvent.cliente} {checklistEvent.contactoResponsable ? `(${checklistEvent.contactoResponsable})` : ''}</p>
                            {checklistEvent.telefono && <p className="text-sm text-gray-600">Tel: {checklistEvent.telefono}</p>}
                            <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Dirección:</span> {checklistEvent.direccion || 'No especificada'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Día y Horario</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                                {new Date(checklistEvent.fechaInicio.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-CL')}
                                {checklistEvent.fechaFin && checklistEvent.fechaFin !== checklistEvent.fechaInicio ? ` hasta ${new Date(checklistEvent.fechaFin.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-CL')}` : ''}
                            </p>
                            <p className="text-sm text-gray-600">{checklistEvent.horaInicio || 'Sin hora int.'} - {checklistEvent.horaFin || 'Sin hora fin'}</p>
                        </div>
                        <div className="md:col-span-2 border-t border-gray-100 pt-3 mt-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Equipo de Trabajo & Transporte</p>
                            <p className="text-sm text-gray-800">
                                <span className="font-medium">Trabajadores Asignados:</span> {
                                    checklistEvent.trabajadoresAsignados && checklistEvent.trabajadoresAsignados.length > 0
                                        ? checklistEvent.trabajadoresAsignados.map(id => allWorkers.find(w => w.id === id)?.nombre || 'Desconocido').join(', ')
                                        : 'Ninguno asignado'
                                }
                            </p>
                            {checklistEvent.vehiculoNombre && (
                                <p className="text-sm text-gray-800 mt-1"><span className="font-medium">Transporte:</span> {checklistEvent.vehiculoNombre} {checklistEvent.choferNombre ? `(Chofer: ${checklistEvent.choferNombre})` : ''}</p>
                            )}
                        </div>
                        {checklistEvent.notas && (
                            <div className="md:col-span-2 border-t border-gray-100 pt-3 mt-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Notas del Evento</p>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{checklistEvent.notas}</p>
                            </div>
                        )}
                    </div>

                    <div className="no-print mb-4 flex flex-col sm:flex-row gap-3">
                        {/* Copiar de evento pasado */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCopyOpen(true)}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50 h-10 gap-2 shrink-0"
                            title={pastEvents.length === 0 ? 'No hay eventos cerrados con equipamiento' : undefined}
                        >
                            <Copy className="h-4 w-4" />
                            <span className="hidden sm:inline">Copiar de evento pasado</span>
                            <span className="sm:hidden">Copiar</span>
                            {pastEvents.length > 0 && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {pastEvents.length}
                                </span>
                            )}
                        </Button>

                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar equipos..."
                                className="bg-gray-50 pl-9"
                                value={equipmentSearch}
                                onChange={(e) => setEquipmentSearch(e.target.value)}
                            />
                        </div>
                        <Select value={filterCategoria} onValueChange={(val) => { setFilterCategoria(val); setFilterSubcategoria('todas'); }}>
                            <SelectTrigger className="w-full sm:w-40 bg-gray-50">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c: string) => (
                                    <SelectItem key={c} value={c}>
                                        {c === 'todas' ? 'Todas las categorías' : c.charAt(0).toUpperCase() + c.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterSubcategoria} onValueChange={setFilterSubcategoria}>
                            <SelectTrigger className="w-full sm:w-40 bg-gray-50">
                                <SelectValue placeholder="Subcategoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {subcategories.map((s: string | null) => (
                                    <SelectItem key={s || 'none'} value={s || 'none'}>
                                        {s === 'todas' ? 'Todas las subcategorías' : s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterEstado} onValueChange={setFilterEstado}>
                            <SelectTrigger className="w-full sm:w-40 bg-gray-50">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Disponibles">Disponibles</SelectItem>
                                <SelectItem value="todos">Todos los estados</SelectItem>
                                <SelectItem value="Reservado">Reservado</SelectItem>
                                <SelectItem value="En Uso">En Uso</SelectItem>
                                <SelectItem value="En Mantenimiento">En Mantenimiento</SelectItem>
                                <SelectItem value="Dañado">Dañado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2 pb-2 print:max-h-none print:overflow-visible print:block">
                        {filteredInventory.map(item => {
                            const isSelected = !!selectedEquipment[item.id];
                            // Find if this item belongs to any case
                            const parentCase = allInventory.find(c => c.esContenedor && c.contenidoInterno?.itemsRef?.includes(item.id));
                            return (
                                <label
                                    key={item.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors print:mb-2 print:page-inside-avoid print:p-2 print:border-gray-200 print:bg-white print:shadow-none ${isSelected ? 'bg-purple-50 border-purple-200' : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50 print:hidden'} `}
                                >
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 accent-purple-600 rounded text-purple-600 print:hidden"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                if (item.cantidad > 1) {
                                                    setQuantityDialogItem(item);
                                                    setTempQuantity(1);
                                                    setQuantityDialogOpen(true);
                                                } else {
                                                    const next = { ...selectedEquipment, [item.id]: 1 };
                                                    if (item.esContenedor && item.contenidoInterno?.itemsRef?.length) {
                                                        item.contenidoInterno.itemsRef.forEach(refId => {
                                                            const internalItem = allInventory.find(i => i.id === refId);
                                                            const detalle = item.contenidoInterno?.itemsDetalle?.find(d => d.id === refId);
                                                            const qtyPerCase = detalle ? detalle.cantidad : 1;
                                                            if (internalItem) next[refId] = 1 * qtyPerCase;
                                                        });
                                                    }
                                                    setSelectedEquipment(next);
                                                }
                                            } else {
                                                const next = { ...selectedEquipment };
                                                delete next[item.id];
                                                if (item.esContenedor && item.contenidoInterno?.itemsRef?.length) {
                                                    item.contenidoInterno.itemsRef.forEach(refId => {
                                                        delete next[refId];
                                                    });
                                                }
                                                setSelectedEquipment(next);
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center gap-1.5 justify-between">
                                            <span className="text-sm font-semibold text-gray-900">{item.nombre}</span>
                                            <div className="flex items-center gap-1">
                                                {item.esContenedor && <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[9px] px-1 h-3.5">CASE</Badge>}
                                                {parentCase && <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[9px] px-1 h-3.5">📦 {parentCase.nombre}</Badge>}
                                            </div>
                                        </div>
                                        {(item.marca || item.modelo || item.numeroSerie) && (
                                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                {[item.marca, item.modelo, item.numeroSerie ? `S/N: ${item.numeroSerie}` : ''].filter(Boolean).join(' • ')}
                                            </span>
                                        )}
                                        <div className="flex items-center justify-between mt-0.5">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider">{item.categoria} • Disp: {Math.max(0, item.cantidad - (itemUsageMap[item.id] || 0))} / {item.cantidad}</span>
                                            {isSelected && <span className="text-xs font-bold text-purple-600">Cant: {selectedEquipment[item.id]}</span>}
                                        </div>

                                        {item.esContenedor && (
                                            <details className="mt-2 text-[11px] leading-relaxed text-purple-900 group print:block">
                                                <summary className="cursor-pointer font-bold bg-purple-50/50 border border-purple-100 rounded px-2 py-1 flex items-center justify-between text-[10px] uppercase tracking-wider hover:bg-purple-100 transition-colors list-none [&::-webkit-details-marker]:hidden">
                                                    Ver contenido del kit
                                                    <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
                                                </summary>
                                                <div className="p-2 border border-t-0 border-purple-100 rounded-b bg-white print:bg-white print:border-gray-200">
                                                    {(item.contenidoInterno?.itemsRef && item.contenidoInterno.itemsRef.length > 0) || item.contenidoInterno?.descripcion ? (
                                                        <>
                                                            {item.contenidoInterno?.itemsRef?.map(refId => {
                                                                const refItem = allInventory.find(i => i.id === refId);
                                                                const refChecked = !!selectedEquipment[refId];
                                                                const detalle = item.contenidoInterno?.itemsDetalle?.find(d => d.id === refId);
                                                                const qtyPerCase = detalle ? Number(detalle.cantidad) || 1 : 1;

                                                                return refItem ? (
                                                                    <div key={refId} className="flex items-center justify-between gap-2 py-1 mt-1 border-b border-purple-50/50 pb-1 last:border-0 hover:bg-purple-50/30 px-1 rounded transition-colors">
                                                                        <span className={refChecked ? 'text-purple-800 font-medium' : 'text-gray-600'}>
                                                                            {refItem.nombre} {qtyPerCase > 1 ? `(Max. ${qtyPerCase} uds)` : ''}
                                                                        </span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] text-gray-500 uppercase font-medium">Llevar:</span>
                                                                            <select
                                                                                value={selectedEquipment[refId] || 0}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                onChange={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const val = parseInt(e.target.value, 10);
                                                                                    const next = { ...selectedEquipment };
                                                                                    if (val > 0) {
                                                                                        next[refId] = val;
                                                                                    } else {
                                                                                        delete next[refId];
                                                                                    }
                                                                                    setSelectedEquipment(next);
                                                                                }}
                                                                                className="border border-purple-200 rounded text-xs p-1 font-bold text-purple-900 bg-white min-w-[50px] outline-none focus:ring-2 focus:ring-purple-500 transition-shadow cursor-pointer"
                                                                            >
                                                                                {[...Array(qtyPerCase + 1)].map((_, i) => (
                                                                                    <option key={i} value={i}>{i === 0 ? '0' : i}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                            {item.contenidoInterno?.descripcion && (
                                                                <p className="text-[10px] text-gray-500 mt-1 pt-1 border-t border-purple-100 font-mono">{item.contenidoInterno.descripcion}</p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="text-xs text-gray-500 italic py-1">
                                                            No hay ítems internos definidos. Puede configurarlos indicando qué equipos incluye este case desde el panel de Inventario.
                                                        </div>
                                                    )}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                        {filteredInventory.length === 0 && (
                            <p className="text-sm text-gray-500 col-span-2 text-center py-4">No se encontraron equipos para esta búsqueda.</p>
                        )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 block">Reporte de Incidentes / Notas de Montaje (Opcional)</label>
                        <textarea
                            className="w-full h-20 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow resize-none"
                            placeholder="Ej: Faltó un cable de poder, se llevó un atril extra, equipo XYZ con raspón leve..."
                            value={incidentesReportados}
                            onChange={(e) => setIncidentesReportados(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 no-print">
                        {Object.keys(selectedEquipment).length === 0 ? (
                            <span className="text-sm font-medium text-gray-400 italic">Ningún equipo seleccionado</span>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {Object.keys(selectedEquipment).length} equipo(s) seleccionado(s):
                                </p>
                                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                                    {Object.entries(selectedEquipment).map(([id, qty]) => {
                                        const it = allInventory.find(i => i.id === id);
                                        return (
                                            <span key={id} className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-full pl-2.5 pr-1.5 py-0.5 text-xs font-medium text-purple-800 whitespace-nowrap">
                                                {it?.nombre || 'Desconocido'}
                                                <span className="inline-flex items-center justify-center bg-purple-600 text-white rounded-full min-w-[18px] h-[18px] text-[10px] font-bold px-1">{qty}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button
                                size="lg"
                                className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                                onClick={() => confirmarMontaje(checklistEvent)}
                                disabled={Object.keys(selectedEquipment).length === 0}
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                {checklistEvent.montajeRealizado ? 'Actualizar Montaje' : 'Confirmar Montaje'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative max-w-md w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Buscar evento o cliente..." className="pl-9 bg-white dark:bg-gray-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* ── MOBILE CARDS ── */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full inline-block"><CalendarDays className="h-6 w-6 text-gray-400" /></div>
                        <p className="text-gray-500 dark:text-gray-400">No hay eventos pendientes de montaje.</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Los eventos en estado &quot;Agendado&quot; o &quot;En Montaje&quot; aparecerán aquí.</p>
                    </div>
                ) : filtered.map((event) => (
                    <div key={event.id} className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{event.nombre}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{event.cliente}</p>
                                {event.direccion && <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{event.direccion}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className={getStatusColor(event.estado)}>{event.estado}</Badge>
                                {event.montajeRealizado && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Fecha</p>
                                <p className="text-gray-700 dark:text-gray-300 font-medium text-xs">{new Date(event.fechaInicio.substring(0,10) + 'T00:00:00').toLocaleDateString('es-CL')}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{event.horaInicio}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Equipos</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <PackageCheck className="h-3.5 w-3.5 text-purple-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">{event.equipamientoAsignado?.length || 0}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Personal</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">{event.trabajadoresAsignados?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3">
                            {!event.montajeRealizado ? (
                                <Button
                                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                                    disabled={actionLoading === event.id || !!checklistEvent}
                                    onClick={() => {
                                        setChecklistEvent(event);
                                        const initial: Record<string, number> = {};
                                        (event.equipamientoAsignado || []).forEach(item => {
                                            if (typeof item === 'string') initial[item] = 1;
                                            else initial[item.id] = item.cantidad;
                                        });
                                        setSelectedEquipment(initial);
                                    }}
                                >
                                    <PackageCheck className="mr-1.5 h-4 w-4" />Iniciar Montaje
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button asChild size="sm" variant="outline" className="flex-1 h-10 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                        <Link href={`/ficha/${event.id}?type=montaje`} target="_blank">
                                            <Printer className="mr-1.5 h-3.5 w-3.5" />Ficha
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-10 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50"
                                        disabled={actionLoading === event.id || !!checklistEvent}
                                        onClick={() => {
                                            setChecklistEvent(event);
                                            const initial: Record<string, number> = {};
                                            (event.equipamientoAsignado || []).forEach(item => {
                                                if (typeof item === 'string') initial[item] = 1;
                                                else initial[item.id] = item.cantidad;
                                            });
                                            setSelectedEquipment(initial);
                                        }}
                                    >
                                        <Edit className="mr-1.5 h-3.5 w-3.5" />Editar
                                    </Button>
                                    <Button asChild size="sm" variant="outline" className="h-10 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400 hover:bg-orange-50 px-3">
                                        <Link href={`/desmontaje?search=${encodeURIComponent(event.nombre)}`}>
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden sm:block bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="dark:border-gray-700/60">
                            <TableHead className="w-[280px] dark:text-gray-400">Evento</TableHead>
                            <TableHead className="dark:text-gray-400">Fecha</TableHead>
                            <TableHead className="dark:text-gray-400">Equipos</TableHead>
                            <TableHead className="dark:text-gray-400">Trabajadores</TableHead>
                            <TableHead className="dark:text-gray-400">Estado</TableHead>
                            <TableHead className="dark:text-gray-400">Montaje</TableHead>
                            <TableHead className="text-right dark:text-gray-400">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">
                                <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" /></div>
                            </TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-48 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full"><CalendarDays className="h-6 w-6 text-gray-400" /></div>
                                    <p>No hay eventos pendientes de montaje.</p>
                                    <p className="text-xs text-gray-400">Los eventos en estado &quot;Agendado&quot; o &quot;En Montaje&quot; aparecerán aquí.</p>
                                </div>
                            </TableCell></TableRow>
                        ) : filtered.map((event) => (
                            <TableRow key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 dark:border-gray-700/40 transition-colors">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-gray-900 dark:text-gray-100">{event.nombre}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{event.cliente}</span>
                                        {event.direccion && <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{event.direccion}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium dark:text-gray-200">{new Date(event.fechaInicio.substring(0,10) + 'T00:00:00').toLocaleDateString('es-CL')}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{event.horaInicio}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <PackageCheck className="h-4 w-4 text-purple-500" />
                                        <span className="text-sm font-medium dark:text-gray-300">{event.equipamientoAsignado?.length || 0} ítems</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        <span className="text-sm font-medium dark:text-gray-300">{event.trabajadoresAsignados?.length || 0}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={getStatusColor(event.estado)}>{event.estado}</Badge>
                                </TableCell>
                                <TableCell>
                                    {event.montajeRealizado ? (
                                        <div className="flex items-center gap-1.5 text-green-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="text-sm font-medium">Completado</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <XCircle className="h-4 w-4" />
                                            <span className="text-sm">Pendiente</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {!event.montajeRealizado ? (
                                        <Button
                                            size="sm"
                                            disabled={actionLoading === event.id || !!checklistEvent}
                                            onClick={() => {
                                                setChecklistEvent(event);
                                                const initial: Record<string, number> = {};
                                                (event.equipamientoAsignado || []).forEach(item => {
                                                    if (typeof item === 'string') initial[item] = 1;
                                                    else initial[item.id] = item.cantidad;
                                                });
                                                setSelectedEquipment(initial);
                                            }}
                                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-8"
                                        >
                                            <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
                                            Iniciar Montaje
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-end gap-2">
                                            <Button asChild size="sm" variant="outline" className="h-8 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50">
                                                <Link href={`/ficha/${event.id}?type=montaje`} target="_blank">
                                                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                                                    Ficha
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={actionLoading === event.id || !!checklistEvent}
                                                onClick={() => {
                                                    setChecklistEvent(event);
                                                    const initial: Record<string, number> = {};
                                                    (event.equipamientoAsignado || []).forEach(item => {
                                                        if (typeof item === 'string') initial[item] = 1;
                                                        else initial[item.id] = item.cantidad;
                                                    });
                                                    setSelectedEquipment(initial);
                                                }}
                                                className="h-8 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50"
                                            >
                                                <Edit className="mr-1.5 h-3.5 w-3.5" />
                                                Editar
                                            </Button>
                                            <Button asChild size="sm" variant="outline" className="h-8 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400 hover:bg-orange-50">
                                                <Link href={`/desmontaje?search=${encodeURIComponent(event.nombre)}`}>
                                                    Desmontaje <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
