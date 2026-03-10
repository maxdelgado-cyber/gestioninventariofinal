'use client';

import { useState } from 'react';
import { Clock, Plus, Trash2, CalendarDays } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Worker, RegistroHoraSimple } from '@/types/allegra';
import { workersAPI } from '@/lib/api/workers';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    worker: Worker | null;
    onClose: () => void;
    onSaved: () => void;
}

const today = () => new Date().toISOString().substring(0, 10);

export function RegistroHorasModal({ open, worker, onClose, onSaved }: Props) {
    const [fecha, setFecha] = useState(today());
    const [horas, setHoras] = useState<string>('8');
    const [eventoNombre, setEventoNombre] = useState('');
    const [observacion, setObservacion] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const registros = [...(worker?.horasRegistradas ?? [])].sort(
        (a, b) => b.fecha.localeCompare(a.fecha)
    );

    const totalHoras = registros.reduce((acc, r) => acc + r.horas, 0);

    const resetForm = () => {
        setFecha(today());
        setHoras('8');
        setEventoNombre('');
        setObservacion('');
    };

    const handleAdd = async () => {
        if (!worker) return;
        const horasNum = parseFloat(horas);
        if (!fecha || isNaN(horasNum) || horasNum <= 0) {
            toast.error('Ingresa una fecha y cantidad de horas válida');
            return;
        }
        setSaving(true);
        try {
            const nuevo: RegistroHoraSimple = {
                id: crypto.randomUUID(),
                fecha,
                horas: horasNum,
                eventoNombre: eventoNombre.trim() || undefined,
                observacion: observacion.trim() || undefined,
            };
            await workersAPI.update(worker.id, {
                ...worker,
                horasRegistradas: [...(worker.horasRegistradas ?? []), nuevo],
            });
            toast.success('Horas registradas');
            resetForm();
            onSaved();
            onClose();
        } catch {
            toast.error('Error al registrar horas');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!worker || !deleteId) return;
        setDeleting(true);
        try {
            await workersAPI.update(worker.id, {
                ...worker,
                horasRegistradas: (worker.horasRegistradas ?? []).filter((r) => r.id !== deleteId),
            });
            toast.success('Registro eliminado');
            onSaved();
            onClose();
        } catch {
            toast.error('Error al eliminar registro');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    if (!worker) return null;

    return (
        <>
            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar registro"
                description="¿Eliminar este registro de horas? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            <Dialog open={open} onOpenChange={(v) => !v && !saving && !deleting && onClose()}>
                <DialogContent className="max-w-lg max-h-[90vh] flex flex-col dark:bg-[#1a1a2e] dark:border-gray-700/60">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 dark:text-gray-100">
                            <Clock className="h-5 w-5 text-indigo-500" />
                            Registro de Horas — {worker.nombre} {worker.apellido}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Resumen total */}
                    {registros.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40">
                            <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                            <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                                Total registrado: <strong>{totalHoras} h</strong>
                            </span>
                        </div>
                    )}

                    {/* Lista de registros */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                        {registros.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500 gap-2">
                                <CalendarDays className="h-8 w-8 opacity-30" />
                                <p className="text-sm">Sin registros de horas</p>
                            </div>
                        ) : (
                            registros.map((r) => (
                                <div
                                    key={r.id}
                                    className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/50 p-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5 flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                                    {formatDate(r.fecha + 'T00:00:00')}
                                                </span>
                                                <span className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                                                    {r.horas} h
                                                </span>
                                            </div>
                                            {r.eventoNombre && (
                                                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                                    {r.eventoNombre}
                                                </p>
                                            )}
                                            {r.observacion && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {r.observacion}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                                            onClick={() => setDeleteId(r.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Formulario nuevo registro */}
                    <div className="border-t border-gray-200 dark:border-gray-700/60 pt-4 space-y-3">
                        <Label className="text-sm font-medium dark:text-gray-200">Nuevo registro</Label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="space-y-1 flex-1 min-w-0">
                                <Label className="text-xs text-gray-500 dark:text-gray-400">Fecha</Label>
                                <Input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
                                />
                            </div>
                            <div className="space-y-1 sm:w-28 shrink-0">
                                <Label className="text-xs text-gray-500 dark:text-gray-400">Horas</Label>
                                <Input
                                    type="number"
                                    min="0.5"
                                    max="24"
                                    step="0.5"
                                    value={horas}
                                    onChange={(e) => setHoras(e.target.value)}
                                    placeholder="8"
                                    className="w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500 dark:text-gray-400">Evento (opcional)</Label>
                            <Input
                                value={eventoNombre}
                                onChange={(e) => setEventoNombre(e.target.value)}
                                placeholder="Nombre del evento..."
                                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500 dark:text-gray-400">Observación (opcional)</Label>
                            <Textarea
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                placeholder="Observaciones adicionales..."
                                rows={2}
                                className="resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}
                                className="dark:border-gray-600 dark:text-gray-300">
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleAdd}
                                disabled={!fecha || !horas || saving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                {saving ? 'Guardando...' : 'Registrar Horas'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
