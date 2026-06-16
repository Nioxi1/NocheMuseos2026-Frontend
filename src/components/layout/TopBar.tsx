import { MdNotifications, MdSettings, MdLocationOn } from 'react-icons/md';

const TopBar = () => {
  return (
    <header className="w-full sticky top-0 bg-surface-container shadow-sm z-30 flex justify-between items-center px-container-margin py-sm md:py-base max-w-full mx-auto transition-all duration-200">
      <div className="flex items-center gap-md md:hidden">
        <span className="font-headline-lg-mobile font-bold text-primary">MuseitoGO</span>
      </div>

      {/* Desktop Search / Header context */}
      <div className="hidden md:flex flex-1 items-center px-md">
        <div className="bg-surface-container-highest px-md py-xs rounded-full flex items-center gap-xs">
          <MdLocationOn className="text-primary" />
          <span className="font-label-md text-label-md">Cochabamba, Bolivia</span>
        </div>
      </div>

      <nav className="hidden lg:flex items-center gap-lg px-xl">
        <a className="text-primary border-b-2 border-primary pb-1 font-body-lg text-body-lg" href="#">Explorar</a>
        <a className="text-on-surface-variant hover:text-primary transition-colors font-body-lg text-body-lg" href="#">Mis Rutas</a>
        <a className="text-on-surface-variant hover:text-primary transition-colors font-body-lg text-body-lg" href="#">Comunidad</a>
      </nav>

      <div className="flex items-center gap-sm md:gap-md">
        <button className="p-xs rounded-full transition-all" title="Notifications">
          <MdNotifications className="text-on-surface-variant hover:bg-surface-container-high" />
        </button>
        <button className="p-xs rounded-full transition-all" title="Settings">
          <MdSettings className="text-on-surface-variant hover:bg-surface-container-high" />
        </button>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-outline-variant/30 shrink-0">
          <img
            alt="Avatar de usuario"
            className="w-full h-full object-cover"
            src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=f0eee3"
          />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
