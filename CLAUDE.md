# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
bireader 是一个基于 Electron 的 Windows 双语阅读软件，借助 AI 实现翻译。项目目前处于从零开始的初始化阶段。

## 进度跟踪
`process.md` 是本项目的持久进度文件。开始新对话时先读取它了解当前状态，并且完成某一个任务时需要更新此文件。

## 技术选型（待确定）
- 框架：Vue3 或 React（需在开始前与用户确认，并说明选择理由）
- 构建：Vite
- 桌面壳：Electron
- 状态管理：Pinia（Vue3）或 Zustand（React）
- 翻译服务：封装 translator service，兼容 OpenAI / Claude / 自定义 API

## 目标架构
`main/` (Electron 主进程) 与 `renderer/` (渲染进程) 分离，通过 IPC 通信处理翻译请求。

三栏布局：左侧目录栏 + 中间阅读区 + 右侧翻译栏，左右侧栏均可折叠。

## 关键约束
- API Key 不能写在前端代码中
- 需防抖处理避免频繁翻译请求
- 需缓存翻译结果避免重复请求
- 支持深色/浅色模式切换
