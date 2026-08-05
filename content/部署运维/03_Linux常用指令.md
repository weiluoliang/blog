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

## 磁盘满排查方法总结

1. 确认哪个分区满了

```shell
df -h 
```

2. 定位大目录(逐层下钻)

```shell
# -x 很关键:不跨文件系统统计,避免把其他挂载点的量算进来
du -xh --max-depth=1 / 2>/dev/null | sort -rh

# 发现大目录后继续往下钻
du -xh --max-depth=1 /var 2>/dev/null | sort -rh
du -xh --max-depth=1 /var/log 2>/dev/null | sort -rh
```

3. 目录用量对不上时,直接找大文件
   如果某目录 du 出来很大,但子目录加起来对不上,说明大文件直接躺在这一层,不在子目录里:

```shell
find /var/log -maxdepth 1 -type f -exec du -h {} \; 2>/dev/null | sort -rh | head -20

或者全局搜大文件:
find / -xdev -type f -size +500M -exec ls -lh {} \; 2>/dev/null | sort -k5 -rh
```

4. 文件已删但空间未释放(du/df对不上号)
   排查是否有进程还占着已删除文件的句柄:

```shell
lsof +L1 2>/dev/null | head -20
```

5. 清理时区分"能删"和"不能直接删"
   历史归档文件(如 messages-20260719):没有进程占用,直接 rm -f 即可
   正在写入的当前文件(如 /var/log/messages):不能删,用 > file 清空,保留inode,不影响写入进程

6. 找到"是谁在疯狂写日志"(治标更要治本)

```shell
awk '{print $5}' /var/log/messages | sort | uniq -c | sort -rn | head -20
```

定位到具体服务后,grep 服务名 /var/log/messages 看具体内容,判断是:

报错死循环刷屏
还是日志级别开太低(比如DEBUG)导致的正常业务日志过量
还是健康检查等定时任务打印过于频繁

7. 常见的两套独立日志系统,别搞混
   systemd journal(/var/log/journal/):归 journald.conf 管,可设 SystemMaxUse/SystemKeepFree 限制大小
   rsyslog(/var/log/messages 等):归 logrotate 管,按周期轮转;如果单周期内暴涨,得靠 logrotate.d 加 size
   参数按大小轮转,或者从根源上减少日志量

8. 根治思路(优先级从高到低)
   - 找到过量日志的根本原因并修复(如日志级别配错、健康检查打印太频繁)
   - 让应用自己管理日志文件(用 RollingFileAppender,设 max-file-size + max-history + total-size-cap),不要依赖
     stdout/journal/syslog 这条链路
   - systemd 层面 StandardOutput=null 做兜底,避免应用日志配置再出问题时拖累系统盘
   - logrotate/journald 的大小限制作为最后一道保险,而不是第一道防线
