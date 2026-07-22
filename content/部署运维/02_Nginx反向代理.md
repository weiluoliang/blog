---
title: Nginx 反向代理基础
description: Nginx 常用于静态资源托管、后端服务转发、HTTPS 终止和流式响应代理。
date: 2026-07-05
tags: [Nginx, 反向代理, 部署]
order: 2
---

## 常见用途

Nginx 在后端系统里常见用途包括：

- 静态文件托管。
- API 请求转发。
- HTTPS 证书配置。
- 负载均衡。
- 超时和请求体大小限制。

## AI 应用中的注意点

如果你的 AI 接口使用 SSE 流式输出，需要确认代理不会缓冲响应，否则用户会等到模型生成结束才看到内容。

```nginx
proxy_buffering off;
proxy_read_timeout 300s;
```

## 常用的配置

```bash

server {
    listen 80;
    server_name v.xxx.com; # 替换为你的域名

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
    server_name v.xxx.com;

    ssl_certificate /etc/letsencrypt/live/v.xxx.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/v.xxx.com/privkey.pem;
    # 其他SSL设置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    send_timeout 3600s;

    location /xxx {
          proxy_pass http://xxx:8080/;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;

          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection $connection_upgrade;

          add_header Cache-Control no-cache;
   }
   
   # 静态文件配置
   location /html {
        alias /data/www/html;
        index index.html;
    }

}


```

## 小结

Nginx 配置看似简单，但很多线上问题都和代理层有关。部署 AI 应用时尤其要关注长连接、超时和流式输出。
