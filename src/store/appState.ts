import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState } from '../types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      presupuestoMax: 70,
      tiempoDisponibleHoras: 4,
      
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
      setMuseosSeleccionados: (museos) => set({ museosSeleccionados: museos }),
      limpiarMuseos: () => set({ museosSeleccionados: [] }),


      puntoPartida: null,
      setPuntoPartida: (punto) => set({ puntoPartida: punto }),

      rutaActiva: null,
      setRutaActiva: (ruta) => set({ rutaActiva: ruta }),

      modoPlanificacion: false,
      setModoPlanificacion: (m) => set({ modoPlanificacion: m }),
    }),

    {
      name: 'app-state',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
export default useAppStore;
