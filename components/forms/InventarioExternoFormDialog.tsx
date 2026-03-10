'use client';

import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { InventarioExterno, ItemInventarioExterno, Worker, Event } from '@/types/allegra';
import { inventarioExternoAPI } from '@/lib/api/inventarioExterno';
import { workersAPI } from '@/lib/api/workers';
import { eventsAPI } from '@/lib/api/events';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    item?: InventarioExterno | null;
}

const emptyItem = (): ItemInventarioExterno => ({
    id: crypto.randomUUID(),
    nombre: '',
    cantidad: 1,
    categoria: '',
    marca: '',
    modelo: '',
    estado: '',
    notas: '',
});

const defaultForm = {
    nombre: '',
    trabajadorId: '',
    trabajadorNombre: '',
    eventoId: '',
    eventoNombre: '',
    fechaEntrega: new Date().toISOString().split('T')[0],
    fechaDevolucion: '',
    estado: 'Activo' as InventarioExterno['estado'],
    items: [emptyItem()],
    notas: '',
};

export function InventarioExternoFormDialog({ open, onClose, onSaved, item }: Props) {
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        if (open) {
            workersAPI.getAll().then(setWorkers).catch(console.error);
            eventsAPI.getAll().then(setEvents).catch(console.error);
        }
    }, [open]);

    useEffect(() => {
        if (item) {
            setForm({
                nombre: item.nombre,
                trabajadorId: item.trabajadorId,
                trabajadorNombre: item.trabajadorNombre,
                eventoId: item.eventoId || '',
                eventoNombre: item.eventoNombre || '',
                fechaEntrega: item.fechaEntrega,
                fechaDevolucion: item.fechaDevolucion || '',
                estado: item.estado,
                items: item.items.length > 0 ? item.items : [emptyItem()],
                notas: item.notas || '',
            });
        } else {
            setForm(defaultForm);
        }
    }, [item, open]);

    const handleWorkerChange = (id: string) => {
        const w = workers.find(w => w.id === id);
        setForm(f => ({ ...f, trabajadorId: id, trabajadorNombre: w ? `${w.nombre} ${w.apellido}` : '' }));
    };

    const handleEventChange = (id: string) => {
        if (id === '__none__') {
            setForm(f => ({ ...f, eventoId: '', eventoNombre: '' }));
            return;
        }
        const e = events.find(e => e.id === id);
        setForm(f => ({ ...f, eventoId: id, eventoNombre: e?.nombre || '' }));
    };

    const updateItem = (index: number, field: keyof ItemInventarioExterno, value: string | number) => {
        setForm(f => {
            const items = [...f.items];
            items[index] = { ...items[index], [field]: value };
            return { ...f, items };
        });
    };

    const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));

    const removeItem = (index: number) => {
        setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
    };

    const handleSave = async () => {
        if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
        if (!form.trabajadorId) { toast.error('Debe seleccionar un trabajador'); return; }
        if (!form.fechaEntrega) { toast.error('La fecha de entrega es obligatoria'); return; }
        const validItems = form.items.filter(it => it.nombre.trim());
        if (validItems.length === 0) { toast.error('Debe agregar al menos un ítem'); return; }

        setSaving(true);
        try {
            const payload = {
                nombre: form.nombre.trim(),
                trabajadorId: form.trabajadorId,
                trabajadorNombre: form.trabajadorNombre,
                eventoId: form.eventoId || undefined,
                eventoNombre: form.eventoNombre || undefined,
                fechaEntrega: form.fechaEntrega,
                fechaDevolucion: form.fechaDevolucion || undefined,
                estado: form.estado,
                items: validItems,
                notas: form.notas.trim() || undefined,
            };

            if (item) {
                await inventarioExternoAPI.update(item.id, payload);
                toast.success('Inventario externo actualizado');
            } else {
                await inventarioExternoAPI.create(payload);
                toast.success('Inventario externo registrado');
            }
            onSaved();
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const activeWorkers = workers.filter(w => w.estado === 'Activo');
    const activeEvents = events.filter(e => !['Cerrado', 'Cancelado'].includes(e.estado));

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-2xl w-full max-h-[90dvh] overflow-y-auto dark:bg-gray-900">
                <DialogHeader>
                    <DialogTitle className="dark:text-gray-100">
                        {item ? 'Editar inventario externo' : 'Registrar inventario externo'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <Label>Nombre / Descripción *</Label>
                        <Input
                            placeholder="Ej: Equipos para evento corporativo ACME"
                            value={form.nombre}
                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                            className="bg-white dark:bg-gray-800"
                        />
                    </div>

                    {/* Trabajador + Evento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Trabajador a cargo *</Label>
                            <Select value={form.trabajadorId} onValueChange={handleWorkerChange}>
                                <SelectTrigger className="bg-white dark:bg-gray-800">
                                    <SelectValue placeholder="Seleccionar trabajador..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeWorkers.map(w => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.nombre} {w.apellido}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Evento asociado</Label>
                            <Select value={form.eventoId || '__none__'} onValueChange={handleEventChange}>
                                <SelectTrigger className="bg-white dark:bg-gray-800">
                                    <SelectValue placeholder="Sin evento (opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sin evento</SelectItem>
                                    {activeEvents.map(e => (
                                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Fechas + Estado */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label>Fecha entrega *</Label>
                            <Input
                                type="date"
                                value={form.fechaEntrega}
                                onChange={e => setForm(f => ({ ...f, fechaEntrega: e.target.value }))}
                                className="bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Fecha devolución</Label>
                            <Input
                                type="date"
                                value={form.fechaDevolucion}
                                onChange={e => setForm(f => ({ ...f, fechaDevolucion: e.target.value }))}
                                className="bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Estado</Label>
                            <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v as InventarioExterno['estado'] }))}>
                                <SelectTrigger className="bg-white dark:bg-gray-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Activo">Activo</SelectItem>
                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                    <SelectItem value="Devuelto">Devuelto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Ítems del inventario externo *</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs gap-1">
                                <Plus className="h-3 w-3" />Agregar ítem
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                            {form.items.map((it, idx) => (
                                <div key={it.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 bg-gray-50/50 dark:bg-gray-800/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Ítem {idx + 1}
                                        </span>
                                        {form.items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <div className="col-span-2 space-y-1">
                                            <Label className="text-xs">Nombre *</Label>
                                            <Input
                                                placeholder="Nombre del equipo"
                                                value={it.nombre}
                                                onChange={e => updateItem(idx, 'nombre', e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-gray-800"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Cantidad</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={it.cantidad}
                                                onChange={e => updateItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                                                className="h-8 text-sm bg-white dark:bg-gray-800"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Categoría</Label>
                                            <Input
                                                placeholder="Ej: Sonido"
                                                value={it.categoria || ''}
                                                onChange={e => updateItem(idx, 'categoria', e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-gray-800"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Marca</Label>
                                            <Input
                                                placeholder="Marca"
                                                value={it.marca || ''}
                                                onChange={e => updateItem(idx, 'marca', e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-gray-800"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Modelo</Label>
                                            <Input
                                                placeholder="Modelo"
                                                value={it.modelo || ''}
                                                onChange={e => updateItem(idx, 'modelo', e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-gray-800"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Estado</Label>
                                            <Input
                                                placeholder="Ej: Bueno"
                                                value={it.estado || ''}
                                                onChange={e => updateItem(idx, 'estado', e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-gray-800"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-4 space-y-1">
                                            <Label className="text-xs">Notas del ítem</Label>
                                            <Input
                                                placeholder="Observaciones..."
                                                value={it.notas || ''}
                                                onChange={e => updateItem(idx, 'notas', e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-gray-800"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-1.5">
                        <Label>Notas generales</Label>
                        <Textarea
                            placeholder="Observaciones, condiciones de préstamo, etc."
                            value={form.notas}
                            onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                            className="bg-white dark:bg-gray-800 resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-[#8B1DDF] hover:bg-[#7214B8] text-white">
                        {saving ? 'Guardando...' : item ? 'Guardar cambios' : 'Registrar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
