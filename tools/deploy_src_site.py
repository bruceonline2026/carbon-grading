#!/usr/bin/env python3
"""阶段 A/B/C 源码工程部署脚本：构建产物 → test.tiici.com (IIS C:\\WebServer\\Test)

用法:
  python tools/deploy_src_site.py            # 打包并部署 src-site/dist
  python tools/deploy_src_site.py --check    # 部署前先跑回归测试（推荐）
  python tools/deploy_src_site.py --dry-run  # 仅构建+打包，不部署（本地验证）
"""
import argparse
import io
import os
import subprocess
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ssh_win import upload_bytes, ssh_run_ps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT, "src-site", "dist")
SRC_SITE = os.path.join(ROOT, "src-site")
REGRESSION_TEST = os.path.join(ROOT, "tests", "regression_test.py")
REMOTE_WEBROOT = r"C:\WebServer\Test"
REMOTE_TMP = r"C:\Users\Public\site-src-dist.zip"

# 保留文件（部署时不清除）
KEEP = ["web.config", ".well-known", "join-us"]

# 线上验证：部署后必须包含的资源/文案特征
ONLINE_CHECK_PATHS = ["/", "/financial-supermarket", "/certificate-query", "/join-us", "/config.js"]
# 线上验证：部署后必须包含的资源/文案特征
ONLINE_CHECK_PATHS = ["/", "/financial-supermarket", "/certificate-query", "/join-us", "/config.js"]
ONLINE_CHECK_KEYWORDS_HOME = [
    ("首页标题", "绿色评级"),
    ("首页副标题", "定义未来价值"),
    ("金融超市", "绿色金融超市"),
    ("证书查询", "证书公开查询"),
    ("加入我们", "加入我们"),
]
ONLINE_CHECK_KEYWORDS_JOIN_US = [
    ("join-us 页面", "合作伙伴权益"),
    ("join-us 表单", "合作申请表"),
]


def run_regression() -> bool:
    """跑回归测试（部署前守门）"""
    print("=== 0/5 部署前回归测试 ===")
    r = subprocess.run([sys.executable, REGRESSION_TEST], capture_output=True, text=True, timeout=120)
    out = r.stdout + r.stderr
    # 只打印最后一行汇总
    for line in out.splitlines():
        if "回归结果" in line or "🎉" in line or "FAIL" in line:
            print(f"  {line}")
    if r.returncode != 0 or "失败项" in out:
        print("❌ 回归测试失败，中止部署")
        return False
    return True


def build() -> bool:
    """npm run build（src-site）"""
    print("=== 1/5 构建 src-site ===")
    npm = os.environ.get("NPM", "npm")
    r = subprocess.run([npm, "run", "build"], cwd=SRC_SITE, capture_output=True, text=True, timeout=180)
    # 打印最后几行
    for line in r.stdout.splitlines()[-6:]:
        print(f"  {line}")
    if r.returncode != 0:
        print(f"❌ 构建失败:\n{r.stdout[-800:]}\n{r.stderr[-800:]}")
        return False
    return True


def make_zip():
    """把 dist/ + join-us/ 打包为 zip（内存中生成）"""
    if not os.path.isdir(DIST_DIR):
        print(f"❌ dist 目录不存在: {DIST_DIR}\n请先执行 npm run build")
        sys.exit(1)
    import shutil
    import tempfile
    tmp = tempfile.mkdtemp(prefix="site_")
    try:
        # 1) 复制 dist 内容到临时根
        for root, _dirs, files in os.walk(DIST_DIR):
            for f in files:
                full = os.path.join(root, f)
                rel = os.path.relpath(full, DIST_DIR)
                dst = os.path.join(tmp, rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(full, dst)
        # 2) 复制 join-us 静态页
        join_us_src = os.path.join(ROOT, "join-us")
        if os.path.isdir(join_us_src):
            join_us_dst = os.path.join(tmp, "join-us")
            shutil.copytree(join_us_src, join_us_dst, dirs_exist_ok=True)
        # 3) 打包
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            for root, _dirs, files in os.walk(tmp):
                for f in files:
                    full = os.path.join(root, f)
                    rel = os.path.relpath(full, tmp).replace(os.sep, "/")
                    z.write(full, rel)
        data = buf.getvalue()
        print(f"✅ 打包完成: {len(data)/1024:.1f} KB (含 dist + join-us)")
        return data
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def deploy_to_iis(zip_data: bytes) -> bool:
    print(f"=== 2/5 SFTP 上传 {REMOTE_TMP} ===")
    with open("/tmp/_site_dist.zip", "wb") as f:
        f.write(zip_data)
    upload_bytes("/tmp/_site_dist.zip", REMOTE_TMP)

    print("=== 3/5 远程解压到 IIS 网站根目录 ===")
    keeps = "','".join(KEEP)
    ps = rf"""
$ErrorActionPreference = 'Continue'
$zip = '{REMOTE_TMP}'
$dst = '{REMOTE_WEBROOT}'
Write-Host ('  zip 存在: ' + (Test-Path $zip) + ' 大小: ' + (Get-Item $zip).Length)
$keep = @('{keeps}')
Get-ChildItem $dst -Force -ErrorAction SilentlyContinue | Where-Object {{ $_.Name -notin $keep }} | Remove-Item -Recurse -Force
Expand-Archive -Path $zip -DestinationPath $dst -Force -ErrorAction SilentlyContinue
Write-Host ('  解压完成, 文件数: ' + (Get-ChildItem $dst -Recurse -Force).Count)
Write-Host '  目录内容:'
Get-ChildItem $dst -Force | Select-Object Name,Length | Format-Table -AutoSize
Write-Host '  assets:'
Get-ChildItem "$dst\assets" -ErrorAction SilentlyContinue | Select-Object Name,Length | Format-Table -AutoSize
"""
    out, err, rc = ssh_run_ps(ps, timeout=120)
    print(out)
    if err.strip():
        print("STDERR:", err[:800])
    return rc == 0


def online_verify() -> bool:
    """线上验证：资源可达 + 关键文案"""
    print("=== 4/5 线上验证（资源可达） ===")
    import urllib.request
    ok = True
    for path in ONLINE_CHECK_PATHS:
        url = f"https://test.tiici.com{path}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                status = r.status
        except urllib.error.HTTPError as e:
            status = e.code
        except Exception as e:
            status = f"ERR {e}"
            ok = False
        flag = "✅" if status == 200 else "❌"
        print(f"  {flag} {path:35s} HTTP {status}")
        if status != 200:
            ok = False

    print("=== 5/5 线上验证（关键文案） ===")
    try:
        # 首页文案在 JS bundle 中
        req = urllib.request.Request("https://test.tiici.com/", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", "ignore")
        import re
        m = re.search(r'assets/index-[^"]+\.js', html)
        if m:
            js_url = f"https://test.tiici.com/{m.group(0)}"
            with urllib.request.urlopen(urllib.request.Request(js_url, headers={"User-Agent": "Mozilla/5.0"}), timeout=15) as r:
                js = r.read().decode("utf-8", "ignore")
            for label, kw in ONLINE_CHECK_KEYWORDS_HOME:
                found = kw in js
                flag = "✅" if found else "❌"
                print(f"  {flag} {label}: '{kw}' {'存在' if found else '缺失'}")
                if not found:
                    ok = False
        else:
            print("  ⚠️ 未找到 JS bundle（可能 SPA 结构变化）")
        # join-us 静态页文案直接检查 HTML
        req2 = urllib.request.Request("https://test.tiici.com/join-us", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req2, timeout=15) as r:
            join_html = r.read().decode("utf-8", "ignore")
        for label, kw in ONLINE_CHECK_KEYWORDS_JOIN_US:
            found = kw in join_html
            flag = "✅" if found else "❌"
            print(f"  {flag} {label}: '{kw}' {'存在' if found else '缺失'}")
            if not found:
                ok = False
    except Exception as e:
        print(f"  ⚠️ 文案检查失败: {e}")
    return ok


def main():
    parser = argparse.ArgumentParser(description="src-site 部署脚本（test.tiici.com）")
    parser.add_argument("--check", action="store_true", help="部署前先跑回归测试（推荐）")
    parser.add_argument("--dry-run", action="store_true", help="仅构建+打包，不部署（本地验证）")
    args = parser.parse_args()

    if args.check:
        if not run_regression():
            sys.exit(1)

    if not build():
        sys.exit(1)

    zip_data = make_zip()

    if args.dry_run:
        print("✅ dry-run 完成（未部署到 IIS）")
        return

    if not deploy_to_iis(zip_data):
        print("❌ 部署失败")
        sys.exit(1)

    if online_verify():
        print("🎉 部署成功，线上验证通过")
    else:
        print("⚠️ 部署完成但线上验证部分失败（见上方 ❌ 项）")
        sys.exit(1)


if __name__ == "__main__":
    main()