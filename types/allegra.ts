export interface AdminProfile {
    username: string;
    email?: string;
    company: string;
    createdAt: string;
    lastPasswordChange?: string;
}

export interface AssignedEquipment {
    id: string;
    cantidad: number;
}

export interface Event {
    id: string;
    nombre: string;
    cliente: string;
    contactoResponsable: string;
    telefono: string;
    email: string;
    fechaInicio: string;
    fechaFin: string;
    horaInicio: string;
    horaFin: string;
    direccion: string;
    tipoEvento: 'Corporativo' | 'Concierto' | 'Boda' | 'Fiesta en Domicilio' | 'Festival' | 'Teatro' | 'Otro';
    estado: 'Agendado' | 'En Montaje' | 'Montado' | 'En Desmontaje' | 'Cerrado' | 'Cancelado';
    equipamientoAsignado: (string | AssignedEquipment)[];
    vehiculosAsignados: string[];
    trabajadoresAsignados: string[];
    choferId?: string;
    choferNombre?: string;
    vehiculoId?: string;
    vehiculoNombre?: string;
    valorTotal: number;
    estadoPago?: 'Pendiente de pago' | 'Abonado' | 'Pagado';
    montoPagado?: number;
    notas?: string;
    incidencias?: string[];
    montajeRealizado: boolean;
    desmontaljeRealizado: boolean;
    trabajadoresDesmontaje?: string[];
    vehiculoDesmontajeId?: string;
    vehiculoDesmontajeNombre?: string;
    choferDesmontajeId?: string;
    choferDesmontajeNombre?: string;
    fechaDesmontaje?: string;
    horaDesmontajeInicio?: string;
    horaDesmontajeFin?: string;
    evaluacion?: {
        calificacionGeneral?: number;
        aspectosPositivos?: string;
        aspectosAMejorar?: string;
        comentariosCliente?: string;
        desempenoEquipo?: number;
        estadoEquipamiento?: number;
        recomendaciones?: string;
        fechaEvaluacion?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface UseHistory {
    eventoId: string;
    fechaPrestamo: string;
    fechaDevolucion: string;
    estadoDevolucion: string;
    notas?: string;
}

export interface CaseItemDetail {
    id: string;
    cantidad: number;
}

export interface CaseContent {
    itemsRef: string[];
    itemsDetalle?: CaseItemDetail[];
    descripcion: string;
}

export interface InventoryItem {
    id: string;
    nombre: string;
    categoria: string;
    subcategoria?: string;
    marca?: string;
    modelo?: string;
    cantidad: number;
    numeroSerie?: string;
    estado: 'Disponible' | 'Reservado' | 'En Uso' | 'En Mantenimiento' | 'Dañado' | 'Fuera de Servicio' | 'Operativo' | 'Falta Mantenimiento';
    ubicacion: string;
    fechaAdquisicion: string;
    historialUso: UseHistory[];
    notas?: string;
    imagenUrl?: string;
    esContenedor?: boolean;
    contenidoInterno?: CaseContent;
    esConsumible?: boolean;
    esInsumo?: boolean; // True for items that are consumed and do not return (e.g. powder, tape)
    unidadMedida?: string;
    stockMinimo?: number;
}

export interface Mantenimiento {
    fecha: string;
    descripcion: string;
    costo: number;
    taller: string;
}

export interface VehicleUseHistory {
    eventoId: string;
    fechaInicio: string;
    fechaFin: string;
    kilometrajeInicial?: number;
    kilometrajeFinal?: number;
}

export interface VehicleAnotacion {
    fecha: string;
    nota: string;
    autor: string;
}

export interface Vehicle {
    id: string;
    nombre: string;
    tipo: 'Camión' | 'Van' | 'Camioneta' | 'Auto' | 'Otro';
    patente: string;
    marca: string;
    modelo: string;
    año: number;
    capacidadCarga: number;
    estado: 'Disponible' | 'En Uso' | 'En Mantenimiento';
    conductorAsignado?: string;
    mantenimientos: Mantenimiento[];
    proximoMantenimiento?: string;
    historialUso: VehicleUseHistory[];
    anotaciones: VehicleAnotacion[];
    notas?: string;
}

export interface WeekAvailability {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
    sabado: boolean;
    domingo: boolean;
}

export interface WorkerEventHistory {
    eventoId: string;
    rol: string;
    evaluacion?: number;
}

export interface WorkerAnotacion {
    fecha: string;
    nota: string;
    autor: string;
}

export interface RegistroHoraSimple {
    id: string;
    fecha: string;
    horas: number;
    eventoNombre?: string;
    observacion?: string;
}

export interface Worker {
    id: string;
    nombre: string;
    apellido: string;
    rut: string;
    telefono: string;
    email: string;
    cargo: string;
    habilidades: string[];
    especialidades: string[];
    disponibilidad: WeekAvailability;
    estado: 'Activo' | 'Inactivo' | 'Vacaciones';
    fechaIngreso: string;
    historialEventos: WorkerEventHistory[];
    anotaciones: WorkerAnotacion[];
    horasRegistradas?: RegistroHoraSimple[];
    registroSemanal: RegistroSemanal[];
    notas?: string;
    imagenUrl?: string;
}

export interface RegistroSemanal {
    id: string;
    trabajadorId: string;
    semana: string; // "2026-W08"
    fechaInicio: string;
    fechaFin: string;
    diasTrabajados: DiaTrabajoRegistro[];
    totalHoras: number;
    descuentoColacion: number;
    totalHorasNetas: number;
    observaciones?: string;
    aprobado: boolean;
    fechaAprobacion?: string;
    aprobadoPor?: string;
}

export interface DiaTrabajoRegistro {
    fecha: string;
    diaNombre: string;
    horaInicio: string;
    horaFin: string;
    horasTrabajadas: number;
    descuentoColacion: number;
    horasNetas: number;
    eventoId?: string;
    eventoNombre?: string;
    observaciones?: string;
}

export interface Client {
    id: string;
    nombre: string;
    tipoCliente: 'Empresa' | 'Persona';
    rut?: string;
    contactoResponsable: string;
    telefono: string;
    email: string;
    direccion?: string;
    ciudad?: string;
    region?: string;
    giro?: string;
    eventosRealizados: number;
    valorTotalEventos: number;
    ultimoEvento?: string;
    notas?: string;
    estado: 'Activo' | 'Inactivo';
    createdAt: string;
    updatedAt: string;
}

export interface MontajeItem {
    id: string;
    entregado: boolean;
    estado: string;
}

export interface Montaje {
    id: string;
    eventoId: string;
    items: MontajeItem[];
    responsableEntrega: string;
    choferId: string;
    choferNombre: string;
    vehiculoId: string;
    vehiculoNombre: string;
    fechaSalida: string;
    horaSalida: string;
    observaciones?: string;
    completado: boolean;
}

export interface DesmontaljeItem {
    id: string;
    estado: 'Correcto' | 'Dañado' | 'Faltante';
}

export interface Desmontalje {
    id: string;
    eventoId: string;
    montajeId: string;
    items: DesmontaljeItem[];
    responsableRecepcion: string;
    choferId: string;
    choferNombre: string;
    vehiculoId: string;
    vehiculoNombre: string;
    fechaRetorno: string;
    horaRetorno: string;
    incidencias: string[];
    completado: boolean;
}

export interface ItemInventarioExterno {
    id: string;
    nombre: string;
    cantidad: number;
    categoria?: string;
    marca?: string;
    modelo?: string;
    estado?: string;
    notas?: string;
}

export interface InventarioExterno {
    id: string;
    nombre: string;
    trabajadorId: string;
    trabajadorNombre: string;
    eventoId?: string;
    eventoNombre?: string;
    fechaEntrega: string;
    fechaDevolucion?: string;
    estado: 'Activo' | 'Devuelto' | 'Pendiente';
    items: ItemInventarioExterno[];
    notas?: string;
    createdAt: string;
    updatedAt: string;
}
