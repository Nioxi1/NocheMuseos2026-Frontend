import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDirectionsBus, MdSchedule, MdPayments, MdDirectionsWalk, MdLocalTaxi, MdSwapVert, MdExpandMore, MdExpandLess, MdTripOrigin, MdFiberManualRecord, MdTransferWithinAStation, MdArrowForward, MdPlace, MdMyLocation, MdInfo } from 'react-icons/md';
import clsx from 'clsx';
import { useAppStore } from '../store/appState';
import { calculateTrufiRoute } from '../services/trufiRouting';
import { resolveMapSelection, saveMapSelection } from '../utils/mapSelection';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons for Map markers
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const museumIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Consistent colors for bus/trufi lines - each line gets a unique vibrant color
const LINE_COLORS: Record<string, string> = {};
const PALETTE = [
  '#e53935', '#8e24aa', '#1e88e5', '#43a047', '#fb8c00',
  '#00acc1', '#6d4c41', '#d81b60', '#5e35b1', '#039be5',
  '#7cb342', '#f4511e', '#00897b', '#3949ab', '#c0ca33',
  '#ff6f00', '#4e342e', '#546e7a', '#ad1457', '#283593'
];
let colorIndex = 0;

function getLineColor(lineName: string): string {
  if (!lineName) return '#6b7280';
  if (!LINE_COLORS[lineName]) {
    LINE_COLORS[lineName] = PALETTE[colorIndex % PALETTE.length];
    colorIndex++;
  }
  return LINE_COLORS[lineName];
}

// Format minutes to human readable
function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const TarjetaAlternativa = () => {
  const navigate = useNavigate();
  const { setRutaActiva, presupuestoMax, tiempoDisponibleHoras, puntoPartida, museosSeleccionados } = useAppStore();
  const [seleccion, setSeleccion] = useState('');
  const [opcionesRuta, setOpcionesRuta] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapSelection, setMapSelection] = useState<any>(null);
  const [primerMuseoId, setPrimerMuseoId] = useState<string>('');
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [hoveredLeg, setHoveredLeg] = useState<number | null>(null);

  useEffect(() => {
    const origen = puntoPartida
      ? { lat: puntoPartida.lat, lng: puntoPartida.lng }
      : null;
    const data = resolveMapSelection(origen, museosSeleccionados);

    if (data) {
      setMapSelection(data);
      saveMapSelection(data);
      const initialFirstId = data.museos[0]?.id || '';
      setPrimerMuseoId(initialFirstId);
      fetchTransportOptions(data, initialFirstId);
    } else {
      setMapSelection(null);
      setLoading(false);
    }
  }, []);

  const fetchTransportOptions = async (data: any, pMuseoId?: string) => {
    if (!data?.origen?.lat || !data?.museos?.length) {
      setOpcionesRuta([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const activeFirstId = pMuseoId ?? '';
    try {
      // Fetch the three options in parallel using the real Trufi API
      const [routeTransit, routeCar, routeWalk] = await Promise.all([
        calculateTrufiRoute(data.origen, data.museos, 'TRANSIT', activeFirstId),
        calculateTrufiRoute(data.origen, data.museos, 'CAR', activeFirstId),
        calculateTrufiRoute(data.origen, data.museos, 'WALK', activeFirstId)
      ]);

      // Count distinct bus lines for transit
      const busLines = routeTransit.pasos
        .filter((p: any) => p.modo === 'Bus' && p.lineaBus)
        .map((p: any) => p.lineaBus)
        .filter((v: any, i: number, self: any[]) => self.indexOf(v) === i);

      const numTransfers = Math.max(0, busLines.length - 1);

      const opciones = [
        {
          id: 'opt1',
          tipo: 'Transporte Público',
          subtitulo: busLines.length > 0 ? `${busLines.length} línea${busLines.length > 1 ? 's' : ''} • ${numTransfers} transbordo${numTransfers !== 1 ? 's' : ''}` : 'Trufi / Micro',
          modo: 'bus',
          tiempo: formatDuration(routeTransit.tiempoTotalMinutos),
          tiempoRaw: routeTransit.tiempoTotalMinutos,
          costo: `Bs. ${routeTransit.costoEstimadoBs.toFixed(2)}`,
          costoRaw: routeTransit.costoEstimadoBs,
          distanciaKm: ((routeTransit.distanciaMetros ?? 0) / 1000).toFixed(1),
          etiquetas: ['Económico', 'Trufi/Micro'],
          recomendado: true,
          busLines: busLines,
          pasos: routeTransit.pasos,
          color: '#43a047',
          rutaData: routeTransit
        },
        {
          id: 'opt2',
          tipo: 'Taxi / Vehículo',
          subtitulo: `Ruta directa • ${((routeCar.distanciaMetros ?? 0) / 1000).toFixed(1)} km`,
          modo: 'local_taxi',
          tiempo: formatDuration(routeCar.tiempoTotalMinutos),
          tiempoRaw: routeCar.tiempoTotalMinutos,
          costo: `Bs. ${routeCar.costoEstimadoBs.toFixed(2)}`,
          costoRaw: routeCar.costoEstimadoBs,
          distanciaKm: ((routeCar.distanciaMetros ?? 0) / 1000).toFixed(1),
          etiquetas: ['Rápido', 'Directo'],
          recomendado: false,
          busLines: [],
          pasos: routeCar.pasos,
          color: '#1e88e5',
          rutaData: routeCar
        },
        {
          id: 'opt3',
          tipo: 'Caminata',
          subtitulo: `${((routeWalk.distanciaMetros ?? 0) / 1000).toFixed(1)} km a pie`,
          modo: 'directions_walk',
          tiempo: formatDuration(routeWalk.tiempoTotalMinutos),
          tiempoRaw: routeWalk.tiempoTotalMinutos,
          costo: 'Gratis',
          costoRaw: 0,
          distanciaKm: ((routeWalk.distanciaMetros ?? 0) / 1000).toFixed(1),
          etiquetas: ['Saludable', 'Ecológico'],
          recomendado: false,
          busLines: [],
          pasos: routeWalk.pasos,
          color: '#78909c',
          rutaData: routeWalk
        }
      ];

      setOpcionesRuta(opciones);
      if (opciones.length > 0) {
        setSeleccion(opciones[0].id);
        setExpandedRoute(opciones[0].id);
      }
    } catch (error) {
      console.error('Error fetching transport options:', error);
      // Fallback a mock robusto en caso de fallo crítico
      const mockCoords = [
        [data.origen.lat, data.origen.lng] as [number, number],
        ...data.museos.map((m: any) => [m.lat, m.lng] as [number, number]),
        [data.origen.lat, data.origen.lng] as [number, number]
      ];
      setOpcionesRuta([
        {
          id: 'opt1',
          tipo: 'Transporte Público (Fallback)',
          subtitulo: '2 líneas • 1 transbordo',
          modo: 'bus',
          tiempo: '45 min',
          tiempoRaw: 45,
          costo: 'Bs. 6.00',
          costoRaw: 6.00,
          distanciaKm: '3.2',
          etiquetas: ['Económico'],
          recomendado: true,
          busLines: ['Trufi 106', 'Línea 1'],
          pasos: [
            { id: 'p1', modo: 'Caminata', instruccion: 'Camina a la parada', duracionMinutos: 3, origen: 'Tu ubicación', destino: 'Parada Trufi 106' },
            { id: 'p2', modo: 'Bus', instruccion: 'Toma el Trufi 106 hacia centro', duracionMinutos: 15, origen: 'Parada Trufi 106', destino: 'Parada Central', lineaBus: 'Trufi 106' },
            { id: 'p3', modo: 'Caminata', instruccion: 'Camina al transbordo', duracionMinutos: 2, origen: 'Parada Central', destino: 'Parada Línea 1' },
            { id: 'p4', modo: 'Bus', instruccion: 'Toma la Línea 1', duracionMinutos: 10, origen: 'Parada Línea 1', destino: 'Destino', lineaBus: 'Línea 1' },
            { id: 'p5', modo: 'Caminata', instruccion: 'Camina al museo', duracionMinutos: 5, origen: 'Parada final', destino: 'Museo' }
          ],
          color: '#43a047',
          rutaData: {
            id: 'mock-transit',
            tipo: 'Recomendada',
            tiempoTotalMinutos: 45,
            costoEstimadoBs: 6.00,
            pasos: [
              { id: 'p1', modo: 'Caminata', instruccion: 'Camina a la parada', duracionMinutos: 3, origen: 'Inicio', destino: 'Parada' },
              { id: 'p2', modo: 'Bus', instruccion: 'Toma el Trufi 106', duracionMinutos: 15, origen: 'Parada', destino: 'Centro', lineaBus: 'Trufi 106' },
              { id: 'p3', modo: 'Bus', instruccion: 'Toma la Línea 1', duracionMinutos: 10, origen: 'Centro', destino: 'Destino', lineaBus: 'Línea 1' }
            ],
            geometryLegs: [
              { mode: 'WALK', positions: [mockCoords[0], mockCoords[0]] },
              { mode: 'BUS', positions: mockCoords.slice(0, 2), lineName: 'Trufi 106' },
              { mode: 'BUS', positions: mockCoords.slice(1), lineName: 'Línea 1' }
            ]
          }
        }
      ]);
      setSeleccion('opt1');
      setExpandedRoute('opt1');
    } finally {
      setLoading(false);
    }
  };

  const handleComenzar = () => {
    const selectedOption = opcionesRuta.find(opt => opt.id === seleccion);
    if (selectedOption && selectedOption.rutaData) {
      setRutaActiva(selectedOption.rutaData);
    }
    navigate('/itinerario');
  };

  const handlePrimerMuseoChange = (id: string) => {
    setPrimerMuseoId(id);
    if (mapSelection) {
      fetchTransportOptions(mapSelection, id);
    }
  };

  // Get active route legs to render on map
  const activeOption = opcionesRuta.find(opt => opt.id === seleccion);
  const activeRoute = activeOption?.rutaData;
  const activeRouteLegs = activeRoute?.geometryLegs || [];
  const defaultCenter = mapSelection?.origen 
    ? [mapSelection.origen.lat, mapSelection.origen.lng] as [number, number]
    : [-17.3935, -66.1568] as [number, number];

  // Build transfer points from legs
  const transferPoints = useMemo(() => {
    if (!activeRouteLegs || activeRouteLegs.length < 2) return [];
    const points: { position: [number, number]; fromLine?: string; toLine?: string; type: string }[] = [];
    
    for (let i = 0; i < activeRouteLegs.length - 1; i++) {
      const currLeg = activeRouteLegs[i];
      const nextLeg = activeRouteLegs[i + 1];
      if (!currLeg.positions?.length || !nextLeg.positions?.length) continue;
      
      const lastPos = currLeg.positions[currLeg.positions.length - 1];
      const isBusTransfer = currLeg.mode === 'BUS' && nextLeg.mode === 'BUS';
      const isGetOff = currLeg.mode === 'BUS' && nextLeg.mode === 'WALK';
      const isGetOn = currLeg.mode === 'WALK' && nextLeg.mode === 'BUS';
      
      if (isBusTransfer || isGetOff || isGetOn) {
        points.push({
          position: lastPos as [number, number],
          fromLine: currLeg.lineName,
          toLine: nextLeg.lineName,
          type: isBusTransfer ? 'transfer' : isGetOff ? 'getoff' : 'geton'
        });
      }
    }
    return points;
  }, [activeRouteLegs]);

  // ---- Trufi-style Segment Bar for a route option ----
  const renderSegmentBar = (opt: any) => {
    const transportPasos = opt.pasos.filter((p: any) => p.modo !== 'Espera');
    if (transportPasos.length === 0) return null;
    const totalMin = transportPasos.reduce((s: number, p: any) => s + p.duracionMinutos, 0) || 1;
    
    return (
      <div className="flex items-center w-full h-6 rounded-full overflow-hidden bg-surface-container-highest/60 my-2">
        {transportPasos.map((paso: any, idx: number) => {
          const width = Math.max((paso.duracionMinutos / totalMin) * 100, 8);
          const isBus = paso.modo === 'Bus';
          const isWalk = paso.modo === 'Caminata';
          const bgColor = isBus ? getLineColor(paso.lineaBus || 'default') : '#9e9e9e';
          
          return (
            <div
              key={idx}
              className="h-full flex items-center justify-center relative group cursor-pointer"
              style={{ 
                width: `${width}%`, 
                backgroundColor: bgColor,
                minWidth: '20px'
              }}
              title={`${paso.modo}: ${paso.instruccion} (${paso.duracionMinutos} min)`}
            >
              {isBus ? (
                <MdDirectionsBus size={12} className="text-white" />
              ) : isWalk ? (
                <MdDirectionsWalk size={12} className="text-white" />
              ) : null}
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[9px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                {isBus ? paso.lineaBus : 'A pie'} • {paso.duracionMinutos} min
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---- Trufi-style detail step list ----
  const renderDetailSteps = (opt: any) => {
    const transportPasos = opt.pasos.filter((p: any) => p.modo !== 'Espera');
    const visitaPasos = opt.pasos.filter((p: any) => p.modo === 'Espera');
    
    return (
      <div className="mt-3 space-y-0 relative">
        {/* Vertical timeline connector */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-outline-variant/20 z-0"></div>

        {transportPasos.map((paso: any, idx: number) => {
          const isBus = paso.modo === 'Bus';
          const isWalk = paso.modo === 'Caminata';
          const lineColor = isBus ? getLineColor(paso.lineaBus || 'default') : '#9e9e9e';
          const isFirst = idx === 0;
          const isLast = idx === transportPasos.length - 1;
          
          return (
            <div key={idx} className="relative z-10">
              {/* Origin point for first step */}
              {isFirst && (
                <div className="flex items-center gap-3 py-1.5">
                  <div className="w-[30px] flex justify-center shrink-0">
                    <MdMyLocation size={16} className="text-primary" />
                  </div>
                  <span className="text-[11px] font-semibold text-on-surface">{paso.origen}</span>
                </div>
              )}

              {/* The step itself */}
              <div 
                className={clsx(
                  "flex items-stretch gap-3 rounded-lg transition-all",
                  hoveredLeg === idx && "bg-surface-container-highest/80"
                )}
                onMouseEnter={() => setHoveredLeg(idx)}
                onMouseLeave={() => setHoveredLeg(null)}
              >
                {/* Left: colored bar/icon */}
                <div className="w-[30px] flex flex-col items-center shrink-0">
                  {isBus ? (
                    <>
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                        style={{ backgroundColor: lineColor }}
                      >
                        <MdDirectionsBus size={13} />
                      </div>
                      <div className="flex-grow w-1 rounded-full my-0.5" style={{ backgroundColor: lineColor, minHeight: '20px' }}></div>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-400 text-white shadow-sm shrink-0">
                        <MdDirectionsWalk size={13} />
                      </div>
                      <div className="flex-grow w-1 rounded-full my-0.5 bg-gray-300" style={{ minHeight: '20px', backgroundImage: 'repeating-linear-gradient(to bottom, #bdbdbd 0px, #bdbdbd 4px, transparent 4px, transparent 8px)' }}></div>
                    </>
                  )}
                </div>

                {/* Right: description */}
                <div className="flex-grow py-1.5 pr-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isBus && (
                        <span 
                          className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md shadow-sm"
                          style={{ backgroundColor: lineColor }}
                        >
                          {paso.lineaBus}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-on-surface">
                        {isBus ? 'Transporte público' : 'Caminar'}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-mono bg-surface-container-highest px-1.5 py-0.5 rounded">
                      {paso.duracionMinutos} min
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 leading-snug">
                    {paso.instruccion}
                  </p>
                  {isBus && (
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-on-surface-variant">
                      <MdPayments size={11} className="text-secondary" />
                      <span className="font-semibold">Bs. 3.00</span>
                      <span className="text-outline">por pasaje</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transfer indicator between bus legs */}
              {idx < transportPasos.length - 1 && isBus && transportPasos[idx + 1].modo === 'Bus' && (
                <div className="flex items-center gap-3 py-1">
                  <div className="w-[30px] flex justify-center shrink-0">
                    <MdTransferWithinAStation size={14} className="text-secondary" />
                  </div>
                  <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">Transbordo</span>
                </div>
              )}

              {/* Destination point for last step */}
              {isLast && (
                <div className="flex items-center gap-3 py-1.5">
                  <div className="w-[30px] flex justify-center shrink-0">
                    <MdPlace size={16} className="text-error" />
                  </div>
                  <span className="text-[11px] font-semibold text-on-surface">{paso.destino}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Museum visits section */}
        {visitaPasos.length > 0 && (
          <div className="mt-2 pt-2 border-t border-outline-variant/10">
            <div className="text-[9px] uppercase font-bold text-secondary tracking-wider mb-1.5 flex items-center gap-1">
              <MdInfo size={12} /> Paradas culturales incluidas
            </div>
            {visitaPasos.map((v: any, i: number) => (
              <div key={i} className="flex items-center gap-2 py-0.5 text-[10px] text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                {v.instruccion} ({v.duracionMinutos} min)
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full relative overflow-hidden bg-background">
      {/* Sidebar - Comparación y detalles */}
      <aside className="w-full h-1/2 md:h-full md:w-[420px] bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant/15 flex flex-col z-20 shadow-xl md:shadow-none shrink-0">
        {/* Header - fixed, non-scrolling */}
        <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low shrink-0 space-y-3">
          <div>
            <h1 className="font-bold text-on-surface text-lg flex items-center gap-2">
              <MdSwapVert size={22} className="text-primary" />
              Compara tu Ruta
            </h1>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-tight">
              {loading 
                ? 'Consultando rutas en Trufi App / OTP...' 
                : mapSelection 
                  ? `${opcionesRuta.length} alternativas encontradas • Pasaje Bs. 3.00/transporte` 
                  : 'Selecciona museos en la pestaña Mapa para ver rutas.'}
            </p>
          </div>
          
          {/* First museum selector */}
          {mapSelection && mapSelection.museos && mapSelection.museos.length > 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-secondary tracking-wide">¿Qué museo visitar primero?</label>
              <select
                value={primerMuseoId}
                onChange={(e) => handlePrimerMuseoChange(e.target.value)}
                disabled={loading}
                className="w-full text-xs rounded-lg border border-outline-variant/35 p-2 bg-surface-container-highest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {mapSelection.museos.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Budget/Time constraints indicator */}
          {!loading && (presupuestoMax > 0 || tiempoDisponibleHoras > 0) && (
            <div className="flex gap-2 text-[10px]">
              <div className="flex items-center gap-1 bg-surface-container-highest/80 px-2 py-1 rounded-full text-on-surface-variant">
                <MdPayments size={12} className="text-primary" />
                <span>Presupuesto: <strong>Bs. {presupuestoMax}</strong></span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container-highest/80 px-2 py-1 rounded-full text-on-surface-variant">
                <MdSchedule size={12} className="text-primary" />
                <span>Tiempo: <strong>{tiempoDisponibleHoras}h</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Route options list - this is the only scrollable area */}
        <div className="p-3 flex-grow overflow-y-auto custom-scroll space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
                <MdDirectionsBus size={24} className="absolute inset-0 m-auto text-primary" />
              </div>
              <p className="text-sm font-semibold text-on-surface">Calculando rutas...</p>
              <p className="text-[11px] text-on-surface-variant mt-1">Consultando Trufi App para líneas de transporte</p>
            </div>
          ) : !mapSelection ? (
            <div className="text-center py-16">
              <MdDirectionsBus size={48} className="mx-auto text-outline/30 mb-4" />
              <p className="text-sm text-on-surface-variant mb-4">Necesitas seleccionar museos primero</p>
              <button 
                onClick={() => navigate('/mapa')}
                className="bg-primary hover:bg-primary/90 text-on-primary-fixed px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all"
              >
                Ir al Mapa
              </button>
            </div>
          ) : opcionesRuta.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-on-surface-variant mb-4">No se pudo calcular ninguna ruta.</p>
              <button 
                onClick={() => navigate('/mapa')}
                className="bg-primary hover:bg-primary/90 text-on-primary-fixed px-5 py-2.5 rounded-lg font-bold text-sm shadow-md"
              >
                Volver al Mapa
              </button>
            </div>
          ) : (
            opcionesRuta.map(opt => {
              const superaPresupuesto = presupuestoMax > 0 && opt.costoRaw > presupuestoMax;
              const superaTiempo = tiempoDisponibleHoras > 0 && opt.tiempoRaw > (tiempoDisponibleHoras * 60);
              const isSelected = seleccion === opt.id;
              const isExpanded = expandedRoute === opt.id;

              return (
                <div 
                  key={opt.id}
                  className={clsx(
                    "rounded-2xl transition-all duration-200 border-2 overflow-hidden",
                    isSelected 
                      ? "border-primary/60 bg-surface shadow-lg shadow-primary/5" 
                      : "border-transparent bg-surface-container/40 hover:bg-surface-container/70 hover:border-outline-variant/20",
                  )}
                >
                  {/* Card header - clickable to select */}
                  <div 
                    className="p-3 cursor-pointer"
                    onClick={() => {
                      setSeleccion(opt.id);
                      setExpandedRoute(isExpanded ? null : opt.id);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                          style={{ backgroundColor: opt.color }}
                        >
                          {opt.modo === 'bus' ? <MdDirectionsBus size={18} /> : opt.modo === 'local_taxi' ? <MdLocalTaxi size={18} /> : <MdDirectionsWalk size={18} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface text-sm leading-tight">{opt.tipo}</h3>
                          <p className="text-[10px] text-on-surface-variant leading-tight">{opt.subtitulo}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {opt.recomendado && (
                          <span className="bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Mejor
                          </span>
                        )}
                        <button className="text-on-surface-variant">
                          {isExpanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Time / Cost / Distance summary */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className={clsx(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold",
                        superaTiempo ? "text-error bg-error/10 border border-error/20" : "text-on-surface bg-surface-container-highest/60"
                      )}>
                        <MdSchedule size={13} /> {opt.tiempo}
                      </div>
                      <div className={clsx(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold",
                        superaPresupuesto ? "text-error bg-error/10 border border-error/20" : "text-on-surface bg-surface-container-highest/60"
                      )}>
                        <MdPayments size={13} /> {opt.costo}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-on-surface-variant bg-surface-container-highest/60">
                        {opt.distanciaKm} km
                      </div>
                    </div>

                    {/* Alerts */}
                    {(superaPresupuesto || superaTiempo) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {superaPresupuesto && (
                          <span className="text-[9px] font-bold bg-error/10 text-error border border-error/20 px-2 py-0.5 rounded-full">
                            ⚠ Excede Presupuesto (Bs. {presupuestoMax})
                          </span>
                        )}
                        {superaTiempo && (
                          <span className="text-[9px] font-bold bg-error/10 text-error border border-error/20 px-2 py-0.5 rounded-full">
                            ⚠ Excede Tiempo ({tiempoDisponibleHoras}h)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Segment bar - Trufi style */}
                    {renderSegmentBar(opt)}

                    {/* Bus line chips */}
                    {opt.busLines && opt.busLines.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {opt.busLines.map((line: string, i: number) => (
                          <span 
                            key={i}
                            className="text-[9px] font-bold text-white px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1"
                            style={{ backgroundColor: getLineColor(line) }}
                          >
                            <MdDirectionsBus size={10} /> {line}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expanded detail - step by step directions */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-outline-variant/10 pt-2">
                      <div className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider mb-1 flex items-center gap-1">
                        <MdArrowForward size={11} /> Tramos del viaje
                      </div>
                      {renderDetailSteps(opt)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom action button - fixed, non-scrolling */}
        {mapSelection && opcionesRuta.length > 0 && (
          <div className="p-3 bg-surface-container-low border-t border-outline-variant/10 shrink-0 space-y-2">
            {/* Selected route summary */}
            {activeOption && (
              <div className="flex items-center justify-between text-[11px] px-1 text-on-surface-variant">
                <span>Seleccionado: <strong className="text-on-surface">{activeOption.tipo}</strong></span>
                <span>{activeOption.tiempo} • {activeOption.costo}</span>
              </div>
            )}
            <button 
              onClick={handleComenzar}
              className="w-full bg-primary hover:bg-primary/90 text-on-primary-fixed py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] text-sm flex items-center justify-center gap-2"
            >
              <MdArrowForward size={18} />
              Usar esta ruta
            </button>
          </div>
        )}
      </aside>

      {/* Interactive Map Section */}
      <section className="flex-grow w-full h-1/2 md:h-full relative map-container overflow-hidden bg-surface-container-lowest z-10">
        <MapContainer 
          center={defaultCenter} 
          zoom={14} 
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Origin marker */}
          {mapSelection?.origen && (
            <Marker position={[mapSelection.origen.lat, mapSelection.origen.lng]} icon={startIcon}>
              <Popup>
                <div className="font-bold text-sm">📍 Tu ubicación de inicio</div>
              </Popup>
            </Marker>
          )}

          {/* Museum markers */}
          {mapSelection?.museos?.map((m: any, mIdx: number) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={museumIcon}>
              <Popup>
                <div className="font-bold text-sm">{m.nombre}</div>
                <div className="text-xs text-gray-500">Museo #{mIdx + 1}</div>
              </Popup>
            </Marker>
          ))}

          {/* Render polyline segments color-coded by leg mode and line */}
          {activeRouteLegs.map((leg: any, idx: number) => {
            let color = '#3b82f6'; // blue default (for private vehicles)
            let dashArray: string | undefined = undefined;
            let weight = 5;

            if (leg.mode === 'WALK') {
              color = '#78909c'; // blue-gray for walking segments
              dashArray = '6, 10';
              weight = 4;
            } else if (leg.mode === 'BUS') {
              color = getLineColor(leg.lineName || `bus-${idx}`);
              weight = 7;
            } else if (leg.mode === 'CAR') {
              color = '#1e88e5';
              weight = 5;
            }

            const isHighlighted = hoveredLeg === idx;

            return (
              <Polyline 
                key={idx}
                positions={leg.positions}
                pathOptions={{ 
                  color, 
                  weight: isHighlighted ? weight + 3 : weight, 
                  dashArray, 
                  opacity: isHighlighted ? 1 : 0.8 
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs">
                    {leg.mode === 'BUS' && leg.lineName && (
                      <span className="font-bold" style={{ color }}>🚍 {leg.lineName}</span>
                    )}
                    {leg.mode === 'WALK' && <span>🚶 Caminata</span>}
                    {leg.mode === 'CAR' && <span>🚗 Vehículo</span>}
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

          {/* Transfer/stop circle markers */}
          {transferPoints.map((tp, idx) => (
            <CircleMarker
              key={`tp-${idx}`}
              center={tp.position}
              radius={7}
              pathOptions={{
                fillColor: tp.type === 'transfer' ? '#ff9800' : tp.type === 'geton' ? '#43a047' : '#e53935',
                fillOpacity: 0.9,
                color: '#fff',
                weight: 2
              }}
            >
              <Tooltip>
                <div className="text-xs font-bold">
                  {tp.type === 'transfer' && `🔄 Transbordo: ${tp.fromLine} → ${tp.toLine}`}
                  {tp.type === 'geton' && `🚌 Subir: ${tp.toLine}`}
                  {tp.type === 'getoff' && `🛑 Bajar: ${tp.fromLine}`}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Map Legend */}
        {activeOption && activeOption.modo === 'bus' && activeOption.busLines?.length > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3 z-[400] max-w-[200px]">
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Líneas de Transporte</div>
            <div className="space-y-1.5">
              {activeOption.busLines.map((line: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: getLineColor(line) }}></div>
                  <span className="text-[11px] font-semibold text-gray-700">{line}</span>
                  <span className="text-[9px] text-gray-400 ml-auto">Bs. 3</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-5 h-3 rounded-sm bg-gray-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #78909c 0px, #78909c 4px, transparent 4px, transparent 7px)' }}></div>
                <span className="text-[11px] font-semibold text-gray-700">A pie</span>
                <span className="text-[9px] text-gray-400 ml-auto">Gratis</span>
              </div>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Total transporte</span>
              <span className="text-[11px] font-bold text-gray-800">{activeOption.costo}</span>
            </div>
          </div>
        )}

        {/* Floating info card on map */}
        {activeOption && !loading && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3 z-[400] max-w-[280px]">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: activeOption.color }}
              >
                {activeOption.modo === 'bus' ? <MdDirectionsBus size={16} /> : activeOption.modo === 'local_taxi' ? <MdLocalTaxi size={16} /> : <MdDirectionsWalk size={16} />}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-800">{activeOption.tipo}</div>
                <div className="text-[10px] text-gray-500">{activeOption.subtitulo}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="font-semibold text-gray-700">⏱ {activeOption.tiempo}</span>
              <span className="font-semibold text-gray-700">💰 {activeOption.costo}</span>
              <span className="text-gray-500">📏 {activeOption.distanciaKm} km</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default TarjetaAlternativa;
