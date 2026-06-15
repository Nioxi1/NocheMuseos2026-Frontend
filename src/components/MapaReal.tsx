import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../store/appState';
import { useMuseos } from '../hooks/useMuseos';
import clsx from 'clsx';
import { MdLocationOn, MdTouchApp, MdAutoFixHigh } from 'react-icons/md';
import axios from 'axios';

// Fix for default Leaflet icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icons
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

// Map Component to handle clicks
const MapEvents = ({ setPos }: { setPos: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      setPos(e.latlng);
    },
  });
  return null;
};

const MapaReal: React.FC = () => {
  const { museosSeleccionados, toggleMuseo, puntoPartida, setPuntoPartida } = useAppStore();
  const { museos, loading } = useMuseos();
  const [searchValue, setSearchValue] = useState('');
  const [markerPos, setMarkerPos] = useState<L.LatLng | null>(puntoPartida ? new L.LatLng(puntoPartida.lat, puntoPartida.lng) : null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Default position: Cochabamba center
  const defaultPos = { lat: -17.3935, lng: -66.1568 };
  const API_BASE = 'http://localhost:8000';

  // Handle Search Input -> Backend Geocoding
  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/geocode`, {
        direccion: searchValue
      });
      const { lat, lng } = response.data;
      setMarkerPos(new L.LatLng(lat, lng));
      setPuntoPartida({ lat, lng, direccion: searchValue || 'Ubicación seleccionada' });
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error al buscar dirección", error);
      alert("No se pudo encontrar la dirección. Intenta de nuevo o haz clic en el mapa.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/autocomplete?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        console.error('Autocomplete error', response.status);
        setSuggestions([]);
        return;
      }
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete network error', error);
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: any) => {
    setSearchValue(suggestion.display_name);
    setMarkerPos(new L.LatLng(parseFloat(suggestion.lat), parseFloat(suggestion.lon)));
    setPuntoPartida({ 
      lat: parseFloat(suggestion.lat), 
      lng: parseFloat(suggestion.lon), 
      direccion: suggestion.display_name 
    });
    setShowSuggestions(false);
  };

  const handleMapClick = (latlng: L.LatLng) => {
    setMarkerPos(latlng);
    setPuntoPartida({ lat: latlng.lat, lng: latlng.lng, direccion: 'Ubicación seleccionada en el mapa' });
  };

  // Calculate route when start point or selected museums change
  const calculateRoute = async () => {
    if (!markerPos || museosSeleccionados.length === 0) return;
    
    setCalculatingRoute(true);
    try {
      const museosData = museosSeleccionados.map(m => ({
        id: m.id,
        nombre: m.nombre,
        lat: (m as any).coordenadas.lat,
        lng: (m as any).coordenadas.lng,
        precio: (m as any).precio,
        tiempoEstimado: (m as any).tiempoEstimado
      }));
      
      console.log('Sending to /api/rutas:', {
        origen: { lat: markerPos.lat, lng: markerPos.lng },
        museos: museosData
      });
      
      const response = await axios.post(`${API_BASE}/api/rutas`, {
        origen: { lat: markerPos.lat, lng: markerPos.lng },
        museos: museosData
      });
      setRoute(response.data);
    } catch (error) {
      console.error("Error calculating route", error);
    } finally {
      setCalculatingRoute(false);
    }
  };

  // Recalculate route when start point or selected museums change
  React.useEffect(() => {
    calculateRoute();
  }, [markerPos, museosSeleccionados]);

  const handleNavigateToComparar = () => {
    // Store the current selection in sessionStorage for the Comparar Rutas page
    sessionStorage.setItem('mapSelection', JSON.stringify({
      origen: markerPos ? { lat: markerPos.lat, lng: markerPos.lng } : null,
      museos: museosSeleccionados.map(m => ({
        id: m.id,
        nombre: m.nombre,
        lat: (m as any).coordenadas.lat,
        lng: (m as any).coordenadas.lng,
        precio: (m as any).precio,
        tiempoEstimado: (m as any).tiempoEstimado,
        categoria: (m as any).categoria,
        imagenUrl: (m as any).imagenUrl,
        descripcion: (m as any).descripcion
      }))
    }));
    window.location.href = '/comparar';
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full relative overflow-hidden">
      {/* SideNavBar / Panel Control */}
      <aside className="w-full h-1/2 md:h-full md:w-96 bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant/15 flex flex-col z-20 shadow-xl md:shadow-none shrink-0 relative overflow-y-auto">
        <div className="p-lg space-y-lg flex-grow">
          <div>
            <h1 className="font-headline-lg-mobile text-on-surface mb-xs font-bold">Punto de Partida</h1>
            <p className="text-body-sm text-on-surface-variant">Selecciona dónde comienza tu aventura cultural hoy.</p>
          </div>
          
          <div className="space-y-md">
            {/* Search Input */}
            <div className="relative">
              <label className="font-label-md text-secondary mb-xs block" htmlFor="address-search">DIRECCIÓN O LUGAR</label>
                <div className="relative group flex items-center">
                  <input 
                    id="address-search" 
                    type="text" 
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      fetchSuggestions(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-surface-container-highest border-none rounded-lg pl-xl pr-12 px-md py-sm text-body-lg focus:ring-2 focus:ring-primary transition-all" 
                    placeholder="Ej. Plaza Principal"
                  />
                  <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary" size={20} />
                  <button 
                    onClick={handleSearch} 
                    disabled={isLoading}
                    className="ml-2 bg-secondary text-white px-3 py-2 rounded-lg font-bold"
                  >
                    {isLoading ? '...' : 'Buscar'}
                  </button>
                </div>
                {/* Autocomplete suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 bg-surface border border-outline-variant rounded-lg shadow-lg w-full max-h-48 overflow-y-auto mt-1">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-3 py-2 hover:bg-surface-variant cursor-pointer text-sm border-b border-outline-variant/10 last:border-0"
                      >
                        {s.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-base py-base">
              <div className="h-px flex-grow bg-outline-variant/20"></div>
              <span className="text-label-md text-outline">O</span>
              <div className="h-px flex-grow bg-outline-variant/20"></div>
            </div>
            
            {/* Map Interaction Help - Comment */}
            <div className="w-full flex items-center justify-center gap-base p-md border-2 border-dashed border-secondary/30 rounded-xl bg-surface-container/50">
                            <MdTouchApp className="text-secondary" />
              <span className="font-title-md text-secondary text-sm">Haz clic en el mapa para marcar tu inicio</span>
            </div>
          </div>
          
          {/* Selected Museums Summary */}
          <div className="bg-surface-container-high rounded-xl p-md border border-outline-variant/10">
            <div className="flex justify-between items-center mb-sm">
              <h3 className="font-label-md text-on-surface">MUSEOS SELECCIONADOS</h3>
              <span className="bg-primary text-on-primary-fixed text-xs px-2 py-0.5 rounded-full font-bold">{museosSeleccionados.length}</span>
            </div>
            <ul className="space-y-sm">
              {museosSeleccionados.length > 0 ? (
                museosSeleccionados.map(m => (
                  <li key={m.id} className="flex items-center gap-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="text-body-sm text-on-surface-variant">{m.nombre}</span>
                  </li>
                ))
              ) : (
                <li className="text-body-sm text-on-surface-variant italic">Ningún museo seleccionado</li>
              )}
            </ul>
          </div>
        
        {/* Footer Action */}
        <div className="p-lg bg-surface-container-low border-t border-outline-variant/10 sticky bottom-0">
          <button 
            onClick={handleNavigateToComparar}
            className={clsx(
              "w-full font-headline-lg-mobile text-sm py-md rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-base",
              "bg-primary hover:bg-primary-container text-on-primary-fixed"
            )}
          >
            <MdAutoFixHigh className="text-white" size={20} />
            {museosSeleccionados.length === 0 ? "Selecciona museos" : "Seleccionar Ruta"}
          </button>
        </div>
      </aside>

      {/* Interactive Map View */}
      <section className="flex-grow w-full h-1/2 md:h-full relative z-10">
        <MapContainer 
            key={window.location.pathname}
            center={[defaultPos.lat, defaultPos.lng]} 
            zoom={13} 
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents setPos={handleMapClick} />
            
            {markerPos ? (
                <Marker position={[markerPos.lat, markerPos.lng]} icon={startIcon}>
                  <Popup>Tu punto de inicio</Popup>
                </Marker>
              ) : null}

          {museosSeleccionados.map(m => (
            <Marker key={m.id} position={[(m as any).coordenadas.lat, (m as any).coordenadas.lng]} icon={museumIcon}>
              <Popup>{m.nombre}</Popup>
            </Marker>
          ))}

          {/* Display route polyline if available */}
          {route && route.geometry && (
            <Polyline
              positions={route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]])}
              color="#3b82f6"
              weight={4}
              opacity={0.7}
            />
          )}

          {/* Show all museums as selectable markers */}
          {museos.map(m => (
            <Marker 
              key={m.id} 
              position={[(m as any).coordenadas.lat, (m as any).coordenadas.lng]} 
              icon={museumIcon}
            >
              <Popup>
                <div className="font-bold mb-1">{m.nombre}</div>
                <div className="text-sm mb-2">{m.categoria}</div>
                <div className="text-xs mb-2">Precio: ${m.precio}</div>
                <button
                  onClick={() => toggleMuseo(m)}
                  className={clsx(
                    'px-2 py-1 rounded text-sm',
                    museosSeleccionados.find((s) => s.id === m.id)
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-highest text-on-surface'
                  )}
                >
                  {museosSeleccionados.find((s) => s.id === m.id)
                    ? 'Quitar de visita'
                    : 'Agregar a visita'}
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* AI Insight Tooltip - Solo se muestra si hay un inicio seleccionado */}
        {markerPos && (
          <div className="absolute bottom-lg left-lg glass-panel p-md rounded-xl border-l-4 border-primary shadow-xl max-w-xs z-[400] pointer-events-none hidden md:block bg-surface-container/90">
            <div className="flex items-center gap-base mb-xs text-primary">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span className="font-label-md text-xs font-bold">SUGERENCIA IA</span>
            </div>
            <p className="text-body-sm text-on-surface leading-tight">
              Punto de inicio establecido. Nuestro Agente de Transporte trazará tu ruta.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MapaReal;
