import { useMemo } from 'react';
import { useAppStore } from '../store/appState';
import clsx from 'clsx';
import { MdPayments, MdSchedule, MdAutoAwesome, MdLocationOn } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const FormularioRestricciones = () => {
  const {
    presupuestoMax,
    setPresupuesto,
    tiempoDisponibleHoras,
    setTiempoDisponible,
    museosSeleccionados,
    puntoPartida,
    setPuntoPartida,
  } = useAppStore();
  const navigate = useNavigate();

  const costoTotal = useMemo(() => 
    museosSeleccionados.reduce((sum, m) => sum + m.precio, 0),
  [museosSeleccionados]);

  const tiempoTotal = useMemo(() => 
    museosSeleccionados.reduce((sum, m) => sum + m.tiempoEstimado, 0),
  [museosSeleccionados]);

  const getAIStatus = () => {
    if (presupuestoMax === 0) {
      return { msg: '"Por favor, establece un presupuesto máximo para tu recorrido cultural."', color: 'text-on-surface' };
    }
    
    if (presupuestoMax < 20) {
      return { msg: '"Tu presupuesto es bajo. Te sugiero priorizar transporte público y visitar museos económicos o gratuitos."', color: 'text-secondary font-semibold' };
    } else if (tiempoDisponibleHoras < 3) {
      return { msg: `"Con solo ${tiempoDisponibleHoras} horas, te recomiendo elegir 1 o 2 museos cercanos en el mapa para evitar contratiempos."`, color: 'text-on-tertiary-fixed-variant font-semibold' };
    } else {
      return { msg: '"¡Excelente configuración de límites! Ahora ve al mapa para seleccionar los museos que prefieras visitar dentro de estos parámetros."', color: 'text-secondary font-semibold' };
    }
  };

  const status = getAIStatus();

  const budgetPercent = useMemo(() => presupuestoMax ? Math.min((costoTotal / presupuestoMax) * 100, 100) : 0, [costoTotal, presupuestoMax]);
  const timePercent = useMemo(() => tiempoDisponibleHoras ? Math.min((tiempoTotal / tiempoDisponibleHoras) * 100, 100) : 0, [tiempoTotal, tiempoDisponibleHoras]);

  return (
    <div className="max-w-3xl mx-auto space-y-lg p-container-margin md:p-xl w-full flex flex-col justify-center min-h-[80vh]">
      <section className="space-y-xs text-center">
        <h1 className="font-display-lg text-display-lg text-primary text-3xl md:text-4xl font-bold">Planifica tu Experiencia</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto text-sm md:text-base">
          Ajusta tus preferencias de presupuesto y tiempo. En la siguiente pestaña "Mapa" podrás elegir qué recintos visitar dentro de estos límites.
        </p>
      </section>

      {/* Sliders Container (Centered Card) */}
      <div className="bg-surface-container-low p-lg rounded-2xl border border-secondary/10 shadow-lg space-y-lg max-w-2xl mx-auto w-full">
        {/* Presupuesto Slider */}
        <div className="space-y-md">
          <div className="flex justify-between items-center">
            <label className="font-title-md text-title-md text-secondary flex items-center gap-xs font-bold text-sm md:text-base">
              <MdPayments size={20} className="text-primary" /> Presupuesto Máx.
            </label>
            <span className="text-primary font-bold text-lg">Bs. {presupuestoMax}</span>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="0" max="200"
              value={presupuestoMax}
              onChange={(e) => setPresupuesto(Number(e.target.value))}
              className="flex-1 h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-primary"
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
              className="w-20 rounded border border-outline-variant p-2 text-center text-sm bg-surface-container-highest"
            />
          </div>
          <div className="flex justify-between text-on-surface-variant font-label-md text-xs">
            <span>Bs. 0</span>
            <span>Bs. 200</span>
          </div>
        </div>

        {/* Tiempo Disponible Slider */}
        <div className="space-y-md border-t border-outline-variant/10 pt-lg">
          <div className="flex justify-between items-center">
            <label className="font-title-md text-title-md text-secondary flex items-center gap-xs font-bold text-sm md:text-base">
              <MdSchedule size={20} className="text-primary" /> Tiempo Disponible
            </label>
            <span className="text-primary font-bold text-lg">{tiempoDisponibleHoras} hrs</span>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1" max="10" step="0.5"
              value={tiempoDisponibleHoras}
              onChange={(e) => setTiempoDisponible(Number(e.target.value))}
              className="flex-1 h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-primary"
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
              className="w-20 rounded border border-outline-variant p-2 text-center text-sm bg-surface-container-highest"
            />
          </div>
          <div className="flex justify-between text-on-surface-variant font-label-md text-xs">
            <span>1 hr</span>
            <span>10 hrs</span>
          </div>
        </div>

        {/* Perspectiva IA */}
        <div className="bg-surface-container-lowest p-md rounded-xl border-l-4 border-primary shadow-sm space-y-xs mt-lg">
          <div className="flex items-center gap-xs text-primary font-bold text-xs uppercase tracking-wider">
            <MdAutoAwesome className="text-sm animate-pulse" />
            PERSPECTIVA IA
          </div>
          <p className={clsx("text-body-sm italic text-xs md:text-sm leading-relaxed", status.color)}>{status.msg}</p>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="max-w-2xl mx-auto w-full flex flex-col md:flex-row gap-lg justify-between items-center bg-surface-container-high p-lg rounded-2xl border border-secondary/10 shadow-md">
        <div className="flex gap-lg w-full md:w-auto justify-around md:justify-start">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-label-md text-[10px] uppercase font-bold tracking-wider">TOTAL ESTIMADO</span>
            <span className={clsx("font-display-lg text-2xl font-bold mt-1", costoTotal > presupuestoMax ? "text-error" : "text-primary")}>
              Bs. {costoTotal}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-label-md text-[10px] uppercase font-bold tracking-wider">TIEMPO TOTAL</span>
            <span className={clsx("font-display-lg text-2xl font-bold mt-1", tiempoTotal > tiempoDisponibleHoras ? "text-error" : "text-primary")}>
              {tiempoTotal} hrs
            </span>
          </div>
        </div>

        <div className="w-full md:w-48 space-y-1">
          <div className="flex justify-between text-[11px] text-on-surface-variant">
            <span>Presupuesto usado</span>
            <span className="font-bold">{Math.round(budgetPercent)}%</span>
          </div>
          <div className="w-full bg-secondary/15 h-2 rounded-full overflow-hidden">
            <div className={clsx("h-full rounded-full transition-all", costoTotal > presupuestoMax ? "bg-error" : "bg-primary")} style={{ width: `${budgetPercent}%` }}></div>
          </div>
          <div className="flex justify-between text-[11px] text-on-surface-variant pt-1">
            <span>Tiempo usado</span>
            <span className="font-bold">{Math.round(timePercent)}%</span>
          </div>
          <div className="w-full bg-secondary/15 h-2 rounded-full overflow-hidden">
            <div className={clsx("h-full rounded-full transition-all", tiempoTotal > tiempoDisponibleHoras ? "bg-error" : "bg-primary")} style={{ width: `${timePercent}%` }}></div>
          </div>
        </div>

        <button 
          className="w-full md:w-auto px-xl py-md bg-primary hover:bg-primary-container text-on-primary-fixed rounded-xl font-bold flex items-center justify-center gap-base hover:shadow-lg active:scale-95 transition-all text-sm"
          onClick={() => {
            const { setModoPlanificacion, limpiarMuseos } = useAppStore.getState();
            limpiarMuseos();
            setModoPlanificacion(true);
            
            // Ensure a starting point exists before navigating to the map
            if (!puntoPartida) {
              setPuntoPartida({
                lat: -17.3935,
                lng: -66.1568,
                direccion: 'Plaza Principal, Cochabamba',
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
