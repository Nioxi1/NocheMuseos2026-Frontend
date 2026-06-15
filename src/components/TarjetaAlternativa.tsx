import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDirectionsBus, MdSchedule, MdPayments } from 'react-icons/md';
import clsx from 'clsx';
import { useAppStore } from '../store/appState';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const TarjetaAlternativa = () => {
  const navigate = useNavigate();
  const { setRutaActiva } = useAppStore();
  const [seleccion, setSeleccion] = useState('');
  const [opcionesRuta, setOpcionesRuta] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapSelection, setMapSelection] = useState<any>(null);

  useEffect(() => {
    // Load map selection from sessionStorage
    const savedSelection = sessionStorage.getItem('mapSelection');
    if (savedSelection) {
      const data = JSON.parse(savedSelection);
      setMapSelection(data);
      fetchTransportOptions(data);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTransportOptions = async (data: any) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/rutas`, {
        origen: data.origen,
        museos: data.museos
      });
      
      // Transform backend response to frontend format
      const opciones = response.data.rutas?.map((ruta: any, index: number) => ({
        id: `opt${index}`,
        tipo: ruta.tipo,
        modo: ruta.tipo === 'Recomendada' ? 'bus' : ruta.tipo === 'Privado' ? 'local_taxi' : 'directions_walk',
        tiempo: `${Math.round(ruta.tiempoTotalMinutos)} min`,
        costo: `Bs. ${ruta.costoEstimadoBs.toFixed(2)}`,
        etiquetas: ruta.tipo === 'Recomendada' ? ['Económico', 'Trufi/Micro'] : ruta.tipo === 'Privado' ? ['Rápido', 'Directo'] : ['Saludable', 'Turístico'],
        recomendado: ruta.tipo === 'Recomendada',
        detalles: ruta.pasos?.map((p: any) => p.instruccion).join(' → ') || 'Ruta calculada',
        color: ruta.tipo === 'Recomendada' ? 'border-primary' : ruta.tipo === 'Privado' ? 'border-secondary' : 'border-tertiary',
        rutaData: ruta
      })) || [];
      
      setOpcionesRuta(opciones);
      if (opciones.length > 0) {
        setSeleccion(opciones[0].id);
      }
    } catch (error) {
      console.error('Error fetching transport options:', error);
      // Fallback to hardcoded options if API fails
      setOpcionesRuta([
        {
          id: 'opt1',
          tipo: 'Transporte Público',
          modo: 'bus',
          tiempo: '45 min',
          costo: 'Bs. 4.00',
          etiquetas: ['Económico', 'Trufi/Micro'],
          recomendado: true,
          detalles: '2 transbordos (Línea 106, Línea 1)',
          color: 'border-primary'
        },
        {
          id: 'opt2',
          tipo: 'Vehículo Privado',
          modo: 'local_taxi',
          tiempo: '20 min',
          costo: 'Bs. 35.00',
          etiquetas: ['Rápido', 'Directo'],
          recomendado: false,
          detalles: 'Ruta más rápida vía Av. Ayacucho',
          color: 'border-secondary'
        },
        {
          id: 'opt3',
          tipo: 'Caminata',
          modo: 'directions_walk',
          tiempo: '1h 15 min',
          costo: 'Gratis',
          etiquetas: ['Saludable', 'Turístico'],
          recomendado: false,
          detalles: 'Pasa por El Prado',
          color: 'border-tertiary'
        }
      ]);
      setSeleccion('opt1');
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

  return (
    <div className="flex flex-col h-full w-full bg-surface">
      <div className="p-xl border-b border-outline-variant/10 bg-surface-container-low">
        <h1 className="font-display-lg text-primary text-3xl md:text-4xl">Compara tus Opciones</h1>
        <p className="text-on-surface-variant font-body-lg mt-xs">
          {loading ? 'Calculando rutas...' : mapSelection ? 'Hemos calculado alternativas desde tu ubicación a los museos seleccionados.' : 'Por favor selecciona un punto de inicio y museos en el mapa primero.'}
        </p>
      </div>

      <div className="flex-grow p-xl grid grid-cols-1 md:grid-cols-3 gap-lg max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-on-surface-variant">Calculando rutas de transporte...</p>
            </div>
          </div>
        ) : !mapSelection ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-on-surface-variant mb-4">No hay datos de selección del mapa</p>
              <button 
                onClick={() => navigate('/mapa')}
                className="bg-primary text-on-primary-fixed px-6 py-3 rounded-lg font-bold"
              >
                Ir al Mapa
              </button>
            </div>
          </div>
        ) : opcionesRuta.length === 0 ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-on-surface-variant mb-4">No se encontraron rutas disponibles</p>
              <button 
                onClick={() => navigate('/mapa')}
                className="bg-primary text-on-primary-fixed px-6 py-3 rounded-lg font-bold"
              >
                Volver al Mapa
              </button>
            </div>
          </div>
        ) : (
          opcionesRuta.map(opt => (
          <div 
            key={opt.id}
            onClick={() => setSeleccion(opt.id)}
            className={clsx(
              "glass-card rounded-2xl p-lg flex flex-col justify-between cursor-pointer transition-all border-2",
              seleccion === opt.id ? `${opt.color} optimal-glow shadow-xl -translate-y-2` : "border-transparent hover:border-outline-variant/30",
            )}
          >
            <div>
              <div className="flex justify-between items-start mb-md">
                <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center text-white", opt.recomendado ? "bg-primary" : "bg-surface-dim text-on-surface")}>
                    <MdDirectionsBus className="" />
                </div>
                {opt.recomendado && (
                  <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded border border-primary/20 ai-glow">
                    RECOMENDADO IA
                  </span>
                )}
              </div>
              
              <h3 className="font-headline-lg text-xl mb-xs">{opt.tipo}</h3>
              <div className="flex gap-sm mb-lg">
                <div className="flex items-center gap-xs font-bold text-secondary bg-secondary-container/30 px-sm py-xs rounded">
                    <MdSchedule className="text-[16px]" /> {opt.tiempo}
                </div>
                <div className="flex items-center gap-xs font-bold text-on-surface-variant bg-surface-container px-sm py-xs rounded">
                    <MdPayments className="text-[16px]" /> {opt.costo}
                </div>
              </div>

              <div className="flex flex-wrap gap-xs mb-md">
                {opt.etiquetas.map((et, i) => (
                  <span key={i} className="text-[11px] uppercase font-bold text-outline border border-outline-variant/50 px-2 py-1 rounded-full">
                    {et}
                  </span>
                ))}
              </div>
              
              <p className="text-body-sm text-on-surface-variant bg-surface-container-lowest p-sm rounded border border-outline-variant/20">
                {opt.detalles}
              </p>
            </div>

            <div className="mt-lg">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSeleccion(opt.id);
                  handleComenzar();
                }}
                className={clsx(
                  "w-full py-md rounded-xl font-bold transition-all",
                  seleccion === opt.id ? "bg-primary text-on-primary-fixed" : "bg-surface-variant text-on-surface-variant"
                )}
              >
                {seleccion === opt.id ? "Comenzar esta Ruta" : "Seleccionar"}
              </button>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
};

export default TarjetaAlternativa;
