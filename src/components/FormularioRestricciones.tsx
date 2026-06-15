import React, { useMemo } from 'react';
import { useAppStore } from '../store/appState';
import { useMuseos } from '../hooks/useMuseos';
import clsx from 'clsx';
import { MdPayments, MdSchedule, MdAutoAwesome, MdLocationOn } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import type { Museo } from '../types';

const FormularioRestricciones = () => {
  const {
    presupuestoMax,
    setPresupuesto,
    tiempoDisponibleHoras,
    setTiempoDisponible,
    museosSeleccionados,
    toggleMuseo,
    puntoPartida,
    setPuntoPartida,
  } = useAppStore();
  const navigate = useNavigate();
  
  const { museos, loading } = useMuseos();

  const costoTotal = useMemo(() => 
    museosSeleccionados.reduce((sum, m) => sum + m.precio, 0),
  [museosSeleccionados]);

  const tiempoTotal = useMemo(() => 
    museosSeleccionados.reduce((sum, m) => sum + m.tiempoEstimado, 0),
  [museosSeleccionados]);

  const getAIStatus = () => {
    if (museosSeleccionados.length === 0) {
      return { msg: '"Selecciona museos para que pueda analizar tu itinerario."', color: 'text-on-surface' };
    }
    const budgetExceeded = costoTotal > presupuestoMax;
    const timeExceeded = tiempoTotal > tiempoDisponibleHoras;

    if (budgetExceeded && timeExceeded) {
      return { msg: '"Tu selección supera tanto el presupuesto como el tiempo. Recomiendo eliminar un museo o aumentar tus límites."', color: 'text-error font-semibold' };
    } else if (budgetExceeded) {
      return { msg: `"El costo total (Bs. ${costoTotal}) excede tu presupuesto de Bs. ${presupuestoMax}."`, color: 'text-error font-semibold' };
    } else if (timeExceeded) {
      return { msg: `"Necesitas ${tiempoTotal} horas, pero solo tienes ${tiempoDisponibleHoras}. Tu ruta podría sentirse apresurada."`, color: 'text-on-tertiary-fixed-variant font-semibold' };
    } else {
      return { msg: '"¡Excelente! Tu selección encaja perfectamente en tu agenda y presupuesto. Estás listo para ir."', color: 'text-secondary font-semibold' };
    }
  };

  const status = getAIStatus();

  const budgetPercent = useMemo(() => presupuestoMax ? Math.min((costoTotal / presupuestoMax) * 100, 100) : 0, [costoTotal, presupuestoMax]);
  const timePercent = useMemo(() => tiempoDisponibleHoras ? Math.min((tiempoTotal / tiempoDisponibleHoras) * 100, 100) : 0, [tiempoTotal, tiempoDisponibleHoras]);

  return (
    <div className="max-w-6xl mx-auto space-y-lg p-container-margin md:p-xl w-full">
      <section className="space-y-xs">
        <h1 className="font-display-lg text-display-lg text-primary">Configura tu Experiencia</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Ajusta tus preferencias y selecciona los recintos que deseas visitar. Nuestra IA optimizará tu tiempo y presupuesto.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Sliders */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          <div className="bg-surface-container-low p-lg rounded-xl border border-secondary/15 shadow-sm space-y-md">
            <div className="flex justify-between items-center">
              <label className="font-title-md text-title-md text-secondary flex items-center gap-xs">
                <MdPayments className="text-on-surface-variant" /> Presupuesto Máx.
              </label>
              <span className="text-primary font-bold text-lg">Bs. {presupuestoMax}</span>
            </div>
            <div className="flex items-center space-x-2">
  <input
    type="range"
    min="0" max="200"
    value={presupuestoMax}
    onChange={(e) => setPresupuesto(Number(e.target.value))}
    className="flex-1 h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-secondary"
  />
  <input
    type="number"
    min={0}
    max={200}
    value={presupuestoMax}
    onChange={(e) => {
      const val = Number(e.target.value);
      setPresupuesto(val < 0 ? 0 : val > 200 ? 200 : val);
    }}
    className="w-20 rounded border border-gray-300 p-1"
  />
</div>
            <div className="flex justify-between text-on-surface-variant font-label-md">
              <span>Bs. 0</span>
              <span>Bs. 200</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-lg rounded-xl border border-secondary/15 shadow-sm space-y-md">
            <div className="flex justify-between items-center">
              <label className="font-title-md text-title-md text-secondary flex items-center gap-xs">
                <MdSchedule className="text-on-surface-variant" /> Tiempo Disponible
              </label>
              <span className="text-primary font-bold text-lg">{tiempoDisponibleHoras} hrs</span>
            </div>
               <div className="flex items-center space-x-2">
                 <input
                   type="range"
                   min="1" max="10" step="0.5"
                   value={tiempoDisponibleHoras}
                   onChange={(e) => setTiempoDisponible(Number(e.target.value))}
                   className="flex-1 h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-secondary"
                 />
                 <input
                   type="number"
                   min={1}
                   max={10}
                   step={0.5}
                   value={tiempoDisponibleHoras}
                   onChange={(e) => {
                     const val = Number(e.target.value);
                     setTiempoDisponible(val < 1 ? 1 : val > 10 ? 10 : val);
                   }}
                   className="w-20 rounded border border-gray-300 p-1"
                 />
               </div>
            <div className="flex justify-between text-on-surface-variant font-label-md">
              <span>1 hr</span>
              <span>10 hrs</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-xl border-l-4 border-primary-container ai-glow space-y-xs">
            <div className="flex items-center gap-xs text-primary font-bold text-sm">
              <MdAutoAwesome className="text-sm" />
              PERSPECTIVA IA
            </div>
            <p className={clsx("text-body-sm italic", status.color)}>{status.msg}</p>
          </div>
        </div>

        {/* Grid Museos */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">Cargando museos...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {museos.map(museo => {
                const isSelected = museosSeleccionados.some(m => m.id === museo.id);
                // Si la selección de este museo hace que supere el prespuesto (y no estaba seleccionado)
                const exceedsIfSelected = !isSelected && ((costoTotal + museo.precio > presupuestoMax) || (tiempoTotal + museo.tiempoEstimado > tiempoDisponibleHoras));

                return (
                  <div 
                    key={museo.id}
                    onClick={() => toggleMuseo(museo)}
                    className={clsx(
                      "group cursor-pointer bg-surface-container-low border rounded-xl overflow-hidden transition-all hover:shadow-md relative",
                      isSelected 
                        ? "border-[#6c5e00] shadow-[inset_0_0_0_1px_#ffe330]" 
                        : "border-secondary/15",
                      exceedsIfSelected && "opacity-60 grayscale-[50%]"
                    )}
                  >
                    <div className="h-32 w-full relative overflow-hidden">
                      <img 
                        src={museo.imagenUrl} 
                        alt={museo.nombre} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                      />
                      <div className="absolute top-2 right-2 bg-secondary-container/90 px-xs py-1 rounded text-[10px] font-bold text-on-secondary-container uppercase">
                        {museo.categoria}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-primary text-on-primary-fixed p-1 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </div>
                      )}
                    </div>
                    <div className="p-md space-y-xs">
                      <h3 className="font-title-md text-title-md text-on-surface">{museo.nombre}</h3>
                      <div className="flex flex-wrap gap-xs">
                        <div className="flex items-center gap-xs px-base py-xs bg-secondary/10 rounded-full text-secondary text-xs font-bold">
                          <MdPayments className="text-[14px]" /> Bs. {museo.precio}
                        </div>
                        <div className="flex items-center gap-xs px-base py-xs bg-secondary/10 rounded-full text-secondary text-xs font-bold">
                          <span className="material-symbols-outlined text-[14px]">timer</span> {museo.tiempoEstimado} hrs
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-xl flex flex-col md:flex-row justify-between items-center bg-surface-container-high p-lg rounded-2xl border border-secondary/20">
        <div className="flex gap-lg mb-md md:mb-0">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-label-md">TOTAL ESTIMADO</span>
            <span className={clsx("font-display-lg text-headline-lg", costoTotal > presupuestoMax ? "text-error" : "text-primary")}>
              Bs. {costoTotal}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-label-md">TIEMPO TOTAL</span>
            <span className={clsx("font-display-lg text-headline-lg", tiempoTotal > tiempoDisponibleHoras ? "text-error" : "text-primary")}>
              {tiempoTotal} hrs
            </span>
          </div>
        </div>
        <div className="mt-2 space-y-2">
          <div className="text-sm text-on-surface-variant">Presupuesto usado</div>
          <div className="w-full bg-secondary/20 h-2 rounded">
            <div className="bg-primary h-2 rounded" style={{ width: `${budgetPercent}%` }}></div>
          </div>
          <div className="text-sm text-on-surface-variant">Tiempo usado</div>
          <div className="w-full bg-secondary/20 h-2 rounded">
            <div className="bg-primary h-2 rounded" style={{ width: `${timePercent}%` }}></div>
          </div>
        </div>
        <button 
          className="w-full md:w-auto px-xl py-md bg-primary text-on-primary-fixed rounded-xl font-bold flex items-center justify-center gap-base hover:shadow-lg active:scale-95 transition-all"
          onClick={() => {
            // Ensure a starting point exists before navigating to the map
            if (!puntoPartida) {
              setPuntoPartida({
                lat: -17.8045,
                lng: -63.1560,
                direccion: 'Ubicación predeterminada',
              });
            }
            navigate('/mapa');
          }}
        >
          Ir al Mapa
          <MdLocationOn className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default FormularioRestricciones;
