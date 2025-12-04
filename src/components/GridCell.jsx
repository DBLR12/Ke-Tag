import { useDroppable } from '@dnd-kit/core';

export default function GridCell({ x, y, children, onDrop }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${x}-${y}`,
    data: { x, y }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`relative w-full h-full transition-colors rounded-xl ${isOver ? 'bg-white/10 border border-white/20' : ''}`}
      style={{ gridColumnStart: x, gridRowStart: y }}
    >
      {/* This cell is just a drop target. The content might be rendered here or by the parent absolute layout. */}
      {children}
    </div>
  );
}
