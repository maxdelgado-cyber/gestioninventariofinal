-- ==========================================================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS PARA "ALLEGRA - SISTEMA DE GESTIÓN"
-- ==========================================================================================
-- 
-- INSTRUCCIONES DE EJECUCIÓN (Supabase SQL Editor):
-- 1. Inicia sesión en tu cuenta de Supabase y selecciona tu proyecto.
-- 2. En el menú de la izquierda, haz clic en "SQL Editor".
-- 3. Crea una "New Query" (Nueva Consulta).
-- 4. Copia TODO el contenido de este archivo y pégalo en el editor.
-- 5. Haz clic en el botón verde "Run" (o presiona Cmd/Ctrl + Enter) para ejecutar el script.
-- 6. Si se ejecuta correctamente, verás un mensaje de "Success".
-- ==========================================================================================

-- Habilitar extensión para generar UUIDs de forma automática (si no existe)
create extension if not exists "uuid-ossp";

-- ==========================================================================================
-- 1. CREACIÓN DE TABLAS
-- ==========================================================================================
-- Nota: La arquitectura utiliza "jsonb" para flexiblidad de datos, basándose en el 
-- prototipo original con key-value store. El ID principal es texto.

-- Tabla de Eventos
create table events (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de Inventario
create table inventory (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de Vehículos
create table vehicles (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de Trabajadores
create table workers (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de Clientes
create table clients (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de Montajes
create table montajes (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

-- Tabla de Desmontajes
create table desmontajes (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

-- ==========================================================================================
-- 2. SEGURIDAD DE NIVEL DE FILA (RLS)
-- ==========================================================================================
-- Habilitar Políticas RLS (Row Level Security) en todas las tablas para seguridad
-- Esto asegura que solo las peticiones permitidas puedan interactuar con la DB.

alter table events enable row level security;
alter table inventory enable row level security;
alter table vehicles enable row level security;
alter table workers enable row level security;
alter table clients enable row level security;
alter table montajes enable row level security;
alter table desmontajes enable row level security;

-- ==========================================================================================
-- 3. POLÍTICAS DE ACCESO
-- ==========================================================================================
-- Políticas globales restrictivas:
-- Permiten operaciones totales (SELECT, INSERT, UPDATE, DELETE) ÚNICAMENTE 
-- a usuarios que hayan iniciado sesión (rol 'authenticated').

create policy "auth_only" on events for all using (auth.role() = 'authenticated');
create policy "auth_only" on inventory for all using (auth.role() = 'authenticated');
create policy "auth_only" on vehicles for all using (auth.role() = 'authenticated');
create policy "auth_only" on workers for all using (auth.role() = 'authenticated');
create policy "auth_only" on clients for all using (auth.role() = 'authenticated');
create policy "auth_only" on montajes for all using (auth.role() = 'authenticated');
create policy "auth_only" on desmontajes for all using (auth.role() = 'authenticated');

-- ==========================================================================================
-- FIN DEL SCRIPT
-- ==========================================================================================
