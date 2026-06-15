import type { Ruta, PasoRuta } from '../types';

/**
 * Función para interactuar con la API de Trufi (OpenTripPlanner)
 * Actualmente devuelve un mock estructurado mientras se integra la API real de OTP.
 */
export const calculateTrufiRoute = async (
  origen: { lat: number; lng: number },
  destinos: { lat: number; lng: number }[],
  modo: 'TRANSIT' | 'WALK' | 'CAR' = 'TRANSIT'
): Promise<Ruta> => {
  
  // La URL vendrá de .env.local (e.g. VITE_TRUFI_API_URL=https://otp281.trufi.app/otp/routers/default/plan)
  const apiUrl = import.meta.env.VITE_TRUFI_API_URL;

  console.log(`Petición OTP a ${apiUrl} calculando ruta modo ${modo}...`);

  // Simulamos delay de la API OTP
  await new Promise(resolve => setTimeout(resolve, 800));

  // Mock response
  const pasosMock: PasoRuta[] = [
    {
      id: 'p1',
      modo: 'Caminata',
      instruccion: 'Camina hacia Av. Heroínas',
      duracionMinutos: 5,
      origen: 'Ubicación actual',
      destino: 'Av. Heroínas esq. Ayacucho'
    },
    {
      id: 'p2',
      modo: 'Bus',
      instruccion: 'Toma el Trufi 106',
      duracionMinutos: 15,
      origen: 'Av. Heroínas',
      destino: 'Museo Arqueológico UMSS',
      lineaBus: 'Trufi 106'
    }
  ];

  return {
    id: `ruta-trufi-${Date.now()}`,
    tipo: modo === 'TRANSIT' ? 'Recomendada' : modo === 'WALK' ? 'Caminata' : 'Privado',
    tiempoTotalMinutos: 20,
    costoEstimadoBs: modo === 'TRANSIT' ? 2.00 : 0,
    pasos: pasosMock,
    distanciaMetros: 1500
  };
};
