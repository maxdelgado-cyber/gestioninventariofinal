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
import { InventoryItem } from '@/types/allegra';
import { inventoryAPI } from '@/lib/api/inventory';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    item?: InventoryItem | null;
}

const defaultForm = {
    nombre: '',
    categoria: '',
    subcategoria: '',
    marca: '',
    modelo: '',
    cantidad: 1,
    ubicacion: '',
    estado: 'Disponible' as InventoryItem['estado'],
    fechaAdquisicion: new Date().toISOString().split('T')[0],
    esInsumo: false,
    unidadMedida: '',
    stockMinimo: 0,
    notas: '',
    historialUso: [] as InventoryItem['historialUso'],
    esContenedor: false,
    contenidoInterno: {
        itemsRef: [] as string[],
        itemsDetalle: [] as { id: string, cantidad: number }[],
        descripcion: ''
    }
};

export function InventarioFormDialog({ open, onClose, onSaved, item }: Props) {
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (open) {
            inventoryAPI.getAll().then(setAllInventory).catch(console.error);
        }
    }, [open]);

    useEffect(() => {
        if (item) {
            setForm({
                nombre: item.nombre,
                categoria: item.categoria,
                subcategoria: item.subcategoria || '',
                marca: item.marca || '',
                modelo: item.modelo || '',
                cantidad: item.cantidad,
                ubicacion: item.ubicacion,
                estado: item.estado,
                fechaAdquisicion: item.fechaAdquisicion,
                esInsumo: item.esInsumo || false,
                unidadMedida: item.unidadMedida || '',
                stockMinimo: item.stockMinimo || 0,
                notas: item.notas || '',
                historialUso: item.historialUso,
                esContenedor: item.esContenedor || false,
                contenidoInterno: {
                    itemsRef: item.contenidoInterno?.itemsRef || [],
                    itemsDetalle: item.contenidoInterno?.itemsDetalle || [],
                    descripcion: item.contenidoInterno?.descripcion || ''
                }
            });
        } else {
            setForm(defaultForm);
        }
    }, [item, open]);

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.categoria.trim() || !form.ubicacion.trim()) {
            toast.error('Nombre, categoría y ubicación son requeridos.');
            return;
        }
        if (form.cantidad < 1) {
            toast.error('La cantidad debe ser al menos 1.');
            return;
        }
        if (form.esInsumo && !form.unidadMedida.trim()) {
            toast.error('Los insumos requieren una unidad de medida (ej: kg, unidades, litros).');
            return;
        }
        try {
            setSaving(true);
            if (item) {
                await inventoryAPI.update(item.id, form);
                toast.success('Ítem actualizado correctamente');
            } else {
                await inventoryAPI.create(form);
                toast.success('Ítem ingresado al inventario');
            }
            onSaved();
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {item ? 'Editar Equipo' : 'Ingresar Nuevo Equipo'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Nombre del Equipo *</Label>
                        <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="ej. Consola Allen & Heath SQ-6" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Categoría *</Label>
                        <Select value={form.categoria} onValueChange={(v) => set('categoria', v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Audio">Audio</SelectItem>
                                <SelectItem value="Iluminación">Iluminación</SelectItem>
                                <SelectItem value="Video">Video</SelectItem>
                                <SelectItem value="Escenario">Escenario</SelectItem>
                                <SelectItem value="Estructuras">Estructuras</SelectItem>
                                <SelectItem value="Cableado">Cableado</SelectItem>
                                <SelectItem value="Insumos">Insumos</SelectItem>
                                <SelectItem value="Herramientas">Herramientas</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Subcategoría</Label>
                        <Input value={form.subcategoria} onChange={(e) => set('subcategoria', e.target.value)} placeholder="ej. Inalámbrico de mano" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Marca</Label>
                        <Input value={form.marca} onChange={(e) => set('marca', e.target.value)} placeholder="ej. Shure" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Modelo</Label>
                        <Input value={form.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="ej. SM58" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Cantidad *</Label>
                        <Input type="number" min={1} value={form.cantidad} onChange={(e) => set('cantidad', Number(e.target.value))} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Ubicación *</Label>
                        <Input value={form.ubicacion} onChange={(e) => set('ubicacion', e.target.value)} placeholder="ej. Bodega A - Estantería 3" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Estado *</Label>
                        <Select value={form.estado} onValueChange={(v) => set('estado', v)}>
                            <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Disponible">Disponible</SelectItem>
                                <SelectItem value="Operativo">Operativo</SelectItem>
                                <SelectItem value="Reservado">Reservado</SelectItem>
                                <SelectItem value="En Uso">En Uso</SelectItem>
                                <SelectItem value="Falta Mantenimiento">Falta Mantenimiento</SelectItem>
                                <SelectItem value="En Mantenimiento">En Mantenimiento</SelectItem>
                                <SelectItem value="Dañado">Dañado</SelectItem>
                                <SelectItem value="Fuera de Servicio">Fuera de Servicio</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Fecha de Adquisición</Label>
                        <Input type="date" value={form.fechaAdquisicion} onChange={(e) => set('fechaAdquisicion', e.target.value)} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Stock Mínimo (alertas)</Label>
                        <Input type="number" min={0} value={form.stockMinimo} onChange={(e) => set('stockMinimo', Number(e.target.value))} />
                    </div>

                    {/* Insumo toggle */}
                    <div className="sm:col-span-2">
                        <label className="flex items-center gap-3 cursor-pointer p-3 border border-orange-200 bg-orange-50 rounded-lg">
                            <input
                                type="checkbox"
                                checked={form.esInsumo}
                                onChange={(e) => {
                                    set('esInsumo', e.target.checked);
                                    if (e.target.checked && form.stockMinimo === 0) {
                                        set('stockMinimo', 2);
                                    }
                                }}
                                className="h-4 w-4 accent-orange-500"
                            />
                            <div>
                                <span className="font-medium text-orange-800 text-sm">Es Insumo (Consumible)</span>
                                <p className="text-xs text-orange-600 mt-0.5">Ej: pólvora, cinta adhesiva. No se solicita retorno al cerrar evento.</p>
                            </div>
                        </label>
                    </div>

                    {form.esInsumo && (
                        <div className="space-y-1.5">
                            <Label>Unidad de Medida *</Label>
                            <Input value={form.unidadMedida} onChange={(e) => set('unidadMedida', e.target.value)} placeholder="ej. kg, unidades, litros" />
                        </div>
                    )}

                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Notas</Label>
                        <Textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Observaciones adicionales..." rows={2} />
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer p-3 border border-purple-200 bg-purple-50 rounded-lg">
                            <input
                                type="checkbox"
                                checked={form.esContenedor}
                                onChange={(e) => set('esContenedor', e.target.checked)}
                                className="h-4 w-4 accent-purple-500"
                            />
                            <div>
                                <span className="font-medium text-purple-800 text-sm">Es un Kit / Case (Contenedor)</span>
                                <p className="text-xs text-purple-600 mt-0.5">Permite detallar el contenido interno del equipo.</p>
                            </div>
                        </label>
                    </div>

                    {form.esContenedor && (
                        <div className="sm:col-span-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1.5">
                                <Label className="text-purple-700">Contenido del Kit / Case (Descripción)</Label>
                                <Textarea
                                    value={form.contenidoInterno.descripcion}
                                    onChange={(e) => set('contenidoInterno', { ...form.contenidoInterno, descripcion: e.target.value })}
                                    placeholder="Escribe aquí el detalle (ej: 2x SM58, 4x Cables XLR...)"
                                    rows={2}
                                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                                />
                            </div>

                            <div className="space-y-1.5 border border-purple-100 rounded-lg p-3 bg-white">
                                <Label className="text-purple-700">Equipos Registrados en el Case</Label>
                                <p className="text-xs text-gray-500 mb-2">Seleccione los ítems de inventario que forman parte del contenido de este case. Se auto-seleccionarán al montar este case.</p>

                                <div className="relative mb-3">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar equipos por nombre o categoría..."
                                        className="pl-9 h-9 text-sm bg-gray-50/50"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="max-h-48 overflow-y-auto space-y-1 border rounded bg-gray-50/50 p-2">
                                    {allInventory
                                        .filter(i => i.id !== item?.id) // No se puede contener a sí mismo
                                        .filter(i => i.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || i.categoria.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(invItem => {
                                            const isChecked = form.contenidoInterno.itemsRef.includes(invItem.id);
                                            const detalle = form.contenidoInterno.itemsDetalle?.find(d => d.id === invItem.id);
                                            const cantidad = detalle ? detalle.cantidad : 1;

                                            return (
                                                <div key={invItem.id} className={`flex flex-col gap-2 p-2 rounded transition-colors ${isChecked ? 'bg-purple-50 border border-purple-200' : 'hover:bg-white border border-transparent'}`}>
                                                    <label className="flex items-start gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1 accent-purple-600"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                const refs = form.contenidoInterno.itemsRef;
                                                                const det = form.contenidoInterno.itemsDetalle || [];
                                                                if (e.target.checked) {
                                                                    set('contenidoInterno', {
                                                                        ...form.contenidoInterno,
                                                                        itemsRef: [...refs, invItem.id],
                                                                        itemsDetalle: [...det, { id: invItem.id, cantidad: 1 }]
                                                                    });
                                                                } else {
                                                                    set('contenidoInterno', {
                                                                        ...form.contenidoInterno,
                                                                        itemsRef: refs.filter(id => id !== invItem.id),
                                                                        itemsDetalle: det.filter(d => d.id !== invItem.id)
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-gray-900 leading-none">{invItem.nombre}</span>
                                                            <span className="text-xs text-gray-500 mt-1">{invItem.categoria} - {invItem.stockMinimo === 0 ? `Stock: ${invItem.cantidad}` : 'Insumo'}</span>
                                                        </div>
                                                    </label>
                                                    {isChecked && (
                                                        <div className="pl-7 flex items-center gap-2 mt-1">
                                                            <Label className="text-xs text-gray-600">Unidades por case:</Label>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                className="h-7 w-20 text-sm bg-white"
                                                                value={cantidad}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 1;
                                                                    const det = form.contenidoInterno.itemsDetalle || [];
                                                                    const newDet = det.map(d => d.id === invItem.id ? { ...d, cantidad: val } : d);
                                                                    if (!newDet.some(d => d.id === invItem.id)) newDet.push({ id: invItem.id, cantidad: val });
                                                                    set('contenidoInterno', { ...form.contenidoInterno, itemsDetalle: newDet });
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    {allInventory.length === 0 && <p className="text-xs text-center text-gray-500 py-2">No hay otros equipos en el inventario.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                        {saving ? 'Guardando...' : item ? 'Actualizar Equipo' : 'Guardar Equipo'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
