---
title: Nginx mTLS 双向证书验证配置流程
description:
date: 2026-07-27
tags: [ "mTLS" ]
order: 6
---

## 一、目标

为 xxx.xxx.com 配置 mTLS（双向 TLS 验证），
要求客户端携带受信任证书才能访问，服务端用私有根 CA 签发并验证客户端证书。

## 二、Nginx 配置

在 server 块中增加以下指令（ssl_verify_client 生效范围是整个 server 块，
不是单个 location，因为证书验证发生在 TLS 握手阶段，早于 location 匹配）：

```bash
server {
    listen 443 ssl;
    server_name xxx.xxx.com;
    ssl_certificate /etc/letsencrypt/live/xxx.xxx.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xxx.xxx.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # ===== mTLS 客户端证书验证 =====
    ssl_client_certificate /etc/nginx/certs/client-ca.crt;  # 签发客户端证书的根CA
    ssl_verify_client on;        # on=强制要求证书；optional=允许不带证书，location里再判断
    ssl_verify_depth 2;

    location / {
       
    }
}
```

只想对部分 location 要求证书？
ssl_verify_client 不能按 location 强制切换（握手先于路由）。
如果只想让 /jsy_files/ 需要证书、其他路径不需要，改用 optional + 手动判断：

```bash
ssl_verify_client optional;

location /jsy_files/ {
    if ($ssl_client_verify != SUCCESS) {
        return 403;
    }
    ... 其余配置不变
}
```

## 三、私有根 CA 搭建与客户端证书签发

1. 目录准备

```bash
mkdir -p ~/mtls-ca/root-ca/{certs,crl,newcerts,private}
mkdir -p ~/mtls-ca/client-certs
cd ~/mtls-ca/root-ca
chmod 700 private
touch index.txt
echo 1000 > serial
```

2. openssl.cnf 配置文件

放置位置：~/mtls-ca/root-ca/openssl.cnf（与 certs/、private/ 等目录同级）。
所有涉及 -config openssl.cnf 的命令都要在 root-ca 目录下执行，否则用绝对路径 -config ~/mtls-ca/root-ca/openssl.cnf。

```bash
[ ca ]
default_ca = CA_default

[ CA_default ]
dir               = .
certs             = $dir/certs
new_certs_dir     = $dir/newcerts
database          = $dir/index.txt
serial            = $dir/serial
private_key       = $dir/private/root-ca.key.pem
certificate       = $dir/certs/root-ca.cert.pem
default_md        = sha256
default_days      = 3650
policy            = policy_loose
x509_extensions   = v3_ca

[ policy_loose ]
countryName             = optional
stateOrProvinceName     = optional
organizationName        = optional
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ req ]
default_bits       = 4096
prompt             = no
default_md         = sha256
distinguished_name = dn

[ dn ]
C  = CN
ST = Guangdong
O  = JSYSafe
OU = JSY Root CA
CN = JSY Root CA

[ v3_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign

[ client_cert ]
basicConstraints = CA:FALSE
nsCertType = client, email
nsComment = "OpenSSL Generated Client Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, emailProtection
```

3. 生成根 CA（私钥 + 自签名证书）

```bash
cd ~/mtls-ca/root-ca

# 生成私钥（加密保护）
openssl genrsa -aes256 -out private/root-ca.key.pem 4096
chmod 400 private/root-ca.key.pem

# 自签名生成根证书，有效期10年
openssl req -config openssl.cnf \
    -key private/root-ca.key.pem \
    -new -x509 -days 3650 -sha256 -extensions v3_ca \
    -out certs/root-ca.cert.pem
```

> 注意：-aes256 会要求设置密码短语（至少4位），之后每次用根CA签发证书都需要输入。若报错 result too
> small，说明密码输入为空或过短，重新执行并认真输入密码即可。
> 测试环境如不想每次签发都输密码，可去掉 -aes256，但私钥文件权限必须严格控制（chmod 400），生产环境不建议这样做。

4. 签发客户端证书

```bash
cd ~/mtls-ca/client-certs
CLIENT_NAME=device-001   # 换成实际设备/用户标识

# 1. 生成客户端私钥
openssl genrsa -out ${CLIENT_NAME}.key.pem 2048

# 2. 生成证书签名请求 CSR
openssl req -new -key ${CLIENT_NAME}.key.pem \
    -out ${CLIENT_NAME}.csr.pem \
    -subj "/C=CN/ST=Guangdong/O=JSYSafe/OU=Client/CN=${CLIENT_NAME}"

# 3. 用根CA签发（在 root-ca 目录下执行）
cd ../root-ca
openssl ca -config openssl.cnf \
    -extensions client_cert \
    -days 730 -notext -md sha256 \
    -in ../client-certs/${CLIENT_NAME}.csr.pem \
    -out ../client-certs/${CLIENT_NAME}.cert.pem

# 4. 验证证书链
openssl verify -CAfile certs/root-ca.cert.pem ../client-certs/${CLIENT_NAME}.cert.pem

```

> 常见坑：打包/验证命令要在对应文件所在目录执行（如 client-certs 目录），且 ${CLIENT_NAME} 这类 shell
> 变量在新终端会话中不会保留，重新登录后需要重新赋值，否则会报 No such file or directory。

5. 打包给客户端使用

浏览器 / Windows 客户端 → 打包成 .p12：

```bash
cd ~/mtls-ca/client-certs
openssl pkcs12 -export \
    -inkey ${CLIENT_NAME}.key.pem \
    -in ${CLIENT_NAME}.cert.pem \
    -certfile ../root-ca/certs/root-ca.cert.pem \
    -out ${CLIENT_NAME}.p12 \
    -name "${CLIENT_NAME}"

```

curl / 程序化调用 → 直接用 pem 文件：

```bash 
curl -v https://b-mtls-test.jsysafe.com/jsy_files/xxx.mp4 \
    --cert ${CLIENT_NAME}.cert.pem \
    --key ${CLIENT_NAME}.key.pem \
    --cacert ../root-ca/certs/root-ca.cert.pem
```

6. Nginx 端部署根 CA 证书

```bash  

cp ~/mtls-ca/root-ca/certs/root-ca.cert.pem /etc/nginx/certs/client-ca.crt
nginx -s reload
 
```

## 四、证书吊销（CRL，建议配置）

```bash
cd ~/mtls-ca/root-ca

# 吊销指定客户端证书
openssl ca -config openssl.cnf -revoke ../client-certs/${CLIENT_NAME}.cert.pem

# 生成 CRL 文件
openssl ca -config openssl.cnf -gencrl -out crl/root-ca.crl.pem

```

nginx 配置中加入：

```bash 
ssl_crl /etc/nginx/certs/root-ca.crl.pem;
```

之后需定期重新生成并同步 CRL 到 nginx，否则吊销不生效。

--- 

## 五、浏览器端使用客户端证书

把 .p12 文件下载到本地电脑。
双击导入：
Windows：导入向导 → 输入打包密码 → 存储到"个人"证书区
Mac：导入到"登录"钥匙串，输入密码
Firefox：设置 → 隐私与安全 → 证书 → 查看证书 → 您的证书 → 导入
完全关闭浏览器再重新打开（不是刷新页面），否则 TLS 会话缓存不会重新走证书选择流程。
重新访问目标域名，正常会弹出"选择客户端证书"对话框。

## 六、故障排查记录

报错：400 Bad Request - No required SSL certificate was sent

原因：ssl_verify_client on 已生效，但当前请求未携带客户端证书。

排查方向：

1. 浏览器是否已导入 .p12 客户端证书，并重启过浏览器。
2. curl 测试是否漏加 --cert / --key / --cacert 参数。
3. 若确认已导入证书仍报错，检查 nginx 配置的 CA 证书与签发客户端证书用的根CA是否为同一个：

```bash
openssl x509 -noout -fingerprint -sha256 -in /etc/nginx/certs/client-ca.crt
openssl x509 -noout -fingerprint -sha256 -in ~/mtls-ca/root-ca/certs/root-ca.cert.pem 
```

两者指纹必须完全一致，否则重新 cp 根证书到 nginx 并 reload。

确认要求证书的 server 块与实际访问的域名（server_name）匹配，ssl_verify_client on 作用于整个 server 块下所有
location，与访问哪个路径无关。


