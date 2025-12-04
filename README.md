# KeTag - 轻量级浏览器新标签页

<p align="center">
  <img src="public/128.ico" alt="KeTag Logo" width="128" height="128">
</p>


<p align="center">
  <strong>轻量 · 隐私优先 · 自由布局 · 开箱即用</strong>
</p>


---

KeTag 是一个基于 **React + Vite + TailwindCSS** 构建的浏览器新标签页扩展。  
主打**极简设计、零数据采集、纯本地存储**，让你的新标签页真正属于你自己。

## ✨ 核心特性

### 🔒 隐私优先

- **零数据采集**：不登录、不注册、不上传任何数据
- **纯本地存储**：所有配置和数据存储在浏览器本地（LocalStorage + IndexedDB）
- **开箱即用**：安装即可使用，无需任何配置

### 🎨 自由布局

- **拖拽式网格布局**：基于 `dnd-kit` 实现流畅的拖拽体验
- **自定义快捷方式**：支持任意网站，可自定义图标（URL / 本地上传 / 纯色文字）
- **灵活尺寸**：快捷方式支持 1×1、1×2、2×1、2×2 多种尺寸

### 🧩 丰富组件

| 组件                | 描述                                  |
| ------------------- | ------------------------------------- |
| ⏰ **时钟**          | 多种样式可选，支持显示秒数            |
| 🌤️ **天气**          | 自动定位或手动设置城市，显示实时天气  |
| 📰 **热榜**          | 微博、抖音、百度热搜实时展示          |
| 📅 **历史上的今天**  | 每日历史事件回顾                      |
| 🖼️ **Bing 每日美图** | 自动获取 Bing 每日壁纸                |
| 🎴 **随机图片**      | 支持多种图片 API（黑丝、白丝、JK 等） |
| 📝 **便签**          | 简洁的便签记录                        |
| ✅ **待办事项**      | 任务清单管理                          |
| ⏳ **倒计时**        | 自定义目标日期倒计时                  |

### 🖼️ 壁纸系统

- **本地上传**：支持上传自定义壁纸（使用 IndexedDB 存储，不占用 LocalStorage 配额）
- **URL 壁纸**：直接输入图片链接
- **随机 4K 壁纸**：一键获取高清壁纸（支持动漫、风景、美女等分类）
- **壁纸选择器**：并发请求多张壁纸供你挑选
- **背景模糊**：可调节模糊程度，确保内容清晰可读

### ⚙️ 配置管理

- **导出配置**：一键导出 JSON 格式配置文件
- **导入配置**：跨设备迁移，快速恢复个性化设置
- **搜索引擎切换**：支持 Google、Bing、百度

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 1. 克隆项目

```bash
git clone https://github.com/your-username/KeTag.git
cd KeTag/ketag-web-ext
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式

```bash
npm run dev
```

启动本地开发服务器，在浏览器中预览和调试。

### 4. 构建生产版本

```bash
npm run build
```

构建完成后，`dist` 目录即为可安装的扩展包。

---

## 📦 安装到浏览器

### Chrome / Edge

1. 打开扩展管理页面：
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
2. 开启右上角的 **"开发者模式"**
3. 点击 **"加载已解压的扩展程序"**
4. 选择项目下的 `dist` 目录
5. 打开新标签页，即可看到 KeTag ✨

### 更新扩展

修改代码后：

1. 运行 `npm run build`
2. 在扩展管理页面点击 KeTag 卡片上的 **刷新** 按钮

---

## 📁 项目结构

```
ketag-web-ext/
├── public/                 # 静态资源（图标、manifest.json）
├── src/
│   ├── components/         # React 组件
│   │   ├── WeatherWidget.jsx      # 天气组件
│   │   ├── NewsWidget.jsx         # 热榜组件
│   │   ├── ClockWidget.jsx        # 时钟组件
│   │   ├── HistoryWidget.jsx      # 历史上的今天
│   │   ├── BingWidget.jsx         # Bing 每日美图
│   │   ├── RandomImageWidget.jsx  # 随机图片
│   │   ├── NotesWidget.jsx        # 便签
│   │   ├── TodoWidget.jsx         # 待办事项
│   │   ├── CountdownWidget.jsx    # 倒计时
│   │   ├── DraggableItem.jsx      # 可拖拽项目
│   │   ├── EditIconModal.jsx      # 图标编辑弹窗
│   │   └── WallpaperPickerModal.jsx # 壁纸选择器
│   ├── App.jsx             # 主应用组件
│   ├── main.jsx            # 入口文件
│   └── index.css           # 全局样式
├── xx-api/                 # API 文档
├── dist/                   # 构建输出（gitignore）
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🛠️ 技术栈

| 技术             | 用途                         |
| ---------------- | ---------------------------- |
| **React 18**     | UI 框架                      |
| **Vite**         | 构建工具                     |
| **TailwindCSS**  | 样式框架                     |
| **dnd-kit**      | 拖拽交互                     |
| **idb-keyval**   | IndexedDB 封装（大文件存储） |
| **Lucide React** | 图标库                       |

---

## 📝 使用说明

### 添加快捷方式

1. 右键空白区域 → 选择 **"添加快捷方式"**
2. 填写标题、URL
3. 选择图标来源：
   - **URL**：输入图标地址或从网站自动获取
   - **上传**：选择本地图片
   - **文字**：使用纯色背景 + 文字作为图标
4. 设置尺寸（1×1 到 2×2）

### 添加组件

右键空白区域 → 选择需要的组件类型

### 编辑/删除

右键已有项目 → 选择 **"编辑"** 或 **"删除"**

### 调整布局

直接拖拽项目到目标位置

### 更换壁纸

点击右上角 **设置图标** → 选择壁纸来源

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

<p align="center">
  Made with ❤️ for a better browsing experience
</p>

