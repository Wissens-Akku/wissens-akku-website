@echo off
echo Starting local web server in a new window...
start "Wissens-Akku Server" npm start

echo Waiting for server to initialize (3 seconds)...
timeout /t 3 /nobreak > nul

echo Opening website in your default browser...
start http://127.0.0.1:8080

echo.
echo The server is running in a separate window. You can close this window.