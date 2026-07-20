---
title: certbot安装域名证书
description: 
date: 2026-07-15
tags: ["证书"]
order: 4
---

## 安装certbot
```bash
yum install epel-release
yum install certbot

[root@front-end-prel conf.d]# systemctl list-timers --all
NEXT                        LEFT       LAST                        PASSED    UNIT                         ACTIVATES                     
Fri 2026-05-29 11:55:59 CST 37min left -                           -         dnf-makecache.timer          dnf-makecache.service
Sat 2026-05-30 00:00:00 CST 12h left   Fri 2026-05-29 10:52:23 CST 25min ago logrotate.timer              logrotate.service
Sat 2026-05-30 11:07:19 CST 23h left   Fri 2026-05-29 11:07:19 CST 10min ago systemd-tmpfiles-clean.timer systemd-tmpfiles-clean.service
-                           -          -                           -         certbot-renew.timer          certbot-renew.service

# 启动定时任务，自动续期
systemctl enable certbot-renew.timer
systemctl start certbot-renew.timer

# 续期后要刷新nginx
vim  /etc/sysconfig/certbot
# 增加
POST_HOOK="--post-hook 'nginx -s reload'"

# 测试一下续期，不报错即可
[root@front-end-prel conf.d]# certbot renew --dry-run

# 创建一个临时验证证书的目录
mkdir -p /var/www/html/.well-known/acme-challenge

```

## 申请域名

### 先配置一下nginx

```bash

server {
    listen 80;
    server_name xx.xx.com; # 替换为你的域名

    # 其他原有配置...

    # 添加以下 location 块用于 Certbot 验证
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html; # 替换为你的网站根目录
        allow all;
        default_type "text/plain";
    }
    # 你的其他 location 配置，例如处理 PHP 或静态文件...
}
```

重新加载一下配置
```shell
nginx -t
nginx -s reload
```

### 申请域名
```shell
certbot certonly --webroot -w /var/www/html -d xxx.xxx.com --email xxx@163.com
```

### 安装之后再补上完整的nginx配置
```shell
server {
    listen 80;
    server_name xx.xx.com; # 替换为你的域名

    # 其他原有配置...

    # 添加以下 location 块用于 Certbot 验证
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html; # 替换为你的网站根目录
        allow all;
        default_type "text/plain";
    }

    # 你的其他 location 配置，例如处理 PHP 或静态文件...
}

server {
    listen 443 ssl;
    server_name zlm.jsysafe.com;

    ssl_certificate /etc/letsencrypt/live/xx.xx.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xx.xx.com/privkey.pem;
    # 其他SSL设置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location / {
          proxy_pass http://xxxxx:80/;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;

           # WebSocket support
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
   }
}
```

重启一下nginx
```bash
systemctl restart nginx
```

## 常用命令

```bash
# 自动模式（推荐，自动配置 Web 服务器） 
certbot --apache          # Apache 
certbot --nginx           # Nginx  
# Standalone 模式（临时启动内置服务器，需停止占用 80 端口的服务） 
certbot certonly --standalone -d example.com -d www.example.com  
# Webroot 模式（不停止 Web 服务器） 
certbot certonly --webroot -w /var/www/html -d example.com  
# DNS 验证模式（适合通配符证书） 
certbot certonly --manual --preferred-challenges dns -d *.example.com


# 续期所有即将到期的证书 
certbot renew  
# 干跑测试（不实际续期） 
certbot renew --dry-run  
# 强制续期（无论是否到期） 
certbot renew --force-renewal

# 自动续期定时任务
crontab -e
0 3 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"


# 列出所有证书
certbot certificates

# 查看某个域名的证书详情
certbot certificates -d example.com

# 交互式删除
certbot delete

# 指定域名删除
certbot delete --cert-name example.com

# 撤销证书
certbot revoke --cert-path /etc/letsencrypt/live/example.com/cert.pem

# 指定邮箱（首次注册或更新）
certbot certonly --email admin@example.com ...

# 同意服务条款（非交互模式）
certbot certonly --agree-tos --non-interactive ...

# 测试环境（使用 Let's Encrypt staging，不消耗配额）
certbot certonly --staging ...

# 查看版本
certbot --version

# 查看帮助
certbot --help
certbot --help all     # 全部帮助
```

