import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';

export function useFutebol() {
  const { futebolApiKey } = useStore();
  const [noticias, setNoticias] = useState([]);
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState({ noticias: true, jogos: false });
  const [error, setError] = useState({ noticias: null, jogos: null });

  const fetchNoticias = useCallback(async () => {
    setLoading((prev) => ({ ...prev, noticias: true }));
    setError((prev) => ({ ...prev, noticias: null }));
    try {
      const response = await fetch('/.netlify/functions/futebol-noticias');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao buscar notícias de futebol');
      }
      const data = await response.json();
      setNoticias(data.itens || []);
    } catch (err) {
      setError((prev) => ({ ...prev, noticias: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, noticias: false }));
    }
  }, []);

  const fetchJogos = useCallback(async (force = false) => {
    const state = useStore.getState();
    const apiKey = state.futebolApiKey;
    const cache = state.futebolJogosCache;
    const cacheTime = state.futebolJogosCacheTime;

    if (!apiKey) {
      setError((prev) => ({ ...prev, jogos: 'API Key de Futebol não configurada.' }));
      setLoading((prev) => ({ ...prev, jogos: false }));
      return;
    }

    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    if (!force && cache && cache.length > 0 && now - cacheTime < ONE_HOUR) {
      setJogos(cache);
      return;
    }

    setLoading((prev) => ({ ...prev, jogos: true }));
    setError((prev) => ({ ...prev, jogos: null }));
    try {
      const response = await fetch('/.netlify/functions/futebol-jogos', {
        headers: { 'x-api-key': apiKey },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao buscar jogos');

      setJogos(data.jogos || []);
      state.setFutebolJogosCache(data.jogos || []);
    } catch (err) {
      setError((prev) => ({ ...prev, jogos: err.message }));
      if (cache && cache.length > 0) {
        setJogos(cache);
      }
    } finally {
      setLoading((prev) => ({ ...prev, jogos: false }));
    }
  }, []);

  useEffect(() => {
    fetchNoticias();
    fetchJogos(false);
  }, [fetchNoticias, fetchJogos]);

  return { noticias, jogos, loading, error, fetchNoticias, fetchJogos };
}
