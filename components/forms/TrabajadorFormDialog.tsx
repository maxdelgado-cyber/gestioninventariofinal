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
import { Worker } from '@/types/allegra';
import { workersAPI } from '@/lib/api/workers';
import { validarRut } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    worker?: Worker | null;
}

const defaultAvailability = {
    lunes: true, martes: true, miercoles: true, jueves: true,
    viernes: true, sabado: false, domingo: false,
};

const DIAS = [
    { key: 'lunes', label: 'L' },
    { key: 'martes', label: 'M' },
    { key: 'miercoles', label: 'X' },
    { key: 'jueves', label: 'J' },
    { key: 'viernes', label: 'V' },
    { key: 'sabado', label: 'S' },
    { key: 'domingo', label: 'D' },
] as const;

const defaultForm = {
    nombre: '',
    apellido: '',
    rut: '',
    telefono: '',
    email: '',
    cargo: '',
    estado: 'Activo' as Worker['estado'],
    especialidades: '',
    habilidades: '',
    notas: '',
};

export function TrabajadorFormDialog({ open, onClose, onSaved, worker }: Props) {
    const [form, setForm] = useState(defaultForm);
    const [availability, setAvailability] = useState(defaultAvailability);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (worker) {
            setForm({
                nombre: worker.nombre,
                apellido: worker.apellido,
                rut: worker.rut,
                telefono: worker.telefono,
                email: worker.email,
                cargo: worker.cargo,
                estado: worker.estado,
                especialidades: worker.especialidades?.join('\n') || '',
                habilidades: worker.habilidades?.join('\n') || '',
                notas: worker.notas || '',
            });
            setAvailability(worker.disponibilidad || defaultAvailability);
        } else {
            setForm(defaultForm);
            setAvailability(defaultAvailability);
        }
    }, [worker, open]);

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.apellido.trim() || !form.cargo.trim()) {
            toast.error('Nombre, apellido y cargo son requeridos.');
            return;
        }
        if (form.rut && !validarRut(form.rut)) {
            toast.error('El RUT ingresado no es válido. Formato esperado: 12.345.678-9');
            return;
        }
        if (form.telefono && !/^[\d\s\+\-\(\)]{7,15}$/.test(form.telefono.trim())) {
            toast.error('El teléfono ingresado no es válido.');
            return;
        }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            toast.error('El email ingresado no es válido.');
            return;
        }
        try {
            setSaving(true);
            const payload: Omit<Worker, 'id'> = {
                nombre: form.nombre,
                apellido: form.apellido,
                rut: form.rut,
                telefono: form.telefono,
                email: form.email,
                cargo: form.cargo,
                estado: form.estado,
                especialidades: form.especialidades.split('\n').map(s => s.trim()).filter(Boolean),
                habilidades: form.habilidades.split('\n').map(s => s.trim()).filter(Boolean),
                notas: form.notas,
                disponibilidad: availability,
                historialEventos: worker?.historialEventos || [],
                anotaciones: worker?.anotaciones || [],
                registroSemanal: worker?.registroSemanal || [],
                fechaIngreso: worker?.fechaIngreso || new Date().toISOString().split('T')[0],
            };
            if (worker) {
                await workersAPI.update(worker.id, payload);
                toast.success('Trabajador actualizado');
            } else {
                await workersAPI.create(payload);
                toast.success('Trabajador registrado');
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
                        {worker ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                    <div className="space-y-1.5">
                        <Label>Nombre *</Label>
                        <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Juan" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Apellido *</Label>
                        <Input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} placeholder="Pérez" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>RUT</Label>
                        <Input value={form.rut} onChange={(e) => set('rut', e.target.value)} placeholder="12.345.678-9" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Cargo *</Label>
                        <Select value={form.cargo} onValueChange={(v) => set('cargo', v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar cargo..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Técnico Audio">Técnico Audio</SelectItem>
                                <SelectItem value="Iluminación">Iluminación</SelectItem>
                                <SelectItem value="Supervisor">Supervisor</SelectItem>
                                <SelectItem value="Staff">Staff</SelectItem>
                                <SelectItem value="Visuales">Visuales</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Teléfono</Label>
                        <Input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="juan@correo.cl" />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Especialidades <span className="text-gray-400 text-xs">(una por línea)</span></Label>
                        <Textarea value={form.especialidades} onChange={(e) => set('especialidades', e.target.value)} placeholder={"Audio en vivo\nMezcla FOH\nSistemas de PA"} rows={3} />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Habilidades Técnicas <span className="text-gray-400 text-xs">(una por línea)</span></Label>
                        <Textarea value={form.habilidades} onChange={(e) => set('habilidades', e.target.value)} placeholder={"Allen & Heath\nYamaha CL5\nDiGiCo"} rows={3} />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Notas</Label>
                        <Textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Observaciones sobre el trabajador..." rows={2} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                        {saving ? 'Guardando...' : worker ? 'Actualizar' : 'Registrar Trabajador'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
