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


## SSH 免密登录
```shell
# 1.检查是否有密钥
ls ~/.ssh/id_rsa.pub  

# 2. 生成密钥  ，如果步骤1提示 No such file or directory
ssh-keygen -t rsa -b 4096 -C "your_email@example.com" 

# 3. 将公钥上传到服务器
ssh-copy-id root@你的服务器IP  
```