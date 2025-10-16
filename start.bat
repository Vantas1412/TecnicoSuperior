@echo off
echo.
echo ====================================================
echo   INICIANDO PROYECTO COMPLETO
echo ====================================================
echo.
echo [1/2] Iniciando servidor Express en puerto 3001...
start /B cmd /c "node server/server.js"
timeout /t 2 /nobreak >nul

echo [2/2] Iniciando frontend Vite en puerto 5173...
npm run dev

echo.
echo ====================================================
echo   Proyecto iniciado:
echo   - Frontend: http://localhost:5173
echo   - API:      http://localhost:3001/api/send-email
echo ====================================================
