import type { Museo } from '../types';

/** Imagen genérica para espacios culturales sin foto propia en el catálogo. */
const IMG_COLONIAL =
  'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80';
const IMG_HISTORIA =
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80';
const IMG_ARTE =
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80';
const IMG_RELIGIOSO =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80';
const IMG_CONTEMP =
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80';

const HORARIO_NOCHE = { horarioApertura: '16:00', horarioCierre: '22:00' };

/**
 * Museos y espacios culturales de Cochabamba participantes en la Noche de Museos.
 * Coordenadas verificadas con OpenStreetMap / Nominatim (2026).
 * Las marcadas como estimadas se basan en la dirección oficial publicada por el INIAM-UMSS.
 */
export const museosCochabamba: Museo[] = [
  // —— Ruta peatonal (centro histórico) ——
  {
    id: 'cb-01',
    nombre: 'Convento Museo Santa Teresa',
    categoria: 'Religioso',
    precio: 0,
    tiempoEstimado: 1.5,
    coordenadas: { lat: -17.3897971, lng: -66.1580475 },
    imagenUrl: IMG_RELIGIOSO,
    descripcion:
      'Convento carmelita del siglo XVIII con arte sacro, claustros y colección museográfica en el corazón del centro histórico.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-02',
    nombre: 'Museo Casa Martín Cárdenas Hermosa',
    categoria: 'Arte',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3927429, lng: -66.1606794 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Casa museo dedicada al pintor cochabambino Martín Cárdenas Hermosa, con obras y objetos de su legado artístico.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-03',
    nombre: 'Casona Santiváñez',
    categoria: 'Colonial',
    precio: 0,
    tiempoEstimado: 1.5,
    coordenadas: { lat: -17.3944254, lng: -66.1591633 },
    imagenUrl: IMG_COLONIAL,
    descripcion:
      'Casona colonial de finales del siglo XIX, hoy espacio cultural con salas de exposición y patrimonio arquitectónico.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-04',
    nombre: 'Iglesia de la Compañía de Jesús',
    categoria: 'Religioso',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3930303, lng: -66.1578378 },
    imagenUrl: IMG_RELIGIOSO,
    descripcion:
      'Templo jesuita del siglo XVII (Parroquia San Ignacio de Loyola), referente barroco cochabambino en la plaza principal.',
    afluenciaActual: 'Alta',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-05',
    nombre: 'Museo Arqueológico UMSS (INIAM)',
    categoria: 'Historia',
    precio: 0,
    tiempoEstimado: 1.5,
    coordenadas: { lat: -17.3953445, lng: -66.1572748 },
    imagenUrl: IMG_HISTORIA,
    descripcion:
      'Instituto de Investigaciones Antropológicas con colección arqueológica de los valles y regiones de Bolivia.',
    afluenciaActual: 'Alta',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-06',
    nombre: 'Casa del Arquitecto',
    categoria: 'Arte',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3967116, lng: -66.1593744 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Espacio patrimonial dedicado a la arquitectura cochabambina, con exposiciones sobre diseño urbano y edificios emblemáticos.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-07',
    nombre: 'Casona del Banco Solidario (BancoSol)',
    categoria: 'Colonial',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3976328, lng: -66.1552448 },
    imagenUrl: IMG_COLONIAL,
    descripcion:
      'Casona histórica sede de BancoSol en calle Esteban Arze, abierta como espacio cultural durante la Noche de Museos.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-08',
    nombre: 'Casa Departamental de las Culturas',
    categoria: 'Otro',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3930265, lng: -66.1571642 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Edificio patrimonial en la Plaza 14 de Septiembre que alberga actividades y muestras de las culturas del departamento.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-09',
    nombre: 'Salón de Exposiciones Gíldaro Antezana',
    categoria: 'Arte',
    precio: 0,
    tiempoEstimado: 0.75,
    coordenadas: { lat: -17.3928902, lng: -66.1566054 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Salón de exposiciones en la Plaza 14 de Septiembre, escenario de muestras plásticas y artes visuales locales.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-10',
    nombre: 'Casona UNITEPC – Campus Colonial',
    categoria: 'Colonial',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3928523, lng: -66.1561268 },
    imagenUrl: IMG_COLONIAL,
    descripcion:
      'Casona colonial de la Universidad Técnica Privada Cosmos (UNITEPC) en calle Bolívar, con valor arquitectónico e histórico.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-11',
    nombre: 'Salón de Exposiciones ABAP-CBBA',
    categoria: 'Arte',
    precio: 0,
    tiempoEstimado: 0.75,
    coordenadas: { lat: -17.3916, lng: -66.1564 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Sede de la Asociación Boliviana de Artistas Plásticos en Cochabamba, con exposiciones de artistas locales.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-12',
    nombre: 'Salón Mario Unzueta – Casa de la Cultura',
    categoria: 'Arte',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3919123, lng: -66.1558438 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Salón de exposiciones dentro de la Casa de la Cultura Raúl Otero Reiche, punto de partida de las rutas móviles.',
    afluenciaActual: 'Alta',
    ...HORARIO_NOCHE,
  },

  // —— Ruta móvil ——
  {
    id: 'cb-13',
    nombre: 'Museo de Historia de la Medicina "Francisco de Viedma"',
    categoria: 'Historia',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3874098, lng: -66.1503671 },
    imagenUrl: IMG_HISTORIA,
    descripcion:
      'Museo que recorre la evolución de la medicina en Bolivia, desde prácticas prehispánicas hasta la era moderna.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-14',
    nombre: 'Museo de Historia Natural "Alcide d\'Orbigny"',
    categoria: 'Historia',
    precio: 0,
    tiempoEstimado: 1.5,
    coordenadas: { lat: -17.3736794, lng: -66.1531819 },
    imagenUrl: IMG_HISTORIA,
    descripcion:
      'Colección de fauna, flora y fósiles bolivianos junto al Centro Simón I. Patiño, en el barrio Recoleta.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-15',
    nombre: 'Palacio Portales – Fundación Simón I. Patiño',
    categoria: 'Colonial',
    precio: 0,
    tiempoEstimado: 2,
    coordenadas: { lat: -17.3747986, lng: -66.1530584 },
    imagenUrl: IMG_COLONIAL,
    descripcion:
      'Residencia de lujo del siglo XX del magnate Simón I. Patiño, con jardines, salones y mobiliario de época.',
    afluenciaActual: 'Alta',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-16',
    nombre: 'Casona de Mayorazgo',
    categoria: 'Colonial',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.365267, lng: -66.175158 },
    imagenUrl: IMG_COLONIAL,
    descripcion:
      'Casona histórica del barrio Mayorazgo, espacio patrimonial con arquitectura tradicional cochabambina.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-17',
    nombre: 'Centro Pedagógico y Cultural "Juan Wallparrimachi"',
    categoria: 'Otro',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3890347, lng: -66.1871696 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Centro cultural en la zona de Pardo Rancho dedicado a la promoción de las artes y saberes originarios.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-18',
    nombre: 'Fábrica de Instrumentos Musicales Gamboa',
    categoria: 'Otro',
    precio: 0,
    tiempoEstimado: 0.75,
    coordenadas: { lat: -17.3984485, lng: -66.1662939 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Taller y fábrica artesanal de instrumentos musicales tradicionales en avenida Manco Kapac.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-19',
    nombre: 'Proyecto mARTadero',
    categoria: 'Contemporáneo',
    precio: 0,
    tiempoEstimado: 1.5,
    coordenadas: { lat: -17.4000982, lng: -66.1657544 },
    imagenUrl: IMG_CONTEMP,
    descripcion:
      'Centro cultural independiente con arte contemporáneo, teatro, danza y gastronomía en la ex-Fábrica CSOA.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-20',
    nombre: 'Museo de la Reserva Moral y Estratégica de Bolivia (7.ª División)',
    categoria: 'Historia',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3993, lng: -66.1556 },
    imagenUrl: IMG_HISTORIA,
    descripcion:
      'Museo militar con historia de la Reserva Moral y Estratégica de Bolivia, en el cuartel de la 7.ª División del Ejército.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-21',
    nombre: 'Museo Mariscal Andrés de Santa Cruz',
    categoria: 'Historia',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3948, lng: -66.1575 },
    imagenUrl: IMG_HISTORIA,
    descripcion:
      'Museo dedicado al Mariscal Andrés de Santa Cruz, prócer de la independencia, en calle Calama del centro histórico.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-22',
    nombre: 'Museo Esteban Arze – CITE',
    categoria: 'Historia',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3977092, lng: -66.1555437 },
    imagenUrl: IMG_HISTORIA,
    descripcion:
      'Centro de Innovación y Transferencia Empresarial (CITE) con museo interactivo sobre microfinanzas y emprendimiento.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-23',
    nombre: 'Museo de Arte Chinchiri',
    categoria: 'Arte',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3845, lng: -66.254 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Museo de arte en Quillacollo (urb. Carlos Peña, km 11 de la Av. Blanco Galindo) con obras de artistas regionales.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },

  // —— Sitios adicionales de la edición 2026 ——
  {
    id: 'cb-24',
    nombre: 'Casa Museo Scarlet',
    categoria: 'Arte',
    precio: 0,
    tiempoEstimado: 1.5,
    coordenadas: { lat: -17.4021875, lng: -66.1917497 },
    imagenUrl: IMG_ARTE,
    descripcion:
      'Galería privada con más de 300 obras pictóricas distribuidas en 10 salas, en calle Luis Agustín Cauchy.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-25',
    nombre: 'Museo Histórico Hernán Cámara Verduguez',
    categoria: 'Historia',
    precio: 0,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3882143, lng: -66.2407812 },
    imagenUrl: IMG_HISTORIA,
    descripcion:
      'Museo del Ejército en Colcapirhua con historia militar boliviana y colección de objetos históricos.',
    afluenciaActual: 'Baja',
    ...HORARIO_NOCHE,
  },
  {
    id: 'cb-26',
    nombre: 'Museo de Arte Contemporáneo (MAC)',
    categoria: 'Contemporáneo',
    precio: 0,
    tiempoEstimado: 1.5,
    coordenadas: { lat: -17.3636366, lng: -66.2059645 },
    imagenUrl: IMG_CONTEMP,
    descripcion:
      'Espacio de arte contemporáneo en Colcapirhua con exposiciones de artistas nacionales e internacionales.',
    afluenciaActual: 'Media',
    ...HORARIO_NOCHE,
  },
];
