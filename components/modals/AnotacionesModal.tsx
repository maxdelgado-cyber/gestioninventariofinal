'use client';

import { useState } from 'react';
import { MessageSquare, Plus, User, Calendar } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Worker, WorkerAnotacion } from '@/types/allegra';
import { workersAPI } from '@/lib/api/workers';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    worker: Worker | null;
    onClose: () => void;
    onSaved: () => void;
}

export function AnotacionesModal({ open, worker, onClose, onSaved }: Props) {
    const [nota, setNota] = useState('');
    const [saving, setSaving] = useState(false);

    const anotaciones = [...(worker?.anotaciones ?? [])].sort(
        (a, b) => b.fecha.localeCompare(a.fecha)
    );

    const handleAdd = async () => {
        if (!worker || !nota.trim()) return;
        setSaving(true);
        try {
            const nueva: WorkerAnotacion = {
                fecha: new Date().toISOString().substring(0, 10),
                nota: nota.trim(),
                autor: 'Admin',
            };
            await workersAPI.update(worker.id, {
                ...worker,
                anotaciones: [...(worker.anotaciones ?? []), nueva],
            });
            toast.success('Anotación agregada');
            setNota('');
            onSaved();
            onClose();
        } catch {
            toast.error('Error al guardar anotación');
        } finally {
            setSaving(false);
        }
    };

    if (!worker) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col dark:bg-[#1a1a2e] dark:border-gray-700/60">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 dark:text-gray-100">
                        <MessageSquare className="h-5 w-5 text-indigo-500" />
                        Anotaciones — {worker.nombre} {worker.apellido}
                    </DialogTitle>
                </DialogHeader>

                {/* Lista de anotaciones */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                    {anotaciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500 gap-2">
                            <MessageSquare className="h-8 w-8 opacity-30" />
                            <p className="text-sm">Sin anotaciones registradas</p>
                        </div>
                    ) : (
                        anotaciones.map((a, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(a.fecha + 'T00:00:00')}
                                    </div>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 dark:border-gray-600 dark:text-gray-400">
                                        <User className="h-2.5 w-2.5 mr-1" />
                                        {a.autor}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{a.nota}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Formulario nueva anotación */}
                <div className="border-t border-gray-200 dark:border-gray-700/60 pt-4 space-y-3">
                    <Label className="text-sm font-medium dark:text-gray-200">Nueva anotación</Label>
                    <Textarea
                        placeholder="Escribe una anotación sobre este trabajador..."
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                        rows={3}
                        className="resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}
                            className="dark:border-gray-600 dark:text-gray-300">
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAdd}
                            disabled={!nota.trim() || saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            {saving ? 'Guardando...' : 'Agregar Anotación'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
