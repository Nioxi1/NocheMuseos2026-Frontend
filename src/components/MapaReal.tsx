import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../store/appState';
import { useMuseos } from '../hooks/useMuseos';
import type { Museo } from '../types';
import clsx from 'clsx';
import { MdLocationOn, MdTouchApp, MdAutoFixHigh, MdClose, MdSchedule, MdPayments, MdHourglassEmpty, MdStar, MdStarBorder, MdStarHalf, MdGpsFixed, MdSearch, MdAdd, MdDeleteOutline } from 'react-icons/md';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { buildMapSelection, saveMapSelection } from '../utils/mapSelection';

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

const FitMapView = ({
  museos,
  startPos,
}: {
  museos: Museo[];
  startPos: L.LatLng | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (startPos) {
      map.setView([startPos.lat, startPos.lng], 14);
      return;
    }
    if (museos.length === 0) return;
    const bounds = L.latLngBounds(
      museos.map(m => [m.coordenadas.lat, m.coordenadas.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [map, museos, startPos]);

  return null;
};

// Map Component to handle clicks
const MapEvents = ({ setPos, closeDetail }: { setPos: (latlng: L.LatLng) => void; closeDetail: () => void }) => {
  useMapEvents({
    click(e) {
      setPos(e.latlng);
      closeDetail();
    },
  });
  return null;
};

const MapaReal: React.FC = () => {
  const navigate = useNavigate();
  const { museosSeleccionados, toggleMuseo, limpiarMuseos, puntoPartida, setPuntoPartida } = useAppStore();
  const { museos } = useMuseos();
  const [searchValue, setSearchValue] = useState('');
  const [museumSearch, setMuseumSearch] = useState('');
  const [markerPos, setMarkerPos] = useState<L.LatLng | null>(puntoPartida ? new L.LatLng(puntoPartida.lat, puntoPartida.lng) : null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [selectedMuseumForDetail, setSelectedMuseumForDetail] = useState<any | null>(null);

  // Reiniciar selección al entrar al mapa
  useEffect(() => {
    limpiarMuseos();
  }, [limpiarMuseos]);

  const filteredMuseos = museumSearch.trim()
    ? museos.filter(m => {
        const q = museumSearch.toLowerCase();
        return (
          m.nombre.toLowerCase().includes(q) ||
          m.categoria.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  const canProceed = Boolean(markerPos && museosSeleccionados.length > 0);

  const renderStars = (rating: number) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<MdStar key={i} className="text-yellow-500" size={16} />);
      } else if (i - 0.5 === rating || (i === floor + 1 && rating % 1 !== 0)) {
        stars.push(<MdStarHalf key={i} className="text-yellow-500" size={16} />);
      } else {
        stars.push(<MdStarBorder key={i} className="text-yellow-500" size={16} />);
      }
    }
    return stars;
  };

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
    setShowDropdown(false);
  };

  // Use browser geolocation to mark current position
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoLocating(true);
    setShowDropdown(false);
    setShowSuggestions(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarkerPos(new L.LatLng(lat, lng));
        setPuntoPartida({ lat, lng, direccion: 'Mi ubicación actual' });
        setSearchValue('Mi ubicación actual');
        setGeoLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
        setGeoLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = (latlng: L.LatLng) => {
    setMarkerPos(latlng);
    setPuntoPartida({ lat: latlng.lat, lng: latlng.lng, direccion: 'Ubicación seleccionada en el mapa' });
    setShowDropdown(false);
    setShowSuggestions(false);
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
    if (!markerPos || museosSeleccionados.length === 0) {
      alert('Marca tu punto de partida y agrega al menos un museo antes de continuar.');
      return;
    }

    const selection = buildMapSelection(
      { lat: markerPos.lat, lng: markerPos.lng },
      museosSeleccionados
    );
    if (!selection) return;

    saveMapSelection(selection);
    navigate('/comparar');
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full relative overflow-hidden">
      {/* SideNavBar / Panel Control */}
      <aside className="w-full h-1/2 md:h-full md:w-[420px] bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant/15 flex flex-col z-20 shadow-xl md:shadow-none shrink-0 relative overflow-hidden">
        <div className="p-lg space-y-md flex-shrink-0 overflow-y-auto max-h-[45%] md:max-h-none">
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
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-surface-container-highest border-none rounded-lg pl-xl pr-12 px-md py-sm text-body-lg focus:ring-2 focus:ring-primary transition-all" 
                    placeholder="Ej. Plaza Principal"
                  />
                  <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary" size={20} />
                  <button 
                    onClick={handleSearch} 
                    disabled={isLoading || geoLocating}
                    className="ml-2 bg-secondary text-white px-3 py-2 rounded-lg font-bold"
                  >
                    {isLoading ? '...' : 'Buscar'}
                  </button>
                </div>
                {/* Dropdown: GPS option + autocomplete suggestions */}
                {(showDropdown || (showSuggestions && suggestions.length > 0)) && (
                  <ul className="absolute z-50 bg-surface border border-outline-variant rounded-lg shadow-lg w-full max-h-56 overflow-y-auto mt-1">
                    {/* GPS: Use current location - always first */}
                    <li
                      onClick={handleUseCurrentLocation}
                      className="px-3 py-2.5 hover:bg-primary/5 cursor-pointer text-sm border-b border-outline-variant/15 flex items-center gap-2 font-semibold text-primary"
                    >
                      <MdGpsFixed size={18} className={geoLocating ? 'animate-spin' : ''} />
                      <span>{geoLocating ? 'Obteniendo ubicación...' : 'Marcar posición actual'}</span>
                    </li>
                    {/* Autocomplete suggestions */}
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
        </div>

        {/* Museos seleccionados — panel ampliado con buscador */}
        <div className="flex-grow flex flex-col min-h-0 mx-lg mb-md bg-surface-container-high rounded-xl border border-outline-variant/10 overflow-hidden">
            <div className="p-md border-b border-outline-variant/10 space-y-sm shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="font-label-md text-on-surface font-bold">MUSEOS SELECCIONADOS</h3>
                <span className="bg-primary text-on-primary-fixed text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {museosSeleccionados.length}
                </span>
              </div>
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="text"
                  value={museumSearch}
                  onChange={(e) => setMuseumSearch(e.target.value)}
                  placeholder="Buscar museo por nombre o categoría..."
                  className="w-full bg-surface-container-highest border-none rounded-lg pl-10 pr-3 py-2.5 text-body-sm focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {museumSearch.trim() && (
              <ul className="max-h-36 overflow-y-auto border-b border-outline-variant/10 shrink-0">
                {filteredMuseos.length > 0 ? (
                  filteredMuseos.map(m => {
                    const yaSeleccionado = museosSeleccionados.some(s => s.id === m.id);
                    return (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-2 px-md py-2 hover:bg-surface-container transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-body-sm font-semibold text-on-surface truncate">{m.nombre}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase">{m.categoria}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => !yaSeleccionado && toggleMuseo(m)}
                          disabled={yaSeleccionado}
                          className={clsx(
                            'shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                            yaSeleccionado
                              ? 'bg-secondary/20 text-secondary cursor-default'
                              : 'bg-primary text-on-primary-fixed hover:bg-primary-container'
                          )}
                        >
                          {yaSeleccionado ? 'Agregado' : <><MdAdd size={14} /> Agregar</>}
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="px-md py-3 text-body-sm text-on-surface-variant italic">
                    No se encontraron museos
                  </li>
                )}
              </ul>
            )}

            <ul className="flex-grow overflow-y-auto p-md space-y-2 min-h-[140px]">
              {museosSeleccionados.length > 0 ? (
                museosSeleccionados.map(m => (
                  <li
                    key={m.id}
                    className="flex items-center gap-sm bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant/10 group"
                  >
                    <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
                    <div className="flex-grow min-w-0">
                      <p className="text-body-sm font-semibold text-on-surface truncate">{m.nombre}</p>
                      <p className="text-[10px] text-on-surface-variant">{m.categoria}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleMuseo(m)}
                      className="shrink-0 p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                      title="Quitar museo"
                    >
                      <MdDeleteOutline size={18} />
                    </button>
                  </li>
                ))
              ) : (
                <li className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <MdSearch size={32} className="text-outline/40 mb-2" />
                  <p className="text-body-sm text-on-surface-variant">
                    Ningún museo seleccionado. Usa el buscador o haz clic en un marcador del mapa.
                  </p>
                </li>
              )}
            </ul>
          </div>
        
        {/* Footer Action */}
        <div className="p-lg bg-surface-container-low border-t border-outline-variant/10 shrink-0">
          {!markerPos && museosSeleccionados.length > 0 && (
            <p className="text-[11px] text-tertiary-fixed mb-2 text-center font-medium">
              Falta marcar tu punto de partida
            </p>
          )}
          <button 
            onClick={handleNavigateToComparar}
            disabled={!canProceed}
            className={clsx(
              "w-full font-headline-lg-mobile text-sm py-md rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-base",
              canProceed
                ? "bg-primary hover:bg-primary-container text-on-primary-fixed"
                : "bg-outline-variant/30 text-on-surface-variant cursor-not-allowed"
            )}
          >
            <MdAutoFixHigh size={20} />
            {!markerPos
              ? 'Marca tu punto de partida'
              : museosSeleccionados.length === 0
                ? 'Selecciona museos'
                : 'Comparar Rutas'}
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
            <MapEvents setPos={handleMapClick} closeDetail={() => setSelectedMuseumForDetail(null)} />
            <FitMapView museos={museos} startPos={markerPos} />

            {markerPos ? (
                <Marker position={[markerPos.lat, markerPos.lng]} icon={startIcon}>
                  <Popup>Tu punto de inicio</Popup>
                </Marker>
              ) : null}

          {museosSeleccionados.map(m => (
            <Marker 
              key={`selected-${m.id}`} 
              position={[m.coordenadas.lat, m.coordenadas.lng]} 
              icon={museumIcon}
              eventHandlers={{
                click: () => {
                  setSelectedMuseumForDetail(m);
                }
              }}
            />
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

          {/* Museos disponibles (no seleccionados) */}
          {museos
            .filter(m => !museosSeleccionados.some(s => s.id === m.id))
            .map(m => (
            <Marker 
              key={m.id} 
              position={[m.coordenadas.lat, m.coordenadas.lng]} 
              icon={museumIcon}
              eventHandlers={{
                click: () => {
                  setSelectedMuseumForDetail(m);
                }
              }}
            />
          ))}
        </MapContainer>

        {/* Google Maps style floating detail card drawer overlay */}
        {selectedMuseumForDetail && (
          <div className="absolute top-4 bottom-4 left-4 w-80 md:w-96 bg-surface-container-high/95 backdrop-blur-md shadow-2xl rounded-2xl border border-outline-variant/15 flex flex-col z-[500] overflow-hidden animate-fade-in transition-all">
            {/* Header Cover Image */}
            <div className="h-44 w-full relative bg-surface-dim shrink-0">
              <img 
                src={selectedMuseumForDetail.imagenUrl} 
                alt={selectedMuseumForDetail.nombre} 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setSelectedMuseumForDetail(null)}
                className="absolute top-3 right-3 bg-black/45 hover:bg-black/65 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md border border-white/20"
              >
                <MdClose size={18} />
              </button>
              <div className="absolute bottom-2 right-2 bg-secondary/90 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                {selectedMuseumForDetail.categoria}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-md flex-grow overflow-y-auto space-y-md custom-scroll">
              <div>
                <h2 className="font-bold text-on-surface text-lg md:text-xl leading-tight">
                  {selectedMuseumForDetail.nombre}
                </h2>
                
                {/* Star rating review count mock */}
                <div className="flex items-center gap-xs mt-1 text-xs text-on-surface-variant">
                  <span className="font-bold text-secondary text-sm">4.5</span>
                  <div className="flex items-center">
                    {renderStars(4.5)}
                  </div>
                  <span>(120)</span>
                  <span className="text-outline">•</span>
                  <span className="font-semibold text-primary">Museo</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-body-sm text-on-surface-variant text-xs md:text-sm leading-relaxed">
                {selectedMuseumForDetail.descripcion || 'Descubre la riqueza cultural y artística en este emblemático recinto histórico de la ciudad de Cochabamba.'}
              </p>

              <div className="h-px bg-outline-variant/15"></div>

              {/* Schedules and info blocks */}
              <div className="space-y-sm text-xs md:text-sm text-on-surface">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MdSchedule size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wide">Horario de Visitas</div>
                    <div className="font-semibold">
                      {selectedMuseumForDetail.horarioApertura || '18:00'} - {selectedMuseumForDetail.horarioCierre || '23:00'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MdPayments size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wide">Costo de Entrada</div>
                    <div className="font-semibold">
                      {selectedMuseumForDetail.precio > 0 ? `Bs. ${selectedMuseumForDetail.precio.toFixed(2)}` : 'Ingreso Gratuito'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MdHourglassEmpty size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wide">Tiempo Sugerido</div>
                    <div className="font-semibold">
                      {selectedMuseumForDetail.tiempoEstimado} hrs de recorrido
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bottom Button */}
            <div className="p-md bg-surface-container-high border-t border-outline-variant/10 shrink-0">
              {museosSeleccionados.some(m => m.id === selectedMuseumForDetail.id) ? (
                <button
                  onClick={() => toggleMuseo(selectedMuseumForDetail)}
                  className="w-full py-sm bg-surface-container-highest hover:bg-surface-variant text-on-surface border border-outline-variant rounded-xl font-bold transition-all text-xs md:text-sm active:scale-[0.98]"
                >
                  Quitar de visita
                </button>
              ) : (
                <button
                  onClick={() => toggleMuseo(selectedMuseumForDetail)}
                  className="w-full py-sm bg-primary hover:bg-primary-container text-on-primary-fixed rounded-xl font-bold transition-all text-xs md:text-sm active:scale-[0.98] shadow-md ai-glow"
                >
                  Agregar a visita
                </button>
              )}
            </div>
          </div>
        )}
        
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
