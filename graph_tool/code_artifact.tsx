import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Move, Trash2, Maximize2, RotateCw, Image as ImageIcon } from 'lucide-react';

export default function App() {
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // 处理图片上传
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          src: event.target.result,
          x: 200 + Math.random() * 50, // 初始随机错开一点位置
          y: 200 + Math.random() * 50,
          scale: 1,
          rotation: 0
        };
        setImages(prev => [...prev, newImage]);
        setSelectedId(newImage.id); // 默认选中最新上传的
      };
      reader.readAsDataURL(file);
    });
  };

  // 更新图片属性
  const updateImage = (id, newProps) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...newProps } : img));
  };

  // 删除图片
  const deleteImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // 鼠标按下开始拖拽
  const handlePointerDown = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    const img = images.find(i => i.id === id);
    if (img) {
      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        initialX: img.x,
        initialY: img.y
      });
    }
  };

  // 鼠标移动处理拖拽
  const handlePointerMove = (e) => {
    if (!dragState.isDragging || !selectedId) return;
    
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    
    updateImage(selectedId, {
      x: dragState.initialX + dx,
      y: dragState.initialY + dy
    });
  };

  // 鼠标抬起结束拖拽
  const handlePointerUp = () => {
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: false }));
    }
  };

  // 滚轮缩放选中的图片
  const handleWheel = (e, id) => {
    if (selectedId !== id) return;
    e.preventDefault();
    const img = images.find(i => i.id === id);
    if (img) {
      const scaleChange = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(0.1, Math.min(5, img.scale + scaleChange));
      updateImage(id, { scale: parseFloat(newScale.toFixed(2)) });
    }
  };

  // 导出JSON配置
  const exportData = () => {
    if (images.length === 0) {
      alert('没有可以导出的图片数据！');
      return;
    }
    
    const exportConfig = images.map(img => ({
      name: img.name,
      x: Math.round(img.x),
      y: Math.round(img.y),
      scale: parseFloat(img.scale.toFixed(3)),
      rotation: Math.round(img.rotation)
    }));

    const dataStr = JSON.stringify(exportConfig, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scene_layout.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 取消选中
  const handleBackgroundClick = () => {
    setSelectedId(null);
  };

  const selectedImage = images.find(img => img.id === selectedId);

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans text-gray-800">
      {/* 左侧工作区 (画布) */}
      <div 
        className="flex-1 relative overflow-hidden bg-slate-900 shadow-inner"
        style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleBackgroundClick}
      >
        {images.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>请在右侧面板上传图片开始编辑</p>
            </div>
          </div>
        )}

        {images.map((img) => (
          <div
            key={img.id}
            onPointerDown={(e) => handlePointerDown(e, img.id)}
            onWheel={(e) => handleWheel(e, img.id)}
            className={`absolute cursor-move origin-center flex items-center justify-center ${
              selectedId === img.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent z-10' : 'z-0'
            }`}
            style={{
              transform: `translate(${img.x}px, ${img.y}px) scale(${img.scale}) rotate(${img.rotation}deg)`,
              // 使用 translate 而不是 left/top，动画和性能更好
              left: 0,
              top: 0,
              touchAction: 'none' // 防止触摸屏上的默认滚动
            }}
          >
            <img 
              src={img.src} 
              alt={img.name} 
              draggable={false}
              className="max-w-none shadow-lg select-none"
              style={{ display: 'block' }} 
            />
          </div>
        ))}
      </div>

      {/* 右侧控制面板 */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-bold text-gray-700">场景编辑器</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 上传区域 */}
          <div className="space-y-2">
            <label className="flex items-center justify-center w-full h-20 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-400 focus:outline-none">
                <span className="flex items-center space-x-2 text-gray-600">
                    <Upload className="w-5 h-5" />
                    <span className="font-medium text-sm">点击选择或拖拽图片</span>
                </span>
                <input type="file" name="file_upload" className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>

          {/* 选中图片的属性调节 */}
          {selectedImage ? (
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
              <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                <h3 className="font-semibold text-blue-800 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  当前选中: <span className="ml-1 text-sm truncate max-w-[100px]" title={selectedImage.name}>{selectedImage.name}</span>
                </h3>
                <button onClick={() => deleteImage(selectedImage.id)} className="text-red-500 hover:text-red-700 transition" title="删除图片">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* X 坐标 */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center"><Move className="w-3 h-3 mr-1"/> X 坐标</span>
                  <span>{Math.round(selectedImage.x)} px</span>
                </div>
                <input 
                  type="range" min="-1000" max="2000" 
                  value={selectedImage.x} 
                  onChange={(e) => updateImage(selectedImage.id, { x: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Y 坐标 */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center"><Move className="w-3 h-3 mr-1"/> Y 坐标</span>
                  <span>{Math.round(selectedImage.y)} px</span>
                </div>
                <input 
                  type="range" min="-1000" max="2000" 
                  value={selectedImage.y} 
                  onChange={(e) => updateImage(selectedImage.id, { y: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* 缩放 */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center"><Maximize2 className="w-3 h-3 mr-1"/> 缩放倍率</span>
                  <span>{selectedImage.scale.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" min="0.1" max="5" step="0.05"
                  value={selectedImage.scale} 
                  onChange={(e) => updateImage(selectedImage.id, { scale: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* 旋转 */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center"><RotateCw className="w-3 h-3 mr-1"/> 旋转角度</span>
                  <span>{Math.round(selectedImage.rotation)}°</span>
                </div>
                <input 
                  type="range" min="-180" max="180" 
                  value={selectedImage.rotation} 
                  onChange={(e) => updateImage(selectedImage.id, { rotation: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center text-sm text-gray-500">
              请在左侧画布中点击选中一张图片以调整其属性
            </div>
          )}

          {/* 已加载图片列表 */}
          {images.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">图层列表 ({images.length})</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {images.map(img => (
                  <div 
                    key={img.id}
                    onClick={() => setSelectedId(img.id)}
                    className={`flex items-center justify-between p-2 text-sm rounded cursor-pointer transition ${
                      selectedId === img.id ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span className="truncate w-3/4">{img.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 导出按钮区域 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={exportData}
            disabled={images.length === 0}
            className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg font-medium transition ${
              images.length > 0 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            导出数据配置 (JSON)
          </button>
        </div>
      </div>
    </div>
  );
}