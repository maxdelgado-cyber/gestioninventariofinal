'use client';

import { useState, useEffect, Fragment } from 'react';
import { Plus, Search, MoreHorizontal, PackageOpen, Edit, Trash2, ChevronDown, ChevronRight, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InventarioExterno } from '@/types/allegra';
import { inventarioExternoAPI } from '@/lib/api/inventarioExterno';
import { toast } from 'sonner';
import { InventarioExternoFormDialog } from '@/components/forms/InventarioExternoFormDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/utils';

const estadoColor = (estado: string) => {
    switch (estado) {
        case 'Activo': return 'bg-green-100 text-green-700 border-green-200';
        case 'Pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'Devuelto': return 'bg-gray-100 text-gray-600 border-gray-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

export function InventarioExternoTab() {
    const [records, setRecords] = useState<InventarioExterno[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<InventarioExterno | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    useEffect(() => { loadRecords(); }, []);

    const loadRecords = async () => {
        try {
            setLoading(true);
            const data = await inventarioExternoAPI.getAll();
            setRecords(data || []);
        } catch { toast.error('Error al cargar inventario externo'); }
        finally { setLoading(false); }
    };

    const openNew = () => { setSelectedRecord(null); setDialogOpen(true); };
    const openEdit = (r: InventarioExterno) => { setSelectedRecord(r); setDialogOpen(true); };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await inventarioExternoAPI.delete(deleteId);
            toast.success('Registro eliminado');
            loadRecords();
        } catch (e: unknown) {
            toast.error((e as Error)?.message || 'Error al eliminar');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const toggleExpand = (id: string) =>
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const filtered = records.filter(r => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
            r.nombre.toLowerCase().includes(q) ||
            r.trabajadorNombre.toLowerCase().includes(q) ||
            (r.eventoNombre || '').toLowerCase().includes(q);
        const matchEstado = filterEstado === 'todos' || r.estado === filterEstado;
        return matchSearch && matchEstado;
    });

    return (
        <div className="space-y-5">
            <InventarioExternoFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={loadRecords}
                item={selectedRecord}
            />
            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar registro"
                description="¿Está seguro de eliminar este registro de inventario externo? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Inventario Externo</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Equipamiento de terceros a cargo de un trabajador</p>
                </div>
                <Button onClick={openNew} className="bg-[#8B1DDF] hover:bg-[#7214B8] text-white shadow-sm rounded-xl px-5 h-10 font-bold transition-colors">
                    <Plus className="mr-2 h-4 w-4" />Registrar inventario
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar por nombre, trabajador o evento..."
                        className="pl-9 bg-white dark:bg-gray-800"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-gray-800">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Devuelto">Devuelto</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── MOBILE CARDS ── */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full inline-block">
                            <PackageOpen className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No hay registros de inventario externo.</p>
                        <Button variant="outline" size="sm" onClick={openNew}>Agregar registro</Button>
                    </div>
                ) : filtered.map(r => (
                    <div key={r.id} className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-4 shadow-sm active:scale-[0.99] transition-transform">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{r.nombre}</p>
                                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    <User className="h-3 w-3" />
                                    <span>{r.trabajadorNombre}</span>
                                </div>
                                {r.eventoNombre && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-3 w-3" />
                                        <span>{r.eventoNombre}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className={estadoColor(r.estado)}>{r.estado}</Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-9 w-9 p-0 dark:text-gray-400">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(r)}>
                                            <Edit className="mr-2 h-4 w-4 text-blue-500" />Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(r.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Entrega</p>
                                <p className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(r.fechaEntrega)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Devolución</p>
                                <p className="text-gray-700 dark:text-gray-300 font-medium">{r.fechaDevolucion ? formatDate(r.fechaDevolucion) : '—'}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => toggleExpand(r.id)}
                            className="mt-2 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium"
                        >
                            {expandedIds.includes(r.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            {r.items.length} ítem{r.items.length !== 1 ? 's' : ''}
                        </button>

                        {expandedIds.includes(r.id) && (
                            <div className="mt-2 space-y-1">
                                {r.items.map(it => (
                                    <div key={it.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded px-2 py-1 text-xs">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{it.nombre}</span>
                                        <span className="text-gray-500 dark:text-gray-400">×{it.cantidad}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden sm:block bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableRow className="dark:border-gray-700/60">
                            <TableHead className="w-[240px] dark:text-gray-400">Nombre</TableHead>
                            <TableHead className="dark:text-gray-400">Trabajador</TableHead>
                            <TableHead className="dark:text-gray-400">Evento</TableHead>
                            <TableHead className="dark:text-gray-400">Ítems</TableHead>
                            <TableHead className="dark:text-gray-400">Entrega</TableHead>
                            <TableHead className="dark:text-gray-400">Devolución</TableHead>
                            <TableHead className="dark:text-gray-400">Estado</TableHead>
                            <TableHead className="text-right dark:text-gray-400">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-48 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full">
                                            <PackageOpen className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <p>No hay registros de inventario externo.</p>
                                        <Button variant="outline" size="sm" onClick={openNew}>Agregar registro</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filtered.map(r => (
                            <Fragment key={r.id}>
                                <TableRow
                                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 dark:border-gray-700/40 transition-colors"
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => toggleExpand(r.id)}
                                                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            >
                                                {expandedIds.includes(r.id)
                                                    ? <ChevronDown className="h-3.5 w-3.5 text-purple-600" />
                                                    : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                                            </button>
                                            <span className="text-gray-900 dark:text-gray-100">{r.nombre}</span>
                                        </div>
                                        {r.notas && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 ml-6 truncate max-w-[200px]">{r.notas}</p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                                            <User className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                            {r.trabajadorNombre}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                        {r.eventoNombre || <span className="text-gray-400 dark:text-gray-600 italic text-xs">Sin evento</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                                            {r.items.length} ítem{r.items.length !== 1 ? 's' : ''}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatDate(r.fechaEntrega)}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                        {r.fechaDevolucion ? formatDate(r.fechaDevolucion) : <span className="text-gray-400 dark:text-gray-600 italic text-xs">Pendiente</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={estadoColor(r.estado)}>{r.estado}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 p-0 dark:text-gray-400 dark:hover:text-gray-100">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(r)}>
                                                    <Edit className="mr-2 h-4 w-4 text-blue-500" />Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(r.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>

                                {/* Expanded items row */}
                                {expandedIds.includes(r.id) && (
                                    <TableRow className="bg-purple-50/30 dark:bg-purple-900/10">
                                        <TableCell colSpan={8} className="py-2 px-6">
                                            <div className="flex flex-wrap gap-2">
                                                {r.items.map(it => (
                                                    <div key={it.id} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-xs">
                                                        <span className="font-semibold text-purple-700 dark:text-purple-400">{it.cantidad}×</span>
                                                        <span className="text-gray-700 dark:text-gray-300">{it.nombre}</span>
                                                        {it.marca && <span className="text-gray-400 dark:text-gray-500">{it.marca}</span>}
                                                        {it.estado && (
                                                            <span className="text-gray-400 dark:text-gray-500 italic">({it.estado})</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
