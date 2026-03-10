'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Users, Edit, Trash2, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Worker } from '@/types/allegra';
import { workersAPI } from '@/lib/api/workers';
import { toast } from 'sonner';
import { TrabajadorFormDialog } from '@/components/forms/TrabajadorFormDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AnotacionesModal } from '@/components/modals/AnotacionesModal';
import { RegistroHorasModal } from '@/components/modals/RegistroHorasModal';

export default function TrabajadoresPage() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [horasWorker, setHorasWorker] = useState<Worker | null>(null);
    const [anotacionesWorker, setAnotacionesWorker] = useState<Worker | null>(null);

    useEffect(() => { loadWorkers(); }, []);

    const loadWorkers = async () => {
        try {
            setLoading(true);
            const data = await workersAPI.getAll();
            setWorkers(data || []);
        } catch { toast.error('Error al cargar trabajadores'); }
        finally { setLoading(false); }
    };

    const openNew = () => { setSelectedWorker(null); setDialogOpen(true); };
    const openEdit = (w: Worker) => { setSelectedWorker(w); setDialogOpen(true); };
    const openHoras = (w: Worker) => setHorasWorker(w);
    const openAnotaciones = (w: Worker) => setAnotacionesWorker(w);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await workersAPI.delete(deleteId);
            toast.success('Trabajador eliminado');
            loadWorkers();
        } catch (e: any) {
            toast.error(e?.message || 'Error al eliminar');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const filtered = workers.filter(w =>
        (w.nombre + ' ' + w.apellido).toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.cargo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <TrabajadorFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={loadWorkers}
                worker={selectedWorker}
            />

            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar trabajador"
                description="¿Está seguro de eliminar este trabajador? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            <AnotacionesModal
                open={!!anotacionesWorker}
                worker={anotacionesWorker}
                onClose={() => setAnotacionesWorker(null)}
                onSaved={loadWorkers}
            />
            <RegistroHorasModal
                open={!!horasWorker}
                worker={horasWorker}
                onClose={() => setHorasWorker(null)}
                onSaved={loadWorkers}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Trabajadores</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestione el personal, sus especialidades y registros.</p>
                </div>
                <Button onClick={openNew} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />Nuevo Trabajador
                </Button>
            </div>

            <div className="relative max-w-md w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Buscar por nombre o cargo..." className="pl-9 bg-white dark:bg-gray-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* ── MOBILE CARDS ── */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full inline-block"><Users className="h-6 w-6 text-gray-400" /></div>
                        <p className="text-gray-500 dark:text-gray-400">No se encontraron trabajadores.</p>
                        <Button variant="outline" size="sm" onClick={openNew}>Registrar primer trabajador</Button>
                    </div>
                ) : filtered.map((worker) => (
                    <div key={worker.id} className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-4 shadow-sm active:scale-[0.99] transition-transform">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="h-11 w-11 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shrink-0 text-sm">
                                    {worker.nombre?.[0] ?? '?'}{worker.apellido?.[0] ?? '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{worker.nombre} {worker.apellido}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{worker.rut}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className={worker.estado === 'Activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700'}>
                                {worker.estado}
                            </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Cargo</p>
                                <p className="text-gray-700 dark:text-gray-300 font-medium">{worker.cargo}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Contacto</p>
                                <p className="text-gray-700 dark:text-gray-300">{worker.telefono}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{worker.email}</p>
                            </div>
                        </div>
                        {(worker.especialidades?.length || 0) > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {worker.especialidades?.slice(0, 3).map((esp, i) => (
                                    <Badge key={i} variant="outline" className="bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 text-xs">{esp}</Badge>
                                ))}
                                {(worker.especialidades?.length || 0) > 3 && (
                                    <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-xs">+{(worker.especialidades?.length || 0) - 3}</Badge>
                                )}
                            </div>
                        )}
                        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700/40 pt-3">
                            <Button variant="outline" size="sm" className="flex-1 dark:border-gray-600 dark:text-gray-300" onClick={() => openEdit(worker)}>
                                <Edit className="mr-1.5 h-3.5 w-3.5 text-blue-500" />Editar
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 dark:text-gray-400" title="Registro de horas" onClick={() => openHoras(worker)}>
                                <Clock className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 dark:text-gray-400" title="Anotaciones" onClick={() => openAnotaciones(worker)}>
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 dark:text-red-400" title="Eliminar" onClick={() => setDeleteId(worker.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden sm:block bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="dark:border-gray-700/60">
                            <TableHead className="w-[250px] dark:text-gray-400">Nombre</TableHead>
                            <TableHead className="dark:text-gray-400">Cargo</TableHead>
                            <TableHead className="dark:text-gray-400">Especialidades</TableHead>
                            <TableHead className="dark:text-gray-400">Contacto</TableHead>
                            <TableHead className="dark:text-gray-400">Estado</TableHead>
                            <TableHead className="text-right dark:text-gray-400">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">
                                <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" /></div>
                            </TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-48 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full"><Users className="h-6 w-6 text-gray-400" /></div>
                                    <p>No se encontraron trabajadores.</p>
                                    <Button variant="outline" size="sm" onClick={openNew}>Registrar primer trabajador</Button>
                                </div>
                            </TableCell></TableRow>
                        ) : filtered.map((worker) => (
                            <TableRow key={worker.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 dark:border-gray-700/40 transition-colors">
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                                            {worker.nombre?.[0] ?? '?'}{worker.apellido?.[0] ?? '?'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 dark:text-gray-100">{worker.nombre} {worker.apellido}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{worker.rut}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="dark:text-gray-300">{worker.cargo}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {worker.especialidades?.slice(0, 2).map((esp, i) => (
                                            <Badge key={i} variant="outline" className="bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 text-xs">{esp}</Badge>
                                        ))}
                                        {(worker.especialidades?.length || 0) > 2 && (
                                            <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-xs">+{(worker.especialidades?.length || 0) - 2}</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm dark:text-gray-200">{worker.telefono}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{worker.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={worker.estado === 'Activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700'}>
                                        {worker.estado}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 dark:text-gray-400 hover:text-indigo-600" title="Registro de horas" onClick={() => openHoras(worker)}>
                                            <Clock className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 dark:text-gray-400 hover:text-indigo-600" title="Anotaciones" onClick={() => openAnotaciones(worker)}>
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:text-blue-700" title="Editar" onClick={() => openEdit(worker)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-700 dark:text-red-400" title="Eliminar" onClick={() => setDeleteId(worker.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
