import { useState, useEffect } from 'react';
import { StickyNote } from 'lucide-react';

export default function NotesWidget({ content = '', onUpdate, onContextMenu }) {
  const [text, setText] = useState(content);
  
  // Debounce update to parent
  useEffect(() => {
      const timer = setTimeout(() => {
          if (text !== content) {
              onUpdate({ content: text });
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [text, content, onUpdate]);

  return (
    <div 
        onContextMenu={onContextMenu}
        className="w-full h-full bg-yellow-100/90 backdrop-blur-md rounded-2xl border border-yellow-200/50 shadow-lg flex flex-col relative group overflow-hidden transition-colors"
    >
        {/* Header */}
        <div className="p-3 pb-1 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-yellow-700 font-bold text-xs">
                <StickyNote size={14} />
                <span>便签</span>
            </div>
        </div>
        
        <textarea 
            className="flex-1 w-full h-full bg-transparent resize-none p-3 pt-2 outline-none text-gray-800 text-sm custom-scrollbar placeholder-yellow-700/30"
            placeholder="写点什么..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on interaction
            onKeyDown={(e) => e.stopPropagation()} // Prevent hotkeys
        />
    </div>
  );
}
