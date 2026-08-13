#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
企业绿色评级系统 · 静态回归测试（黄金基线对比）
================================================================
作用：任何一次修改（菜单/样式/域名/接口/组件/配置）之后运行本脚本，
     确保"非修改部分"的功能不变 —— 通过把关键特征固化为黄金基线，
     逐项 diff 当前产物，任何"该在的没了 / 不该在的出现了"都会报 FAIL。

用法：
  python3 tests/regression_test.py                    # 本地静态基线校验（无需浏览器，秒级）
  BASE_URL=https://xxx python3 tests/regression_test.py   # 附带线上路由可达性检查

依赖：无（纯 Python 标准库；node --check 需 node 命令）
退出码：0 = 全部通过，1 = 有失败项（可直接接入 CI）
================================================================
"""
import os
import re
import sys
import subprocess
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    mark = "✅ PASS" if cond else "❌ FAIL"
    line = f"  {mark} {name}"
    if detail:
        line += f"  ({detail})"
    print(line)


def read(rel):
    p = os.path.join(ROOT, rel)
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8", errors="replace") as f:
        return f.read()


# ============================================================
# 1. 文件完整性（核心交付物必须存在）
# ============================================================
def t_files():
    print("\n[1/10] 文件完整性")
    for f in ["index.html", "assets/config.js", "assets/index.js",
              "assets/index.css", "join-us/index.html", "web.config"]:
        check(f"文件存在: {f}", read(f) is not None)


# ============================================================
# 2. 语法门禁（压缩 JS 无语法错误 —— 白屏根因）
# ============================================================
def t_syntax():
    print("\n[2/10] 语法门禁")
    js = read("assets/index.js")
    if js is None:
        check("index.js 语法检查", False, "文件缺失")
        return
    try:
        r = subprocess.run(["node", "--check", os.path.join(ROOT, "assets/index.js")],
                           capture_output=True, timeout=30)
        check("index.js node --check 通过", r.returncode == 0, r.stderr.decode()[:120] if r.returncode else "")
    except FileNotFoundError:
        check("index.js node --check", True, "本机无 node，跳过（CI 应执行）")


# ============================================================
# 3. 菜单黄金基线（join-us 顶部导航）
# ============================================================
MENU_REQUIRED = ["首页", "金融市场", "证书查询", "指标申报",
                 "流程", "服务", "合作伙伴", "加入我们"]
MENU_FORBIDDEN = ["能源计算", "演示说明"]

def t_menu():
    print("\n[3/10] 菜单黄金基线（join-us 顶部导航）")
    html = read("join-us/index.html")
    if html is None:
        check("join-us/index.html 可读", False)
        return
    for m in MENU_REQUIRED:
        check(f"必须包含菜单项「{m}」", f'nav-item">' in html and f">{m}</a>" in html or f">{m}</a>" in html)
    for m in MENU_FORBIDDEN:
        check(f"禁止包含菜单项「{m}」", m not in html)
    # 登录按钮作为 nav 最后一项（金底）
    check("登录按钮存在（金底）", 'id="nav-login"' in html and "D4AF37" in html)
    # 跳转配置存在
    check("菜单跳转配置块存在", "__cgUrl__" in html and "__entUrl__" in html)


# ============================================================
# 4. 导航外链基线（企业后台外链）
# ============================================================
def t_nav_links():
    print("\n[4/10] 导航外链基线")
    html = read("join-us/index.html")
    if html is None:
        return
    check("指标申报→企业后台外链配置", '/App/Enterprise' in html)
    check("登录→企业后台外链配置", 'nav-login' in html and '/App/Enterprise' in html)
    check("官网 hash 路由（/#home 等）", '#home' in html and '#process' in html and '#partners' in html)


# ============================================================
# 5. 域名黄金基线（接口域名统一走企业后台）
# ============================================================
def t_domains():
    print("\n[5/10] 域名黄金基线")
    cfg = read("assets/config.js")
    js = read("assets/index.js")
    if cfg:
        ent = re.search(r'__entUrl__\s*=\s*"([^"]+)"', cfg)
        cg = re.search(r'__cgUrl__\s*=\s*"([^"]+)"', cfg)
        check("config.js 含 __entUrl__", ent is not None)
        check("config.js 含 __cgUrl__", cg is not None)
        if ent:
            check("__entUrl__ 为 https", ent.group(1).startswith("https://"), ent.group(1))
        if cg:
            check("__cgUrl__ 为 https", cg.group(1).startswith("https://"), cg.group(1))
    if js:
        # 接口域名：index.js 内 /DataServices/ 前的主机必须是企业后台域（__entUrl__ 的域）
        api_hosts = set(re.findall(r'https://([a-z0-9.\-]+)/DataServices/', js))
        ent_host = ""
        if cfg and ent:
            ent_host = re.sub(r'^https?://', '', ent.group(1)).rstrip('/')
        for h in sorted(api_hosts):
            ok = ent_host and h == ent_host
            check(f"接口域名统一为企业后台（{h}）", ok, f"应为 {ent_host or '（config 未解析）'}")
        # 禁止旧的静态站接口硬编码
        check("禁止 uat.carbon-grading.com/DataServices 残留", "uat.carbon-grading.com/DataServices" not in js)
        # 前端静态站域名只用于菜单跳转（无 /DataServices 后缀）
        check("__cgUrl__ 域未混入 API", "https://uat.carbon-grading.com/DataServices" not in js)


# ============================================================
# 6. 接口端点基线（4 个 API 必须存在）
# ============================================================
def t_apis():
    print("\n[6/10] 接口端点基线")
    js = read("assets/index.js") or ""
    html = read("join-us/index.html") or ""
    blob = js + html
    for api in ["CertificateLookup", "FinancialProductLookup",
                "FinancialProductTypeList", "CooperationApplication"]:
        check(f"接口端点存在: {api}", api in blob)


# ============================================================
# 7. 全局变量黄金基线（当前压缩产物模式依赖的 window.__xxx）
# ============================================================
GLOBALS_REQUIRED = ["__certResultData", "__productTypes", "__products",
                    "__hotProducts", "__homeProducts"]

def t_globals():
    print("\n[7/10] 全局变量基线")
    js = read("assets/index.js")
    if js is None:
        return
    for g in GLOBALS_REQUIRED:
        check(f"全局变量存在: window.{g}", f"window.{g}" in js)


# ============================================================
# 8. join-us 关键样式基线（历次修复的防回归点）
# ============================================================
def t_styles():
    print("\n[8/10] join-us 关键样式基线（历次修复防回归）")
    html = read("join-us/index.html")
    if html is None:
        return
    checks = [
        ("header 高度 h-20（与首页一致）", "h-20" in html),
        ("Logo 圆形框 rounded-full", "rounded-full bg-gradient" in html),
        ("Logo 绿→深蓝渐变", "from-[#1A5319] to-[#003366]" in html),
        ("标题字号 text-xl", "font-bold text-xl text-[#003366]" in html),
        ("菜单间距 gap-8", "gap-8" in html),
        ("无 ml-auto（菜单与登录按钮留距）", "ml-auto" not in html),
        ("登录按钮金底 D4AF37", "bg-[#D4AF37]" in html),
        ("两栏布局 grid-cols-5 gap-10", "lg:grid-cols-5 gap-10" in html),
        ("权益卡片渐变（绿→深蓝）", "from-[#1A5319] to-[#003366] rounded-2xl" in html),
        ("无深蓝 hero 残留（应白底导航）", "from-[#003366] to-[#0a2a52]" not in html),
    ]
    for name, cond in checks:
        check(name, cond)


# ============================================================
# 9. IIS web.config 基线（SPA fallback 仅 GET）
# ============================================================
def t_webconfig():
    print("\n[9/10] web.config 基线（IIS）")
    cfg = read("web.config")
    if cfg is None:
        check("web.config 存在", False)
        return
    check("SPA fallback 规则存在", "Rewrite" in cfg and "index.html" in cfg)
    check("仅 GET 走 fallback（防 405）", "REQUEST_METHOD" in cfg and "^GET$" in cfg)


# ============================================================
# 10. 部署文件基线（Linux/Docker）
# ============================================================
def t_deploy():
    print("\n[10/10] 部署文件基线（Linux/Docker）")
    nginx = read("deploy/nginx.conf")
    df = read("deploy/Dockerfile")
    if nginx:
        check("nginx.conf: SPA fallback (try_files)", "try_files $uri $uri/ /index.html" in nginx)
        check("nginx.conf: HTTPS 443", "443 ssl" in nginx)
        check("nginx.conf: 80→443 跳转", "return 301 https://" in nginx)
        check("nginx.conf: assets 长缓存", "immutable" in nginx)
    else:
        check("deploy/nginx.conf 存在", False)
    if df:
        check("Dockerfile: 基于 nginx", "FROM nginx" in df)
        check("Dockerfile: 暴露 80/443", "EXPOSE 80 443" in df)
    else:
        check("deploy/Dockerfile 存在", False)


# ============================================================
# 11.（可选）线上路由可达性
# ============================================================
def t_online():
    base = os.environ.get("BASE_URL", "").rstrip("/")
    if not base:
        return
    print(f"\n[+11] 线上路由可达性: {base}")
    for path in ["/", "/financial-supermarket", "/certificate-query", "/join-us/"]:
        try:
            req = urllib.request.Request(base + path, method="GET",
                                         headers={"User-Agent": "curl/8"})
            with urllib.request.urlopen(req, timeout=15) as r:
                check(f"路由可达 {path}", r.status == 200, f"HTTP {r.status}")
        except Exception as e:
            check(f"路由可达 {path}", False, str(e)[:100])


# ============================================================
# 汇总
# ============================================================
def main():
    print("=" * 56)
    print(" 企业绿色评级系统 · 静态回归测试（黄金基线）")
    print(f" 目标目录: {ROOT}")
    print("=" * 56)
    t_files()
    t_syntax()
    t_menu()
    t_nav_links()
    t_domains()
    t_apis()
    t_globals()
    t_styles()
    t_webconfig()
    t_deploy()
    t_online()

    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print("\n" + "=" * 56)
    print(f"回归结果: {passed}/{total} 通过")
    failed = [n for n, ok, _ in results if not ok]
    if failed:
        print("失败项:")
        for n in failed:
            print(f"  - {n}")
        sys.exit(1)
    print("🎉 全部通过，非修改部分功能保持稳定")
    sys.exit(0)


if __name__ == "__main__":
    main()
