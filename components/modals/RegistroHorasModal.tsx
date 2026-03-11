'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, CalendarDays, ChevronLeft, ChevronRight, Save, Edit2 } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Worker, RegistroSemanal, DiaTrabajoRegistro } from '@/types/allegra';
import { workersAPI } from '@/lib/api/workers';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    worker: Worker | null;
    onClose: () => void;
    onSaved: () => void;
}

// Helpers for dates
const getMonday = (d: Date) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().substring(0, 10);
};

const DIES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const generateEmptyWeek = (mondayStr: string): DiaTrabajoRegistro[] => {
    const monday = new Date(mondayStr + 'T12:00:00'); // Safe timezone
    return DIES.map((diaNombre, idx) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + idx);
        return {
            fecha: date.toISOString().substring(0, 10),
            diaNombre,
            horaInicio: '',
            horaFin: '',
            horasTrabajadas: 0,
            descuentoColacion: 0,
            horasNetas: 0
        };
    });
};

const calculateHours = (start: string, end: string, breakHours: number) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 + m2 / 60) - (h1 + m1 / 60);
    // Handle overnight shifts simply by adding 24 if end is before start
    if (diff < 0) diff += 24;

    const net = diff - (breakHours || 0);
    return Math.max(0, net); // Prevent negative hours
};

export function RegistroHorasModal({ open, worker, onClose, onSaved }: Props) {
    const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
    const [dias, setDias] = useState<DiaTrabajoRegistro[]>([]);
    const [saving, setSaving] = useState(false);

    // View mode: 'list' (shows past weeks) or 'new' (form to create/edit a week)
    const [viewMode, setViewMode] = useState<'list' | 'new'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const registros = [...(worker?.registroSemanal ?? [])].sort(
        (a, b) => b.fechaInicio.localeCompare(a.fechaInicio)
    );

    // Initialize an empty week when entering "new" mode (not editing)
    useEffect(() => {
        if (viewMode === 'new' && !editingId) {
            setDias(generateEmptyWeek(weekStart));
        }
    }, [weekStart, viewMode, editingId]);

    const loadForEdit = (registro: RegistroSemanal) => {
        // Build full 7-day skeleton from the record's fechaInicio
        const skeleton = generateEmptyWeek(registro.fechaInicio);
        // Overlay actual worked days
        const merged = skeleton.map(day => {
            const worked = registro.diasTrabajados.find(d => d.fecha === day.fecha);
            return worked ? { ...day, ...worked } : day;
        });
        setDias(merged);
        setWeekStart(registro.fechaInicio);
        setEditingId(registro.id);
        setViewMode('new');
    };

    const changeWeek = (offset: number) => {
        const date = new Date(weekStart + 'T12:00:00');
        date.setDate(date.getDate() + (offset * 7));
        setWeekStart(date.toISOString().substring(0, 10));
    };

    const handleDayChange = (idx: number, field: keyof DiaTrabajoRegistro, value: any) => {
        const newDias = [...dias];
        const day = { ...newDias[idx] };

        // Updates
        (day as any)[field] = value;

        // Calculate hours if time or colación changed
        if (field === 'horaInicio' || field === 'horaFin' || field === 'descuentoColacion') {
            const net = calculateHours(day.horaInicio, day.horaFin, Number(day.descuentoColacion) || 0);
            day.horasNetas = net;
            day.horasTrabajadas = net + (Number(day.descuentoColacion) || 0);
        }

        newDias[idx] = day;
        setDias(newDias);
    };

    const handleAdd = async () => {
        if (!worker) return;

        const diasTrabajados = dias.filter(d => d.horaInicio && d.horaFin);
        if (diasTrabajados.length === 0) {
            toast.error('Agrega horarios al menos para un día');
            return;
        }

        const totalHorasNetas = dias.reduce((sum, d) => sum + (d.horasNetas || 0), 0);
        const totalColacion = dias.reduce((sum, d) => sum + (Number(d.descuentoColacion) || 0), 0);
        const totalHoras = totalHorasNetas + totalColacion;

        setSaving(true);
        try {
            const d = new Date(weekStart + 'T12:00:00');
            const getWeek = (date: Date) => {
                const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
                return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
            };

            let updatedRegistros: RegistroSemanal[];

            if (editingId) {
                // Update existing record
                updatedRegistros = (worker.registroSemanal ?? []).map(r =>
                    r.id === editingId
                        ? { ...r, diasTrabajados, totalHoras, descuentoColacion: totalColacion, totalHorasNetas }
                        : r
                );
                toast.success('Semana actualizada con éxito');
            } else {
                const exists = worker.registroSemanal?.some(r => r.fechaInicio === weekStart);
                if (exists) {
                    toast.error('Ya existe un registro para esta semana. Usa el botón Editar.');
                    setSaving(false);
                    return;
                }
                const nuevo: RegistroSemanal = {
                    id: crypto.randomUUID(),
                    trabajadorId: worker.id,
                    semana: `${d.getFullYear()}-W${getWeek(d).toString().padStart(2, '0')}`,
                    fechaInicio: weekStart,
                    fechaFin: dias[6].fecha,
                    diasTrabajados,
                    totalHoras,
                    descuentoColacion: totalColacion,
                    totalHorasNetas,
                    aprobado: false,
                };
                updatedRegistros = [...(worker.registroSemanal ?? []), nuevo];
                toast.success('Semana registrada con éxito');
            }

            await workersAPI.update(worker.id, { ...worker, registroSemanal: updatedRegistros });
            setEditingId(null);
            setViewMode('list');
            onSaved();
        } catch {
            toast.error('Error al guardar horas');
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
                registroSemanal: (worker.registroSemanal ?? []).filter((r) => r.id !== deleteId),
            });
            toast.success('Registro eliminado');
            onSaved();
        } catch {
            toast.error('Error al eliminar registro');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    if (!worker) return null;

    const netWeeklyTotal = dias.reduce((sum, d) => sum + (d.horasNetas || 0), 0);

    return (
        <>
            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar semana"
                description="¿Eliminar este registro semanal? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            <Dialog open={open} onOpenChange={(v) => !v && !saving && !deleting && onClose()}>
                <DialogContent
                    showCloseButton={false}
                    className="max-w-3xl max-h-[90vh] flex flex-col dark:bg-[#1a1a2e] dark:border-gray-700/60 p-0 overflow-hidden"
                >
                    <div className="relative border-b border-gray-100 dark:border-gray-800/60">
                        <DialogHeader className="p-6">
                            <DialogTitle className="flex items-center gap-2 dark:text-gray-100 text-xl font-semibold pr-10">
                                <Clock className="h-5 w-5 text-indigo-500 shrink-0" />
                                Horas — {worker.nombre} {worker.apellido}
                            </DialogTitle>
                        </DialogHeader>

                        {/* Botón de cerrar personalizado */}
                        <div className="absolute top-4 right-4 z-50">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-100"
                                onClick={onClose}
                            >
                                <Plus className="h-5 w-5 rotate-45" />
                                <span className="sr-only">Cerrar</span>
                            </Button>
                        </div>
                    </div>

                    {/* Sub-header with actions */}
                    <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {viewMode === 'list' ? 'Historial semanal' : editingId ? 'Editando semana' : 'Nuevo registro semanal'}
                        </div>
                        <div className="shrink-0 w-full sm:w-auto">
                            {viewMode === 'list' && (
                                <Button size="sm" onClick={() => { setWeekStart(getMonday(new Date())); setEditingId(null); setViewMode('new'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 w-full sm:w-auto">
                                    <Plus className="h-4 w-4 mr-1.5" /> Agregar Semana
                                </Button>
                            )}
                            {viewMode === 'new' && (
                                <Button size="sm" variant="ghost" onClick={() => { setViewMode('list'); setEditingId(null); }} className="h-9 w-full sm:w-auto border border-gray-200 dark:border-gray-700">
                                    Volver a la lista
                                </Button>
                            )}
                        </div>
                    </div>

                    {viewMode === 'list' ? (
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/50 dark:bg-transparent">
                            {registros.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 gap-3">
                                    <CalendarDays className="h-10 w-10 opacity-30" />
                                    <p className="text-sm font-medium">No hay registros semanales</p>
                                </div>
                            ) : (
                                registros.map((r) => (
                                    <div
                                        key={r.id}
                                        className="rounded-xl border border-gray-200 dark:border-gray-800/80 bg-white dark:bg-gray-800/40 p-4 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    Semana: {formatDate(r.fechaInicio + 'T00:00:00')} al {formatDate(r.fechaFin + 'T00:00:00')}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Días trabajados: {r.diasTrabajados.length}
                                                </p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg text-sm font-bold border border-indigo-100 dark:border-indigo-800/30">
                                                    {r.totalHorasNetas.toFixed(1)} h netas
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                        title="Editar días de esta semana"
                                                        onClick={() => loadForEdit(r)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onClick={() => setDeleteId(r.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 overflow-hidden">
                            {/* Week Navigator */}
                            <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800/60">
                                <Button variant="outline" size="icon" className="h-8 w-8 dark:border-gray-700" disabled={!!editingId} onClick={() => changeWeek(-1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    Semana: {formatDate(weekStart + 'T12:00:00')}
                                    {editingId && <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">Editando</span>}
                                </div>
                                <Button variant="outline" size="icon" className="h-8 w-8 dark:border-gray-700" disabled={!!editingId} onClick={() => changeWeek(1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Days Form */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 bg-gray-50/30 dark:bg-transparent">
                                {dias.map((dia, idx) => (
                                    <div key={idx} className="flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 items-stretch lg:items-center shadow-sm">
                                        <div className="w-full lg:w-32 shrink-0 flex items-center justify-between lg:block">
                                            <div className="font-bold text-gray-900 dark:text-gray-100">{dia.diaNombre}</div>
                                            <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium">{formatDate(dia.fecha + 'T12:00:00')}</div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">Entrada</Label>
                                                <Input
                                                    type="time"
                                                    className="h-9 px-2 dark:bg-[#0f172a] dark:border-gray-700 w-full text-sm"
                                                    value={dia.horaInicio}
                                                    onChange={(e) => handleDayChange(idx, 'horaInicio', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">Salida</Label>
                                                <Input
                                                    type="time"
                                                    className="h-9 px-2 dark:bg-[#0f172a] dark:border-gray-700 w-full text-sm"
                                                    value={dia.horaFin}
                                                    onChange={(e) => handleDayChange(idx, 'horaFin', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold truncate" title="Colación">Colación</Label>
                                                <Input
                                                    type="number"
                                                    min="0" step="0.5"
                                                    placeholder="0"
                                                    className="h-9 px-2 dark:bg-[#0f172a] dark:border-gray-700 w-full text-sm"
                                                    value={dia.descuentoColacion || ''}
                                                    onChange={(e) => handleDayChange(idx, 'descuentoColacion', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1 flex flex-col justify-end">
                                                <Label className="text-[10px] sm:text-xs text-transparent select-none hidden lg:block">Total</Label>
                                                <div className="h-9 flex items-center px-2 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-md border border-indigo-100/50 dark:border-indigo-900/30 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                    {dia.horasNetas.toFixed(1)} h <span className="hidden sm:inline ml-1">netas</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Submit */}
                            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800/60 bg-white dark:bg-[#1a1a2e] flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <span className="text-gray-500 font-medium text-sm sm:text-base">Total semanal:</span>
                                    <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-lg hover:bg-indigo-100 border-none px-3 py-0.5">
                                        {netWeeklyTotal.toFixed(1)} hrs
                                    </Badge>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button variant="outline" className="flex-1 sm:flex-none dark:border-gray-700 dark:text-gray-300 h-10" onClick={() => { setViewMode('list'); setEditingId(null); }} disabled={saving}>
                                        Cancelar
                                    </Button>
                                    <Button className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white h-10 shadow-md transition-all active:scale-95" onClick={handleAdd} disabled={saving || netWeeklyTotal === 0}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? 'Guardando...' : editingId ? 'Actualizar Semana' : 'Guardar Registro'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
