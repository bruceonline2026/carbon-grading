@echo off
rem Carbon-Grading SSL cert issue wrapper (scheduled task entry)
"C:\Program Files\nodejs\node.exe" C:\acme-node\request-cert.js > C:\acme-node\run.log 2>&1
