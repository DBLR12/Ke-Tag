import { useState, useEffect } from 'react';
import { Image as ImageIcon, Check, Wallpaper } from 'lucide-react';

export default function BingWidget({ onContextMenu, onDelete, onSetWallpaper }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSet, setIsSet] = useState(false);

  const fetchBing = async () => {
    setLoading(true);
    setError(null);
    setIsSet(false);
    const CACHE_KEY = `ketag_bing_${new Date().toLocaleDateString()}`;
    
    // Try cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        setImageUrl(cached);
        setLoading(false);
        return;
    }

    try {
      const res = await fetch('https://v2.xxapi.cn/api/bing');
      const data = await res.json();

      if (data.code === 200) {
        setImageUrl(data.data);
        localStorage.setItem(CACHE_KEY, data.data);
      } else {
        setError('加载失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBing();
  }, []);

  const handleSetWallpaper = (e) => {
      e.stopPropagation();
      if (imageUrl && onSetWallpaper) {
          onSetWallpaper(imageUrl);
          setIsSet(true);
          setTimeout(() => setIsSet(false), 2000);
      }
  };

  return (
    <div 
        onContextMenu={onContextMenu}
        className="w-full h-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:bg-white/15 transition-all cursor-default flex flex-col relative group overflow-hidden"
    >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-2 text-white font-bold text-xs shadow-black drop-shadow-md">
                <ImageIcon size={14} />
                <span>Bing 每日一图</span>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full h-full relative bg-gray-900/50">
            {loading ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse">
                    <div className="text-white/50 text-xs">加载中...</div>
                </div>
            ) : error ? (
                <div className="w-full h-full flex items-center justify-center text-red-400 text-xs">{error}</div>
            ) : (
                <>
                    <img 
                        src={imageUrl} 
                        alt="Bing Daily" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Set Wallpaper Button */}
                    <button 
                        onClick={handleSetWallpaper}
                        className={`absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all transform translate-y-10 group-hover:translate-y-0 ${isSet ? 'bg-green-500/80 text-white' : 'bg-black/40 hover:bg-black/60 text-white'}`}
                    >
                        {isSet ? <Check size={12} /> : <Wallpaper size={12} />}
                        <span className="text-xs">{isSet ? '已设置' : '设为壁纸'}</span>
                    </button>
                </>
            )}
        </div>
    </div>
  );
}
