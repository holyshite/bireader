# 项目进度 (Project Progress)

> 最后更新: 2026-05-01

## 整体状态
MVP 已完成，DeepSeek API 已接入。可正常构建运行。

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
- [x] API Key 通过 `.env` 配置，主进程读取，不暴露给前端
- [x] EPUB 导入：jszip 解压 + XML 解析 + TOC 提取 + header 导入按钮
- [x] 翻译面板宽度拖拽调整：拖拽手柄 + 260-600px 范围 + localStorage 持久化

## 备注
- **Node 版本**: v18.20.8，依赖包需用兼容版本（electron-vite@2、vite@5、pinia@2）
- **Electron 镜像**: 国内安装建议设置 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`
- **启动命令**: `npm run dev`（已内置 1.5x 缩放）
- **翻译 API**: DeepSeek V4 Pro，`src/main/ipc.ts`，API Key 存 `.env` 的 `DEEPSEEK_API_KEY`
- **WSL 系统依赖**: `sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2`
