$ErrorActionPreference = 'Continue'
# Carbon-Grading SSL cert issue (scheduled task entry)
$p = Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'C:\acme-node\request-cert.js' -WorkingDirectory 'C:\acme-node' -WindowStyle Hidden -RedirectStandardOutput 'C:\acme-node\run.log' -RedirectStandardError 'C:\acme-node\err.log' -PassThru
$done = $p.WaitForExit(600000)
if (-not $done) { $p.Kill(); 'TIMEOUT' | Out-File 'C:\acme-node\exit.log' -Encoding utf8 }
else { ('EXIT ' + $p.ExitCode) | Out-File 'C:\acme-node\exit.log' -Encoding utf8 }
