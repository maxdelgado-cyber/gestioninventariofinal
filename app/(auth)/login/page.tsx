'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_PASSWORD = 'allegra2026';
const PASSWORD_KEY = 'allegra_password';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const validPassword = localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
        if (password === validPassword) {
            document.cookie = 'allegra_auth_demo=true; path=/; max-age=86400';
            toast.success('Sesión iniciada correctamente');
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 300);
            return;
        }

        setShowHint(true);
        toast.error('Contraseña incorrecta');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#591b7d] via-[#352a71] to-[#252857] relative p-4 overflow-hidden">
            {/* Logo Container */}
            <div className="relative z-10 flex flex-col items-center mb-8">
                <div className="w-24 h-24 bg-black rounded-2xl flex flex-col items-center justify-center border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-purple-500/20">
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent"></div>

                    <svg viewBox="0 0 100 100" className="w-12 h-12 relative z-10 mb-1">
                        <path d="M50 20 L25 75 L30 75 L50 35 L70 75 L75 75 Z" fill="white" />
                        <circle cx="50" cy="55" r="25" stroke="#A855F7" strokeWidth="2" fill="none" strokeDasharray="80 100" strokeDashoffset="40" />
                    </svg>

                    <span className="text-[7px] tracking-[0.2em] text-white/90 relative z-10 mt-1 font-medium uppercase">
                        Productora
                    </span>
                </div>
                <h1 className="text-4xl font-bold text-white mt-6 tracking-wide drop-shadow-md">
                    Allegra
                </h1>
            </div>

            {/* Glassmorphism Card */}
            <div className="relative z-10 w-full max-w-[420px] bg-[#423D7F]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <h2 className="text-xl font-bold text-white drop-shadow-sm">Acceso Administrador</h2>
                    <p className="text-sm text-indigo-100/70 mt-2 text-center">
                        Ingresa tu contraseña para acceder al sistema
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-indigo-100/90 ml-1">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="........"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-purple-400 focus-visible:border-purple-400 h-11 rounded-lg transition-all"
                            />
                        </div>
                        {/* ME-2: password hint after first failed attempt */}
                        {showHint && (
                            <p className="text-[11px] text-purple-300/80 ml-1 mt-1">
                                💡 Contraseña de sistema: <span className="font-mono font-semibold">allegra2026</span>
                            </p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-gradient-to-r from-[#9333ea] to-[#6366f1] hover:from-[#a855f7] hover:to-[#818cf8] text-white font-semibold text-[15px] transition-all rounded-lg shadow-lg"
                    >
                        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </Button>
                </form>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-xs text-indigo-200/50 font-medium tracking-wide">
                Sistema de Gestión Integral © 2026 Allegra
            </div>

            {/* Background Glow Effects */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 mix-blend-screen pointer-events-none"></div>
        </div>
    );
}
