import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { MdRoute, MdCompareArrows, MdExplore, MdDirectionsBus, MdAdd, MdSettings, MdLogout } from 'react-icons/md';

const navItems = [
  { path: '/planificador', icon: <MdRoute />, label: 'Planificador' },
  { path: '/comparar', icon: <MdCompareArrows />, label: 'Comparar Rutas' },
  { path: '/mapa', icon: <MdExplore />, label: 'Mapa' },
  { path: '/itinerario', icon: <MdDirectionsBus />, label: 'Rutas' },
];

const Sidebar = () => {
  return (
    <aside className="hidden md:flex h-screen w-64 lg:w-72 left-0 sticky flex-col bg-surface-container-low dark:bg-surface-container-lowest border-r border-outline-variant/15 p-md gap-base z-40 shrink-0">
      <div className="flex flex-col gap-xs mb-lg">
        <h1 className="font-headline-lg-mobile text-primary font-bold">MuseitoGO</h1>
        <p className="font-label-md text-secondary">Ruta Cultural IA</p>
      </div>

      <nav className="flex flex-col gap-xs flex-grow">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-sm px-md py-sm rounded-lg transition-all active:scale-95",
              isActive
                ? "bg-secondary-container text-on-secondary-container font-bold"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            {item.icon}
            <span className="font-label-md text-label-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="flex flex-col gap-xs border-t border-outline-variant/10 pt-md">
        <a href="#" className="flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high px-md py-sm rounded-lg transition-colors">
          <MdSettings />
          <span className="font-label-md text-label-md">Ajustes</span>
        </a>
        <a href="#" className="flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high px-md py-sm rounded-lg transition-colors">
          <MdLogout />
          <span className="font-label-md text-label-md">Cerrar Sesión</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
