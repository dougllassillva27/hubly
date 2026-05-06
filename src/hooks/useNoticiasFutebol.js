import { useState, useEffect, useCallback } from 'react';

export function useNoticiasFutebol() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNoticias = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/.netlify/functions/futebol-noticias');

      if (!response.ok) throw new Error('Falha ao buscar notícias');

      const data = await response.json();

      // Ordenação: mais recente primeiro
      const sorted = (data.itens || []).sort((a, b) => {
        return new Date(b.dataPublicacao || 0) - new Date(a.dataPublicacao || 0);
      });

      setNoticias(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNoticias();
  }, [fetchNoticias]);

  return { noticias, loading, error, fetchNoticias };
}
