---
title: NTP 校时服务部署
description: 
date: 2026-07-15
tags: ["NTP"]
order: 5
---

适用范围：Ubuntu / 麒麟（Kylin V10）/ Rocky Linux，chrony 作为 NTP 客户端 \+ 本地 NTP 服务端，供摄像头等 IoT 设备统一校时。


## 一、方案说明

- 统一使用 **chrony**（比传统 ntpd 收敛快、资源占用低，主流发行版默认组件）。

- 服务器先作为客户端同步国内公共 NTP 源（阿里云、腾讯云、国家授时中心等），再作为服务端对内网设备（摄像头、网关等）提供时间服务。

- 示例内网服务器地址：`192.168.50.21`（请按实际环境替换）。


## 二、安装 chrony

2.1 Ubuntu

```Bash
sudo apt update
sudo apt install -y chrony
```

配置文件路径：`/etc/chrony/chrony.conf` 服务名：`chrony`

2.2 麒麟 Kylin V10（openEuler / RPM 系）

```Bash
sudo dnf install -y chrony
# 或
sudo yum install -y chrony
```

配置文件路径：`/etc/chrony.conf` 服务名：`chronyd`

若系统已预装，会提示"软件包已安装、无需任何处理"，直接进行配置即可。

2.3 Rocky Linux

```Bash
sudo dnf install -y chrony
```

配置文件路径：`/etc/chrony.conf` 服务名：`chronyd`

Rocky Linux 默认一般已预装 chrony，若未安装按上述命令处理。



### 2.4 检查是否有冲突服务

三个系统都建议检查是否同时存在 `ntpd` 或 `systemd-timesyncd`，避免抢占 UDP 123 端口：

```JavaScript
rpm -qa | grep -E "ntp|chrony"        # RPM 系（麒麟/Rocky）
dpkg -l | grep -E "ntp|chrony"        # Ubuntu

systemctl is-active ntpd 2>/dev/null
systemctl is-active systemd-timesyncd 2>/dev/null
```

若存在冲突服务，停用并禁用：

```Bash
sudo systemctl stop ntpd systemd-timesyncd
sudo systemctl disable ntpd systemd-timesyncd
```

## 三、配置上游时间源（客户端）

编辑配置文件（Ubuntu: `/etc/chrony/chrony.conf`；麒麟/Rocky: `/etc/chrony.conf`）：

```Bash
sudo vim /etc/chrony.conf
```

注释掉默认的 `pool`/`server` 行，替换为国内源，建议保留 3\-4 个做冗余：

```Bash
server ntp.ntsc.ac.cn iburst
server ntp1.aliyun.com iburst
server ntp2.aliyun.com iburst
server time1.cloud.tencent.com iburst
```

若为华为云 ECS，可优先使用内网 NTP（延迟更低）：

```Bash
server ntp1.huaweicloud.com iburst
server ntp2.huaweicloud.com iburst
```

## 四、配置为本地 NTP 服务端（供摄像头等设备同步）

在配置文件末尾追加：

```Bash
# 允许内网网段访问本机的 NTP 服务
allow 192.168.50.0/24

# 上游全部失联时，仍以本机时间作为应急权威源，避免下游设备集体失步
local stratum 10
```

网段请按实际摄像头/内网环境替换，不建议写 `allow 0.0.0.0/0`（避免变成公网可被滥用的 NTP 反射源）。



## 五、启动服务与防火墙放行

### 5.1 启动并设置开机自启

```Bash
sudo systemctl enable --now chronyd    # Ubuntu 系统名为 chrony
sudo systemctl restart chronyd
```

### 5.2 防火墙放行 UDP 123 端口

**firewalld（麒麟 / Rocky 常见）：**

```Bash
sudo systemctl status firewalld
```

若显示 `FirewallD is not running`，说明本机未启用 firewalld，需检查是否走 iptables 或本机无防火墙限制：

ufw（Ubuntu 常见）：

```Bash
sudo ufw allow 123/udp
```

**云主机安全组：**

若服务器在华为云等云平台，还需在控制台安全组中放行 UDP 123 入方向（源地址限定为内网网段）。

### 5.3 时区确认

```Bash
timedatectl
sudo timedatectl set-timezone Asia/Shanghai
```

## 六、验证安装是否正常

### 6.1 服务端自身校时状态（本机执行）

```Bash
chronyc tracking
```

重点确认：

```Bash
chronyc sources -v
```

前面标 `^*` 的为当前选中的主同步源，`Reach` 列（八进制）值越大（如 `177`、`377`）代表连接越稳定，`^?` 代表暂时不可达或延迟质量差，属正常波动，chrony 会自动择优选源，不必强求某一个源必须被选中。

6.2 综合状态检查

```Bash
timedatectl status
```

确认以下三项均正常：

```Bash
System clock synchronized: yes
              NTP service: active
                Time zone: Asia/Shanghai (CST, +0800)
```

6.3 确认服务端监听端口

```Bash
sudo ss -ulnp | grep 123
```

应能看到 `chronyd` 正在监听 123 端口。

6.4 从其他内网机器测试连通性

```Bash
ntpdate -q 192.168.50.21
```

返回类似 `server 192.168.50.21, stratum 3, offset ...` 即代表连接成功、时间已获取。

> 注意：`chronyc -h <IP> tracking` 这种远程查询方式默认无法使用（会报 `506 Cannot talk to daemon`），这是因为 chronyd 默认只允许本机管理端口（323 端口），属正常限制，不代表 NTP 服务（123 端口）有问题，不需要额外处理。
>
>



6.5 查看有哪些客户端已连接同步（本机执行）

```Bash
chronyc clients
```

摄像头配置完成后，几分钟内应能在此列表中看到摄像头 IP，即代表同步成功。也可用抓包方式实时确认：

```Bash
sudo tcpdump -i any udp port 123 -n
```



## 七、摄像头配置 NTP 服务

### 7.1 Web 管理界面手动配置（适用于单台/少量设备）

登录摄像头 Web 管理页面，路径一般为： 系统设置 → 时间设置 → NTP



填写：

- **NTP 服务器地址**：`192.168.50.21`（本文档 fcg21 服务器内网 IP）

- **端口**：123（默认）

- **同步周期**：建议 60～1440 分钟，按设备支持范围选择



海康、大华等主流品牌摄像头基本都支持该配置项，路径名称可能略有差异（如"时间同步""NTP 设置"等）。



### 7.2 通过 NVR / 平台批量下发（适用于大批量设备）

若摄像头通过 NVR 统一接入管理（如大华 NVR JSON RPC 接口），可通过接口批量下发 NTP 服务器地址字段，避免逐台手动配置；具体接口调用方式需结合实际使用的 NVR/平台 API 另行确认。
