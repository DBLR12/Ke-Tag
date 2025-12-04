import { useState, useEffect } from 'react';

export default function ClockWidget({ showSeconds = true, styleType = 'default', onContextMenu }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = formatTime(time);
  
  // 获取日期信息
  const dateStr = time.toLocaleDateString('zh-CN', { 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
  });

  // --- 渲染不同风格的时钟 ---
  const renderClock = () => {
      switch (styleType) {
          case 'electronic':
              return (
                  <div className="font-mono text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] bg-black/80 p-6 rounded-xl border-4 border-gray-700 shadow-2xl">
                      <div className="text-7xl tracking-widest flex items-baseline gap-4" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                          <span>{hours}</span>
                          <span className="animate-pulse text-green-500/50">:</span>
                          <span>{minutes}</span>
                          {showSeconds && <span className="text-4xl text-green-600">{seconds}</span>}
                      </div>
                      <div className="text-right text-green-600 mt-2 text-sm font-bold uppercase tracking-wider">Electronic</div>
                  </div>
              );
          case 'mechanical':
              return (
                  <div className="relative w-48 h-48 bg-white/10 backdrop-blur-md rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center">
                      {/* 表盘刻度 */}
                      {[...Array(12)].map((_, i) => (
                          <div key={i} className="absolute w-1 h-3 bg-white/60" style={{ transform: `rotate(${i * 30}deg) translateY(-88px)` }}></div>
                      ))}

                      {/* 数字标注 */}
                      <span className="absolute top-2 text-xl font-bold text-white/90 font-serif">12</span>
                      <span className="absolute bottom-2 text-xl font-bold text-white/90 font-serif">6</span>
                      <span className="absolute left-3 text-xl font-bold text-white/90 font-serif">9</span>
                      <span className="absolute right-3 text-xl font-bold text-white/90 font-serif">3</span>

                      {/* 时针 */}
                      <div className="absolute w-1.5 h-12 bg-white rounded-full origin-bottom left-1/2 bottom-1/2" 
                           style={{ transform: `translateX(-50%) rotate(${(time.getHours() % 12) * 30 + time.getMinutes() * 0.5}deg)` }}></div>
                      {/* 分针 */}
                      <div className="absolute w-1 h-16 bg-gray-300 rounded-full origin-bottom left-1/2 bottom-1/2" 
                           style={{ transform: `translateX(-50%) rotate(${time.getMinutes() * 6}deg)` }}></div>
                      {/* 秒针 */}
                      {showSeconds && (
                          <div className="absolute w-0.5 h-20 bg-red-500 rounded-full origin-bottom left-1/2 bottom-1/2" 
                               style={{ transform: `translateX(-50%) rotate(${time.getSeconds() * 6}deg)` }}></div>
                      )}
                      {/* 中心点 */}
                      <div className="absolute w-3 h-3 bg-red-500 rounded-full shadow-md z-10"></div>
                  </div>
              );
          case 'alarm':
             return (
                 <div className="flex flex-col items-center justify-center text-white drop-shadow-lg select-none bg-gray-900/90 p-6 rounded-[2rem] shadow-2xl border-b-8 border-r-8 border-gray-800 transform -rotate-1">
                     <div className="text-6xl font-bold tracking-tighter flex items-center gap-2 font-sans text-red-500" style={{ textShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
                       <span>{hours}</span>
                       <span className="animate-pulse pb-2">:</span>
                       <span>{minutes}</span>
                       {showSeconds && <span className="text-3xl text-red-700 mt-3 ml-1">{seconds}</span>}
                     </div>
                     <div className="text-xs font-medium text-gray-500 mt-2 tracking-[0.2em] uppercase">Alarm Clock</div>
                 </div>
             );
          case 'default':
          default:
              return (
                <div className="flex flex-col items-center justify-center text-white drop-shadow-lg select-none">
                  <div className="text-8xl font-light tracking-tighter flex items-baseline gap-2 font-mono">
                    <span>{hours}</span>
                    <span className="animate-pulse">:</span>
                    <span>{minutes}</span>
                    {showSeconds && (
                        <span className="text-4xl text-white/80 ml-2 w-[1.2em] text-center">{seconds}</span>
                    )}
                  </div>
                  <div className="text-lg font-medium text-white/90 mt-2 tracking-wide">
                    {dateStr}
                  </div>
                </div>
              );
      }
  };

  return (
      <div onContextMenu={onContextMenu} className="cursor-default hover:scale-105 transition-transform duration-300 mb-4">
          {renderClock()}
      </div>
  );
}
