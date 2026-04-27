import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, CloudFog, MapPin, Loader2, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';

export default function WeatherWidget() {
  const { weatherCity } = useStore();
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  useEffect(() => {
    if (!weatherCity.trim()) {
      setWeather(null);
      setWeatherError(null);
      return;
    }

    const fetchWeather = async () => {
      setLoadingWeather(true);
      setWeatherError(null);
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCity)}&count=1&language=pt`
        );
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error('Cidade não encontrada');
        }

        const { latitude, longitude, name, admin1 } = geoData.results[0];

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
        );
        const weatherData = await weatherRes.json();

        if (!weatherData.current) {
          throw new Error('Sem dados de clima');
        }

        const forecast =
          weatherData.daily?.time.map((t, i) => ({
            date: t,
            code: weatherData.daily.weathercode[i],
            max: Math.round(weatherData.daily.temperature_2m_max[i]),
            min: Math.round(weatherData.daily.temperature_2m_min[i]),
            pop: weatherData.daily.precipitation_probability_max[i],
          })) || [];

        setWeather({
          temp: Math.round(weatherData.current.temperature_2m),
          code: weatherData.current.weather_code,
          feelsLike: Math.round(weatherData.current.apparent_temperature),
          humidity: weatherData.current.relative_humidity_2m,
          location: admin1 ? `${name}, ${admin1}` : name,
          forecast,
        });
      } catch (err) {
        setWeatherError(err.message);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [weatherCity]);

  const getWeatherIcon = (code, className = 'w-8 h-8') => {
    if (code === 0 || code === 1) return <Sun className={`text-yellow-500 ${className}`} />;
    if (code === 2 || code === 3) return <Cloud className={`text-gray-400 ${className}`} />;
    if (code >= 45 && code <= 48) return <CloudFog className={`text-gray-400 ${className}`} />;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
      return <CloudRain className={`text-blue-400 ${className}`} />;
    if (code >= 71 && code <= 77) return <CloudSnow className={`text-white ${className}`} />;
    if (code >= 95) return <CloudLightning className={`text-yellow-400 ${className}`} />;
    return <Cloud className={`text-gray-400 ${className}`} />;
  };

  if (!weatherCity.trim()) return <div className="hidden md:block w-full max-w-md"></div>;

  return (
    <div className="w-full max-w-md bg-card/80 backdrop-blur-md border border-border rounded-2xl p-5 flex flex-col justify-between group hover:border-accent/50 transition-colors h-[16.5rem] animate-fadeIn">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-medium text-text flex items-center gap-2 truncate">
          <MapPin size={16} className="text-muted flex-shrink-0" />
          <span className="truncate">{weather?.location || weatherCity}</span>
        </h2>
        {loadingWeather && <Loader2 size={16} className="animate-spin text-muted flex-shrink-0" />}
      </div>

      {weatherError ? (
        <div className="flex-1 flex items-center justify-center text-sm text-red-500 gap-2">
          <AlertCircle size={16} />
          {weatherError}
        </div>
      ) : weather ? (
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              {getWeatherIcon(weather.code, 'w-10 h-10')}
              <div className="text-3xl font-light text-text">{weather.temp}°C</div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="text-xs text-muted">
                Sensação <span className="text-text font-medium">{weather.feelsLike}°C</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mt-4 pt-4 border-t border-border/50">
            {weather.forecast.map((day, i) => {
              const dateObj = new Date(day.date + 'T12:00:00Z');
              const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center gap-1"
                  title={`${day.min}°C - ${day.max}°C`}
                >
                  <span className="text-[10px] text-muted uppercase font-medium">{dayName}</span>
                  {getWeatherIcon(day.code, 'w-5 h-5')}
                  <span className="text-xs font-medium text-text">{day.max}°</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted">Buscando...</div>
      )}
    </div>
  );
}
