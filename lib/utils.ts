import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Valida RUT chileno con dígito verificador. Acepta formatos: 12345678-9, 12.345.678-9 */
export function validarRut(rut: string): boolean {
  if (!rut || rut.trim() === '') return true; // Campo opcional, si vacío es válido
  const clean = rut.replace(/\./g, '').replace(/-/g, '').toLowerCase().trim();
  if (clean.length < 2) return false;
  const dv = clean.slice(-1);
  const num = parseInt(clean.slice(0, -1), 10);
  if (isNaN(num)) return false;
  let sum = 0;
  let mult = 2;
  let tmp = num;
  while (tmp > 0) {
    sum += (tmp % 10) * mult;
    tmp = Math.floor(tmp / 10);
    mult = mult === 7 ? 2 : mult + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'k' : String(remainder);
  return dv === expected;
}

/** Formatea una fecha ISO a formato legible en español chileno */
export function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    // Date-only strings (YYYY-MM-DD) must be parsed as local time; Safari treats them as UTC otherwise
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + 'T00:00:00' : iso;
    return new Date(normalized).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** Formatea una fecha ISO con hora */
export function formatDateTime(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
