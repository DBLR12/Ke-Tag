import { useEffect, useRef } from 'react';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';

export default function ContextMenu({ x, y, onClose, onEdit, onDelete, onOpenNewTab }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Prevent menu from going off-screen
  const style = {
    top: y,
    left: x,
  };
  
  // Simple adjustment if it's too close to the edge (basic implementation)
  if (window.innerWidth - x < 150) {
      style.left = x - 150;
  }
  if (window.innerHeight - y < 150) {
      style.top = y - 120;
  }

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 w-40 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
      style={style}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button 
        onClick={onOpenNewTab}
        className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2 transition-colors"
      >
        <ExternalLink size={14} />
        <span>新标签页打开</span>
      </button>
      
      <div className="h-[1px] bg-white/10 my-1 mx-2"></div>

      <button 
        onClick={onEdit}
        className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2 transition-colors"
      >
        <Edit2 size={14} />
        <span>编辑</span>
      </button>
      <button 
        onClick={onDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
      >
        <Trash2 size={14} />
        <span>删除</span>
      </button>
    </div>
  );
}
