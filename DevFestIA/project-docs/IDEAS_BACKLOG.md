# Backlog de ideias — DevFest Campinas 2026

Itens marcados como IMPLEMENTADO já estão no site (ver PROJECT_CONTEXT); o resto é aprovado em espírito
pelo Renato ao longo das sessões, nunca desenhado tecnicamente a fundo. Cole a seção que quiser
trabalhar num chat novo (junto com o prompt padrão de
`DevFestIA/NEW_CHAT_PROMPT.md`) pra retomar com contexto.

---

## Identidade e "uau"

### Redemoinho do logo animado no hero — IMPLEMENTADO (sessão 6)
O logo novo (galáxia em espiral) gira devagar atrás do hero da home (`features/hero-galaxy.js`,
dados em `data/hero-galaxy.js`). Ver PROJECT_CONTEXT, "Marca e logo". Evolução possível: a mesma
galáxia como cena do mural do LED (ver a task do telão).

### Cartão de compartilhamento pessoal "Eu vou!" — IMPLEMENTADO (sessão 6)
Versão básica feita: nome opcional + nome/data/cidade do evento + trilhas,
gerado em `<canvas>` (`features/share-card.js` + `components/share-card.js`),
botão "Já vou! Gerar meu cartão" em `ingressos.html`. Baixa PNG ou usa Web
Share API. Ver PROJECT_CONTEXT.md, seção "Cartão pessoal".
**Ainda não feito** (evolução possível, não bloqueante): incluir a Minha
agenda da pessoa (palestras favoritadas) no cartão, via
`favoritesRepository` (já existe) — ideia original tinha isso, ficou pra
depois.

### Gate do cartão pelo Sympla, contador e relatório — IMPLEMENTADO (sessão 6)
Ver PROJECT_CONTEXT.md, seção "Inscritos do Sympla". Evoluções possíveis, não
feitas: painel de camiseta no Firestore (hoje só no resumo do job), credenciamento
integrado ao check-in do Sympla, gate real da avaliação (exigiria um token emitido
por servidor), deploy automático das regras do Firestore.

---

## Telão / painel de LED no dia do evento

### Mural eletrônico (aba do site em tela cheia) — DECISÕES DE 2026-10-07, Fase 1 PRONTA PRA IMPLEMENTAR (ver PROJECT_CONTEXT, seção "Mural do telão")
Pedido do Renato (2026-09-23): o evento vai ter um telão de LED; queremos uma página do site pra rodar nele com várias coisas em rodízio. **Decisões da sessão 11 (2026-10-07):** o telão é um
**computador plugado, rodando o site no Chrome em tela cheia**; **ninguém opera** (tem que funcionar sozinho o dia inteiro e se corrigir sozinho); **em tempo real** (o que acontece no evento aparece
na hora); **sem som** (fênix sem som, por ora); **proporção e resolução desconhecidas**, então o mural é feito pra qualquer proporção e SIMULADO por URL (`?tela=1920x1080`, `?proporcao=3:1`),
como o modo telão do sorteio. Conteúdo: agora e próximas, fotos de edições antigas (o Renato manda os originais), patrocinadores (o Renato manda logos e cotas), QR gigante, números ao vivo,
dicas e avisos, fênix, pódio do Coding Jam e fotos ao vivo (Fase 2).

**CORREÇÃO sobre o álbum (2026-10-07):** a ideia antiga "iframe do álbum do Google Fotos dentro do mural" NÃO funciona: `photos.app.goo.gl` e `photos.google.com` respondem com
`x-frame-options: SAMEORIGIN` (testado com `curl -I`; só com links de exemplo, não com um álbum real) e a API oficial do Google Fotos desde 2025 só lê o que o PRÓPRIO app criou, não álbum
compartilhado. Ver a seção "Mural com fotos das pessoas" abaixo pros caminhos que funcionam.

**Mascote:** uma **fênix** está sendo feita (inspirada na capivara dançando que
o Google fez). Ela entra como cena animada do mural. Depende do arquivo
(vídeo em loop, sprites ou Lottie/SVG animado) que o Renato vai enviar.

**Forma sugerida (mesmo padrão do `checkin-display.html`):** página interna
`mural.html`, fora de `SITE_PAGES`, sitemap e `check-meta.js` (`INTERNAL_PAGES`),
`noindex`, sem header/nav/footer, tela cheia, fonte grande. Um carrossel de
"cenas" data-driven (`data/mural-scenes.js` via repository, uma função de
render por tipo de cena em `components/`, ordem e duração por dado, sem HTML por
cena). `?cenas=agora,album,patrocinadores` filtra/ordena por URL; `?aspect=`
ajusta a proporção. Modo quiosque: cursor escondido, `wakeLock`, recarrega
sozinho se travar, funciona offline (service worker já cacheia as páginas).

**Ideias de cenas (do mais ao menos essencial):**
1. **Acontecendo agora + próximas** por trilha e sala, com contagem regressiva
   (reusa `resolveEventState()`/`live-status.js`, mesma fonte do "AO VIVO").
2. **Álbum do evento**: fotos do 2025 antes/durante e fotos do dia ao vivo.
3. **Fênix** (mascote animado), como respiro entre as cenas.
4. **Patrocinadores** em rodízio, com tempo de tela por cota (é entrega
   contratual, dá pra medir e mostrar no relatório).
5. **QR codes gigantes:** avaliar o evento (`?avaliar=1`), gerar cartão
   "Eu vou!" (`?cartao=1`), check-in da sala, Instagram/hashtag.
6. **Números ao vivo:** inscritos, pessoas presentes, avaliações recebidas,
   nota média do evento (só agregados, sem dado pessoal; vem do job do Sympla
   e do Firestore).
7. **Palestrante em destaque** (foto, cargo, tema, próximo horário).
8. **Dicas práticas:** Wi-Fi, food truck, estacionamento, mapa do local,
   onde é o credenciamento, código de conduta em 1 frase.
9. **Avisos da organização** (sorteio, mudança de sala, atraso): editável sem
   deploy, precisa de uma fonte (documento no Firestore escrito pela
   organização ou arquivo no repo).
10. **Enquete/pergunta ao vivo** e
    **passaporte com carimbos** (já estão neste backlog).
11. **Contagem regressiva** antes de abrir e **"obrigado"** com os números finais
    do evento no encerramento.

**Perguntas em aberto (responder antes de desenhar):** tamanho e resolução do
painel de LED (proporção, pode ser bem larga, tipo 3:1); o que ele aceita como
entrada (notebook via HDMI? navegador?); origem das fotos ao vivo (Drive
compartilhado, upload manual no repo, outro); quem opera no dia; se o áudio é
usado (fênix com som?).

---

## Engajamento e gamificação

### Coding Jam no DevFest (sessão 11, 2026-10-06): FEITO no código (card, modal e concurso)
Sessão prática de construção com mini competição (pódio 1º, 2º, 3º) dentro da grade, com cadastro do projeto e votação. Feito: card e modal de destaque, concurso da sessão (cadastro do projeto, um voto
por check-in, pódio publicado pelo moderador, no modal, nos cards e no quadro da sala). Desenho e decisões em `PROJECT_CONTEXT.md`, seção "Destaque de sessão". Cancelado: página `codejam.html` com envio de
projetos (o envio é no Google). Adiado: Jam de 2 slots da mesma trilha. Depende do Renato: regras do Firestore, horário/sala/prêmios, acesso no codingjam.dev.

### Quiz "Monte sua trilha"
Perguntas rápidas (ex.: "prefere código ou apresentação?", "júnior ou
sênior?") que no fim sugerem quais palestras favoritar — preenche a Minha
agenda automaticamente via `favoritesRepository.addAll()` (já existe,
reusado do fluxo de agenda compartilhada).

### Certificado de participação do evento (profissional) — TASK ANOTADA, não iniciada
**Decisão do Renato (2026-10-06): é enviado DEPOIS do evento, e todo mundo que participou recebe.**
Pedido do Renato (2026-09-23): emitir certificado de participação do DevFest Campinas 2026.
**Não fazer agora**, só registrado. Reusa peças que já existem (cartão "Eu vou!" em
canvas, check-ins por palestra, gate por inscrição do Sympla, feedback com nome).

**Decisões pra tomar antes de desenhar (com a organização):**
1. **Quem tem direito?** (a) presença na porta, pelo check-in do Sympla (o job passaria a
   marcar `attended` em `registrations`, sem guardar nome), (b) check-ins nas palestras
   (mínimo de N palestras), ou (c) as duas. Gancho possível: liberar o certificado só depois
   de enviar a avaliação do evento (aumenta a taxa de resposta).
2. **Carga horária:** somar a duração das palestras com check-in (`durationLabel`, 40 min cada)
   ou usar uma carga fixa do evento (ex.: 8 h). Precisa da regra oficial.
3. **Nome no certificado:** o digitado no feedback (`myNameRepository`, não verificado) ou
   o do Sympla (verificado, exige e-mail). Sempre editável antes de gerar.
4. **Validação:** código único no certificado + página `?validar=<código>`. Sem servidor, um
   código só é confiável se for gravado no Firestore (coleção nova, regra própria) ou
   assinado pelo job do Sympla (que já tem segredo). Decidir se validação é necessária.
5. **Texto, assinaturas e logos:** texto aprovado pela organização, quem assina, e os logos
   novos (chegaram, ver handoff item 1; ainda sem SVG).

**Requisito do Renato: certificado PROFISSIONAL** (nível de documento oficial, não um cartão de
rede social). O que isso pede:
- **Formato de documento:** A4 paisagem, PDF em alta resolução e texto vetorial (não uma imagem
  achatada), pronto pra imprimir e pra anexar em currículo/LinkedIn. Por isso a página com CSS de
  impressão (`certificado.html`) tende a ser melhor que canvas; PNG fica como extra pra postar.
- **Identidade visual completa:** logo oficial do GDG Campinas (precisa do SVG, ver handoff item 1),
  fonte Google Sans do site, paleta da marca, moldura e hierarquia tipográfica cuidadas.
  Passar por design antes de codar (mockup aprovado pelo Renato, como foi com as plenárias).
- **Conteúdo completo:** nome, nome do evento, data, cidade e local, carga horária, texto formal,
  assinaturas (imagens) dos responsáveis, e patrocinadores/realização quando aplicável.
- **Autenticidade:** código único no certificado e QR pra uma página de validação, pra o
  certificado poder ser conferido por terceiros (ver decisão 4). Sem isso não passa por "profissional".
- **Sem falha no dia:** testar impressão e PDF nos navegadores comuns (Chrome, Safari, celular) e
  com nomes longos e acentuados.

**Forma sugerida:** um único template data-driven (`data/certificate.js` via repository:
textos, assinaturas, logos, regra de horas), desenhado em `<canvas>` client-side pra baixar
PNG, e/ou página `certificado.html` com CSS de impressão pra salvar em PDF (sem biblioteca
nova). Entrada: botão em "Minhas palestras" depois do evento e link `?certificado=1` pro
e-mail final do Sympla. Zero dado pessoal novo guardado se o nome for só digitado.

### Perguntas ao vivo / enquetes
Durante a palestra, plateia manda pergunta ou vota em enquete pelo celular,
palestrante vê em tempo real. Precisaria de mais uma coleção no Firestore
(mesmo projeto já criado, `DevFest-Campinas`) e uma tela de "moderador" —
escopo parecido com o check-in ao vivo (`checkin-display.html`), mas com
escrita em tempo real (Firestore já suporta listener `onSnapshot`, não
usado ainda no projeto).

### Mural com fotos das pessoas (foto ao vivo) — FASE 2 DO MURAL, a lapidar (decisões parciais de 2026-10-07)
Pedido do Renato: a plateia tira fotos e elas aparecem no telão, sem ninguém operar. **Decidido:** SEM aprovação antes de aparecer; qualquer moderador tira do ar com um toque ("Tirar do ar") e
pode apagar; SEM limite rígido de fotos por pessoa (só uma pausa curta entre envios, ~10 s, pra segurar robô, e um TETO DE EXIBIÇÃO no telão: no máximo uma "foto nova" de destaque a cada ~15 s,
as outras entram direto no rodízio); nome OPCIONAL; depois do evento, baixar as fotos em zip e subir num álbum do Google Fotos; o módulo precisa ser DESLIGÁVEL por dado (cena com `enabled`, fonte
de fotos trocável por repository, envio e moderação em arquivos próprios, e um campo de controle pra pausar envios e esconder fotos sem deploy).
**Caminho técnico EM ABERTO (decidir com um teste):** (1) **nosso site**: página `foto.html`, a foto é reduzida no celular (~1600 px, JPEG, ~200 a 300 KB) e guardada como texto num documento do
Firestore (cabe em 1 MB, não precisa do plano pago), coleção `mural-photos` (nasce visível; moderador tira do ar), o mural escuta e mostra na hora; ~300 fotos custam ~90 MB e ~300 gravações (folga
no plano grátis). OU (2) **álbum colaborativo do Google Fotos lido por um intermediário** (um Worker do Cloudflare gratuito lê a página pública do álbum e devolve a lista de fotos, que
`lh3.googleusercontent.com` deixa usar em `<img>`): a plateia usa o Fotos que já conhece e o álbum já fica pronto depois, MAS é leitura não oficial (o Google pode mudar a página e quebrar, e fica
fora das regras do serviço), com ~20 a 30 s de atraso, e o Worker é infra nova. **Próximo passo:** o Renato cria um álbum colaborativo de TESTE e manda o link; o Claude testa o iframe e a leitura da
lista de fotos. Descartado: pasta pública do Drive (plateia precisa de conta e o upload no celular é pior).

**RESULTADO DO TESTE do álbum (2026-10-08, álbum de teste = o da edição 2025, "DevFest Campinas 2025", o Renato mandou o link no chat; não gravar o link aqui, o repositório é público e a chave do link dá acesso):**
- **Iframe NÃO funciona** (confirmado de novo: `x-frame-options: SAMEORIGIN` na página do álbum, e o link curto `photos.app.goo.gl` redireciona pra `photos.google.com/share/<id>?key=<chave>`).
- **Ler a lista de fotos FUNCIONA:** um `GET` comum na página de compartilhamento (com User-Agent de navegador, sem login) devolve ~1,3 MB de HTML com os dados do álbum embutidos: título, e uma entrada por item
  `["<id AF1Qip...>",["https://lh3.googleusercontent.com/pw/<token>",largura,altura,...]]` mais o horário da foto em ms. Foram **300 itens únicos**, de 1080 a 4032 px (242 paisagem, 58 retrato), sem token de próxima página visível
  (conferir no app do Google Fotos se o álbum tem mesmo 300; se tiver mais, a leitura paginada é outra chamada interna e mais frágil).
- **As imagens carregam em `<img>` de outro site:** `lh3.googleusercontent.com/pw/<token>=w1920-h1080` responde 200 com `cross-origin-resource-policy: cross-origin` (testado de `https://gdgcampinas.github.io` num navegador de verdade;
  de `http://localhost:8080` o Google devolve 429, então teste no site publicado, não no local). Tamanho sob demanda pelo sufixo (`=w800-h600` ~120 KB, `=w1920-h1080` ~240 KB a 1,6 MB conforme a foto).
- **A página NÃO pode ser lida pelo navegador do mural** (sem CORS): precisa de um intermediário. Caminhos: (A) job do GitHub Actions que lê a página e grava a lista no Firestore (sem infra nova, mas o cron do GitHub atrasa horas: serve pro álbum de 2025, que não muda);
  (B) Cloudflare Worker gratuito com cache de 30 a 60 s (quase ao vivo, infra nova de ~30 linhas). Leitura NÃO oficial: se o Google mudar a página o intermediário quebra, então o mural guarda a última lista boa e segue com ela.
- **Bônus:** esse álbum resolve o pedido das "fotos em alta de edições antigas" (hoje são 16 de 900 px): 300 fotos de até 4032 px pra cena de fotos.
- **Moderação:** foto escondida vira uma lista de ids ocultos (Firestore) que o mural aplica por cima da lista do álbum.

### Passaporte DevFest com QR nos estandes
Quem visita cada estande dos patrocinadores escaneia um QR, junta
"carimbos", troca por brinde no fim. Mesmo mecanismo técnico do check-in de
palestra (QR + Firestore + uid anônimo), só que por estande em vez de por
palestra — reusaria a mesma `createFirestoreRepository()` genérica.

---

## Conteúdo e utilidade no dia

### Depoimento público x privado (decisão pendente, adiada de propósito)
O campo "o que mais gostou" do feedback de palestra — vira depoimento
público no site (tipo os depoimentos atuais, mock) ou fica só visível no
painel/Firestore pra organização? Renato pediu pra decidir depois de o
básico estar rodando.

### Mapa do local com as salas
Planta baixa simples do venue com a localização de cada sala/trilha.
Depende do local real ser confirmado (`EVENT.venue`, `venueConfirmed`
ainda `false`).

### Check-in de porta: Sympla x pelo nosso site (analisado 2026-10-01, decisão: NÃO fazer agora)
A API do Sympla v1.6.0 TEM endpoints de escrita de check-in (Check-in: `POST .../participants/ticketNumber/{ticketNumber}/check-in`,
`POST .../participants/{participantId}/check-in` e `POST .../qrcode/check-in`), então a nossa nota antiga de que a API
"é só de leitura" estava errada pro check-in (inscrição/venda continua só no Sympla). Pergunta do Renato: vale
fazer a entrada pelo nosso site em vez do app do Sympla?
- **Contra (por que não agora):** o token do Sympla é segredo, então o navegador não pode chamar esses endpoints;
  precisaria de um backend (Cloud Function exigiria Blaze, que decidimos não usar; alternativa grátis seria um
  Worker/Netlify function, infra nova pra manter). Uma fila de ~1.000 pessoas na porta não pode depender de
  sinal de celular/site novo sem fallback; o Sympla já tem leitor de QR do ingresso pronto e testado; vira
  mais um ponto de falha no dia mais crítico; dobraria o cuidado com LGPD (QR de pessoa identificável).
- **A favor:** a presença na porta alimentaria o sorteio e a avaliação (só quem entrou no evento), e daria
  números em tempo real pro painel.
- **Caminho barato que já cobre o ganho:** porta = app do Sympla; o job 🎫 Sincronizar Sympla JÁ lê o status de
  check-in de cada participante (`checkedIn` em `reconcile.js`/`sympla-repository.js`, hoje só conta no resumo).
  Se um dia quisermos "só quem passou na porta", gravar esse status (por hash de e-mail, como `registrations`)
  e usar como critério extra do sorteio/avaliação, sem nenhuma escrita no Sympla.
- **Se mesmo assim quiser o nosso:** tela de recepção no navegador (leitor de QR por câmera, `BarcodeDetector`/lib)
  que chama um proxy com o token, com lista local em cache pra funcionar offline. Só reavaliar depois de fechar o
  essencial (line-up, sorteio, ensaio).

### Vagas dos patrocinadores
Seção listando vagas abertas de cada empresa patrocinadora — dado viria
dos próprios patrocinadores reais (ainda não existem, é tudo mock).

---

## Infraestrutura / não é "feature nova", é melhoria de base

### Analytics mais profundo (GA4)
Hoje só GoatCounter (sem cookie, decisão consciente). Se quiser funil mais
rico, métricas de audiência etc., GA4 é possível mas precisa de banner de
consentimento LGPD — task separada, não misturar com o GoatCounter atual.

### QR físico por sala pro check-in (upgrade do "honra")
Check-in hoje funciona por QR (`checkin-display.html?trilha=<id>`, já
pronto e testado) ou botão de honra. Falta só a logística física — qual
tela/tablet fica em cada sala no dia do evento.

### Internacionalização (PT/EN/ES/FR)
Escopo grande, documentado como pendência própria no handoff — seletor de
idioma, dicionário de textos (hoje hardcoded em `data/*.js` e HTML), decidir
se line-up real também traduz.

### Restringir a chave do Firebase por domínio (hardening opcional)
No Google Cloud Console → Credenciais, restringir a `apiKey` do Firebase
por referenciador HTTP (`gdgcampinas.github.io/*`) — reforço extra, não
essencial (a proteção real já é a regra do Firestore).

---

## Descartadas (decisão do Renato, 2026-10-06: não fazer, não propor de novo)

- **Nota média por palestra visível ao público: NUNCA.** A nota média existe só no relatório interno (📊 Relatório do evento), que só a organização vê. Não aparece em card, modal nem em nenhuma parte pública do site.
- **Credencial digital com QR:** a galera prefere o crachá físico.
- **Mentorias com agendamento.**
- **Mural da hashtag** (`#DevFestCampinas2026`).
- **Área administrativa com login** (CRUD de moderadores, palestrantes, palestras...), descartada em 2026-10-06. Motivo: o line-up chega pronto e só o Renato preenche; os moderadores são 6 pessoas fixas (1 por trilha + 2 reservas), então basta colocar os 6 e-mails em `isModerator()` (`firestore.rules`) e publicar as regras uma vez. Complexidade alta (grade slot x trilha com preview, foto só por URL, site passando a ler JSON, papéis, auditoria, LGPD). **Só reavaliar se mais gente passar a editar dados toda semana.** Alternativa barata nesse caso: planilha modelo + script em `DevFestIA/tools/` que lê o CSV, valida (slot duplicado, foto faltando, trilha inexistente) e gera o arquivo de dados.
- **Votação da comunidade pras salas** (os nomes das salas já estão decididos e no ar).
