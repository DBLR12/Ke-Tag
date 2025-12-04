import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import WeatherWidget from './WeatherWidget';
import NewsWidget from './NewsWidget';
import HistoryWidget from './HistoryWidget';
import BingWidget from './BingWidget';
import RandomImageWidget from './RandomImageWidget';
import NotesWidget from './NotesWidget';
import TodoWidget from './TodoWidget';
import CountdownWidget from './CountdownWidget';

// --- 可拖拽的图标/组件 ---
export default function DraggableItem({ item, isValid = true, onContextMenu, onDelete, onUpdate, onSetWallpaper }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({ 
      id: item.id,
      data: { ...item } // Pass item data for drag event
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : 10,
    opacity: isDragging ? 0.8 : 1,
    gridColumn: `${item.x} / span ${item.w}`,
    gridRow: `${item.y} / span ${item.h}`,
  };

  // Dynamic classes for validity feedback
  const validityClasses = (isDragging && !isValid) 
    ? 'ring-2 ring-red-500 bg-red-500/20 z-50' 
    : '';

  // --- 渲染内容 ---
  const renderContent = () => {
      if (item.type === 'weather') {
          return (
            <div className={`w-full h-full flex items-center justify-center rounded-xl transition-all duration-200 ${validityClasses}`}>
                 <WeatherWidget city={item.city} onContextMenu={(e) => onContextMenu(e, item)} onDelete={onDelete} />
            </div>
          );
      } else if (item.type === 'news') {
          return (
            <div className={`w-full h-full flex items-center justify-center rounded-xl transition-all duration-200 ${validityClasses}`}>
                 <NewsWidget 
                    source={item.source} 
                    onContextMenu={(e) => onContextMenu(e, item)} 
                    onDelete={onDelete} 
                    onSourceChange={(newSource) => onUpdate({ source: newSource })}
                 />
            </div>
          );
      } else if (item.type === 'history') {
          return (
            <div className={`w-full h-full flex items-center justify-center rounded-xl transition-all duration-200 ${validityClasses}`}>
                 <HistoryWidget 
                    onContextMenu={(e) => onContextMenu(e, item)} 
                    onDelete={onDelete} 
                 />
            </div>
          );
      } else if (item.type === 'bing') {
          return (
            <div className={`w-full h-full flex items-center justify-center rounded-xl transition-all duration-200 ${validityClasses}`}>
                 <BingWidget 
                    onContextMenu={(e) => onContextMenu(e, item)} 
                    onDelete={onDelete}
                    onSetWallpaper={onSetWallpaper}
                 />
            </div>
          );
      } else if (['heisi', 'baisi', 'jk'].includes(item.type)) {
          const titles = {
              heisi: '随机黑丝',
              baisi: '随机白丝',
              jk: '随机JK'
          };
          return (
            <div className={`w-full h-full flex items-center justify-center rounded-xl transition-all duration-200 ${validityClasses}`}>
                 <RandomImageWidget 
                    type={item.type}
                    title={titles[item.type]}
                    onContextMenu={(e) => onContextMenu(e, item)} 
                    onDelete={onDelete}
                 />
            </div>
          );
      } else if (item.type === 'notes') {
          return (
            <div className={`w-full h-full flex items-center justify-center rounded-xl transition-all duration-200 ${validityClasses}`}>
                 <NotesWidget 
                    content={item.content} 
                    onContextMenu={(e) => onContextMenu(e, item)} 
                    onUpdate={(updates) => onUpdate(updates)}
                 />
            </div>
          );
      } else if (item.type === 'todo') {
          return (
            <div className={`w-full h-full flex items-center justify-center rounded-xl transition-all duration-200 ${validityClasses}`}>
                 <TodoWidget 
                    todos={item.todos || []} 
                    onContextMenu={(e) => onContextMenu(e, item)} 
                    onUpdate={(updates) => onUpdate(updates)}
                 />
            </div>
          );
      } else if (item.type === 'countdown') {
          return (
            <div className={`w-full h-full flex items-center justify-center rounded-xl transition-all duration-200 ${validityClasses}`}>
                 <CountdownWidget 
                    title={item.title}
                    targetDate={item.targetDate}
                    onContextMenu={(e) => onContextMenu(e, item)} 
                    onUpdate={(updates) => onUpdate(updates)}
                 />
            </div>
          );
      }
      
      // Default: Icon
      const isTextIcon = item.iconType === 'text';
      
      return (
        <div 
             className={`flex flex-col items-center group relative rounded-xl transition-all duration-200 ${validityClasses} w-full h-full justify-center`}
             onContextMenu={(e) => onContextMenu(e, item)}
        >
            <div 
                className={`bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-2 shadow-lg border border-white/10 hover:bg-white/20 transition-all cursor-pointer overflow-hidden group-hover:scale-105 group-hover:shadow-2xl group-hover:border-white/30 ${item.w > 1 || item.h > 1 ? 'w-full h-full' : 'w-16 h-16'}`}
                style={{
                    backgroundColor: isTextIcon ? item.backgroundColor : undefined
                }}
                onClick={() => window.location.href = item.url}
            >
                {isTextIcon ? (
                    <span className="text-white font-bold text-2xl">{item.icon}</span>
                ) : (
                    <img 
                        src={item.icon} 
                        alt={item.title} 
                        className={`${item.w > 1 || item.h > 1 ? 'w-full h-full object-cover' : 'w-8 h-8'}`} 
                        onError={(e) => e.target.src='https://via.placeholder.com/32'} 
                    />
                )}
            </div>
            {/* Only show title outside if it's a small icon */}
            {!(item.w > 1 || item.h > 1) && (
                <span className="text-sm font-medium text-gray-100 shadow-black drop-shadow-md truncate w-full text-center pointer-events-none">{item.title}</span>
            )}
        </div>
      );
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center justify-center relative">
        {renderContent()}
    </div>
  );
}
