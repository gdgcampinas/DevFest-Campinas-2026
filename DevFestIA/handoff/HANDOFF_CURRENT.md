# Handoff — Current State

## CONTINUIDADE CRUZADA DE MARCA E REDES SOCIAIS (2026-10-18)

- O contexto de identidade e comunicação do projeto guarda-chuva GDG Campinas foi consolidado em `../../../../handoff/HANDOFF_CURRENT.md` e `../../../../docs/Marca_e_Mascote_2026.md`. A tarefa inclui peças comunitárias para Sympla, cards de palestrantes/voluntários, camiseta e futura estratégia de Instagram/LinkedIn; essas artes não são parte do código do site e não estão automaticamente aprovadas/publicadas.
- Materiais de perfil Sympla estão em `../../../../Design/gdg-sympla/`; não tratar o arquivo final ou a variante como publicados. A transferência do chat misturado com GitFlow foi documentada no handoff raiz.
- Para qualquer peça, preservar os logos oficiais. Lockup Google Developer Groups: símbolo colorido à esquerda, texto à direita em três linhas, branco em fundo escuro. Preservar o Gumbleton aprovado e não o colocar sobre retrato/foto de palestrante.
- O chat novo para trabalho de marca/redes pode começar pelo prompt em `NEW_CHAT_PROMPT.md`, que aponta os arquivos de continuidade geral e específicos do site.

## Verificação Git local do protocolo (2026-10-18)

- `development` = `d0ae6cc`; os refs locais `origin/development` e `origin/main` também apontam para esse commit. A branch local `main` permanece em `a2124cc`, 324 commits atrás de `development`.
- Worktree já continha alterações locais em segurança/moderação (`docs/admin.html`, `docs/js/**`, `docs/mural-*.html`, `.claude/`). Nenhuma foi alterada pelo protocolo. Consulta à rede para GitHub/CI falhou por indisponibilidade de conexão; estado remoto e CI não foram confirmados nesta sessão. Não houve commit nem push.
- Com acesso autorizado ao servidor local ai-memory do Akita, foi atualizada a página `notes/comunicacao-e-identidade-2026.md` no projeto `default/gdgcampinas-devfest-campinas-2026`, preservando as diretrizes de marca e pendências de campanha.

## SESSÃO 15B (2026-10-14 a 2026-10-23): TELÃO EM PRODUÇÃO, PATROCÍNIO, INGRESSOS ABERTOS, SYNC DO SYMPLA, FUNDOS DE TELA, CARTÃO E GUIA DE TAMANHOS
**Estado:** `main` = `development`, CI verde, Pages publicado. Detalhes de cada item em `PROJECT_CONTEXT.md` (blocos "Cotas de patrocínio e vídeo da FIAP", "Patrocínio em PRODUÇÃO só com o Master", "Revisão de inglês", "Telão com dados de PRODUÇÃO", "URL do telão = produção", "Página do telão renomeada", "LISTA DE ESPERA dos ingressos", "Admin > Lista de espera", "Página Ingressos em lista de espera"). Memória durável dessa sessão também no **ai-memory** (páginas `_rules/`, `decisions/`, `procedures/`, `gotchas/`, `notes/`; handoff compartilhado).
**Feito:**
1. **Patrocínio**: cotas pela tabela comercial (Master, Especialista, Sênior, Pleno, Júnior, Intern, Cota Permuta, Apoio), sem preço no site. Em produção só marcas `public: true`: Master **Google Developer Groups** (logo oficial) e Pleno **FIAP**. Realização "GDG Campinas by Google Developer Groups"; rodapé com a mesma frase. Cards redesenhados (Master em destaque, largura máxima por cota, comunidades em tiles de logo).
2. **Inglês**: patrocínio, depoimentos, Time (17 bios), Código de conduta, regras do sorteio e cabeçalhos fixos; `check-i18n.js` agora cobre esses dados e confere cota e alt.
3. **Trilhas**: "Front-end / Back-end / Data - Full Stack" e "Carreira em Tecnologia" em todo o site (share card e `og-image.png` regerada).
4. **Telão**: `telao.html` (mural.html redireciona), dados só de produção, URL normal = produção (modo DEV/ensaio não vazam), vídeo da FIAP e patrocinadores liberados no telão de produção (só marcas públicas), layouts `compact` e de cota única conferidos em 16:9, 4:3 e vertical, cena espera download do vídeo (`MURAL_WAIT`).
5. **Lista de espera dos ingressos (LIBERADA em produção)**: botão "Avise-me quando abrir", cartão com formulário, página Ingressos com bloco "Estamos preparando os ingressos" e cartões-fantasma, sem "Gerar meu cartão"; admin > Lista de espera (CSV, copiar e-mails, remover); regras `waitlist` publicadas pelo Renato.
6. **CI**: workflows em `ubuntu-24.04`; teste instável de contagem de votos estabilizado.
7. **ai-memory** (akitaonrails) instalado só para o Claude Code: binário em `~/.local/bin`, LaunchAgent local, hooks e skills em `~/.claude`; servidor reiniciado em 3.1.0; captura local, sem nuvem.
8. **INGRESSOS REAIS prontos, SÓ EM DEV (2026-10-17/18):** `data/tickets.js` com os 2 tipos do Sympla (Ingresso Grátis R$ 0 e Ingresso + Kit Camiseta R$ 45,10; a taxa do Sympla NÃO é detalhada no site; 100 vagas cada, selo "Só 100 vagas" = escassez real; certificado "para quem fizer check-in em ao menos uma palestra" nos dois; sem VIP). Prévia em DEV: `ingressos.html?lineup=1&vendas=1`. Produção segue com a lista de espera. **Pra ABRIR:** o Renato deixa os 2 ingressos VISÍVEIS no Sympla (hoje "OCULTO") e SÓ DEPOIS troca-se `waitlist.enabled:false` e `salesOpen:true` em `data/schedule.js`. Se mudarem as vagas no Sympla, trocar o selo. Divulgação: nenhuma meta numérica no site nem aqui (decisão do Renato); a estratégia fica só na memória local do ai-memory.
9. **PORTA DE MODERAÇÃO (2026-10-18):** só o dono (`gdgcampinascontato@gmail.com`, fixo nas regras) e os e-mails cadastrados em Admin > Moderadores usam admin, controle do telão e fotos. Antes, qualquer conta Google abria a casca do admin (os dados já eram recusados pelas regras, teste `admin-access-rules.test.js`). Agora a tela barra: `features/moderator-access.js` (+ `components/moderator-access.js`, `data/moderator-access-*.js`) lê `raffle-state/current` (só moderador lê); "sem permissão" = bloqueio com troca de conta, erro de rede = bloqueio com "Tentar de novo". Conta nova de moderador: dono cadastra o e-mail em Admin > Moderadores (ex.: renatoramosf7@gmail.com ainda precisa ser cadastrada).
10. **INGRESSOS ABERTOS EM PRODUÇÃO (2026-10-18):** os 2 tipos estão visíveis no Sympla; em `data/schedule.js` `waitlist.enabled:false` (lista de espera ENCERRADA: some o "Avise-me", o aviso "abrem em breve" e o cartão; `true` volta). O admin > Lista de espera continua pra exportar quem já se cadastrou (ninguém foi avisado ainda: decidir e-mail em Cco). Em DEV os ingressos aparecem abertos sempre (`?vendas=1` não é mais necessário). **Camiseta do kit:** vitrine com as 3 fotos no card do Ingresso + Kit e galeria (modelo x frente/costas): `data/tshirts.js`, `components/tshirt-gallery.js`, `features/tshirt-gallery.js`, `css/tshirts.css`, imagens em `assets/img/camisetas/` (o texto "[logo oficial pendente]" foi apagado das artes; trocar pelas artes finais quando a PUC mandar o logo). **LOCAL (PUC Campinas - Campus I) segue SÓ EM DEV:** `data/venue.js` com `public:false`; liberar = `public:true`. Faixa "Já garantiu a sua vaga?" no lugar do botão do cartão.
11. **FUNDOS DE TELA EM PRODUÇÃO (2026-10-18/19):** página `fundos.html` (menu, rodapé, sitemap; `public:true` em `data/wallpapers.js`; 6 fundos, os 3 últimos nomeados de forma neutra, renomear se o Renato quiser) + **cena do telão** `type:"wallpapers"` (`components/mural-scenes/mural-wallpapers-scene.js`, entradas `fundos-1` e `fundos-2` em `data/mural-scenes.js`; três celulares e QR com `?origem=telao`, cada passada traz outros três fundos; só entra com `WALLPAPERS_CONFIG.public`). Ensaio: `telao.html?cenas=fundos-1`. E-mail de abertura da lista de espera em `DevFestIA/design/email/` (não enviado).
12. **TELÃO SÓ PRODUÇÃO (2026-10-19, decisão do Renato):** o telão não tem mais modo DEV (`?lineup=` é ignorado) e mostra SEMPRE as cenas do line-up e todas as cotas de patrocínio (`MURAL_CONFIG.alwaysReveal: true` em `data/mural-config.js`), mesmo com `EVENT.lineupRevealed` falso no resto do site. Hoje isso inclui o DADO DE TESTE (palestrantes e palestras inventados, patrocinadores de teste): sai conforme os dados reais entram. Os dados vêm sempre de PRODUÇÃO (`schedule.js`, nunca `schedule.dev.js`); o que não existir não aparece. ATENÇÃO: antes do evento, trocar o mock pelo real ou o telão mostra gente que não existe.
13. **SYNC RÁPIDO DO SYMPLA + GATE DO CARTÃO (2026-10-20):** (a) **vazamento corrigido:** o resumo do job imprimia respostas livres do formulário do Sympla (apareceu um WhatsApp) e o repositório é PÚBLICO, logo os logs também; agora só respostas de camiseta (`isShirtAnswer` em `reconcile.js`, com teste) e as 12 execuções afetadas foram apagadas. REGRA: nunca imprimir dado pessoal em log/resumo de Actions. (b) **Worker** (`DevFestIA/tools/album-proxy/`): cron a cada 5 min + `POST /sync` disparam o workflow `sync-sympla.yml` (`sync-trigger.mjs`, `sync-handler.mjs`, espera mínima de 2 min). **FALTA O RENATO:** criar o token fine-grained do GitHub (só este repo, Actions: Read and write, vence no fim de novembro), `npx wrangler secret put SYNC_GITHUB_TOKEN` e `npx wrangler deploy` (README do album-proxy). (c) **Site:** `features/registration-sync.js` (dual) + `data/registration-sync-config.js`: e-mail não achado mostra "confirmando…", pede o sync e consulta por até 90 s, no cartão "Eu vou!" (`registration-gate.js`) e no sorteio (`raffle-signup.js`, só com `requireTicket`). `EVENT.tickets.registrationGate` agora é `{ enabled: true, public: false }` (`registrationGateOn` em `features/tickets.js`): gate SÓ EM DEV até liberar; PROD: `public: true`. Contador segue em 30 (`counterMin`). Dado: 22 inscritos aprovados (19 Grátis, 1 Kit, 2 Organizador), camiseta chega no formulário.
14. **CARTÃO "EU VOU!" NOVO E GATE EM PRODUÇÃO (2026-10-20):** a arte do cartão agora é uma imagem pronta do design (`assets/img/share-card/eu-vou.webp`, 1080x1350, feita no Codex; `data/share-card-design.js` lista uma arte por idioma, hoje só a em português: falta a versão em inglês, é só pôr em `templates.en`); a pessoa só acrescenta a faixa "NOME vai!" (`drawNamePill` em `features/share-card-art.js`, posição em `namePill`). O gate (`registrationGate: { enabled: true, public: true }`) está LIBERADO em produção: cartão só pra quem tem inscrição no Sympla, com "confirmando…" + sync na hora (Worker `/sync`, cron de 5 min funcionando, token fine-grained cadastrado). Banner da página de ingressos diz que é só pra inscritos pelo Sympla. Rollback do gate: `public: false` em `data/schedule.js`.
15. **SEM CONTADOR E SEM "100 VAGAS" (2026-10-21, decisão do Renato):** o selo dos ingressos agora diz só "Vagas limitadas" (sem número) e o contador "N pessoas já garantiram a vaga" está DESLIGADO (`EVENT.tickets.showCounter: false` em `data/schedule.js`; `true` volta, a partir de `counterMin`). Motivo: o número pode conflitar com o limite de vagas do Sympla (100 por tipo). IDEIA ADIADA: mostrar "restam N"/"esgotado" por tipo (o sync já conta por tipo, falta publicar) e reaproveitar a lista de espera quando esgotar.
16. **GUIA DE TAMANHOS DA CAMISETA EM PRODUÇÃO (2026-10-21):** seção "Qual é o seu tamanho?" na página de ingressos (`data/tshirt-sizes.js`, `components/tshirt-sizes.js`, `features/tshirt-sizes.js`, `css/tshirts.css`): abas Masculina/Feminina/Infantil, tabela em CENTÍMETROS (o PDF do fornecedor vinha com a unidade errada: "0,67 cm" é 0,67 METRO = 67 cm; confere com o formulário do Sympla) e desenho próprio da camiseta com altura e largura. Botão "Guia de tamanhos" no card do kit e na galeria da camiseta (rola até a seção; o `#tamanhos` puro abriria a home na versão /DEV/). NADA do fornecedor aparece no site nem no código (pedido do Renato). PENDENTE: o PDF mostra altura 82 cm igual em XXG e XXXG masculinos (provável erro do fornecedor): confirmar. A regra "só em DEV até liberar" agora é uma só: `features/release-gate.js` (`isReleased`).
17. **TELÃO FÍSICO (informado pelo Renato em 2026-10-22):** proporção **4:3, 1080p** (provavelmente 1440x1080). O palco classifica 4:3 como a forma `standard` (razão >= 1,1 e < 1,5, `MURAL_CONFIG.stage.shapes`). Testar TODAS as cenas assim: `telao.html?tela=1440x1080&cenas=<id>` (e `&demo=2026-11-28T09:10` pras cenas do line-up). Conferido em 2026-10-22: a cena `agora` cabe em 1440x1080. FALTA o ensaio completo cena por cena nessa proporção (e confirmar com o Renato se a saída do Windows é 1440x1080 nativa ou 1920x1080 esticada).
18. **ENSAIO DO TELÃO EM 1440x1080 FEITO (2026-10-22, autorizado pelo Renato):** auditei cada cena em 4:3 (iframe 1440x1080, mede o que passa da área útil). Tudo cabe; ÚNICA correção: `agradecimento-patrocinio` passava do palco com várias cotas (agora 2 colunas em 4:3 e vertical, `css/mural.css`). Cenas sem dado ao vivo no ensaio (não verificadas, dependem de recados aprovados/aviso/pódio/foto nova): `recados-*`, `qr-recados`, `aviso`, `quebra-gelo` (precisa de pausa anunciada), `podio-jam`, `foto-nova`. `daqui-a-pouco` só aparece perto de uma atração. Dica técnica: as cenas de mensagem parecem "cortadas" (scrollHeight maior) por causa do brilho `::before` com inset negativo: é falso alarme.
19. **SYNC MAIS LEVE (2026-10-22):** o agendamento do GitHub (`schedule`) saiu de `sync-sympla.yml` (só `workflow_dispatch`); o Worker dispara de 1 em 1 hora (`crons = ["0 * * * *"]`) e na hora via `POST /sync`. O Renato precisa rodar `npx wrangler deploy` em `DevFestIA/tools/album-proxy` pro cron novo valer. Na semana do evento (a partir de 21/11) subir pra `*/15 * * * *`. Margem segura do telão: 3% (`MURAL_CONFIG.stage.safeMarginPct`). A "demora" da primeira cena do telão nas capturas do navegador do app NÃO é do telão: a página sem foco não gera quadros e a animação não avança (opacidade fica 0 até alguém pedir um quadro); em Chrome normal/quiosque aparece na hora.
20. **TELÃO SEM DADO DE TESTE (2026-10-23, decisão do Renato; REVERTE o item 12):** `MURAL_CONFIG.alwaysReveal` voltou a `false` (há um teste que garante). O telão mostra só PRODUÇÃO: somem `agora`, `rolando-0..3`, `linha-do-dia`, `daqui-a-pouco`, `podio-jam` (usam o line-up de teste) e os patrocinadores sem `public: true` (só GDG Master e FIAP Pleno). Continuam: abertura, contagem, time, dicas (quando ligadas), vídeos, álbuns, fundos de tela, selfie, fênix, mensagens, QRs, recados. COMO VOLTAM: o line-up real em `mock-talks.js`/`mock-speakers.js` (mesmo formato) e `EVENT.lineupRevealed: true`; cada patrocinador novo ganha `public: true` em `data/sponsors.js`. Ensaio com dado de teste: `MURAL_CONFIG.alwaysReveal = true` só localmente.
21. **FALABOSS E FIM DOS PATROCINADORES DE TESTE (2026-10-22/23):** novo patrocinador REAL, cota **Especialista**: **FalaBoss** (`falaboss.com`, slogan "Contrate pelo chat. Simples assim!"), `public: true` em `data/sponsors.js`, logo oficial do brandbook em `assets/brand/falaboss.svg` (preto horizontal, já com o slogan; não recolorir/alterar; o brandbook e os logos vieram do Google Drive pelo conector). TODOS os patrocinadores de teste foram removidos (decisão do Renato): hoje só Master (Google Developer Groups), Especialista (FalaBoss) e Pleno (FIAP); as cotas Sênior, Júnior, Intern, Cota Permuta e Apoio existem VAZIAS e não aparecem em lugar nenhum até entrar marca real. Teste `sponsors.dom.test.js` espera exatamente essas 3. **INCIDENTE:** o commit de liberação foi enviado mas o GitHub NÃO disparou Validar/Publicar nem o Pages (atraso do lado do GitHub): o site ficou na versão antiga e eu avisei "publicado" sem conferir; a correção foi um novo envio + `gh api -X POST repos/gdgcampinas/DevFest-Campinas-2026/pages/builds` (pede o build do Pages à mão). REGRA: depois de publicar, SEMPRE conferir o site NO AR (janela limpa) antes de dizer que está em produção.
30. **MAIS UM VOLUNTÁRIO (2026-10-28):** William Lucio de Souza entrou no time (`data/team.js`, foto `william-lucio-de-souza.webp` a partir de uma imagem de 400x400, sem recorte; LinkedIn sem os parâmetros de rastreio). Sem bio ainda, como o Rafael (item 29): pedir 1 a 3 frases aos dois, mais a versão em inglês. `team.js?v=38`. Time na página: 21 voluntários + 4 organizadores = 25 pessoas.
29. **NOVO VOLUNTÁRIO (2026-10-28):** Rafael Rodrigues Vitor entrou no time (`data/team.js`, foto `assets/img/team/rafael-rodrigues-vitor.webp` gerada pelo `design/build-team-photos.sh` com recorte 1050x1050; LinkedIn sem os parâmetros de rastreio do link compartilhado). Sem bio ainda (o card não é clicável até ter `bio`): pedir 1 a 3 frases ao Rafael, mais a versão em inglês em `data/i18n/en.js`. `team.js?v=37`. Time na página: 20 voluntários + 4 organizadores = 24 pessoas.
28. **VOLUNTÁRIA REMOVIDA DO TIME (2026-10-28, pedido do Renato):** saiu uma voluntária do time (entrada em `data/team.js`, bio em `data/i18n/en.js`, foto em `assets/img/team/` e linha do `design/build-team-photos.sh`); `team.js?v=36` e `en.js?v=74` em todas as páginas. O time na página agora tem 19 voluntários e 4 organizadores (23 pessoas); nenhuma contagem é exibida no site. O motivo NÃO é registrado em lugar nenhum (repo público) e nenhum dado de contato dela foi gravado. O nome e a foto dela continuam no histórico antigo do git (reescrever histórico não foi pedido).
27. **TESTE INSTÁVEL RESOLVIDO (2026-10-28):** a causa era o polling de 40 ms (`pollMs: 40`) em `dom/talk-questions.dom.test.js`: o componente redesenha a tela a cada `pollMs` e apaga o aviso passageiro (erro de voto/envio) e conta leituras extras; em máquina carregada, as 4 passadas do `settle()` passavam de 40 ms e o redesenho caía no meio da conferência. Reproduzido rodando a suíte em paralelo (4 cópias já falhavam). Correção: os 5 testes que olham aviso passageiro ou contagem de leituras usam `config: NO_POLL` (`pollMs` de 1 h); os de polling de verdade seguem com 40 ms. Depois: 10 cópias em paralelo, 10 de 10 passam (572). REGRA: teste que confere aviso ou contagem de leitura num componente com polling usa `NO_POLL` ou `waitFor`, nunca `settle()` contra um `pollMs` curto. Em PRODUÇÃO (`pollMs: 15000`) o mesmo redesenho apaga o aviso 'Não foi possível votar/enviar' quando chega uma pergunta nova ou o próximo ciclo: aviso some sozinho; correção de componente fica como pendência separada.
26. **PARCEIROS / NOVATEC (2026-10-23, só em DEV):** nova cota `parceiros` ("Parceiros") DEPOIS do Apoio em `data/sponsors.js`, estilo em `data/sponsor-tiers.js` (com descrição) e `css/styles.css` (laranja). Primeiro parceiro: Novatec Editora (`https://novatec.com.br/`, logo vetorial oficial positivo em `assets/brand/novatec.svg`, recortado do PDF do Renato; a versão negativa dos PDFs não foi usada, serve para fundo escuro), SEM `public` (só DEV). A PUC segue em DEV (o Renato mandou segurar). Para liberar: `public: true` no elemento. TELÃO: cena `parceiros` (10 s, depois da `patrocinio-apoio`) em `data/mural-scenes.js`, mesmo componente de patrocinadores; em PRODUÇÃO a cena é pulada até algum parceiro ter `public: true` (conferir com `telao.html?tela=1440x1080&cenas=parceiros&lineup=1`). A cena de agradecimento (almoço e encerramento) já mostra todas as cotas.
    **TIMBIRA (2026-10-26, só em DEV):** segundo parceiro (`https://www.timbira.com.br`, "Inteligência em PostgreSQL em prol da sustentabilidade do seu negócio."), logo horizontal enviado pelo Renato (`assets/brand/timbira.webp`, fundo cinza tornado transparente), LIBERADA EM PRODUÇÃO (2026-10-26, `public: true`; a cena `parceiros` do telão já cobre a cota). O menu na nova ordem também está só em DEV (`SITE_NAV_ORDER.public:false` em `components/site-nav.js`).
    **MENU NA NOVA ORDEM LIBERADO EM PRODUÇÃO (2026-10-30, "libera menu", pedido do Renato):** `SITE_NAV_ORDER.public: true` em `components/site-nav.js`. Ordem: Principal, Grade, Palestrantes, Ingressos, Como chegar, (Sorteio só em DEV), Recados no telão, Fundos de tela, Time, Patrocínio, Código de Conduta. O Sorteio segue `devOnly` e só aparece no menu do modo DEV. Reverter: `public: false`. A PUC-Campinas (Apoio) CONTINUA só em DEV até o "libera a PUC".
    **FOTOS DO CAMPUS + CENA "ONDE ESTAMOS" (2026-10-30, LIBERADAS EM PRODUÇÃO no mesmo dia, "libera as fotos", pedido do Renato; reverter = `public:false` em `data/venue-photos.js` + subir o `?v=`):** 10 fotos (a PUC liberou todas) em `assets/img/campus/*.webp` (1280 px, ~160 KB cada). Dado em `data/venue-photos.js` (`VENUE_PHOTOS_CONFIG.public:false`, `VENUE_PHOTOS` com id, arquivo e legenda, `VENUE_PHOTOS_TEXTS`). Só a foto `featured` (`h02`, "Prédio H-02, onde o DevFest Campinas acontece", a passarela entre os blocos; confirmado pelo Renato) diz que é o prédio do evento; as outras têm legenda genérica (H-13 e H-15 têm a placa na foto) e há teste que impede outra legenda de citar H-02. **Galeria** na página Como chegar (`local.html`, abaixo do mapa): `components/venue-photo-gallery.js` (marcação), `features/venue-photo-gallery.js` (liberação por DEV, foto ampliada no modal com setas redondas sobre a foto, teclado e deslizar o dedo; a grade usa miniaturas leves em `assets/img/campus/thumbs/` (só a do H-02 abre grande) e some a legenda das miniaturas no celular), `css/venue-photo-gallery.css`, botão "Conheça o Campus I no site da PUC-Campinas" com o endereço do link `about` de `data/venue.js` (sem URL repetida). Legendas em `data/i18n/en.js` e a galeria na lista `LOCALIZED_DATASETS` do `app.js` (o `check-i18n` ignora `alt`, então a legenda faz o papel de texto alternativo). **Telão:** nova cena `venue` ("Onde estamos", `id: "onde-estamos"`, 10 s, antes e durante o evento): `components/mural-scenes/mural-venue-scene.js`, foto do H-02 em tela cheia com prédio, campus, entrada e endereço em faixa embaixo (lidos de `data/venue.js`; o telão não usa `initShell`, então `telao.html` carrega `venue.js` e `venue-photos.js` por conta própria). `enabled: VENUE_PHOTOS_CONFIG.public`: **uma chave só libera galeria e cena**. Ensaio em DEV: a cena fica fora do rodízio enquanto `public:false`; para ver, ligue `MURAL_SCENES.find(s=>s.id==="onde-estamos").enabled=true` no console do telão. **Para liberar em PROD:** `public: true` em `data/venue-photos.js` + subir o `?v=` do arquivo nas 4 páginas que o carregam (`local.html`, `telao.html`, `mural-controle.html`, `admin.html`) e conferir em janela limpa. Liberado: `public:true`, `venue-photos.js?v=4`.
    **COMUNIDADES PARCEIRAS + DATAROCK (2026-10-30, EM DEV E PROD, pedido do Renato):** nova cota `comunidades` ("Comunidades parceiras", depois de Parceiros) em `data/sponsors.js`, estilo em `data/sponsor-tiers.js` e `css/styles.css` (verde-água), EN em `data/i18n/en.js`, cena `comunidades` do telão (10 s, depois da `parceiros`) em `data/mural-scenes.js`. Dentro: **NewHack Campinas** (`https://luma.com/NewHack`, logo enviado pelo Renato com o fundo preto original, recortado rente) e **GDG Americana** (saiu de Parceiros). **Datarock** (`https://datarocktecnologia.com`, realiza a NewHack) entrou em Parceiros, logo oficial escuro do site da empresa (`assets/brand/datarock.svg`). Os textos dos cards (NewHack, Datarock) foram escritos por mim a partir do site da Datarock: confirmar com o Renato. Link da NewHack = página dela no Luma (não achei site próprio).
    **GDG AMERICANA (2026-10-29, EM DEV E PROD, pedido do Renato):** comunidade parceira na cota Parceiros (`https://gdgamericana.com.br`), `public: true`, EN em `data/i18n/en.js`. Logo horizontal enviado pelo Renato com o texto "Google Developer Group" em BRANCO (feito pra fundo escuro): o branco virou cinza escuro #202124 (só o texto; símbolo e "Americana" intactos) e foi recortado rente (`assets/brand/gdg-americana.webp`, 18K) pra aparecer na caixa branca. A versão vertical enviada não foi usada.
    **VARREDURA MOBILE DE BOTÕES (2026-10-29, EM PROD):** medido a 375px nas 12 páginas (iframes + `getBoundingClientRect`). Achados: nav 28px, chips/CTAs 31 a 38px, links do rodapé 23px, selo LinkedIn 26px, e a faixa de links do rodapé ESTOURAVA 5px à direita (rolagem lateral em todas as páginas). Correção única: bloco `@media (pointer:coarse), (max-width:640px)` no fim de `css/styles.css` (min-height 44px por tipo de componente, rodapé com `flex-wrap`, `.social-icon` 44px); `styles.css?v=114`. Ficam de fora de propósito: links dentro de texto corrido (código de conduta, créditos), pinos do mapa (a lista abaixo escolhe o mesmo ponto) e o "pular para o conteúdo". Guarda: `dom/touch-targets.dom.test.js` (confere a regra no CSS e a versão única do styles.css). Para remedir: iframes de 375px nas páginas e listar `a,button,input,summary` com altura ou largura < 44.
    **HACKER RANGERS (2026-10-29, EM DEV E PROD, pedido do Renato):** terceiro parceiro (`https://hackerrangers.com/pt/`, "Cultura de segurança com treinamentos gamificados.", EN em `data/i18n/en.js`), logo empilhado HACK3R_/RANGER5 enviado pelo Renato (`assets/brand/hacker-rangers.webp`, fundo cinza #f7f7f7 tornado transparente por script Swift, 800px), `public: true`; a cena `parceiros` do telão já cobre a cota. Conferido no ar em janela limpa.
    **LIBERADA EM PRODUÇÃO (2026-10-23, pedido do Renato):** Novatec com `public: true`; a cena `parceiros` do telão passa a rodar em produção. A PUC-Campinas (Apoio) CONTINUA só em DEV (o Renato mandou segurar).
25. **INCIDENTE E MAPA PELA LISTA (2026-10-23, em PROD):** (a) REGRESSÃO MINHA: ao medir os cliques do mapa o `app.js` passou a usar `trackAttrs` (`components/track-attrs.js`, que usa `escapeHtml`) e `codigo-de-conduta.html` e `quiz.html` não carregavam esses dois arquivos: as duas páginas ficaram em branco em PROD por ~20 min (18:53 a 19:13). Corrigido; teste `page-scripts.dom.test.js` agora exige que TODA página com `js/app.js` carregue `escape-html.js` e `track-attrs.js` antes dele. REGRA: dependência nova do `app.js` = conferir todas as páginas. (b) No mapa, escolher um ponto na LISTA aproxima o mapa nele e leva a tela até o mapa (`reveal` injetável, `scroll-margin-top`); o pino só troca o ponto; `venueMapShift` limita o enquadramento à borda da imagem.
24. **ANALYTICS COMPLETO (2026-10-23, em PROD):** GoatCounter (conta `gdgcampinas`, painel `https://gdgcampinas.goatcounter.com`, sem cookies) mede visita de página em todas as páginas públicas (incl. `local.html`) e cliques por `data-track-event`. NOVO: (a) o MODO DEV não liga mais o provedor (`initAnalytics(..., { enabled: !isDevModeStored() })`): conferência em `/DEV/` não entra nos números; `?analytics=debug` ainda mostra os eventos no console; (b) `components/track-attrs.js` (`trackAttrs(nome, {place,target,kind})`) é o ÚNICO lugar que monta os atributos de medição (tickets e telas novas usam); (c) eventos novos: `map_point` (pino ou cartão, target = ponto), `map_zoom`, `map_official`, `venue_directions` (place header/venue), `venue_link`, `tshirt_open`, `tshirt_model`, `tshirt_side`, `tshirt_sizes_model`, `tshirt_sizes_open`; teste `analytics.dom.test.js`. Para criar evento novo: só `${trackAttrs("nome", { place, target })}` no elemento clicável. O PUC (Apoio) tem destaque Master (`featured:true`, só dela).
23. **PUC-CAMPINAS COMO APOIO (2026-10-23, só em DEV):** cota Apoio em `data/sponsors.js` com a PUC-Campinas (logo institucional baixado de `puc-campinas.edu.br`, recortado: `assets/brand/puc-campinas.webp`, link `https://www.puc-campinas.edu.br/`), SEM `public` (aparece só em DEV/Patrocínio e Principal com revelação). Para liberar: `public: true` no elemento. O arquivo do logo é pequeno (263 px de largura de origem); se o Renato conseguir o logo em vetor/alta resolução com a PUC, trocar. O logo comemorativo "85 anos" do site deles NÃO foi usado.
22. **PÁGINA "COMO CHEGAR" E MAPA DO CAMPUS (2026-10-23, só em DEV):** nova página `local.html` (aba "Como chegar" no menu, `devOnly` em `components/site-nav.js`; versão `/DEV/local.html`) com o endereço, os botões do local e o mapa OFICIAL do Campus I (`assets/img/campus/mapa-campus-i.webp`, da PUC-Campinas) com 9 pinos grandes clicáveis (H-02, ônibus, posto de informações, food trucks em frente ao H-Zero, praça de alimentação, estacionamento C perto do H-02 e Portões 1, 2 e 3), rótulo flutuante, zoom no H-02 e lista agrupada (Chegada, No local, Comer). Na PRINCIPAL há um cartão-destaque "Como chegar ao H-02" (`#campusCallout`, perto do topo). Módulos: `data/venue-map.js` (pontos em % da imagem, grupos, tipos/cores, textos, `VENUE_MAP_CONFIG.public:false`), `components/venue-campus-map.js`, `features/venue-campus-map.js` (`initVenueCampusMap`, `initVenueMapCallout`; usa `release-gate`), `css/venue-campus-map.css`, `pages/local.js`, teste `venue-campus-map.dom.test.js` (trava: mapa público = menu sem `devOnly`), inglês em `en.js`. Também saíram as cotas vazias (Júnior, Intern, Cota Permuta, Apoio) e as comunidades parceiras de teste (`data/partner-communities.js` agora `[]`). ARMADILHA: mudar um .js sem subir o `?v=` em TODAS as páginas deixa o navegador com a versão velha. PARA LIBERAR ("libera o local"): OK escrito da PUC para a arte do mapa, depois `public:true` em `data/venue-map.js` e tirar o `devOnly` do menu. Sem OK da PUC: trocar por desenho nosso mantendo os pontos. Confirmar com a PUC os food trucks e o estacionamento C. Mapa na cena do telão: não feito.
    **Prédio e entrada (2026-10-23):** `data/venue.js` ganhou `building` ("Prédio H-02") e `entrance` ("Entrada pelo portão 2"), nome "PUC-Campinas, Campus I". `applyVenue` leva os dois ao `EVENT`; `venueAccessLine(event)` (`features/event-venue.js`) monta "Prédio H-02 · Entrada pelo portão 2" para o bloco do endereço e o cartão da principal; o cabeçalho mostra o prédio e o calendário (.ics e Google Agenda) leva o prédio no local. No mapa só o Portão 2 é a entrada (verde, etiqueta "Entrada"); portões 1 e 3 ficam discretos (`minor`). A confirmar com o Renato: se o estacionamento C serve a quem entra pelo portão 2 (no mapa oficial o portão 2 fica a leste e o C a oeste).
    **LIBERADO EM PRODUÇÃO (2026-10-23, pedido do Renato):** `public:true` em `data/venue.js` e `data/venue-map.js`, aba "Como chegar" sem `devOnly`. Pendente: OK da PUC para a arte do mapa (sem OK, trocar por desenho nosso mantendo os pontos), Renato atualiza o endereço no Sympla, post do Instagram fica para depois.
**Pendente com o Renato (2026-10-23):** (1) **e-mail de abertura para a lista de espera** (pronto em `DevFestIA/design/email/ingressos-abertos.html/.txt`; enviar em Cco pelo Gmail, teste primeiro; antes remover as entradas de teste no admin); (2) **"libera o local"** (PUC Campinas - Campus I): `public: true` em `data/venue.js`, depois de atualizar o endereço no painel do Sympla (a API não edita evento); (3) **line-up real e patrocinadores**: trocar `mock-talks.js`/`mock-speakers.js` pelo real (mesmo formato, foto e LinkedIn, autorização de cada pessoa) e ligar `EVENT.lineupRevealed: true`; cada marca nova com `public: true`; (4) dicas do telão (Wi-Fi, estacionamento, comida) quando houver informação; (5) ensaio no computador Windows do telão (`DevFestIA/tools/telao/iniciar-telao.bat`, 30 min, internet caindo, reinício; resolução nativa 1440x1080; escala 100%); (6) cadastrar `renatoramosf7@gmail.com` em Admin > Moderadores; (7) avisar a pessoa cujo WhatsApp saiu nos logs do sync (logs apagados); (8) segurança: apagar o token clássico do GitHub do print, renovar o token do Worker (vence no fim de novembro) e trocar o token do Sympla (apareceu no chat) depois do evento; (9) esperando material: logo oficial da PUC (arte da camiseta), arte do cartão em inglês (`templates.en` em `data/share-card-design.js`), poses novas da fênix, fundos em 1080x2340, confirmação do fornecedor da altura do XXG/XXXG masculino; (10) testar admin e recados no celular; legendas dos vídeos; renomear `mural-controle` e `mural-fotos`?; modelo do painel de LED; capacidade do local e camisetas por tamanho; Fase C, sorteio no telão. **Semana do evento (a partir de 21/11):** subir o cron do Worker de `0 * * * *` para `*/15 * * * *` e `npx wrangler deploy`. **Depois do evento:** certificado (plano em IDEAS_BACKLOG), relatório pós-evento (`event-report.yml`).
**IDEIAS (Sympla/telão/divulgação):** credenciamento por QR no celular dos voluntários (check-in pela API via Worker), "X pessoas já chegaram" no telão, entrega de camisetas por tamanho, painel privado de inscritos por dia/tipo, "restam N/esgotado" por tipo + lista de espera, alertas no celular a cada marco, aviso da lista de espera quando há cancelamento, certificado automático, links por canal (`?origem=`), kit do palestrante, cartazes com QR, mapa mais bonito (precisa de chave do Google Maps), link dos fundos no cartão "Já vou!".
**Armadilhas novas:** o servidor do ai-memory precisa de `launchctl kickstart -k gui/$(id -u)/com.github.akitaonrails.ai-memory` depois de atualizar o binário; scripts locais (`ci.sh`, `ship.sh`, `versions.py`, `bumpcheck.py`) vivem na pasta temporária da sessão e podem sumir (recriar a partir de `.github/workflows/validate.yml`); Node 24 obrigatório para `node --check`; `--test-force-exit` ao rodar um teste de tela sozinho. **Armadilhas desta fase (2026-10-18 a 23):** (a) `ship.sh` faz `git add -A docs DevFestIA`: mudança em `.github/` precisa de commit à parte; (b) o navegador do app, sem foco, NÃO gera quadros: animações CSS ficam em opacidade 0 até alguém pedir um quadro (screenshot): não é bug do telão; em lote (`browser_batch`) os prints saem escuros; (c) as cenas de mensagem do telão parecem \"cortadas\" (`scrollHeight` maior) por causa do brilho `::before` com inset negativo: falso alarme; (d) na versão `/DEV/` o `<base href=\"../\">` faz links `#ancora` abrirem a home: rolar por JS; (e) o conteúdo que o conector do Google Drive devolve (base64) é recuperável do transcript da sessão em `~/.claude/projects/.../<id>.jsonl` (foi assim que o logo da FalaBoss entrou); (f) `check-i18n.js`: chaves `size`, `showcase`, `pageHref`, `filename` em `SKIP_KEYS`, `DevFest`/`Campinas`/`cm` em `KEEP_AS_IS`; `alt`, `link`, `size` como nome de campo de TEXTO são ignorados (renomear o campo); (g) o repositório é PÚBLICO: nada de dado pessoal em log/resumo de Actions (já vazou um WhatsApp uma vez).

## SESSÃO 15 (2026-10-14 a 2026-10-16): GRADE DE HORÁRIOS NOVA (SÓ HORÁRIO; PESSOAS SEGUEM MOCK)
**Pedido do Renato:** focar nos horários; pessoas e palestras ficam no mock; Coding Jam entra; Standup NÃO existe. **Grade final (decisão do Renato em 2026-10-16), revisada pelo Renato antes de subir:** Credenciamento 08:00-08:20, Abertura 08:20-08:50, 4 slots a partir de 09:00 (09:00, 09:45, 10:30, 11:15), Almoço 12:00-13:20, Retorno 13:20-13:30, 5 slots a partir de 13:30 (13:30, 14:15, 15:00, 15:45, 16:30), Encerramento 17:15-18:00. Só o `DAY_PLAN` de `schedule.js` e `schedule.dev.js` (idênticos) mudou no código (credenciamento e abertura; o resto já era assim no git); a cena `qr-avaliar` segue às 17:15; Coding Jam (mock, 3º slot da IA) fica 10:30-11:10. Nenhum teste precisou mudar (457 de tela e 235 puros verdes). `?v=` de `schedule.js` subiu pra 26 nas páginas. **Planilhas no Drive (pasta do Renato; a original "Trilhas palestrantes" NÃO foi editada, minhas ferramentas só criam arquivo):** versões pintadas da grade do site, só pra revisão (ver a mais nova pelo nome "Grade DevFest 2026 (grade final...)"); as anteriores podem ir pra lixeira se o Renato autorizar. **Subido em 2026-10-16** (commits em `development`; CI e `main` conferidos na sessão). **Atenção:** `WALL_CONFIG.window.until` (recados) segue 17:30; banner final do site é "Encerramento" (a planilha original diz "Encerramento e sorteios"); line-up real (36 nomes da planilha) NÃO entrou no site; `sponsors.dom.test.js` pode falhar uma vez sob carga (passa isolado).

## SESSÃO 14, FIM (2026-10-09): ESTADO PARA O PRÓXIMO CHAT
**Git:** `development` = `main` (CI verde, Pages publicado; conferir `git log` e `gh run list`). Árvore limpa (só `.claude/` sem rastreio).
**O que a sessão entregou (detalhes em PROJECT_CONTEXT: "Área de admin", "Telão acolhedor", "Marca nas telas"):** (1) `admin.html` (login único, Visão geral com 6 cartões, Telão, Fotos, Palestras, Recados, Moderadores, Antes do evento, Atalhos; menu lateral no computador, ícones; esconde do menu o que só o dono usa); (2) CRUD de moderadores (coleção `moderators`, regras do Firestore JÁ colar e publicadas pelo Renato); (3) "Antes do evento": limpeza do banco = link pro workflow, "Limpar este aparelho" em dois toques; (4) telão acolhedor: time (organizadores e voluntários MISTURADOS), quebra-gelo/boas-vindas/saudação, QR da comunidade (Linktree), linha do dia, "Daqui a pouco", anúncios ao vivo (frase, contagem, pausa); (5) Mural de recados: `recado.html` (agora PÁGINA DO SITE, menu "Recados no telão", PT e EN, `DEV/recado.html`), janela 08:00 às 17:30 (`WALL_CONFIG.window`; em modo DEV a janela não vale), moderação em admin > Recados, cenas de notinhas e QR no telão (sem endereço escrito), cartão na home e convite depois de avaliar; regras do Firestore dos recados e dos tipos de aviso JÁ publicadas; (6) marca: Gumbleton e logo do GDG em estados vazios, barra do admin, recados, cenas de fase (`data/brand.js`); (7) LEGENDAS nos vídeos do telão: o vídeo toca mudo e a fala aparece em texto por cima (`data/mural-captions.js`, transcrição do Whisper revisada, `tools/video/captions-review.md`); (8) estudo da Fase C (`project-docs/ESTUDO_NUMEROS_AO_VIVO.md`); (9) CI: `page-assets.dom.test.js` confere que todo arquivo das páginas existe e tem o mesmo `?v=` em todas.
**RESOLVIDO (2026-10-09, depois do protocolo):** release `mural-video-2025` publicada (9 clipes), Worker com `/media` respondendo 200, vídeo entra no telão de produção e as legendas aparecem; a "trava" era o castigo de 60 s do SKIP enquanto os clipes baixavam: agora `MURAL_WAIT` (5 s). Falta o Renato ver tocando no Chrome dele. Texto antigo do problema, só histórico: **o vídeo no telão trava na reserva ao testar localmente.** Teste do Renato: `http://localhost:8080/mural.html?lineup=1&ensaio=0&cenas=video-2025&videos=http://127.0.0.1:8099/&diag=1` (precisa do servidor `python3 DevFestIA/tools/video/serve-clips.py`, que pode ESTAR RODANDO na porta 8099: parar com `lsof -ti tcp:8099 -sTCP:LISTEN | xargs kill`). Do endereço `https://gdgcampinas.github.io/...` NÃO funciona (o Chrome bloqueia https → 127.0.0.1). No MEU navegador (aba oculta) o erro era `play() request was interrupted because video-only background media was paused to save power`; corrigi (a cena tenta de novo a cada 0,5 s, até 20 vezes, `playRetries`) mas NÃO confirmei no Chrome do Renato: pedir a linha **"Último erro"** do painel `diag` (ou o console) e ver o motivo real. O caminho mais simples de testar de verdade é o Renato dizer **"pode publicar"** (a IA cria a release `mural-video-2025` com os 9 arquivos de `~/Downloads/devfest-mural-clips-2025/`, a versão de 2048 px, não a leve do preview) e testar `.../mural.html?lineup=1&ensaio=0&cenas=video-2025`.
**Legendas: o que falta:** o Renato revisar o texto (tabela de dúvidas em `captions-review.md`: "Fatec", "Gemini", frases de conversas e salas), ver o resultado tocando e dizer "pode publicar". Whisper instalado (`brew whisper-cpp`) e modelo `~/.cache/whisper-cpp-models/ggml-small.bin` (487 MB, fora do repo).
**DEPENDE DO RENATO (ordem):** (1) testar no celular: admin (login Google), fluxo dos recados em `DEV/recado.html` (enviar, aprovar em admin > Recados, ver no mural com 3 aprovados da mesma pergunta), anúncios ao vivo; (2) vídeo: aprovar os cortes + revisar legendas + "pode publicar"; (3) confirmar o link do álbum `ao-vivo` (convite), e o aviso que some ao recarregar (`&diag=1`, "Último erro"); (4) decidir: Fase C (contador de presença? cidades? chave de serviço no Worker?), ponte do sorteio com o telão (`raffle-live`; mesma tela? mostrar nome do ganhador?), trava da janela de recados também no BANCO (interruptor `wallWindowEnforced()` nas regras), lista dos recados aprovados no site; (5) dados: cor da camiseta (`MURAL_MESSAGE_VARS.shirt`), horários do café/sorteio/foto (nada trava: o moderador anuncia ao vivo), logos em alta e cotas, hashtag do selfie, 6 e-mails dos moderadores (agora cadastra em admin > Moderadores), Coding Jam, sorteio, time (6 bios), Sympla; (6) ensaio de 1 h no hardware; (7) checklist antes do evento: ligar trava de horário das perguntas, interruptores do sorteio, limpeza do banco (workflow) e `reset-teste` nos aparelhos.
**LACUNA CONHECIDA:** a coleção `mural-wall` (recados) NÃO está em `PURGEABLE_COLLECTIONS` do workflow "Limpar dados de teste": recados de teste ficam no banco (incluir quando o Renato autorizar).
**IDEIAS DO PARCEIRO (não iniciadas):** auditoria de leituras do Firebase do dia do evento (plano grátis 50 mil/dia, muitas escutas); emblema/bipe de pendências no admin; kit de impressão de QRs; teste ponta a ponta no emulador; checklist ao vivo no "Antes do evento"; nuvem de palavras e mosaico final no telão.
**ARMADILHAS NOVAS desta sessão:** (a) arquivo mudou SEM subir o `?v=` = cache velho no navegador de quem já visitou (checar todo push; `page-assets.dom.test.js` pega página com versões diferentes); (b) global usada antes de ser carregada no HTML (`WALL_CONFIG` em `mural-scenes.js`) quebra a página inteira: a ordem dos scripts importa, teste de página carrega os scripts do HTML; (c) `pbcopy` das regras: o repositório precisa estar IGUAL ao console, sempre que mudar as regras copiar o arquivo do repo; (d) o classificador do Claude Code bloqueou UMA vez editar `firestore.rules` via Python ("concessão de permissão"): a IA gera o arquivo, testa no emulador e o Renato cola; depois um `cp` funcionou; (e) Node 24.7 local às vezes derruba um arquivo de teste de tela na saída ("falha" sem teste falhando, ou `check-install` com segfault): rodar de novo; (f) zsh não divide variável em palavras: scripts com `ffmpeg "${args[@]}"` rodam em `bash`; (g) o navegador interno do app pausa vídeo e congela animação quando a aba fica oculta: não dá pra ver vídeo tocando nele (usar capturas de quadro + o Chrome do Renato); (h) `ffmpeg` do brew não tem `subtitles` nem `drawtext`: legenda é do telão, não gravada no arquivo.

## SESSÃO 14 (continuação, 2026-10-09): TELÃO ACOLHEDOR, FASES A E B FEITAS + ESTUDO DA C ENTREGUE
Pedido do Renato: telão acolhedor, feliz, que desperte pertencimento; foco na entrada E no evento; cores do Google + Gumbleton; nada obrigatório. Autorizado: Fase A completa, Fase B (mural de recados) e Fase C só como ESTUDO. Passaporte descartado (backlog). Detalhes técnicos: `PROJECT_CONTEXT.md`, "Telão acolhedor". **Fase A feita (6 commits):** cena do time, cena de mensagem (quebra-gelo, "Primeira vez aqui?", saudação), QR da comunidade (Linktree), linha do dia, "Daqui a pouco" e anúncios ao vivo (frase, contagem, pausa).
**Fase B feita (mural de recados, 6 commits):** regras + testes, texto e filtro, página `recado.html`, moderação em admin > Recados (+ cartão na Visão geral), fonte ao vivo `wall` e cenas de notinhas + QR. **Fase C:** relatório em `project-docs/ESTUDO_NUMEROS_AO_VIVO.md` (decisão do Renato: contador de presença? cidades?).
**PENDENTE DO RENATO:** (0) NO CELULAR: abrir `https://gdgcampinas.github.io/DevFest-Campinas-2026/recado.html`, mandar um recado, aprová-lo em admin > Recados e ver no mural (`.../mural.html?lineup=1&ensaio=0&demo=2026-11-28T09:10&cenas=recados-buscar,qr-recados` mostra a cena só com 3 recados aprovados da pergunta); (1) COLAR as regras do Firestore de novo (agora com os tipos de aviso E o mural de recados) (`pbcopy < /Users/renatoramos/Documents/Projects/GDGCampinas/FrontEnd/DevFest-Campinas-2026/DevFestIA/firebase/firestore.rules`): sem isso os tipos frase/contagem/pausa são recusados (aparece "sem permissão"); (2) a cor da camiseta dos voluntários (preencher `MURAL_MESSAGE_VARS.shirt`); (3) horários do café (entra na grade como `moment: "coffee"`) e do sorteio (`mural-teasers.js`, `source.at`), mas nada trava: o moderador anuncia ao vivo; (4) ensaio no hardware com as cenas novas.
**Recados no site (feito depois):** menu "Recados no telão", janela 08:00 às 17:30, cartão na home e convite depois da avaliação (ver PROJECT_CONTEXT). Frase do telão corrigida: "Quem faz o DevFest Campinas acontecer". **Pendente (decisão do Renato):** travar a janela TAMBÉM nas regras do Firestore (hoje só página/QR/convites); lista dos aprovados no site; cena e ponte do sorteio com o telão (`raffle-live`, análise feita no chat, esperando decidir se sorteio e mural usam a mesma tela).
**Armadilha NOVA (grave):** arquivo JS/CSS alterado SEM subir o `?v=N` nas páginas que o carregam fica em cache velho no navegador de quem já visitou (achei `app.js` e mais 35 arquivos assim). Antes de cada push rodo um conferidor (no meu scratchpad: `bumpcheck.py` compara os `?v=` com o commit anterior e `versions.py` exige o MESMO `?v=` em todas as páginas); a parte "mesmo `?v=` em todas as páginas e todo arquivo existe" JÁ é teste do repositório (`DevFestIA/tools/dom/page-assets.dom.test.js`, roda no CI); a parte "arquivo mudou sem subir o `?v=`" precisa do git e fica só no meu conferidor local (pedir ao Renato se quer um passo no `validate.yml`).
**Armadilha:** o Node 24.7 local às vezes derruba um processo de teste de tela na saída (um arquivo "falha" sem teste falhando, ou `check-install` com "Segmentation fault"): rodar de novo; o CI usa outra versão e não tem isso.

## SESSÃO 14 (2026-10-08): ÁREA DE ADMIN FEITA (autorizada pelo Renato: "autorizado todos")

**Intenção do Renato:** uma área de CONTROLE (telão, palestras, moderação num lugar só), NÃO configuração nem alimentação do site. Plano base: `PLANO_ADMIN.md`. Detalhes técnicos: `PROJECT_CONTEXT.md`, "Área de admin".
**Feito (6 commits, um por melhoria, nenhuma regra nova do Firestore):** (1) `pickModerationTalk` movido pra `features/moderation-talk.js` (reuso); (2) menu `data/admin-sections.js` + `components/admin-nav.js` + `features/admin-nav.js` por cima de `moderacao`, `mural-controle` e `mural-fotos`; (3) casco `admin.html` (login único `admin-session.js`, rotas `hash-router.js`, `admin-shell.js`), seção Atalhos, `equipe.html` virou redirecionamento e `team-tools.*` saiu; (4) Telão e Fotos embutidos (opção `embedded` + `{ stop }`, parâmetros padrão compartilhados com as telas próprias); (5) Visão geral com 5 cartões independentes (telão, salas, perguntas pendentes, fotos, inscritos); (6) seção Palestras (uma caixa por trilha, botões em aba nova). Docs atualizadas neste commit.
**Ajustes sobre o plano (avisados ao Renato antes):** `reset-teste.html` ficou FORA do menu (CSS próprio, ferramenta de aparelho de teste; vira só link em Atalhos); cada seção sobe só quando aberta e desliga ao sair; os cartões e a seção Palestras reusam as mesmas regras do site (`resolveEventState`-like em `describeTrackTalks`, `summarizeControl`, `pollOpen` com `keepAlive`).
**Testes:** 376 de tela + 164 puros, tudo verde local; no navegador do app (sem login real) conferidos a porta de entrada, o menu, as seções Palestras e Visão geral (com a sessão simulada, banco real: telão e "fora do ar" recusam sem conta de moderador, inscritos e álbum leem).
**O que depende do RENATO:** abrir `https://gdgcampinas.github.io/DevFest-Campinas-2026/admin.html` no CELULAR, entrar com `gdgcampinascontato@gmail.com` e conferir: a Visão geral (números fazem sentido), Telão (publicar um aviso com o mural aberto, pausar, recarregar), Fotos (tirar uma foto do ar) e Palestras (os botões abrem cada tela em aba nova). A IA NÃO consegue testar o login Google. Dizer se a divisão das seções está boa.
**Opcionais que exigem regra nova (deixados de fora, só se o Renato pedir):** cartão de check-ins (`allow list: if isModerator()` em `checkins`) e batimento do telão (`mural-status/current`).
**Armadilhas novas:** (a) embutir um módulo de moderação no admin = nunca reusar a mesma `rootEl` (o casco cria um contêiner novo por visita; os `click` do módulo ficam presos nele); (b) `check-install.js` pode dar "Segmentation fault" ao sair do node mesmo passando (imprime "instalação ok"): rodar de novo / conferir a saída; (c) no teste da página inteira (`admin-shell.dom.test.js`) o `app.js` NÃO carrega: `resolveNow` e afins entram por `globals`; (d) cada leitura da Visão geral conta no plano grátis: deixar a seção aberta o dia todo em vários aparelhos pesa (hoje ~4 contagens por minuto por aparelho).
**Depois (mesma sessão, pedido do Renato):** (a) link "Área da equipe" no rodapé das páginas públicas; (b) seção **Antes do evento** (limpeza do banco = link pro workflow do GitHub com passo a passo; "Limpar este aparelho" em dois toques); (c) seção **Moderadores** (CRUD, cliente pronto e testado); `two-tap-confirm.js` compartilhado. **Regras dos moderadores: FEITAS.** `firestore.rules` do repositório = o que o Renato COLOU e publicou no console (`isOwner()` com o e-mail fixo, `isListedModerator()` por `exists` em `moderators/<e-mail em minúsculas>`, `match /moderators/{email}` só do dono, formato fechado), testado no emulador (`tools/questions/moderators-rules.test.js`, no `run-rules-tests.sh`). Falta o Renato testar no admin: cadastrar um e-mail, entrar com ele, remover e ver o acesso cair.
**Pendências antigas (ver a SESSÃO 13 logo abaixo):** release do vídeo, link do álbum ao vivo, aviso que some ao recarregar, logos, cotas, coffee, hashtag, ensaio, 6 e-mails dos moderadores, Coding Jam, sorteio, time, Sympla.

## SESSÃO 13 (2026-10-08, depois do fim da 12): MURAL V2 (fotos, QR, momentos, controle remoto, vídeo, painel da equipe)

**Feito (um commit por melhoria, detalhes técnicos no `PROJECT_CONTEXT.md`, seção "Mural do telão de LED"):**
1. **Álbum Bosch trocado** pelo de 26/08/2026 (`gdg-talks-bosch-2026`, 72 fotos; segredo `ALBUMS` já atualizado pelo Renato e conferido no Worker).
2. **Regra: o telão NUNCA mostra foto única** (só a arte do selfie): modelo `mosaic` (12 fotos), `foto-nova` = a nova GRANDE + 3 recentes (`feature`), `min` por modelo (a cena some até o álbum encher), removidos `single`, a cena `photos` e o Ken Burns.
3. **QR do álbum ao vivo** ("Mande sua foto", cena `qr-album`): leva a `<Worker>/join/ao-vivo` (302 pro convite, só álbum `live`; o link nunca está no repo). `qr-cartao` saiu do rodízio. Resolvedor `features/qr-targets.js`.
4. **Momentos da grade** (`moment` em `schedule.js`: `lunch` 12:00 às 13:20, `closing` 17:15 às 18:00...; `requires.moments`) e cena `agradecimento-patrocinio` (almoço e encerramento, mock até os logos reais).
5. **Controle remoto do mural** (`mural-controle.html`, celular do moderador): avisos ao vivo com validade, pausar/fixar cena, recarregar, EMERGÊNCIA em dois toques; documento `mural-control/current`, motor `hold/release`, vigia não recarrega com o rodízio parado, regras do Firestore + 4 testes.
6. **Vídeo** (sem som, decisão do Renato): 9 clipes do vídeo de 2025 (`tools/video/`), cena `video` com cache no navegador, rota `/media` no Worker, playlists por dado; o motor aceita `render` devolvendo `seconds`.
7. **Painel da equipe** `equipe.html`: atalhos de todas as telas internas (`data/team-tools.js`). (Na sessão 14 virou a área de admin: `equipe.html` redireciona pra `admin.html#atalhos`.)
**Testes:** 330 de tela + 162 puros, CI verde; regras do Firestore (emulador) 100%.

**Já feito pelo Renato nesta sessão:** regras do Firestore COLADAS e publicadas (bloco `mural-control`); `npx wrangler deploy` RODADO (rotas `/join` e `/media` no ar, conferido: `/join/ao-vivo` 302, `/join/elotech-agibank` 404, `/media` 404 até existir a release); segredo `ALBUMS` com o Bosch 2026.
**O que depende do RENATO (nesta ordem):**
- **Aprovar os cortes do vídeo** (`DevFestIA/tools/video/cuts-2025.json`; os 9 arquivos prontos estão em `~/Downloads/devfest-mural-clips-2025/`) e dizer "pode publicar": a IA cria a release `mural-video-2025` em `gdgcampinas/DevFest-Campinas-2026` com os 9 arquivos (`gh release create`). Sem a release `/media` dá 404 e nenhum vídeo toca. O Worker já está publicado, não precisa novo deploy.
- Confirmar que o link de `ao-vivo` no segredo é o CONVITE pra colaborar (abrir `https://devfest-album-proxy.gdgcampinas-devfest.workers.dev/join/ao-vivo` no celular e ver se oferece entrar e adicionar fotos; link só de visualização não deixa ninguém adicionar).
- **Testar o controle no celular** (`mural-controle.html`, login Google) com o mural aberto. **PENDÊNCIA ABERTA:** o Renato disse que "assim que recarrega remove o aviso" e pediu aviso de 1 min (opção de 1 min JÁ criada, commit `f78faed`). Eu NÃO consegui reproduzir o defeito: o teste mostra que o aviso volta na hora quando o mural abre do zero e que o pedido de recarga mantém os avisos no documento. Pedir ao Renato: onde sumiu (no telão ou na lista do celular?) e abrir o mural com `&diag=1` pra ver a linha "Controle remoto: ... avisos N" depois de recarregar. Hipóteses: aviso de 2 min vencendo durante os segundos da recarga, ou relógio do celular diferente do computador do telão (a validade `until` usa o relógio do moderador).
- Logos em alta, cotas e horário do coffee (entra como `moment: "coffee"` na grade); hashtag do selfie; ensaio de 1 h no hardware; os 6 e-mails dos moderadores (depois).
- Vídeo: o Renato disse que "não para de tocar com som" e era a aba do navegador do app com o mural antigo; os vídeos estão SEMPRE mudos no código (playlist sem `sound`, teste confirma).

## PLANO DA ÁREA DE ADMIN/MODERAÇÃO (FEITO na sessão 14, ver o primeiro bloco; texto original abaixo, histórico). **LEIA `DevFestIA/handoff/PLANO_ADMIN.md`: tem o plano COMPLETO e as palavras do Renato; o resumo abaixo é só um lembrete.**
**Decisão do Renato:** é uma área de CONTROLE (telão, palestras, moderação). NÃO é configuração nem alimentação dinâmica do site (isso foi descartado por ora e está no `IDEAS_BACKLOG`, "Admin com configuração"). Sem regras novas do Firestore, sem documento novo, sem custo.
**Seções de `admin.html` (interna, noindex, fora do menu e do sitemap, sem `/DEV/`):** (1) Visão geral ao vivo (telão: emergência/cena fixada/avisos; inscritos; fotos no álbum e escondidas; perguntas pendentes por trilha; palestra no ar por trilha); (2) Telão (o `initMuralControlPanel` embutido); (3) Fotos do telão (o `initMuralPhotoModeration` embutido); (4) Palestras (uma linha por trilha com a palestra no ar ou a próxima, usando `SCHEDULE` + `resolveEventState` + `talkShareCode`, e botões: abrir a moderação de perguntas EM ABA PRÓPRIA, o quadro da sala, e o pódio do Coding Jam na sessão dele); (5) Atalhos (sorteio em modo telão, mural, reset de teste, só links).
**RESTRIÇÃO IMPORTANTE:** a tela `moderacao.html` PUBLICA o quadro da palestra (`talk-boards`) enquanto está aberta (a ordem das perguntas que a plateia vê só anda com ela aberta). NÃO embutir várias trilhas numa página só: trocar de trilha pararia de publicar o quadro da outra sala. Por isso cada trilha abre em aba própria.
**Passos (um commit por melhoria, testes de tela + CI):** 1) `data/admin-sections.js` (substitui `team-tools.js`) + componente de menu, aplicado em `moderacao`, `mural-controle`, `mural-fotos`, `reset-teste` (NÃO em `mural.html` nem `checkin-display.html`, telas de TV); 2) `features/admin-session.js` (login Google único; o Firebase já guarda a sessão entre páginas) + `admin.html` com rotas por hash (`#visao-geral`, `#telao`, `#fotos`, `#palestras`, `#atalhos`); `equipe.html` vira redirecionamento; 3) Telão e Fotos embutidos; 4) Visão geral (cartões independentes; perguntas pendentes por `countWhere` do `moderationQuestionsRepository`, que as regras já permitem ao moderador); 5) seção Palestras; 6) docs e handoff.
**Opcionais (cada um exige regra nova que o Renato cola; sugestão: deixar fora):** cartão de check-ins (as regras proíbem listar `checkins` até do moderador: precisaria de `allow list: if isModerator()`); batimento do telão (`mural-status/current` gravado pelo mural com login anônimo).
**Armadilhas novas:** (a) `lsof -ti tcp:8787 | xargs kill` mata também o Claude Helper (cliente da conexão): use `lsof -ti tcp:8787 -sTCP:LISTEN`; (b) teste de tela que falha ANTES de `window.close()` deixa o processo preso: use `--test-force-exit` e feche a página; (c) `ffmpeg` do brew não tem `drawtext`; (d) `schedule.dev.js` (gitignored) precisa dos mesmos `moment` da grade; (e) o checador de traduções trata string solta de dado como texto: ids técnicos entram em `SKIP_KEYS` de `tools/i18n/check-i18n.js`; (f) cena pulada por falta de dado fica de castigo 60 s (`skipCooldownMs`): o vídeo pode levar 1 minuto pra aparecer depois que o mural abre.

## FIM DA SESSÃO 12 (2026-10-08): ESTADO PARA O PRÓXIMO CHAT

**Git:** `development` = `main` = `origin/*` = `e6a8986`, árvore limpa, CI ✅ Validar verde (agora com o passo "Test the pure logic": 140 testes de `mural/`, `album-proxy/`, `raffle/`, `contest/`; mais 298 de tela em jsdom). Tudo publicado e conferido em `gdgcampinas.github.io`.
**O que a sessão entregou (detalhes técnicos no `PROJECT_CONTEXT.md`, seção "Mural do telão de LED" e subseção "Álbuns do Google Fotos"):**
- **Mural do telão** (`mural.html`, interno, sem `/DEV/`): motor autônomo e que se corrige sozinho (vigia, cena isolada, sonda de rede, escutas que reabrem, reserva), cenas por dado (agora e próximas, **rolando agora** com foto do palestrante, fotos, patrocinadores, QR, inscritos, dicas, fênix, pódio do Coding Jam ao vivo, contagem, obrigado, **selfie**, **artes** de design que se adaptam a qualquer formato de telão), animações por dado (ignora "Reduzir movimento"), palco que serve a qualquer proporção.
- **Álbuns do Google Fotos:** intermediário próprio publicado como **Cloudflare Worker** `https://devfest-album-proxy.gdgcampinas-devfest.workers.dev` (código em `DevFestIA/tools/album-proxy/`, README próprio). 4 álbuns no segredo `ALBUMS`: `ao-vivo` (colaborativo, as pessoas do evento adicionam), `elotech-agibank` (178 fotos), `devfest-2025` (300), `gdg-talks-bosch-2026` (72, Bosch 26/08/2026; trocou o de 2025 em 2026-10-08). 5 modelos de exibição (foto única, colagem, faixa de retratos, polaroides, destaque + 3; `auto` escolhe pela orientação), **foto nova em destaque** ("Nova foto da galera", no máximo 1 a cada 15 s) e **moderação**: `mural-fotos.html?album=ao-vivo` (login Google do moderador, "Tirar do ar" / "Voltar ao ar"; coleção Firestore `mural-hidden`, regras JÁ PUBLICADAS pelo Renato e testadas no emulador). Atraso medido: o Google mostra a foto em até ~10 s; no mural são ~45 s típicos e ~90 s no pior caso (Worker 45 s + mural 45 s).
- **Cloudflare:** conta do GDG (login `gdgcampinascontato`), subdomínio `gdgcampinas-devfest`. Plugin oficial `cloudflare@cloudflare` instalado no Claude Code (escopo do usuário); o login do MCP dele é opcional (`/mcp`), o deploy usa só o `wrangler`.
- **CI:** passo novo no `validate.yml` (autorizado pelo Renato). **Diretiva nova:** protocolo de novo chat em ~95% do contexto (ver `CLAUDE.md`).
**O que depende do RENATO (ordem sugerida):**
1. **Testar o lado do moderador das fotos** (a IA não consegue, exige login Google): abrir `https://gdgcampinas.github.io/DevFest-Campinas-2026/mural-fotos.html?album=ao-vivo`, entrar com `gdgcampinascontato@gmail.com`, tocar "Tirar do ar" numa foto com o mural aberto (`.../mural.html?lineup=1&ensaio=0&demo=2026-11-28T09:10&cenas=album-ao-vivo-2`) e ver sumir.
2. **Dizer "pode" para baixar o atraso da foto nova de 45 s para 20 s** (Worker `ttl.live` e `pollMs` do ao vivo; ~4.300 pedidos/dia no plano grátis de 100.000). A IA faz: ajusta `album-service.mjs`/`mural-albums.js`, `npx wrangler deploy` (ele precisa rodar o deploy ou autorizar a IA a rodar).
3. **Mais álbuns** (link + nome): a IA acrescenta a entrada em `data/mural-albums.js` e a cena; o Renato atualiza o segredo (`cd DevFestIA/tools/album-proxy && npx wrangler secret put ALBUMS`, JSON INTEIRO com todos os álbuns).
4. Mural: hashtag do selfie (hoje vazia), logos em alta e cotas dos patrocinadores, fotos reais dos palestrantes, texto de Wi-Fi/estacionamento/comida (dicas `enabled: false`), formato real do telão, **ensaio de 1 h ou mais no hardware** com Wi-Fi desligado no meio.
5. Um moderador com `mural-fotos.html` aberto no celular DURANTE o evento (o álbum ao vivo não tem aprovação antes).
6. Coding Jam, sorteio, time, Sympla: ver "Próximos passos" abaixo e as pendências no `NEW_CHAT_PROMPT.md`.
**Armadilhas desta sessão (somar às de "Como trabalhar e testar aqui"):** (a) o repositório é PÚBLICO: link de álbum do Google Fotos dá acesso, NUNCA escrevê-lo em arquivo (nem handoff): varrer com `grep -rl` antes de commitar; (b) `wrangler secret put ALBUMS` troca o valor INTEIRO (mandar todos os álbuns), `wrangler deploy` só atualiza código, e mudar o subdomínio `workers.dev` troca o endereço e quebra o antigo; (c) fotos do Google abertas de `http://localhost` dão 429: as páginas do mural têm `<meta name="referrer" content="no-referrer">`; (d) no navegador do app a aba fica oculta e o Chrome congela animações CSS: antes de screenshot rode `document.getAnimations().forEach(a => a.finish())`; (e) `?ensaio=` fica guardado na aba: use `?ensaio=0` junto de `?demo=`; (f) heredoc de shell sem aspas expande crases: use `<<'EOF'`; (g) em teste de tela, array/objeto criado dentro do jsdom não é `deepEqual` do teste: espalhe `[...x]` ou use JSON; (h) em zsh `status` é só leitura; (i) teste de moderação instável no CI (timing): `gh run rerun <id> --failed`; (j) com várias pushes seguidos o "pages build and deployment" pode falhar por ter sido substituído: confira o mais novo.

## Sessão 12 (2026-10-07): MURAL DO TELÃO, FASE 1 (feita)

Renato autorizou o plano ("autorizado todos") e a Fase 1 foi entregue, um commit por melhoria: (1) motor autônomo com testes de falha, (2) página e cenas. Arquitetura e parâmetros: `PROJECT_CONTEXT.md`, "Mural do telão de LED",
subseção "Implementação da Fase 1". Resumo do que existe:
- **`mural.html`** (interno, fora do menu e do sitemap, `noindex`, SEM versão `/DEV/`: abrir na raiz). Links pro Renato testar (cada um é uma tela simulada; o relógio simulado `?demo=` e `?ensaio=0` evitam depender da hora):
  `https://gdgcampinas.github.io/DevFest-Campinas-2026/mural.html?lineup=1&ensaio=0&demo=2026-11-28T09:10&diag=1` (rodízio completo com painel de saúde),
  `.../mural.html?lineup=1&ensaio=0&proporcao=3:1&demo=2026-11-28T09:10` (faixa ultra larga), `.../mural.html?lineup=1&ensaio=0&tela=1920x1080&cenas=qr-cartao` (uma cena só). Sem `?lineup=1` só entram as cenas com dado real
  (fotos, QR, inscritos, dicas, fênix, contagem, obrigado, reserva).
- **Autocorreção testada** (jsdom + relógio falso): cena que erra no prepare/render/mount/dispose, prepare que trava, cena sem nada pra mostrar, tipo de cena inexistente, erro solto da página, reserva e HTML de emergência,
  interrupção, retomada na cena de antes da recarga, prazo do vigia, trava anti-laço de recargas, sonda de internet, escuta do banco que cai/fica muda/o login falha, versão nova publicada, 8 h de resistência.
- **Fontes ao vivo ligadas:** `registered` (poll de `event-stats` a cada 5 min) e `podium` (escuta de `contest-results/<talkKey>` das sessões com concurso). Pódio publicado AO VIVO entra na frente com papel picado;
  pódio já publicado ao abrir só entra no rodízio. **O lado do moderador (publicar o pódio de verdade, com login Google) o Claude não testou**, só o emulador e o jsdom.
- **Mascote:** `docs/assets/img/gumbleton.png` (833x1000, copiado de `Design/mascote-gumbleton-2026/gdg-campinas-mascote-isolado-transparente.png`, uso autorizado pelo Renato na cena da fênix).
- **Verificação no navegador do app (desktop):** 16:9, 3:1, 4:3 e vertical (1080x1920), todas as cenas, painel de diagnóstico, fontes ao vivo lendo o Firestore de verdade e rodízio completo. Não é página pra celular.
**O Renato precisa FAZER:** (1) olhar o mural e dizer o que ajustar; (2) os itens de "Em aberto do mural" abaixo; (3) o ensaio no hardware real (computador do telão, `--kiosk`, tomada, sem repouso, Wi-Fi desligado no meio,
testar a volta depois de ligar sem internet); (4) OK pra mexer no `validate.yml` (incluir `tools/mural/`, `tools/raffle/`, `tools/contest/`, `tools/room/`).
**Bug achado pelo Renato no painel `?diag=1` e corrigido:** `dispose: activeDispose is not a function` (o `mount` do QR devolvia a instância do QRCode; o motor agora só aceita função como `dispose`, com teste). Mural subiu pra `?v=2` em `mural.css`, `mural.js` e `mural-qr-scene.js`.
**Animações do mural (feitas depois, por pedido do Renato):** troca de cena em sequência sem sobreposição (o Renato viu uma foto por baixo das dicas: era a opção "Reduzir movimento" do Mac desligando as animações; o mural agora a ignora),
zoom lento nas fotos, cartões entrando em fila, pódio entrando 3º, 2º, 1º com a festa na hora do 1º, número de inscritos que sobe, `transition` por cena no dado. Tudo em `MURAL_CONFIG.motion` (PROJECT_CONTEXT, "Animações"). `talk-highlight.js` subiu pra `?v=7` em TODAS as páginas.
**Cenas novas (pedido do Renato):** "Rolando agora" (`rolando-0..3`, uma sala por vez, 8 s, foto mock + texto curto `blurb`/descrição) e "selfie" (o telão como painel de foto pro Instagram: o Renato mostrou fotos de 2025 com gente tirando selfie na frente do LED). A hashtag do selfie está VAZIA (o Renato precisa definir).
**Artes (feitas):** o Renato mandou 3 artes (banner do pôr do sol, convite "28/11", Gumbleton vertical com selo) e disse que AINDA NÃO SABE o formato do telão; por isso elas se adaptam a qualquer proporção por dado (`data/mural-arts.js`: `fit` e `focus` por forma). Banner = fundo do selfie; convite = cena `abertura` só ANTES do evento; Gumbleton = `arte-gumbleton`. A frase "Tire sua foto aqui..." foi removida a pedido. Ver PROJECT_CONTEXT, "Artes".
**ÁLBUNS DO GOOGLE FOTOS (feito, autorizado pelo Renato em 2026-10-08):** intermediário em `DevFestIA/tools/album-proxy/` (22 testes `node --test DevFestIA/tools/album-proxy/*.test.mjs`, no CI desde 2026-10-08) + cena `album` com 5 modelos e foto nova em destaque (ver PROJECT_CONTEXT, "Álbuns do Google Fotos"). Álbuns: ao vivo, Elotech Agibank, DevFest 2025: os LINKS estão só na conversa do Renato e vão num segredo do intermediário, NUNCA no repositório.
**O intermediário JÁ ESTÁ PUBLICADO (2026-10-08):** `https://devfest-album-proxy.gdgcampinas-devfest.workers.dev` (Worker `devfest-album-proxy`, segredo `ALBUMS` já cadastrado; para trocar ou acrescentar álbum: `cd DevFestIA/tools/album-proxy && npx wrangler secret put ALBUMS` com o JSON inteiro, e acrescentar o álbum em `docs/js/data/mural-albums.js`; para atualizar o código: `npx wrangler deploy`). `MURAL_CONFIG.albums.proxyUrl` já aponta pra ele. Mudar o subdomínio do `workers.dev` troca o endereço e quebra o antigo.
**Decisões do Renato em 2026-10-08:** (a) quem pode adicionar fotos ao álbum ao vivo: **as pessoas que estão no evento** (álbum colaborativo, sem aprovação antes; o controle é esconder depois, em `mural-fotos.html`); (b) OK pra incluir os testes novos no CI: FEITO (`validate.yml` ganhou o passo "Test the pure logic (mural, album proxy, raffle, contest)", 140 testes); (c) **NOVA DIRETIVA**: avisar quando o contexto do chat estiver em ~95% e rodar o protocolo de novo chat (ver `CLAUDE.md`, "Diretiva de Contexto Cheio").
**O Renato ainda precisa FAZER:** (2) subir 3 a 5 fotos no álbum ao vivo pelo celular e avisar a hora, pra eu medir o atraso do Google; (3) confirmar quem pode adicionar fotos ao álbum ao vivo (sem aprovação antes, qualquer foto aparece no LED até alguém esconder); (4) **colar as regras do Firestore de novo** (`pbcopy < DevFestIA/firebase/firestore.rules`, Firestore > Regras > Publicar): nova coleção `mural-hidden` (fotos escondidas); sem isso o moderador não consegue esconder e o mural não lê a lista; (5) abrir `mural-fotos.html?album=ao-vivo` (login Google, no celular do moderador) e testar "Tirar do ar" com o mural aberto.
**Teste do álbum do Google Fotos (feito pelo Claude em 2026-10-08, ver IDEAS_BACKLOG, "RESULTADO DO TESTE do álbum"):** iframe não funciona, mas ler a lista de fotos da página de compartilhamento FUNCIONA (300 fotos de até 4032 px do álbum de 2025) e as imagens carregam em `<img>` do nosso site; falta decidir o intermediário (job do GitHub Actions pro álbum de 2025, Worker do Cloudflare pro álbum ao vivo de 2026) e o Renato autorizar a Fase 2.
**Pendente:** fênix animada (Fase 3) precisa do arquivo; hashtag do selfie; o Renato olhar o corte de cada arte quando souber o formato do telão.
**Armadilhas novas:** (a) `?ensaio=` fica guardado na aba: um `?ensaio=agora` antigo desloca a grade e o `?demo=` deixa de bater; use `?ensaio=0`; (b) em teste de tela, array criado dentro do jsdom não é `deepEqual` de array do teste
(use `[...x]`); (c) o servidor local em 8080 serve `docs/` com cache do navegador: pra ver CSS novo faça `fetch(url, { cache: "reload" })` e recarregue, ou bump do `?v=`; (d) o mural usa `?v=1` em todos os arquivos novos e
`css/mural.css?v=1`: ao mudar um deles depois de publicado, subir o N em `mural.html` (e o mural em produção recarrega sozinho na troca de cena quando a assinatura dos `?v=` muda).

## Sessão 11 (2026-10-06 e 10-07): ideias, Coding Jam (card e concurso), decisões do mural do telão

**(FEITA na sessão 12, ver acima) MURAL DO TELÃO, FASE 1.** Leia "Mural do telão de LED" no `PROJECT_CONTEXT.md` (decisões, arquitetura e tabela de autocorreção) e as duas seções do `IDEAS_BACKLOG.md` (mural e foto ao vivo). Resumo: `mural.html` interno, computador plugado no telão rodando o Chrome, NINGUÉM opera, tempo real, sem som, proporção desconhecida (simulada por `?tela=`/`?proporcao=`); escrever PRIMEIRO o motor autônomo com testes de falha, depois as cenas (agora e próximas, fotos antigas, patrocinadores, QR gigante, inscritos, dicas e avisos, fênix estática, pódio do Coding Jam, reserva sem rede). A Fase 1 NÃO depende das decisões em aberto abaixo (a foto ao vivo é módulo desligável, Fase 2). Mockup aprovado em conversa (16:9 e 3:1). O plano da Fase 1 foi apresentado ao Renato mas ele AINDA NÃO disse "autorizado": confirmar a autorização antes de codar (Diretiva Master).
**Em aberto do mural (Renato):** link de um álbum colaborativo de TESTE do Google Fotos (pra decidir entre foto pelo nosso site ou álbum lido por intermediário); logos em alta e cotas dos patrocinadores; originais em alta das fotos de edições antigas; fênix (arquivo: vídeo, sprites ou só imagem); dicas e avisos reais (Wi-Fi, estacionamento, comida); se o sorteio usa o mesmo telão; proporção/resolução quando souber.

**Decisões de ideias:** ver "Decisões de 2026-10-06" mais abaixo e "Descartadas" no `IDEAS_BACKLOG.md` (nota média pública nunca; credencial digital, mentorias,
mural da hashtag, área administrativa e votação das salas descartados; certificado só DEPOIS do evento). Moderadores: 6 e-mails fixos (1 por trilha + 2 reservas).
**Pendente do Renato:** passar os 6 e-mails (contas Google com e-mail verificado) e confirmar `gdgcampinascontato@gmail.com`; o Claude edita `isModerator()`,
roda `bash DevFestIA/tools/questions/run-rules-tests.sh` e o Renato cola as regras no console, uma vez.

**Coding Jam (feito no código, 2026-10-06):** card de destaque na grade (faixa "Mão na massa" no topo, chip cheio, borda com brilho, marca d'água de troféu, pódio 1º, 2º, 3º com
prêmio opcional por dado, "Traga seu notebook", GDG Campinas como quem conduz), modal com etapas e regras, perguntas ao vivo DESLIGADAS (no microfone), avaliação mantida. É uma palestra
normal da grade (workshop + `highlight: "codejam"`): herda favorito, Minha agenda, `?agenda=`, calendário, "agora", check-in e relatório, e vale em qualquer trilha e sala.
**Concurso da sessão (cadastro do projeto, votação e pódio): FEITO, mas depende de regras novas.** Quem tem check-in cadastra o próprio projeto (nome da pessoa e do projeto), a turma vota
(um voto por check-in, nunca no próprio) só durante a sessão, o moderador publica o pódio (mostrado no modal, nos cards e no quadro da sala com papel picado). Detalhes e decisões em
`PROJECT_CONTEXT.md`, seção "Destaque de sessão". Hoje é MOCK (trilha IA, 10:30, Sala Observatório, 1 slot de 40 min, com Antigravity e Gemini; decisão do Renato em 2026-10-07: o Jam será sempre na trilha de IA, às 10:30).
**O Renato precisa FAZER:** (1) **colar as regras do Firestore de novo** (`pbcopy < DevFestIA/firebase/firestore.rules` e Firestore > Regras > Publicar): sem elas o cadastro e o voto são recusados;
(2) definir horário, sala e prêmios do Coding Jam (hoje mock) e se ele conta como o workshop obrigatório do e-mail dos organizadores (sem workshop o patrocínio não é pago);
(3) pedir acesso de organizador no codingjam.dev (o e-mail pra `gca-americas@google.com` voltou: grupo inexistente; a mensagem do LinkedIn pra Christina Lin foi rascunhada);
(4) testar o lado do moderador do concurso (login Google, o Claude não consegue): abrir `moderacao.html?trilha=ia` no horário do Jam (ou com `?palestra=1030.ia`), ver os projetos e votos, Publicar pódio;
(5) os 6 e-mails dos moderadores (ver acima).
**Regras publicadas e conferidas (2026-10-06):** o Renato colou as regras e o Claude rodou 21 verificações contra o banco REAL como plateia anônima (check-in, cadastro, lista, voto, voto duplicado,
voto no próprio projeto, placar fechado, pódio só leitura): todas passaram. Ficaram dados de teste no banco, na sessão inventada `2026-11-28T17:15:00.000Z|zzteste` (2 check-ins, 1 projeto, 1 voto):
a limpeza ("🧹 Limpar dados de teste") agora apaga as coleções `contest-*` também. O lado do moderador (publicar pódio) continua só testado no emulador e com jsdom.
**Cancelado/adiado:** a página `codejam.html` com envio de projetos (o envio é direto no Google); Jam de 2 slots (campo `slots`, só anotado).
**Armadilhas novas:** (a) as telas internas (`moderacao.html`, `checkin-display.html`, `reset-teste.html`, e o futuro `mural.html`) NÃO têm versão `/DEV/` (só as páginas públicas têm; `/DEV/moderacao.html` dá 404): use `moderacao.html?trilha=ia&palestra=1030.ia&lineup=1` na raiz; (b) a faixa do card do Coding Jam é "Mão na massa" (não "Competição") e o card diz "Recomendamos usar Antigravity, Antigravity IDE ou Gemini"; (c) testes de tela com `setInterval` curto (40 ms) falham em máquina muito carregada: use `waitFor` (em `tools/lib/dom-harness.js`) e intervalos longos quando o relógio não for o assunto; dois testes antigos (perguntas e moderação) ainda podem falhar sob carga extrema: `gh run rerun <id> --failed`; (d) `tools/check-lineup.js` e `tools/check-calendar.js` já estavam quebrados antes (listas de arquivos defasadas, fora do CI); a cobertura vem dos testes jsdom. No Node 24
`node --test <diretório>` falha: passe os arquivos (o CI usa outra versão). Os testes das regras agora põem o `pid` nos ids (os arquivos rodam em paralelo no mesmo emulador e colidiam às vezes).
O emulador local guarda os dados sob o projeto `devfest-campinas` (não `demo-devfest`, que é o dos testes de regras): pra semear dado na mão use esse projeto na URL REST.

## Sessão 10 (2026-10-01 a 2026-10-03): o que foi feito

Detalhes técnicos de cada item: `PROJECT_CONTEXT.md`, seção "Sorteio" (parágrafos datados). Resumo:

**Sorteio (fechado no código, atrás de `devOnly`; só falta o Renato testar o lado do moderador e ligar as travas no dia)**
- **Roda:** gira de verdade, nomes centrados nas fatias (rótulo girado -90°), linha divisória reta entre fatias, amostra de 24
  fatias com o sorteio saindo da lista inteira, ganhador fica 25 s sob a seta e a roda se renova.
- **Modo telão** (botão "Modo telão" ou `sorteio.html?telao=1`, notebook no HDMI do telão do palco): 3 colunas (já sorteados à
  esquerda com rolagem, roda e cartão do ganhador no centro, contador enorme + "Acabaram de entrar" + QR à direita). Testado em
  janelas largas e baixas.
- **Ausente** (sai de vez, não gasta o número do prêmio) e **Resetar sorteios** = nova RODADA (`raffle-state`): todos voltam pra
  roleta e o prêmio recomeça do 1, SEM apagar nem baixar nada (confirmação digitando RESETAR). Cadastros nunca são tocados.
- **Papel picado** (explosão do cartão + chuva do topo) e **fanfarra de festa** sintetizada, com botão "Som: ligado/desligado".
- **Proteção contra trapaça, cada uma atrás de um INTERRUPTOR hoje DESLIGADO:** QR que muda a cada minuto
  (`raffleRequiresCode()`, linha `// RAFFLE-CODE` em `firestore.rules`) e 1 ingresso = 1 cadastro com o e-mail do Sympla
  (`raffleRequiresTicket()`, linha `// RAFFLE-TICKET` + `requireTicket` em `docs/js/data/raffle-config.js`; um teste no CI confere que
  tela e regras estão iguais). Aviso de nomes repetidos (só aviso, ninguém é excluído).
- **Regras do Firestore publicadas pelo Renato em 2026-10-03** (versão do commit `135c56a`, 391 linhas) e conferidas pelo Claude
  contra o banco real SÓ como plateia anônima (check-in com código, cadastro, plateia sem acesso a `raffle-session`/`raffle-state`/
  `raffle-draws`). **O lado do moderador (gravar a rodada, sortear com `round`, ausente, resetar) o Claude NÃO consegue testar
  (exige login Google): o Renato precisa rodar o roteiro abaixo.**
- Bugs reais achados e corrigidos: o giro dependia de `requestAnimationFrame` (não dispara com aba oculta: a roda não girava e o
  ganhador era revelado na fatia errada); rótulos 90° fora das fatias; roda de 1 fatia azul quando o banco recusava a leitura;
  cartão do ganhador cortado em tela larga e baixa; lista de sorteados sem rolagem no telão.

**Roteiro de teste do moderador (pendente do Renato, 2 min):** abrir `https://gdgcampinas.github.io/DevFest-Campinas-2026/DEV/sorteio.html?telao=1`
(ou sem `?telao=1`), Cmd+Shift+R, entrar com Google, girar (confete + fanfarra + ganhador em "Já sorteados"), marcar Ausente e girar
de novo (o prêmio não avança), Resetar sorteios (digitar RESETAR: todo mundo volta, "Já sorteados" zera), girar de novo (prêmio 1).

**Time**
- Página liberada em PROD (22 pessoas reais, agora 23 com Matheus Naitzki Angeloni). Todos têm foto e LinkedIn, exceto o
  Matheus (LinkedIn dele entrou) e a Laydianne (link cortado). Bios: 17 de 23 (faltam Carlos, Débora, Laydianne, Lorenzo, Felipe,
  João Paulo). Bianca e Carlos Santos (antes "Carlos H") completos. Cargo dos 4 organizadores ainda em branco.

**Sympla (análise, nada alterado):** o job "🎫 Sincronizar Sympla" está configurado a cada 10 min mas o GitHub o roda em média a cada
**4,4 h** (máx. 8,3 h), 53 de 53 com sucesso, ~10 s cada, sem lógica de nova tentativa. Última rodada: **0 inscritos**, 0 check-in,
0 não aprovados (token ok; ou não há ingressos aprovados, ou a leitura não pega: o Renato conferir o painel do Sympla). Impacto: com
`RAFFLE-TICKET` ligado, quem comprar ingresso na hora pode esperar HORAS pra entrar no sorteio. Plano: rodar o sincronismo na mão
antes de abrir o cadastro (`gh workflow run sync-sympla.yml -R gdgcampinas/DevFest-Campinas-2026 --ref main`). A mensagem da tela
"aguarde até 10 minutos" (`raffle.ticketNotFound`) está otimista demais e deve ser corrigida. A API do Sympla v1.6.0 tem
endpoints de ESCRITA de check-in de porta (decidido NÃO usar agora; análise em `IDEAS_BACKLOG.md`, "Check-in de porta").

**Outros:** análise do check-in de porta no `IDEAS_BACKLOG.md` (a "credencial digital" foi descartada em 2026-10-06). O GitHub pediu permissão nova do app
"Claude" (Administration + Merge queues, só leitura): recomendado NÃO aceitar (nada aqui depende do app).

## Próximos passos (ordem sugerida no fim da sessão 10)

1. **Renato:** rodar o roteiro de teste do moderador do sorteio (acima) e contar o que viu. 2. **Claude:** corrigir o que aparecer.
3. **Claude, sem depender do Renato:** corrigir o texto "aguarde até 10 minutos" do cadastro por ingresso (`raffle.ticketNotFound`, PT e EN)
   para algo honesto sobre o atraso do Sincronizar Sympla (horas, não minutos). 4. (FEITO em 2026-10-08, com o OK do Renato) os testes puros (`raffle`, `contest`, `mural`, `album-proxy`) rodam no CI, no passo "Test the pure logic" do `.github/workflows/validate.yml`. 5. **Renato decide:** horários de
   abrir/fechar o cadastro do sorteio, prêmios (e qual é o principal), quando tirar o `devOnly`. 6. **Renato manda:** 6 mini-bios (Carlos, Débora,
   Laydianne, Lorenzo, Felipe, João Paulo), LinkedIn completo da Laydianne e do Davi, cargo dos 4 organizadores; e confere no painel do Sympla
   quantos ingressos aprovados existem (o job lê 0). 7. Outras frentes: dados reais do evento, mural do telão de LED, certificado (depois do evento), ES/FR.

## Sorteio no dia do evento: checklist e decisões

- **Interruptores:** virar `// RAFFLE-CODE` e `// RAFFLE-TICKET` para `true` em `DevFestIA/firebase/firestore.rules` e
  `requireTicket: true` em `docs/js/data/raffle-config.js`; rodar `bash DevFestIA/tools/questions/run-rules-tests.sh` (testa os 5
  cenários, precisa de Java 21, já instalado); testar com o e-mail de um ingresso REAL; publicar as regras
  (`pbcopy < DevFestIA/firebase/firestore.rules`). Com o código ligado o link antigo `?checkin=1` deixa de valer.
- **Fluxo da pessoa:** escaneia o QR do telão (isso JÁ é o check-in do sorteio, não existe passo separado), preenche nome,
  sobrenome, e-mail do ingresso e o aceite. Não depende do check-in das palestras nem do check-in da porta no Sympla.
- **Cadastro:** a janela é o tempo em que o QR está na tela da organização (sem QR visível ele expira em 1 a 2 min). Recomendado:
  abrir de manhã/começo da tarde e fechar 10 a 15 min antes do sorteio. **Horários de abrir/fechar: o Renato ainda não definiu.**
- **Notebook do telão:** tomada, sem repouso, logado, QR visível (se dormir o QR expira); testar áudio HDMI e volume no ensaio.
- **Antes do evento:** rodar "🧹 Limpar dados de teste" (agora cobre as coleções do sorteio, `raffle-session` e `raffle-state`, e as do concurso da sessão, `contest-projects`, `contest-votes` e `contest-results`):
  hoje há mais de 75 cadastros fictícios no banco (72 voluntários x4 + "Teste Claude", "Teste Pos Regras", "Teste Rodadas").
- **Decisões do Renato (não reabrir sem motivo):** ausente sai de vez; exigir o e-mail do ingresso do Sympla; reset NÃO apaga nem
  baixa nada; som "mais festa"; confete = explosão do cartão + chuva do topo; telão = notebook no HDMI. **Em aberto:** prêmios
  (quais e quantos, pausado), intensidade maior no prêmio principal, quando tirar o `devOnly`, fotos do sorteio de 2025.

## Status em uma olhada

- **Mascote e comunicação:** Gumbleton (Gumble), a fênix do GDG Campinas, foi consolidado em `../../../Design/mascote-gumbleton-2026/`. O inventário e as regras de uso estão em `../../../docs/Marca_e_Mascote_2026.md`. Nenhum arquivo do site, deploy, Firebase ou workflow foi alterado por essa consolidação; aplicar o mascote no site requer autorização explícita do Renato.

- Site estático de **8 páginas** (Principal, Grade, Palestrantes, Ingressos, Time, Patrocínio, Sorteio,
  Código de Conduta — Sorteio ainda só em modo DEV, ver "Sorteio" abaixo; Time já é público) mais 4 ferramentas internas
  (`checkin-display.html`, `moderacao.html`, `reset-teste.html`, `mural.html`),
  sem build. Publicado por GitHub Pages a partir de `docs/` no `main`; trabalho no
  `development`, o CI valida e promove sozinho (push no `development` = vai pro ar em minutos).
- **Backend mínimo, todo grátis (plano Spark, sem Blaze, sem servidor nosso):** Firebase
  (Firestore + Authentication anônimo) pra check-in, avaliações e o total de inscritos; um job do
  GitHub Actions (a cada 10 min) lê o Sympla e grava no Firestore. O resto do site é 100% estático.
- **PROD (público) esconde todo mock por padrão** (as páginas Grade, Palestrantes e Patrocínio abrem, mas mostram "será revelado em breve" no lugar de line-up, patrocinadores, comunidades
  e valores de ingresso). **O Time foi liberado em PROD em 2026-10-01** (hoje 23 pessoas reais, `pages/time.js` renderiza sem o gate). **DEV** (`/DEV/<página>` ou `?lineup=1`) mostra tudo.
  A identidade visual (logo, galáxia, cores) vale nos dois modos.
- **Inscrição é só no Sympla** (evento `s36cd5d`, id 3591517, vendas abertas, link em
  `EVENT.tickets.url`, 0 inscritos no dia da implementação).
- **Workflows no GitHub Actions** (com ícone): ✅ Validar, 🚀 Publicar no main, 🎫 Sincronizar Sympla
  (cron 10 min), 📊 Relatório do evento (sob demanda + 30 min em 28/11), 🧹 Limpar dados de teste
  (sob demanda, com travas). Secrets no repositório: `SYMPLA_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`.
- **Estado do git ao fechar a sessão 10:** `development` = `main` = `origin/*`, árvore limpa (conferir com `git log`). Dados de TESTE
  no Firestore de verdade (check-ins, perguntas, cadastros do sorteio): limpar com o workflow antes do evento.
- **Testes:** ~200 de tela (jsdom) + Node em `DevFestIA/tools/raffle/` e `questions/` + regras no emulador. Os de `tools/raffle/`
  AINDA NÃO rodam no CI (pendente de OK do Renato pra editar `.github/workflows/validate.yml`).

## Sessão 7 (2026-09-24/25): o que foi feito

1. **Chave do Firebase restrita por domínio** (feito pelo Renato no Google Cloud: `gdgcampinas.github.io`, `localhost:8080`, `devfest-campinas.firebaseapp.com`). Login Google ativado e domínio autorizado.
2. **Quiz "Monte sua trilha"** (`quiz.html`, CTA na home; PROD só trilha, DEV/revelado sugere 3 palestras e adiciona à Minha agenda).
3. **Inglês** (`?lang=en`, seletor PT|EN, PT continua padrão no código, conferidor no CI, ES/FR = só um dicionário novo).
4. **Perguntas ao vivo v2, moderação e quadro da sala** (ver PROJECT_CONTEXT "Perguntas ao vivo, moderação e quadro da sala"): pergunta nasce `pending`, moderador aprova/rejeita/marca respondida, até 3 por pessoa (era 10, reduzido na sessão 8), só com check-in, voto só em aprovada; `moderacao.html`, quadro da sala (`checkin-display.html`, antiga tela de QR), modo ensaio (`?ensaio=agora|HH:MM`), palestra fixada (`?palestra=0900.ia`), QR de check-in abre a palestra no celular.
5. **Testes de verdade sem tocar o banco:** emulador local (`DevFestIA/tools/emulator/start.sh`, site com `?emulador=1`) e 21 casos das regras (`DevFestIA/tools/questions/run-rules-tests.sh`, roda com a trava de horário ligada e como está no arquivo). O emulador guarda os dados sob o projeto `devfest-campinas`.
6. **Logins separados:** plateia (anônimo) e moderador (Google) são apps Firebase diferentes (`window.firebaseClient` / `window.moderatorClient`), pra entrar como moderador não trocar a identidade da plateia no mesmo navegador; se o banco recusar por check-in ausente o site refaz o check-in e tenta de novo.
7. **Trava de horário das perguntas: DESLIGADA de propósito (teste em DEV).** Interruptor em dois lugares que precisam ficar iguais: `windowEnforced()` em `firestore.rules` e `enforceWindow` em `docs/js/data/talk-questions.js` (um teste confere). **LIGAR antes do evento** (checklist C, item 0).
8. **Área administrativa com login: DESCARTADA em 2026-10-06** (ver "Descartadas" em `project-docs/IDEAS_BACKLOG.md`).

## Sessão 9 (2026-09-30): o que foi feito, detalhado (histórico; algumas pendências daqui já foram resolvidas na sessão 10)

Os 2 itens abaixo (mini-bio e Sorteio) são o que foi decidido e construído nesta sessão, do começo (plano)
ao fim (testado, no ar). O que falta em cada um é conteúdo/decisão do Renato, não código — ver "Pendências".

### 1. Mini-bio dos voluntários/organizadores (2026-09-30) — CÓDIGO PRONTO, FALTAM OS TEXTOS
**Feito:** campo `bio` opcional em `data/team.js`, card clicável só com bio, modal "Descubra mais sobre" (`components/person-detail.js` + `createPersonModal()` em `features/team.js`), EN pronto, testado no navegador com bio temporária. 11 pessoas já têm bio: Renato Ramos, Ricardo Koiti Matsushita, Davi Andrade, Letícia Fernandes Camargo de Campos, Pedro Escobar Missola, João Estevão Camilo, Paula Santos, Camila Fernanda Ignacio, Mayne Gabriele da Silva, Gustavo Costa e Henrique Ferreira Rodrigues da Silva. **Faltam os outros 6 (17/23 já têm, 2026-10-01)** (1-3 frases por pessoa): é preencher `bio` em `team.js` (5º parâmetro de `volunteer()`, `{ bio }` em `organizer()`), subir `team.js?v=` em `time.html`. Foto do Michel Salomé entrou (recorte do corpo inteiro). Abaixo, o desenho original da task:
Clicar no card (Organizadores ou Voluntários, `time.html`) abre um **modal** "Descubra mais sobre" com
mais informação da pessoa. **Os cards continuam exatamente como estão** (foto, nome, cargo, barra
azul/verde, ícone do LinkedIn) — o modal é só uma camada a mais no clique, mesmo padrão do card de
palestra (`talk-modal.js`: card clicável abre `createModal()` com o detalhe).
- **Reusar, não duplicar:** `components/modal.js` (`createModal(id).openHTML(html)`) já é genérico e já
  serve palestra, galeria e guia de instalação — é só mais um consumidor. Não criar modal novo.
- **Falta o dado:** hoje `TEAM` (`data/team.js`) não tem campo de bio, só nome/cargo/foto/LinkedIn.
  Precisa de um texto curto por pessoa (1-3 frases: quem é, o que faz, por que ajuda o GDG) — **perguntar
  ao Renato se ele já tem isso coletado (mesmo grupo do WhatsApp das fotos?) antes de desenhar o campo.**
  Sem bio pra alguém, o card não fica clicável pra essa pessoa (ou mostra só o que já existe: nome, cargo,
  LinkedIn) — decidir com ele o comportamento de quem ainda não mandou texto.
- Forma sugerida: `bio` opcional em `person()`/`organizer()`/`volunteer()` (`data/team.js`), tornar o card
  clicável só quando `person.bio` existir (`person-card.js`, mesmo `data-item`/clique de `info-card.js`),
  modal reusa foto (maior), nome, cargo, LinkedIn e o texto da bio.

### 2. Sorteio (2026-09-30) — HISTÓRICO da sessão 9 (o estado atual está na "Sessão 10" no topo e em PROJECT_CONTEXT)
Aba nova `sorteio.html`: seção "Regras" (card com ícone, `data/raffle-rules.js`) + cadastro público
(nome/sobrenome, opt-in explícito) + roleta (área da organização, só quem loga como moderador).
**Elegibilidade revisada na mesma sessão** (o Renato pediu depois de ver a 1ª versão): o cadastro
**exige check-in** feito com um QR/link que a organização só mostra NO evento (`sorteio.html?checkin=1`)
— antes disso a tela fica travada, sem formulário, só as regras. Isso é o que garante "não pode cadastrar
antes do evento" e "precisa estar lá" (a regra do Firestore recusa o cadastro sem esse check-in, não é só
a tela escondendo). O sorteio em si continua da lista inteira de quem se cadastrou; "só quem está na sala
ganha o prêmio" é regra operacional (se a pessoa sorteada não estiver lá, o MC gira de novo — manual, sem
lógica no código), explicada no card de regras. Só o modo por rodadas na roleta (não repete ganhador; o "sorteio único" foi removido em 2026-10-01). Detalhes técnicos completos em `PROJECT_CONTEXT.md` ("Sorteio"):
3 coleções novas no Firestore (`raffle-checkins`/`raffle-entries`/`raffle-draws`, regras coladas — **falta
o Renato publicar as regras novas no console, `pbcopy < DevFestIA/firebase/firestore.rules`**), login/erro
do Google extraídos pra `features/moderator-login.js`/`components/moderator-login.js` (reusado pela
moderação de perguntas também), som sintetizado (trocar por efeito de verdade é opcional, decidir depois),
15 testes jsdom novos. Testado no navegador desktop e mobile com repositories falsos (sem Firebase de
verdade ainda — **falta testar com o Firestore real depois que o Renato publicar as regras**; confirmado
que uma tentativa de check-in contra o banco real de verdade, sem as regras publicadas, é recusada sem
quebrar a tela, não grava lixo nenhum). Fica **atrás de `devOnly`** (não aparece no menu nem mostra
conteúdo real fora do modo DEV/`?lineup=1`, a pedido do Renato) até decidir abrir pro público — ver
Pendências. **Falta gerar/imprimir o QR físico** que aponta pra `sorteio.html?checkin=1` (mesmo processo
dos outros QR do evento, fora do código) e **decidir se as fotos do sorteio do DevFest 2025** (o Renato
ofereceu mandar) entram em algum lugar da aba (banner, seção "como foi ano passado"?) — perguntar antes de
desenhar.

**Ajustes do mesmo dia, depois do 1º teste do Renato em DEV:**
- **QR desenhado na própria tela** (Área da organização, botão "Mostrar QR do sorteio"): reusa `qrcodejs`
  (mesma lib do quadro da sala, `sorteio.html?checkin=1` como texto, sem hardcode de domínio — funciona em
  DEV e em PROD sozinho). `features/raffle-draw.js` → `raffleCheckinUrl()` monta o link a partir da própria
  URL, limpando outros parâmetros (`?lineup=1` etc). Não precisa mais de ferramenta externa pra gerar o QR.
- **Lista de teste (Time) só em modo DEV, quando ninguém se cadastrou ainda:** `buildRaffleDevSeed(team)`
  transforma `TEAM` (`data/team.js`) num pool de teste; a roleta gira e sorteia normal, mas o sorteio fica
  só na memória da aba (`devDraws`), nunca grava no Firestore. Some sozinho assim que a 1ª pessoa de
  verdade se cadastra (a lista real assume). `pages/sorteio.js` decide isso via `reveal` (só passa a
  lista de teste em modo DEV), a feature não sabe de Time nem de DEV — recebe tudo por parâmetro.
- **Erro de carregar não esconde mais a roleta:** antes, um erro (ex.: regras do Firestore ainda não
  publicadas) trocava a tela inteira por uma mensagem, sumindo com a roleta. Agora vira um aviso pequeno
  por cima, a roleta continua desenhada (com 0 pessoas se for o caso) — confirmado testando de verdade
  contra o Firebase real sem as regras publicadas ainda: aparece o aviso, a roleta com a lista de teste do
  Time continua funcionando embaixo.
- Travessão removido do texto da regra "Só no dia do evento" (tinha escapado).
- 22 testes jsdom no total pro sorteio agora (11 cadastro + 11 roleta).

**Bug do link errado em `/DEV/sorteio.html` (achado e corrigido, 2026-09-30):** o Renato reproduziu — clicar
em "Sorteio" dentro do `/DEV/` caía em `gdgcampinas.github.io/sorteio.html` (raiz do domínio, 404). Causa:
`sorteio.html` era a única página carregando um script externo (`qrcodejs`) fixo no `<head>`, e a única nova
passando pelo `document.write` do `/DEV/` — essa combinação fazia o navegador pular pra fora. Corrigido:
`qrcodejs` agora carrega só quando o moderador clica em "Mostrar QR do sorteio" (`loadQrcodejs()` em
`features/raffle-draw.js`), nunca mais fixo em nenhum `<head>`. Reproduzido e confirmado corrigido no
navegador de verdade contra o site publicado.

**A roleta não girava de verdade (achado no mesmo teste do Renato):** o 1º corte só trocava o texto do botão
pra "Girando…", sem nenhuma animação — faltou portar o cálculo de ângulo do protótipo (Artifact) pro código
de verdade. Corrigido: `wheelDeg` calculado em `spin()` pelo índice de quem foi sorteado, `.raffle-wheel`
com `transition:transform`, disco bem maior (`min(88vw,460px)`, era 280px) e um nome (primeiro nome) em cada
fatia, girando junto (texto radial em CSS puro, mesmo truque de sempre, sem canvas nem SVG). Testado ao vivo
com a lista de teste do Time (22 pessoas): gira, anima, nomes legíveis, revela o ganhador certo. 2 testes
jsdom novos travam essa correção (24 no total pro sorteio).

**Roda ainda não girava de verdade (achado por Renato depois da sessão 9, corrigido 2026-10-01):** era só o
botão que trocava pra "Girando…", a roda ficava parada — bug diferente dos dois abaixo (esses já tinham
sido corrigidos na sessão 9; esse escapou porque só aparece quando o `spin()` recria o elemento do zero a
cada render, e nenhum teste jsdom checava a animação em si, só o ângulo final). Causa e correção completas
em `PROJECT_CONTEXT.md` ("Sorteio"). Confirmado ao vivo: gira, para na fatia certa, funciona em giros
seguidos.

**Ponteiro desalinhava do ganhador logo depois (achado na sequência, corrigido 2026-10-01):** o vencedor
saía do pool assim que gravava, a roda perdia uma fatia no re-render seguinte e o ângulo (calculado pra
arrumação de antes) passava a apontar pra outra pessoa. Causa e correção completas em `PROJECT_CONTEXT.md`
("Sorteio"). Confirmado ao vivo: 2 giros seguidos, ponteiro sempre certo, vencedor anterior só some da roda
no giro seguinte.

**Roda azul, uma fatia só, quando dá erro de carregar (achado testando contra o Firebase real sem as regras
publicadas, corrigido 2026-10-01):** regressão da correção anterior — o refresh da roda só rodava no
callback de sucesso do listener, não no de erro. Causa e correção completas em `PROJECT_CONTEXT.md`
("Sorteio"). Confirmado ao vivo no cenário exato do print (login OK, banco recusando os dois
repositories): roda volta a desenhar as 22 fatias do Time.

**Linha divisória entre as fatias (pedido do Renato, 2026-10-01):** 2 fatias vizinhas da mesma cor (só 4
cores, contagem varia a cada rodada) se fundiam sem fronteira visível, dando a impressão de desalinhamento
que não existia de verdade (conferido matematicamente que o ângulo sempre bateu com o ganhador). Detalhes
em `PROJECT_CONTEXT.md` ("Sorteio").

**Causa raiz dos nomes fora das fatias (2026-10-01):** os rótulos estavam 90° deslocados das cores (linha do
rótulo aponta pras 3h, gradiente começa às 12h). Corrigido em `raffleWheelLabelsMarkup` (`rotate(center - 90)`),
mais o vão do degradê da linha divisória. Detalhes em `PROJECT_CONTEXT.md` ("Sorteio").

**FASE 1 do plano de fechamento do Sorteio FEITA (2026-10-01):** modo telão (`?telao=1` ou botão), contador ao
vivo, faixa "acabaram de entrar", roda com amostra de 24 (sorteio da lista inteira), tempo do ganhador de 25 s e
giro sem `requestAnimationFrame` (bug real: com a aba oculta a roda não girava). Detalhes em `PROJECT_CONTEXT.md`
("Sorteio"). **Faltam as Fases 2 e 3 (autorizadas pelo Renato em 2026-10-01):** (2) teste de carga com 300 a 1.000
cadastros falsos no banco real ANTES de trancar as regras; (3) regras novas: "Ausente, sortear outro" (ausente sai
de vez, não gasta o número do prêmio; o botão vai na lista "Já sorteados"), 1 ingresso = 1 cadastro (hash do e-mail
do Sympla como chave, interruptor nas regras e na tela), QR que muda a cada ~60 s (código em doc do banco), aviso
de nomes repetidos (só aviso, sem excluir), testes das regras no emulador (precisa Java 21, autorizado
`brew install openjdk@21`). Fase 4 (tirar `devOnly`, revisão do inglês, checklist do dia) só quando o Renato mandar.

**FASE 3 EM ANDAMENTO (2026-10-01):** FEITOS: "Ausente, sortear outro" (commit `81e1117`), QR que muda a cada minuto e 1 ingresso = 1 cadastro
(regras + tela + testes, cada um atrás de um interruptor nas regras e na tela). **As regras do Firestore mudaram: o Renato precisa publicar de novo**
(`pbcopy < DevFestIA/firebase/firestore.rules`), com o interruptor `raffleRequiresCode()` AINDA em `false` (nada quebra
pra quem testa em DEV; o check-in novo aceita qualquer código). Antes do evento: virar `// RAFFLE-CODE` e `// RAFFLE-TICKET` para `true`
(este também `requireTicket` em `docs/js/data/raffle-config.js`), rodar `DevFestIA/tools/questions/run-rules-tests.sh`
(testa os 3 cenários de ligado), testar com o e-mail de um ingresso real e publicar. Aviso de nomes repetidos também feito. A Fase 3 está completa no código. Testes das regras do sorteio no emulador já existem (Java 21 instalado).

**Som de festa + Resetar sorteios (2026-10-03):** fanfarra original de ~1,5 s com botão "Som: ligado/desligado". "Resetar sorteios" (digita RESETAR) abre uma nova RODADA: todos os sorteados e ausentes voltam pra roleta, prêmio recomeça do 1, SEM apagar nem baixar nada (os sorteios antigos ficam guardados e deixam de contar). **PRECISA publicar as regras novas** (`pbcopy < DevFestIA/firebase/firestore.rules`): `raffle-state` (rodada) e o campo `round` nos sorteios; sem elas o sorteio real é recusado. Detalhes em `PROJECT_CONTEXT.md` ("Sorteio").

**Papel picado (2026-10-03):** explosão do cartão + chuva do topo a cada ganhador revelado (módulo puro + canvas injetável + config em `data/raffle-confetti.js`). Detalhes em `PROJECT_CONTEXT.md` ("Sorteio"). Decisão aberta: intensidade maior no prêmio principal (ainda não definido).

**Nome + sobrenome na fatia e escala (2026-10-01):** a fatia mostra nome + último sobrenome. Medido com 1.000 cadastros falsos: custo de tela e de banco OK, mas a roda fica ilegível. Proposta aguardando o Renato: roda com amostra de ~24 nomes (sempre com o sorteado), sorteio sobre a lista inteira, contador ao vivo "N cadastrados". Detalhes em `PROJECT_CONTEXT.md` ("Sorteio").

**Renato testou de novo e achou mais 2 (corrigidos na mesma sessão):**
- **"Não está rodando" no aparelho dele:** o iPhone do Renato tem "Reduzir movimento" ligado no sistema (já
  documentado aqui pra galáxia) — a regra global do site zerava a `transition-duration` da roleta junto com
  tudo, então o giro virava um salto instantâneo pro ângulo final. `.raffle-wheel` ganhou uma exceção
  (`transition-duration:4200ms !important`, bate a regra global por especificidade) — mesmo tratamento que
  a galáxia já tinha, o giro é o recurso, não decoração.
- **Nomes de cabeça pra baixo:** a metade esquerda da roda (ângulo 90°-270°) saía invertida — bug clássico
  do truque de texto radial em CSS. Corrigido rotacionando só o `<span>` do nome (não a posição) mais 180°
  nessa faixa. Confirmado nas 2 capturas que o Renato mandou: os nomes que apareciam de cabeça pra baixo
  agora leem normal.

### Motor das perguntas ao vivo — FEITO E ESTÁVEL desde a sessão 8, sem pendência técnica
Fluxo simples: espectador com check-in pergunta (até 3) -> moderador aprova/rejeita/reabre/marca
respondida -> espectadores votam -> ordena por votos. Leitura barata (`talk-boards/<talkKey>`, sem
Blaze, dentro das 50 mil leituras/dia do Spark). Moderação testada e funcionando (login, aprovar,
publicar no quadro). **Ainda não feito, decidido mas pausado a pedido do Renato:** página **Sala ao
vivo** no celular (`sala.html?trilha=ia`, plano B sem TV) e tela **Palco** do moderador — retomar só
quando ele pedir, não é a próxima prioridade.

**Armadilhas desta sessão:** (a) `?v=` por arquivo precisa ser IGUAL em todas as páginas que o referenciam, senão o cache serve arquivo velho (já houve páginas com número desatualizado); (b) `?ensaio=` fica guardado na aba (sessionStorage): use `?ensaio=0&emulador=0` pra limpar antes de testar outra coisa; (c) o Firebase MCP daqui aponta pra outro projeto e o Firebase CLI não está logado: **regras do Firestore continuam sendo coladas à mão** (`pbcopy < DevFestIA/firebase/firestore.rules`), e o Renato já publicou a versão com a trava de horário desligada; (d) `run-rules-tests.sh` precisa da porta 8085 livre (pare o `start.sh` antes); os testes do emulador NÃO rodam no CI (baixam o emulador); (e) apagar IndexedDB do Firebase com outra aba aberta na mesma origem trava o login (`deleteDatabase` fica bloqueado); (f) testes que gravam no banco de verdade deixam dados: rodar 🧹 Limpar dados de teste (agora inclui `talk-questions`, `talk-question-votes` e as 3 coleções do sorteio, desde 2026-10-01: as regras do Sorteio já estão publicadas, então cadastros de teste são gravados de verdade) antes do evento.

## Sessão 6: tudo que foi feito (2026-09-23)

1. **Feedback do evento (fase 5.3)** no hero "Encerrado"; bug de "Carregando…" eterno corrigido
   (o hero é desenhado antes dos módulos do Firebase; `render` agora é síncrono e local-first).
2. **Cartão pessoal "Eu vou!"** (canvas, baixar/compartilhar) em `ingressos.html`, com logo novo;
   `?cartao=1` abre o cartão; gate opcional por inscrição (`EVENT.tickets.registrationGate`, hoje `false`).
3. **Link real do Sympla e vendas abertas** em todos os CTAs; ticker "Ingressos: abertos".
4. **Integração Sympla -> Firestore** (job, hash de e-mail dual navegador/Node, reconciliação
   idempotente, contador "N pessoas já garantiram a vaga" a partir de 30, painel privado no resumo do
   job, testes no CI). Conta de serviço `sympla-sync`, secrets e regras publicados; rodou de verdade.
5. **Feedback v2:** "Minhas palestras" (`?avaliar=1`), aviso "avalie", botão "Avaliar" no cabeçalho,
   QR de avaliação na tela da sala (`?avaliar=<código>` faz o check-in junto), estrelas que já vêm
   cheias, **nome obrigatório**, avaliação do evento com 6 aspectos e nota 0-10 obrigatórios.
   Regras do Firestore exigem check-in pra avaliar palestra; testadas contra o Firestore real.
6. **Relatório do evento v2** (títulos, notas, distribuição, comentários, palestrantes, aspectos,
   indicação 0-10), lê a grade do próprio site; roda a cada 30 min em 28/11.
7. **Limpeza dos dados de teste:** workflow com travas (simulação por padrão, `APAGAR`, recusa
   depois do início do evento, só 3 coleções) e página `reset-teste.html` pro navegador.
8. **Workflows renomeados com ícone** (cuidado com a dependência Promote -> Validate, ver armadilhas).
9. **Logo novo aplicado:** SVG extraído do PDF, paleta do site igual às cores do logo, header,
   favicons, ícones do app, imagem de compartilhamento, script `build-brand-assets.sh`.
10. **Galáxia girando no hero da home** (o logo em espiral), presa no card, centrada no "olho"
    azul+vermelho, sempre gira (mais devagar com "Reduzir movimento"), `?movimento=1` força.
11. **Telas da sala** com dois QR alinhados (avaliar a anterior + check-in da atual).
12. **Tasks anotadas (não iniciadas):** mural do telão de LED, certificado de participação
    profissional, e as propostas descartadas/adiadas (ver Pendências).

## O que o site tem hoje

**Grade e agenda:** 4 trilhas (IA, Front/Back/Data, Mobile/Agile, Carreiras & Mentorias), 9 slots x 4 =
36 palestras (mock) geradas por `schedule-builder.js` a partir do `DAY_PLAN`. Cards, "acontecendo
agora", filtro por trilha, "Minha agenda" (favoritos em localStorage, .ics, WhatsApp, `?agenda=`).
**Em PROD a Grade mostra um aviso único.**

**Feedback (Firebase):** check-in (QR da sala `?checkin=<código>` ou honra com confirmação inline),
avaliação por palestra (nota, nome obrigatório, "o que mais gostou" e "o que melhorar" opcionais),
avaliação do evento (nota geral, 6 aspectos, 0-10, nome, textos opcionais), "Minhas palestras",
aviso "avalie". Estado local-first em `data/my-feedback.js` (sem leitura no Firestore). Regras em
`DevFestIA/firebase/firestore.rules` (colar à mão, sem deploy automático).

**Sympla:** job + `registrations/<edição>_<sha256(e-mail)>` (só o tipo de ingresso, nunca nome/e-mail),
`event-stats/<edição>` (total público), `sync-state` (interno), contador, gate opcional do cartão.

**Marca:** `docs/assets/brand/*.svg`, tokens de cor do logo, galáxia (`data/hero-galaxy.js`).

**Ferramentas internas (fora do menu, `noindex`):** `checkin-display.html?trilha=<ia|webdata|mobile|mentoring>`
(um tablet por sala), `reset-teste.html`.

**Qualidade:** contraste AA, fonte mínima 12px, foco global, skip link, PWA offline com botão
"Instalar app", GoatCounter sem cookies, fundo estrelado.

Arquitetura e decisões completas: `project-docs/PROJECT_CONTEXT.md` (seções "Inscritos do Sympla",
"Feedback v2", "Limpeza dos dados de teste", "Marca e logo", "Firebase", "PROD x DEV", "Offline (PWA)",
"Line-up model", "Design tokens" etc.).

## Decisões que o Renato já tomou (não reabrir sem motivo)

- **Sorteio (sessão 10):** ver "Sorteio no dia do evento: checklist e decisões" no topo deste arquivo (ausente sai de vez; e-mail do ingresso obrigatório; reset = nova rodada sem apagar; som de festa; confete explosão + chuva; telão no notebook/HDMI).
- **Time público em PROD** (decisão do Renato em 2026-10-01); cargo dos organizadores em aberto.
- **Mural do telão (2026-10-07):** computador plugado (Chrome), ninguém opera, autônomo e que se corrige sozinho, tempo real, sem som, proporção simulada; foto ao vivo SEM aprovação antes, qualquer moderador tira do ar, sem limite rígido por pessoa, nome opcional, exportar em zip pro Google Fotos, módulo desligável; o iframe do álbum do Google Fotos não funciona.
- **Decisões de 2026-10-06 (ideias):** nota média por palestra NUNCA é pública (só no relatório interno); credencial digital com QR, mentorias com agendamento e mural da hashtag DESCARTADOS (ver "Descartadas" em `IDEAS_BACKLOG.md`); certificado é enviado DEPOIS do evento, a todos que participaram; mapa do local, álbum ao vivo, mural do LED e cartão "Eu vou!" com a Minha agenda MANTIDOS. Sorteio considerado fechado pelo Renato (restam o texto "aguarde até 10 minutos" e os interruptores do dia). **Área administrativa DESCARTADA** (line-up chega pronto, só o Renato preenche; 6 moderadores = 1 por trilha + 2 reservas). **Pendente: o Renato passa os 6 e-mails (contas Google com e-mail verificado); o Claude põe em `isModerator()`, roda `bash DevFestIA/tools/questions/run-rules-tests.sh` e o Renato cola as regras no console, uma vez, antes do evento.** Confirmar também se `gdgcampinascontato@gmail.com` continua sendo admin.

- Nada de backend pra conteúdo; Firebase só pra feedback/check-in e leitura pública do total,
  sempre atrás de repository. **Tudo grátis (sem Blaze):** Cloud Functions descartadas, o job roda no
  GitHub Actions.
- **Inscrição só no Sympla** (venda e inscrição; a API v1.6.0 tem endpoints de ESCRITA de check-in, mas ficamos com o app do Sympla na porta, ver `IDEAS_BACKLOG.md` "Check-in de porta"); o site é vitrine e ponte.
- Feedback: uid do Firebase segue anônimo, mas **o nome é obrigatório** em toda avaliação (digitado,
  não verificado; substitui a decisão antiga de "anônimo"). Check-in é a prova de presença e é
  exigido pelas regras. Sem perguntas rápidas extras por palestra. **Nota média pública nos cards:
  não** (só interno, no relatório). Google Sign-In: só opcional no futuro, não agora.
- QR de avaliação na sala fica até a próxima palestra da sala terminar; escanear já faz o check-in.
- Guardamos só o tipo de ingresso por e-mail (hash), nunca nome nem e-mail (LGPD).
- Cores/marca: as 4 cores do logo novo (`#3186FF`, `#FC413D`, `#FFEC00`, `#00AF57`), fonte Google
  Sans (Google Sans Text não entra).
- A galáxia **sempre gira**; com "Reduzir movimento" gira em 240 s por volta (normal 80 s).
- Fotos de pessoas (pravatar.cc por número), salas com lugares históricos, time sem galeria.
- Confirmação de check-in é inline (nunca `confirm()`); modo DEV usa `sessionStorage`.
- Regras do Firestore: colagem manual (deploy automático descartado por dar poder demais ao job).

## Pendências

**A. Só o Renato/organização pode fazer**
0. **Sorteio (2026-10-03):** regras do Firestore já publicadas (commit `135c56a`). Pendente do Renato: (a) rodar o roteiro de teste do
   moderador (topo do handoff); (b) definir horários de abrir/fechar o cadastro; (c) decidir prêmios e o prêmio principal; (d) decidir
   quando tirar o `devOnly`; (e) ligar os interruptores no dia (ver "Sorteio no dia do evento"); (f) OK pra incluir os testes de
   `DevFestIA/tools/raffle/*.test.js` no `validate.yml`; (g) conferir no painel do Sympla quantos ingressos aprovados existem (o job lê 0).
0b. **Dados de time em aberto (sessão 9/30):**
   - **Cargo dos 4 organizadores reais** (Renato Ramos, Bianca Issa, Michel Salomé, Carlos Santos): nenhum tem
     cargo confirmado ainda, o card mostra só o nome.
   - **Organizadores:** foto, LinkedIn e bio OK para os 4 desde 2026-10-01 (Bianca Issa, Michel Salomé e Carlos Santos, antes "Carlos H", entraram nessa data); só falta o cargo.
   - **LinkedIn de Laydianne Naira:** o link colado no grupo veio cortado (`.../in/naira-ferreira-`, sem
     o resto) — confirmar com ela.
   - **LinkedIn de Davi Andrade:** ele mandou por PV no grupo, nunca confirmado aqui; o site usa o link
     da leva anterior (`davi-lima-4695b3211`), assumindo que é a mesma pessoa — confirmar.
   - **Mini-bio de todo mundo** (organizadores e voluntários), pra task acima ("PRÓXIMO TRABALHO").
1. **Dados reais:** local (`EVENT.venue`, `venueConfirmed`), salas/MCs, line-up e palestrantes reais
   (mesmo formato de `mock-talks.js`/`mock-speakers.js`), patrocinadores/comunidades, time, depoimentos,
   valores dos ingressos, vídeo de recap 2025 (`data/video.js` ainda tem o de 2017). Com o line-up real:
   `EVENT.lineupRevealed = true` (todas as seções leem o mesmo `reveal`).
2. **Plenárias:** escolher A, B ou C (recomendo **B**, só 17:15, custo zero). Mockup aprovado.
3. **Mensagens do Sympla:** confirmação com `.../ingressos.html?cartao=1`; final com
   `.../index.html?avaliar=1`; QR de avaliação do evento no encerramento (QR de exemplo já gerados).
4. **Tablets das salas:** definir quem monta e abrir os 4 links com antecedência (recarga forçada).
5. Confirmar grafia/existência dos lugares das salas.
6. **Patrocínio FIAP (PC 1427137, R$1.500,00, aprovado):** emitir a nota fiscal na **1ª semana de
   dezembro/2026** (data de entrega no PC é 02/12/2026, não pode ter competência anterior a isso) e
   sempre antes do dia 25 do mês pra cair no ciclo de pagamento; incluir o número do PC nos dados
   adicionais e os dados bancários no corpo da NF; enviar NF + boleto pra `notafiscal@fiap.com.br`
   (também `compras@fiap.com.br` e `jullieti.borba@alura.com.br`). Pagamento sai só nos dias 05/10/15/20,
   45 dias após emissão. Pendente confirmar com a Jullieti se precisa gerar boleto à parte (depósito) ou
   se a NF com dados bancários já basta — mensagem de dúvida rascunhada, aguardando envio do Renato.

**B. Quando entrarem as primeiras inscrições**
6. Conferir o resumo do 🎫 Sincronizar Sympla: formato do `custom_form` (camiseta) e paginação da
   v1.5.1 (parâmetro `page`), ainda não vistos com dado real (2026 tinha 0).
7. Testar o gate com o e-mail de uma inscrição real e então virar `EVENT.tickets.registrationGate: true`
   em `schedule.js` (senão o cartão trava pra todos). Só o `schedule.js` importa no ar: o `/DEV/` e o
   `/PROD/` publicados leem ele. O `schedule.dev.js` é gitignored e existe só na máquina do Renato
   (line-up real); mantenha-o igual só pros testes locais não divergirem, esquecer dele NÃO quebra o site.

**C. Antes do evento (checklist do dia anterior)**
0. **LIGAR A TRAVA DE HORÁRIO das perguntas** (hoje desligada pra testar): `windowEnforced()` = `true` em `DevFestIA/firebase/firestore.rules` E `enforceWindow: true` em `docs/js/data/talk-questions.js`; rodar `DevFestIA/tools/questions/run-rules-tests.sh` (o script testa com a trava ligada de qualquer jeito); colar as regras no console; fazer o ensaio (`?ensaio=agora`) pra conferir a janela de verdade; limpar os dados de teste.
8. 🧹 Limpar dados de teste: rodar em modo teste, conferir, rodar de verdade com `APAGAR` (só antes de
   28/11 08:00), e abrir `reset-teste.html` nos aparelhos de teste. Hoje há ao menos 1 check-in de teste.
9. Recarregar (Cmd+Shift+R) os tablets e conferir `checkin-display.html?trilha=...` sem `&demo=`.

**D. Tasks anotadas (não iniciadas), detalhes em `project-docs/IDEAS_BACKLOG.md`**
10. **Certificado de participação PROFISSIONAL:** A4 PDF vetorial, identidade completa, assinaturas,
    código único e QR de validação. Não depende de dado real, mas de decisões do Renato, então
    PERGUNTE ANTES de desenhar: quem recebe (presença na porta pelo Sympla, check-ins em palestras,
    ou as duas), carga horária, nome (o digitado ou o do Sympla), se precisa de validação por QR, texto
    e assinaturas. Com isso o mockup sai; aprová-lo com o Renato antes de codar. Reusa o SVG
    `gdg-logo-light.svg` (fundo claro).
11. **Mural eletrônico do telão de LED (DECIDIDO na sessão 11, ver o topo deste arquivo e `PROJECT_CONTEXT.md` "Mural do telão de LED"; as perguntas abaixo estão respondidas ou viraram Fase 2):** página interna em tela cheia com cenas em rodízio (agora/próximas,
    álbum, fênix, patrocinadores, QR, números ao vivo, dicas, avisos, a galáxia). PERGUNTE ao Renato antes
    de desenhar: tamanho e proporção do painel, entrada (HDMI de notebook ou navegador), origem das fotos
    ao vivo, arquivo da fênix (vídeo, sprites ou animação, com som?), quem opera.
    Já dá pra começar pelas cenas que não dependem disso (agora/próximas, QR, números, galáxia).
    **Mascote (fênix) consolidada (2026-09-30):** Gumbleton (Gumble) e os materiais derivados foram arquivados
    em `../../../Design/mascote-gumbleton-2026/`, inclusive as referências aprovadas em `referencias/mascote-aprovado/`
    e `referencias/logo-oficial/`. Ainda é material estático, sem vídeo/sprite/animação.
    **Onde usar (favicon, home, og:image, ou só guardar pro mural) ainda está em aberto — perguntar ao Renato
    antes de aplicar em qualquer lugar do site.**
12. **Internacionalização (PT/EN/ES/FR):** grande, precisa ser desenhada.
13. Ideias em `IDEAS_BACKLOG.md`: quiz "Monte sua trilha", enquetes/perguntas ao vivo, passaporte com
    QR nos estandes, mapa do local,
    GA4 com consentimento, restringir a chave do Firebase por domínio.
14. Pequenos: estender o repository pattern a `EVENT`/`TRACKS`/`SCHEDULE`; logos de 1 cor e de perfil
    (na pasta Downloads do Renato) ainda sem uso; galáxia como cena do mural.

## Como trabalhar e testar aqui

- Servidor local: `cd docs && python3 -m http.server 8080`.
- **PROD x DEV:** `/DEV/` ou `?lineup=1` mostra o mock (selo "DEV — sair"), `/PROD/` ou `?lineup=0` limpa.
  `/DEV/*` e `/PROD/*` nunca passam por cache.
- **Parâmetros de URL úteis:** `?demo=2026-11-28T09:20` (simula o horário; 07:30 antes, 09:20 ao vivo,
  10:00 dois QR na sala, 18:10 depois do evento), `?movimento=1` (galáxia na velocidade normal),
  `?checkin=<código>`, `?avaliar=1` ou `?avaliar=<código>`, `?cartao=1`, `?analytics=debug`, `?nosw=1`.
  Código de palestra: `HHMM.trilha` (ex.: `0900.ia`).
- **Bump de `?v=N`** em todas as páginas que referenciam qualquer `.js`/`.css` que mudou, e
  `node --check` em cada arquivo. Mudou o CONTEÚDO de um arquivo que já foi servido com aquele `?v=`
  (inclusive no navegador de teste)? Suba de novo, senão o cache serve o antigo. Trocar ícones/`/assets/`
  exige subir `SW_VERSION` em `sw.js` (cache-first por caminho).
- **Cache real do GitHub Pages: o HTML fica 10 minutos** (`max-age=600`), e o navegador do WhatsApp/Instagram
  guarda mais. Ao pedir pro Renato conferir algo: peça Safari/Chrome, Cmd+Shift+R ou um parâmetro novo
  na URL (`&v=N`). Muito "está errado" no print era versão velha em cache: confira com `curl` o que
  está publicado antes de mexer.
- **Testes de navegador com Firebase:** o Browser pane carrega o Firebase normalmente. Pra não gravar
  no banco real, troque `window.checkinRepository/feedbackRepository/eventFeedbackRepository` e
  `firebaseClient.ensureAnonymousUid` por stubs depois do carregamento. Limpar `localStorage` NÃO
  limpa os conjuntos que já estão em memória na página: use `repo.getAll().forEach(k => repo.toggle(k))`.
  Pra testar as regras de verdade use um uid novo (`auth.signOut()` + apagar o IndexedDB
  `firebaseLocalStorageDb` + recarregar) e chaves de palestra sem documento.
- **`prefers-reduced-motion`** está ligado no Browser pane e no iPhone do Renato: a galáxia gira mais
  devagar por config; regra global de styles.css zera outras animações.
- **Testes de tela (jsdom):** `npm ci --prefix DevFestIA/tools && node --test DevFestIA/tools/dom/*.test.js`
  (perguntas da plateia, moderação, quadro da sala, feedback, cadastro e roleta do sorteio, confete; rodam no CI). **Um teste da moderação (`só conta votos das aprovadas...`) já foi instável no CI** (timing; os de `talk-questions` foram corrigidos em 2026-10-28, item 27) — se o `✅ Validar` falhar só
  num teste de tela, `gh run rerun <id> --failed` costuma passar; não é regressão, não precisa investigar de novo toda
  vez. Regras do Firestore: `bash DevFestIA/tools/questions/run-rules-tests.sh` (emulador, local, ~3 min, 5 cenários incluindo os interruptores do sorteio; não roda no CI). Testes puros do sorteio: `node --test DevFestIA/tools/raffle/*.test.js` (local por enquanto).
- **Testar o sorteio sem Firebase de verdade** (login/cadastro/roleta): stubar `window.raffleEntriesRepository`,
  `window.raffleCheckinsRepository`, `window.moderationRaffleEntriesRepository`,
  `window.moderationRaffleDrawsRepository` e `window.moderatorClient.signInWithGoogle` no console do navegador
  ANTES de clicar — mesma ideia de sempre, ver exemplos nos testes jsdom (`DevFestIA/tools/dom/raffle-*.dom.test.js`)
  e no histórico desta sessão. `?checkin=1` na URL simula o QR (faz o check-in e libera o formulário).
- **Armadilhas aprendidas na sessão 10:** (1) NUNCA encadear `grep fail 0 && git commit` sem checar o resultado: use `if node --test ... | grep -E "^ℹ fail 0$"; then commit; else echo FALHOU; fi` (um commit saiu com sintaxe quebrada); (2) `requestAnimationFrame` não dispara em aba oculta/painel do app: nada importante pode depender dele (usar reflow forçado); (3) no macOS `sed -i` precisa de `''` e não tem `\b`; (4) objetos criados dentro do jsdom não passam em `assert.deepEqual` contra objetos do Node (comparar por `JSON.parse(JSON.stringify())`); (5) `:where()` tem especificidade zero: uma regra CSS posterior com o mesmo seletor ganha; (6) ids de teste "hex" precisam ser mesmo hexadecimais (a-f, 0-9); (7) testar ao vivo no navegador do app em janelas largas e baixas (o telão é assim); (8) o app do navegador mostra um painel por vez: `tabs_select` antes de `find`.
- **Testes automáticos:** `node --test DevFestIA/tools/sympla-sync/sync.test.js DevFestIA/tools/event-report/build-report.test.js DevFestIA/tools/purge-test-data/purge.test.js`
  (rodam no CI; o Node 24 não aceita diretório em `--test`, passe os arquivos). `check-meta.js` e
  `check-install.js` também rodam no CI.
- **Secrets e token do Sympla:** nunca no chat, no repo ou em arquivo. Entrou por prompt oculto
  (`gh secret set NOME -R gdgcampinas/DevFest-Campinas-2026`). Se um token vazar, apagar a chave no
  Sympla e criar outra. O `eventIdHash` não é segredo.
- **Rodar workflows:** `gh workflow run sync-sympla.yml -R gdgcampinas/DevFest-Campinas-2026 --ref main -f dry_run=true`
  (idem `purge-test-data.yml`, `event-report.yml`). Agendados só rodam no `main`.
- **Não renomeie o workflow Validar sem antes ensinar o Promote:** o "🚀 Publicar no main" escuta o
  nome exato do Validate (`workflow_run`) e roda com o arquivo do `main`. Passo 1: Promote ouvindo os
  dois nomes e promover; passo 2: renomear o Validate.
- **Regenerar marca:** `DevFestIA/design/build-brand-assets.sh` (rsvg-convert, Chrome, sips).
- Firebase: projeto `DevFest-Campinas` (console.firebase.google.com). Regras em
  `DevFestIA/firebase/firestore.rules`, colar em Firestore > Regras > Publicar a cada mudança
  (`pbcopy < arquivo` deixa na área de transferência). O emulador roda com Java 21 (`brew install openjdk@21`, já instalado; o runner põe no PATH).
- **Terminal no app:** o painel limita as abas que a IA abre por sessão; comandos curtos vão por Bash.
  No zsh `status` é variável reservada (não use como nome de variável).
- Fluxo de entrega aprovado: implementar, testar de verdade (navegador desktop e celular, node), atualizar
  `PROJECT_CONTEXT.md`/handoff, **um commit por melhoria** (inglês, sem menção de IA), push no
  `development`, conferir CI e promoção, conferir no ar com `curl`. Chamar de "Renatão", sem travessão,
  objetivo. "AUTORIZADO TODOS E PODE SIM IMPLEMENTAR" vale sim pro plano mostrado.
- Push rejeitado: `git pull --rebase origin development`. Se o Promote falhar: `git fetch origin && git
  checkout main && git merge --ff-only origin/development && git push origin main && git checkout development`.
- `[hidden]` é `display:none !important` global. Fotos do pravatar são de terceiros.

## Histórico resumido (para arqueologia; detalhes no git)

**Sessão 1:** 4 trilhas, `schedule-builder.js`, repository pattern, páginas Time/Palestrantes/Código de
Conduta/Patrocínio, ticker.
**Sessão 2:** cards e favoritos, tokens, ícones de trilha, line-up mock ligado, filtro por trilha, salas.
**Sessão 3:** ingressos/CTA, acessibilidade, calendário/compartilhar, SEO/imagem, fontes locais, PWA
offline, analytics (GoatCounter).
**Sessão 4:** botão "Instalar app" com guia por plataforma; ícone PWA/favicon trocado.
**Sessão 5 (2026-09-22/23):** fundo estrelado, página Ingressos, Firebase (check-in e avaliação de
palestra), tela de QR por sala, PROD esconde todo mock, DEV por `/DEV/` (sessionStorage).
**Sessão 6 (2026-09-23):** feedback do evento, cartão "Eu vou!", Sympla (link, job de sincronização,
contador, gate opcional), feedback v2 (Minhas palestras, aviso, QR de avaliação, nome obrigatório,
regras testadas), relatório v2, limpeza dos dados de teste, workflows com ícone, logo novo aplicado e
galáxia girando no hero. Tasks anotadas: mural do LED, certificado profissional.
**Sessões 7-8 (2026-09-24/25 a 09-29):** ver seção "Sessão 7" acima e `PROJECT_CONTEXT.md` ("Perguntas ao
vivo, moderação e quadro da sala") — quiz, inglês, perguntas ao vivo v2 completas (moderação, quadro da
sala, leitura barata), logins separados plateia/moderador, emulador local.
**Sessão 9 (2026-09-29/30, longa):** time com gente real (4 organizadores, 18 voluntários, fotos, ordem
alternada); **modal de mini-bio** (Descubra mais sobre, foto sangrando até a borda, 11/22 pessoas com
texto); **Código de conduta redesenhado** (cards de regra, `CONTACT` único, bloco de contato); travessão
removido de todo texto visível; **aba Sorteio inteira, nova** (cadastro com check-in por QR, roleta do
moderador que gira de verdade com nomes nas fatias, som sintetizado, modo por rodadas, lista de
teste do Time em DEV, atrás de `devOnly`); login do moderador extraído e reusado entre perguntas e
sorteio; `.form-error` generalizado; várias correções de bug encontradas em teste ao vivo com o Renato
(foto cortando rosto, URL errada no `/DEV/`, roleta sem animação, nomes de cabeça pra baixo, animação
zerada por "Reduzir movimento"). ~20 commits, tudo testado (navegador + 83 testes automáticos) e no ar.
**Sessão 10 (2026-10-01 a 10-03, longa):** Sorteio fechado no código (modo telão, contador e chegadas ao vivo, roda com amostra de 24, ausente,
reset por rodada, papel picado, fanfarra, QR que muda, 1 ingresso = 1 cadastro e aviso de nomes repetidos, os dois últimos atrás de
interruptores desligados); regras do Firestore publicadas e conferidas como plateia; Time liberado em PROD (23 pessoas, 17 bios);
análise do Sincronizar Sympla (roda a cada ~4,4 h, 0 inscritos) e do check-in de porta; ~40 commits, tudo no ar.
