import { useState, useEffect, useRef } from 'react';
import { translateAll } from './services/translators';
import type { TranslateResult } from './services/translators';
import { recognizeImage, recognizeImageFromFile } from './services/ocr';
import './App.css';

const ENGINES = [
  { id: 'all', name: '全部引擎' },
  { id: 'youdao', name: '有道翻译' },
  { id: 'mymemory', name: 'MyMemory' },
  { id: 'baidu', name: '百度翻译' },
  { id: 'google', name: '谷歌翻译' },
  { id: 'ai', name: 'AI翻译' },
];

const TARGET_LANGS = [
  { id: 'zh-CN', name: '中文' },
  { id: 'en', name: 'English' },
  { id: 'ja', name: '日本語' },
  { id: 'ko', name: '한국어' },
  { id: 'fr', name: 'Français' },
  { id: 'de', name: 'Deutsch' },
];

function App() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<TranslateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedEngine, setSelectedEngine] = useState('all');
  const [targetLang, setTargetLang] = useState('zh-CN');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    // 监听剪贴板快捷键
    window.electronAPI?.onClipboardText((text: string) => {
      setInputText(text);
      handleTranslate(text);
    });
  }, []);

  const handleTranslate = async (text?: string) => {
    const textToTranslate = text || inputText;
    if (!textToTranslate.trim()) return;

    setLoading(true);
    try {
      const translateResults = await translateAll(textToTranslate, selectedEngine, targetLang);
      setResults(translateResults);
    } catch (error) {
      console.error('翻译失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      // 先尝试获取图片
      const imageData = await window.electronAPI?.getClipboardImage();
      if (imageData) {
        setImagePreview(imageData);
        await handleOCR(imageData);
        return;
      }
      // 获取文本
      const text = await window.electronAPI?.getClipboardText();
      if (text) {
        setInputText(text);
        handleTranslate(text);
      }
    } catch (error) {
      // 浏览器环境下使用navigator.clipboard
      try {
        const text = await navigator.clipboard.readText();
        setInputText(text);
        handleTranslate(text);
      } catch (e) {
        console.error('无法读取剪贴板:', e);
      }
    }
  };

  const handleOCR = async (imageDataUrl: string) => {
    setOcrLoading(true);
    try {
      const result = await recognizeImage(imageDataUrl);
      if (result.text) {
        setInputText(result.text);
        handleTranslate(result.text);
      }
    } catch (error) {
      console.error('OCR失败:', error);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const result = await recognizeImageFromFile(file);
      if (result.text) {
        setInputText(result.text);
        handleTranslate(result.text);
      }
    } catch (error) {
      console.error('OCR失败:', error);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleToggleAlwaysOnTop = () => {
    const newValue = !isAlwaysOnTop;
    setIsAlwaysOnTop(newValue);
    window.electronAPI?.setAlwaysOnTop(newValue);
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setOpacity(value);
    window.electronAPI?.setOpacity(value);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('title-bar')) {
      dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY };
    }
  };

  return (
    <div className="app-container" style={{ opacity }}>
      {/* 标题栏 - Mac风格 */}
      <div className="title-bar" onMouseDown={handleMouseDown}>
        <div className="window-controls">
          <button className="close-btn" onClick={() => window.electronAPI?.closeWindow()} title="关闭">
            <svg width="6" height="6" viewBox="0 0 6 6"><path d="M0 0L6 6M6 0L0 6" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
          <button className="min-btn" onClick={() => window.electronAPI?.minimizeWindow()} title="最小化">
            <svg width="8" height="2" viewBox="0 0 8 2"><path d="M0 1H8" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
          <button
            className={`pin-btn ${isAlwaysOnTop ? 'active' : ''}`}
            onClick={handleToggleAlwaysOnTop}
            title="置顶"
          >
            <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="currentColor" /></svg>
          </button>
        </div>
        <span className="title">翻译</span>
        <div className="title-spacer"></div>
      </div>

      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-item">
          <span>引擎</span>
          <select value={selectedEngine} onChange={(e) => setSelectedEngine(e.target.value)}>
            {ENGINES.map((engine) => (
              <option key={engine.id} value={engine.id}>{engine.name}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-item">
          <span>目标</span>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {TARGET_LANGS.map((lang) => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>
        <div className="opacity-slider">
          <span>透明</span>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.1"
            value={opacity}
            onChange={handleOpacityChange}
          />
        </div>
      </div>

      {/* 主内容区 - 左右布局 */}
      <div className="main-content">
        {/* 左侧 - 原文输入 */}
        <div className="left-panel">
          <div className="panel-label">原文</div>
          <div className="input-section">
            {/* 图片预览 */}
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="预览" />
                <button onClick={() => setImagePreview(null)}>✕</button>
              </div>
            )}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入要翻译的文本..."
            />
            <div className="action-buttons">
              <button onClick={() => handleTranslate()} disabled={loading || !inputText.trim()}>
                {loading ? '翻译中...' : '翻译'}
              </button>
              <button className="secondary" onClick={handlePasteFromClipboard} disabled={ocrLoading}>
                {ocrLoading ? '识别中...' : '粘贴'}
              </button>
              <button className="secondary" onClick={() => fileInputRef.current?.click()} disabled={ocrLoading}>
                图片
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </div>

        {/* 右侧 - 翻译结果 */}
        <div className="right-panel">
          <div className="panel-label">译文</div>
          <div className="results-section">
            {results.length === 0 ? (
              <div className="empty-hint">
                <div className="empty-hint-icon">📝</div>
                <div>翻译结果将显示在这里</div>
              </div>
            ) : (
              results.map((result, index) => (
                <div key={index} className={`result-card ${result.error ? 'error' : ''}`}>
                  <div className="result-header">
                    <span className="engine-name">{result.engine}</span>
                    {result.time && <span className="result-time">{result.time}ms</span>}
                  </div>
                  <div className="result-text">
                    {result.error ? result.error : result.result || '无结果'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="shortcuts-hint">
        <span><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd> 显示/隐藏</span>
        <span><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd> 翻译剪贴板</span>
      </div>
    </div>
  );
}

export default App;
