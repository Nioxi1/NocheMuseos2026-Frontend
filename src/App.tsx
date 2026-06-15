import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import FormularioRestricciones from './components/FormularioRestricciones';
import TarjetaAlternativa from './components/TarjetaAlternativa';
import PanelTransporte from './components/PanelTransporte';
import PanelGuia from './components/PanelGuia';
import MapaReal from './components/MapaReal';
import { MdExplore, MdRoute, MdAutoAwesome, MdMap } from 'react-icons/md';

function App() {
  return (
    <BrowserRouter>
      <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
        {/* TopBar on mobile, hidden on desktop (or hybrid depending on layout) */}
        <div className="md:hidden">
          <TopBar />
        </div>
        
        {/* Sidebar on desktop, hidden on mobile */}
        <Sidebar />

        <main className="flex-1 overflow-y-auto relative flex flex-col h-screen">
          {/* TopBar on desktop */}
          <div className="hidden md:block">
            <TopBar />
          </div>
          
          <div className="flex-grow flex flex-col h-full relative">
            <Routes>
              <Route path="/" element={<Navigate to="/planificador" replace />} />
              <Route path="/planificador" element={<FormularioRestricciones />} />
              <Route path="/comparar" element={<TarjetaAlternativa />} />
              <Route path="/itinerario" element={<PanelTransporte />} />
              <Route path="/guia" element={<PanelGuia />} />
              <Route path="/mapa" element={<MapaReal />} />
            </Routes>
          </div>
        </main>

        {/* Bottom Nav for mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-around items-center py-base px-container-margin z-50">
          <a className="flex flex-col items-center gap-xs text-primary" href="/planificador">
            <MdExplore size={24} />
            <span className="text-[10px] font-bold">Explorar</span>
          </a>
          <a className="flex flex-col items-center gap-xs text-on-surface-variant" href="/comparar">
            <MdRoute size={24} />
            <span className="text-[10px] font-bold">Rutas</span>
          </a>
          <a className="flex flex-col items-center gap-xs text-on-surface-variant" href="/guia">
            <MdAutoAwesome size={24} />
            <span className="text-[10px] font-bold">IA Guía</span>
          </a>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;
