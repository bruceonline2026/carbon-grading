#requires -RunAsAdministrator
<#
.SYNOPSIS
  UAT 服务器一键部署脚本：解压部署包到 IIS 网站根目录并验证。

.PARAMETER ZipPath
  部署包路径（如 C:\Users\Public\deploy-uat-20260817.zip）

.PARAMETER WebRoot
  IIS 网站根目录（默认 C:\inetpub\wwwroot）
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$ZipPath,

    [string]$WebRoot = "C:\inetpub\wwwroot"
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path (Split-Path $WebRoot -Parent) "backup-uat-$timestamp"

function Test-Uri($url) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
        return $r.StatusCode
    } catch {
        return $_.Exception.Response.StatusCode.Value__
    }
}

Write-Host "=== UAT 部署开始 ===" -ForegroundColor Cyan
Write-Host "部署包: $ZipPath"
Write-Host "网站根: $WebRoot"

# 1) 检查文件
if (-not (Test-Path $ZipPath)) {
    throw "部署包不存在: $ZipPath"
}
if (-not (Test-Path $WebRoot)) {
    throw "网站根目录不存在: $WebRoot"
}

# 2) 备份
Write-Host "=== 1/5 备份现有站点到 $backupDir ==="
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Get-ChildItem $WebRoot -Force | Where-Object { $_.Name -ne "backup" -and -not $_.Name.StartsWith("backup-") } | ForEach-Object {
    $dest = Join-Path $backupDir $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $dest -Force
    }
}
Write-Host "备份完成: $backupDir"

# 3) 清理旧文件（保留 backup 目录）
Write-Host "=== 2/5 清理旧文件 ==="
Get-ChildItem $WebRoot -Force | Where-Object {
    $_.Name -ne "backup" -and -not $_.Name.StartsWith("backup-")
} | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 4) 解压
Write-Host "=== 3/5 解压部署包 ==="
Expand-Archive -Path $ZipPath -DestinationPath $WebRoot -Force
Write-Host "解压完成"

# 5) 检查目录结构
Write-Host "=== 4/5 目录结构 ==="
Get-ChildItem $WebRoot -Force | Select-Object Name, @{N="Size";E={if($_.PSIsContainer){"dir"}else{$_.Length}}} | Format-Table -AutoSize

# 6) 验证
Write-Host "=== 5/5 站点验证 ==="
$urls = @(
    "http://localhost/",
    "http://localhost/financial-supermarket",
    "http://localhost/certificate-query",
    "http://localhost/join-us/"
)
$allOk = $true
foreach ($u in $urls) {
    $code = Test-Uri $u
    $flag = if ($code -eq 200) { "✅" } else { "❌" }
    Write-Host "  $flag $u -> HTTP $code"
    if ($code -ne 200) { $allOk = $false }
}

if ($allOk) {
    Write-Host "🎉 UAT 部署成功，所有验证通过" -ForegroundColor Green
} else {
    Write-Warning "部署完成，但部分验证未通过（可回滚到 $backupDir）"
    exit 1
}
