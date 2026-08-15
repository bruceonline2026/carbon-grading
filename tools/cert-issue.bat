@echo off
REM ============================================================
REM SSL 证书申请（增强版：Let's Encrypt HTTP-01 + ZeroSSL DNS-01 自动切换）
REM 输出同步写到 run.log，结果写到 exit.log
REM 实时查看: Get-Content C:\Users\Public\acme-node\run.log -Wait -Tail 30
REM ============================================================
set PATH=C:\Program Files\nodejs;%PATH%
cd /d C:\Users\Public\acme-node
call node request-cert.js > run.log 2>&1
echo %ERRORLEVEL% > exit.log