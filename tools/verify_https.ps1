$ErrorActionPreference = 'Continue'
Write-Host '===443 监听==='
Get-NetTCPConnection -LocalPort 443 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize
Write-Host '===HTTPS 本地探活==='
try {
  [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
  $r = Invoke-WebRequest -Uri 'https://test.tiici.com/' -UseBasicParsing -TimeoutSec 8
  Write-Host ('  HTTPS 状态: ' + $r.StatusCode + ' 大小: ' + $r.RawContentLength)
} catch {
  Write-Host ('  HTTPS 错误: ' + $_.Exception.Message)
}
Write-Host '===HTTP 跳 HTTPS==='
try {
  $r = Invoke-WebRequest -Uri 'http://test.tiici.com/' -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 8
  Write-Host ('  HTTP 状态: ' + $r.StatusCode + ' (期望 301)')
} catch {
  Write-Host ('  HTTP 错误: ' + $_.Exception.Message + ' (期望: 远程服务器返回错误: 301/302)')
}
Write-Host '===SPA 子路由==='
try {
  $r = Invoke-WebRequest -Uri 'https://test.tiici.com/financial-supermarket' -UseBasicParsing -TimeoutSec 8
  Write-Host ('  /financial-supermarket: ' + $r.StatusCode)
  $r = Invoke-WebRequest -Uri 'https://test.tiici.com/certificate-query' -UseBasicParsing -TimeoutSec 8
  Write-Host ('  /certificate-query: ' + $r.StatusCode)
  $r = Invoke-WebRequest -Uri 'https://test.tiici.com/join-us/' -UseBasicParsing -TimeoutSec 8
  Write-Host ('  /join-us/: ' + $r.StatusCode)
} catch {
  Write-Host ('  子路由错误: ' + $_.Exception.Message)
}