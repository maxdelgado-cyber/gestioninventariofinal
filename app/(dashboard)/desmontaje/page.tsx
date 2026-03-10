'use client';

import { useState, useEffect } from 'react';
import { PackageX, Search, CalendarDays, CheckCircle2, XCircle, ArrowDownCircle, Package, Printer } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Event, InventoryItem } from '@/types/allegra';
import { eventsAPI } from '@/lib/api/events';
import { inventoryAPI } from '@/lib/api/inventory';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EventChecklist } from '@/components/ui/checklist';

const DESMONTAJE_ITEMS = [
    'Verificación de equipos en lugar del evento',
    'Revisión visual de daños realizada',
    'Reportes de incidentes completados (si aplica)'
];

export default function DesmontajePage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmEvent, setConfirmEvent] = useState<Event | null>(null);
    const [checklistEvent, setChecklistEvent] = useState<Event | null>(null);
    const [incidentes, setIncidentes] = useState('');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [evts, inv] = await Promise.all([eventsAPI.getAll(), inventoryAPI.getAll()]);
            // Show only events that are "Montado" or "En Desmontaje" (ready to be returned)
            const relevant = (evts || []).filter(e => ['Montado', 'En Desmontaje', 'Cerrado'].includes(e.estado));
            setEvents(relevant);
            setAllInventory(inv || []);
        } catch { toast.error('Error al cargar datos de desmontaje'); }
        finally { setLoading(false); }
    };

    const ejecutarDesmontaje = async (event: Event, incidentesReportados: string = '') => {
        setConfirmEvent(null);
        setChecklistEvent(null);
        setActionLoading(event.id);
        try {
            let returnedCount = 0;
            let consumedCount = 0;
            let fallidos = 0;

            if (event.equipamientoAsignado && event.equipamientoAsignado.length > 0) {
                const results = await Promise.allSettled(
                    event.equipamientoAsignado.map(async (assignedItem) => {
                        const itemId = typeof assignedItem === 'string' ? assignedItem : assignedItem.id;
                        const quantityUsed = typeof assignedItem === 'string' ? 1 : assignedItem.cantidad;

                        const item = allInventory.find(i => i.id === itemId);
                        if (!item) {
                            console.warn(`[Desmontaje] Item ${itemId} no encontrado en inventario local`);
                            throw new Error(`Item ${itemId} no encontrado`);
                        }

                        if (item.esInsumo) {
                            // Insumos: reduce quantity by what was used
                            const newQty = Math.max(0, item.cantidad - quantityUsed);
                            await inventoryAPI.update(itemId, {
                                cantidad: newQty,
                                estado: newQty === 0 ? 'Fuera de Servicio' : item.estado,
                            });
                            consumedCount += quantityUsed;
                        } else {
                            // Regular equipment: no DB state update needed as usage is dynamically computed
                            returnedCount += quantityUsed;
                        }
                    })
                );
                fallidos = results.filter(r => r.status === 'rejected').length;
                if (fallidos > 0) {
                    console.warn(`[Desmontaje] ${fallidos} equipo(s) fallaron al actualizarse en DB`);
                }
            }

            // Mark event as closed and persist incidents
            const updatePayload: Record<string, any> = {
                desmontaljeRealizado: true,
                estado: 'Cerrado',
            };
            if (incidentesReportados.trim()) {
                updatePayload.incidencias = incidentesReportados.trim().split('\n').map(s => s.trim()).filter(Boolean);
            }

            try {
                await eventsAPI.update(event.id, updatePayload);
            } catch (evtErr: any) {
                console.error('[Desmontaje] Error actualizando evento:', evtErr);
                toast.error(`Error al actualizar el evento: ${evtErr?.message || 'No se pudo guardar'}. Intente de nuevo.`);
                return;
            }

            const parts = [];
            if (returnedCount > 0) parts.push(`${returnedCount} equipo(s) retornado(s)`);
            if (consumedCount > 0) parts.push(`${consumedCount} insumo(s) consumido(s)`);
            if (fallidos > 0) parts.push(`${fallidos} omitidos por error`);

            if (incidentesReportados.trim() || fallidos > 0) {
                toast.warning(`Desmontaje completado con observaciones. ${parts.join(', ')}.`, { duration: 6000 });
            } else {
                toast.success(`✓ Desmontaje completado. ${parts.join(', ')}.`);
            }
            loadAll();
            setIncidentes('');
        } catch (e: any) {
            console.error('[Desmontaje] Error general:', e);
            toast.error(e?.message || 'Error al confirmar el desmontaje');
        } finally {
            setActionLoading(null);
        }
    };

    const confirmarDesmontaje = (event: Event) => {
        setConfirmEvent(event);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Montado': return 'bg-green-100 text-green-700 border-green-200';
            case 'En Desmontaje': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Cerrado': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filtered = events.filter(e =>
        e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.cliente.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // AL-6 FIX: Exclude already-closed events from pending list to prevent double desmontaje
    const pending = filtered.filter(e => !e.desmontaljeRealizado && e.estado !== 'Cerrado');
    const closed = filtered.filter(e => e.desmontaljeRealizado || e.estado === 'Cerrado');

    return (
        <div className="space-y-6">
            <ConfirmDialog
                open={!!confirmEvent}
                title="Confirmar Desmontaje"
                description={confirmEvent
                    ? `¿Confirmar retorno de equipos del evento "${confirmEvent.nombre}"?\n\nLos equipos regulares volverán a "Disponible". Los Insumos tendrán su cantidad reducida. Total: ${confirmEvent.equipamientoAsignado?.length || 0} ítem(s).`
                    : ''}
                confirmLabel="Confirmar Retorno"
                variant="primary"
                loading={!!actionLoading}
                onConfirm={() => confirmEvent && ejecutarDesmontaje(confirmEvent)}
                onCancel={() => setConfirmEvent(null)}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Control de Desmontaje</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Registre el retorno de equipos desde eventos hacia la bodega.</p>
                </div>
            </div>



            {checklistEvent && (
                <div className="bg-white dark:bg-gray-900 border-2 border-orange-200 dark:border-orange-900/60 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Desmontaje para: <span className="text-orange-600">{checklistEvent.nombre}</span>
                        </h2>
                        <div className="flex gap-2 no-print">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/ficha/${checklistEvent.id}?type=desmontaje`} target="_blank">
                                    <Printer className="mr-2 h-4 w-4" />Imprimir Ficha
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setChecklistEvent(null)}>Cancelar</Button>
                        </div>
                    </div>

                    <EventChecklist
                        storageKey="checklist_desmontaje"
                        eventId={checklistEvent.id}
                        title="Checklist de Equipamiento Desmontado"
                        defaultItems={[
                            ...DESMONTAJE_ITEMS,
                            ...(checklistEvent.equipamientoAsignado || [])
                                .map(item => {
                                    const id = typeof item === 'string' ? item : item.id;
                                    const qty = typeof item === 'string' ? 1 : item.cantidad;
                                    const invItem = allInventory.find(i => i.id === id);
                                    if (!invItem) return null;
                                    const specs = [invItem.marca, invItem.modelo, invItem.numeroSerie ? `S/N: ${invItem.numeroSerie}` : ''].filter(Boolean).join(' • ');
                                    return `Chequeado: ${qty}x ${invItem.nombre}${specs ? ` (${specs})` : ''}`;
                                })
                                .filter(Boolean) as string[]
                        ]}
                    />

                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reporte de Incidentes (Opcional)</label>
                        <textarea
                            className="w-full min-h-[80px] p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ej: Faltan 2 cables XLR, case rayado, etc."
                            value={incidentes}
                            onChange={(e) => setIncidentes(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                            onClick={() => {
                                toast.success("Marcando todos los ítems como correctos.");
                                ejecutarDesmontaje(checklistEvent, '');
                            }}
                        >
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Todo Correcto (Retorno Exprés)
                        </Button>

                        <Button
                            size="lg"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => ejecutarDesmontaje(checklistEvent, incidentes)}
                        >
                            <PackageX className="mr-2 h-5 w-5" />
                            Finalizar Desmontaje
                        </Button>
                    </div>
                </div>
            )}

            <div className="relative max-w-md w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Buscar evento o cliente..." className="pl-9 bg-white dark:bg-gray-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Pending desmontaje */}
            {pending.length > 0 && (
                <>
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Pendientes de Retorno</h2>
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">{pending.length}</Badge>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-3">
                        {pending.map((event) => {
                            const invItems = allInventory.filter(i => event.equipamientoAsignado?.includes(i.id));
                            const regularCount = invItems.filter(i => !i.esInsumo).length;
                            const insumoCount = invItems.filter(i => i.esInsumo).length;
                            return (
                                <div key={event.id} className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-orange-200 dark:border-orange-900/50 p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{event.nombre}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{event.cliente}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{new Date(event.fechaInicio.substring(0,10) + 'T00:00:00').toLocaleDateString('es-CL')}</p>
                                        </div>
                                        <Badge variant="outline" className={getStatusColor(event.estado)}>{event.estado}</Badge>
                                    </div>
                                    <div className="mt-2 flex flex-col gap-0.5">
                                        {regularCount > 0 && <div className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5 text-blue-500" /><span className="text-xs text-gray-700 dark:text-gray-300">{regularCount} equipo(s) a devolver</span></div>}
                                        {insumoCount > 0 && <div className="flex items-center gap-1.5"><span className="text-orange-500 font-bold text-[10px]">I</span><span className="text-xs text-orange-700 dark:text-orange-400">{insumoCount} insumo(s) consumido(s)</span></div>}
                                        {invItems.length === 0 && <span className="text-xs text-gray-400">Sin equipos asignados</span>}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button asChild size="sm" variant="outline" className="flex-1 h-11 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                            <Link href={`/ficha/${event.id}?type=desmontaje`} target="_blank">
                                                <Printer className="mr-1.5 h-3.5 w-3.5" />Ficha
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={actionLoading === event.id || !!checklistEvent}
                                            onClick={() => setChecklistEvent(event)}
                                            className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                                        >
                                            <PackageX className="mr-1.5 h-3.5 w-3.5" />Recepción
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-lg shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                                <TableRow className="dark:border-gray-700/60">
                                    <TableHead className="w-[280px] dark:text-gray-400">Evento</TableHead>
                                    <TableHead className="dark:text-gray-400">Fecha</TableHead>
                                    <TableHead className="dark:text-gray-400">Equipos a Retornar</TableHead>
                                    <TableHead className="dark:text-gray-400">Estado Evento</TableHead>
                                    <TableHead className="text-right dark:text-gray-400">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pending.map((event) => {
                                    const items = allInventory.filter(i => event.equipamientoAsignado?.includes(i.id));
                                    const regularCount = items.filter(i => !i.esInsumo).length;
                                    const insumoCount = items.filter(i => i.esInsumo).length;
                                    return (
                                        <TableRow key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 dark:border-gray-700/40 transition-colors">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 dark:text-gray-100">{event.nombre}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{event.cliente}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm dark:text-gray-300">{new Date(event.fechaInicio.substring(0,10) + 'T00:00:00').toLocaleDateString('es-CL')}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    {regularCount > 0 && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Package className="h-3.5 w-3.5 text-blue-500" />
                                                            <span className="text-xs text-gray-700 dark:text-gray-300">{regularCount} equipo(s) a devolver</span>
                                                        </div>
                                                    )}
                                                    {insumoCount > 0 && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="h-3.5 w-3.5 flex items-center justify-center text-orange-500 font-bold text-[10px]">I</span>
                                                            <span className="text-xs text-orange-700 dark:text-orange-400">{insumoCount} insumo(s) consumido(s)</span>
                                                        </div>
                                                    )}
                                                    {items.length === 0 && <span className="text-xs text-gray-400">Sin equipos asignados</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(event.estado)}>{event.estado}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button asChild size="sm" variant="outline" className="h-8 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50">
                                                        <Link href={`/ficha/${event.id}?type=desmontaje`} target="_blank">
                                                            <Printer className="mr-1.5 h-3.5 w-3.5" />
                                                            Ficha
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={actionLoading === event.id || !!checklistEvent}
                                                        onClick={() => setChecklistEvent(event)}
                                                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-8"
                                                    >
                                                        <PackageX className="mr-1.5 h-3.5 w-3.5" />
                                                        Recepción
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {/* Closed events */}
            {closed.length > 0 && (
                <>
                    <div className="flex items-center gap-2 mt-2">
                        <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Desmontajes Completados</h2>
                        <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">{closed.length}</Badge>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-2 opacity-75">
                        {closed.map((event) => (
                            <div key={event.id} className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-gray-700/40 p-3 shadow-sm flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-600 dark:text-gray-400 font-medium text-sm truncate">{event.nombre}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{event.cliente} • {new Date(event.fechaInicio.substring(0,10) + 'T00:00:00').toLocaleDateString('es-CL')}</p>
                                </div>
                                <Button asChild size="sm" variant="outline" className="h-9 shrink-0 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                    <Link href={`/ficha/${event.id}?type=desmontaje`} target="_blank">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-lg shadow-sm overflow-hidden opacity-75">
                        <Table>
                            <TableBody>
                                {closed.map((event) => (
                                    <TableRow key={event.id} className="text-gray-400 dark:border-gray-700/40">
                                        <TableCell className="w-[280px]">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-gray-600 dark:text-gray-400 font-medium">{event.nombre}</span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">{event.cliente}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm dark:text-gray-500">{new Date(event.fechaInicio.substring(0,10) + 'T00:00:00').toLocaleDateString('es-CL')}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-gray-100 text-gray-600">Cerrado</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="text-xs text-gray-400 italic">Retorno completado ✓</span>
                                                <Button asChild size="sm" variant="outline" className="h-8 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-400 hover:bg-gray-50">
                                                    <Link href={`/ficha/${event.id}?type=desmontaje`} target="_blank">
                                                        <Printer className="mr-1.5 h-3.5 w-3.5" />
                                                        Ficha
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {/* Empty state */}
            {filtered.length === 0 && !loading && (
                <div className="bg-white border rounded-lg shadow-sm h-48 flex flex-col items-center justify-center text-gray-500 space-y-3">
                    <div className="bg-gray-100 p-3 rounded-full"><CalendarDays className="h-6 w-6 text-gray-400" /></div>
                    <p>No hay eventos montados pendientes de desmontaje.</p>
                    <p className="text-xs text-gray-400">Los eventos en estado &quot;Montado&quot; aparecerán aquí cuando estén listos para retorno.</p>
                </div>
            )}
        </div>
    );
}
