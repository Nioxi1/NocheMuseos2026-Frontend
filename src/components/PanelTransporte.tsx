import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MdMyLocation, MdPlayArrow, MdStop, MdDirectionsBus, MdDirectionsWalk, MdPlace, MdSchedule, MdPayments, MdTransferWithinAStation, MdArrowForward, MdInfo, MdNavigation, MdGpsFixed, MdLocalTaxi } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAppStore } from '../store/appState';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Icons
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
const museumIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Same color palette as TarjetaAlternativa
const LINE_COLORS: Record<string, string> = {};
const PALETTE = [
  '#e53935', '#8e24aa', '#1e88e5', '#43a047', '#fb8c00',
  '#00acc1', '#6d4c41', '#d81b60', '#5e35b1', '#039be5',
  '#7cb342', '#f4511e', '#00897b', '#3949ab', '#c0ca33'
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

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// Component to track and follow user location on the map
const LocationTracker = ({ tracking, onLocationUpdate }: { tracking: boolean; onLocationUpdate: (pos: [number, number]) => void }) => {
  const map = useMap();
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (tracking && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
          onLocationUpdate(pos);
          map.setView(pos, Math.max(map.getZoom(), 16), { animate: true });
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tracking, map, onLocationUpdate]);

  return null;
};

const PanelTransporte = () => {
  const navigate = useNavigate();
  const { puntoPartida, rutaActiva, presupuestoMax, tiempoDisponibleHoras } = useAppStore();
  const [mapSelection, setMapSelection] = useState<any>(null);
  const [tracking, setTracking] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  // Load map selection from sessionStorage (same source as Comparar Rutas)
  useEffect(() => {
    const saved = sessionStorage.getItem('mapSelection');
    if (saved) {
      setMapSelection(JSON.parse(saved));
    }
  }, []);

  const ruta = rutaActiva;
  const start = mapSelection?.origen || (puntoPartida ? { lat: puntoPartida.lat, lng: puntoPartida.lng } : { lat: -17.3935, lng: -66.1568 });
  const museos = mapSelection?.museos || [];
  const geometryLegs = ruta?.geometryLegs || [];
  const pasos = ruta?.pasos || [];
  const transportPasos = pasos.filter((p: any) => p.modo !== 'Espera');
  const visitaPasos = pasos.filter((p: any) => p.modo === 'Espera');

  // Derive bus lines from route
  const busLines = useMemo(() => {
    return transportPasos
      .filter((p: any) => p.modo === 'Bus' && p.lineaBus)
      .map((p: any) => p.lineaBus)
      .filter((v: string, i: number, self: string[]) => self.indexOf(v) === i);
  }, [transportPasos]);

  // Build transfer points
  const transferPoints = useMemo(() => {
    if (!geometryLegs || geometryLegs.length < 2) return [];
    const points: { position: [number, number]; fromLine?: string; toLine?: string; type: string }[] = [];
    for (let i = 0; i < geometryLegs.length - 1; i++) {
      const currLeg = geometryLegs[i];
      const nextLeg = geometryLegs[i + 1];
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
  }, [geometryLegs]);

  const handleLocationUpdate = useCallback((pos: [number, number]) => {
    setUserPosition(pos);
  }, []);

  const handleStartTracking = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setTracking(true);
  };

  const handleStopTracking = () => {
    setTracking(false);
  };

  // Auto-scroll to active step
  useEffect(() => {
    if (stepsContainerRef.current) {
      const activeEl = stepsContainerRef.current.querySelector(`[data-step-index="${activeStepIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeStepIndex]);

  // No route data fallback
  if (!ruta) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-background p-8">
        <MdDirectionsBus size={64} className="text-outline/30 mb-4" />
        <h2 className="text-lg font-bold text-on-surface mb-2">No hay ruta seleccionada</h2>
        <p className="text-sm text-on-surface-variant mb-6 text-center max-w-md">
          Primero selecciona una ruta en "Comparar Rutas" para ver tu itinerario.
        </p>
        <button
          onClick={() => navigate('/comparar')}
          className="bg-primary hover:bg-primary/90 text-on-primary-fixed px-6 py-3 rounded-xl font-bold shadow-md transition-all"
        >
          Ir a Comparar Rutas
        </button>
      </div>
    );
  }

  const routeType = ruta.tipo === 'Recomendada' ? 'Transporte Público' : ruta.tipo === 'Privado' ? 'Taxi / Vehículo' : 'Caminata';

  return (
    <div className="flex flex-col md:flex-row h-full w-full relative overflow-hidden bg-background">
      {/* Sidebar - Itinerario detallado */}
      <aside className="w-full h-1/2 md:h-full md:w-[420px] bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant/15 flex flex-col z-20 shadow-xl md:shadow-none shrink-0">
        {/* Header - fixed */}
        <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-on-surface text-lg flex items-center gap-2">
                <MdNavigation size={20} className="text-primary" />
                Tu Ruta
              </h1>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{routeType}</p>
            </div>
            {tracking && (
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-green-700 uppercase">En vivo</span>
              </div>
            )}
          </div>

          {/* Route summary chips */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-surface-container-highest/80 px-2 py-1 rounded-lg text-[11px] font-bold text-on-surface">
              <MdSchedule size={13} /> {formatDuration(ruta.tiempoTotalMinutos)}
            </div>
            <div className="flex items-center gap-1 bg-surface-container-highest/80 px-2 py-1 rounded-lg text-[11px] font-bold text-on-surface">
              <MdPayments size={13} /> Bs. {ruta.costoEstimadoBs.toFixed(2)}
            </div>
            {ruta.distanciaMetros && (
              <div className="flex items-center gap-1 bg-surface-container-highest/80 px-2 py-1 rounded-lg text-[11px] text-on-surface-variant">
                {(ruta.distanciaMetros / 1000).toFixed(1)} km
              </div>
            )}
          </div>

          {/* Bus lines chips */}
          {busLines.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {busLines.map((line: string, i: number) => (
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

        {/* Step-by-step directions - scrollable */}
        <div ref={stepsContainerRef} className="flex-grow overflow-y-auto custom-scroll p-4">
          <div className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider mb-3 flex items-center gap-1">
            <MdArrowForward size={11} /> Tramos del viaje
          </div>

          <div className="space-y-0 relative">
            {/* Vertical timeline connector */}
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-outline-variant/20 z-0"></div>

            {transportPasos.map((paso: any, idx: number) => {
              const isBus = paso.modo === 'Bus';
              const lineColor = isBus ? getLineColor(paso.lineaBus || 'default') : '#9e9e9e';
              const isFirst = idx === 0;
              const isLast = idx === transportPasos.length - 1;
              const isActive = idx === activeStepIndex;

              return (
                <div
                  key={idx}
                  data-step-index={idx}
                  className="relative z-10"
                  onClick={() => setActiveStepIndex(idx)}
                >
                  {/* Origin point */}
                  {isFirst && (
                    <div className="flex items-center gap-3 py-1.5">
                      <div className="w-[30px] flex justify-center shrink-0">
                        <MdMyLocation size={16} className="text-primary" />
                      </div>
                      <span className="text-[11px] font-semibold text-on-surface">{paso.origen}</span>
                    </div>
                  )}

                  {/* Step card */}
                  <div
                    className={clsx(
                      "flex items-stretch gap-3 rounded-lg transition-all cursor-pointer",
                      isActive ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-surface-container-highest/50"
                    )}
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

                  {/* Transfer indicator */}
                  {idx < transportPasos.length - 1 && isBus && transportPasos[idx + 1].modo === 'Bus' && (
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-[30px] flex justify-center shrink-0">
                        <MdTransferWithinAStation size={14} className="text-secondary" />
                      </div>
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">Transbordo</span>
                    </div>
                  )}

                  {/* Destination point */}
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
              <div className="mt-3 pt-3 border-t border-outline-variant/10">
                <div className="text-[9px] uppercase font-bold text-secondary tracking-wider mb-1.5 flex items-center gap-1">
                  <MdInfo size={12} /> Paradas culturales
                </div>
                {visitaPasos.map((v: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-[10px] text-on-surface-variant">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                    {v.instruccion} ({v.duracionMinutos} min)
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer - action button */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/10 shrink-0 space-y-2">
          {/* Budget/Time indicator */}
          {(presupuestoMax > 0 || tiempoDisponibleHoras > 0) && (
            <div className="flex gap-2 text-[10px] justify-center">
              {presupuestoMax > 0 && (
                <span className={clsx(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full",
                  ruta.costoEstimadoBs > presupuestoMax ? "bg-error/10 text-error" : "bg-surface-container-highest text-on-surface-variant"
                )}>
                  <MdPayments size={11} /> Presupuesto: Bs. {presupuestoMax}
                </span>
              )}
              {tiempoDisponibleHoras > 0 && (
                <span className={clsx(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full",
                  ruta.tiempoTotalMinutos > tiempoDisponibleHoras * 60 ? "bg-error/10 text-error" : "bg-surface-container-highest text-on-surface-variant"
                )}>
                  <MdSchedule size={11} /> Tiempo: {tiempoDisponibleHoras}h
                </span>
              )}
            </div>
          )}

          {!tracking ? (
            <button
              onClick={handleStartTracking}
              className="w-full bg-primary hover:bg-primary/90 text-on-primary-fixed py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] text-sm flex items-center justify-center gap-2"
            >
              <MdPlayArrow size={20} />
              Iniciar Navegación
            </button>
          ) : (
            <button
              onClick={handleStopTracking}
              className="w-full bg-error hover:bg-error/90 text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] text-sm flex items-center justify-center gap-2"
            >
              <MdStop size={20} />
              Detener Navegación
            </button>
          )}
        </div>
      </aside>

      {/* Map Section - replicates the Comparar Rutas map */}
      <section className="flex-grow w-full h-1/2 md:h-full relative map-container overflow-hidden bg-surface-container-lowest z-10">
        <MapContainer
          center={[start.lat, start.lng]}
          zoom={14}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* GPS location tracker */}
          <LocationTracker tracking={tracking} onLocationUpdate={handleLocationUpdate} />

          {/* Origin marker */}
          <Marker position={[start.lat, start.lng]} icon={startIcon}>
            <Popup>
              <div className="font-bold text-sm">📍 Tu punto de inicio</div>
            </Popup>
          </Marker>

          {/* Museum markers */}
          {museos.map((m: any, mIdx: number) => (
            <Marker key={m.id || mIdx} position={[m.lat, m.lng]} icon={museumIcon}>
              <Popup>
                <div className="font-bold text-sm">{m.nombre}</div>
                <div className="text-xs text-gray-500">Museo #{mIdx + 1}</div>
              </Popup>
            </Marker>
          ))}

          {/* Color-coded polyline segments - same as Comparar Rutas */}
          {geometryLegs.map((leg: any, idx: number) => {
            let color = '#3b82f6';
            let dashArray: string | undefined = undefined;
            let weight = 5;

            if (leg.mode === 'WALK') {
              color = '#78909c';
              dashArray = '6, 10';
              weight = 4;
            } else if (leg.mode === 'BUS') {
              color = getLineColor(leg.lineName || `bus-${idx}`);
              weight = 7;
            } else if (leg.mode === 'CAR') {
              color = '#1e88e5';
              weight = 5;
            }

            return (
              <Polyline
                key={idx}
                positions={leg.positions}
                pathOptions={{ color, weight, dashArray, opacity: 0.8 }}
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

          {/* Real-time user position - blue pulsing dot */}
          {tracking && userPosition && (
            <>
              {/* Outer pulse ring */}
              <CircleMarker
                center={userPosition}
                radius={20}
                pathOptions={{
                  fillColor: '#4285f4',
                  fillOpacity: 0.15,
                  color: '#4285f4',
                  weight: 1,
                  opacity: 0.3
                }}
              />
              {/* Inner dot */}
              <CircleMarker
                center={userPosition}
                radius={8}
                pathOptions={{
                  fillColor: '#4285f4',
                  fillOpacity: 1,
                  color: '#ffffff',
                  weight: 3
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -12]}>
                  <div className="text-xs font-bold text-blue-600">📍 Estás aquí</div>
                </Tooltip>
              </CircleMarker>
            </>
          )}
        </MapContainer>

        {/* Map legend */}
        {busLines.length > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3 z-[400] max-w-[200px]">
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Líneas de Transporte</div>
            <div className="space-y-1.5">
              {busLines.map((line: string, i: number) => (
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
              <span className="text-[10px] text-gray-500">Total</span>
              <span className="text-[11px] font-bold text-gray-800">Bs. {ruta.costoEstimadoBs.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Tracking status floating card */}
        {tracking && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3 z-[400] max-w-[280px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-gray-800">Navegación en tiempo real</span>
            </div>
            <p className="text-[10px] text-gray-500">
              Tu ubicación se actualiza automáticamente. Sigue las líneas de colores en el mapa.
            </p>
            {userPosition && (
              <div className="text-[9px] text-gray-400 mt-1 font-mono">
                📍 {userPosition[0].toFixed(5)}, {userPosition[1].toFixed(5)}
              </div>
            )}
          </div>
        )}

        {/* Floating center-on-user button when tracking */}
        {tracking && userPosition && (
          <div className="absolute top-4 left-4 z-[400]">
            <button
              className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all border border-gray-200"
              onClick={() => {/* map will auto-center via LocationTracker */}}
              title="Centrar en mi ubicación"
            >
              <MdGpsFixed size={20} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default PanelTransporte;
