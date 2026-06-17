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
        const response = await fetch('http://localhost:8000/api/museos');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setMuseos(data);
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
