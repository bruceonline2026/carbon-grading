$ErrorActionPreference = 'Continue'
Import-Module WebAdministration
$siteName = 'Test'
$thumb = '19A5701E74E722BBCFF08E4D28398B23DD8FA71A'

# 清理：删除 netsh sslcert + 删除 IIS https 绑定
Write-Host '===清理旧 sslcert 与绑定==='
netsh http delete sslcert ipport=0.0.0.0:443 2>&1 | Out-Null
$site = Get-WebSite -Name $siteName
$oldHttps = $site.Bindings.Collection | Where-Object { $_.Protocol -eq 'https' }
foreach ($b in $oldHttps) {
  Remove-WebBinding -Name $siteName -BindingInformation $b.BindingInformation
  Write-Host ('  删除 https 绑定: ' + $b.BindingInformation)
}

# SNI 模式新建（SSLFlags=1）
Write-Host '===SNI 模式新建 https 绑定==='
$binding = New-WebBinding -Name $siteName -Protocol 'https' -Port 443 -HostHeader 'test.tiici.com' -SslFlags 1
Write-Host ('  绑定创建: ' + $binding.BindingInformation)
# 关联证书（直接捕获异常）
try {
  $r = $binding.AddSslCertificate('LocalMachine', $thumb)
  Write-Host ('  证书绑定结果: ' + $r)
} catch {
  Write-Host ('  AddSslCertificate 失败: ' + $_.Exception.Message)
  Write-Host '  尝试 netsh 方式...'
  netsh http add sslcert ipport=0.0.0.0:443 certhash=$thumb appid='{2147E514-1234-5678-90AB-CDEF12345678}'
}

# 配置 HTTP→HTTPS 重定向
Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'enabled' -Value 'true' -PSPath (Join-Path 'IIS:\Sites' $siteName)
Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'destination' -Value 'https://test.tiici.com/' -PSPath (Join-Path 'IIS:\Sites' $siteName)
Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'exactDestination' -Value 'false' -PSPath (Join-Path 'IIS:\Sites' $siteName)
Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'httpResponseStatus' -Value 'Permanent' -PSPath (Join-Path 'IIS:\Sites' $siteName)
Write-Host '  HTTP->HTTPS 301 重定向已配置'

# 验证
Write-Host '===最终绑定==='
$site2 = Get-WebSite -Name $siteName
foreach ($b in $site2.Bindings.Collection) {
  Write-Host ('  ' + $b.Protocol + ' ' + $b.BindingInformation + ' SSLFlags=' + $b.SslFlags)
}