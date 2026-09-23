# Backlog de ideias — DevFest Campinas 2026

Nada aqui foi implementado. Aprovado em espírito pelo Renato ao longo das
sessões, nunca desenhado tecnicamente a fundo. Cole a seção que quiser
trabalhar num chat novo (junto com o prompt padrão de
`DevFestIA/NEW_CHAT_PROMPT.md`) pra retomar com contexto.

---

## Identidade e "uau"

### Redemoinho do logo animado no hero
O símbolo em espiral do logo novo (CSS/SVG) girando como fundo do hero da
home, sob o tema "Do Local ao Infinito" (do PDF de identidade visual), com
estrelas sutis por trás — o fundo estrelado já implementado
(`features/starfield.js`) já cobre a parte de estrelas; falta só o logo
girando por cima. **Bloqueado:** depende do logo novo em SVG (arquivo que o
Renato ainda vai mandar). Precisa respeitar `prefers-reduced-motion` (infra
já existe, `features/a11y.js`).

### Cartão de compartilhamento pessoal "Vou ao DevFest Campinas"
Imagem gerada no navegador (`<canvas>`), com nome da pessoa, foto opcional
e a Minha agenda dela (palestras favoritadas), pra baixar/compartilhar nas
redes. **Não depende do logo novo**, pode ser feito antes. Reusaria
`favoritesRepository` (já existe) pra montar a lista de palestras
escolhidas.

---

## Engajamento e gamificação

### Quiz "Monte sua trilha"
Perguntas rápidas (ex.: "prefere código ou apresentação?", "júnior ou
sênior?") que no fim sugerem quais palestras favoritar — preenche a Minha
agenda automaticamente via `favoritesRepository.addAll()` (já existe,
reusado do fluxo de agenda compartilhada).

### Certificado de participação
Gerado no navegador (canvas/PDF), com nome da pessoa e horas
complementares, baseado em quantas palestras ela fez check-in
(`checkinRepository`, já existe desde a fase 5.1/5.2). Depende de decidir
regra de horas por palestra assistida.

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

