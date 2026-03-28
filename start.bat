@echo off
echo ============================================
echo   BrickBanq Local Development Server
echo ============================================

echo.
echo [1/2] Starting Backend (FastAPI) on port 8000...
cd /d "%~dp0backend"
start "BrickBanq Backend" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo [2/2] Starting Frontend (Vite) on port 3000...
cd /d "%~dp0frontend"
start "BrickBanq Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo   Both servers are starting!
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Test Login Credentials:
echo   Admin:    admin@brickbanq.com    / Admin@123
echo   Borrower: borrower@brickbanq.com / Borrower@123
echo   Lender:   lender@brickbanq.com   / Lender@123
echo   Investor: investor@brickbanq.com / Investor@123
echo   Lawyer:   lawyer@brickbanq.com   / Lawyer@123
echo ============================================
pause
