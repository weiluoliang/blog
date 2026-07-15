---
title: Linux常用指令
description: Linux常用指令
date: 2026-07-15
tags: [Linux]
order: 3
---

## rsync
```shell
rsync -av --progress 源路径 目标路径
# 或者用它的简写形式 -P
rsync -avP 源路径 目标路径
# 整体进度：展示所有文件的汇总进度
rsync -av --info=progress2 源路径 目标路径

rsync -avP /本地/源文件夹/ /本地/目标文件夹/

# 压缩节省带宽
rsync -avzP /本地/源文件夹/ 用户名@远程IP:/远程/目标目录/
```
