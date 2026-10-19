# Telão no Windows (Chrome em quiosque): guia do dia do evento

O telão é a página `telao.html`. Ela roda sozinha num computador ligado ao painel de LED. **Só produção**: não existe modo DEV no telão.

## 1. Abrir em tela cheia de verdade
Uma página web não entra em tela cheia sozinha (o Chrome exige um gesto de uma pessoa). O jeito certo é abrir o Chrome em **modo quiosque**:

- Clique duas vezes em `DevFestIA/tools/telao/iniciar-telao.bat`, **ou**
- Crie um atalho do Chrome e, em Propriedades > Destino, acrescente depois do caminho entre aspas:
  `--kiosk --noerrdialogs --disable-infobars --no-first-run --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required --overscroll-history-navigation=0 --user-data-dir=C:\telao https://gdgcampinas.github.io/DevFest-Campinas-2026/telao.html`

Resultado: sem barra de endereço, sem abas e por cima da barra de tarefas. **Sair: `Alt+F4`.** Trocar de janela: `Alt+Tab`.

Reserva: se alguém abrir o telão em janela comum, aparece a dica "Clique ou aperte F para tela cheia"; o clique ou a tecla F põem em tela cheia (e `F11` também serve).

## 2. Abrir sozinho ao ligar
`Win+R`, digite `shell:startup`, cole o atalho (ou o `.bat`) nessa pasta. Ative o login automático do Windows (`netplwiz`).

## 3. Computador sem surpresas (Windows)
- **Energia:** Configurações > Sistema > Energia: tela e suspensão em **Nunca**, com o computador na tomada. Sem proteção de tela.
- **Notificações:** ative a Assistência de foco (Não incomodar) e feche programas que abrem janelas (atualizadores, chats).
- **Windows Update:** defina o "horário de uso" cobrindo o dia do evento e não reinicie no meio; atualize tudo na semana anterior.
- **Chrome:** atualizações do Chrome também só antes do dia. Fechar outros perfis e janelas.
- **Rede:** cabo de rede se possível; Wi-Fi/4G de reserva. O telão sobe uma cena de reserva se a internet cair e volta sozinho.
- **Resolução:** ajuste a do Windows para a do painel (1080p, ou a proporção do LED). O telão se adapta a qualquer proporção; `?tela=1920x1080` e `?proporcao=3:1` só simulam, não usar no dia.

## 4. Checklist do ensaio
1. Abrir pelo atalho/`.bat`: tela cheia, sem cursor, sem barras.
2. Deixar rodar 30 min: as cenas passam, o relógio avança.
3. Desligar a internet por 2 min e religar: reserva e volta sozinho.
4. Reiniciar o computador: o telão abre sozinho.
5. Testar o controle remoto pelo celular: `admin.html` > Telão (aviso e emergência).
6. Conferir o painel de saúde, se precisar: `telao.html?diag=1` (em janela comum).
