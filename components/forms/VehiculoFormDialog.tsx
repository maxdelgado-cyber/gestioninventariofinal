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
import { Vehicle, Worker } from '@/types/allegra';
import { vehiclesAPI } from '@/lib/api/vehicles';
import { workersAPI } from '@/lib/api/workers';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    vehicle?: Vehicle | null;
}

const defaultForm = {
    nombre: '',
    tipo: 'Camión' as Vehicle['tipo'],
    patente: '',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    capacidadCarga: 0,
    estado: 'Disponible' as Vehicle['estado'],
    conductorAsignado: '',
    notas: '',
};

export function VehiculoFormDialog({ open, onClose, onSaved, vehicle }: Props) {
    const [form, setForm] = useState(defaultForm);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        workersAPI.getAll().then(setWorkers).catch(() => { });
    }, []);

    useEffect(() => {
        if (vehicle) {
            setForm({
                nombre: vehicle.nombre,
                tipo: vehicle.tipo,
                patente: vehicle.patente,
                marca: vehicle.marca,
                modelo: vehicle.modelo,
                año: vehicle.año,
                capacidadCarga: vehicle.capacidadCarga,
                estado: vehicle.estado,
                conductorAsignado: vehicle.conductorAsignado || '',
                notas: vehicle.notas || '',
            });
        } else {
            setForm(defaultForm);
        }
    }, [vehicle, open]);

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.marca.trim()) {
            toast.error('Nombre y marca son requeridos.');
            return;
        }
        try {
            setSaving(true);
            const payload: Omit<Vehicle, 'id'> = {
                ...form,
                mantenimientos: vehicle?.mantenimientos || [],
                historialUso: vehicle?.historialUso || [],
                anotaciones: vehicle?.anotaciones || [],
            };
            if (vehicle) {
                await vehiclesAPI.update(vehicle.id, payload);
                toast.success('Vehículo actualizado');
            } else {
                await vehiclesAPI.create(payload);
                toast.success('Vehículo registrado');
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
    const activeWorkers = workers.filter(w => w.estado === 'Activo');

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Nombre del Vehículo *</Label>
                        <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="ej. Camión Principal" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Tipo</Label>
                        <Select value={form.tipo} onValueChange={(v) => set('tipo', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Furgón">Furgón</SelectItem>
                                <SelectItem value="Camión">Camión</SelectItem>
                                <SelectItem value="Van">Van</SelectItem>
                                <SelectItem value="Camioneta">Camioneta</SelectItem>
                                <SelectItem value="Auto">Auto</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>



                    <div className="space-y-1.5">
                        <Label>Patente <span className="text-gray-400 text-xs">(opcional)</span></Label>
                        <Input value={form.patente} onChange={(e) => set('patente', e.target.value.toUpperCase())} placeholder="ABCD12" maxLength={8} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Marca *</Label>
                        <Input value={form.marca} onChange={(e) => set('marca', e.target.value)} placeholder="ej. Mercedes-Benz" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Modelo</Label>
                        <Input value={form.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="ej. Sprinter 519 CDI" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Año</Label>
                        <Input type="number" value={form.año} min={1990} max={2030} onChange={(e) => set('año', Number(e.target.value))} />
                    </div>



                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Notas</Label>
                        <Textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Observaciones sobre el vehículo..." rows={2} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                        {saving ? 'Guardando...' : vehicle ? 'Actualizar Vehículo' : 'Registrar Vehículo'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
