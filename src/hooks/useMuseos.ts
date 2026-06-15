import { useState, useEffect } from 'react';
import type { Museo } from '../types';
import { museosCochabamba } from '../data/museosCochabamba';

export const useMuseos = () => {
  const [museos, setMuseos] = useState<Museo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMuseos = async () => {
      setLoading(true);
      try {
        // En el futuro: const response = await fetch(`${API_BASE}/api/museos`);
        // setMuseos(await response.json());
        setMuseos(museosCochabamba);
      } catch (error) {
        console.error('Error fetching museos', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMuseos();
  }, []);

  return { museos, loading };
};
