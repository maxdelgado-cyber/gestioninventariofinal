'use client';

import { useState, useEffect } from 'react';
import { PackageX, Search, CalendarDays, CheckCircle2, Package, Printer, Users, Truck, Clock } from 'lucide-react';
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
import { Event, InventoryItem, Worker, Vehicle } from '@/types/allegra';
import { eventsAPI } from '@/lib/api/events';
import { inventoryAPI } from '@/lib/api/inventory';
import { workersAPI } from '@/lib/api/workers';
import { vehiclesAPI } from '@/lib/api/vehicles';
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
    const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
    const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmEvent, setConfirmEvent] = useState<Event | null>(null);
    const [checklistEvent, setChecklistEvent] = useState<Event | null>(null);
    const [incidentes, setIncidentes] = useState('');

    // Desmontaje logistics state
    const [desmontajeWorkers, setDesmontajeWorkers] = useState<string[]>([]);
    const [desmontajeVehicleId, setDesmontajeVehicleId] = useState('');
    const [desmontajeVehicleName, setDesmontajeVehicleName] = useState('');
    const [desmontajeChoferId, setDesmontajeChoferId] = useState('');
    const [desmontajeConductorName, setDesmontajeConductorName] = useState('');
    const [fechaDesmontaje, setFechaDesmontaje] = useState('');
    const [horaDesmontajeInicio, setHoraDesmontajeInicio] = useState('');
    const [horaDesmontajeFin, setHoraDesmontajeFin] = useState('');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [evts, inv, wrk, veh] = await Promise.all([
                eventsAPI.getAll(),
                inventoryAPI.getAll(),
                workersAPI.getAll(),
                vehiclesAPI.getAll(),
            ]);
            const relevant = (evts || []).filter(e => ['Montado', 'En Desmontaje', 'Cerrado'].includes(e.estado));
            setEvents(relevant);
            setAllInventory(inv || []);
            setAllWorkers(wrk || []);
            setAllVehicles(veh || []);
        } catch { toast.error('Error al cargar datos de desmontaje'); }
        finally { setLoading(false); }
    };

    const openChecklist = (event: Event) => {
        setChecklistEvent(event);
        setDesmontajeWorkers(event.trabajadoresDesmontaje || []);
        setDesmontajeVehicleId(event.vehiculoDesmontajeId || '');
        setDesmontajeVehicleName(event.vehiculoDesmontajeNombre || '');
        setDesmontajeChoferId(event.choferDesmontajeId || '');
        setDesmontajeConductorName(event.choferDesmontajeNombre || '');
        setFechaDesmontaje(event.fechaDesmontaje || '');
        setHoraDesmontajeInicio(event.horaDesmontajeInicio || '');
        setHoraDesmontajeFin(event.horaDesmontajeFin || '');
    };

    const closeChecklist = () => {
        setChecklistEvent(null);
        setDesmontajeWorkers([]);
        setDesmontajeVehicleId('');
        setDesmontajeVehicleName('');
        setDesmontajeChoferId('');
        setDesmontajeConductorName('');
        setFechaDesmontaje('');
        setHoraDesmontajeInicio('');
        setHoraDesmontajeFin('');
        setIncidentes('');
    };

    const ejecutarDesmontaje = async (event: Event, incidentesReportados: string = '') => {
        setConfirmEvent(null);
        closeChecklist();
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
                        if (!item) throw new Error(`Item ${itemId} no encontrado`);
                        if (item.esInsumo) {
                            const newQty = Math.max(0, item.cantidad - quantityUsed);
                            await inventoryAPI.update(itemId, {
                                cantidad: newQty,
                                estado: newQty === 0 ? 'Fuera de Servicio' : item.estado,
                            });
                            consumedCount += quantityUsed;
                        } else {
                            returnedCount += quantityUsed;
                        }
                    })
                );
                fallidos = results.filter(r => r.status === 'rejected').length;
            }

            const updatePayload: Record<string, any> = {
                desmontaljeRealizado: true,
                estado: 'Cerrado',
                trabajadoresDesmontaje: desmontajeWorkers,
                ...(desmontajeVehicleId ? { vehiculoDesmontajeId: desmontajeVehicleId, vehiculoDesmontajeNombre: desmontajeVehicleName } : {}),
                ...(desmontajeChoferId ? { choferDesmontajeId: desmontajeChoferId, choferDesmontajeNombre: desmontajeConductorName } : {}),
                ...(fechaDesmontaje ? { fechaDesmontaje } : {}),
                ...(horaDesmontajeInicio ? { horaDesmontajeInicio } : {}),
                ...(horaDesmontajeFin ? { horaDesmontajeFin } : {}),
            };
            if (incidentesReportados.trim()) {
                updatePayload.incidencias = incidentesReportados.trim().split('\n').map(s => s.trim()).filter(Boolean);
            }

            try {
                await eventsAPI.update(event.id, updatePayload);
            } catch (evtErr: any) {
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
        } catch (e: any) {
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

    const pending = filtered.filter(e => !e.desmontaljeRealizado && e.estado !== 'Cerrado');
    const closed = filtered.filter(e => e.desmontaljeRealizado || e.estado === 'Cerrado');

    const activeWorkers = allWorkers.filter(w => w.estado === 'Activo');

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
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Desmontaje: <span className="text-orange-600">{checklistEvent.nombre}</span>
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/ficha/${checklistEvent.id}?type=desmontaje`} target="_blank">
                                    <Printer className="mr-2 h-4 w-4" />Imprimir Ficha
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={closeChecklist}>Cancelar</Button>
                        </div>
                    </div>

                    {/* ── Logistics form ── */}
                    <div className="bg-orange-50/60 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 space-y-4">
                        <h3 className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider flex items-center gap-2">
                            <Truck className="h-3.5 w-3.5" />Logística del Desmontaje
                        </h3>

                        {/* Date + Times */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />Fecha de Desmontaje
                                </label>
                                <Input
                                    type="date"
                                    value={fechaDesmontaje}
                                    onChange={(e) => setFechaDesmontaje(e.target.value)}
                                    className="bg-white dark:bg-gray-800 h-9"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-1">
                                    <Clock className="h-3 w-3" />Hora Inicio
                                </label>
                                <Input
                                    type="time"
                                    value={horaDesmontajeInicio}
                                    onChange={(e) => setHoraDesmontajeInicio(e.target.value)}
                                    className="bg-white dark:bg-gray-800 h-9"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-1">
                                    <Clock className="h-3 w-3" />Hora Término
                                </label>
                                <Input
                                    type="time"
                                    value={horaDesmontajeFin}
                                    onChange={(e) => setHoraDesmontajeFin(e.target.value)}
                                    className="bg-white dark:bg-gray-800 h-9"
                                />
                            </div>
                        </div>

                        {/* Vehicle + Driver */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                                    Vehículo de Transporte
                                </label>
                                <Select
                                    value={desmontajeVehicleId || '_none'}
                                    onValueChange={(val) => {
                                        if (val === '_none') {
                                            setDesmontajeVehicleId('');
                                            setDesmontajeVehicleName('');
                                        } else {
                                            const v = allVehicles.find(v => v.id === val);
                                            if (v) { setDesmontajeVehicleId(v.id); setDesmontajeVehicleName(v.nombre); }
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-white dark:bg-gray-800 h-9">
                                        <SelectValue placeholder="Sin vehículo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">Sin vehículo</SelectItem>
                                        {allVehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id}>
                                                {v.nombre} — {v.patente}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                                    Conductor
                                </label>
                                <Select
                                    value={desmontajeChoferId || '_none'}
                                    onValueChange={(val) => {
                                        if (val === '_none') {
                                            setDesmontajeChoferId('');
                                            setDesmontajeConductorName('');
                                        } else {
                                            const w = allWorkers.find(w => w.id === val);
                                            if (w) { setDesmontajeChoferId(w.id); setDesmontajeConductorName(`${w.nombre} ${w.apellido}`); }
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-white dark:bg-gray-800 h-9">
                                        <SelectValue placeholder="Sin conductor asignado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">Sin conductor</SelectItem>
                                        {activeWorkers.map(w => (
                                            <SelectItem key={w.id} value={w.id}>
                                                {w.nombre} {w.apellido}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Workers multi-select */}
                        <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />Trabajadores Asignados al Desmontaje
                                {desmontajeWorkers.length > 0 && (
                                    <span className="bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{desmontajeWorkers.length}</span>
                                )}
                            </label>
                            {activeWorkers.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {activeWorkers.map(w => {
                                        const isSelected = desmontajeWorkers.includes(w.id);
                                        return (
                                            <button
                                                key={w.id}
                                                type="button"
                                                onClick={() => setDesmontajeWorkers(prev =>
                                                    isSelected ? prev.filter(id => id !== w.id) : [...prev, w.id]
                                                )}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-orange-600 text-white border-orange-600'
                                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-orange-400'
                                                }`}
                                            >
                                                {w.nombre} {w.apellido}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400">No hay trabajadores activos registrados.</p>
                            )}
                        </div>
                    </div>

                    {/* Checklist */}
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

                    {/* Incidents */}
                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reporte de Incidentes (Opcional)</label>
                        <textarea
                            className="w-full min-h-[80px] p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ej: Faltan 2 cables XLR, case rayado, etc."
                            value={incidentes}
                            onChange={(e) => setIncidentes(e.target.value)}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                            onClick={() => ejecutarDesmontaje(checklistEvent, '')}
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
                                <div key={event.id} className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-orange-200 dark:border-orange-900/50 border-l-4 border-l-orange-500 p-4 shadow-sm">
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
                                            onClick={() => openChecklist(event)}
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
                                        <TableRow key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 dark:border-gray-700/40 transition-colors border-l-4 border-l-orange-500">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                                        <span className="text-gray-900 dark:text-gray-100">{event.nombre}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 pl-4">{event.cliente}</span>
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
                                                            <Printer className="mr-1.5 h-3.5 w-3.5" />Ficha
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={actionLoading === event.id || !!checklistEvent}
                                                        onClick={() => openChecklist(event)}
                                                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-8"
                                                    >
                                                        <PackageX className="mr-1.5 h-3.5 w-3.5" />Recepción
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
                                                        <Printer className="mr-1.5 h-3.5 w-3.5" />Ficha
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
