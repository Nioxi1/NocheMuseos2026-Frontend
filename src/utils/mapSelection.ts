import type { Museo } from '../types';

export interface MapSelectionMuseo {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  precio: number;
  tiempoEstimado: number;
  categoria?: string;
  imagenUrl?: string;
  descripcion?: string;
  actividades?: string;
}

export interface MapSelection {
  origen: { lat: number; lng: number };
  museos: MapSelectionMuseo[];
}

export function museoToMapItem(m: Museo): MapSelectionMuseo {
  return {
    id: m.id,
    nombre: m.nombre,
    lat: m.coordenadas.lat,
    lng: m.coordenadas.lng,
    precio: m.precio,
    tiempoEstimado: m.tiempoEstimado,
    categoria: m.categoria,
    imagenUrl: m.imagenUrl,
    descripcion: m.descripcion,
    actividades: m.actividades,
  };
}

export function buildMapSelection(
  origen: { lat: number; lng: number } | null | undefined,
  museos: Museo[]
): MapSelection | null {
  if (!origen || museos.length === 0) return null;
  return {
    origen: { lat: origen.lat, lng: origen.lng },
    museos: museos.map(museoToMapItem),
  };
}

export function saveMapSelection(selection: MapSelection): void {
  sessionStorage.setItem('mapSelection', JSON.stringify(selection));
}

export function loadMapSelection(): MapSelection | null {
  const raw = sessionStorage.getItem('mapSelection');
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as MapSelection;
    if (!data?.origen?.lat || !data?.origen?.lng || !data?.museos?.length) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function resolveMapSelection(
  origen: { lat: number; lng: number } | null | undefined,
  museos: Museo[]
): MapSelection | null {
  return buildMapSelection(origen, museos) ?? loadMapSelection();
}
