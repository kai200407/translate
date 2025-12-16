# 翻译贴板 (Translator Widget)

一个Windows桌面翻译贴板应用，支持多翻译引擎、AI翻译、图片OCR识别。

## 功能特性

- 🌐 **多翻译引擎**: 谷歌翻译、百度翻译、有道翻译
- 🤖 **AI翻译**: 支持Ollama本地AI模型翻译
- 🖼️ **图片OCR**: 支持图片文字识别并翻译
- 📋 **剪贴板监听**: 自动翻译剪贴板内容
- 📌 **桌面贴板**: 可拖拽、置顶、调节透明度
- ⌨️ **快捷键支持**: 
  - `Ctrl+Shift+T`: 显示/隐藏窗口
  - `Ctrl+Shift+C`: 翻译剪贴板内容

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **React + TypeScript**: 前端UI
- **Vite**: 前端构建工具
- **Tesseract.js**: OCR文字识别
- **Axios**: HTTP请求

## 开发

### 安装依赖

```bash
# 安装主项目依赖
npm install

# 安装渲染进程依赖
cd renderer && npm install
```

### 开发模式

```bash
npm start
```

### 构建

```bash
# 构建Windows安装包
npm run dist:win
```

## 配置AI翻译

默认使用Ollama本地模型，请确保：

1. 安装 [Ollama](https://ollama.ai/)
2. 运行模型: `ollama run qwen2.5:7b`

## 注意事项

- 谷歌翻译可能需要VPN
- 百度翻译和有道翻译无需VPN
- OCR识别支持中英文

## 项目结构

```
translator-widget/
├── src/main/           # Electron主进程
│   ├── main.ts         # 主进程入口
│   └── preload.ts      # 预加载脚本
├── renderer/           # React前端
│   └── src/
│       ├── App.tsx     # 主组件
│       ├── services/
│       │   ├── translators.ts  # 翻译服务
│       │   └── ocr.ts          # OCR服务
│       └── types/
│           └── electron.d.ts   # 类型定义
├── dist/               # 编译输出
├── assets/             # 资源文件（图标等）
└── release/            # 打包输出
```

## 使用方法

### 开发模式运行

```bash
# 1. 安装依赖
npm install
cd renderer && npm install && cd ..

# 2. 启动开发模式（同时启动前端和Electron）
npm start
```

### 打包成Windows软件

#### 方法1：在Windows上打包（推荐）

```bash
# 1. 安装依赖
npm install
cd renderer && npm install && cd ..

# 2. 构建并打包
npm run dist:win
```

打包完成后，安装程序位于 `release/` 目录：
- `翻译贴板 Setup x.x.x.exe` - NSIS安装程序
- `翻译贴板 x.x.x.exe` - 便携版（无需安装）

#### 方法2：在Linux/Mac上交叉编译

```bash
# 安装Wine（用于交叉编译Windows程序）
# Ubuntu/Debian:
sudo apt install wine64

# 然后运行打包命令
npm run dist:win
```

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+T` | 显示/隐藏窗口 |
| `Ctrl+Shift+C` | 翻译剪贴板内容 |

### 功能说明

1. **多引擎翻译**：支持谷歌、百度、有道、AI翻译
2. **引擎选择**：可选择单个引擎或全部引擎同时翻译
3. **目标语言**：支持中/英/日/韩/法/德语
4. **图片OCR**：支持图片文字识别并翻译
5. **剪贴板**：自动读取剪贴板文本/图片
6. **桌面贴板**：可拖拽、置顶、调节透明度

### AI翻译配置

默认使用Ollama本地模型，需要：

1. 安装 [Ollama](https://ollama.ai/)
2. 下载模型：`ollama pull qwen2.5:7b`
3. 启动Ollama服务（通常自动启动）
