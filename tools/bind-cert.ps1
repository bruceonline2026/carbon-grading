# ============================================================
# bind-cert.ps1 - 将证书 thumbprint 绑定到 IIS Test 站点 443
# 用法: powershell -File bind-cert.ps1 <thumbprint>
# 依赖: IISAdministration 模块（Windows Server 2016+ 自带）
# ============================================================
param([Parameter(Mandatory=$true)][string]$Thumbprint)

$ErrorActionPreference = 'Stop'
$Thumbprint = $Thumbprint.ToUpper().Trim()

# 1) 用 IISAdministration 设置站点绑定证书
Import-Module IISAdministration
$bytes = for ($i = 0; $i -lt $Thumbprint.Length; $i += 2) {
  [Convert]::ToByte($Thumbprint.Substring($i, 2), 16)
}
$sm = Get-IISServerManager
$binding = $sm.Sites['Test'].Bindings | Where-Object { $_.Protocol -eq 'https' -and $_.BindingInformation -like '*443*' }
if (-not $binding) { throw '未找到 Test 站点的 https 443 绑定' }
$binding.CertificateHash = $bytes
$binding.CertificateStoreName = 'My'
$sm.CommitChanges()
Write-Host "IIS binding cert -> $Thumbprint"

# 2) netsh 全局兜底（HTTP.sys 层，用于非 IIS URL 或兜底）
cmd /c "netsh http delete sslcert ipport=0.0.0.0:443" 2>$null | Out-Null
cmd /c "netsh http add sslcert ipport=0.0.0.0:443 certhash=$Thumbprint appid={2147E514-1234-5678-90AB-CDEF12345678} certstorename=MY" | Out-Null
Write-Host "netsh 443 cert -> $Thumbprint"

Write-Host 'BIND_SUCCESS'
