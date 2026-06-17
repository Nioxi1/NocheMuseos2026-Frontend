export interface Museo {
  id: string;
  nombre: string;
  categoria: 'Colonial' | 'Historia' | 'Arte' | 'Religioso' | 'Contemporáneo' | 'Otro';
  precio: number; // en Bs
  tiempoEstimado: number; // en horas
  coordenadas: {
    lat: number;
    lng: number;
  };
  imagenUrl: string;
  descripcion?: string;
  actividades?: string;
  afluenciaActual?: 'Baja' | 'Media' | 'Alta';
  horarioApertura?: string;
  horarioCierre?: string;
}

export interface Ruta {
  id: string;
  tipo: 'Recomendada' | 'Privado' | 'Caminata';
  tiempoTotalMinutos: number;
  costoEstimadoBs: number;
  pasos: PasoRuta[];
  distanciaMetros?: number;
  geometry?: {
    type: 'LineString';
    coordinates: number[][]; // [lng, lat]
  };
  geometryLegs?: {
    mode: 'BUS' | 'WALK' | 'CAR';
    positions: [number, number][]; // [lat, lng]
    lineName?: string;
  }[];
}

export interface PasoRuta {
  id: string;
  modo: 'Bus' | 'Caminata' | 'Espera';
  instruccion: string;
  duracionMinutos: number;
  origen: string;
  destino: string;
  lineaBus?: string; // Ej: "Trufi 106"
  esVuelta?: boolean;
}

export interface AppState {
  // Preferencias de usuario
  presupuestoMax: number;
  tiempoDisponibleHoras: number;
  setPresupuesto: (p: number) => void;
  setTiempoDisponible: (t: number) => void;

  // Museos seleccionados
  museosSeleccionados: Museo[];
  toggleMuseo: (m: Museo) => void;
  setMuseosSeleccionados: (ms: Museo[]) => void;
  limpiarMuseos: () => void;


  // Ubicación origen
  puntoPartida: { lat: number, lng: number, direccion: string } | null;
  setPuntoPartida: (punto: { lat: number, lng: number, direccion: string }) => void;

  // Ruta actual seleccionada
  rutaActiva: Ruta | null;
  setRutaActiva: (ruta: Ruta) => void;

  // Estado de planificación inteligente
  modoPlanificacion: boolean;
  setModoPlanificacion: (m: boolean) => void;
}

