#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SSH 跳板机工具（Windows Server + OpenSSH）"""
import sys, os, paramiko, time, base64, re

HOST = "47.116.215.156"
USER = "nadmin"
PASS = "Xmas18918676657!"
PORT = 22

def ssh_exec(cmd, timeout=60):
    """执行单条命令，返回 (stdout, stderr, exit_code)"""
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    try:
        si, so, se = c.exec_command(cmd, timeout=timeout)
        return so.read().decode('utf-8', errors='replace'), se.read().decode('utf-8', errors='replace'), so.channel.recv_exit_status()
    finally:
        c.close()

def ssh_run_ps(ps_script, timeout=120):
    """通过 SFTP 上传 ps1 并执行（避免 base64 + PowerShell 的 $ 与反斜杠转义问题）"""
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    try:
        # SFTP 上传 ps1 到远程
        sftp = c.open_sftp()
        local_tmp = "/tmp/_ssh_run.ps1"
        with open(local_tmp, 'w', encoding='utf-8') as f:
            f.write(ps_script)
        remote_ps1 = r"C:\Users\Public\_ssh_run.ps1"
        sftp.put(local_tmp, remote_ps1)
        sftp.close()
        # 执行（UTF-8 with BOM 让 PowerShell 正确识别中文）
        cmd = f'powershell -NoProfile -ExecutionPolicy Bypass -File {remote_ps1}\r'
        si, so, se = c.exec_command(cmd, timeout=timeout)
        out = so.read().decode('utf-8', errors='replace')
        err = se.read().decode('utf-8', errors='replace')
        return out, err, so.channel.recv_exit_status()
    finally:
        c.close()

def upload_bytes(local_path, remote_path):
    """通过 SFTP 直接上传文件（避免 base64 + PowerShell 的 $ 转义问题）"""
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    try:
        sftp = c.open_sftp()
        sftp.put(local_path, remote_path)
        sftp.close()
        # 校验大小
        size = os.path.getsize(local_path)
        print(f"上传完成: {remote_path} ({size} bytes)")
    finally:
        c.close()

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "whoami"
    if cmd == "probe":
        # 完整探测
        ps = r"""
Write-Host '===1) 域名解析==='
$domains = @('test.tiici.com','enterprise.tiici.com','test-enterprise.tiici.com','uat-enterprise.tiici.com','backend.tiici.com','admin.tiici.com','carbon-grading.com')
foreach ($d in $domains) {
  try {
    $r = Resolve-DnsName $d -ErrorAction Stop
    Write-Host ("  {0} -> {1}" -f $d, $r[0].IPAddress)
  } catch { Write-Host ("  {0} -> NXDOMAIN" -f $d) }
}
Write-Host '===2) 跳板机到 目标机(47.116.206.131) 80/443==='
Write-Host ("  TCP/80:  {0}" -f (Test-NetConnection -ComputerName 47.116.206.131 -Port 80 -InformationLevel Quiet).TcpTestSucceeded)
Write-Host ("  TCP/443: {0}" -f (Test-NetConnection -ComputerName 47.116.206.131 -Port 443 -InformationLevel Quiet).TcpTestSucceeded)
Write-Host '===3) IIS Test 网站==='
Import-Module WebAdministration
$w = Get-WebSite -Name Test
Write-Host ("  PhysicalPath: {0}" -f $w.PhysicalPath)
Write-Host ("  State: {0}" -f $w.State)
$w.Bindings.Collection | ForEach-Object { Write-Host ("  Binding: {0} {1}" -f $_.Protocol, $_.BindingInformation) }
Write-Host '===4) IIS 全站点==='
Get-WebSite | Select-Object Name,State,PhysicalPath | Format-Table -AutoSize
Write-Host '===5) 工具检查==='
Write-Host ("  win-acme(wacs.exe): {0}" -f (Test-Path C:\wacs\wacs.exe))
Write-Host ("  7zip: {0}" -f (Get-Command 7z -ErrorAction SilentlyContinue).Source)
Write-Host ("  Expand-Archive(PowerShell内置): Yes")
Write-Host '===6) 当前 Test 目录文件==='
Get-ChildItem $w.PhysicalPath -ErrorAction SilentlyContinue | Select-Object Name,Length | Format-Table -AutoSize
"""
        out, err, rc = ssh_run_ps(ps, timeout=60)
        print(out)
        if err.strip(): print("STDERR:", err)
    else:
        # 直接执行 PowerShell 命令
        out, err, rc = ssh_exec(f"powershell -NoProfile -Command \"{cmd}\"")
        print(out)
        if err.strip(): print("STDERR:", err)