import { useState, useEffect } from 'react';
import { Flame, RefreshCw, ExternalLink, MessageCircle, Video } from 'lucide-react';

export default function NewsWidget({ source = 'weibo', onContextMenu, onDelete, onSourceChange }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use prop directly as source of truth for persistence
  const activeSource = source;

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = activeSource === 'weibo' 
        ? 'https://v2.xxapi.cn/api/weibohot' 
        : 'https://v2.xxapi.cn/api/douyinhot';
      
      const res = await fetch(api);
      const data = await res.json();

      if (data.code === 200) {
        // Normalize data
        const list = (data.data || []).slice(0, 10).map(item => {
            if (activeSource === 'weibo') {
                return {
                    title: item.title,
                    url: item.url,
                    hot: item.hot
                };
            } else {
                return {
                    title: item.word,
                    url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
                    hot: (item.hot_value / 10000).toFixed(1) + '万'
                };
            }
        });
        setNews(list);
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
    fetchNews();
    // Auto refresh every 10 minutes
    const timer = setInterval(fetchNews, 600000);
    return () => clearInterval(timer);
  }, [activeSource]);

  const toggleSource = (e) => {
      e.stopPropagation();
      const newSource = activeSource === 'weibo' ? 'douyin' : 'weibo';
      if (onSourceChange) {
          onSourceChange(newSource);
      }
  };

  return (
    <div 
        onContextMenu={onContextMenu}
        className="w-full h-full bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg hover:bg-white/15 transition-all cursor-default flex flex-col relative group overflow-hidden"
    >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-white font-bold">
                <Flame size={18} className={activeSource === 'weibo' ? 'text-red-500' : 'text-pink-500'} />
                <span>{activeSource === 'weibo' ? '微博热搜' : '抖音热榜'}</span>
            </div>
            <div className="flex gap-2">
                <button onClick={toggleSource} className="p-1.5 hover:bg-white/10 rounded-full text-white/70 transition-colors" title="切换源">
                    {activeSource === 'weibo' ? <Video size={14} /> : <MessageCircle size={14} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); fetchNews(); }} className={`p-1.5 hover:bg-white/10 rounded-full text-white/70 transition-colors ${loading ? 'animate-spin' : ''}`} title="刷新">
                    <RefreshCw size={14} />
                </button>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
            {loading && news.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/50 text-xs">加载中...</div>
            ) : error ? (
                <div className="h-full flex items-center justify-center text-red-400 text-xs">{error}</div>
            ) : (
                news.map((item, index) => (
                    <a 
                        key={index} 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 group/item hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className={`text-xs font-bold min-w-[16px] text-center mt-0.5 ${index < 3 ? 'text-yellow-400' : 'text-white/50'}`}>{index + 1}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-white/90 truncate group-hover/item:text-blue-300 transition-colors">{item.title}</div>
                            <div className="text-[10px] text-white/40">{item.hot}</div>
                        </div>
                        <ExternalLink size={12} className="text-white/20 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    </a>
                ))
            )}
        </div>
    </div>
  );
}
