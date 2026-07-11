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

## 小结

Nginx 配置看似简单，但很多线上问题都和代理层有关。部署 AI 应用时尤其要关注长连接、超时和流式输出。
