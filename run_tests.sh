#!/usr/bin/env bash
# 企业绿色评级系统 —— 一键自动化测试（4 层门禁）
# 语法门禁(线上JS) + 静态基线回归 + 路由可达性 + E2E功能测试
set -e

BASE="${BASE_URL:-https://a6724c73bfd2fc747.gz3.agentos-app.net}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=================================================="
echo " 企业绿色评级系统 · 自动化回归测试"
echo " 目标: $BASE"
echo "=================================================="

echo ""
echo "[1/4] 语法门禁: 下载线上JS并 node --check"
JS=$(curl -s "$BASE/" | grep -o 'assets/index[^"]*\.js' | head -1)
if [ -z "$JS" ]; then
  echo "  ❌ 无法从首页获取JS路径"
  exit 1
fi
curl -s "$BASE/$JS" -o /tmp/_online_js_check.js
if node --check /tmp/_online_js_check.js 2>/tmp/_js_err.txt; then
  echo "  ✅ 线上JS语法通过 ($(wc -c < /tmp/_online_js_check.js) bytes)"
else
  echo "  ❌ 线上JS语法错误:"
  cat /tmp/_js_err.txt
  exit 1
fi

echo ""
echo "[2/4] 静态基线回归: 非修改部分功能不变（菜单/域名/接口/样式/部署配置）"
python3 "$ROOT/tests/regression_test.py"
# regression_test.py 内部已处理退出码（0=通过，1=失败）

echo ""
echo "[3/4] 路由可达性检查"
HOME_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
QUERY_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/certificate-query")
MARKET_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/financial-supermarket")
JOIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/join-us/")
echo "  首页: HTTP $HOME_CODE"
echo "  证书查询: HTTP $QUERY_CODE"
echo "  金融超市: HTTP $MARKET_CODE"
echo "  加入我们: HTTP $JOIN_CODE"
if [ "$HOME_CODE" != "200" ] || [ "$QUERY_CODE" != "200" ] || [ "$MARKET_CODE" != "200" ] || [ "$JOIN_CODE" != "200" ]; then
  echo "  ❌ 路由不可达(存在404)"
  exit 1
fi
echo "  ✅ 路由全部可达"

echo ""
echo "[4/4] 端到端功能测试 (Playwright)"
BASE_URL="$BASE" python3 "$ROOT/tests/e2e_test.py"
# e2e_test.py 内部已处理退出码
