# -*- coding: utf-8 -*-
"""
企业绿色评级系统 —— 端到端(E2E)自动化测试
覆盖: 首页 / SPA路由 / 导航改造 / 证书查询(真人验证 + 滑块同步 + API对接 + 结果渲染)
      / 产品类型动态加载(useEffect拉取FinancialProductTypeList接口 + window.__productTypes兜底)
      / 金融产品动态加载(useEffect拉取FinancialProductLookup接口:
        TC06 绿色金融超市-产品查询结果(window.__products) + 本周推荐(window.__hotProducts);
        TC07 首页金融产品(window.__homeProducts, 官网首页显示=true) 并校验已替换硬编码兜底)

用法:
  python3 tests/e2e_test.py                                # 默认测线上已发布版本
  BASE_URL=https://你的地址 python3 tests/e2e_test.py       # 指定测试地址
  BASE_URL=http://127.0.0.1:3000 python3 tests/e2e_test.py  # 测本地预览

依赖: pip install playwright && playwright install chromium

退出码: 0 = 全部通过, 1 = 有失败项 (可直接接入 CI)
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get(
    "BASE_URL", "https://a6724c73bfd2fc747.gz3.agentos-app.net"
).rstrip("/")

QUERY_PATH = "/certificate-query"
TEST_ENTERPRISE = "沙福科技（上海）有限公司"
TEST_CERT = "GR-2026-000003"
SLIDER_TARGET = 83  # 验证通过目标 ≈83.3% (阈值 Math.abs(i/100*240-200)<10)

results = []


def check(name, cond, detail=""):
    """记录一条断言结果并打印。"""
    results.append((name, bool(cond), detail))
    mark = "✅ PASS" if cond else "❌ FAIL"
    line = f"  {mark} {name}"
    if detail:
        line += f"  ({detail})"
    print(line)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        page = browser.new_page()
        page_errors = []
        api_requests = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        page.on(
            "request",
            lambda r: api_requests.append(r) if "CertificateLookup" in r.url else None,
        )
        lookup_requests = []
        page.on(
            "request",
            lambda r: lookup_requests.append(r)
            if "FinancialProductLookup" in r.url
            else None,
        )

        # ===================== TC01 首页 =====================
        page_errors.clear()
        try:
            resp = page.goto(BASE_URL + "/", wait_until="networkidle", timeout=30000)
            check("TC01 首页可访问(HTTP 200)", resp is not None and resp.status == 200,
                  f"HTTP {resp.status if resp else '无'}")
            title = page.title()
            check("TC01b 标题含品牌名", "绿色评级" in title or "企业绿色" in title,
                  f"title={title}")
            # 非白屏: 关键内容已渲染
            has_content = (
                page.locator("text=证书查询").count() > 0
                or page.locator("text=企业绿色评级系统").count() > 0
            )
            check("TC01c 首页内容已渲染(非白屏)", has_content)
            check("TC01d 首页无JS运行时错误", len(page_errors) == 0,
                  f"错误={page_errors[:1]}")
        except Exception as e:
            check("TC01 首页", False, repr(e))

        # ===================== TC02 SPA子路由 =====================
        page_errors.clear()
        try:
            resp2 = page.goto(BASE_URL + QUERY_PATH, wait_until="networkidle", timeout=30000)
            check("TC02 子路由/certificate-query返回200(非404)",
                  resp2 is not None and resp2.status == 200,
                  f"HTTP {resp2.status if resp2 else '无'}")
            inp = page.query_selector('input[placeholder="请输入精确的企业全称"]')
            check("TC02b 查询表单已渲染", inp is not None)
            check("TC02c 子路由无JS错误", len(page_errors) == 0,
                  f"错误={page_errors[:1]}")
        except Exception as e:
            check("TC02 子路由", False, repr(e))

        # ===================== TC03 导航改造 =====================
        try:
            uat_links = page.locator(
                'a[href*="uat-enterprise.carbon-grading.com/App/Enterprise"]'
            ).count()
            check("TC03 指标申报/登录已改为UAT外链", uat_links >= 1, f"外链数={uat_links}")
            body_text = page.evaluate("document.body.innerText")
            check("TC03b '能源计算'菜单已移除", "能源计算" not in body_text)
            check("TC03c '演示说明'浮窗已禁用", "演示说明" not in body_text)
        except Exception as e:
            check("TC03 导航改造", False, repr(e))

        # ===================== TC04 证书查询完整流程 =====================
        page_errors.clear()
        api_requests.clear()
        try:
            # 填表
            inputs = page.query_selector_all('input[type="text"]')
            if len(inputs) >= 2:
                inputs[0].fill(TEST_ENTERPRISE)
                inputs[1].fill(TEST_CERT)
            else:
                raise AssertionError(f"文本输入不足2个, 实际{len(inputs)}")

            # 点查询 -> 应弹出真人验证
            page.get_by_role("button", name="立即查询").click()
            page.wait_for_selector('input[type="range"]', timeout=5000)
            check("TC04a 点击查询后弹出真人验证滑块", True)

            # TC04b 滑块同步优化: 滑块容器内不应再有 transition-all
            thumb_transition = page.evaluate(
                """() => {
                    const range = document.querySelector('input[type=range]');
                    if (!range || !range.parentElement) return false;
                    const nodes = range.parentElement.querySelectorAll('*');
                    for (const el of nodes) {
                        if (el.className && typeof el.className === 'string'
                            && el.className.includes('transition-all')) {
                            return true;
                        }
                    }
                    return false;
                }"""
            )
            check("TC04b 滑块无transition-all(同步优化生效)", not thumb_transition)

            # 触发验证通过: 把滑块设到目标位置并派发事件
            page.evaluate(
                f"""() => {{
                    const range = document.querySelector('input[type="range"]');
                    const setter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, 'value').set;
                    setter.call(range, '{SLIDER_TARGET}');
                    range.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    range.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    range.dispatchEvent(new MouseEvent('mouseup', {{ bubbles: true }}));
                    range.dispatchEvent(new TouchEvent('touchend', {{ bubbles: true }}));
                }}"""
            )

            # 等待 API 结果写入 window.__certResultData
            page.wait_for_function(
                "() => window.__certResultData && window.__certResultData.companyName",
                timeout=15000,
            )
            data = page.evaluate("window.__certResultData")
            check("TC04c API已调用(CertificateLookup)", len(api_requests) >= 1,
                  f"API请求数={len(api_requests)}")
            check("TC04d 企业名称非空", bool(data.get("companyName")),
                  f"companyName={data.get('companyName')}")
            check("TC04e 评级等级(grade)非空", bool(data.get("grade")),
                  f"grade={data.get('grade')}")
            check("TC04f 所属区域(region)非空", bool(data.get("region")),
                  f"region={data.get('region')}")
            check("TC04g 评级结果(result)非空", bool(data.get("result")),
                  f"result={data.get('result')}")
            check("TC04h 证书编号(certId)非空", bool(data.get("certId")),
                  f"certId={data.get('certId')}")
            check("TC04h2 评级类型(ratingType)非空",
                  bool(data.get("ratingType")),
                  f"ratingType={data.get('ratingType')}")

            # TC04i 结果卡片 DOM 正确渲染企业名
            rendered = page.evaluate(
                "() => document.body.innerText.includes(%r)" % TEST_ENTERPRISE
            )
            check("TC04i 结果卡片正确渲染企业名称", rendered)
            # TC04i2 DOM 含"评级类型"标签且含实际值
            rendered_rt = page.evaluate(
                """() => {
                    const t = document.body.innerText;
                    return t.includes('评级类型') && t.includes(%r);
                }""" % data.get("ratingType", "")
            )
            check("TC04i2 结果卡片渲染'评级类型'及实际值", rendered_rt,
                  f"值={data.get('ratingType')}")

            check("TC04j 查询流程无JS错误", len(page_errors) == 0,
                  f"错误={page_errors[:1]}")
        except Exception as e:
            check("TC04 证书查询流程", False, repr(e))

        # ===================== TC05 产品类型动态加载 =====================
        page_errors.clear()
        product_api_requests = []
        page.on(
            "request",
            lambda r: product_api_requests.append(r)
            if "FinancialProductTypeList" in r.url
            else None,
        )
        try:
            resp5 = page.goto(
                BASE_URL + "/financial-supermarket",
                wait_until="networkidle",
                timeout=30000,
            )
            check(
                "TC05 金融产品页可访问(HTTP 200)",
                resp5 is not None and resp5.status == 200,
                f"HTTP {resp5.status if resp5 else '无'}",
            )
            # 等待 useEffect 动态加载完成, window.__productTypes 被填充
            page.wait_for_function(
                "() => Array.isArray(window.__productTypes) && window.__productTypes.length >= 2",
                timeout=15000,
            )
            pt = page.evaluate("window.__productTypes")
            check(
                "TC05b 产品类型接口已调用(FinancialProductTypeList)",
                len(product_api_requests) >= 1,
                f"请求数={len(product_api_requests)}",
            )
            norm = [str(v).strip() for v in pt]
            core = [
                "其他金融产品",
                "绿色金融产品",
                "绿色转型金融产品",
                "供应链金融产品",
                "绿色保险",
                "绿色转型保险",
                "其他保险产品",
                "投资理财",
            ]
            missing = [c for c in core if c not in norm]
            check(
                "TC05c 产品类型含'全部'选项",
                "全部" in norm,
                f"首项={norm[0] if norm else '空'}",
            )
            check(
                "TC05d 产品类型含接口返回的8个动态值(非硬编码)",
                len(missing) == 0,
                f"缺失={missing}",
            )
            check(
                "TC05e 数量正确(全部+8=9)",
                len(pt) == 9,
                f"实际数量={len(pt)}",
            )
            # DOM 渲染校验: 产品类型下拉区域确实渲染了动态值
            dom_has = page.evaluate(
                """() => {
                    const labels = [...document.querySelectorAll('label')];
                    const lbl = labels.find(l => (l.textContent||'').trim() === '产品类型');
                    if (!lbl || !lbl.parentElement) return false;
                    return lbl.parentElement.innerText.includes('绿色金融产品');
                }"""
            )
            check("TC05f DOM下拉渲染动态产品类型", dom_has)
            check(
                "TC05g 金融产品页无JS错误",
                len(page_errors) == 0,
                f"错误={page_errors[:1]}",
            )
        except Exception as e:
            check("TC05 产品类型动态加载", False, repr(e))

        # ===================== TC06 金融产品动态加载(超市查询+本周推荐) =====================
        page_errors.clear()
        try:
            resp6 = page.goto(
                BASE_URL + "/financial-supermarket",
                wait_until="networkidle",
                timeout=30000,
            )
            check(
                "TC06 金融产品页可访问(HTTP 200)",
                resp6 is not None and resp6.status == 200,
                f"HTTP {resp6.status if resp6 else '无'}",
            )
            # 等待两个全局被填充(超市结果 + 本周推荐)
            page.wait_for_function(
                "() => Array.isArray(window.__products) && window.__products.length >= 1 "
                "&& Array.isArray(window.__hotProducts) && window.__hotProducts.length >= 1",
                timeout=15000,
            )
            products = page.evaluate("window.__products")
            hot = page.evaluate("window.__hotProducts")
            check(
                "TC06b FinancialProductLookup接口已调用",
                len(lookup_requests) >= 1,
                f"请求数={len(lookup_requests)}",
            )
            check(
                "TC06c 超市产品查询结果已动态加载(>=1条)",
                len(products) >= 1,
                f"数量={len(products)}",
            )
            check(
                "TC06d 本周推荐已动态加载(>=1条)",
                len(hot) >= 1,
                f"数量={len(hot)}",
            )
            # DOM 渲染校验: 轮询直到任一已加载产品名出现在页面(textContent不参与布局, 避免innerText竞态)
            page.wait_for_function(
                "() => { const ps = window.__products || []; const t = document.body.textContent || ''; return ps.some(p => p.title && t.indexOf(p.title) >= 0); }",
                timeout=12000,
            )
            first_title = (products[0].get("title") or "") if products else ""
            dom_text = page.evaluate("() => document.body.textContent || ''")
            any_rendered = any(p.get("title") and p["title"] in dom_text for p in products) if products else False
            check(
                "TC06e DOM渲染动态产品(列表含API产品名)",
                any_rendered,
                f"示例产品名={first_title}",
            )
            # 本周推荐区块渲染校验: 轮询直到任一API推荐产品名出现在页面(textContent更稳)
            hot_title = (hot[0].get("title") or "") if hot else ""
            page.wait_for_function(
                "() => { const hot = window.__hotProducts || []; const t = document.body.textContent || ''; return hot.slice(0,3).some(p => p.title && t.indexOf(p.title) >= 0); }",
                timeout=12000,
            )
            hot_rendered = True
            check(
                "TC06f 本周推荐区块渲染API产品名",
                bool(hot_title) and hot_rendered,
                f"推荐名={hot_title}",
            )
            check(
                "TC06g 金融产品页无JS错误",
                len(page_errors) == 0,
                f"错误={page_errors[:1]}",
            )
        except Exception as e:
            check("TC06 金融产品动态加载", False, repr(e))

        # ===================== TC07 首页金融产品动态加载 =====================
        page_errors.clear()
        try:
            resp7 = page.goto(BASE_URL + "/", wait_until="networkidle", timeout=30000)
            check(
                "TC07 首页可访问(HTTP 200)",
                resp7 is not None and resp7.status == 200,
                f"HTTP {resp7.status if resp7 else '无'}",
            )
            # 等待首页产品全局被填充(官网首页显示=true 接口)
            page.wait_for_function(
                "() => Array.isArray(window.__homeProducts) && window.__homeProducts.length >= 1",
                timeout=15000,
            )
            home = page.evaluate("window.__homeProducts")
            check(
                "TC07b 首页金融产品已动态加载(>=1条, 官网首页显示=true)",
                len(home) >= 1,
                f"数量={len(home)}",
            )
            # DOM 渲染校验: 轮询直到首页出现任一API产品名(textContent避免innerText布局竞态)
            page.wait_for_function(
                "() => { const ps = window.__homeProducts || []; const t = document.body.textContent || ''; return ps.some(p => p.title && t.indexOf(p.title) >= 0); }",
                timeout=12000,
            )
            home_title = (home[0].get("title") or "") if home else ""
            dom_home = page.evaluate("() => document.body.textContent || ''")
            any_home = any(p.get("title") and p["title"] in dom_home for p in home) if home else False
            check(
                "TC07c DOM渲染首页动态产品",
                any_home,
                f"示例产品名={home_title}",
            )
            # 强校验: 已用API数据替换硬编码兜底(碳挂钩贷款不应再出现)
            fallback_gone = "碳挂钩贷款" not in dom_home
            check(
                "TC07d 已动态替换硬编码兜底(碳挂钩贷款不在DOM)",
                fallback_gone,
            )
            check(
                "TC07e 首页无JS错误",
                len(page_errors) == 0,
                f"错误={page_errors[:1]}",
            )
        except Exception as e:
            check("TC07 首页金融产品动态加载", False, repr(e))

        browser.close()

    # ===================== 汇总 =====================
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print("\n" + "=" * 52)
    print(f"测试结果: {passed}/{total} 通过")
    failed = [n for n, ok, _ in results if not ok]
    if failed:
        print("失败项:")
        for n in failed:
            print(f"  - {n}")
        sys.exit(1)
    print("🎉 全部通过")
    sys.exit(0)


if __name__ == "__main__":
    main()
