export interface Museo {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
}

export interface PuntoPartida {
  lat: number;
  lng: number;
  direccion: string;
}

export interface AppState {
  presupuestoMax: number;
  tiempoDisponibleHoras: number;
  setPresupuesto: (p: number) => void;
  setTiempoDisponible: (t: number) => void;
  museosSeleccionados: Museo[];
  toggleMuseo: (museo: Museo) => void;
  limpiarMuseos: () => void;
  puntoPartida: PuntoPartida | null;
  setPuntoPartida: (punto: PuntoPartida) => void;
  rutaActiva: any;
  setRutaActiva: (ruta: any) => void;
}
