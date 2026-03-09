'use client';

import { useState, useEffect } from 'react';
import { Save, Bell, Shield, KeyRound, Building2, Eye, EyeOff, Moon, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';

const STORAGE_KEY = 'allegra_config';
const PASSWORD_KEY = 'allegra_password';
const DEFAULT_PASSWORD = 'allegra2026';

const defaultConfig = {
    companyName: 'Allegra Producciones',
    rut: '76.123.456-K',
    phone: '+56 9 1234 5678',
    email: 'contacto@allegra.cl',
    address: 'Av. Providencia 1234, Santiago',
};

type Section = 'empresa' | 'seguridad' | 'apariencia';

export default function ConfiguracionPage() {
    const [activeSection, setActiveSection] = useState<Section>('empresa');
    const [config, setConfig] = useState(defaultConfig);
    const [saving, setSaving] = useState(false);
    const { theme, toggle } = useTheme();

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setConfig({ ...defaultConfig, ...JSON.parse(stored) });
            }
        } catch {
            // ignore
        }
    }, []);

    const set = (key: string, value: string) => setConfig(prev => ({ ...prev, [key]: value }));

    const handlePasswordChange = async () => {
        const storedPassword = localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;

        if (currentPassword !== storedPassword) {
            toast.error('La contraseña actual es incorrecta.');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden.');
            return;
        }

        setSavingPassword(true);
        try {
            localStorage.setItem(PASSWORD_KEY, newPassword);
            await new Promise(r => setTimeout(r, 300));
            toast.success('Contraseña actualizada correctamente');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            toast.error('Error al guardar la contraseña');
        } finally {
            setSavingPassword(false);
        }
    };

    const handleSave = async () => {
        if (!config.companyName.trim()) {
            toast.error('El nombre de la empresa es requerido.');
            return;
        }
        setSaving(true);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            await new Promise(r => setTimeout(r, 300));
            toast.success('Configuración guardada correctamente');
        } catch {
            toast.error('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const isDark = theme === 'dark';

    const navBtn = (section: Section, label: string, Icon: React.ElementType) => (
        <Button
            variant={activeSection === section ? 'secondary' : 'ghost'}
            className={activeSection === section
                ? 'justify-start bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 font-medium'
                : 'justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
            onClick={() => setActiveSection(section)}
        >
            <Icon className="mr-2 h-4 w-4" />
            {label}
        </Button>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Configuración</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gestione las preferencias del sistema y la información de la empresa.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 flex flex-col gap-1">
                    {navBtn('empresa', 'Perfil de Empresa', Building2)}
                    {navBtn('apariencia', 'Apariencia', Palette)}
                    {navBtn('seguridad', 'Seguridad', Shield)}
                    <Button variant="ghost" className="justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" disabled>
                        <Bell className="mr-2 h-4 w-4" />
                        Notificaciones
                    </Button>
                    <Button variant="ghost" className="justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" disabled>
                        <KeyRound className="mr-2 h-4 w-4" />
                        API & Integraciones
                    </Button>
                </aside>

                {/* Settings Content */}
                <div className="flex-1 space-y-6">
                    {/* ── Empresa ── */}
                    {activeSection === 'empresa' && (
                        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg shadow-sm">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Información General</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Actualice la información de contacto y detalles legales de Allegra.</p>
                            </div>
                            <div className="p-6 space-y-4 max-w-2xl">
                                <div className="grid gap-2">
                                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                                    <Input
                                        id="companyName"
                                        value={config.companyName}
                                        onChange={e => set('companyName', e.target.value)}
                                        placeholder="Nombre de la empresa"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="rut">RUT Comercial</Label>
                                        <Input
                                            id="rut"
                                            value={config.rut}
                                            onChange={e => set('rut', e.target.value)}
                                            placeholder="76.123.456-K"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Teléfono de Contacto</Label>
                                        <Input
                                            id="phone"
                                            value={config.phone}
                                            onChange={e => set('phone', e.target.value)}
                                            placeholder="+56 9 1234 5678"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Correo Electrónico (Para Cotizaciones)</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={config.email}
                                        onChange={e => set('email', e.target.value)}
                                        placeholder="contacto@empresa.cl"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="address">Dirección de Bodega Central</Label>
                                    <Input
                                        id="address"
                                        value={config.address}
                                        onChange={e => set('address', e.target.value)}
                                        placeholder="Calle y número, ciudad"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50/50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Apariencia ── */}
                    {activeSection === 'apariencia' && (
                        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg shadow-sm">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Apariencia</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Personaliza el aspecto visual de la aplicación.</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Dark mode toggle */}
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tema de la interfaz</p>
                                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                                        {/* Light */}
                                        <button
                                            onClick={() => isDark && toggle()}
                                            className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                                !isDark
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-md'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            {/* Preview card */}
                                            <div className="w-full h-16 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col p-2 gap-1.5">
                                                <div className="w-2/3 h-2 bg-gray-900 rounded-full" />
                                                <div className="w-full h-1.5 bg-gray-200 rounded-full" />
                                                <div className="w-4/5 h-1.5 bg-gray-200 rounded-full" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Sun className="h-4 w-4 text-amber-500" />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Claro</span>
                                            </div>
                                            {!isDark && (
                                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                </div>
                                            )}
                                        </button>

                                        {/* Dark */}
                                        <button
                                            onClick={() => !isDark && toggle()}
                                            className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                                isDark
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-md'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            {/* Preview card */}
                                            <div className="w-full h-16 rounded-lg bg-gray-900 border border-gray-700 shadow-sm flex flex-col p-2 gap-1.5">
                                                <div className="w-2/3 h-2 bg-gray-100 rounded-full" />
                                                <div className="w-full h-1.5 bg-gray-700 rounded-full" />
                                                <div className="w-4/5 h-1.5 bg-gray-700 rounded-full" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Moon className="h-4 w-4 text-indigo-400" />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Oscuro</span>
                                            </div>
                                            {isDark && (
                                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Quick toggle */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                            {isDark ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-white" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Modo oscuro</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{isDark ? 'Activado' : 'Desactivado'}</p>
                                        </div>
                                    </div>
                                    {/* Toggle switch */}
                                    <button
                                        onClick={toggle}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 cursor-pointer ${
                                            isDark ? 'bg-purple-600' : 'bg-gray-300'
                                        }`}
                                        role="switch"
                                        aria-checked={isDark}
                                        aria-label="Activar modo oscuro"
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                                                isDark ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Seguridad ── */}
                    {activeSection === 'seguridad' && (
                        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg shadow-sm">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Cambiar Contraseña</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Actualice la contraseña de acceso al sistema.</p>
                            </div>
                            <div className="p-6 space-y-4 max-w-sm">
                                <div className="grid gap-2">
                                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrent ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            placeholder="Contraseña actual"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrent(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                        >
                                            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                        >
                                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Repite la nueva contraseña"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50/50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                <Button
                                    onClick={handlePasswordChange}
                                    disabled={savingPassword}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {savingPassword ? 'Guardando...' : 'Cambiar Contraseña'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
