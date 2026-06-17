import type { Ruta, PasoRuta } from '../types';

/**
 * Decodifica una polilínea codificada de Google en un arreglo de coordenadas [lat, lng]
 */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

/**
 * Ordena de manera óptima (Greedy Nearest Neighbor TSP) una lista de destinos desde un origen
 */
function sortDestinations(
  origen: { lat: number; lng: number },
  destinos: { lat: number; lng: number; nombre?: string; id?: string }[],
  primerMuseoId?: string
): { lat: number; lng: number; nombre?: string; id?: string }[] {
  const sorted: { lat: number; lng: number; nombre?: string; id?: string }[] = [];
  let current = origen;
  const remaining = [...destinos];

  if (primerMuseoId) {
    const firstIndex = remaining.findIndex(d => d.id === primerMuseoId);
    if (firstIndex !== -1) {
      const firstDest = remaining.splice(firstIndex, 1)[0];
      sorted.push(firstDest);
      current = firstDest;
    }
  }

  while (remaining.length > 0) {
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = Math.hypot(remaining[i].lat - current.lat, remaining[i].lng - current.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    const nextPoint = remaining.splice(closestIndex, 1)[0];
    sorted.push(nextPoint);
    current = nextPoint;
  }

  return sorted;
}

/**
 * Calcula la distancia aproximada en metros entre dos coordenadas (Haversine formula)
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radio de la tierra en metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Envía una solicitud GraphQL a OTP para planificar una ruta de punto A a punto B
 */
async function fetchSingleOTPRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  modo: 'TRANSIT' | 'WALK' | 'CAR',
  apiUrl: string
): Promise<any> {
  const query = `
    query GetPlan($fromLat: Float!, $fromLon: Float!, $toLat: Float!, $toLon: Float!, $modes: [TransportMode!]) {
      plan(
        from: {lat: $fromLat, lon: $fromLon},
        to: {lat: $toLat, lon: $toLon},
        transportModes: $modes
      ) {
        itineraries {
          duration
          walkDistance
          legs {
            mode
            startTime
            endTime
            duration
            legGeometry {
              points
            }
            route {
              shortName
              longName
            }
            from {
              name
              lat
              lon
            }
            to {
              name
              lat
              lon
            }
          }
        }
      }
    }
  `;

  let modesList: { mode: string }[] = [];
  if (modo === 'TRANSIT') {
    modesList = [{ mode: 'TRANSIT' }, { mode: 'WALK' }];
  } else if (modo === 'WALK') {
    modesList = [{ mode: 'WALK' }];
  } else {
    modesList = [{ mode: 'CAR' }];
  }

  const variables = {
    fromLat: from.lat,
    fromLon: from.lng,
    toLat: to.lat,
    toLon: to.lng,
    modes: modesList
  };

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`Error en servidor OTP: ${res.statusText}`);
    }

    const json = await res.json();
    const itineraries = json.data?.plan?.itineraries || [];
    if (modo === 'TRANSIT') {
      // Find the first itinerary that actually contains a public transit mode (BUS, TRAM, RAIL)
      const transitItin = itineraries.find((it: any) =>
        it.legs.some((leg: any) => {
          const m = leg.mode.toUpperCase();
          return m === 'BUS' || m === 'TRANSIT' || m === 'TRAM' || m === 'RAIL';
        })
      );
      if (transitItin) {
        return transitItin;
      }
    }
    return itineraries[0] || null;
  } catch (error) {
    console.error(`Error al consultar ruta OTP (${modo}):`, error);
    return null;
  }
}

/**
 * Consulta el backend local para obtener una ruta de transporte público (Trufi/Micro/Bus)
 */
async function fetchLocalTransportRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<any> {
  try {
    const res = await fetch(`http://localhost:8000/api/transporte_publico`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origen: from,
        destino: to
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    
    // Transformar el formato del backend al formato "itinerary" de OTP que espera el resto del código
    return {
      duration: data.duracion_seg,
      legs: [
        {
          mode: 'BUS',
          duration: data.duracion_seg,
          legGeometry: {
            // Encode points back to polyline is complex, but the code also handles raw points
            // So we'll pass the points directly if possible or mock the points field
            points: null 
          },
          rawPoints: data.puntos, // Pass custom field with local points
          route: {
            shortName: data.referencia,
            longName: data.nombre
          },
          from: { name: 'Origen', lat: from.lat, lon: from.lng },
          to: { name: 'Destino', lat: to.lat, lon: to.lng }
        }
      ]
    };
  } catch (error) {
    console.error("Error al consultar backend local para transporte:", error);
    return null;
  }
}

/**
 * Calcula una ruta secuencial optimizada visitando múltiples destinos usando la API de Trufi (OpenTripPlanner GraphQL)
 */
export const calculateTrufiRoute = async (
  origen: { lat: number; lng: number },
  destinos: { lat: number; lng: number; nombre?: string; id?: string }[],
  modo: 'TRANSIT' | 'WALK' | 'CAR' = 'TRANSIT',
  primerMuseoId?: string
): Promise<Ruta> => {
  // Ajuste de la API GraphQL desde .env.local
  let apiUrl = import.meta.env.VITE_TRUFI_API_URL || 'https://otp281.trufi.app/otp/routers/default/plan';
  // Reemplazar la ruta antigua si es necesario
  apiUrl = apiUrl.replace(/\/plan$/, '/index/graphql');

  console.log(`Calculando ruta secuencial para modo ${modo} usando OTP en ${apiUrl}...`);

  if (destinos.length === 0) {
    return {
      id: `ruta-${modo}-${Date.now()}`,
      tipo: modo === 'TRANSIT' ? 'Recomendada' : modo === 'WALK' ? 'Caminata' : 'Privado',
      tiempoTotalMinutos: 0,
      costoEstimadoBs: 0,
      pasos: [],
      distanciaMetros: 0,
      geometry: { type: 'LineString', coordinates: [] },
      geometryLegs: []
    };
  }

  // Ordenar destinos usando Nearest Neighbor (TSP) respetando el primer destino si se seleccionó
  const destinosOrdenados = sortDestinations(origen, destinos, primerMuseoId);

  // Crear la lista completa de puntos a visitar: Origen -> Museos en orden -> Retorno al origen
  const puntosRuta = [
    { ...origen, nombre: 'Inicio (Tu Ubicación)' },
    ...destinosOrdenados,
    { ...origen, nombre: 'Retorno (Tu Ubicación)' }
  ];

  let totalDurationSeconds = 0;
  let totalDistanceMeters = 0;
  const pasos: PasoRuta[] = [];
  const combinedCoordinates: number[][] = []; // [lng, lat]
  const geometryLegs: Ruta['geometryLegs'] = [];
  let numBusTransfers = 0;

  // Planificar cada tramo secuencialmente
  for (let i = 0; i < puntosRuta.length - 1; i++) {
    const ptA = puntosRuta[i];
    const ptB = puntosRuta[i + 1];

    let itinerary = null;
    
    if (modo === 'TRANSIT') {
      // Intentar primero el backend local (nuestra base de datos de trufis de Cocha)
      itinerary = await fetchLocalTransportRoute(ptA, ptB);
      
      // Si el local no encuentra nada (fuera de radio), intentar OTP como backup
      if (!itinerary) {
        itinerary = await fetchSingleOTPRoute(ptA, ptB, modo, apiUrl);
      }
    } else {
      itinerary = await fetchSingleOTPRoute(ptA, ptB, modo, apiUrl);
    }

    // Si falló el cálculo por red o falta de cobertura, crear un tramo fallback de caminata/vuelo directo
    if (!itinerary) {
      const distance = calculateDistanceMeters(ptA.lat, ptA.lng, ptB.lat, ptB.lng);
      // Asumimos velocidad promedio de 1.3 m/s para caminata, o 10 m/s para auto
      const speed = modo === 'CAR' ? 10.0 : 1.3;
      const duration = Math.round(distance / speed);

      // Crear un leg de mock fallback
      itinerary = {
        duration: duration,
        walkDistance: modo === 'WALK' ? distance : 0,
        legs: [
          {
            mode: modo === 'CAR' ? 'CAR' : 'WALK',
            startTime: Date.now(),
            endTime: Date.now() + duration * 1000,
            duration: duration,
            legGeometry: {
              // Codificación manual simple para línea recta entre A y B
              points: '' // Será manejado directamente agregando las coordenadas
            },
            route: null,
            from: { name: ptA.nombre || 'Origen', lat: ptA.lat, lon: ptA.lng },
            to: { name: ptB.nombre || 'Destino', lat: ptB.lat, lon: ptB.lng }
          }
        ]
      };
    }

    totalDurationSeconds += itinerary.duration;

    // Procesar piernas del itinerario
    itinerary.legs.forEach((leg: any, legIndex: number) => {
      let legCoords: [number, number][] = [];

      if (leg.legGeometry?.points) {
        legCoords = decodePolyline(leg.legGeometry.points);
      } else if (leg.rawPoints) {
        // Usar los puntos directos de nuestro backend local
        legCoords = leg.rawPoints.map((p: any) => [p.lat, p.lng]);
      } else {
        // Fallback: línea recta si no hay polilínea
        legCoords = [
          [leg.from.lat, leg.from.lon],
          [leg.to.lat, leg.to.lon]
        ];
      }

      // Agregar al trazado combinado (convertir a [lng, lat])
      legCoords.forEach(coord => {
        combinedCoordinates.push([coord[1], coord[0]]);
      });

      // Calcular distancia del tramo aproximada
      let legDist = 0;
      for (let j = 0; j < legCoords.length - 1; j++) {
        legDist += calculateDistanceMeters(
          legCoords[j][0],
          legCoords[j][1],
          legCoords[j + 1][0],
          legCoords[j + 1][1]
        );
      }
      totalDistanceMeters += legDist;

      // Determinar modo legible y nombres de línea
      const modeUpper = leg.mode.toUpperCase();
      let stepModo: PasoRuta['modo'] = 'Caminata';
      let lineaBus = undefined;

      if (modeUpper === 'BUS' || modeUpper === 'TRANSIT' || modeUpper === 'TRAM' || modeUpper === 'RAIL') {
        stepModo = 'Bus';
        lineaBus = leg.route?.shortName || leg.route?.longName || 'Micro / Trufi';
        numBusTransfers++;
      } else if (modeUpper === 'CAR') {
        // En frontend PasoRuta modo solo admite 'Bus' | 'Caminata' | 'Espera'
        // Mapeamos auto a Caminata/Espera pero indicando la instrucción de auto
        stepModo = 'Caminata';
      }

      // Guardar geometría detallada del leg para dibujar coloreado en el mapa
      geometryLegs.push({
        mode: modeUpper === 'CAR' ? 'CAR' : (stepModo === 'Bus' ? 'BUS' : 'WALK'),
        positions: legCoords,
        lineName: lineaBus
      });

      // Construir instrucción descriptiva
      let instruccion = '';
      if (modeUpper === 'CAR') {
        instruccion = `Conduce desde ${leg.from.name || ptA.nombre} hacia ${leg.to.name || ptB.nombre}`;
      } else if (stepModo === 'Bus') {
        instruccion = `Toma la línea "${lineaBus}" en ${leg.from.name || 'Parada'} hasta ${leg.to.name || 'Parada'}`;
      } else {
        instruccion = `Camina desde ${leg.from.name || 'origen'} hasta ${leg.to.name || 'destino'}`;
      }

      pasos.push({
        id: `paso-${i}-${legIndex}-${Date.now()}`,
        modo: stepModo,
        instruccion: instruccion,
        duracionMinutos: Math.round(leg.duration / 60) || 1,
        origen: leg.from.name || ptA.nombre || 'Inicio',
        destino: leg.to.name || ptB.nombre || 'Destino',
        lineaBus: lineaBus,
        esVuelta: (i === puntosRuta.length - 2)
      });
    });

    // Añadir un paso intermedio representando la visita al museo (solo si NO es el retorno final)
    if (i < puntosRuta.length - 2) {
      pasos.push({
        id: `visita-${i}-${Date.now()}`,
        modo: 'Espera',
        instruccion: `Visita cultural en: ${ptB.nombre}`,
        duracionMinutos: 60, // 1 hora de visita estimada
        origen: ptB.nombre || 'Museo',
        destino: ptB.nombre || 'Museo'
      });
    } else {
      // Es el tramo de regreso, actualizamos la instrucción final
      const lastPaso = pasos[pasos.length - 1];
      if (lastPaso) {
        lastPaso.destino = 'Fin de la ruta (Tu Ubicación)';
      }
    }
  }

  // Estimar el costo total del trayecto en Bolivianos
  let costoEstimadoBs = 0;
  if (modo === 'TRANSIT') {
    // 3.00 Bs por pasaje en Cochabamba
    costoEstimadoBs = numBusTransfers * 3.00;
  } else if (modo === 'CAR') {
    // Taxi: 15 Bs base + 5 Bs por km
    costoEstimadoBs = 15.00 + (totalDistanceMeters / 1000) * 5.00;
  }

  return {
    id: `ruta-trufi-${modo}-${Date.now()}`,
    tipo: modo === 'TRANSIT' ? 'Recomendada' : modo === 'WALK' ? 'Caminata' : 'Privado',
    tiempoTotalMinutos: Math.round(totalDurationSeconds / 60),
    costoEstimadoBs: Number(costoEstimadoBs.toFixed(1)),
    pasos: pasos,
    distanciaMetros: Math.round(totalDistanceMeters),
    geometry: {
      type: 'LineString',
      coordinates: combinedCoordinates
    },
    geometryLegs: geometryLegs
  };
};
