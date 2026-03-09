'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Building2, Edit, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Client, Event } from '@/types/allegra';
import { clientsAPI } from '@/lib/api/clients';
import { eventsAPI } from '@/lib/api/events';
import { toast } from 'sonner';
import { ClienteFormDialog } from '@/components/forms/ClienteFormDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// ── Payment status derived from the client's events ──────────────────────────
type PayStatus = 'Al día' | 'Con deuda' | 'Con abono' | 'Sin eventos';

function getPayStatus(clientName: string, events: Event[]): PayStatus {
    const clientEvents = events.filter(
        e => e.cliente === clientName && e.estado !== 'Cancelado'
    );
    if (clientEvents.length === 0) return 'Sin eventos';

    const hasPending = clientEvents.some(e => e.estadoPago === 'Pendiente de pago');
    const hasAbonado = clientEvents.some(e => e.estadoPago === 'Abonado');

    if (hasPending) return 'Con deuda';
    if (hasAbonado) return 'Con abono';
    return 'Al día';
}

function PayBadge({ status }: { status: PayStatus }) {
    switch (status) {
        case 'Al día':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle2 className="h-3 w-3" />Al día
                </span>
            );
        case 'Con deuda':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    <AlertCircle className="h-3 w-3" />Con deuda
                </span>
            );
        case 'Con abono':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                    <Clock className="h-3 w-3" />Con abono
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                    Sin eventos
                </span>
            );
    }
}

export default function ClientesPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [clientData, eventData] = await Promise.all([
                clientsAPI.getAll(),
                eventsAPI.getAll(),
            ]);
            setClients(clientData || []);
            setEvents(eventData || []);
        } catch { toast.error('Error al cargar clientes'); }
        finally { setLoading(false); }
    };

    const openNew = () => { setSelectedClient(null); setDialogOpen(true); };
    const openEdit = (client: Client) => { setSelectedClient(client); setDialogOpen(true); };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await clientsAPI.delete(deleteId);
            toast.success('Cliente eliminado');
            loadAll();
        } catch (e: any) {
            toast.error(e?.message || 'Error al eliminar');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const filtered = clients.filter(c =>
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactoResponsable.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <ClienteFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={loadAll}
                client={selectedClient}
            />

            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar cliente"
                description="¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Gestión de Clientes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Administra tu cartera de clientes y su información de contacto.</p>
                </div>
                <Button onClick={openNew} className="bg-[#8B1DDF] hover:bg-[#7214B8] text-white shadow-sm rounded-xl px-5 h-10 font-bold transition-colors">
                    <Plus className="mr-2 h-4 w-4" />Nuevo Cliente
                </Button>
            </div>

            <div className="relative max-w-md w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Buscar cliente..." className="pl-9 bg-white dark:bg-gray-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* ── MOBILE CARDS ── */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1a2e] border dark:border-gray-700/60 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full inline-block"><Building2 className="h-6 w-6 text-gray-400" /></div>
                        <p className="text-gray-500 dark:text-gray-400">No se encontraron clientes.</p>
                        <Button variant="outline" size="sm" onClick={openNew}>Agregar primer cliente</Button>
                    </div>
                ) : filtered.map((client) => {
                    const payStatus = getPayStatus(client.nombre, events);
                    return (
                        <div key={client.id} className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-4 shadow-sm active:scale-[0.99] transition-transform">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{client.nombre}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{client.tipoCliente} • {client.rut || 'S/R'}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-9 w-9 p-0 text-gray-500 dark:text-gray-400"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(client)}>
                                                <Edit className="mr-2 h-4 w-4 text-blue-500" />Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(client.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Contacto</p>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium truncate">{client.contactoResponsable}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{client.telefono}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide">Eventos</p>
                                    <p className="text-gray-700 dark:text-gray-300">{client.eventosRealizados} evento(s)</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <PayBadge status={payStatus} />
                                <Badge variant="outline" className={client.estado === 'Activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700'}>
                                    {client.estado}
                                </Badge>
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
                            <TableHead className="w-[250px] dark:text-gray-400">Cliente</TableHead>
                            <TableHead className="dark:text-gray-400">Contacto</TableHead>
                            <TableHead className="dark:text-gray-400">Eventos</TableHead>
                            <TableHead className="dark:text-gray-400">Pago</TableHead>
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
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full"><Building2 className="h-6 w-6 text-gray-400" /></div>
                                    <p>No se encontraron clientes.</p>
                                    <Button variant="outline" size="sm" onClick={openNew}>Agregar primer cliente</Button>
                                </div>
                            </TableCell></TableRow>
                        ) : filtered.map((client) => {
                            const payStatus = getPayStatus(client.nombre, events);
                            return (
                                <TableRow key={client.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 dark:border-gray-700/40 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 dark:text-gray-100">{client.nombre}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{client.tipoCliente} • {client.rut || 'S/R'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm dark:text-gray-200">{client.contactoResponsable}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{client.telefono}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="dark:text-gray-300">{client.eventosRealizados}</TableCell>
                                    <TableCell>
                                        <PayBadge status={payStatus} />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={client.estado === 'Activo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700'}>
                                            {client.estado}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 p-0 dark:text-gray-400 dark:hover:text-gray-100"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(client)}>
                                                    <Edit className="mr-2 h-4 w-4 text-blue-500" />Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteId(client.id)}>
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
