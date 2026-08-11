#!/usr/bin/env bash
# ====== 企业绿色评级系统 · 配置脚本 ======
# 用法: bash setup-config.sh
# 首次发布时自动询问，后续可手动运行修改

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
CFG="$ROOT/assets/config.js"

echo "============================================"
echo " 企业绿色评级系统 · 站点配置"
echo "============================================"
echo ""

# 读当前值作为默认值
current=$(grep -oP '(?<=window\.__entUrl__\s*=\s*")[^"]*' "$CFG" 2>/dev/null || echo "")
default_url="${current:-https://uat-enterprise.carbon-grading.com}"

echo "请输入企业后台系统的基域名（不含 /App/Enterprise 等路径）"
echo "  示例: https://uat-enterprise.carbon-grading.com"
echo "  示例: https://enterprise.carbon-grading.com        （正式环境）"
echo ""
read -p "基域名: " url
url="${url:-$default_url}"

echo ""
echo "将使用以下配置:"
echo "  企业后台基域名: $url"
echo "    → 企业入口: $url/App/Enterprise"
echo "    → 注册页面: $url/#EnterpriseRegistration@1"
echo "    → 后台 API:  $url"
echo ""
read -p "确认写入? (Y/n) " confirm
confirm="${confirm:-Y}"

if [[ "$confirm" =~ ^[Yy]$ ]]; then
  cat > "$CFG" << CFGEOF
// ====== 企业绿色评级系统 · 可配置项 ======
// 由 setup-config.sh 生成，可手动修改或重新运行脚本
// 此处填入企业后台系统的基础域名（不含路径）
window.__entUrl__ = "$url";
CFGEOF
  echo ""
  echo "✅ 配置已写入 $CFG"
  echo "   重新部署后生效。"
else
  echo "已取消，配置未修改。"
fi