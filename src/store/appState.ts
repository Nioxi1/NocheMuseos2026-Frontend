import { create } from 'zustand';
import type { AppState, Museo } from '../types';

export const useAppStore = create<AppState>((set) => ({
  presupuestoMax: 0,
  tiempoDisponibleHoras: 0,
  
  setPresupuesto: (p) => set({ presupuestoMax: p }),
  setTiempoDisponible: (t) => set({ tiempoDisponibleHoras: t }),

  museosSeleccionados: [],
  toggleMuseo: (museo) => set((state) => {
    const existe = state.museosSeleccionados.find(m => m.id === museo.id);
    if (existe) {
      return { museosSeleccionados: state.museosSeleccionados.filter(m => m.id !== museo.id) };
    } else {
      return { museosSeleccionados: [...state.museosSeleccionados, museo] };
    }
  }),
  limpiarMuseos: () => set({ museosSeleccionados: [] }),

  puntoPartida: null,
  setPuntoPartida: (punto) => set({ puntoPartida: punto }),

  rutaActiva: null,
  setRutaActiva: (ruta) => set({ rutaActiva: ruta }),
}));
export default useAppStore;
