# NocheMuseos2026-Frontend

Frontend en React + TypeScript + Vite para el proyecto "Noche de Museos" (Materia: Inteligencia Artificial - UMSS). Aplicación web para optimizar rutas de museos en Cochabamba usando un sistema multiagente.

## Tecnologías

- **React 19** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos
- **Leaflet + React-Leaflet** - Mapas interactivos
- **Zustand** - Gestión de estado global
- **React Router DOM** - Enrutamiento
- **Axios** - Cliente HTTP

## Estructura del Proyecto

```
src/
├── components/     # Componentes de UI (MapaReal, FormularioRestricciones, etc.)
├── data/          # Datos estáticos (museos)
├── hooks/         # Custom hooks
├── services/      # Servicios API
├── store/         # Estado global (Zustand)
├── types/         # Definiciones de tipos TypeScript
└── utils/         # Utilidades
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El frontend se ejecuta en `http://localhost:5173`

## Build

```bash
npm run build
```

## Backend

El proyecto requiere el backend ejecutándose en `http://localhost:8000`. Ver [`../NocheMuseos2026-Backend/README.md`](../NocheMuseos2026-Backend/README.md) para más detalles.

## Base de Datos

El esquema de la base de datos PostgreSQL está en [`../NocheMuseos2026-Backend/db_schema.sql`](../NocheMuseos2026-Backend/db_schema.sql). Incluye tablas GTFS para transporte público (agency, stops, routes, trips, calendar, stop_times, shapes).
