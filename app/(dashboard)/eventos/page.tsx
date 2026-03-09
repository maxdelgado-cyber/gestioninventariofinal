'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Calendar as CalendarIcon, Edit, Trash2, CalendarDays, MoreHorizontal, Pencil, Printer } from 'lucide-react';
import Link from 'next/link';
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
import { Event } from '@/types/allegra';
import { eventsAPI } from '@/lib/api/events';
import { toast } from 'sonner';
import { EventoFormDialog } from '@/components/forms/EventoFormDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function EventosPage() {
    return (
        <Suspense fallback={<div className="h-24 flex items-center justify-center">Cargando eventos...</div>}>
            <EventosContent />
        </Suspense>
    );
}

function EventosContent() {
    const searchParams = useSearchParams();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handlePaymentUpdate = async (event: Event, newStatus: string) => {
        try {
            await eventsAPI.update(event.id, { estadoPago: newStatus as any });
            toast.success(`Pago actualizado: ${newStatus}`);
            loadEvents();
        } catch (e: any) {
            toast.error(e?.message || 'Error al actualizar pago');
        }
    };

    useEffect(() => {
        loadEvents();
        const urlSearch = searchParams.get('search');
        if (urlSearch) setSearchQuery(urlSearch);
    }, [searchParams]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await eventsAPI.getAll();
            setEvents(data || []);
        } catch { toast.error('Error al cargar los eventos'); }
        finally { setLoading(false); }
    };

    const openNew = () => { setSelectedEvent(null); setDialogOpen(true); };
    const openEdit = (e: Event) => { setSelectedEvent(e); setDialogOpen(true); };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await eventsAPI.delete(deleteId);
            toast.success('Evento eliminado');
            loadEvents();
        } catch (e: any) {
            toast.error(e?.message || 'Error al eliminar');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Agendado':      return 'bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-xs font-semibold';
            case 'En Montaje':   return 'bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full text-xs font-semibold';
            case 'Montado':      return 'bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full text-xs font-semibold';
            case 'En Desmontaje':return 'bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full text-xs font-semibold';
            case 'Cerrado':      return 'bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full text-xs font-semibold';
            case 'Cancelado':    return 'bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-xs font-semibold';
            default:             return 'bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold';
        }
    };

    const getPaymentColor = (status?: string) => {
        switch (status) {
            case 'Pagado':  return 'bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full text-xs font-semibold';
            case 'Abonado': return 'bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full text-xs font-semibold';
            default:        return 'bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-xs font-semibold';
        }
    };

    const filtered = events.filter(e => {
        const matchSearch = e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.cliente.toLowerCase().includes(searchQuery.toLowerCase());
        const matchEstado = filterEstado === 'todos' || e.estado === filterEstado;
        return matchSearch && matchEstado;
    });

    /* ── Payment pencil dropdown (shared between mobile/desktop) ── */
    const PaymentDropdown = ({ event }: { event: Event }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex items-center justify-center h-7 w-7 rounded-md text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    aria-label="Cambiar estado de pago"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handlePaymentUpdate(event, 'Pagado')}>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 flex-shrink-0" /> Pagado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePaymentUpdate(event, 'Abonado')}>
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2 flex-shrink-0" /> Abonado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePaymentUpdate(event, 'Pendiente de pago')}>
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2 flex-shrink-0" /> Pendiente
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    /* ── Actions dropdown (shared) ── */
    const ActionsDropdown = ({ event }: { event: Event }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 p-0 cursor-pointer">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(event)}>
                    <Edit className="mr-2 h-4 w-4 text-blue-500" />Editar
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={`/ficha/${event.id}?type=evento`} target="_blank">
                        <Printer className="mr-2 h-4 w-4 text-purple-600" />Imprimir Ficha
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(event.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="space-y-5">
            <EventoFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={loadEvents}
                event={selectedEvent}
            />
            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar evento"
                description="¿Está seguro de eliminar este evento? Esta acción no se puede deshacer."
                confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Gestión de Eventos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Planificación y agenda de eventos</p>
                </div>
                <Button
                    onClick={openNew}
                    className="w-full sm:w-auto bg-[#8B1DDF] hover:bg-[#7214B8] text-white shadow-sm rounded-xl px-5 h-11 font-bold transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" />Nuevo Evento
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1 sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre o cliente..."
                        className="pl-9 h-11 bg-white dark:bg-gray-800"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="h-11 bg-white dark:bg-gray-800 sm:w-48">
                        <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="Agendado">Agendado</SelectItem>
                        <SelectItem value="En Montaje">En Montaje</SelectItem>
                        <SelectItem value="Montado">Montado</SelectItem>
                        <SelectItem value="En Desmontaje">En Desmontaje</SelectItem>
                        <SelectItem value="Cerrado">Cerrado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── MOBILE: card list ── */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-7 w-7 border-2 border-purple-600 border-t-transparent" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500 dark:text-gray-400">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                            <CalendarIcon className="h-7 w-7 text-gray-400" />
                        </div>
                        <p className="font-medium">No se encontraron eventos</p>
                        <Button variant="outline" size="sm" onClick={openNew} className="mt-1">
                            Crear primer evento
                        </Button>
                    </div>
                ) : filtered.map((event) => (
                    <div
                        key={event.id}
                        className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-4 shadow-sm active:scale-[0.99] transition-transform"
                    >
                        {/* Top row: name + actions */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-[15px] leading-snug">{event.nombre}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{event.cliente} · {event.tipoEvento}</p>
                            </div>
                            <ActionsDropdown event={event} />
                        </div>

                        {/* Date row */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {new Date(event.fechaInicio.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {event.horaInicio && <span>· {event.horaInicio}</span>}
                        </div>

                        {/* Badges row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={getStatusColor(event.estado)}>{event.estado}</span>
                            <div className="flex items-center gap-1">
                                <span className={getPaymentColor(event.estadoPago)}>{event.estadoPago || 'Pendiente'}</span>
                                <PaymentDropdown event={event} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── DESKTOP: table ── */}
            <div className="hidden sm:block bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/70 dark:bg-gray-800/50">
                        <TableRow>
                            <TableHead className="w-[280px]">Evento</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Pago</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" />
                                </div>
                            </TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-48 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full">
                                        <CalendarIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p>No se encontraron eventos.</p>
                                    <Button variant="outline" size="sm" onClick={openNew}>Crear primer evento</Button>
                                </div>
                            </TableCell></TableRow>
                        ) : filtered.map((event) => (
                            <TableRow key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-gray-900 dark:text-gray-100">{event.nombre}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{event.cliente} · {event.tipoEvento}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-800 dark:text-gray-200">
                                            {new Date(event.fechaInicio.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-CL')}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{event.horaInicio}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className={getPaymentColor(event.estadoPago)}>
                                            {event.estadoPago || 'Pendiente'}
                                        </Badge>
                                        <PaymentDropdown event={event} />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={getStatusColor(event.estado)}>{event.estado}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <ActionsDropdown event={event} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
