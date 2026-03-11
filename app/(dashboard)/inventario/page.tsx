'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Package, Edit, Trash2, ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
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
import { InventoryItem, Event } from '@/types/allegra';
import { inventoryAPI } from '@/lib/api/inventory';
import { eventsAPI } from '@/lib/api/events';
import { toast } from 'sonner';
import { InventarioFormDialog } from '@/components/forms/InventarioFormDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function InventarioPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [activeEvents, setActiveEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterCategoria, setFilterCategoria] = useState('todas');
    const [filterSubcategoria, setFilterSubcategoria] = useState('todas');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [filterPiso, setFilterPiso] = useState('todos');

    useEffect(() => { loadItems(); }, []);

    const loadItems = async () => {
        try {
            setLoading(true);
            const [inventData, eventsData] = await Promise.all([
                inventoryAPI.getAll(),
                eventsAPI.getAll()
            ]);
            setItems(inventData || []);
            setActiveEvents(eventsData || []);
        } catch { toast.error('Error al cargar inventario'); }
        finally { setLoading(false); }
    };

    const openNew = () => { setSelectedItem(null); setDialogOpen(true); };
    const openEdit = (item: InventoryItem) => { setSelectedItem(item); setDialogOpen(true); };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await inventoryAPI.delete(deleteId);
            toast.success('Ítem eliminado');
            loadItems();
        } catch (e: any) {
            toast.error(e?.message || 'Error al eliminar');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Disponible': return 'bg-green-100 text-green-700 border-green-200';
            case 'Operativo': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Reservado': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Uso': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'En Mantenimiento': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Falta Mantenimiento': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Dañado': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const itemsForPiso = items.filter(i =>
        filterPiso === 'todos' ? true :
            filterPiso === '2do' ? i.ubicacion === '2do Piso' :
                i.ubicacion !== '2do Piso'
    );

    const categories = ['todas', ...Array.from(new Set(itemsForPiso.map(i => i.categoria))).sort()];
    const itemsForSub = filterCategoria === 'todas' ? itemsForPiso : itemsForPiso.filter(i => i.categoria === filterCategoria);
    const subcategories = ['todas', ...Array.from(new Set(itemsForSub.map(i => i.subcategoria).filter(Boolean) as string[])).sort()];

    const filtered = items.filter(i => {
        const searchText = searchQuery.toLowerCase();
        const matchSearch = i.nombre.toLowerCase().includes(searchText) ||
            i.categoria.toLowerCase().includes(searchText) ||
            (i.subcategoria || '').toLowerCase().includes(searchText);
        const matchEstado = filterEstado === 'todos' || i.estado === filterEstado;
        const matchCategoria = filterCategoria === 'todas' || i.categoria === filterCategoria;
        const matchSubcategoria = filterSubcategoria === 'todas' || i.subcategoria === filterSubcategoria;
        const matchPiso = filterPiso === 'todos' ||
            (filterPiso === 'bodega' && i.ubicacion !== '2do Piso') ||
            (filterPiso === '2do' && i.ubicacion === '2do Piso');
        return matchSearch && matchEstado && matchCategoria && matchSubcategoria && matchPiso;
    });

    const itemUsageMap: Record<string, { enUso: number, mntgFuturo: number, reservado: number }> = {};
    const todayStr = new Date().toISOString().split('T')[0];

    activeEvents.forEach(e => {
        const isMounted = ['En Montaje', 'Montado', 'En Desmontaje'].includes(e.estado);
        const isScheduled = e.estado === 'Agendado';
        const isStarted = e.fechaInicio <= todayStr;

        e.equipamientoAsignado?.forEach(eq => {
            const id = typeof eq === 'string' ? eq : eq.id;
            const qty = typeof eq === 'string' ? 1 : eq.cantidad;

            if (!itemUsageMap[id]) itemUsageMap[id] = { enUso: 0, mntgFuturo: 0, reservado: 0 };

            if (isMounted && isStarted) {
                itemUsageMap[id].enUso += qty;
            } else if (isMounted && !isStarted) {
                itemUsageMap[id].mntgFuturo += qty;
            } else if (isScheduled) {
                itemUsageMap[id].reservado += qty;
            }
        });
    });

    return (
        <div className="space-y-6">
            <InventarioFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={loadItems}
                item={selectedItem}
            />

            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar equipo"
                description="¿Está seguro de eliminar este ítem del inventario? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            {/* Page header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Inventario</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Control de equipamiento y stock</p>
                </div>
                <Button onClick={openNew} className="bg-[#8B1DDF] hover:bg-[#7214B8] text-white shadow-sm rounded-xl px-5 h-10 font-bold transition-colors">
                    <Plus className="mr-2 h-4 w-4" />Ingresar Equipo
                </Button>
            </div>




            {/* Floor filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">📍 Piso:</span>
                {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'bodega', label: '🏠 Bodega Principal' },
                    { id: '2do', label: '🏢 2do Piso' }
                ].map(p => (
                    <button
                        key={p.id}
                        onClick={() => { setFilterPiso(p.id); setFilterCategoria('todas'); setFilterSubcategoria('todas'); }}
                        className={`px-3 py-1.5 text-sm rounded-full font-medium border transition-all min-h-[36px] ${filterPiso === p.id
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:text-purple-700'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input placeholder="Buscar equipo por nombre o categoría..." className="pl-9 bg-white dark:bg-gray-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Select value={filterCategoria} onValueChange={(val) => { setFilterCategoria(val); setFilterSubcategoria('todas'); }}>
                    <SelectTrigger className="w-full sm:w-48 bg-white">
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(c => (
                            <SelectItem key={c} value={c}>
                                {c === 'todas' ? 'Todas las categorías' : c.charAt(0).toUpperCase() + c.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterSubcategoria} onValueChange={setFilterSubcategoria}>
                    <SelectTrigger className="w-full sm:w-48 bg-white">
                        <SelectValue placeholder="Subcategoría" />
                    </SelectTrigger>
                    <SelectContent>
                        {subcategories.map(s => (
                            <SelectItem key={s || 'none'} value={s || 'none'}>
                                {s === 'todas' ? 'Todas las subcategorías' : s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="w-full sm:w-48 bg-white">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
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

            {/* ── MOBILE CARDS ── */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full inline-block"><Package className="h-6 w-6 text-gray-400" /></div>
                        <p className="text-gray-500 dark:text-gray-400">No se encontraron equipos.</p>
                        <Button variant="outline" size="sm" onClick={openNew}>Agregar primer equipo</Button>
                    </div>
                ) : filtered.map((item) => {
                    const usage = itemUsageMap[item.id] || { enUso: 0, mntgFuturo: 0, reservado: 0 };
                    const disponible = item.cantidad - usage.enUso;
                    let computedBadge = item.estado;
                    if (computedBadge === 'En Uso' && usage.enUso === 0) computedBadge = 'Disponible';
                    if (computedBadge === 'Disponible' && disponible <= 0 && usage.enUso > 0) computedBadge = 'En Uso';
                    return (
                        <div key={item.id} className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-4 shadow-sm active:scale-[0.99] transition-transform">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{item.nombre}</p>
                                        {item.esContenedor && <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] h-4 px-1 shrink-0">KIT</Badge>}
                                        {item.esInsumo && <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-[10px] h-4 px-1 shrink-0">Insumo</Badge>}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.marca} {item.modelo}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className={getStatusColor(computedBadge)}>{computedBadge}</Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-9 w-9 p-0 dark:text-gray-400"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(item)}>
                                                <Edit className="mr-2 h-4 w-4 text-blue-500" />Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(item.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Categoría</p>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">{item.categoria}</p>
                                    {item.subcategoria && <p className="text-xs text-gray-500 dark:text-gray-400">{item.subcategoria}</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Cantidad</p>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-gray-800 dark:text-gray-200 font-bold">{disponible}<span className="text-gray-500 dark:text-gray-400 font-normal">/{item.cantidad}</span></p>
                                        {item.esInsumo && item.cantidad <= (item.stockMinimo ?? 2) && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                                                <AlertTriangle className="h-2.5 w-2.5" />Bajo
                                            </span>
                                        )}
                                    </div>
                                    {usage.enUso > 0 && <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">{usage.enUso} en uso</p>}
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <Package className="h-3 w-3" />
                                <span>{item.ubicacion}</span>
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
                            <TableHead className="w-[300px] dark:text-gray-400">Equipo</TableHead>
                            <TableHead className="dark:text-gray-400">Categoría</TableHead>
                            <TableHead className="dark:text-gray-400">Cantidad</TableHead>
                            <TableHead className="dark:text-gray-400">Estado</TableHead>
                            <TableHead className="dark:text-gray-400">Ubicación</TableHead>
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
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full"><Package className="h-6 w-6 text-gray-400" /></div>
                                    <p>No se encontraron equipos en el inventario.</p>
                                    <Button variant="outline" size="sm" onClick={openNew}>Agregar primer equipo</Button>
                                </div>
                            </TableCell></TableRow>
                        ) : filtered.map((item) => (
                            <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 dark:border-gray-700/40 transition-colors">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            {item.esContenedor && (
                                                <button
                                                    onClick={() => toggleExpand(item.id)}
                                                    className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    {expandedIds.includes(item.id) ? <ChevronDown className="h-3.5 w-3.5 text-purple-600" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                                                </button>
                                            )}
                                            <span className="text-gray-900 dark:text-gray-100">{item.nombre}</span>
                                            {item.esContenedor && (
                                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] h-4 px-1">KIT / CASE</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">{item.marca} {item.modelo}</span>
                                        {item.esContenedor && expandedIds.includes(item.id) && (
                                            <div className="mt-2 pl-6 py-2 border-l-2 border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/10 rounded-r-md">
                                                <p className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider mb-1 px-2">Contenido:</p>
                                                <div className="text-[11px] text-purple-900 dark:text-purple-200 bg-white/50 dark:bg-gray-800/40 p-2 rounded border border-purple-100/50 dark:border-purple-900/20">
                                                    {(() => {
                                                        // Use itemsRef as source of truth; get quantities from itemsDetalle
                                                        const refs = item.contenidoInterno?.itemsRef || [];
                                                        const detalleMap = new Map((item.contenidoInterno?.itemsDetalle || []).map(d => [d.id, d.cantidad]));
                                                        if (refs.length > 0) {
                                                            return (
                                                                <ul className="space-y-1 mb-2 pl-2">
                                                                    {refs.map(refId => {
                                                                        const relatedItem = items.find((i: InventoryItem) => i.id === refId);
                                                                        const cantidad = detalleMap.get(refId) ?? 1;
                                                                        return (
                                                                            <li key={refId} className="flex items-center gap-2">
                                                                                <span className="font-semibold text-purple-700">{cantidad}x</span>
                                                                                <span className="text-gray-700">{relatedItem?.nombre || 'Ítem no encontrado'}</span>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                    {item.contenidoInterno?.descripcion && (
                                                        <p className="whitespace-pre-wrap font-mono mt-1 pt-1 border-t border-purple-100/50 dark:border-purple-900/20 italic text-gray-500">{item.contenidoInterno.descripcion}</p>
                                                    )}
                                                    {(!item.contenidoInterno?.itemsRef?.length && !item.contenidoInterno?.descripcion) && (
                                                        <span className="text-gray-400 italic">No hay ítems registrados en este case.</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 items-start">
                                        <Badge variant="outline" className="bg-gray-50 text-gray-700">{item.categoria}</Badge>
                                        {item.subcategoria && (
                                            <span className="text-xs text-gray-500">{item.subcategoria}</span>
                                        )}
                                        {item.esInsumo && (
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-[10px] px-1.5 py-0 h-4">Insumo</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const usage = itemUsageMap[item.id] || { enUso: 0, mntgFuturo: 0, reservado: 0 };
                                                const disponible = item.cantidad - usage.enUso;
                                                return (
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900 font-medium">
                                                            {disponible} / {item.cantidad} {item.unidadMedida || ''}
                                                        </span>
                                                        {usage.enUso > 0 && <span className="text-[10px] text-purple-600 font-medium">{usage.enUso} en uso</span>}
                                                    </div>
                                                );
                                            })()}
                                            {item.esInsumo && item.cantidad <= (item.stockMinimo ?? 2) && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                                                    <AlertTriangle className="h-2.5 w-2.5" />
                                                    Bajo
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        const usage = itemUsageMap[item.id] || { enUso: 0, mntgFuturo: 0, reservado: 0 };
                                        const disponible = item.cantidad - usage.enUso;

                                        let computedBadge = item.estado;
                                        // Corregimos visualmente si la DB se quedó pegada en "En Uso"
                                        if (computedBadge === 'En Uso' && usage.enUso === 0) {
                                            computedBadge = 'Disponible';
                                        }
                                        if (computedBadge === 'Disponible') {
                                            if (disponible <= 0 && usage.enUso > 0) {
                                                computedBadge = 'En Uso';
                                            }
                                        }
                                        return <Badge variant="outline" className={getStatusColor(computedBadge)}>{computedBadge}</Badge>;
                                    })()}
                                </TableCell>
                                <TableCell className="text-gray-600 dark:text-gray-400 text-sm">{item.ubicacion}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-9 w-9 p-0 dark:text-gray-400 dark:hover:text-gray-100"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(item)}>
                                                <Edit className="mr-2 h-4 w-4 text-blue-500" />Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(item.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
