import React, { useState } from 'react';
import clsx from 'clsx';

const PanelGuia = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const museosRuta = [
    { id: 'm1', nombre: 'Punto de Partida', estado: 'completado', tiempo: '18:00' },
    { id: 'm2', nombre: 'Museo Arqueológico', estado: 'completado', tiempo: '18:20' },
    { id: 'm3', nombre: 'Casona Santiváñez', estado: 'activo', tiempo: 'En Camino' },
    { id: 'm4', nombre: 'Convento Santa Teresa', estado: 'pendiente', tiempo: 'Aprox. 20:30' }
  ];

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-surface">
      
      {/* Sidebar/Overlay izquierdo (Timeline) */}
      <aside className="absolute left-0 top-0 bottom-0 w-80 md:w-96 bg-surface-container-low/95 backdrop-blur-md border-r border-outline-variant/15 flex flex-col z-20 shadow-xl overflow-y-auto">
        <div className="p-lg bg-surface-container-low sticky top-0 z-10 border-b border-outline-variant/10">
          <div className="flex items-center gap-sm mb-xs">
            <span className="material-symbols-outlined text-secondary ai-glow">navigation</span>
            <span className="font-label-md text-secondary font-bold">EN RUTA</span>
          </div>
          <h1 className="font-headline-lg-mobile text-primary font-bold">Hacia Casona Santiváñez</h1>
          <p className="text-body-lg text-on-surface-variant font-medium mt-1">Llegada estimada en 12 min</p>
        </div>

        <div className="p-lg flex-grow relative">
          <div className="absolute left-11 top-lg bottom-lg w-1 bg-outline-variant/30 rounded-full"></div>

          <div className="space-y-xl relative z-10">
            {museosRuta.map((paso, index) => {
              const isCompletado = paso.estado === 'completado';
              const isActivo = paso.estado === 'activo';
              return (
                <div key={paso.id} className="flex gap-md group">
                  <div className="flex flex-col items-center">
                    <div className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center border-4 shadow-sm z-10 transition-all",
                      isCompletado ? "bg-secondary text-white border-secondary-container" :
                      isActivo ? "bg-primary text-on-primary-fixed border-primary-container ai-glow scale-110" :
                      "bg-surface-container-highest text-on-surface-variant border-surface"
                    )}>
                      {isCompletado ? (
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      ) : isActivo ? (
                        <span className="material-symbols-outlined text-[18px]">museum</span>
                      ) : (
                        <span className="font-label-md font-bold">{index + 1}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className={clsx(
                      "font-title-md text-sm",
                      isCompletado ? "text-on-surface-variant line-through opacity-70" :
                      isActivo ? "text-primary font-bold" :
                      "text-on-surface"
                    )}>
                      {paso.nombre}
                    </h3>
                    <span className={clsx(
                      "text-label-md",
                      isActivo ? "text-secondary font-bold" : "text-outline"
                    )}>
                      {paso.tiempo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-lg bg-surface-container-low border-t border-outline-variant/10 sticky bottom-0 space-y-md">
          <button className="w-full py-md rounded-xl font-bold border-2 border-primary text-primary hover:bg-primary-container/20 transition-colors flex items-center justify-center gap-xs">
            <span className="material-symbols-outlined">qr_code_2</span>
            Mis Entradas (Bs. 15)
          </button>
        </div>
      </aside>

      {/* Mapa Central */}
      <section className="flex-grow relative map-container overflow-hidden bg-surface-container-lowest">
        <img 
          className="w-full h-full object-cover opacity-60 pointer-events-none" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV2ogOqwwnDH5kuz8tR039kaLO87UMZi8zjHHQR7gqwusb_xWCJYuka2u7YSRK_JyxEioFTVGJfh0lRXLe8DIP8myLVzO1U96k1LE25mS888MLwDjpdruNMXQzYdfdRI_ls5pvajdfLgFnXKK-8ppINMQrAEfmPdExxMlDx4oM7Ysn76BnNVKXK6DDfn758pOdaSTizbdR8Bp--rNHPIwraZfO1uxYaA7769v2WAYbXX7nbeIMDilKPIAxz7siSjbKeFsX7a4kqgTz" 
          alt="Map Background"
        />

        {/* Ruta Simulada (SVG Line) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          <path d="M 400 300 Q 500 200 600 250" fill="none" stroke="#eed202" strokeWidth="6" className="opacity-80 shadow-xl" />
        </svg>

        {/* User Location Marker */}
        <div className="absolute z-30 transition-all" style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}>
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center ai-glow relative">
            <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-md absolute"></div>
            {/* Cone of vision */}
            <svg className="absolute w-32 h-32 -rotate-45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 50 L20 0 A 50 50 0 0 1 80 0 Z" fill="url(#grad1)" />
              <defs>
                <radialGradient id="grad1" cx="50%" cy="100%" r="100%">
                  <stop offset="0%" stopColor="#eed202" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#eed202" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Destination Marker (Interactive) */}
        <div 
          onClick={() => setModalOpen(true)}
          className="absolute z-20 cursor-pointer group" 
          style={{ left: '60%', top: '50%', transform: 'translate(-50%, -100%)' }}
        >
          <div className="relative flex flex-col items-center">
            <div className="bg-white px-3 py-1 rounded-full shadow-lg font-bold text-xs mb-1 border border-outline-variant/30 text-on-surface whitespace-nowrap group-hover:-translate-y-1 transition-transform">
              Casona Santiváñez
            </div>
            <div className="w-10 h-10 bg-secondary rounded-full border-4 border-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-[18px]">museum</span>
            </div>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="absolute bottom-lg right-lg flex flex-col gap-sm z-10">
          <button className="w-14 h-14 bg-primary text-on-primary-fixed rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform border-2 border-primary-container">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
          </button>
        </div>
      </section>

      {/* Modal / Dialog info de Museo */}
      {modalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-48 relative shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS8MrqVi62TVkt-RmTzeJa4ly8Sfur7-3b9h3ojkHNrUa7SVuVVCp25RJM6x7zotnKA_iOJMXYI88rKHbHASNntKA77LiblEJu8be3Gp_o00Xie0nPjiDQdcuxbtzk7gmrr7D9r4-VQklS2JXTqfa4gSsgkk5ZVWYQzStk3bp7jpftY_O_Tn-8RSWPI9RSVfbn0IEtmYKCZkQIpAOzSS9CLupv2yIj3uWtat-TY2nKez6RaDR1S-SSdND-k3vr9JQTbq3FrdHM5OUy" 
                alt="Casona" 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute top-md right-md w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-lg overflow-y-auto custom-scroll">
              <div className="flex justify-between items-start mb-sm">
                <div>
                  <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 inline-block">Colonial</span>
                  <h2 className="font-headline-lg-mobile text-primary font-bold">Casona Santiváñez</h2>
                </div>
              </div>

              <div className="bg-surface-container p-md rounded-xl mb-md border border-outline-variant/10">
                <div className="flex justify-between items-center mb-xs">
                  <span className="font-label-md text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">group</span> Afluencia Actual
                  </span>
                  <span className="text-xs font-bold text-secondary">Baja (Ideal)</span>
                </div>
                <div className="w-full h-2 bg-outline-variant/30 rounded-full overflow-hidden">
                  <div className="w-1/4 h-full bg-secondary rounded-full"></div>
                </div>
              </div>

              <p className="text-body-sm text-on-surface-variant mb-md">
                Hermosa infraestructura de estilo ecléctico, que perteneció a una de las familias más acaudaladas de Cochabamba en el siglo XIX.
              </p>

              <div className="flex justify-between items-center py-sm border-t border-outline-variant/10">
                <span className="text-label-md text-on-surface-variant">Próxima Actividad</span>
                <span className="text-body-sm text-on-surface font-bold text-right">Guía Histórica<br/><span className="text-xs font-normal">19:00 hrs</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PanelGuia;
