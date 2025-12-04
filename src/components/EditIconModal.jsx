import { useState, useEffect, useRef } from 'react';
import { X, Upload, Type, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

export default function EditIconModal({ item, title = '编辑图标', onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    w: 1,
    h: 1,
    iconType: 'url', // 'url', 'upload', 'text'
    iconValue: '',   // url string or base64 or text content
    backgroundColor: '#3b82f6' // for text type
  });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        url: item.url || '',
        w: item.w || 1,
        h: item.h || 1,
        iconType: item.iconType || 'url',
        iconValue: item.icon || '',
        backgroundColor: item.backgroundColor || '#3b82f6'
      });
    }
  }, [item]);

  const handleSave = () => {
    // Validate
    let finalIcon = formData.iconValue;
    
    // If URL type but no value, try to auto-fetch
    if (formData.iconType === 'url' && !finalIcon && formData.url) {
         finalIcon = `https://www.google.com/s2/favicons?domain=${formData.url}&sz=128`;
    }

    onSave(item.id, {
        title: formData.title,
        url: formData.url,
        w: Number(formData.w),
        h: Number(formData.h),
        iconType: formData.iconType,
        icon: finalIcon,
        backgroundColor: formData.backgroundColor
    });
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 500 * 1024) {
        alert("图标建议小于 500KB");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        setFormData(prev => ({ ...prev, iconType: 'upload', iconValue: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-[400px] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <h3 className="text-white font-bold">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
                {/* Title & URL */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">标题</label>
                        <input 
                            type="text" 
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            placeholder="输入标题"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">链接 (URL)</label>
                        <input 
                            type="text" 
                            value={formData.url}
                            onChange={e => setFormData({...formData, url: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            placeholder="https://example.com"
                        />
                    </div>
                </div>

                {/* Size */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">宽度 (列)</label>
                        <select 
                            value={formData.w}
                            onChange={e => setFormData({...formData, w: Number(e.target.value)})}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value={1}>1 格</option>
                            <option value={2}>2 格</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">高度 (行)</label>
                        <select 
                            value={formData.h}
                            onChange={e => setFormData({...formData, h: Number(e.target.value)})}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value={1}>1 格</option>
                            <option value={2}>2 格</option>
                        </select>
                    </div>
                </div>

                {/* Icon Type */}
                <div>
                    <label className="block text-xs text-gray-400 mb-2">图标样式</label>
                    <div className="flex bg-black/20 p-1 rounded-lg border border-white/10">
                        <button 
                            onClick={() => setFormData({...formData, iconType: 'url'})}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs transition-colors ${formData.iconType === 'url' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <LinkIcon size={12} /> 网络
                        </button>
                        <button 
                            onClick={() => setFormData({...formData, iconType: 'upload'})}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs transition-colors ${formData.iconType === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Upload size={12} /> 上传
                        </button>
                        <button 
                            onClick={() => setFormData({...formData, iconType: 'text'})}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs transition-colors ${formData.iconType === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Type size={12} /> 纯色
                        </button>
                    </div>
                </div>

                {/* Icon Content based on Type */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    {formData.iconType === 'url' && (
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                value={formData.iconValue}
                                onChange={e => setFormData({...formData, iconValue: e.target.value})}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                placeholder="图标 URL (留空则自动获取)"
                            />
                             <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center overflow-hidden">
                                     <img src={formData.iconValue || `https://www.google.com/s2/favicons?domain=${formData.url}&sz=64`} alt="Preview" className="w-5 h-5" onError={e => e.target.style.display='none'} />
                                </div>
                                <span>预览</span>
                            </div>
                        </div>
                    )}

                    {formData.iconType === 'upload' && (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
                                {formData.iconValue ? (
                                    <img src={formData.iconValue} alt="Upload" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={20} className="text-gray-500" />
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current.click()}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
                            >
                                选择图片
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        </div>
                    )}

                    {formData.iconType === 'text' && (
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs text-gray-400">文字内容</label>
                                <input 
                                    type="text" 
                                    maxLength={4}
                                    value={formData.iconValue}
                                    onChange={e => setFormData({...formData, iconValue: e.target.value})}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    placeholder="最多4字"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">背景颜色</label>
                                <input 
                                    type="color" 
                                    value={formData.backgroundColor}
                                    onChange={e => setFormData({...formData, backgroundColor: e.target.value})}
                                    className="block w-full h-8 rounded cursor-pointer bg-transparent"
                                />
                            </div>
                            {/* Preview */}
                            <div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm border border-white/10"
                                style={{ backgroundColor: formData.backgroundColor }}
                            >
                                {formData.iconValue || 'A'}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    取消
                </button>
                <button onClick={handleSave} className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                    保存修改
                </button>
            </div>
        </div>
    </div>
  );
}
