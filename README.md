# luoliang 的学习笔记

这是一个使用 Vue、Vite 和 Markdown 构建的中文静态博客系统。站点不区分中文站、英文站，所有文章都按中文分类文件夹管理，构建后输出纯静态文件。

## 启动

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物会输出到 `dist/`，可以部署到任意静态托管平台。

## 新增文章

在 `content/` 下创建中文分类文件夹，并新增 Markdown 文件：

```txt
content/
  AI/
    文章标题.md
  数据库/
    文章标题.md
  后端架构/
    文章标题.md
  部署运维/
    文章标题.md
```

文章顶部支持以下元信息：

```md
---
title: 文章标题
description: 文章摘要
date: 2026-07-11
tags: [Vue, Markdown]
order: 1
---
```

分类名称直接来自中文文件夹名，一个分类对应一个文件夹。
