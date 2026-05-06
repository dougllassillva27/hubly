import { useState, useEffect } from 'react';
import useStore from '../store/useStore';

export function useJogosHoje() {
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const futebolCampeonatos = useStore((state) => state.futebolCampeonatos);

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (futebolCampeonatos && futebolCampeonatos.length > 0) {
          params.append('campeonatos', futebolCampeonatos.join(','));
        }
        const response = await fetch(`/.netlify/functions/futebol-jogos?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Falha ao buscar jogos');
        }

        const data = await response.json();

        // Ordenação estritamente cronológica
        const ordenados = (data.jogos || []).sort((a, b) => {
          return a.horario.localeCompare(b.horario);
        });

        setJogos(ordenados);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJogos();
  }, [futebolCampeonatos]);

  return { jogos, loading, error };
}
