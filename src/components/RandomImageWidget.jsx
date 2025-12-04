import { useState, useEffect } from 'react';
import { RefreshCw, Maximize2, X, Palette, Sparkles, Camera } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function RandomImageWidget({ type = 'jk', title = '随机图片', onContextMenu, onDelete }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Map type to API endpoint
  const getApiUrl = () => {
      switch(type) {
          case 'heisi': return 'https://v2.xxapi.cn/api/heisi';
          case 'baisi': return 'https://v2.xxapi.cn/api/baisi';
          case 'jk': return 'https://v2.xxapi.cn/api/jk';
          default: return 'https://v2.xxapi.cn/api/jk';
      }
  };
  
  const getIcon = () => {
      switch(type) {
          case 'heisi': return <Sparkles size={14} className="text-purple-400" />;
          case 'baisi': return <Palette size={14} className="text-pink-300" />;
          case 'jk': return <Camera size={14} className="text-blue-300" />;
          default: return <Sparkles size={14} />;
      }
  };

  const fetchImage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(getApiUrl());
      const data = await res.json();

      if (data.code === 200) {
        setImageUrl(data.data);
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
    fetchImage();
  }, [type]);

  return (
    <>
    <div 
        onContextMenu={onContextMenu}
        className="w-full h-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:bg-white/15 transition-all cursor-default flex flex-col relative group overflow-hidden"
    >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-2 text-white font-bold text-xs shadow-black drop-shadow-md">
                {getIcon()}
                <span>{title}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={fetchImage} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title="刷新">
                    <RefreshCw size={12} />
                </button>
                <button onClick={() => setIsExpanded(true)} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title="查看大图">
                    <Maximize2 size={12} />
                </button>
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
                <img 
                    src={imageUrl} 
                    alt={title}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                    onClick={() => setIsExpanded(true)}
                />
            )}
        </div>
    </div>

    {/* Modal */}
    {isExpanded && imageUrl && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsExpanded(false)}>
             <button onClick={() => setIsExpanded(false)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50">
                <X size={32} />
            </button>
             {/* Floating Refresh Button in Modal */}
            <button 
                onClick={(e) => { e.stopPropagation(); fetchImage(); }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white flex items-center gap-2 transition-all border border-white/20 shadow-lg"
            >
                <RefreshCw size={16} />
                <span>换一张</span>
            </button>
            
            <div className="h-[90vh] max-w-[90vw] overflow-hidden rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <img 
                    src={imageUrl} 
                    alt={title}
                    className="h-full w-full object-contain bg-black"
                />
            </div>
        </div>,
        document.body
    )}
    </>
  );
}
