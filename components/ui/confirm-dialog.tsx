'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
    open: boolean;
    title?: string;
    description: string;
    confirmLabel?: string;
    /** 'danger' = rojo (eliminar), 'primary' = azul (confirmar acción) */
    variant?: 'danger' | 'primary';
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title = '¿Está seguro?',
    description,
    confirmLabel = 'Eliminar',
    variant = 'danger',
    loading = false,
    onConfirm,
    onCancel,
}: Props) {
    const btnClass = variant === 'primary'
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-red-600 hover:bg-red-700 text-white';

    return (
        <AlertDialog open={open} onOpenChange={(v) => !v && !loading && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription className="whitespace-pre-line">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel} disabled={loading}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={loading}
                        className={btnClass}
                    >
                        {loading ? 'Procesando...' : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
