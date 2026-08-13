$ErrorActionPreference = 'Stop'
Write-Host '===1) 下载 win-acme v2.2.9.1701==='
$wacsDir = 'C:\wacs'
New-Item -ItemType Directory -Path $wacsDir -Force | Out-Null
$zip = "$wacsDir\wacs.zip"
$url = 'https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip'
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 240
  $sw.Stop()
  Write-Host ("  下载完成: {0} MB, 耗时 {1}s" -f [math]::Round((Get-Item $zip).Length/1MB,1), $sw.Elapsed.TotalSeconds)
} catch {
  Write-Host ('  下载失败: ' + $_.Exception.Message)
  exit 1
}
Write-Host '===2) 解压==='
Expand-Archive -Path $zip -DestinationPath $wacsDir -Force
$wacsExe = "$wacsDir\wacs.exe"
Write-Host ("  wacs.exe 存在: " + (Test-Path $wacsExe))
Write-Host '===3) 版本确认==='
& $wacsExe --version 2>&1 | Select-Object -First 3