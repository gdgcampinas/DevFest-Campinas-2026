@echo off
rem Abre o telao do DevFest Campinas 2026 no Chrome em modo QUIOSQUE (tela cheia de verdade, sem barra de endereco, sem abas, por cima da barra de tarefas).
rem Uso: clique duas vezes, ou copie este arquivo (ou um atalho dele) para a pasta de inicializacao do Windows (Win+R, digite shell:startup) pra abrir sozinho ao ligar o computador.
rem Para SAIR do modo quiosque: Alt+F4.  Para trocar de janela: Alt+Tab.

set "TELAO_URL=https://gdgcampinas.github.io/DevFest-Campinas-2026/telao.html"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

rem Dois monitores: tire o "rem" da linha abaixo e troque 1920 pela largura do primeiro monitor (o telao abre no segundo).
rem set "MONITOR=--window-position=1920,0"

start "" "%CHROME%" --kiosk %MONITOR% --noerrdialogs --disable-infobars --no-first-run --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required --overscroll-history-navigation=0 --disable-features=Translate --user-data-dir="%LocalAppData%\telao-devfest" "%TELAO_URL%"
