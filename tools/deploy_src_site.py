#!/usr/bin/env python3
"""阶段A 源码工程部署脚本：构建产物 → test.tiici.com (IIS C:\\WebServer\\Test)

用法:
  python tools/deploy_src_site.py        # 打包并部署 src-site/dist
"""
import io
import os
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ssh_win import upload_bytes, ssh_run_ps

DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src-site", "dist")
REMOTE_WEBROOT = r"C:\WebServer\Test"
REMOTE_TMP = r"C:\Users\Public\site-src-dist.zip"

# 保留文件（部署时不清除）
KEEP = ["web.config", ".well-known", "join-us"]


def make_zip():
    """把 dist/ 打包为 zip（内存中生成）"""
    if not os.path.isdir(DIST_DIR):
        print(f"❌ dist 目录不存在: {DIST_DIR}\n请先执行 npm run build")
        sys.exit(1)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _dirs, files in os.walk(DIST_DIR):
            for f in files:
                full = os.path.join(root, f)
                rel = os.path.relpath(full, DIST_DIR).replace(os.sep, "/")
                z.write(full, rel)
    data = buf.getvalue()
    print(f"✅ 打包完成: {len(data)/1024:.1f} KB")
    return data


def deploy():
    print("=== 1/4 本地打包 dist ===")
    zip_data = make_zip()

    print(f"=== 2/4 SFTP 上传 {REMOTE_TMP} ===")
    with open("/tmp/_site_dist.zip", "wb") as f:
        f.write(zip_data)
    upload_bytes("/tmp/_site_dist.zip", REMOTE_TMP)

    print("=== 3/4 远程解压到 IIS 网站根目录 ===")
    keeps = "','".join(KEEP)
    ps = rf"""
$ErrorActionPreference = 'Continue'
$zip = '{REMOTE_TMP}'
$dst = '{REMOTE_WEBROOT}'
Write-Host ('  zip 存在: ' + (Test-Path $zip) + ' 大小: ' + (Get-Item $zip).Length)
# 只清除可替换内容（保留 web.config / .well-known / join-us）
$keep = @('{keeps}')
Get-ChildItem $dst -Force -ErrorAction SilentlyContinue | Where-Object {{ $_.Name -notin $keep }} | Remove-Item -Recurse -Force
# 解压
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

    print("=== 4/4 本地 HTTP 探活 ===")
    try:
        import urllib.request
        for path in ["/", "/financial-supermarket", "/certificate-query", "/join-us", "/config.js"]:
            url = f"https://test.tiici.com{path}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            try:
                with urllib.request.urlopen(req, timeout=15) as r:
                    print(f"  {path:35s} HTTP {r.status} ({r.headers.get('Content-Length', '?')}B)")
            except urllib.error.HTTPError as e:
                print(f"  {path:35s} HTTP {e.code}")
            except Exception as e:
                print(f"  {path:35s} {e}")
    except Exception as e:
        print("  探活异常:", e)


if __name__ == "__main__":
    deploy()
