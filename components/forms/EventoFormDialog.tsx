'use client';

import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Event, Client, InventoryItem, Worker, Vehicle, AssignedEquipment } from '@/types/allegra';
import { eventsAPI } from '@/lib/api/events';
import { clientsAPI } from '@/lib/api/clients';
import { inventoryAPI } from '@/lib/api/inventory';
import { workersAPI } from '@/lib/api/workers';
import { vehiclesAPI } from '@/lib/api/vehicles';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    event?: Event | null;
}

const defaultForm = {
    nombre: '',
    clienteId: '',
    clienteNombre: '',
    tipoEvento: 'Corporativo' as Event['tipoEvento'],
    estado: 'Agendado' as Event['estado'],
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '09:00',
    horaFin: '18:00',
    direccion: '',
    valorTotal: 0,
    estadoPago: 'Pendiente' as any,
    montoPagado: 0,
    notas: '',
    equipamientoAsignado: [] as (string | AssignedEquipment)[],
    trabajadoresAsignados: [] as string[],
    vehiculosAsignados: [] as string[],
    choferId: '',
    choferNombre: '',
    vehiculoId: '',
    vehiculoNombre: '',
    montajeRealizado: false,
    desmontaljeRealizado: false,
    contactoResponsable: '',
    telefono: '',
    email: '',
};

export function EventoFormDialog({ open, onClose, onSaved, event }: Props) {
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!open) return;
        setLoadingData(true);
        Promise.all([
            eventsAPI.getAll(),
            clientsAPI.getAll(),
            inventoryAPI.getAll(),
            workersAPI.getAll(),
            vehiclesAPI.getAll(),
        ]).then(([e, c, i, w, v]) => {
            setEvents(e);
            setClients(c);
            setInventory(i);
            setWorkers(w);
            setVehicles(v);
        }).catch(() => toast.error('Error al cargar datos relacionados')).finally(() => setLoadingData(false));
    }, [open]);

    useEffect(() => {
        if (event) {
            setForm({
                nombre: event.nombre,
                clienteId: '',
                clienteNombre: event.cliente,
                tipoEvento: event.tipoEvento,
                estado: event.estado,
                fechaInicio: event.fechaInicio,
                fechaFin: event.fechaFin,
                horaInicio: event.horaInicio,
                horaFin: event.horaFin,
                direccion: event.direccion,
                valorTotal: event.valorTotal,
                estadoPago: event.estadoPago || 'Pendiente de pago',
                montoPagado: event.montoPagado || 0,
                notas: event.notas || '',
                equipamientoAsignado: event.equipamientoAsignado || [],
                trabajadoresAsignados: event.trabajadoresAsignados || [],
                vehiculosAsignados: event.vehiculosAsignados || [],
                choferId: event.choferId || '',
                choferNombre: event.choferNombre || '',
                vehiculoId: event.vehiculoId || '',
                vehiculoNombre: event.vehiculoNombre || '',
                montajeRealizado: event.montajeRealizado,
                desmontaljeRealizado: event.desmontaljeRealizado,
                contactoResponsable: event.contactoResponsable,
                telefono: event.telefono,
                email: event.email,
            });
        } else {
            setForm(defaultForm);
        }
    }, [event, open]);

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.clienteNombre.trim() || !form.fechaInicio || !form.direccion.trim()) {
            toast.error('Nombre, cliente, fecha y dirección son requeridos.');
            return;
        }
        if (form.fechaFin && form.fechaFin < form.fechaInicio) {
            toast.error('La fecha de fin no puede ser anterior a la fecha de inicio.');
            return;
        }
        if (form.fechaInicio === form.fechaFin && form.horaFin && form.horaInicio && form.horaFin <= form.horaInicio) {
            toast.error('La hora de fin debe ser posterior a la hora de inicio.');
            return;
        }
        // Removed money validation block
        try {
            setSaving(true);
            const now = new Date().toISOString();
            const payload: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
                nombre: form.nombre,
                cliente: form.clienteNombre,
                contactoResponsable: form.contactoResponsable,
                telefono: form.telefono,
                email: form.email,
                tipoEvento: form.tipoEvento,
                estado: form.estado,
                fechaInicio: form.fechaInicio,
                fechaFin: form.fechaFin || form.fechaInicio,
                horaInicio: form.horaInicio,
                horaFin: form.horaFin,
                direccion: form.direccion,
                valorTotal: form.valorTotal,
                estadoPago: form.estadoPago,
                montoPagado: form.montoPagado,
                notas: form.notas,
                equipamientoAsignado: form.equipamientoAsignado,
                trabajadoresAsignados: form.trabajadoresAsignados,
                vehiculosAsignados: form.vehiculosAsignados,
                choferId: form.choferId,
                choferNombre: form.choferNombre,
                vehiculoId: form.vehiculoId,
                vehiculoNombre: form.vehiculoNombre,
                montajeRealizado: form.montajeRealizado,
                desmontaljeRealizado: form.desmontaljeRealizado,
            };
            if (event) {
                await eventsAPI.update(event.id, payload);
                toast.success('Evento actualizado');
            } else {
                await eventsAPI.create(payload);
                toast.success('Evento creado correctamente');
            }
            onSaved();
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'Error al guardar el evento');
        } finally {
            setSaving(false);
        }
    };

    const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

    const toggleItem = (list: string[], id: string): string[] =>
        list.includes(id) ? list.filter(x => x !== id) : [...list, id];

    // Logica de validacion de disponibilidad por fecha
    const isDateOverlapping = (ev: Event) => {
        if (!form.fechaInicio) return false;

        const fReqStart = new Date(`${form.fechaInicio}T${form.horaInicio || '00:00'}:00`);
        const fReqEnd = new Date(`${form.fechaFin || form.fechaInicio}T${form.horaFin || '23:59'}:59`);

        const evStart = new Date(`${ev.fechaInicio}T${ev.horaInicio || '00:00'}:00`);
        const evEnd = new Date(`${ev.fechaFin || ev.fechaInicio}T${ev.horaFin || '23:59'}:59`);

        return fReqStart <= evEnd && fReqEnd >= evStart;
    };

    const overlappingEvents = events.filter(e =>
        e.id !== event?.id &&
        e.estado !== 'Cerrado' &&
        e.estado !== 'Cancelado' &&
        isDateOverlapping(e)
    );

    const availableInventory = inventory.filter(i => {
        // If it's already assigned to this exact event we are editing, obviously keep it visible
        const isCurrentAssigned = form.equipamientoAsignado.some(eq => (typeof eq === 'string' ? eq : eq.id) === i.id);
        if (isCurrentAssigned) return true;

        // An item cannot be used if its status is 'Dañado' or 'En Mantenimiento' etc, except 'Disponible' / 'En Uso' / 'Reservado'
        if (i.estado === 'Dañado' || i.estado === 'En Mantenimiento' || i.estado === 'Fuera de Servicio') {
            return false;
        }

        // Check how much of this item is used in overlapping events
        let usedQuantity = 0;
        for (const ovEv of overlappingEvents) {
            for (const eq of ovEv.equipamientoAsignado) {
                const eqId = typeof eq === 'string' ? eq : eq.id;
                const eqQtty = typeof eq === 'string' ? 1 : eq.cantidad || 1;
                if (eqId === i.id) {
                    usedQuantity += eqQtty;
                }
            }
        }

        // It is available if the remaining quantity is > 0
        return (i.cantidad - usedQuantity) > 0;
    });

    const activeWorkers = workers.filter(w => w.estado === 'Activo');
    const availableVehicles = vehicles.filter(v => v.estado === 'Disponible' || form.vehiculosAsignados.includes(v.id));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {event ? 'Editar Evento' : 'Nuevo Evento'}
                    </DialogTitle>
                </DialogHeader>

                {loadingData ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        {/* Basic Info */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>Nombre del Evento *</Label>
                            <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="ej. Lanzamiento Producto Empresa XYZ" />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Cliente (Buscar o Crear) *</Label>
                            <div className="flex flex-col gap-2">
                                <Select
                                    value={form.clienteId || '__custom__'}
                                    onValueChange={(v) => {
                                        if (v === '__custom__') {
                                            set('clienteId', '');
                                            set('clienteNombre', '');
                                            return;
                                        }
                                        const c = clients.find(c => c.id === v);
                                        if (c) {
                                            set('clienteId', c.id);
                                            set('clienteNombre', c.nombre);
                                            set('contactoResponsable', c.contactoResponsable);
                                            set('telefono', c.telefono);
                                            set('email', c.email);
                                        }
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Seleccionar de la lista..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__custom__">Escribir nombre manualmente...</SelectItem>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!form.clienteId && (
                                    <Input value={form.clienteNombre} onChange={(e) => set('clienteNombre', e.target.value)} placeholder="Escriba el nombre del cliente..." autoFocus />
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Tipo de Evento</Label>
                            <Select value={form.tipoEvento} onValueChange={(v) => set('tipoEvento', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['Corporativo', 'Concierto', 'Boda', 'Fiesta en Domicilio', 'Festival', 'Teatro', 'Otro'].map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>



                        <div className="space-y-1.5">
                            <Label>Estado de Pago</Label>
                            <Select value={form.estadoPago || 'Pendiente'} onValueChange={(v) => set('estadoPago', v as any)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                    <SelectItem value="Abonado">Abonado</SelectItem>
                                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Fecha Inicio *</Label>
                            <Input type="date" value={form.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Fecha Fin</Label>
                            <Input type="date" value={form.fechaFin} onChange={(e) => set('fechaFin', e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Hora Inicio</Label>
                            <Input type="time" value={form.horaInicio} onChange={(e) => set('horaInicio', e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Hora Fin</Label>
                            <Input type="time" value={form.horaFin} onChange={(e) => set('horaFin', e.target.value)} />
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>Dirección *</Label>
                            <Input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Calle y número, ciudad" />
                        </div>


                        {/* Equipment - Removed per user request, will be done via Montaje */}

                        {/* Workers multi-select */}
                        {activeWorkers.length > 0 && (
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label>Trabajadores Asignados</Label>
                                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1.5 bg-gray-50">
                                    {activeWorkers.map(w => (
                                        <label key={w.id} className="flex items-center gap-3 cursor-pointer hover:bg-white rounded p-1.5 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={form.trabajadoresAsignados.includes(w.id)}
                                                onChange={() => set('trabajadoresAsignados', toggleItem(form.trabajadoresAsignados, w.id))}
                                                className="h-4 w-4 accent-purple-600"
                                            />
                                            <span className="text-sm font-medium text-gray-800">{w.nombre} {w.apellido} — <span className="text-gray-500">{w.cargo}</span></span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vehicle + driver */}
                        {availableVehicles.length > 0 && (
                            <>
                                <div className="space-y-1.5">
                                    <Label>Vehículo Principal</Label>
                                    <Select
                                        value={form.vehiculoId || '__none__'}
                                        onValueChange={(v) => {
                                            if (v === '__none__') {
                                                set('vehiculoId', '');
                                                set('vehiculoNombre', '');
                                                return;
                                            }
                                            const vehicle = availableVehicles.find(v2 => v2.id === v);
                                            if (vehicle) {
                                                set('vehiculoId', vehicle.id);
                                                set('vehiculoNombre', vehicle.nombre);
                                            }
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Sin vehículo" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">Sin vehículo</SelectItem>
                                            {availableVehicles.map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.nombre} ({v.patente})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Chofer Asignado</Label>
                                    <Select
                                        value={form.choferId || '__none__'}
                                        onValueChange={(v) => {
                                            if (v === '__none__') {
                                                set('choferId', '');
                                                set('choferNombre', '');
                                                return;
                                            }
                                            const w = activeWorkers.find(w2 => w2.id === v);
                                            if (w) {
                                                set('choferId', w.id);
                                                set('choferNombre', `${w.nombre} ${w.apellido}`);
                                            }
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Sin chofer" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">Sin chofer</SelectItem>
                                            {activeWorkers.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.nombre} {w.apellido}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>Notas</Label>
                            <Textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Instrucciones especiales, detalles del cliente..." rows={3} />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loadingData}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                        {saving ? 'Guardando...' : event ? 'Actualizar Evento' : 'Crear Evento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
