#!/usr/bin/env bash
# ============================================================
# 企业绿色评级系统 · Let's Encrypt 免费证书自动签发（certbot 版）
# 适用：Ubuntu/Debian + Nginx（推荐主方案）
#
# 用法：
#   bash deploy/scripts/auto-ssl-certbot.sh your-domain.com [email]
#   例：bash deploy/scripts/auto-ssl-certbot.sh uat.carbon-grading.com
#
# 前置条件：
#   1. 域名已解析到本服务器公网 IP（A 记录）
#   2. 服务器 80 端口可被外网访问（ACME HTTP-01 验证）
#   3. Nginx 已安装并已监听 80（deploy/nginx.conf 已含 80→443 跳转）
#
# 效果：
#   1. 安装 certbot
#   2. 签发证书（自动续期 90 天，certbot renew 定时任务自动接管）
#   3. 证书输出到 /etc/letsencrypt/live/<域名>/（fullchain.pem + privkey.pem）
#   4. 自动部署到 /etc/nginx/certs/（与 deploy/nginx.conf 的路径一致）
#   5. reload Nginx 生效
# ============================================================
set -euo pipefail

DOMAIN="${1:?用法: auto-ssl-certbot.sh <域名> [邮箱]}"
EMAIL="${2:-admin@carbon-grading.com}"
CERTS_DIR="/etc/nginx/certs"

echo "==> [1/5] 安装 certbot"
if ! command -v certbot >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y certbot python3-certbot-nginx
fi

echo "==> [2/5] 签发证书（域名: $DOMAIN）"
sudo certbot certonly --nginx \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --redirect 2>/dev/null || \
  sudo certbot certonly --standalone \
    -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

echo "==> [3/5] 部署证书到 $CERTS_DIR（nginx.conf 已引用此路径）"
sudo mkdir -p "$CERTS_DIR"
sudo cp -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERTS_DIR/server.crt"
sudo cp -f "/etc/letsencrypt/live/$DOMAIN/privkey.pem"  "$CERTS_DIR/server.key"
sudo chmod 644 "$CERTS_DIR/server.crt"
sudo chmod 600 "$CERTS_DIR/server.key"

echo "==> [4/5] 配置自动续期（90 天自动续 + 续期后重新部署）"
# 续期后自动把新证书同步到 nginx 路径并 reload
sudo tee /etc/letsencrypt/renewal-hooks/deploy/carbon-grading.sh >/dev/null <<EOF
#!/usr/bin/env bash
cp -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERTS_DIR/server.crt"
cp -f "/etc/letsencrypt/live/$DOMAIN/privkey.pem"  "$CERTS_DIR/server.key"
chmod 644 "$CERTS_DIR/server.crt"; chmod 600 "$CERTS_DIR/server.key"
nginx -t && systemctl reload nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/carbon-grading.sh

echo "==> [5/5] 校验 Nginx 并生效"
sudo nginx -t
sudo systemctl reload nginx || sudo systemctl restart nginx

echo ""
echo "🎉 HTTPS 证书签发并部署完成"
echo "  证书: $CERTS_DIR/server.crt"
echo "  私钥: $CERTS_DIR/server.key"
echo "  自动续期: certbot renew（系统 cron/timer 自动执行）"
echo "  验证: curl -I https://$DOMAIN/"
