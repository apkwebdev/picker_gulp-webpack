echo off
cls
echo Hellow, I'm the Modules Creator!
set /p name=Enter some module name:
md %name%
cd %name%
nul > %name%.pug
nul > %name%.scss
nul > %name%.js
echo Congratulations! 
echo Your "%name%" module was created! See you later...
timeout /t 3 /nobreak