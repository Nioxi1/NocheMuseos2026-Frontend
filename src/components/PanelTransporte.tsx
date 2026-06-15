import { useState, useEffect } from 'react';
import { MdTune, MdMyLocation, MdClose, MdPlayArrow, MdAutoAwesome, MdSync, MdDirectionsBus, MdDirectionsWalk } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAppStore } from '../store/appState';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

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

const PanelTransporte = () => {
  const navigate = useNavigate();
  const { museosSeleccionados, puntoPartida, rutaActiva } = useAppStore();
  // Default starting point if none selected
  const defaultStart = {
    lat: -17.8045,
    lng: -63.1560,
    direccion: 'Ubicación predeterminada',
  };
  const start = puntoPartida ?? defaultStart;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ruta, setRuta] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (rutaActiva) {
      setRuta(rutaActiva);
      return;
    }

    if (!puntoPartida || museosSeleccionados.length === 0) return;

    const fetchRoute = async () => {
      setLoadingRoute(true);
      try {
        const response = await axios.post('http://localhost:8000/api/rutas', {
          origen: { lat: puntoPartida.lat, lng: puntoPartida.lng },
          museos: museosSeleccionados
        });
        const rutaData = response.data.ruta || response.data;
        setRuta(rutaData);
      } catch (error) {
        console.error("Error obteniendo ruta:", error);
      } finally {
        setLoadingRoute(false);
      }
    };
    fetchRoute();
  }, [puntoPartida, museosSeleccionados, rutaActiva]);

  // Si no hay punto de partida, use fallback for map rendering
  if (!puntoPartida) {
    // Show fallback UI but continue rendering map with default coordinates
  }

  const polylinePositions = ruta && ruta.geometry && ruta.geometry.type === 'LineString'
    ? ruta.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])
    : [];

  const getPasos = () => {
    const startPoint = { id: 'start', tipo: 'Inicio', color: 'bg-primary', icon: 'home', duracion: '-', desc: start.direccion };
    
    if (ruta && ruta.pasos && ruta.pasos.length > 0) {
      return [
        startPoint,
        ...ruta.pasos.map((p: any) => ({
          id: p.id,
          tipo: p.modo === 'Bus' ? 'Transporte' : p.modo === 'Espera' ? 'Visita' : 'Caminata',
          color: p.modo === 'Bus' ? 'bg-primary' : p.modo === 'Espera' ? 'bg-secondary' : 'bg-tertiary',
          icon: p.modo === 'Bus' ? 'directions_bus' : p.modo === 'Espera' ? 'museum' : 'directions_walk',
          duracion: `${p.duracionMinutos} min`,
          desc: p.instruccion
        }))
      ];
    }

    let pasos = [startPoint];
    if (ruta && ruta.orden) {
      ruta.orden.forEach((nombre: string, index: number) => {
        pasos.push({
          id: `walk-${index}`, tipo: 'Ruta', color: 'bg-tertiary', icon: 'directions_walk', duracion: 'Simulado', desc: 'Sigue la ruta verde'
        });
        pasos.push({
          id: `mus-${index}`, tipo: 'Museo', color: 'bg-secondary', icon: 'museum', duracion: 'Visita', desc: nombre
        });
      });
    }
    return pasos;
  };

  const pasos = getPasos();

  return (
    <div className="flex flex-col md:flex-row h-full w-full relative overflow-hidden bg-surface">
      {/* Sidebar de Itinerario */}
      <aside className="w-full h-1/2 md:h-full md:w-96 bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant/15 flex flex-col z-20 shadow-xl md:shadow-none shrink-0 overflow-y-auto custom-scroll">
        <div className="p-lg border-b border-outline-variant/10 sticky top-0 bg-surface-container-low/90 backdrop-blur-md z-10 flex justify-between items-center">
          <div>
            <h1 className="font-headline-lg-mobile text-on-surface font-bold text-xl">Tu Itinerario</h1>
            <p className="text-label-md text-secondary uppercase font-bold mt-1">Sugerencia IA Transporte</p>
          </div>
          <button onClick={() => setDrawerOpen(!drawerOpen)} className="p-sm bg-surface-container-highest rounded-full text-on-surface hover:bg-surface-container-high transition-colors">
            <MdTune />
          </button>
        </div>

        <div className="p-lg flex-grow relative">
          <div className="absolute left-11 top-lg bottom-lg w-1 bg-outline-variant/30 rounded-full"></div>
          {loadingRoute ? (
            <div className="text-center p-xl">Calculando ruta con OSRM...</div>
          ) : (
            <div className="space-y-xl relative z-10">
              {pasos.map((paso) => (
                <div key={paso.id} className="flex gap-md group cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md z-10 group-hover:scale-110 transition-transform", paso.color)}>
                      {paso.icon === 'home' ? (
                        <MdMyLocation className="text-sm" />
                      ) : paso.icon === 'directions_bus' ? (
                        <MdDirectionsBus className="text-sm" />
                      ) : paso.icon === 'museum' ? (
                        <MdAutoAwesome className="text-sm" />
                      ) : (
                        <MdDirectionsWalk className="text-sm" />
                      )}
                    </div>
                  </div>
                  <div className="flex-grow bg-surface-container-highest/50 p-sm rounded-xl group-hover:bg-surface-container-high transition-colors border border-outline-variant/10">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-title-md text-sm text-on-surface">{paso.tipo}</h3>
                      <span className="text-label-md text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded">{paso.duracion}</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant leading-tight">{paso.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-lg bg-surface-container-low border-t border-outline-variant/10 sticky bottom-0">
          <div className="flex justify-between items-center mb-md px-sm">
            <span className="font-title-md text-on-surface">Distancia Total Aprox.</span>
            <span className="font-display-lg text-primary text-2xl">
              {ruta?.distance ? `${(ruta.distance / 1000).toFixed(1)} km` : '-'}
            </span>
          </div>
          <button 
            onClick={() => navigate('/guia')}
            className="w-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary py-md rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-xs"
          >
            <MdPlayArrow className="text-[18px]" />
            Iniciar Navegación
          </button>
        </div>
      </aside>

      {/* Mapa Interactivo */}
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
          
          <Marker position={[start.lat, start.lng]} icon={startIcon}>
            <Popup>Tu Inicio: {start.direccion}</Popup>
          </Marker>

          {museosSeleccionados.map((m: any) => (
            <Marker key={m.id} position={[m.coordenadas.lat, m.coordenadas.lng]} icon={museumIcon}>
              <Popup>{m.nombre}</Popup>
            </Marker>
          ))}

          {ruta && ruta.geometryLegs && ruta.geometryLegs.length > 0 ? (
            ruta.geometryLegs.map((leg: any, idx: number) => {
              let color = '#4caf50'; // green for transit
              let dashArray = undefined;
              let weight = 5;
              if (leg.mode === 'WALK') {
                color = '#71717a'; // gray
                dashArray = '5, 8';
                weight = 4;
              } else if (leg.mode === 'CAR') {
                color = '#3b82f6'; // blue
              }
              return (
                <Polyline 
                  key={idx} 
                  positions={leg.positions} 
                  pathOptions={{ color, weight, dashArray, opacity: 0.85 }} 
                />
              );
            })
          ) : polylinePositions.length > 0 ? (
            <Polyline positions={polylinePositions} pathOptions={{ color: '#4caf50', weight: 5, opacity: 0.8 }} />
          ) : null}
        </MapContainer>

        {/* Floating Controls */}
        <div className="absolute top-lg right-lg flex flex-col gap-sm z-[400] hidden md:flex">
          <button className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all">
            <MdMyLocation />
          </button>
        </div>
      </section>

      {/* Drawer de Ajustes (Overlay) */}
      <div className={clsx(
        "absolute inset-y-0 right-0 w-80 bg-surface-container-low shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-outline-variant/20 flex flex-col",
        drawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-md flex justify-between items-center border-b border-outline-variant/10">
          <h2 className="font-title-md text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-secondary">tune</span> Ajustes Rápidos
          </h2>
          <button onClick={() => setDrawerOpen(false)} className="p-xs text-on-surface-variant hover:bg-surface-container-highest rounded-full">
            <MdClose />
          </button>
        </div>
        
        <div className="p-lg flex-grow overflow-y-auto space-y-xl">
          <div className="bg-surface-container-highest p-md rounded-xl text-center">
            <MdSync className="text-primary mb-xs" />
            <p className="text-body-sm text-on-surface-variant">Puedes regresar para cambiar museos o inicio.</p>
          </div>
        </div>
      </div>
      
      {/* Overlay Backdrop para Drawer */}
      {drawerOpen && (
        <div 
          className="absolute inset-0 bg-black/20 z-30 transition-opacity"
          onClick={() => setDrawerOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default PanelTransporte;
