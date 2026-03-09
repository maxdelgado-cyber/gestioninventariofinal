# Allegra - Manual de Configuración e Inicialización

Esta guía explica cómo levantar y configurar el proyecto localmente.

## Requisitos previos
- Node.js 18+
- Base de datos Supabase

## 1. Configuración de Entorno
Clona el archivo `.env.local.example` a `.env.local` y asegúrate de que cuenta con las variables necesarias:
```bash
cp .env.local.example .env.local
```

Asegúrate de configurar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. Instalación de dependencias
El proyecto utiliza npm para manejar dependencias.

```bash
npm install
```

## 3. Base de Datos (Supabase)
Ejecuta el archivo `schema.sql` (que se encuentra en la base del proyecto) en el editor SQL de tu panel de Supabase para inicializar:
- Tablas Principales (events, vehicles, workers, clients, etc.)
- Políticas RLS (Row Level Security)

## 4. Levantar el Entorno de Desarrollo
Para correr el proyecto en modo desarrollo con recarga en caliente (Hot-Reloading):

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Scripts Útiles
- `npm run build`: Construye la versión optimizada de la aplicación para producción.
- `npm run start`: Inicia el servidor de producción tras haber creado el build.
- `npm run lint`: Evalúa la sintaxis y buenas prácticas del código (ESLint).
