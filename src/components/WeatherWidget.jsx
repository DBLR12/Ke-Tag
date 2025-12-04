import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, Droplets, Wind, ThermometerSun, MapPin, Sun, CloudRain, CloudLightning, CloudSnow, CloudFog, X } from 'lucide-react';

export default function WeatherWidget({ city, onContextMenu, onDelete }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const API_KEY = '51379a7e30308641'; // From api.md

  useEffect(() => {
    const fetchWeather = async () => {
      const CACHE_KEY = `ketag_weather_${city || 'auto'}`;
      const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

      // Try load from cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
          try {
              const { timestamp, data } = JSON.parse(cached);
              if (Date.now() - timestamp < CACHE_DURATION) {
                  setWeatherData(data);
                  setLoading(false);
                  return;
              }
          } catch(e) {
              localStorage.removeItem(CACHE_KEY);
          }
      }

      try {
        setLoading(true);
        // 1. First get location if city is not provided or auto-detect needed
        let searchCity = city;
        
        if (!searchCity) {
            try {
                const ipRes = await fetch(`https://v2.xxapi.cn/api/ip?key=${API_KEY}`); // Assuming key needed or public
                const ipData = await ipRes.json();
                if (ipData.code === 200 && ipData.data.address) {
                    const address = ipData.data.address;
                    const match = address.match(/省(.*?)(市|自治州)/) || address.match(/中国(.*?)(市|省)/);
                    if(match) {
                         searchCity = match[1];
                    } else {
                         const parts = address.split(' ');
                         if (parts.length > 0) {
                             if (address.includes('市')) {
                                 searchCity = address.split('市')[0].split('省').pop().split(' ').pop(); 
                             } else {
                                 searchCity = "北京"; // Fallback
                             }
                         }
                    }
                }
            } catch (e) {
                console.error("IP Fetch Error", e);
                searchCity = "北京";
            }
        }

        if (!searchCity) searchCity = "北京";

        // 2. Fetch Weather
        const res = await fetch(`https://v2.xxapi.cn/api/weatherDetails?city=${encodeURIComponent(searchCity)}&key=${API_KEY}`);
        const data = await res.json();

        if (data.code === 200) {
          setWeatherData(data.data);
          // Save to cache
          localStorage.setItem(CACHE_KEY, JSON.stringify({
              timestamp: Date.now(),
              data: data.data
          }));
        } else {
          setError(data.msg || '获取天气失败');
          if (onDelete) {
              setTimeout(() => {
                  onDelete();
              }, 3000);
          }
        }
      } catch (err) {
        setError('网络错误');
        if (onDelete) {
            setTimeout(() => {
                onDelete();
            }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city, onDelete]);

  // --- Helper: Map weather description to Icon ---
  const getWeatherIcon = (weather, size = 24, className = "") => {
      if (!weather) return <Sun size={size} className={`text-yellow-400 ${className}`} />;
      
      if (weather.includes('晴')) return <Sun size={size} className={`text-yellow-400 animate-spin-slow ${className}`} />;
      if (weather.includes('多云') || weather.includes('阴')) return <Cloud size={size} className={`text-gray-300 ${className}`} />;
      if (weather.includes('雨')) return <CloudRain size={size} className={`text-blue-400 ${className}`} />;
      if (weather.includes('雷')) return <CloudLightning size={size} className={`text-purple-400 animate-pulse ${className}`} />;
      if (weather.includes('雪')) return <CloudSnow size={size} className={`text-white ${className}`} />;
      if (weather.includes('雾') || weather.includes('霾')) return <CloudFog size={size} className={`text-gray-400 ${className}`} />;
      
      return <Sun size={size} className={`text-yellow-400 ${className}`} />;
  };

  if (loading) return (
      <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center animate-pulse">
          <div className="text-white/50 text-sm">加载天气...</div>
      </div>
  );

  if (error) return (
      <div className="w-full h-full bg-red-500/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-red-500/20">
          <div className="text-red-400 text-sm px-4 text-center">{error}</div>
      </div>
  );

  if (!weatherData) return null;

  // Get current real-time weather
  const today = weatherData.data[0];
  const nowHour = new Date().getHours();
  // Find closest time logic
  const currentWeather = today.real_time_weather && today.real_time_weather.length > 0 
      ? today.real_time_weather.reduce((prev, curr) => {
          const prevHour = parseInt(prev.time.split(':')[0]);
          const currHour = parseInt(curr.time.split(':')[0]);
          return (Math.abs(currHour - nowHour) < Math.abs(prevHour - nowHour) ? curr : prev);
        })
      : { temperature: 'N/A', weather: '未知' };


  return (
    <>
    <div 
        onContextMenu={onContextMenu}
        onClick={() => setIsExpanded(true)}
        className="w-full h-full bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
    >
       {/* Background Decoration */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all"></div>

       <div className="relative z-10 w-full">
           <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-1 text-white/80 text-sm font-medium">
                   <MapPin size={14} />
                   <span>{weatherData.city}</span>
               </div>
               <span className="text-xs text-white/60 bg-black/20 px-2 py-0.5 rounded-full">{currentWeather.weather}</span>
           </div>

           <div className="flex items-center justify-between mt-2">
               <div className="flex items-center gap-3">
                   {getWeatherIcon(currentWeather.weather, 48, "drop-shadow-lg")}
                   <div className="text-5xl font-bold text-white tracking-tighter">{currentWeather.temperature}°</div>
               </div>
               
               <div className="flex flex-col text-xs text-white/70 space-y-1 text-right">
                   <span>{today.low_temp}° / {today.high_temp}°</span>
                   <span>{currentWeather.wind_dir} {currentWeather.wind_speed}</span>
               </div>
           </div>
       </div>

       <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-[10px] text-white/60 mt-auto">
           <div className="flex flex-col items-center gap-1">
               <Droplets size={14} className="text-blue-300" />
               <span>{currentWeather.humidity}</span>
           </div>
            <div className="flex flex-col items-center gap-1">
               <Wind size={14} className="text-gray-300" />
               <span>{currentWeather.pressure}</span>
           </div>
           <div className="flex flex-col items-center gap-1">
               <Cloud size={14} className="text-white/80" />
               <span>{currentWeather.cloud_cover}</span>
           </div>
       </div>
    </div>

    {/* Expanded Modal - Portaled to body to avoid z-index issues */}
    {isExpanded && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsExpanded(false)}>
            <div className="bg-gray-900/90 border border-white/10 rounded-3xl p-8 w-[800px] max-w-[90vw] shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={() => setIsExpanded(false)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <X size={24} />
                </button>
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-500/20 rounded-2xl">
                        {getWeatherIcon(currentWeather.weather, 48)}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            {weatherData.city} 
                            <span className="text-lg font-normal text-white/60 bg-white/10 px-3 py-1 rounded-full">{today.date} {today.day}</span>
                        </h2>
                        <div className="text-white/80 mt-1 flex gap-4 text-sm">
                             <span>实时温度: {currentWeather.temperature}°</span>
                             <span>{currentWeather.description}</span>
                        </div>
                    </div>
                </div>

                {/* Forecast Grid */}
                <div className="grid grid-cols-7 gap-4">
                    {weatherData.data.map((day, idx) => (
                        <div key={idx} className="bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                            <span className="text-xs text-white/50">{day.day}</span>
                            <span className="text-xs font-medium text-white/80">{day.date}</span>
                            
                            <div className="my-2">
                                {getWeatherIcon(day.weather_from || day.real_time_weather[0]?.weather, 32)}
                            </div>
                            
                            <span className="text-xs text-white/60">{day.weather_from}</span>
                            
                            <div className="flex flex-col items-center text-sm font-bold text-white mt-1">
                                <span>{day.high_temp}°</span>
                                <span className="text-white/40 text-xs">{day.low_temp}°</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    )}
    </>
  );
}
