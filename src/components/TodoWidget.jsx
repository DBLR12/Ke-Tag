import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Square, CheckSquare as CheckSquareIcon } from 'lucide-react';

export default function TodoWidget({ todos = [], onUpdate, onContextMenu }) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (e) => {
      e.preventDefault();
      if (!inputValue.trim()) return;
      const newTodos = [...todos, { id: Date.now(), text: inputValue, done: false }];
      onUpdate({ todos: newTodos });
      setInputValue('');
  };

  const toggleTodo = (id) => {
      const newTodos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
      onUpdate({ todos: newTodos });
  };

  const deleteTodo = (id) => {
      const newTodos = todos.filter(t => t.id !== id);
      onUpdate({ todos: newTodos });
  };

  return (
    <div 
        onContextMenu={onContextMenu}
        className="w-full h-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg flex flex-col relative overflow-hidden"
    >
        {/* Header */}
        <div className="p-3 flex items-center justify-between bg-white/5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
                <CheckSquare size={14} />
                <span>待办事项</span>
            </div>
            <span className="text-[10px] text-white/50">{todos.filter(t => t.done).length}/{todos.length}</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {todos.map(todo => (
                <div key={todo.id} className="group flex items-center gap-2 p-2 rounded hover:bg-white/10 transition-colors text-sm text-white">
                    <button 
                        onClick={() => toggleTodo(todo.id)}
                        className={`shrink-0 ${todo.done ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {todo.done ? <CheckSquareIcon size={16} /> : <Square size={16} />}
                    </button>
                    <span className={`flex-1 truncate ${todo.done ? 'line-through text-white/30' : ''}`} title={todo.text}>{todo.text}</span>
                    <button 
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            {todos.length === 0 && (
                <div className="text-center text-white/20 text-xs py-4">暂无待办</div>
            )}
        </div>

        {/* Input */}
        <form onSubmit={handleAdd} className="p-2 border-t border-white/10 flex gap-2 shrink-0">
            <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="添加任务..."
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            />
            <button type="submit" className="p-1 bg-blue-600/80 hover:bg-blue-600 rounded text-white" onPointerDown={(e) => e.stopPropagation()}>
                <Plus size={14} />
            </button>
        </form>
    </div>
  );
}
