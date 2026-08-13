$ErrorActionPreference = 'Continue'
Write-Host '===HTTPS 探活（接受自签名）==='
$handler = New-Object System.Net.Http.HttpClientHandler
$handler.ServerCertificateCustomValidationCallback = [System.Net.Http.ICertificateCustomValidationDelegate]{ $true }
$client = New-Object System.Net.Http.HttpClient $handler
$client.Timeout = [TimeSpan]::FromSeconds(15)
try {
  $r = $client.GetAsync('https://test.tiici.com/').Result
  Write-Host ('  / HTTPS: ' + $r.StatusCode + ' Server=' + ([string]$r.Headers.Server))
} catch { Write-Host ('  HTTPS 错误: ' + $_.Exception.Message) }

try {
  $r = $client.GetAsync('https://test.tiici.com/financial-supermarket').Result
  Write-Host ('  /financial-supermarket: ' + $r.StatusCode)
} catch { Write-Host ('  子路由错误: ' + $_.Exception.Message) }

try {
  $r = $client.GetAsync('https://test.tiici.com/certificate-query').Result
  Write-Host ('  /certificate-query: ' + $r.StatusCode)
} catch { Write-Host ('  子路由错误: ' + $_.Exception.Message) }

try {
  $r = $client.GetAsync('https://test.tiici.com/join-us/').Result
  Write-Host ('  /join-us/: ' + $r.StatusCode)
} catch { Write-Host ('  子路由错误: ' + $_.Exception.Message) }

Write-Host '===HTTP → HTTPS 跳 301==='
$client2 = New-Object System.Net.Http.HttpClient
$client2.Timeout = [TimeSpan]::FromSeconds(10)
try {
  $req = New-Object System.Net.Http.HttpRequestMessage 'GET', 'http://test.tiici.com/'
  $resp = $client2.SendAsync($req).Result
  Write-Host ('  HTTP 状态: ' + $resp.StatusCode)
  Write-Host ('  Location: ' + $resp.Headers.Location)
} catch { Write-Host ('  HTTP 错误: ' + $_.Exception.Message) }

Write-Host '===证书信息==='
$c = Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.Subject -match 'CN=test.tiici.com' } | Sort-Object NotAfter -Descending | Select-Object -First 1
if ($c) {
  Write-Host ('  Subject: ' + $c.Subject)
  Write-Host ('  Thumbprint: ' + $c.Thumbprint)
  Write-Host ('  NotAfter: ' + $c.NotAfter)
  Write-Host ('  HasPrivateKey: ' + $c.HasPrivateKey)
  Write-Host ('  EKU: ' + ($c.EnhancedKeyUsageList -join ', '))
}
Write-Host '===IIS 绑定最终状态==='
Get-WebSite -Name 'Test' | Select-Object -ExpandProperty Bindings | ForEach-Object { Write-Host ('  ' + $_.Protocol + ' ' + $_.BindingInformation + ' SSLFlags=' + $_.SslFlags) }
Write-Host '===站点文件==='
Get-ChildItem 'C:\WebServer\Test' -Recurse -Force | Where-Object { -not $_.PSIsContainer } | Select-Object FullName, Length | Format-Table -AutoSize
Write-Host '===config.js 域名==='
Get-Content 'C:\WebServer\Test\assets\config.js' | Select-String 'cgUrl|entUrl'