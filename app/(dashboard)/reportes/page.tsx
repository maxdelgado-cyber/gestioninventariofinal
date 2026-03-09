'use client';

import { useState, useEffect } from 'react';
import {
    FileText, Download, TrendingUp, Users, PackageOpen,
    ArrowRightLeft, AlertCircle, CalendarRange
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Event, InventoryItem, Worker, Client } from '@/types/allegra';
import { eventsAPI } from '@/lib/api/events';
import { inventoryAPI } from '@/lib/api/inventory';
import { workersAPI } from '@/lib/api/workers';
import { clientsAPI } from '@/lib/api/clients';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReportesPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [evt, inv, wrk, cls] = await Promise.all([
                eventsAPI.getAll(),
                inventoryAPI.getAll(),
                workersAPI.getAll(),
                clientsAPI.getAll()
            ]);
            setEvents(evt || []);
            setInventory(inv || []);
            setWorkers(wrk || []);
            setClients(cls || []);
        } catch (err: any) {
            setError(err?.message || 'Error al cargar los datos de reportes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    // AL-7 FIX: Show error UI with retry button
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="text-gray-600 font-medium">{error}</p>
                <Button variant="outline" onClick={loadAll}>
                    Reintentar
                </Button>
            </div>
        );
    }

    // 1. Estado del Inventario
    const invDisponible = inventory.filter(i => i.estado === 'Disponible').length;
    const invEnUso = inventory.filter(i => i.estado === 'En Uso').length;
    const invMantenimiento = inventory.filter(i => i.estado === 'En Mantenimiento' || i.estado === 'Dañado' || i.estado === 'Fuera de Servicio').length;

    // 2. Eventos por Periodo (Current Month)
    const currentMonthEvents = events.filter(e => {
        const d = new Date(e.fechaInicio);
        const today = new Date();
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });

    // 3. Horas de Trabajadores (Aproximation by distinct active events)
    const workerStats = workers.map(w => {
        const participations = events.filter(e => e.trabajadoresAsignados?.includes(w.id));
        return {
            ...w,
            eventosAsignados: participations.length,
            // Mock hours based on events for reporting display
            horasEstimadas: participations.length * 8
        };
    }).sort((a, b) => b.eventosAsignados - a.eventosAsignados);

    // 4. Orden de Retorno (Events in Desmontaje/Montado ready to return)
    const returnEvents = events.filter(e => ['Montado', 'En Desmontaje'].includes(e.estado));

    // 5. Incidentes Reportados (From Montaje or Desmontaje)
    const allIncidencias = events.flatMap(e => {
        const inc = e.incidencias || [];
        return inc.map((text, idx) => ({
            id: `${e.id}-${idx}`,
            eventId: e.id,
            eventName: e.nombre,
            cliente: e.cliente,
            fecha: e.fechaInicio,
            texto: text
        }));
    });

    const handleExportCSV = () => {
        // Create CSV Content
        const rows = [
            ['Reporte del Sistema Allegra'],
            ['Fecha de exportacion:', format(new Date(), 'dd/MM/yyyy HH:mm')],
            [''],
            ['=== ESTADO GENERAL DEL INVENTARIO ==='],
            ['Equipos Disponibles', invDisponible],
            ['Equipos en Uso', invEnUso],
            ['Equipos en Mantenimiento o Danados', invMantenimiento],
            [''],
            ['=== EVENTOS DEL MES ==='],
            ['Nombre del Evento', 'Cliente', 'Estado', 'Fecha Inicio', 'Fecha Fin'],
            ...currentMonthEvents.map(e => [
                e.nombre,
                e.cliente,
                e.estado,
                format(new Date(e.fechaInicio), 'dd/MM/yyyy'),
                format(new Date(e.fechaFin), 'dd/MM/yyyy')
            ]),
            [''],
            ['=== PARTICIPACION OPERATIVA DEL PERSONAL ==='],
            ['Nombre del Trabajador', 'Cargo', 'Eventos Participados', 'Horas Estimadas'],
            ...workerStats.map(w => [
                w.nombre,
                w.cargo,
                w.eventosAsignados,
                w.horasEstimadas
            ]),
            [''],
            ['=== CARTERA DE CLIENTES ==='],
            ['Nombre / Empresa', 'RUT', 'Telefono', 'Email', 'Direccion'],
            ...clients.map(c => [
                c.nombre,
                c.rut || 'N/A',
                c.telefono || 'N/A',
                c.email || 'N/A',
                c.direccion || 'N/A'
            ]),
            [''],
            ['=== INCIDENTES REGISTRADOS EN EVENTOS ==='],
            ['Evento', 'Cliente', 'Fecha', 'Descripcion del Incidente'],
            ...allIncidencias.map(inc => [
                inc.eventName,
                inc.cliente,
                format(new Date(inc.fecha), 'dd/MM/yyyy'),
                inc.texto
            ])
        ];

        // Convert to CSV string, handling commas inside content
        const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

        // Add BOM for UTF-8 to fix Excel handling accents
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Reporte_Allegra_${format(new Date(), 'dd-MM-yyyy')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-12 print-container">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Reportes y Estadísticas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Visualización de datos y exportación a Excel (CSV).</p>
                </div>
                <Button
                    variant="outline"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 hide-on-print font-medium"
                    onClick={handleExportCSV}
                >
                    <Download className="mr-2 h-4 w-4 text-purple-600" />
                    Descargar CSV
                </Button>
            </div>

            <Tabs defaultValue="inventario" className="w-full">
                {/* Mobile: scroll horizontal. Desktop: grid 5 cols */}
                <div className="hide-on-print mb-6 overflow-x-auto pb-1">
                    <TabsList className="flex sm:grid sm:grid-cols-5 w-max sm:w-full h-auto p-1 bg-gray-100/80 dark:bg-gray-800/60 rounded-xl gap-0.5">
                        <TabsTrigger value="inventario" className="shrink-0 px-4 py-2.5 rounded-lg text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm whitespace-nowrap">
                            <PackageOpen className="w-4 h-4 mr-1.5" />Inventario
                        </TabsTrigger>
                        <TabsTrigger value="eventos" className="shrink-0 px-4 py-2.5 rounded-lg text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm whitespace-nowrap">
                            <CalendarRange className="w-4 h-4 mr-1.5" />Eventos
                        </TabsTrigger>
                        <TabsTrigger value="trabajadores" className="shrink-0 px-4 py-2.5 rounded-lg text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm whitespace-nowrap">
                            <Users className="w-4 h-4 mr-1.5" />Personal
                        </TabsTrigger>
                        <TabsTrigger value="retorno" className="shrink-0 px-4 py-2.5 rounded-lg text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm whitespace-nowrap">
                            <ArrowRightLeft className="w-4 h-4 mr-1.5" />Retornos
                        </TabsTrigger>
                        <TabsTrigger value="incidentes" className="shrink-0 px-4 py-2.5 rounded-lg text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm whitespace-nowrap">
                            <AlertCircle className="w-4 h-4 mr-1.5" />Incidentes
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* 1. ESTADO DEL INVENTARIO */}
                <TabsContent value="inventario" className="space-y-6 mt-0 print-block">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-green-100 shadow-sm rounded-xl">
                            <CardContent className="p-6">
                                <div className="text-sm font-semibold text-green-600 mb-2">Disponibilidad</div>
                                <div className="text-3xl font-bold text-gray-900">{invDisponible}</div>
                                <div className="text-xs text-gray-500 mt-1">Equipos listos para uso</div>
                            </CardContent>
                        </Card>
                        <Card className="border-orange-100 shadow-sm rounded-xl">
                            <CardContent className="p-6">
                                <div className="text-sm font-semibold text-orange-600 mb-2">En Uso / Despliegue</div>
                                <div className="text-3xl font-bold text-gray-900">{invEnUso}</div>
                                <div className="text-xs text-gray-500 mt-1">Equipos asignados a eventos</div>
                            </CardContent>
                        </Card>
                        <Card className="border-red-100 shadow-sm rounded-xl">
                            <CardContent className="p-6">
                                <div className="text-sm font-semibold text-red-600 mb-2">Mantenimiento</div>
                                <div className="text-3xl font-bold text-gray-900">{invMantenimiento}</div>
                                <div className="text-xs text-gray-500 mt-1">Requieren atención técnica</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 font-bold text-gray-800">
                            Equipos en Reparación o Mantenimiento
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventory.filter(i => ['En Mantenimiento', 'Dañado', 'Fuera de Servicio'].includes(i.estado)).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-gray-500 py-6">No hay equipos en mantenimiento o dañados.</TableCell>
                                    </TableRow>
                                ) : (
                                    inventory.filter(i => ['En Mantenimiento', 'Dañado', 'Fuera de Servicio'].includes(i.estado)).map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-gray-900">{item.nombre}</TableCell>
                                            <TableCell>{item.categoria}</TableCell>
                                            <TableCell>
                                                <span className="text-red-700 bg-red-100 px-2 py-1 rounded-md text-xs font-semibold">
                                                    {item.estado}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* 2. EVENTOS POR PERIODO */}
                <TabsContent value="eventos" className="space-y-6 mt-0 print-block">
                    <Card className="border-purple-100 shadow-sm rounded-xl">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-purple-600 mb-2">Actividad del Mes Actual</div>
                                <div className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    {currentMonthEvents.length} <span className="text-base font-normal text-gray-500">Eventos gestionados</span>
                                </div>
                            </div>
                            <div className="h-16 w-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                                <TrendingUp className="h-8 w-8" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 font-bold text-gray-800">
                            Desglose Mensual
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Fechas</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentMonthEvents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-6">No hay eventos para el mes en curso.</TableCell>
                                    </TableRow>
                                ) : (
                                    currentMonthEvents.map(evt => (
                                        <TableRow key={evt.id}>
                                            <TableCell className="font-medium text-gray-900">{evt.nombre}</TableCell>
                                            <TableCell>{evt.cliente}</TableCell>
                                            <TableCell>{format(new Date(evt.fechaInicio), "dd MMM")} - {format(new Date(evt.fechaFin), "dd MMM")}</TableCell>
                                            <TableCell>{evt.estado}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* 3. HORAS DE TRABAJADORES */}
                <TabsContent value="trabajadores" className="space-y-6 mt-0 print-block">
                    <Card className="border-indigo-100 shadow-sm rounded-xl overflow-hidden">
                        <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center gap-2 font-bold text-indigo-900">
                            <Users className="h-4 w-4 text-indigo-600" />
                            Participación Operativa (Histórico)
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Trabajador</TableHead>
                                    <TableHead>Rol / Especialidad</TableHead>
                                    <TableHead className="text-center">Eventos Participados</TableHead>
                                    <TableHead className="text-center">Horas Estimadas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workerStats.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-6">No hay datos de trabajadores disponibles.</TableCell>
                                    </TableRow>
                                ) : (
                                    workerStats.map(w => (
                                        <TableRow key={w.id}>
                                            <TableCell className="font-medium text-gray-900">{w.nombre}</TableCell>
                                            <TableCell>{w.especialidades?.join(', ') || w.cargo}</TableCell>
                                            <TableCell className="text-center font-bold text-indigo-600">{w.eventosAsignados}</TableCell>
                                            <TableCell className="text-center text-gray-600">{w.horasEstimadas} hrs</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* 4. ORDEN DE RETORNO (DOCUMENTO DE DESMONTAJE) */}
                <TabsContent value="retorno" className="space-y-6 mt-0 print-block">
                    {returnEvents.length === 0 ? (
                        <div className="p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <PackageOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No hay retornos pendientes</h3>
                            <p className="text-gray-500">Todos los eventos han sido devueltos a bodega correctamente.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {returnEvents.map(evt => {
                                const evtItems = inventory.filter(i => evt.equipamientoAsignado?.includes(i.id));

                                return (
                                    <div key={evt.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden print-avoid-break">
                                        <div className="bg-gray-800 text-white p-5 flex justify-between items-center">
                                            <div>
                                                <h2 className="text-xl font-bold mb-1">Orden de Retorno a Bodega</h2>
                                                <div className="text-sm text-gray-300">Evento: {evt.nombre} | Cliente: {evt.cliente}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-xl">{evt.id.substring(0, 8).toUpperCase()}</div>
                                                <div className="text-xs text-gray-400">Fecha Impresión: {format(new Date(), "dd/MM/yyyy")}</div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-gray-500 block mb-1">Fecha de Término Evento:</span>
                                                    <span className="font-bold">{format(new Date(evt.fechaFin), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-gray-500 block mb-1">Responsable Desmontaje:</span>
                                                    <span className="font-bold border-b border-gray-300 w-full inline-block min-w-[200px]"></span>
                                                </div>
                                            </div>
                                            <Table>
                                                <TableHeader className="bg-gray-50">
                                                    <TableRow>
                                                        <TableHead className="w-[100px]">Código</TableHead>
                                                        <TableHead>Descripción del Equipo</TableHead>
                                                        <TableHead className="w-[150px] text-center">Estado</TableHead>
                                                        <TableHead className="w-[150px] text-center">Check Físico</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {evtItems.map(item => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-mono text-xs text-gray-500">{item.id.substring(0, 6)}</TableCell>
                                                            <TableCell className="font-medium">{item.nombre} <span className="text-xs text-gray-400 block">{item.categoria}</span></TableCell>
                                                            <TableCell className="text-center">{item.esInsumo ? 'Insumo' : 'Activo'}</TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="w-6 h-6 border-2 border-gray-300 rounded mx-auto print-exact"></div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            <div className="mt-12 grid grid-cols-2 gap-12 text-center text-sm">
                                                <div>
                                                    <div className="border-t border-gray-400 pt-2 font-bold text-gray-700">Firma Jefe Técnicos (Desmontaje)</div>
                                                </div>
                                                <div>
                                                    <div className="border-t border-gray-400 pt-2 font-bold text-gray-700">Firma Bodega (Recepción)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* 5. INCIDENTES REPORTADOS */}
                <TabsContent value="incidentes" className="space-y-6 mt-0 print-block">
                    <Card className="border-red-100 shadow-sm rounded-xl overflow-hidden">
                        <div className="bg-red-50/50 p-4 border-b border-red-100 flex items-center gap-2 font-bold text-red-900">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            Registro Histórico de Incidentes
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Descripción del Incidente / Reporte</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allIncidencias.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-6">No hay incidentes registrados.</TableCell>
                                    </TableRow>
                                ) : (
                                    allIncidencias.map(inc => (
                                        <TableRow key={inc.id}>
                                            <TableCell className="text-sm">{format(new Date(inc.fecha), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="font-medium text-gray-900">{inc.eventName}</TableCell>
                                            <TableCell>{inc.cliente}</TableCell>
                                            <TableCell className="text-red-700 font-medium">{inc.texto}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
