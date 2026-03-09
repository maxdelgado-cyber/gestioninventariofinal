'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Truck, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Vehicle, Worker } from '@/types/allegra';
import { vehiclesAPI } from '@/lib/api/vehicles';
import { workersAPI } from '@/lib/api/workers';
import { toast } from 'sonner';
import { VehiculoFormDialog } from '@/components/forms/VehiculoFormDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function VehiculosPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [v, w] = await Promise.all([vehiclesAPI.getAll(), workersAPI.getAll()]);
            setVehicles(v || []);
            setWorkers(w || []);
        } catch { toast.error('Error al cargar vehículos'); }
        finally { setLoading(false); }
    };

    const openNew = () => { setSelectedVehicle(null); setDialogOpen(true); };
    const openEdit = (v: Vehicle) => { setSelectedVehicle(v); setDialogOpen(true); };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await vehiclesAPI.delete(deleteId);
            toast.success('Vehículo eliminado');
            loadAll();
        } catch (e: any) {
            toast.error(e?.message || 'Error al eliminar');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'Disponible': return 'bg-green-100 text-green-700 border-green-200';
            case 'En Uso': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Mantenimiento': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getWorkerName = (id?: string) => {
        if (!id) return null;
        const w = workers.find(w => w.id === id);
        return w ? `${w.nombre} ${w.apellido}` : null;
    };

    const filtered = vehicles.filter(v =>
        v.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.patente.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <VehiculoFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={loadAll}
                vehicle={selectedVehicle}
            />

            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar vehículo"
                description="¿Está seguro de eliminar este vehículo? Esta acción no se puede deshacer."
                confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Vehículos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestione la flota vehicular y la asignación de conductores.</p>
                </div>
                <Button onClick={openNew} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />Nuevo Vehículo
                </Button>
            </div>

            <div className="relative max-w-md w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Buscar por nombre o patente..." className="pl-9 bg-white dark:bg-gray-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* ── MOBILE CARDS ── */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full inline-block"><Truck className="h-6 w-6 text-gray-400" /></div>
                        <p className="text-gray-500 dark:text-gray-400">No se encontraron vehículos.</p>
                        <Button variant="outline" size="sm" onClick={openNew}>Registrar primer vehículo</Button>
                    </div>
                ) : filtered.map((vehicle) => {
                    const conductorNombre = getWorkerName(vehicle.conductorAsignado);
                    return (
                        <div key={vehicle.id} className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-4 shadow-sm active:scale-[0.99] transition-transform">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-purple-500 shrink-0" />
                                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{vehicle.nombre}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">{vehicle.marca} {vehicle.modelo} • {vehicle.año}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className={getStatusColor(vehicle.estado)}>{vehicle.estado}</Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-9 w-9 p-0 dark:text-gray-400"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(vehicle)}>
                                                <Edit className="mr-2 h-4 w-4 text-blue-500" />Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(vehicle.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Patente</p>
                                    <p className="font-mono font-bold text-gray-800 dark:text-gray-200">{vehicle.patente}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{vehicle.tipo}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Conductor</p>
                                    {conductorNombre ? (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                            <span className="text-sm text-indigo-700 dark:text-indigo-400 font-medium">{conductorNombre}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-500 text-sm">Sin asignar</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden sm:block bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="dark:border-gray-700/60">
                            <TableHead className="w-[200px] dark:text-gray-400">Vehículo</TableHead>
                            <TableHead className="dark:text-gray-400">Patente</TableHead>
                            <TableHead className="dark:text-gray-400">Tipo</TableHead>
                            <TableHead className="dark:text-gray-400">Conductor (Trabajador)</TableHead>
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
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full"><Truck className="h-6 w-6 text-gray-400" /></div>
                                    <p>No se encontraron vehículos.</p>
                                    <Button variant="outline" size="sm" onClick={openNew}>Registrar primer vehículo</Button>
                                </div>
                            </TableCell></TableRow>
                        ) : filtered.map((vehicle) => {
                            const conductorNombre = getWorkerName(vehicle.conductorAsignado);
                            return (
                                <TableRow key={vehicle.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 dark:border-gray-700/40 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 dark:text-gray-100">{vehicle.nombre}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{vehicle.marca} {vehicle.modelo} • {vehicle.año}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono font-medium dark:text-gray-200">{vehicle.patente}</TableCell>
                                    <TableCell className="dark:text-gray-300">{vehicle.tipo}</TableCell>
                                    <TableCell>
                                        {conductorNombre ? (
                                            <div className="flex items-center gap-2">
                                                <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                <span className="text-sm text-indigo-700 dark:text-indigo-400 font-medium">{conductorNombre}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 text-sm">Sin asignar</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusColor(vehicle.estado)}>{vehicle.estado}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 p-0 dark:text-gray-400 dark:hover:text-gray-100"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(vehicle)}>
                                                    <Edit className="mr-2 h-4 w-4 text-blue-500" />Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(vehicle.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
