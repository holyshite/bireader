# 项目进度 (Project Progress)

> 最后更新: 2026-05-01

## 整体状态
MVP 完成，核心功能全部可用，require.md 所有核心需求已实现。

## 待办 (Todo)

## 进行中 (In Progress)

## 已完成 (Done)
- [x] 项目脚手架：electron-vite + Vue3 + TypeScript + Pinia
- [x] 三栏布局（目录栏 + 阅读区 + 翻译栏）+ 折叠动画
- [x] 主阅读区：段落渲染、文本选中检测、字体大小调节
- [x] AI 翻译：DeepSeek deepseek-v4-pro + OpenAI SDK + thinking 模式
- [x] 翻译缓存（TranslationCache LRU）+ 防抖处理（useDebounce 500ms）
- [x] 目录侧栏（TocSidebar）+ 深色/浅色模式切换
- [x] `electron-vite build` 构建成功（零错误）
- [x] EPUB 导入：jszip 解压 + XML 解析 + TOC 提取
- [x] 翻译面板宽度拖拽调整（260-600px + localStorage 持久化）
- [x] 软件内 API 设置面板：Key/Base URL/Model 可视化配置
- [x] TranslatorAdapter 多提供商架构：config.json 持久化存储
- [x] API Key 只存主进程 `userData/config.json`，渲染进程只知 hasKey

## 备注
- **Node 版本**: v18.20.8
- **Electron 镜像**: `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`
- **启动命令**: `npm run dev`（内置 1.5x 缩放）
- **API 配置**: 启动后点⚙设置按钮 → 输入 Key/URL/Model → 保存到本地
- **WSL 系统依赖**: `sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2`
