import { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Search, Download, Upload, Trash2, Image as ImageIcon, Clock, Globe, ChevronDown, Monitor, Watch, AlarmClock, CloudSun, Link as LinkIcon, Flame, Calendar, Sparkles, Palette, Camera, StickyNote, CheckSquare, Hourglass } from 'lucide-react';
import ClockWidget from './components/ClockWidget';
import ContextMenu from './components/ContextMenu';
import WeatherWidget from './components/WeatherWidget';
import NewsWidget from './components/NewsWidget';
import DraggableItem from './components/DraggableItem';
import GridCell from './components/GridCell';
import EditIconModal from './components/EditIconModal';
import WallpaperPickerModal from './components/WallpaperPickerModal';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { get, set } from 'idb-keyval';

const SEARCH_ENGINES = {
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=', placeholder: '搜 Bing...' },
  google: { name: 'Google', url: 'https://www.google.com/search?q=', placeholder: '搜 Google...' },
  baidu: { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', placeholder: '搜百度...' },
};

// --- 默认配置 ---
const DEFAULT_CONFIG = {
  version: '1.0.0',
  settings: {
    theme: 'dark',
    gridSize: 'medium',
    wallpaper: {
      type: 'url',
      value: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop'
    },
    blur: 3,
    showClock: true,
    clockStyle: 'default',
    clockShowSeconds: true,
    searchEngine: 'bing'
  },
  layout: [
    
  ]
};

const GRID_COLS = 12;
const GRID_ROWS = 8; // Or dynamic based on screen

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, itemId: null, isBackground: false });
  const [clockContextMenu, setClockContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [addMenu, setAddMenu] = useState({ visible: false, x: 0, y: 0 }); // Menu for adding items (Shortcut/Widget)
  const [showEngineMenu, setShowEngineMenu] = useState(false);
  const [dragState, setDragState] = useState({ isValid: true, activeId: null });
  const [editIconModal, setEditIconModal] = useState({ visible: false, item: null, isAdding: false });
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const fileInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);

  // 配置传感器，防止微小移动被误判为拖拽
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // --- 初始化加载配置 ---
  useEffect(() => {
    const loadConfig = async () => {
        const savedConfig = localStorage.getItem('ketag_config');
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            
            // Data migration: ensure x,y,w,h exist
            if (parsed.layout) {
                let nextX = 1;
                let nextY = 1;
                parsed.layout = parsed.layout.map(item => {
                    if (!item.x || !item.y) {
                        const newItem = { ...item, x: nextX, y: nextY, w: item.w || 1, h: item.h || 1 };
                        nextX++;
                        if (nextX > GRID_COLS) {
                            nextX = 1;
                            nextY++;
                        }
                        return newItem;
                    }
                    return { ...item, w: item.type === 'weather' ? 3 : (item.w || 1), h: item.type === 'weather' ? 2 : (item.h || 1) };
                });
            }

            // Load wallpaper from IndexedDB if needed
            if (parsed.settings?.wallpaper?.type === 'upload' && parsed.settings.wallpaper.value === 'indexeddb') {
                try {
                    const wallpaperData = await get('custom_wallpaper');
                    if (wallpaperData) {
                        parsed.settings.wallpaper.value = wallpaperData;
                    }
                } catch (e) {
                    console.error("Failed to load wallpaper from IDB", e);
                }
            }

            setConfig(parsed);
          } catch (e) {
            console.error("Failed to parse config", e);
          }
        }
    };
    loadConfig();
  }, []);

  // --- 自动保存 ---
  useEffect(() => {
    const saveConfig = async () => {
        const configToSave = JSON.parse(JSON.stringify(config)); // Deep copy
        
        if (config.settings?.wallpaper?.type === 'upload' && config.settings.wallpaper.value) {
             // If it's an uploaded wallpaper, save actual data to IndexedDB to save localStorage space
             try {
                 // Only save to IDB if it's actual data (not the placeholder, though state should have real data)
                 if (config.settings.wallpaper.value !== 'indexeddb') {
                    await set('custom_wallpaper', config.settings.wallpaper.value);
                 }
                 // Replace value in localStorage with placeholder
                 configToSave.settings.wallpaper.value = 'indexeddb';
             } catch (e) {
                 console.error("Failed to save wallpaper to IDB", e);
             }
        }
        
        localStorage.setItem('ketag_config', JSON.stringify(configToSave));
    };
    saveConfig();
  }, [config]);

  // --- 拖拽移动处理 (实时检测碰撞/边界) ---
  const handleDragMove = (event) => {
      const { active, over } = event;
      
      // Reset validity if no over target (dragged outside grid)
      if (!over) {
          if (dragState.isValid) setDragState({ isValid: false, activeId: active.id });
          return;
      }

      const activeItem = config.layout.find(i => i.id === active.id);
      if (!activeItem) return;

      const { x: targetX, y: targetY } = over.data.current;

      // 1. 边界检查
      const isOutOfBounds = 
          targetX + activeItem.w - 1 > GRID_COLS || 
          targetY + activeItem.h - 1 > GRID_ROWS;

      if (isOutOfBounds) {
          if (dragState.isValid) setDragState({ isValid: false, activeId: active.id });
          return;
      }

      // 2. 碰撞检测
      const hasCollision = config.layout.some(item => {
          if (item.id === active.id) return false; // Skip self
          
          const itemRight = item.x + item.w;
          const itemBottom = item.y + item.h;
          const targetRight = targetX + activeItem.w;
          const targetBottom = targetY + activeItem.h;
          
          // Check intersection
          return (
              targetX < itemRight &&
              targetRight > item.x &&
              targetY < itemBottom &&
              targetBottom > item.y
          );
      });

      if (hasCollision) {
          if (dragState.isValid) setDragState({ isValid: false, activeId: active.id });
      } else {
          if (!dragState.isValid) setDragState({ isValid: true, activeId: active.id });
      }
  };

  // --- 拖拽结束处理 ---
  const handleDragEnd = (event) => {
    setDragState({ isValid: true, activeId: null }); // Reset state
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const { x: targetX, y: targetY } = over.data.current;
      
      const activeItem = config.layout.find(i => i.id === active.id);
      if (!activeItem) return;

      // 1. 边界检查 (Boundary Check)
      if (targetX + activeItem.w - 1 > GRID_COLS) return; 
      if (targetY + activeItem.h - 1 > GRID_ROWS) return; 

      // 2. 碰撞检测 (Collision Check)
      const hasCollision = config.layout.some(item => {
          if (item.id === active.id) return false; // Skip self
          
          const itemRight = item.x + item.w;
          const itemBottom = item.y + item.h;
          const targetRight = targetX + activeItem.w;
          const targetBottom = targetY + activeItem.h;
          
          // Check intersection
          return (
              targetX < itemRight &&
              targetRight > item.x &&
              targetY < itemBottom &&
              targetBottom > item.y
          );
      });

      if (hasCollision) {
          return; // Prevent move if collision detected
      }
      
      setConfig((prev) => {
        const newLayout = prev.layout.map(item => {
            if (item.id === active.id) {
                return { ...item, x: targetX, y: targetY };
            }
            return item;
        });
        return { ...prev, layout: newLayout };
      });
    }
  };

  // --- 导出配置 ---
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ketag_backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- 导入配置 ---
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        // 简单的校验
        if (importedConfig.version && Array.isArray(importedConfig.layout)) {
          // 兼容旧配置，确保有 wallpaper 字段
          if (!importedConfig.settings.wallpaper) {
             importedConfig.settings.wallpaper = DEFAULT_CONFIG.settings.wallpaper;
          }
          if (importedConfig.settings.showClock === undefined) {
              importedConfig.settings.showClock = true;
          }
          if (importedConfig.settings.clockShowSeconds === undefined) {
              importedConfig.settings.clockShowSeconds = true;
          }
          if (importedConfig.settings.blur === undefined) {
              importedConfig.settings.blur = 3;
          }
          if (!importedConfig.settings.clockStyle) {
             importedConfig.settings.clockStyle = 'default';
          }
          if (!importedConfig.settings.searchEngine) {
            importedConfig.settings.searchEngine = 'bing';
          }
          setConfig(importedConfig);
          alert('配置导入成功！');
        } else {
          alert('无效的配置文件格式');
        }
      } catch (err) {
        alert('解析文件失败');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  // --- 壁纸处理 ---
  const handleWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 3 * 1024 * 1024) {
        alert("为了保证性能，建议使用 3MB 以下的图片，或者使用网络链接。");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setConfig(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          wallpaper: {
            type: 'upload',
            value: event.target.result
          }
        }
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleWallpaperUrlChange = (e) => {
      const url = e.target.value;
      setConfig(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          wallpaper: {
            type: 'url',
            value: url
          }
        }
      }));
  }

  const handleBlurChange = (e) => {
      const blurValue = parseInt(e.target.value);
      setConfig(prev => ({
          ...prev,
          settings: {
              ...prev.settings,
              blur: blurValue
          }
      }));
  };

  const toggleClock = () => {
    setConfig(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        showClock: !prev.settings.showClock
      }
    }));
  };

  const handleSearchEngineChange = (engineKey) => {
    setConfig(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        searchEngine: engineKey
      }
    }));
    setShowEngineMenu(false);
  };

  // --- 时钟右键菜单 ---
  const handleClockContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setClockContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY
      });
  };

  const toggleClockSeconds = () => {
      setConfig(prev => ({
          ...prev,
          settings: {
              ...prev.settings,
              clockShowSeconds: !prev.settings.clockShowSeconds
          }
      }));
  };

  const changeClockStyle = (style) => {
      setConfig(prev => ({
          ...prev,
          settings: {
              ...prev.settings,
              clockStyle: style
          }
      }));
  };

  const handleUpdateItem = (id, updates) => {
      setConfig(prev => ({
          ...prev,
          layout: prev.layout.map(i => i.id === id ? { ...i, ...updates } : i)
      }));
  };

  // --- 编辑图标 ---
  const handleEditIcon = (id) => {
      const item = config.layout.find(i => i.id === id);
      if (!item) return;
      setEditIconModal({ visible: true, item, isAdding: false });
  };

  const handleIconSave = (id, updates) => {
      if (editIconModal.isAdding) {
          // Adding new item
          const { w, h } = updates;
          const { x, y } = findEmptySpot(w, h);
          
          const newItem = {
              ...updates,
              id: Date.now().toString(),
              type: 'icon',
              x, y
          };
          
          setConfig(prev => ({
              ...prev,
              layout: [...prev.layout, newItem]
          }));
      } else {
          // Updating existing item
          setConfig(prev => ({
              ...prev,
              layout: prev.layout.map(i => i.id === id ? { ...i, ...updates } : i)
          }));
      }
      setEditIconModal({ visible: false, item: null, isAdding: false });
  };

  // --- 寻找空白位置 helper ---
  const findEmptySpot = (w, h) => {
      let x = 1, y = 1;
      while (true) {
          // Check if (x, y) fits in grid boundaries
          if (x + w - 1 > GRID_COLS) {
              x = 1;
              y++;
              // Safety break to prevent infinite loops if grid is extremely full (though rows expand indefinitely)
              if (y > 100) return { x: 1, y: 1 }; 
              continue;
          }
          
          // Check for collision with ANY existing item
          const hasCollision = config.layout.some(item => {
             const itemRight = item.x + item.w;
             const itemBottom = item.y + item.h;
             const newRight = x + w;
             const newBottom = y + h;
             
             return (
                 x < itemRight &&
                 newRight > item.x &&
                 y < itemBottom &&
                 newBottom > item.y
             );
          });

          if (!hasCollision) {
              return { x, y };
          }
          
          x++;
      }
  };

  // --- 添加项目菜单 (快捷方式 vs 组件) ---
  const handleAddClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Calculate position to be near the button or cursor
      const rect = e.currentTarget.getBoundingClientRect();
      setAddMenu({
          visible: true,
          x: rect.left + rect.width / 2,
          y: rect.top
      });
  };

  const handleAddShortcut = () => {
    const newItemSkeleton = {
        id: 'temp_new',
        type: 'icon',
        title: '',
        url: '',
        w: 1,
        h: 1,
        icon: '',
        iconType: 'url'
    };
    setEditIconModal({ visible: true, item: newItemSkeleton, isAdding: true });
    setAddMenu({ ...addMenu, visible: false });
  };

  const handleAddWeatherWidget = () => {
      const city = prompt("请输入城市名称 (留空自动检测)", "");
      
      const { x, y } = findEmptySpot(3, 2);

      const newWidget = {
          id: Date.now().toString(),
          type: 'weather',
          city: city || '', 
          w: 3, h: 2,
          x, y
      };

      setConfig(prev => ({
          ...prev,
          layout: [...prev.layout, newWidget]
      }));
      setAddMenu({ ...addMenu, visible: false });
  };

  const handleAddNewsWidget = () => {
      const { x, y } = findEmptySpot(3, 4);

      const newWidget = {
          id: Date.now().toString(),
          type: 'news',
          source: 'weibo',
          w: 3, h: 4,
          x, y
      };

      setConfig(prev => ({
          ...prev,
          layout: [...prev.layout, newWidget]
      }));
      setAddMenu({ ...addMenu, visible: false });
  };

  const handleAddHistoryWidget = () => {
      const { x, y } = findEmptySpot(2, 3);

      const newWidget = {
          id: Date.now().toString(),
          type: 'history',
          w: 2, h: 3, // Poster aspect ratio
          x, y
      };

      setConfig(prev => ({
          ...prev,
          layout: [...prev.layout, newWidget]
      }));
      setAddMenu({ ...addMenu, visible: false });
  };

  const handleSetWallpaper = (url) => {
      setConfig(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          wallpaper: {
            type: 'url',
            value: url
          }
        }
      }));
  };

  const handleAddBingWidget = () => {
      const { x, y } = findEmptySpot(4, 3);

      const newWidget = {
          id: Date.now().toString(),
          type: 'bing',
          w: 4, h: 3, // Landscape photo aspect ratio
          x, y
      };

      setConfig(prev => ({
          ...prev,
          layout: [...prev.layout, newWidget]
      }));
      setAddMenu({ ...addMenu, visible: false });
  };

  const handleAddRandomImageWidget = (type) => {
      const { x, y } = findEmptySpot(3, 4);

      const newWidget = {
          id: Date.now().toString(),
          type: type, // heisi, baisi, jk
          w: 3, h: 4, // Portrait aspect ratio
          x, y
      };

      setConfig(prev => ({
          ...prev,
          layout: [...prev.layout, newWidget]
      }));
      setAddMenu({ ...addMenu, visible: false });
  };

  const handleRandomWallpaper = async (type) => {
      try {
          const res = await fetch(`https://v2.xxapi.cn/api/random4kPic?type=${type}`);
          const data = await res.json();
          // Loose equality to handle both string "200" and number 200
          if (data.code == 200) {
              handleSetWallpaper(data.data);
          } else {
              alert("获取壁纸失败，请重试");
          }
      } catch (e) {
          alert("网络错误，请检查网络连接");
      }
  };

  const handleAddNotesWidget = () => {
      const { x, y } = findEmptySpot(2, 2);

      const newWidget = {
          id: Date.now().toString(),
          type: 'notes',
          content: '',
          w: 2, h: 2,
          x, y
      };

      setConfig(prev => ({
          ...prev,
          layout: [...prev.layout, newWidget]
      }));
      setAddMenu({ ...addMenu, visible: false });
  };

  const handleAddTodoWidget = () => {
      const { x, y } = findEmptySpot(2, 3);

      const newWidget = {
          id: Date.now().toString(),
          type: 'todo',
          todos: [],
          w: 2, h: 3,
          x, y
      };

      setConfig(prev => ({
          ...prev,
          layout: [...prev.layout, newWidget]
      }));
      setAddMenu({ ...addMenu, visible: false });
  };

  const handleAddCountdownWidget = () => {
      const { x, y } = findEmptySpot(2, 2);

      const newWidget = {
          id: Date.now().toString(),
          type: 'countdown',
          title: '重要日子',
          targetDate: '',
          w: 2, h: 2,
          x, y
      };

      setConfig(prev => ({
          ...prev,
          layout: [...prev.layout, newWidget]
      }));
      setAddMenu({ ...addMenu, visible: false });
  };

  // --- 右键菜单处理 ---
  const handleBackgroundContextMenu = (e) => {
      e.preventDefault();
      // Only trigger if clicking directly on the background container
      if(e.target === e.currentTarget) {
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            itemId: null,
            isBackground: true
        });
        setClockContextMenu({ visible: false, x:0, y:0 });
        setShowEngineMenu(false);
      }
  };

  const handleContextMenu = (e, item) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          itemId: item.id,
          isBackground: false
      });
      setClockContextMenu({ visible: false, x:0, y:0 });
  };

  const handleCloseContextMenu = () => {
      setContextMenu({ ...contextMenu, visible: false });
      setClockContextMenu({ ...clockContextMenu, visible: false });
  };

  const handleContextMenuAction = (action) => {
      const { itemId, isBackground } = contextMenu;
      
      if (action === 'add_shortcut') {
          handleAddShortcut();
      } else if (action === 'add_weather') {
          handleAddWeatherWidget();
      } else if (action === 'add_news') {
          handleAddNewsWidget();
      } else if (action === 'add_history') {
          handleAddHistoryWidget();
      } else if (action === 'add_bing') {
          handleAddBingWidget();
      } else if (action === 'add_heisi') {
          handleAddRandomImageWidget('heisi');
      } else if (action === 'add_baisi') {
          handleAddRandomImageWidget('baisi');
      } else if (action === 'add_jk') {
          handleAddRandomImageWidget('jk');
      } else if (action === 'add_notes') {
          handleAddNotesWidget();
      } else if (action === 'add_todo') {
          handleAddTodoWidget();
      } else if (action === 'add_countdown') {
          handleAddCountdownWidget();
      } else if (itemId) {
        const item = config.layout.find(i => i.id === itemId);
        if (action === 'edit') {
            if (item.type === 'icon') {
                handleEditIcon(itemId);
            } else if (item.type === 'weather') {
                const newCity = prompt("修改城市 (留空自动检测)", item.city);
                if (newCity !== null) {
                    setConfig(prev => ({
                        ...prev,
                        layout: prev.layout.map(i => i.id === itemId ? { ...i, city: newCity } : i)
                    }));
                }
            }
        } else if (action === 'delete') {
             handleDeleteItem(itemId);
        } else if (action === 'open_new_tab') {
            if (item && item.url) window.open(item.url, '_blank');
        }
      }
      handleCloseContextMenu();
  };

  const handleDeleteItem = (id) => {
    setConfig(prev => ({
        ...prev,
        layout: prev.layout.filter(item => item.id !== id)
    }));
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 relative select-none bg-cover bg-center transition-all duration-700 ease-in-out"
      style={{ 
        backgroundImage: config.settings?.wallpaper?.value ? `url('${config.settings.wallpaper.value}')` : undefined 
      }}
      onClick={() => {
          handleCloseContextMenu();
          setShowEngineMenu(false);
          setAddMenu({ ...addMenu, visible: false });
      }}
      onContextMenu={handleBackgroundContextMenu}
    >
      {/* 动态遮罩层: 根据是否有壁纸调整透明度 */}
      <div 
        className={`absolute inset-0 bg-black/40 z-0 pointer-events-none transition-all duration-700 ${config.settings?.wallpaper?.value ? 'opacity-100' : 'opacity-0'}`}
        style={{ backdropFilter: `blur(${config.settings.blur ?? 3}px)` }}
      ></div>
      {/* 渐变遮罩，增加底部可读性 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none z-0"></div>

      {/* 内容区域 (z-index 10) */}
      <div className="z-10 w-full flex flex-col items-center animate-fade-in-up">
      
      {/* --- 时钟组件 (可开关) --- */}
      <div className={`transition-all duration-500 ease-out transform ${config.settings.showClock ? 'opacity-100 translate-y-0 scale-100 mb-4' : 'opacity-0 -translate-y-4 scale-95 h-0 overflow-hidden'}`}>
        {config.settings.showClock && (
            <ClockWidget 
                showSeconds={config.settings.clockShowSeconds} 
                styleType={config.settings.clockStyle || 'default'}
                onContextMenu={handleClockContextMenu}
            />
        )}
      </div>

      {/* --- 搜索栏 --- */}
      <div className="w-full max-w-2xl mb-16 relative group transition-all duration-300 hover:scale-[1.02] z-20">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center">
            <button 
                className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white outline-none"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowEngineMenu(!showEngineMenu);
                }}
            >
                 {config.settings.searchEngine === 'google' && <span className="font-bold text-blue-400">G</span>}
                 {config.settings.searchEngine === 'bing' && <span className="font-bold text-blue-500">b</span>}
                 {config.settings.searchEngine === 'baidu' && <span className="font-bold text-blue-600">du</span>}
                 <ChevronDown size={12} className={`transition-transform ${showEngineMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {/* 搜索引擎下拉菜单 */}
            {showEngineMenu && (
                <div className="absolute top-full left-0 mt-2 w-32 bg-gray-800/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                    {Object.entries(SEARCH_ENGINES).map(([key, engine]) => (
                        <button
                            key={key}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSearchEngineChange(key);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors flex items-center justify-between ${config.settings.searchEngine === key ? 'text-blue-400' : 'text-gray-200'}`}
                        >
                            {engine.name}
                            {config.settings.searchEngine === key && <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
                        </button>
                    ))}
                </div>
            )}
        </div>
        <input 
            type="text" 
            className="block w-full pl-20 pr-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-black/40 focus:border-transparent backdrop-blur-md transition-all shadow-lg hover:bg-white/15 hover:shadow-xl text-lg tracking-wide" 
            placeholder={SEARCH_ENGINES[config.settings.searchEngine || 'bing'].placeholder}
            onKeyDown={(e) => {
                if(e.key === 'Enter') {
                    const engine = SEARCH_ENGINES[config.settings.searchEngine || 'bing'];
                    window.location.href = `${engine.url}${encodeURIComponent(e.target.value)}`;
                }
            }}
        />
      </div>

      {/* --- 时钟右键菜单 --- */}
      {clockContextMenu.visible && (
        <div 
          className="fixed z-50 w-48 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: clockContextMenu.y, left: clockContextMenu.x }}
          onContextMenu={(e) => e.preventDefault()}
        >
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">时钟样式</div>
            <button onClick={() => changeClockStyle('default')} className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 ${config.settings.clockStyle === 'default' ? 'text-blue-400' : 'text-gray-200'}`}>
                <Clock size={14} /> 默认简约
            </button>
            <button onClick={() => changeClockStyle('electronic')} className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 ${config.settings.clockStyle === 'electronic' ? 'text-blue-400' : 'text-gray-200'}`}>
                <Monitor size={14} /> 电子风格
            </button>
            <button onClick={() => changeClockStyle('mechanical')} className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 ${config.settings.clockStyle === 'mechanical' ? 'text-blue-400' : 'text-gray-200'}`}>
                <Watch size={14} /> 机械表盘
            </button>
             <button onClick={() => changeClockStyle('alarm')} className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 ${config.settings.clockStyle === 'alarm' ? 'text-blue-400' : 'text-gray-200'}`}>
                <AlarmClock size={14} /> 复古闹钟
            </button>
            
            <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
            
            <button onClick={toggleClockSeconds} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center justify-between">
                <span>显示秒数</span>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${config.settings.clockShowSeconds ? 'bg-blue-500' : 'bg-gray-600'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.settings.clockShowSeconds ? 'left-4.5' : 'left-0.5'}`}></div>
                </div>
            </button>
        </div>
      )}

      {/* --- 拖拽上下文 --- */}
      <DndContext 
        sensors={sensors}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div 
            className="grid max-w-7xl mx-auto w-full gap-4 relative"
            style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_ROWS}, minmax(100px, 1fr))`,
                minHeight: '80vh', // Use minHeight to allow expansion
                height: 'auto'
            }}
        >
            {/* Render Grid Cells */}
            {Array.from({ length: GRID_ROWS }).map((_, row) => (
                Array.from({ length: GRID_COLS }).map((_, col) => {
                    const x = col + 1;
                    const y = row + 1;
                    return (
                        <GridCell key={`cell-${x}-${y}`} x={x} y={y}>
                            {/* Content is absolutely positioned via DraggableItem, but checking here if we want to render something inside cell */}
                        </GridCell>
                    );
                })
            ))}

            {/* Render Items */}
            {config.layout.map((item) => (
              <DraggableItem 
                  key={item.id} 
                  item={item} 
                  isValid={dragState.activeId === item.id ? dragState.isValid : true}
                  onContextMenu={handleContextMenu}
                  onDelete={() => handleDeleteItem(item.id)}
                  onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                  onSetWallpaper={handleSetWallpaper}
               />
            ))}
        </div>
      </DndContext>

      {/* --- 编辑图标弹窗 --- */}
      {editIconModal.visible && (
        <EditIconModal 
            item={editIconModal.item} 
            title={editIconModal.isAdding ? "添加快捷方式" : "编辑图标"}
            onClose={() => setEditIconModal({ visible: false, item: null, isAdding: false })} 
            onSave={handleIconSave}
        />
      )}

      {/* --- 壁纸选择器弹窗 --- */}
      {showWallpaperPicker && (
        <WallpaperPickerModal 
            onClose={() => setShowWallpaperPicker(false)}
            onSelect={handleSetWallpaper}
        />
      )}

      {/* --- 添加菜单 (Fixed Position) --- */}
      {addMenu.visible && (
        <div 
            className="fixed z-[60] w-40 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 bottom-24 right-24 origin-bottom-right"
            onClick={(e) => e.stopPropagation()}
        >
            <button onClick={(e) => { e.stopPropagation(); handleAddShortcut(); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <LinkIcon size={14} /> 快捷方式
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleAddWeatherWidget(); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <CloudSun size={14} /> 天气组件
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleAddNewsWidget(); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <Flame size={14} /> 热搜榜单
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleAddHistoryWidget(); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <Calendar size={14} /> 历史今天
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleAddBingWidget(); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <ImageIcon size={14} /> 必应美图
            </button>
            <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
            <button onClick={(e) => { e.stopPropagation(); handleAddRandomImageWidget('heisi'); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <Sparkles size={14} /> 随机黑丝
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleAddRandomImageWidget('baisi'); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <Palette size={14} /> 随机白丝
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleAddRandomImageWidget('jk'); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <Camera size={14} /> 随机JK
            </button>
            <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
            <button onClick={(e) => { e.stopPropagation(); handleAddNotesWidget(); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <StickyNote size={14} /> 便签
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleAddTodoWidget(); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <CheckSquare size={14} /> 待办事项
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleAddCountdownWidget(); }} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                <Hourglass size={14} /> 倒数日
            </button>
        </div>
      )}

      </div>{/* End of Content Container */}

      {/* --- 设置按钮 --- */}
      <div className="fixed bottom-8 right-8 z-[60] flex gap-4">
        {/* 添加按钮 */}
        <div className="flex flex-col items-center justify-center p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-300 cursor-pointer border border-white/20 shadow-lg hover:scale-110 group"
             onClick={handleAddClick}>
            <Plus size={24} className="text-white" />
        </div>

        {/* 设置按钮 */}
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-full text-white backdrop-blur-md transition-all duration-300 shadow-lg hover:rotate-90 border border-white/20 ${showSettings ? 'bg-white/20 rotate-90' : 'bg-black/30 hover:bg-black/50'}`}>
          <Settings size={24} />
        </button>
      </div>

      {/* --- 设置面板 --- */}
      {showSettings && (
        <div className="fixed bottom-24 right-8 w-72 bg-gray-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 text-white transform transition-all origin-bottom-right z-[70]">
          <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
            <Settings size={18} /> 设置
          </h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {/* 壁纸设置 */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">壁纸</label>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowWallpaperPicker(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 py-2 rounded-lg text-xs border border-blue-500/30 transition-colors">
                        <ImageIcon size={14} /> 精选壁纸库
                    </button>
                    <button 
                        onClick={() => wallpaperInputRef.current.click()}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs transition-colors">
                        <Upload size={14} /> 上传图片
                    </button>
                    <input 
                        type="file" 
                        ref={wallpaperInputRef}
                        onChange={handleWallpaperUpload}
                        className="hidden" 
                        accept="image/*"
                    />
                </div>
                <input 
                    type="text" 
                    placeholder="或输入图片 URL..."
                    value={config.settings?.wallpaper?.type === 'url' ? config.settings.wallpaper.value : ''}
                    onChange={handleWallpaperUrlChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <div className="text-[10px] text-gray-500">* 上传图片将保存在本地配置中</div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-400 uppercase">背景模糊</label>
                    <span className="text-xs text-gray-400">{config.settings.blur ?? 3}px</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    value={config.settings.blur ?? 3}
                    onChange={handleBlurChange}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-400 uppercase">随机 4K 壁纸</label>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => handleRandomWallpaper('acg')}
                        className="flex-1 py-2 px-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 text-xs border border-pink-500/30 transition-all"
                     >
                        二次元 4K
                     </button>
                     <button 
                        onClick={() => handleRandomWallpaper('wallpaper')}
                        className="flex-1 py-2 px-2 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-300 text-xs border border-green-500/30 transition-all"
                     >
                        风景 4K
                     </button>
                 </div>
            </div>

            <div className="border-t border-white/5 my-2"></div>

            {/* 搜索引擎选择 */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">搜索引擎</label>
                <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                    {Object.entries(SEARCH_ENGINES).map(([key, engine]) => (
                        <button
                            key={key}
                            onClick={() => handleSearchEngineChange(key)}
                            className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                                config.settings.searchEngine === key 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                            }`}
                        >
                            {engine.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-white/5 my-2"></div>

            {/* 组件开关 */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">组件</label>
                <button 
                    onClick={toggleClock}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 text-sm">
                        <Clock size={16} />
                        <span>数字时钟</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors relative ${config.settings.showClock ? 'bg-blue-500' : 'bg-gray-600'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.settings.showClock ? 'left-4.5' : 'left-0.5'}`} style={{ left: config.settings.showClock ? 'calc(100% - 14px)' : '2px' }}></div>
                    </div>
                </button>
            </div>

            <div className="border-t border-white/5 my-2"></div>

            {/* 数据管理 */}
            <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-400 uppercase">数据备份</label>
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left text-sm">
                  <Download size={16} />
                  <span>导出配置</span>
                </button>

                <button 
                  onClick={handleImportClick}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left text-sm">
                  <Upload size={16} />
                  <span>导入配置</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".json"
                />
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-gray-700 text-xs text-gray-400 text-center">
            KeTag v1.1.0
          </div>
        </div>
      )}
      {/* --- 右键菜单 (通用) --- */}
      {contextMenu.visible && (
          <div 
            className="fixed z-50 w-40 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onContextMenu={(e) => e.preventDefault()}
          >
              {contextMenu.isBackground ? (
                  <>
                    <button onClick={() => handleContextMenuAction('add_shortcut')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <LinkIcon size={14} /> 添加图标
                    </button>
                    <button onClick={() => handleContextMenuAction('add_weather')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <CloudSun size={14} /> 添加天气
                    </button>
                    <button onClick={() => handleContextMenuAction('add_news')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <Flame size={14} /> 添加热搜
                    </button>
                    <button onClick={() => handleContextMenuAction('add_history')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <Calendar size={14} /> 历史今天
                    </button>
                    <button onClick={() => handleContextMenuAction('add_bing')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <ImageIcon size={14} /> 必应美图
                    </button>
                    <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
                    <button onClick={() => handleContextMenuAction('add_heisi')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <Sparkles size={14} /> 随机黑丝
                    </button>
                    <button onClick={() => handleContextMenuAction('add_baisi')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <Palette size={14} /> 随机白丝
                    </button>
                    <button onClick={() => handleContextMenuAction('add_jk')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <Camera size={14} /> 随机JK
                    </button>
                    <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
                    <button onClick={() => handleContextMenuAction('add_notes')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <StickyNote size={14} /> 添加便签
                    </button>
                    <button onClick={() => handleContextMenuAction('add_todo')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <CheckSquare size={14} /> 添加待办
                    </button>
                    <button onClick={() => handleContextMenuAction('add_countdown')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <Hourglass size={14} /> 添加倒数日
                    </button>
                  </>
              ) : (
                  <>
                    {config.layout.find(i => i.id === contextMenu.itemId)?.type === 'icon' && (
                        <button onClick={() => handleContextMenuAction('open_new_tab')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                            <Globe size={14} /> 新标签页打开
                        </button>
                    )}
                    
                    <div className="h-[1px] bg-white/10 my-1 mx-2"></div>

                    <button onClick={() => handleContextMenuAction('edit')} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <Settings size={14} /> 编辑
                    </button>
                    <button onClick={() => handleContextMenuAction('delete')} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                        <Trash2 size={14} /> 删除
                    </button>
                  </>
              )}
          </div>
      )}
    </div>
  )
}
