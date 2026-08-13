#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from ssh_win import ssh_run_ps

ps = r"""
$dst = 'C:\WebServer\Test'
Write-Host ("  目录存在: {0}" -f (Test-Path $dst))
$files = Get-ChildItem $dst -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ("  文件数: {0}" -f $files.Count)
$files | Select-Object FullName, Length | Format-Table -AutoSize
"""
out, err, _ = ssh_run_ps(ps, timeout=60)
print(out)
if err.strip(): print("STDERR:", err)