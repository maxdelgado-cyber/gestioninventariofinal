'use client';

import { useState } from 'react';
import { AppSidebar } from './Sidebar';
import { LogOut, WifiOff, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useOfflinePendingCount } from '@/components/OfflineSyncProvider';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pendingCount = useOfflinePendingCount();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );
                await supabase.auth.signOut();
            } catch { /* demo mode */ }
            document.cookie = 'allegra_auth_demo=; max-age=0; path=/';
            toast.success('Sesión cerrada exitosamente');
            router.push('/login');
        } catch {
            document.cookie = 'allegra_auth_demo=; max-age=0; path=/';
            router.push('/login');
        }
    };

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden print:h-auto print:overflow-visible print:bg-white bg-[#F1F3F8] dark:bg-gray-950">

            {/* ── TOP HEADER — pink → purple gradient ── */}
            <header
                className="pwa-header text-white z-50 flex-shrink-0 shadow-xl print:hidden flex flex-col"
                style={{ background: 'linear-gradient(90deg, #C026D3 0%, #9333EA 40%, #7C3AED 70%, #5B21B6 100%)' }}
            >
                {/* Spacer para el notch/Dynamic Island del iPhone */}
                <div style={{ height: 'env(safe-area-inset-top)' }} />

                {/* Contenido real del header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-2.5">

                {/* Left: Hamburger (mobile) + Logo + brand */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Hamburger button — mobile only */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-1.5 rounded-lg hover:bg-white/15 transition-colors lg:hidden"
                        aria-label="Abrir menú"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo.jpg"
                        alt="Allegra Productora"
                        className="h-9 sm:h-11 w-auto object-contain flex-shrink-0 rounded-md"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="flex flex-col leading-tight">
                        <span className="text-[14px] sm:text-[15px] font-bold tracking-wide">Allegra</span>
                        <span className="text-[10px] sm:text-[11px] text-purple-300 font-medium">Sistema de Gestión</span>
                    </div>
                </div>

                {/* Right: Offline badge + user info + logout */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* ME-5: Offline pending sync badge */}
                    {pendingCount > 0 && (
                        <div className="flex items-center gap-1 bg-yellow-400/20 border border-yellow-300/40 text-yellow-200 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                            <WifiOff className="h-3 w-3" />
                            {pendingCount}
                        </div>
                    )}
                    <div className="hidden sm:flex flex-col text-right leading-tight">
                        <span className="text-sm font-bold">Administrador</span>
                        <span className="text-[11px] text-purple-300">Sistema Allegra</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 hover:text-white flex items-center gap-1.5 transition-colors px-2 sm:px-3"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline font-medium text-sm">Salir</span>
                    </Button>
                </div>
                </div>{/* fin contenido header */}
            </header>

            {/* ── BODY ── */}
            <div className="flex flex-1 overflow-hidden print:overflow-visible print:block print:w-full">
                <div className="print:hidden h-full flex">
                    <AppSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                </div>
                <main className="pwa-main flex-1 overflow-auto p-4 sm:p-6 lg:p-8 print:overflow-visible print:p-0 print:block w-full">
                    <div className="mx-auto max-w-7xl print:max-w-none print:w-full print:m-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
