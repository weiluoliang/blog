---
title: OpenGauss数据库
description: openGauss 5.0.5 单节点安装与配置指南
date: 2026-08-13
tags: [ openGauss ]
order: 3
---

## 一、环境信息

| 项目    | 信息                                       |
|-------|------------------------------------------|
| 操作系统  | openEuler 64-bit                         |
| 数据库版本 | openGauss 5.0.5                          |
| 安装用户  | omm（非 root）                              |
| 安装目录  | /opt/software/openGauss                  |
| 数据目录  | /opt/software/openGauss/data/single_node |
| 默认端口  | 5432（业务端口）/ 5433（内部通信端口）                 |

## 二、安装核心点

### 2.1 安装包类型区分

| 安装包类型     | 文件名特征                          | 适用场景          |
|-----------|--------------------------------|---------------|
| **单机极简版** | `openGauss-*-64bit.tar.bz2`    | 单机学习、开发测试（推荐） |
| OM 工具包    | `openGauss-*-64bit-om.tar.gz`  | 生产环境、集群部署     |
| CM 工具包    | `openGauss-*-64bit-cm.tar.gz`  | 集群管理组件        |
| 组件集合包     | `openGauss-*-64bit-all.tar.gz` | 包含所有组件，需分别解压  |

> **注意**：单机极简版解压后包含 `simpleInstall` 目录，可一键安装。

### 2.2 关键约束

- **禁止使用 root 用户安装**，必须创建专用系统用户（如 `omm`）
- 安装目录权限必须归属于 `omm` 用户
- 数据库初始密码必须设置（`-w` 参数）

### 2.3 安装步骤概要

```bash
# 1. 创建用户和用户组（root 执行）
groupadd dbgroup
useradd -g dbgroup omm
passwd omm

# 2. 授权安装目录（root 执行）
chown -R omm:dbgroup /opt/software/openGauss

# 3. 切换到 omm 用户
su - omm

# 4. 解压单机极简版（注意参数 -jxf）
tar -jxf openGauss-5.0.5-openEuler-64bit.tar.bz2 -C /opt/software/openGauss

# 5. 执行安装脚本
cd /opt/software/openGauss/simpleInstall
sh install.sh -w "your_password"
```

## 三、环境变量配置

将以下内容添加到 /home/omm/.bashrc：

```bash
export GAUSSHOME=/opt/software/openGauss
export PATH=$GAUSSHOME/bin:$PATH
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export PGDATA=$GAUSSHOME/data/single_node


# 快速添加方式 ：
# 将环境变量永久添加到 omm 用户的 .bashrc
cat >> ~/.bashrc << 'EOF'
export GAUSSHOME=/opt/software/openGauss
export PATH=$GAUSSHOME/bin:$PATH
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export PGDATA=$GAUSSHOME/data/single_node
EOF

```

加载配置：

```bash
source ~/.bashrc
```

## 四、常用管理命令

### 4.1 数据库服务管理

```bash
操作	命令  
启动数据库	gs_ctl start -D $PGDATA -Z single_node  
停止数据库	gs_ctl stop -D $PGDATA -Z single_node  
重启数据库	gs_ctl restart -D $PGDATA -Z single_node  
查看状态	gs_ctl query -D $PGDATA  
重新加载配置	gs_ctl reload -D $PGDATA -Z single_node  
```

### 4.2 数据库连接

```bash
# 本地连接 omm用户下可以免密登录
gsql -d postgres -p 5432
# 普通用户登录  -d 数据库 -U 用户名 -W 密码
gsql -d olink -p 5432 -U olink -W 'Ol5503483'
# 使用 -h 参数指定服务器IP，-U 指定你创建的用户
gsql -h 你的服务器IP -d postgres -p 5432 -U remote_user -W '你的强密码'

# 远程连接
gsql -d olink -h 服务器IP -U remote_user -p 5432 -W '密码'
```

### 4.3 gsql 常用内部命令

```bash
命令	说明
\l	列出所有数据库
\c 数据库名	切换到指定数据库
\dt	列出当前数据库的所有表
\d 表名	查看表结构
\du	列出所有用户/角色
\conninfo	查看当前连接信息
\q	退出 gsql
```

### 4.4 配置管理

```bash
# 查看配置参数
gs_guc check -D $PGDATA -c "参数名"

# 设置配置参数
gs_guc set -D $PGDATA -c "参数名=值"

# 重新加载配置
gs_guc reload -D $PGDATA -c "参数名=值"
```

## 五、开启 MySQL 兼容模式

### 5.1 创建兼容数据库

```bash
-- 创建 MySQL 兼容模式（B 代表 Babel）
CREATE DATABASE olink DBCOMPATIBILITY = 'B';
```

### 5.2 兼容模式选项

```bash
# 查看兼容模式
SHOW sql_compatibility;

兼容模式	   选项值	说明
MySQL      兼容	    'B'	支持 AUTO_INCREMENT、` 标识符、? 占位符等 |
Oracle     兼容	    'A'	支持 NUMBER、VARCHAR2、序列等
PostgreSQL 兼容	    'PG'	默认模式
```

### 5.3 验证 dolphin 插件

dolphin 插件在首次连接 B 兼容数据库时自动加载：

```bash
-- 切换到 olink 数据库
\c olink

-- 验证插件是否加载
SELECT * FROM pg_extension WHERE extname = 'dolphin';
```

### 5.4 MySQL 语法测试示例

```bash
-- 创建表（支持 AUTO_INCREMENT 和 ` 标识符）
CREATE TABLE `products` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `price` DECIMAL(10,2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据
INSERT INTO `products` (`name`, `price`) VALUES 
    ('Laptop', 5999.99),
    ('Mouse', 89.50);

-- 查询（支持 LIMIT）
SELECT * FROM `products` LIMIT 2;

-- 查看表结构
DESCRIBE `products`;
SHOW TABLES;
```

## 六、远程访问配置

6.1 配置监听地址

```bash
# 方式一：使用 gs_guc
#  检查当前监听地址
gs_guc check -D $PGDATA -c "listen_addresses"
# 设置监听所有地址
gs_guc set -D $PGDATA -c "listen_addresses='*'"
# 重启数据库使配置生效
gs_ctl restart -D $PGDATA -Z single_node
# 查看数据库状态（确认启动成功）
gs_ctl query -D $PGDATA


# 方式二：直接编辑配置文件
vi $PGDATA/postgresql.conf
# 修改: listen_addresses = '*'
```

### 6.2 配置 pg_hba.conf

```bash
# 添加远程访问规则
echo "host all all 0.0.0.0/0 sha256" >> $PGDATA/pg_hba.conf

# 重新加载配置
gs_ctl reload -D $PGDATA -Z single_node
```

### 6.3 创建远程用户（重要）

> 注意：初始用户 omm 禁止用于远程登录，必须创建新用户。

```bash
-- 创建远程用户
CREATE USER remote_user WITH PASSWORD '强密码';

-- 授予权限
GRANT ALL PRIVILEGES TO remote_user;
```

## 七、常见问题处理

### 7.1 ulimit 警告

```bash
-bash: ulimit: open files：无法修改 limit 值: Operation not permitted
```

说明：正常现象，可忽略，不影响数据库运行。

### 7.2 gsql 找不到命令

```bash
export PATH=/opt/software/openGauss/bin:$PATH
export LD_LIBRARY_PATH=/opt/software/openGauss/lib:$LD_LIBRARY_PATH
```

### 7.3 libcjson.so.1 找不到

```bash
export LD_LIBRARY_PATH=/opt/software/openGauss/lib:$LD_LIBRARY_PATH
```

### 7.4 GAUSSHOME 环境变量未设置

```bash
export GAUSSHOME=/opt/software/openGauss
export PATH=$GAUSSHOME/bin:$PATH
```

### 7.5 两个监听端口（5432 和 5433）

```bash
正常现象。5432 为业务端口，5433 为内部通信端口（主备复制、逻辑日志抽取等），单机模式也会默认监听。
```

## 八、快速参考卡

```bash
# === 环境变量 ===
export GAUSSHOME=/opt/software/openGauss
export PATH=$GAUSSHOME/bin:$PATH
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export PGDATA=$GAUSSHOME/data/single_node

# === 服务管理 ===
gs_ctl start -D $PGDATA -Z single_node
gs_ctl stop -D $PGDATA -Z single_node
gs_ctl restart -D $PGDATA -Z single_node
gs_ctl query -D $PGDATA

# === 连接数据库 ===
gsql -d postgres -p 5432

# === 创建 MySQL 兼容库 ===
CREATE DATABASE dbname DBCOMPATIBILITY = 'B';

# === 远程用户创建 ===
CREATE USER username WITH PASSWORD 'password';
GRANT ALL PRIVILEGES TO username;
```