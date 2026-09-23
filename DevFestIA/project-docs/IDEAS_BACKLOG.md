# Backlog de ideias — DevFest Campinas 2026

Nada aqui foi implementado. Aprovado em espírito pelo Renato ao longo das
sessões, nunca desenhado tecnicamente a fundo. Cole a seção que quiser
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

### Mural eletrônico (aba do site em tela cheia) — TASK ANOTADA, não iniciada
Pedido do Renato (2026-09-23): o evento vai ter um painel de LED; queremos uma
"aba" do site pra rodar nele, passando álbum do evento, o mascote e conteúdo
ao vivo. **Não fazer agora**, só registrado.

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
10. **Mural da hashtag** `#DevFestCampinas2026` (depende de fonte, ver
    "Mural da hashtag" abaixo), **enquete/pergunta ao vivo** e
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

### Quiz "Monte sua trilha"
Perguntas rápidas (ex.: "prefere código ou apresentação?", "júnior ou
sênior?") que no fim sugerem quais palestras favoritar — preenche a Minha
agenda automaticamente via `favoritesRepository.addAll()` (já existe,
reusado do fluxo de agenda compartilhada).

### Certificado de participação do evento (profissional) — TASK ANOTADA, não iniciada
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

### Passaporte DevFest com QR nos estandes
Quem visita cada estande dos patrocinadores escaneia um QR, junta
"carimbos", troca por brinde no fim. Mesmo mecanismo técnico do check-in de
palestra (QR + Firestore + uid anônimo), só que por estande em vez de por
palestra — reusaria a mesma `createFirestoreRepository()` genérica.

### Mural da hashtag
Feed ao vivo de posts com `#DevFestCampinas2026` (Twitter/Instagram)
mostrado num telão. Depende de decidir a fonte (API paga de rede social,
ou wall de terceiro tipo Walls.io/Flockler).

---

## Conteúdo e utilidade no dia

### Nota média por palestra visível (fase 5.4 do feedback, já planejada)
Depois que a avaliação por palestra estiver rodando de verdade no evento,
mostrar a nota média (estrelas) no card/modal da palestra. Precisa de
leitura agregada no Firestore — hoje a regra de segurança nega leitura
crua (`allow read: if false` nas 3 coleções), leitura agregada exigiria ou
uma Cloud Function que calcula e publica só o agregado, ou abrir uma
leitura pública limitada com regra própria. Decidir com cautela (ver
`DevFestIA/firebase/firestore.rules`).

### Depoimento público x privado (decisão pendente, adiada de propósito)
O campo "o que mais gostou" do feedback de palestra — vira depoimento
público no site (tipo os depoimentos atuais, mock) ou fica só visível no
painel/Firestore pra organização? Renato pediu pra decidir depois de o
básico estar rodando.

### Mapa do local com as salas
Planta baixa simples do venue com a localização de cada sala/trilha.
Depende do local real ser confirmado (`EVENT.venue`, `venueConfirmed`
ainda `false`).

### Credencial digital com QR
Substituto do crachá físico — QR único por pessoa, gerado no navegador,
pra check-in geral do evento (diferente do check-in por palestra que já
existe). Precisaria de um jeito de "identificar" a pessoa sem conta de
verdade (nome + Firestore, ou vincular ao mesmo uid anônimo do check-in de
palestra).

### Vagas dos patrocinadores
Seção listando vagas abertas de cada empresa patrocinadora — dado viria
dos próprios patrocinadores reais (ainda não existem, é tudo mock).

### Mentorias com agendamento
Na trilha Carreiras & Mentorias, agendamento de conversa 1:1 com
mentores. Precisaria de calendário/agenda de terceiro (Calendly-like) ou
construir do zero com Firestore — escopo grande, avaliar ferramenta pronta
antes de codar.

### Votação da comunidade pras salas
Deixar a comunidade sugerir/votar nos nomes das salas (hoje são lugares
históricos de Campinas, decisão já tomada, mas Renato mencionou isso como
ideia à parte, não pra reabrir a decisão atual).

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

