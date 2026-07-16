@echo off
chcp 65001 >nul
title PAWMUSE 本地服务
cd /d "%~dp0"
set "PATH=C:\Users\Xiaomi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;C:\Users\Xiaomi\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback;%PATH%"
start "" cmd /c "timeout /t 3 /nobreak >nul & start "" http://localhost:3000"
echo 正在启动 PAWMUSE，请不要关闭此窗口...
call pnpm run start
pause
