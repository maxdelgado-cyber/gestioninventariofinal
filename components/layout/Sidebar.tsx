'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    Calendar,
    Building2,
    Package,
    Boxes,
    PackageCheck,
    PackageX,
    Truck,
    Users,
    Settings,
    FileBarChart2,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Eventos', href: '/eventos', icon: Calendar },
    { name: 'Clientes', href: '/clientes', icon: Building2 },
    { name: 'Inventario', href: '/inventario', icon: Package },
    { name: 'Inv. Externo', href: '/inventario-externo', icon: Boxes },
    { name: 'Montaje', href: '/montaje', icon: PackageCheck },
    { name: 'Desmontaje', href: '/desmontaje', icon: PackageX },
    { name: 'Vehículos', href: '/vehiculos', icon: Truck },
    { name: 'Trabajadores', href: '/trabajadores', icon: Users },
    { name: 'Reportes', href: '/reportes', icon: FileBarChart2 },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
];

interface AppSidebarProps {
    mobileOpen: boolean;
    onClose: () => void;
}

export function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* ── Dark overlay for mobile ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={cn(
                    'bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-full overflow-y-auto shadow-sm z-50 transition-transform duration-300 ease-in-out',
                    // Desktop: always visible, static
                    'lg:relative lg:translate-x-0 lg:w-[185px] lg:flex-shrink-0',
                    // Mobile: fixed drawer from left
                    'fixed top-0 left-0 w-[260px]',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Brand header — responsive for both mobile and desktop */}
                {/* Mobile: full gradient with close button */}
                <div
                    className="lg:hidden flex flex-col"
                    style={{ background: 'linear-gradient(135deg, #C026D3 0%, #7C3AED 100%)' }}
                >
                    {/* Spacer para notch/Dynamic Island */}
                    <div style={{ height: 'env(safe-area-inset-top)' }} />
                    <div className="flex items-center gap-3 px-4 py-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo.jpg"
                        alt="Allegra"
                        className="h-10 w-10 object-contain rounded-md flex-shrink-0"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="flex flex-col leading-tight">
                        <span className="text-[16px] font-bold text-white tracking-wide">Allegra</span>
                        <span className="text-[11px] text-purple-200 font-medium">Sistema de Gestión</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 rounded-lg hover:bg-white/20 text-white/80"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    </div>{/* fin contenido sidebar header */}
                </div>

                <nav className="flex flex-col gap-0.5 px-2.5 pt-3 pb-4 flex-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-2.5 px-3 h-10 lg:h-9 rounded-lg text-[14px] lg:text-[13px] font-medium transition-all',
                                    isActive
                                        ? 'bg-[#8B1DDF] text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                                )}
                            >
                                <item.icon
                                    className={cn('h-5 w-5 lg:h-4 lg:w-4 flex-shrink-0', isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500')}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 text-center text-[10px] text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800">
                    © 2026 Allegra Productora
                </div>
            </aside>
        </>
    );
}
