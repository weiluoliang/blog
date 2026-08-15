---
title: PostgreSQL 与 pgvector 入门
description: pgvector 让 PostgreSQL 具备向量检索能力，适合后端工程师在熟悉的数据库体系内快速搭建 RAG 原型。
date: 2026-07-09
tags: [PostgreSQL, pgvector, 向量数据库]
order: 1
---

## 为什么关注 pgvector

如果你的业务数据已经在 PostgreSQL 中，pgvector 可以降低系统复杂度。你可以把结构化数据、文本片段和向量索引放在同一个数据库里管理。

## 典型表结构

```sql
CREATE TABLE document_chunks (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536)
);
```

## 使用场景

pgvector 适合知识库规模不大、团队想快速验证 RAG 效果的阶段。当数据量和检索需求变复杂后，再考虑专门的向量数据库也不迟。

## 工程提醒

向量检索不是只建一个字段。你还需要关注文档权限、增量更新、索引重建、召回数量和业务过滤条件。
