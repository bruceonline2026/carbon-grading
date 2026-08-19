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
MENU_REQUIRED = ["首页", "金融市场", "证书查询",
                 "评级流程", "价值主张", "合作伙伴", "加入我们"]
MENU_FORBIDDEN = ["能源计算", "演示说明", "指标申报"]

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
        ("引用 /config.js 环境配置（按域名自适应）", 'src="/config.js"' in html),
        ("Logo 使用 /images/site-logo.png", "/images/site-logo.png\"" in html),
        ("Logo 圆形 object-cover", "rounded-full object-cover" in html),
        ("favicon 使用 /favicon.png", "link rel=\"icon\" type=\"image/png\" href=\"/favicon.png\"" in html),
        ("标题字号 text-xl", "font-bold text-xl text-[#003366]" in html),
        ("菜单间距 gap-8", "gap-8" in html),
        ("无 ml-auto（菜单与登录按钮留距）", "ml-auto" not in html),
        ("登录按钮金底 D4AF37", "bg-[#D4AF37]" in html),
        ("两栏布局 grid-cols-5 gap-10", "lg:grid-cols-5 gap-10" in html),
        ("权益卡片渐变（绿→深蓝）", "from-[#1A5319] to-[#003366] rounded-2xl" in html),
        ("无深蓝 hero 残留（应白底导航）", "from-[#003366] to-[#0a2a52]" not in html),
        # ---- 页尾（与首页 Footer 一致）----
        ("页尾: 深蓝背景 bg-[#003366]", '<footer class="bg-[#003366] text-white py-20">' in html),
        ("页尾: 4 列金色小标题（快速链接/服务项目/联系我们）",
         html.count('text-[#D4AF37]">') >= 4),
        ("页尾: 快速链接 5 项", all(x in html for x in ["关于我们", "评级方法", "金融产品", "合作网络", "资源中心"])),
        ("页尾: 服务项目 5 项", all(x in html for x in ["ESG评估", "碳足迹分析", "绿色认证", "金融匹配", "合规支持"])),
        ("页尾: 联系我们 3 项", all(x in html for x in ["400-123-4567", "service@carbon-grading.com", "可持续发展大道"])),
        ("页尾: 备案号（ICP备 + 公网安备）", "沪ICP备2025151615号" in html and "沪公网安备31011502404964号" in html),
        ("页尾: 政策行（隐私政策/服务条款/Cookie政策）", all(x in html for x in ["隐私政策", "服务条款", "Cookie政策"])),
        ("页尾: Footer 链接动态配置（foot-q/foot-s）", "foot-q1" in html and "foot-s1" in html),
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
    # 自签名/测试证书环境下忽略证书校验
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    for path in ["/", "/financial-supermarket", "/certificate-query", "/join-us"]:
        try:
            req = urllib.request.Request(base + path, method="GET",
                                         headers={"User-Agent": "curl/8"})
            with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
                check(f"路由可达 {path}", r.status == 200, f"HTTP {r.status}")
        except Exception as e:
            check(f"路由可达 {path}", False, str(e)[:100])


# ============================================================
# 12. 源码工程基线（阶段A/B 迁移后新增）
# ============================================================
def t_src_site():
    print("\n[+12] 源码工程基线（src-site/）")
    pkg = read("src-site/package.json")
    check("src-site/package.json 存在", pkg is not None)
    if pkg:
        check("工程依赖 react/react-router-dom/vite/tailwind",
              all(x in pkg for x in ['"react"', '"react-router-dom"', '"vite"', '"tailwindcss"']))

    app = read("src-site/src/App.tsx")
    # 独立路由（不再包含 process/services/partners —— 它们是首页锚点）
    check("App.tsx 存在且含独立路由", app is not None and all(
        f'path: "{p}"' in app for p in
        ["financial-supermarket", "certificate-query", "about"]))
    if app:
        # 加入我们是独立静态页（join-us/index.html），不走 React 路由（防双页面字体不一致）
        check("App.tsx 无 join-us React 路由（静态页专用）", 'path: "join-us"' not in app)
    if app:
        # 流程/服务/合作伙伴不是独立路由
        check("App.tsx 无 /process 独立路由（首页锚点）", 'path: "process"' not in app)
        check("App.tsx 无 /services 独立路由（首页锚点）", 'path: "services"' not in app)
        check("App.tsx 无 /partners 独立路由（首页锚点）", 'path: "partners"' not in app)
        # /financial-supermarket 必须独立路由（uat B2 无 NavBar/Footer）
        fs_idx = app.find('path: "financial-supermarket"')
        layout_idx = app.find('element: <Layout />')
        check("金融超市: 独立路由（不通过 Layout 包裹）",
              fs_idx > 0 and layout_idx > 0 and fs_idx > layout_idx)
    # NavBar: 评级流程/价值主张/合作伙伴为首页锚点（hash 跳转）
    navbar2 = read("src-site/src/components/NavBar.tsx") or ""
    if navbar2:
        check("NavBar: 评级流程为首页锚点 /#process",
              'label: "评级流程"' in navbar2 and 'hash: "process"' in navbar2)
        check("NavBar: 价值主张为首页锚点 /#services",
              'label: "价值主张"' in navbar2 and 'hash: "services"' in navbar2)
        check("NavBar: 合作伙伴为首页锚点 /#partners",
              'label: "合作伙伴"' in navbar2 and 'hash: "partners"' in navbar2)
        check("NavBar: 无指标申报菜单", "指标申报" not in navbar2)
    # Home: 支持 hash 锚点滚动
    home_src = read("src-site/src/pages/Home.tsx") or ""
    check("Home: hash 锚点滚动支持（useLocation + scrollIntoView）",
          "useLocation" in home_src and "location.hash" in home_src
          and "scrollIntoView" in home_src)

    slider = read("src-site/src/components/SliderCaptcha.tsx")
    check("滑块算法常量（240/200/10）", slider is not None and all(
        x in slider for x in ["TRACK_PX = 240", "TARGET_PX = 200", "TOLERANCE = 10"]))

    client = read("src-site/src/api/client.ts")
    check("API 封装含 4 接口", client is not None and all(
        x in client for x in ["CertificateLookup", "FinancialProductLookup",
                              "FinancialProductTypeList", "CooperationApplication"]))
    if client:
        check("API 走 __entUrl__ 企业后台（无硬编码 carbon-grading）",
              "API_BASE = `${entUrl}/DataServices" in client)

    fm = read("src-site/src/pages/FinancialMarket.tsx")
    check("金融超市 12 兜底产品", fm is not None and
          all(x in fm for x in ["碳挂钩贷款", "可持续增长信贷", "ESG卓越融资", "节能改造专项贷",
                                "绿色债券发行支持", "碳中和转型基金", "绿能抵押融资", "小微绿色直通车",
                                "碳减排支持工具对接贷款", "可再生能源项目债券", "ESG主题投资基金", "绿色供应链金融"]))

    joinus = read("join-us/index.html")
    check("合作申请 10 字段（静态页 join-us/index.html）", joinus is not None and all(
        x in joinus for x in ["EnterpriseName", "EnterpriseCode", "Linkman", "Post",
                              "Tel", "EMail", "OfficiaWebsiteUrl", "Memo", "OrgType", "Region"]))

    cfg = read("src-site/public/config.js")
    check("public/config.js 含双域名配置", cfg is not None and "__entUrl__" in cfg and "__cgUrl__" in cfg)

    navbar = read("src-site/src/components/NavBar.tsx")
    if navbar:
        for kw in ["首页", "金融市场", "证书查询", "评级流程", "价值主张", "合作伙伴", "加入我们"]:
            check(f"NavBar 含菜单项: {kw}", kw in navbar)
        check("NavBar 无能源计算", "能源计算" not in navbar)
        check("NavBar 无指标申报", "指标申报" not in navbar)


# ============================================================
# 13. 视觉对照 checklist（确保源码工程每个页面的关键视觉特征存在）
#    与黄金基线（结构完整性）互补：本组聚焦"实际页面渲染与 uat 站一致"
#    的关键 className/文案/图标断言，作为视觉对齐的底线检查
# ============================================================
def t_visual_checklist():
    print("\n[+13] 视觉对照 checklist（源码工程）")

    home = read("src-site/src/pages/Home.tsx") or ""
    fm = read("src-site/src/pages/FinancialMarket.tsx") or ""
    cert = read("src-site/src/pages/CertificateQuery.tsx") or ""
    join = read("join-us/index.html") or ""
    footer = read("src-site/src/components/Footer.tsx") or ""
    navbar = read("src-site/src/components/NavBar.tsx") or ""
    slider = read("src-site/src/components/SliderCaptcha.tsx") or ""

    # ---- 首页：hero 与 5 区块 ----
    check("首页: hero 背景图为本地 /images/banner5.jpg", "/images/banner5.jpg" in home)
    check("首页: hero 标题'绿色评级，定义未来价值'", "绿色评级，" in home and "定义未来价值" in home)
    check("首页: hero 副标题'基于国家标准与AI大数据'", "基于国家标准与AI大数据" in home)
    check("首页: hero CTA'立即注册'", "立即注册" in home)
    check("首页: hero 链接到 EnterpriseRegistration", "EnterpriseRegistration@1" in home)
    check("首页: 区块'绿色金融服务'", "绿色金融服务" in home)
    check("首页: 区块'流程化评级体系'", "流程化评级体系" in home)
    check("首页: 流程四圈放大 w-40（与价值主张框匹配）", "w-40 h-40 rounded-full" in home)
    check("首页: 流程四圈图标 w-14", "w-14 h-14 text-white" in home)
    check("首页: 区块'核心价值主张'", "核心价值主张" in home)
    check("首页: 区块'合作机构'", "合作机构" in home)
    for p in ["上海环境能源交易所", "中国农业银行", "平安财产保险", "太平洋财产保险"]:
        check(f"首页: 合作机构 {p}", p in home)
    check("首页: 合作机构 SEEE logo 本地路径", "/images/seee_logo.png" in home)

    # ---- 金融超市（uat B2 结构） ----
    check("金融: hero 深蓝到深绿渐变 from-[#003366] to-[#1A5319]", "from-[#003366]" in fm and "to-[#1A5319]" in fm)
    check("金融: hero 内搜索框 placeholder", "搜索金融机构或绿色产品名称" in fm)
    check("金融: 左筛选卡片（aside w-80）", "w-80 flex-shrink-0" in fm)
    check("金融: 筛选卡片标题'筛选条件'", "筛选条件" in fm)
    check("金融: 4 个筛选维度（产品类型/适用评级/融资额度/所属银行）",
          all(x in fm for x in ["产品类型", "适用评级", "融资额度", "所属银行"]))
    check("金融: 侧栏本周热门推荐卡（绿色渐变）",
          "from-[#1A5319] to-[#003366]" in fm and "本周热门推荐" in fm)
    check("金融: 找到 N 个产品 计数", "找到" in fm)
    check("金融: 12 个兜底产品（部分代表）",
          all(x in fm for x in ["碳挂钩贷款", "ESG卓越融资", "可再生能源项目债券", "ESG主题投资基金", "绿色供应链金融"]))
    check("金融: 产品卡绿/蓝交替渐变（idx 奇偶切换 绿/蓝）",
          "idx" in fm and ("idx % 2" in fm or "idx%2" in fm)
          and "#1A5319" in fm and "#003366" in fm)
    check("金融: HOT 徽章 金色 bg-[#D4AF37]", "bg-[#D4AF37] text-white" in fm and "HOT" in fm)
    # 类型筛选必须是包含匹配（数据库 CPLX 字段为多值逗号分隔，如"绿色金融产品,绿色转型金融产品,供应链金融产品"）
    check("金融: 类型筛选用 includes（包含匹配）而非 ===",
          "includes(type)" in fm or ".type.includes(" in fm)
    # 评级筛选：接口 GradeShow 返回数字 1/2/3，筛选用数字等级比较（选 N 匹配 >=N）
    check("金融: 评级用数字等级比较（RATING_LEVEL + ratingLevelValue）",
          "RATING_LEVEL" in fm and "ratingLevelValue" in fm
          and ">=" in fm and "RATING_LEVEL[rating]" in fm)
    # API client: GradeShow 优先于 Grade（接口已规整好）
    client = read("src-site/src/api/client.ts") or ""
    check("API: GradeShow 评级展示文本字段",
          "GradeShow" in client and "GradeShow?: string" in client)
    check("API: ratingLabel 归一化（数字 1/2/3 + 评级等级全部适用）",
          "ratingLabel" in client and "评级等级全部适用" in client
          and "p.GradeShow ?? p.Grade" in client)

    # ---- 证书查询（uat iA 结构） ----
    check("证书: hero 渐变 from-[#003366] to-[#004d99]", "from-[#003366] to-[#004d99]" in cert)
    check("证书: 标题'证书公开查询'", "证书公开查询" in cert)
    check("证书: 副标题'权威数据 · 实时核验 · 安全可靠'", "权威数据 · 实时核验 · 安全可靠" in cert)
    check("证书: 透明纹理背景图为本地 /images/cubes.png", "/images/cubes.png" in cert)
    # 演示说明浮动提示：uat 是 demo 模式带此提示，生产环境不需要——已确认移除
    check("证书: 无'演示说明'浮动提示（uat demo 模式特有）",
          "演示说明" not in cert)
    check("证书: 无 DemoHint 组件残留",
          "DemoHint" not in cert)
    check("证书: 滑块触发查询按钮", "立即查询" in cert)
    check("证书: 结果卡片 6 字段（评级年度/所属区域/所属行业/评级类型/评级结果）",
          all(x in cert for x in ["评级年度", "所属区域", "所属行业", "评级类型", "评级结果", "评级等级"]))
    check("证书: 失败卡片'未查询到相关记录'", "未查询到相关记录" in cert)

    # ---- 加入我们 ----
    check("加入: 10 字段表单", all(x in join for x in
          ["EnterpriseName", "EnterpriseCode", "Linkman", "Post", "Tel", "EMail",
           "OfficiaWebsiteUrl", "Memo", "OrgType", "Region"]))
    check("加入: 5 项权益", all(x in join for x in
          ["官方授权资质", "专属数据平台", "专业培训支持", "业务协同资源", "市场推广赋能"]))
    # 加入我们：标题区为白底小标签+大标题+长副标题（uat 风格，无渐变 hero）
    check("加入: 标题区小标签'合作伙伴招募'",
          "合作伙伴招募" in join and ("▸" in join or "svg" in join))
    check("加入: 标题长副标题（诚邀具备专业资质...）",
          "诚邀具备专业资质的咨询机构" in join)
    check("加入: 无深蓝到深绿渐变 hero header（改为白底）",
          'bg-gradient-to-r from-[#003366] to-[#1A5319] text-white py-12' not in join)

    # ---- NavBar 7 项菜单 ----
    for m in ["首页", "金融市场", "证书查询", "评级流程", "价值主张", "合作伙伴", "加入我们"]:
        check(f"NavBar: 菜单 {m}", m in navbar)
    check("NavBar: 无'能源计算'", "能源计算" not in navbar)
    check("NavBar: 无'指标申报'", "指标申报" not in navbar)
    check("NavBar: 登录按钮金底深蓝字", "bg-[#D4AF37]" in navbar and "text-[#003366]" in navbar)

    # ---- Footer（uat ic 组件）----
    check("Footer: 深蓝背景 bg-[#003366]", "bg-[#003366]" in footer)
    check("Footer: 4 列金色小标题", all(x in footer for x in
          ["快速链接", "服务项目", "联系我们"]) and footer.count("text-[#D4AF37]") >= 4)
    check("Footer: 联系我们 4 项（地址/电话/邮箱）",
          all(x in footer for x in ["400-123-4567", "service@carbon-grading.com", "可持续发展大道"]))
    check("Footer: 版权行公司名（瑞鼎燊隆）",
          "瑞鼎燊隆（上海）科技有限公司" in footer)
    check("Footer: 版权行业务名（碳等级评估服务）",
          "瑞鼎燊隆碳等级评估服务" in footer)
    check("Footer: 备案区真实号码（ICP备 + 公网安备）",
          "沪ICP备2025151615号" in footer and "沪公网安备31011502404964号" in footer)
    check("Footer: 政策行（隐私政策/服务条款/Cookie政策）",
          all(x in footer for x in ["隐私政策", "服务条款", "Cookie政策"]))

    # ---- 滑块算法常量 ----
    check("滑块: 阈值常量 240/200/10", all(x in slider for x in
          ["TRACK_PX = 240", "TARGET_PX = 200", "TOLERANCE = 10"]))
    check("滑块: 背景图为本地 /images/slider-bg.jpg", "/images/slider-bg.jpg" in slider)


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
    t_src_site()
    t_visual_checklist()
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
