import { useState, useEffect } from 'react';
import { X, RefreshCw, Check, Image as ImageIcon } from 'lucide-react';

export default function WallpaperPickerModal({ onClose, onSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallpapers = async () => {
    setLoading(true);
    // Fetch 5 images concurrently
    try {
        const promises = Array(6).fill().map(() => fetch('https://v2.xxapi.cn/api/wallpaper').then(res => res.json()));
        const results = await Promise.all(promises);
        
        const validImages = results
            .filter(data => data.code == 200)
            .map(data => data.data);
        
        // De-duplicate
        setImages([...new Set(validImages)]);
    } catch (e) {
        console.error("Failed to fetch wallpapers", e);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallpapers();
  }, []);

  const handleRefresh = () => {
      setRefreshing(true);
      fetchWallpapers();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-gray-900/90 border border-white/10 rounded-2xl shadow-2xl w-[800px] max-w-[95vw] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 shrink-0">
                <div className="flex items-center gap-2 text-white font-bold">
                    <ImageIcon size={20} />
                    <h3>选择壁纸</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleRefresh} 
                        disabled={loading || refreshing}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-50"
                        title="换一批"
                    >
                        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-white/50 flex-col gap-3">
                        <RefreshCw size={32} className="animate-spin" />
                        <span className="text-sm">正在获取壁纸...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((img, index) => (
                            <div 
                                key={index} 
                                className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:scale-[1.02]"
                                onClick={() => {
                                    onSelect(img);
                                    onClose();
                                }}
                            >
                                <img src={img} alt="wallpaper" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <Check size={16} /> 设为壁纸
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!loading && images.length === 0 && (
                    <div className="text-center text-gray-500 py-10">获取失败，请重试</div>
                )}
            </div>
        </div>
    </div>
  );
}
