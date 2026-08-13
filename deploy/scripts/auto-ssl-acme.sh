#!/usr/bin/env bash
# ============================================================
# 企业绿色评级系统 · Let's Encrypt 免费证书自动签发（acme.sh 版）
# 适用：任何 Linux 发行版；可配合 Docker 挂载目录使用
#
# 用法（HTTP-01 验证，需 80 端口可达）：
#   bash deploy/scripts/auto-ssl-acme.sh your-domain.com
# 用法（DNS-01 验证，无需开放端口，适合 Docker/内网）：
#   export CF_Token="你的Cloudflare API Token"   # 以 Cloudflare 为例
#   bash deploy/scripts/auto-ssl-acme.sh your-domain.com --dns dns_cf
#
# 效果：
#   1. 安装 acme.sh（curl 官方脚本）
#   2. 签发证书
#   3. 安装到 /etc/nginx/certs/（与 nginx.conf / Docker 挂载路径一致）
#   4. acme.sh 自带定时任务自动续期（60 天触发）
# ============================================================
set -euo pipefail

DOMAIN="${1:?用法: auto-ssl-acme.sh <域名> [--dns dns_cf]}"
DNS_MODE="${3:-}"           # 第二个参数 --dns，第三个是验证方式（如 dns_cf）
CERTS_DIR="/etc/nginx/certs"

echo "==> [1/4] 安装 acme.sh"
if [ ! -f "$HOME/.acme.sh/acme.sh" ]; then
  curl -fsSL https://get.acme.sh | sh
fi
ACME="$HOME/.acme.sh/acme.sh"

echo "==> [2/4] 签发证书（域名: $DOMAIN）"
if [ "$DNS_MODE" = "dns" ] && [ -n "${4:-}" ]; then
  # DNS-01 验证（无需开放 80 端口，适合 Docker/内网部署）
  "$ACME" --issue --dns "$4" -d "$DOMAIN" --server letsencrypt
else
  # HTTP-01 验证（需 80 端口可被外网访问）
  "$ACME" --issue -d "$DOMAIN" --standalone --server letsencrypt
fi

echo "==> [3/4] 安装证书到 $CERTS_DIR"
sudo mkdir -p "$CERTS_DIR"
"$ACME" --install-cert -d "$DOMAIN" \
  --key-file       "$CERTS_DIR/server.key" \
  --fullchain-file "$CERTS_DIR/server.crt" \
  --reloadcmd      "nginx -t && systemctl reload nginx || true"

echo "==> [4/4] 确认自动续期"
"$ACME" --cron --home "$HOME/.acme.sh" 2>/dev/null || true
crontab -l 2>/dev/null | grep -q acme.sh && echo "  ✅ 续期定时任务已安装（每天自动检查）"

echo ""
echo "🎉 HTTPS 证书签发并部署完成"
echo "  证书: $CERTS_DIR/server.crt"
echo "  私钥: $CERTS_DIR/server.key"
echo "  自动续期: acme.sh 定时任务（60 天自动续 + reload nginx）"
echo "  验证: curl -I https://$DOMAIN/"
