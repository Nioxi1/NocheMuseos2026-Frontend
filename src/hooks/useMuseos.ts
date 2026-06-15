import { useState, useEffect } from 'react';
import type { Museo } from '../types';

// Mock data initially. Later this will fetch from the Python Backend
const mockMuseos: Museo[] = [
  {
    id: 'm1',
    nombre: 'Casona Santiváñez',
    categoria: 'Colonial',
    precio: 15,
    tiempoEstimado: 1.5,
    coordenadas: { lat: -17.3935, lng: -66.1568 },
    imagenUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS8MrqVi62TVkt-RmTzeJa4ly8Sfur7-3b9h3ojkHNrUa7SVuVVCp25RJM6x7zotnKA_iOJMXYI88rKHbHASNntKA77LiblEJu8be3Gp_o00Xie0nPjiDQdcuxbtzk7gmrr7D9r4-VQklS2JXTqfa4gSsgkk5ZVWYQzStk3bp7jpftY_O_Tn-8RSWPI9RSVfbn0IEtmYKCZkQIpAOzSS9CLupv2yIj3uWtat-TY2nKez6RaDR1S-SSdND-k3vr9JQTbq3FrdHM5OUy',
    descripcion: 'Hermosa casona de estilo colonial.',
    afluenciaActual: 'Baja'
  },
  {
    id: 'm2',
    nombre: 'Convento Santa Teresa',
    categoria: 'Religioso',
    precio: 25,
    tiempoEstimado: 2,
    coordenadas: { lat: -17.3912, lng: -66.1543 },
    imagenUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZu5C8Twt01KYQDdeLwPehN-9Og9Yw_xAswTwIXq-GxCrCvxkFDkje_u6j9BZoxSZRrFzQ1DQezu1rrLNdDe6CP5iYDiiMVtL4PMKlRP0i0JiS9Eg-p3Wn-CZrqiqqiCYIbGnmo3xUU1KOwrHye8mgu4ir5YURNhKYMX77dqoo5nPwAkS8jiLhBQeYRSZU5phEknh3pUn9qjUlUd4jBV2F9Jvh1EhWqp1Ore_6W1-QclLIQv3I-I9Npk1lB5UdvXgjksPpGbRirmqw',
    afluenciaActual: 'Media'
  },
  {
    id: 'm3',
    nombre: 'Museo Arqueológico UMSS',
    categoria: 'Historia',
    precio: 10,
    tiempoEstimado: 1,
    coordenadas: { lat: -17.3951, lng: -66.1520 },
    imagenUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPhwbLZKQiZJ80HmBiAfIbBMaVhiZVXMRDJw-uM7OkGWf-lkLoiCYrebUNysW4qeJfTYYnrPyndiefqF07RkFhb2jEazXTX7MJHJaRV_-kXwAMES0ngpixcXd_xtByZ-tXCGw8Y6pUYv7SLaThYL2xo3MxBjZ1cQh7yyYgGaSJ0BpnQkJFPoxSH6Vbk2pebWKQqpz1_DwAZrfOOuWydRh2e5_72aqfMmai3IsisER6EoG2L1DE2x4bhwVqRiHcolciJj6eV1wHlLFa',
    afluenciaActual: 'Alta'
  },
  {
    id: 'm4',
    nombre: 'Museo de Arte Contemporáneo',
    categoria: 'Contemporáneo',
    precio: 20,
    tiempoEstimado: 1.5,
    coordenadas: { lat: -17.3890, lng: -66.1580 },
    imagenUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCb2a7p3m34eOpXkC3V6_AeUCkXi8uJ4Z_7hZyLjifKwP_aBUsl2WgouLe2d-lfXQUIGNP1uvLBF8yXsJyF0Bo92goEGa9-YTMBYFgQ27HRtXNGncWe4Xt5ifZ_e2QjJKVSwvew4KEY9ieDAahJGGPSIa6iC0HM1a0aMmG6W_Cu3KYt4NIlFmL83haZQnaCT2pPLGXKwbSjqyWRoPYzOIIvuw7kQp7STxR3_Ha5QUI6etFX2QWFiJWWY1rWim1Y76zcya3qphX0jTUP',
    afluenciaActual: 'Baja'
  }
];

export const useMuseos = () => {
  const [museos, setMuseos] = useState<Museo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchMuseos = async () => {
      setLoading(true);
      try {
        // In the future: const response = await fetch('/api/museos');
        // setMuseos(await response.json());
        setTimeout(() => {
          setMuseos(mockMuseos);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching museos", error);
        setLoading(false);
      }
    };

    fetchMuseos();
  }, []);

  return { museos, loading };
};
