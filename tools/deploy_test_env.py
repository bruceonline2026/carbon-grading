#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一站式部署到跳板机 IIS Test 网站"""
import sys, os, base64, paramiko, time

sys.path.insert(0, os.path.dirname(__file__))
from ssh_win import ssh_exec, ssh_run_ps, upload_bytes

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEPLOY_ZIP = os.path.join(ROOT, "deploy-uat-20260811.zip")

def step1_upload_and_unpack():
    print("\n[1/6] 上传并解压部署包 → C:\\WebServer\\Test")
    remote_tmp = r"C:\Users\Public\deploy-uat-20260811.zip"
    upload_bytes(DEPLOY_ZIP, remote_tmp)
    ps = r"""
$zip = 'C:\Users\Public\deploy-uat-20260811.zip'
$dst = 'C:\WebServer\Test'
# 清空旧文件（保留目录本身）
Get-ChildItem $dst -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
# 用 Expand-Archive（PowerShell 5+ 内置，比 ZipFile.ExtractToDirectory 更稳）
Expand-Archive -Path $zip -DestinationPath $dst -Force
Write-Host '===解压后文件==='
Get-ChildItem $dst -Recurse | Select-Object FullName | Format-Table -AutoSize
"""
    out, err, rc = ssh_run_ps(ps, timeout=120)
    print(out)
    if err.strip(): print("STDERR:", err)

def step2_update_config():
    print("\n[2/6] 更新 config.js：__cgUrl__ → https://test.tiici.com")
    ps = r"""
$cfgPath = 'C:\WebServer\Test\assets\config.js'
$c = Get-Content $cfgPath -Raw
$c = $c -replace 'window\.__cgUrl__\s*=\s*"[^"]+"', 'window.__cgUrl__ = "https://test.tiici.com"'
# 保留 __entUrl__ = uat-enterprise（后台测试域名 NXDOMAIN，暂保留 UAT 段）
$c = $c -replace 'window\.__entUrl__\s*=\s*"[^"]+"', 'window.__entUrl__ = "https://uat-enterprise.carbon-grading.com"'
Set-Content -Path $cfgPath -Value $c -Encoding UTF8
Write-Host '===更新后 config.js==='
Get-Content $cfgPath
"""
    out, err, rc = ssh_run_ps(ps, timeout=30)
    print(out)
    if err.strip(): print("STDERR:", err)

def step3_probe_public_80():
    print("\n[3/6] 探测 80 端口可达性（决定证书方案）")
    ps = r"""
$ErrorActionPreference = 'Continue'
try {
  $r = Invoke-WebRequest -Uri 'http://test.tiici.com/' -UseBasicParsing -TimeoutSec 8
  Write-Host ('  HTTP 状态: ' + $r.StatusCode)
  Write-Host ('  大小: ' + $r.RawContentLength)
  $head = $r.Content.Substring(0, [Math]::Min(200, $r.Content.Length))
  Write-Host ('  首行: ' + $head)
} catch {
  Write-Host ('  本地访问失败: ' + $_.Exception.Message)
}
"""
    out, _, _ = ssh_run_ps(ps, timeout=30)
    print(out)

def step4_try_acme():
    print("\n[4/6] 下载 win-acme 并尝试申请 Let's Encrypt 证书")
    ps = r"""
$ErrorActionPreference = 'Stop'
$wacsDir = 'C:\wacs'
New-Item -ItemType Directory -Path $wacsDir -Force | Out-Null
$wacsZip = "$wacsDir\wacs.zip"
$wacsExe = "$wacsDir\wacs.exe"
$url = 'https://github.com/win-acme/win-acme/releases/download/v2.2.7.1716/win-acme.v2.2.7.1716.x64.pluggable.zip'
try {
  Write-Host "  下载 win-acme..."
  Invoke-WebRequest -Uri $url -OutFile $wacsZip -UseBasicParsing -TimeoutSec 60
  Expand-Archive -Path $wacsZip -DestinationPath $wacsDir -Force
  Write-Host ("  解压完成: {0}" -f (Test-Path $wacsExe))
} catch { Write-Host ("  win-acme 下载失败: {0}" -f $_.Exception.Message); exit 1 }
"""
    out, _, _ = ssh_run_ps(ps, timeout=120)
    print(out)

    # 运行 win-acme（IIS 模式 + 站点名 Test + 主机名 test.tiici.com）
    # 注意：win-acme 默认申请 staging（如要生产需加 --centralserver LE_PROD）
    # 关键参数：
    #   --source iis：从 IIS 读取主机名
    #   --siteid 5：IIS Test 网站 ID
    #   --host test.tiici.com：主机名
    #   --email admin@tiici.com：账户邮箱
    #   --accepttos：接受条款
    #   --renew --renew-exit (只在续期时使用)
    # 新申请不需要 --renew，直接命令行参数即可
    ps = r"""
$ErrorActionPreference = 'Continue'
$wacsExe = 'C:\wacs\wacs.exe'
# 取 IIS Test 网站 ID
Import-Module WebAdministration
$site = Get-WebSite -Name 'Test'
$siteId = $site.Id
Write-Host ("  IIS Test ID: {0}, 物理路径: {1}" -f $siteId, $site.PhysicalPath)
# 取邮件（默认用 admin@tiici.com）
$email = 'admin@tiici.com'
# 调用 win-acme 申请证书（第一次需要加 --new 或默认行为）
$args = @(
  '--source', 'iis',
  '--siteid', $siteId,
  '--host', 'test.tiici.com',
  '--email', $email,
  '--accepttos',
  '--store', 'certificatestore'  # 证书存到 Windows CertStore 让 IIS 自动识别
)
Write-Host ("  运行: & '$wacsExe' $($args -join ' ')")
try {
  & $wacsExe @args 2>&1 | Out-String
  Write-Host ("  wacs exit: $LASTEXITCODE" -f $LASTEXITCODE)
} catch { Write-Host ("  wacs 调用异常: {0}" -f $_.Exception.Message) }
# 检查结果
Write-Host '===证书结果==='
Get-ChildItem Cert:\CurrentUser\My -ErrorAction SilentlyContinue | Where-Object { $_.NotAfter -gt (Get-Date) -and $_.Subject -match 'tiici' } | Select-Object Subject,NotAfter | Format-Table -AutoSize
Get-ChildItem Cert:\LocalMachine\My -ErrorAction SilentlyContinue | Where-Object { $_.NotAfter -gt (Get-Date) -and $_.Subject -match 'tiici' } | Select-Object Subject,NotAfter | Format-Table -AutoSize
"""
    out, _, _ = ssh_run_ps(ps, timeout=180)
    print(out)

def step5_fallback_selfsigned():
    print("\n[5/6] 自签名证书（fallback）")
    ps = r"""
$ErrorActionPreference = 'Stop'
$certDir = 'C:\WebServer\Test'
$cert = New-SelfSignedCertificate -Subject 'CN=test.tiici.com' -DnsName 'test.tiici.com' -CertStoreLocation 'Cert:\LocalMachine\My' -NotAfter (Get-Date).AddDays(365)
Write-Host ('  证书创建: thumb=' + $cert.Thumbprint)
$password = ConvertTo-SecureString -String 'testpass' -Force -AsPlainText
$pfx = "$certDir\test.pfx"
Export-PfxCertificate -Cert "Cert:\LocalMachine\My\$($cert.Thumbprint)" -FilePath $pfx -Password $password
Write-Host ('  PFX 已导出: ' + (Test-Path $pfx))
Write-Host ('  Thumbprint: ' + $cert.Thumbprint)
"""
    out, err, rc = ssh_run_ps(ps, timeout=60)
    print(out)
    if err.strip(): print("STDERR:", err)
    return rc == 0

def step6_bind_https():
    print("\n[6/6] HTTPS 绑定（自动检测用 ACME 还是自签名）")
    ps = r"""
$ErrorActionPreference = 'Stop'
Import-Module WebAdministration
$siteName = 'Test'
$site = Get-WebSite -Name $siteName
# 删除所有 test.tiici.com 旧证书，只保留一个最新的
$certs = Get-ChildItem Cert:\LocalMachine\My -ErrorAction SilentlyContinue | Where-Object { $_.Subject -match 'CN=test.tiici.com' }
Write-Host ('  发现 test.tiici.com 证书数: ' + $certs.Count)
$newest = $certs | Sort-Object NotAfter -Descending | Select-Object -First 1
foreach ($c in $certs) {
  if ($c.Thumbprint -ne $newest.Thumbprint) {
    Remove-Item (Join-Path 'Cert:\LocalMachine\My' $c.Thumbprint) -Force -ErrorAction SilentlyContinue
    Write-Host ('  删除旧证书: ' + $c.Thumbprint)
  }
}
$cert = $newest
if (-not $cert) { Write-Host '  ERROR: 未找到 test.tiici.com 证书'; exit 1 }
Write-Host ('  使用最新证书: ' + $cert.Subject + ' thumb=' + $cert.Thumbprint + ' 到期=' + $cert.NotAfter)
# 清理已有 https 绑定
$oldHttps = $site.Bindings.Collection | Where-Object { $_.Protocol -eq 'https' -and $_.BindingInformation -match 'test.tiici.com' }
foreach ($b in $oldHttps) {
  Remove-WebBinding -Name $siteName -BindingInformation $b.BindingInformation
  Write-Host ('  删除旧 https 绑定: ' + $b.BindingInformation)
}
# 新建 https 绑定
New-WebBinding -Name $siteName -Protocol 'https' -Port 443 -HostHeader 'test.tiici.com' -SslFlags 0
Start-Sleep -Seconds 1
# 用 netsh 绑定 SSL 证书（避开 PowerShell AddSslCertificate 的 CSP 兼容问题）
$appid = '{2147E514-1234-5678-90AB-CDEF12345678}'
$netshOut = netsh http add sslcert ipport=0.0.0.0:443 certhash=$($cert.Thumbprint) appid=$appid
Write-Host ('  netsh 绑定结果: ' + $netshOut)
# HTTP->HTTPS 重定向
Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'enabled' -Value 'true' -PSPath (Join-Path 'IIS:\Sites' $siteName)
Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'destination' -Value 'https://test.tiici.com/' -PSPath (Join-Path 'IIS:\Sites' $siteName)
Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'exactDestination' -Value 'false' -PSPath (Join-Path 'IIS:\Sites' $siteName)
Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'httpResponseStatus' -Value 'Permanent' -PSPath (Join-Path 'IIS:\Sites' $siteName)
Write-Host '  HTTP->HTTPS 301 重定向已配置'
Write-Host '===最终绑定==='
$bindings = Get-WebSite -Name $siteName | Select-Object -ExpandProperty Bindings
foreach ($b in $bindings) {
  Write-Host ('  ' + $b.Protocol + ' ' + $b.BindingInformation)
}
"""
    out, err, rc = ssh_run_ps(ps, timeout=60)
    print(out)
    if err.strip(): print("STDERR:", err)

def step7_verify():
    print("\n[7/7] 部署验证")
    ps = r"""
Write-Host '===目录文件==='
Get-ChildItem 'C:\WebServer\Test' -Recurse | Select-Object FullName | Format-Table -AutoSize
Write-Host '===HTTP 80 探活==='
try {
  $r = Invoke-WebRequest -Uri 'http://test.tiici.com/' -UseBasicParsing -TimeoutSec 10
  Write-Host ("  / HTTP {0}, {1} bytes" -f $r.StatusCode, $r.RawContentLength)
  $r = Invoke-WebRequest -Uri 'http://test.tiici.com/financial-supermarket' -UseBasicParsing -TimeoutSec 10
  Write-Host ("  /financial-supermarket HTTP {0}" -f $r.StatusCode)
  $r = Invoke-WebRequest -Uri 'http://test.tiici.com/certificate-query' -UseBasicParsing -TimeoutSec 10
  Write-Host ("  /certificate-query HTTP {0}" -f $r.StatusCode)
  $r = Invoke-WebRequest -Uri 'http://test.tiici.com/join-us/' -UseBasicParsing -TimeoutSec 10
  Write-Host ("  /join-us/ HTTP {0}" -f $r.StatusCode)
} catch { Write-Host ("  HTTP 80 测试失败: {0}" -f $_.Exception.Message) }
"""
    out, _, _ = ssh_run_ps(ps, timeout=60)
    print(out)

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "all"
    if action in ("all", "step1"):
        step1_upload_and_unpack()
    if action in ("all", "step2"):
        step2_update_config()
    if action in ("all", "step3"):
        step3_probe_public_80()
    if action in ("all", "step4"):
        step4_try_acme()
    if action in ("all", "step5"):
        step5_fallback_selfsigned()
    if action in ("all", "step6"):
        step6_bind_https()
    if action in ("all", "step7"):
        step7_verify()