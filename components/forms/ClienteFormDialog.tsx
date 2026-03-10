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
import { Client } from '@/types/allegra';
import { clientsAPI } from '@/lib/api/clients';
import { validarRut } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    client?: Client | null;
}

const defaultForm = {
    nombre: '',
    tipoCliente: 'Empresa' as Client['tipoCliente'],
    rut: '',
    contactoResponsable: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    region: '',
    giro: '',
    estado: 'Activo' as Client['estado'],
    eventosRealizados: 0,
    valorTotalEventos: 0,
    notas: '',
};

export function ClienteFormDialog({ open, onClose, onSaved, client }: Props) {
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);

    const formatRut = (rutValue: string) => {
        const clean = rutValue.replace(/[^0-9kK]/g, '');
        if (clean.length > 1) {
            const dv = clean.slice(-1);
            let body = clean.slice(0, -1);
            body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            return `${body}-${dv}`;
        }
        return clean;
    };

    useEffect(() => {
        if (client) {
            setForm({
                nombre: client.nombre,
                tipoCliente: client.tipoCliente,
                rut: client.rut || '',
                contactoResponsable: client.contactoResponsable,
                telefono: client.telefono,
                email: client.email,
                direccion: client.direccion || '',
                ciudad: client.ciudad || '',
                region: client.region || '',
                giro: client.giro || '',
                estado: client.estado,
                eventosRealizados: client.eventosRealizados,
                valorTotalEventos: client.valorTotalEventos,
                notas: client.notas || '',
            });
        } else {
            setForm(defaultForm);
        }
    }, [client, open]);

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.contactoResponsable.trim() || !form.telefono.trim()) {
            toast.error('Nombre, contacto y teléfono son requeridos.');
            return;
        }
        if (form.rut && !validarRut(form.rut)) {
            toast.error('El RUT ingresado no es válido. Formato esperado: 12.345.678-9');
            return;
        }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            toast.error('El email ingresado no es válido.');
            return;
        }
        try {
            setSaving(true);
            if (client) {
                await clientsAPI.update(client.id, { ...form });
                toast.success('Cliente actualizado correctamente');
            } else {
                await clientsAPI.create({ ...form });
                toast.success('Cliente creado correctamente');
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
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {client ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Nombre / Razón Social *</Label>
                        <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="ej. Corporación Evento S.A." />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Tipo de Cliente</Label>
                        <Select value={form.tipoCliente} onValueChange={(v) => set('tipoCliente', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Empresa">Empresa</SelectItem>
                                <SelectItem value="Persona">Persona Natural</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>RUT</Label>
                        <Input value={form.rut} onChange={(e) => set('rut', formatRut(e.target.value))} placeholder="ej. 76.123.456-7" maxLength={12} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Giro / Rubro</Label>
                        <Input value={form.giro} onChange={(e) => set('giro', e.target.value)} placeholder="ej. Eventos y Espectáculos" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Contacto Responsable *</Label>
                        <Input value={form.contactoResponsable} onChange={(e) => set('contactoResponsable', e.target.value)} placeholder="Nombre del contacto" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Teléfono *</Label>
                        <Input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Email</Label>
                        <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contacto@empresa.cl" />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Dirección</Label>
                        <Input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Calle, número, comuna" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Ciudad</Label>
                        <Input value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} placeholder="ej. Santiago" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Región</Label>
                        <Select value={form.region} onValueChange={(v) => set('region', v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar región..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Arica y Parinacota">Arica y Parinacota</SelectItem>
                                <SelectItem value="Tarapacá">Tarapacá</SelectItem>
                                <SelectItem value="Antofagasta">Antofagasta</SelectItem>
                                <SelectItem value="Atacama">Atacama</SelectItem>
                                <SelectItem value="Coquimbo">Coquimbo</SelectItem>
                                <SelectItem value="Valparaíso">Valparaíso</SelectItem>
                                <SelectItem value="Metropolitana de Santiago">Metropolitana de Santiago</SelectItem>
                                <SelectItem value="Libertador Gral. B. O'Higgins">Libertador Gral. B. O&apos;Higgins</SelectItem>
                                <SelectItem value="Maule">Maule</SelectItem>
                                <SelectItem value="Ñuble">Ñuble</SelectItem>
                                <SelectItem value="Biobío">Biobío</SelectItem>
                                <SelectItem value="La Araucanía">La Araucanía</SelectItem>
                                <SelectItem value="Los Ríos">Los Ríos</SelectItem>
                                <SelectItem value="Los Lagos">Los Lagos</SelectItem>
                                <SelectItem value="Aysén del Gral. Carlos Ibáñez del Campo">Aysén del Gral. Carlos Ibáñez del Campo</SelectItem>
                                <SelectItem value="Magallanes y de la Antártica Chilena">Magallanes y de la Antártica Chilena</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                        <Label>Notas</Label>
                        <Textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Observaciones sobre el cliente..." rows={2} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                        {saving ? 'Guardando...' : client ? 'Actualizar Cliente' : 'Guardar Cliente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
