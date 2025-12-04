import { useState, useEffect } from 'react';
import { Hourglass, CalendarClock, Settings } from 'lucide-react';

export default function CountdownWidget({ title = '重要日子', targetDate, onUpdate, onContextMenu }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDate, setEditDate] = useState(targetDate || '');

  useEffect(() => {
    const calculateTime = () => {
        if (!targetDate) {
            setTimeLeft('请设置日期');
            return;
        }
        const now = new Date();
        const target = new Date(targetDate);
        // Reset hours to compare dates only
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dest = new Date(target.getFullYear(), target.getMonth(), target.getDate());
        
        const diffTime = dest - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        setDaysLeft(diffDays);
        if (diffDays === 0) setTimeLeft('就是今天！');
        else if (diffDays > 0) setTimeLeft(`${diffDays} 天`);
        else setTimeLeft(`已过去 ${Math.abs(diffDays)} 天`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [targetDate]);

  const handleSave = () => {
      onUpdate({ title: editTitle, targetDate: editDate });
      setIsEditing(false);
  };

  if (isEditing || !targetDate) {
      return (
        <div 
            onContextMenu={onContextMenu}
            className="w-full h-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg flex flex-col p-3 relative"
        >
            <h3 className="text-white text-xs font-bold mb-2 flex items-center gap-2">
                <CalendarClock size={14} /> 设置倒数日
            </h3>
            <div className="flex-1 flex flex-col gap-2 justify-center">
                <input 
                    type="text" 
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="事件名称"
                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                    onPointerDown={e => e.stopPropagation()}
                />
                <input 
                    type="date" 
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                    onPointerDown={e => e.stopPropagation()}
                />
                <button 
                    onClick={handleSave}
                    className="mt-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 rounded transition-colors"
                    onPointerDown={e => e.stopPropagation()}
                >
                    保存
                </button>
            </div>
        </div>
      );
  }

  return (
    <div 
        onContextMenu={onContextMenu}
        className="w-full h-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg flex flex-col relative group overflow-hidden hover:bg-white/10 transition-all"
    >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button 
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-white/20 rounded-full text-white/70 hover:text-white"
                title="编辑"
            >
                <Settings size={12} />
            </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="text-white/60 text-xs font-medium mb-1 flex items-center gap-1">
                <Hourglass size={12} />
                {title}
            </div>
            
            {daysLeft === 0 ? (
                <div className="text-white font-bold text-xl animate-pulse">Today!</div>
            ) : (
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white shadow-black drop-shadow-lg font-mono">
                        {Math.abs(daysLeft)}
                    </span>
                    <span className="text-white/80 text-xs">天</span>
                </div>
            )}
            
            <div className="text-white/40 text-[10px] mt-1">
                {daysLeft > 0 ? '还有' : '已过去'}
            </div>
        </div>
    </div>
  );
}
