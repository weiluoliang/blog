---
title: 'volatile'
icon: page
order: 1
author: luoliang
date: 2023-01-08
category:
  - java
tag:
  - 基础知识
sticky: false
star: true
footer: false
copyright: No Copyright
editLink: false
comment: false

---

## volatile的作用
1. 多线程的可见性
2. 禁止重排序


## 可见性问题是怎么产生的？ 
在单核CPU的场景，其实不存在可见性问题，因为只有一个cpu在执行，每次都能拿到最新的数据。

在多核cpu环境下，由于每个cpu都有自己的cache，数据先到cache中，CPU在自己的cache中修改，不会马上同步到主内存。

在硬件层面，有MESI协议保证 cache的同步，CPU工程师为了提高性能，增加了storebuffer和 invalidate queue又导致了数据不一致的问题，这个问题的解决交给了软件工程师，提供了内存屏障给软件工程师，在需求保证数据一致性的地方加上内存屏障。


## volatile的底层原理
lock关键字


