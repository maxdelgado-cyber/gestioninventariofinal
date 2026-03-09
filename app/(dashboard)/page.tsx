'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Filter, ChevronLeft, ChevronRight,
    Calendar, DollarSign, Activity, Settings2,
    AlertCircle, CheckCircle2, Tag, Clock, Package,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { eventsAPI } from '@/lib/api/events';
import { inventoryAPI } from '@/lib/api/inventory';
import { vehiclesAPI } from '@/lib/api/vehicles';
import { workersAPI } from '@/lib/api/workers';
import { Event, InventoryItem, Vehicle, Worker } from '@/types/allegra';
import { format, addDays, isWithinInterval, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// ─────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────
function PayBadge({ label, count }: { label: string; count: number }) {
    const style =
        label === 'pagados' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
            label === 'abonados' ? 'bg-amber-50   text-amber-600   border-amber-200' :
                'bg-red-50     text-red-600     border-red-200';
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style}`}>
            {count} {label}
        </span>
    );
}

function StatRow({ label, value, valueClass = 'text-gray-900' }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex items-center justify-between py-0.5">
            <span className="text-[13px] text-gray-500">{label}</span>
            <span className={`text-[13px] font-bold ${valueClass}`}>{value}</span>
        </div>
    );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            setHasError(false);
            const [evts, inv, vehs, wrks] = await Promise.all([
                eventsAPI.getAll(),
                inventoryAPI.getAll(),
                vehiclesAPI.getAll(),
                workersAPI.getAll(),
            ]);
            setEvents(evts || []);
            setInventory(inv || []);
            setVehicles(vehs || []);
            setWorkers(wrks || []);
        } catch {
            setHasError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="h-10 w-10 rounded-full border-4 border-[#8B1DDF] border-t-transparent animate-spin mb-4" />
                <p className="text-gray-500 text-sm font-medium">Cargando panel...</p>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="bg-red-50 p-4 rounded-full">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">Error al cargar el panel</p>
                    <p className="text-sm text-gray-500 mt-1">No se pudo conectar con la base de datos.</p>
                </div>
                <button
                    onClick={loadData}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    /* ── Month navigation ── */
    const monthLabel = format(currentDate, "MMMM yyyy", { locale: es });
    const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    /* ── Month events ──
       Parse date-only strings (YYYY-MM-DD) directly to avoid UTC→local timezone
       offset shifting the date to the previous day in UTC-3/UTC-4 (Chile). */
    const parseEventYear = (fechaInicio: string) => parseInt(fechaInicio.substring(0, 4), 10);
    const parseEventMonth = (fechaInicio: string) => parseInt(fechaInicio.substring(5, 7), 10) - 1; // 0-indexed

    const monthEv = events.filter(e => {
        return parseEventYear(e.fechaInicio) === currentDate.getFullYear()
            && parseEventMonth(e.fechaInicio) === currentDate.getMonth();
    });

    const cerrados = monthEv.filter(e => e.estado === 'Cerrado').length;
    const enCurso = monthEv.filter(e => ['En Montaje', 'Montado', 'En Desmontaje'].includes(e.estado)).length;
    const proximos = monthEv.filter(e => e.estado === 'Agendado').length;
    const pagados = monthEv.filter(e => e.estadoPago === 'Pagado').length;
    const abonados = monthEv.filter(e => e.estadoPago === 'Abonado').length;
    const pendientes = monthEv.filter(e => !e.estadoPago || e.estadoPago === 'Pendiente de pago').length;

    /* ── Inventory capacity ── */
    const totalInv = inventory.length;
    const dispInv = inventory.filter(i => i.estado === 'Disponible').length;
    const pctDisp = totalInv > 0 ? Math.round((dispInv / totalInv) * 100) : 0;

    /* ── Resources ── */
    const totalVehs = vehicles.length;
    const dispVehs = vehicles.filter(v => v.estado === 'Disponible').length;
    const actWorkers = workers.filter(w => w.estado === 'Activo').length;
    const totalWorkers = workers.length;

    /* ── Próximos 7 días ── */
    const now = new Date();
    const in7 = addDays(now, 7);
    const evNext7 = events.filter(e => {
        // Parse as local date to avoid UTC offset shifting
        const d = new Date(e.fechaInicio.substring(0, 10) + 'T00:00:00');
        return d >= now && d <= in7;
    }).length;

    /* ── Distribución por tipo ── */
    const TYPES = ['Corporativo', 'Concierto', 'Boda', 'Fiesta en Domicilio', 'Festival', 'Teatro', 'Otro'] as const;
    const byType = TYPES.map(t => ({
        tipo: t,
        events: monthEv.filter(e => e.tipoEvento === t),
    })).filter(g => g.events.length > 0);

    return (
        <div className="space-y-6 pb-10">

            {/* ── Page header ── */}
            <div>
                <h1 className="text-[26px] font-bold text-gray-900 tracking-tight leading-tight">
                    Panel de Control Estratégico
                </h1>
                <p className="text-[13px] text-gray-400 mt-0.5">
                    Sistema de Gestión Integral - Allegra Producciones
                </p>
            </div>

            {/* ── Month filter bar (purple gradient) ── */}
            <div
                className="rounded-2xl flex flex-col sm:flex-row items-center justify-between px-6 py-4 text-white shadow-lg gap-4"
                style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 45%, #9333EA 100%)' }}
            >
                {/* Left label */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                    <Filter className="h-4 w-4 opacity-80" />
                    <span className="font-semibold text-[14px]">Análisis Mensual</span>
                </div>

                {/* Center: month nav */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={prevMonth} className="hover:bg-white/20 rounded-full p-1.5 transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-xl font-extrabold min-w-[190px] text-center tracking-tight">
                            {monthLabelCap}
                        </span>
                        <button onClick={nextMonth} className="hover:bg-white/20 rounded-full p-1.5 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <span className="text-[11px] text-purple-200 mt-0.5">
                        {monthEv.length} evento{monthEv.length !== 1 ? 's' : ''} programado{monthEv.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Right spacer (matches left width) */}
                <div className="hidden sm:block w-32" />
            </div>

            {/* ── 4 Stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* Card 1 — Total Eventos */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Total Eventos</span>
                        <div className="bg-violet-50 p-2 rounded-xl">
                            <Calendar className="h-4 w-4 text-violet-500" strokeWidth={2.2} />
                        </div>
                    </div>
                    <div className="text-[42px] font-extrabold text-gray-900 leading-none tracking-tight mb-2">
                        {monthEv.length}
                    </div>
                    <div className="text-[12px] text-gray-400">
                        <span className="text-green-500 font-semibold">{cerrados} cerrado{cerrados !== 1 ? 's' : ''}</span>
                        {' • '}
                        <span className="text-amber-500 font-semibold">{enCurso} en curso</span>
                        {' • '}
                        <span className="text-indigo-500 font-semibold">{proximos} próximo{proximos !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Card 2 — Estados de Pago */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Estados de Pago</span>
                        <div className="bg-emerald-50 p-2 rounded-xl">
                            <DollarSign className="h-4 w-4 text-emerald-500" strokeWidth={2.2} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <StatRow label="Pagados:" value={String(pagados)} valueClass="text-emerald-600" />
                        <StatRow label="Abonados:" value={String(abonados)} valueClass="text-amber-500" />
                        <StatRow label="Pendientes:" value={String(pendientes)} valueClass="text-red-500" />
                    </div>
                </div>

                {/* Card 3 — Capacidad Operativa */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Capacidad Operativa</span>
                        <div className="bg-blue-50 p-2 rounded-xl">
                            <Activity className="h-4 w-4 text-blue-500" strokeWidth={2.2} />
                        </div>
                    </div>
                    <div className="text-[42px] font-extrabold text-gray-900 leading-none tracking-tight mb-3">
                        {pctDisp}%
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                        <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{
                                width: `${pctDisp}%`,
                                background: 'linear-gradient(90deg, #3B82F6, #6366F1)',
                            }}
                        />
                    </div>
                    <p className="text-[11px] text-gray-400">
                        {dispInv} de {totalInv} unidades disponibles
                    </p>
                </div>

                {/* Card 4 — Recursos Activos */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Recursos Activos</span>
                        <div className="bg-orange-50 p-2 rounded-xl">
                            <Settings2 className="h-4 w-4 text-orange-400" strokeWidth={2.2} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <StatRow label="Vehículos:" value={`${dispVehs}/${totalVehs}`} />
                        <StatRow label="Trabajadores:" value={`${actWorkers}/${totalWorkers}`} />
                        <StatRow
                            label="Próximos 7 días:"
                            value={`${evNext7} evento${evNext7 !== 1 ? 's' : ''}`}
                            valueClass="text-violet-600"
                        />
                    </div>
                </div>

            </div>

            {/* ── Distribución por Tipo de Evento ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] p-6">
                <h2 className="text-[15px] font-bold text-gray-800 mb-5">
                    Distribución por Tipo de Evento — {monthLabelCap}
                </h2>

                {byType.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        Sin eventos para este mes
                    </div>
                ) : (
                    <div className="space-y-5">
                        {byType.map(({ tipo, events: evs }) => {
                            const pag = evs.filter(e => e.estadoPago === 'Pagado').length;
                            const abo = evs.filter(e => e.estadoPago === 'Abonado').length;
                            const pen = evs.filter(e => !e.estadoPago || e.estadoPago === 'Pendiente de pago').length;
                            // Bar pct relative to total month events
                            const pct = monthEv.length > 0 ? Math.round((evs.length / monthEv.length) * 100) : 0;

                            return (
                                <div key={tipo}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[14px] font-bold text-gray-800">{tipo}</span>
                                            <span className="text-[12px] text-gray-400">({evs.length} evento{evs.length !== 1 ? 's' : ''})</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <PayBadge label="pagados" count={pag} />
                                            <PayBadge label="abonados" count={abo} />
                                            <PayBadge label="pendientes" count={pen} />
                                        </div>
                                    </div>
                                    {/* Gradient bar */}
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-700"
                                            style={{
                                                width: `${Math.max(pct, 4)}%`,
                                                background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Bottom row: Próximos 7 Días + Top Equipos + Alertas ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Próximos 7 Días */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-violet-50 p-1.5 rounded-lg">
                            <Clock className="h-4 w-4 text-violet-500" strokeWidth={2.2} />
                        </div>
                        <h3 className="text-[14px] font-bold text-gray-800">Próximos 7 Días</h3>
                    </div>

                    {(() => {
                        const now7 = startOfDay(new Date());
                        const in7 = addDays(now7, 7);
                        const upcoming = events
                            .filter(e => {
                                const d = startOfDay(new Date(e.fechaInicio.substring(0, 10) + 'T00:00:00'));
                                return isWithinInterval(d, { start: now7, end: in7 });
                            })
                            .sort((a, b) => new Date(a.fechaInicio.substring(0, 10) + 'T00:00:00').getTime() - new Date(b.fechaInicio.substring(0, 10) + 'T00:00:00').getTime())
                            .slice(0, 5);

                        if (upcoming.length === 0) {
                            return (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    Sin eventos en los próximos 7 días
                                </div>
                            );
                        }
                        return (
                            <div className="space-y-3">
                                {upcoming.map(ev => (
                                    <Link
                                        key={ev.id}
                                        href={`/eventos?search=${encodeURIComponent(ev.nombre)}`}
                                        className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all active:scale-[0.98] group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-bold text-gray-900 truncate group-hover:text-purple-700">{ev.nombre}</p>
                                            <p className="text-[11px] text-violet-500 font-medium truncate mt-0.5">{ev.cliente}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(ev.fechaInicio), "d/M/yyyy")}
                                                </span>
                                                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                    <Tag className="h-3 w-3" />
                                                    {ev.tipoEvento}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ev.estado === 'Agendado' ? 'bg-violet-50 text-violet-600 border-violet-200' :
                                            ev.estado === 'En Montaje' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                ev.estado === 'Montado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>{ev.estado}</span>
                                    </Link>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* Alertas del Sistema */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-orange-50 p-1.5 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-orange-400" strokeWidth={2.2} />
                        </div>
                        <h3 className="text-[14px] font-bold text-gray-800">Alertas del Sistema</h3>
                    </div>

                    {(() => {
                        const damaged = inventory.filter(i => i.estado === 'Dañado').length;
                        const overdue = events.filter(e =>
                            e.estado === 'Agendado' && new Date(e.fechaInicio.substring(0, 10) + 'T00:00:00') < new Date()
                        ).length;
                        const alerts: string[] = [];
                        if (damaged > 0) alerts.push(`${damaged} equipo${damaged > 1 ? 's' : ''} con estado Dañado`);
                        if (overdue > 0) alerts.push(`${overdue} evento${overdue > 1 ? 's' : ''} sin iniciar (fecha pasada)`);

                        return alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-500" strokeWidth={1.8} />
                                </div>
                                <p className="text-[14px] font-bold text-emerald-600">¡Todo en orden!</p>
                                <p className="text-[12px] text-gray-400 mt-0.5">No hay alertas activas en este momento</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {alerts.map((a, i) => (
                                    <div key={i} className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
                                        <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-[13px] text-orange-700 font-medium">{a}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* Equipamiento más Solicitado */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-blue-50 p-1.5 rounded-lg">
                            <Package className="h-4 w-4 text-blue-500" strokeWidth={2.2} />
                        </div>
                        <h3 className="text-[14px] font-bold text-gray-800">Top 5 Equipamiento</h3>
                    </div>
                    {(() => {
                        const equipmentCount: Record<string, number> = {};
                        events.forEach(e => {
                            (e.equipamientoAsignado || []).forEach(item => {
                                const id = typeof item === 'string' ? item : item.id;
                                const qty = typeof item === 'string' ? 1 : item.cantidad;
                                equipmentCount[id] = (equipmentCount[id] || 0) + qty;
                            });
                        });
                        const topEquipment = Object.entries(equipmentCount)
                            .map(([id, requestedQty]) => {
                                const inv = inventory.find(i => i.id === id);
                                return {
                                    name: inv?.nombre || 'Equipo Desconocido',
                                    cat: inv?.categoria || '-',
                                    requestedQty
                                };
                            })
                            .sort((a, b) => b.requestedQty - a.requestedQty)
                            .slice(0, 5);

                        return topEquipment.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 text-sm">Sin datos de equipos</div>
                        ) : (
                            <div className="space-y-3">
                                {topEquipment.map((eq, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-bold text-gray-900 truncate">{eq.name}</p>
                                            <p className="text-[11px] text-gray-500 truncate mt-0.5 capitalize">{eq.cat}</p>
                                        </div>
                                        <span className="flex-shrink-0 text-[12px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                                            {eq.requestedQty}x
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

            </div>

        </div>
    );
}
