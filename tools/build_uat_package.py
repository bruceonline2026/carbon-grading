#!/usr/bin/env python3
"""构建 UAT 部署包：npm build → 打包 dist + join-us + web.config + 部署脚本

用法：
  python tools/build_uat_package.py
产出：
  deploy-uat-<日期>.zip
"""
import os
import re
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_SITE = os.path.join(ROOT, "src-site")
DIST = os.path.join(SRC_SITE, "dist")
JOIN_US = os.path.join(ROOT, "join-us")
WEB_CONFIG = os.path.join(ROOT, "web.config")
PS1 = os.path.join(ROOT, "tools", "deploy_uat_server.ps1")
README = os.path.join(ROOT, "UAT部署说明.md")


def run(cmd, cwd=None):
    print(f"$ {' '.join(cmd)}")
    r = subprocess.run(cmd, cwd=cwd, check=True, capture_output=True, text=True)
    if r.stdout:
        print(r.stdout)
    if r.stderr:
        print(r.stderr, file=sys.stderr)


def build():
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    npm = os.environ.get("NPM", "npm")
    run([npm, "run", "build"], cwd=SRC_SITE)


SKIP_FILES = {".DS_Store", "Thumbs.db", ".gitignore"}


def collect_files(base_dir, arc_prefix=""):
    out = []
    for root, _dirs, files in os.walk(base_dir):
        for f in files:
            if f in SKIP_FILES:
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, base_dir).replace(os.sep, "/")
            arc = f"{arc_prefix}/{rel}" if arc_prefix else rel
            out.append((full, arc))
    return out


def make_package():
    today = datetime.now().strftime("%Y%m%d")
    zip_name = f"deploy-uat-{today}.zip"
    zip_path = os.path.join(ROOT, zip_name)
    if os.path.exists(zip_path):
        os.remove(zip_path)

    files_to_add = collect_files(DIST)

    if os.path.isdir(JOIN_US):
        files_to_add.extend(collect_files(JOIN_US, arc_prefix="join-us"))

    for src, arc in [(WEB_CONFIG, "web.config"), (PS1, "deploy_uat_server.ps1"), (README, "UAT部署说明.md")]:
        if os.path.exists(src):
            files_to_add.append((src, arc))

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for full, arc in files_to_add:
            z.write(full, arc)

    size = os.path.getsize(zip_path) / 1024
    print(f"\n✅ UAT 部署包已生成: {zip_path} ({size:.1f} KB)")
    print("包含文件:")
    for _, arc in files_to_add[:12]:
        print(f"  {arc}")
    if len(files_to_add) > 12:
        print(f"  ... 共 {len(files_to_add)} 个文件")
    return zip_path


def main():
    print("=== 1/2 构建 src-site ===")
    build()
    print("\n=== 2/2 打包 UAT 部署包 ===")
    make_package()


if __name__ == "__main__":
    main()
