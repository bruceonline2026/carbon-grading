#!/usr/bin/env bash
# ============================================================
# 生成自签名 SSL 证书（仅用于测试/内部环境，生产请用正规证书）
# 用法：bash deploy/scripts/gen-selfsigned-cert.sh [输出目录]
# 默认输出：./certs/server.crt 与 ./certs/server.key
# 依赖：openssl（各系统默认自带）
# ============================================================
set -e

OUT_DIR="${1:-certs}"
DOMAIN="${DOMAIN:-carbon-grading.local}"
mkdir -p "$OUT_DIR"

echo "==> 生成自签名证书（域名: $DOMAIN）输出到 $OUT_DIR"
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$OUT_DIR/server.key" \
  -out "$OUT_DIR/server.crt" \
  -days 365 \
  -subj "/C=CN/O=CarbonGrading/CN=$DOMAIN"

echo "==> 完成"
ls -la "$OUT_DIR/server.crt" "$OUT_DIR/server.key"
echo ""
echo "==> 下一步（Docker）：证书就绪，直接 docker compose up -d"
echo "==> 注意：自签名证书浏览器会告警，测试环境点'高级→继续访问'即可；生产请换正式证书。"
