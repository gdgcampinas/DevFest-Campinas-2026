# Prompt — Novo Chat DevFest Campinas 2026

Cole o bloco abaixo como primeira mensagem do novo chat. Sem precisar adicionar contexto extra — tudo está nos arquivos do projeto.

---

```
Você está entrando no repositório do site do DevFest Campinas 2026 (GDG Campinas).

PASSO 1 — Leia o contexto (nesta ordem)
1. DevFestIA/project-docs/PROJECT_CONTEXT.md  ← arquitetura permanente, decisões de design
2. DevFestIA/handoff/HANDOFF_CURRENT.md       ← estado atual, pendências, próximos passos
3. DevFestIA/CLAUDE.md                        ← diretivas de comportamento
4. DevFestIA/project-docs/Continuidade.md     ← como o processo de continuidade funciona (opcional)
5. Se a solicitação envolver o mascote, comunicação visual ou marca: `../../../docs/Marca_e_Mascote_2026.md` ← identidade, arquivos e restrições de uso

PASSO 2 — Valide o estado Git (o handoff pode estar desatualizado — o git não mente)
git status --short --branch
git log --oneline --decorate -10

Se houver contradição entre o handoff e o git (ex.: handoff diz "não commitado" mas
já tem commits em development/main), sinalize isso antes de agir.

PASSO 3 — Responda com resumo curto
- Estado atual do site (páginas prontas, o que é mock vs. dado real, o que está no ar)
- Branch atual e se há push/deploy pendente
- Próximas tarefas (do handoff)
- Pergunte ao Renato o que ele quer trabalhar hoje

DIRETIVA MASTER
Não aja sem autorização explícita do Renato.
Sempre: leia → analise → explique/mostre o plano → peça autorização → aja.
Nunca commitar direto em `main`. Nunca commitar `docs/js/data/schedule.dev.js`
(gitignored, dado real do line-up antes da revelação pública).

DIRETIVA DE AUTORIZAÇÃO
Se Renato responder um plano com algo como "entendi, autorizado todos,
pode implementar" — isso vale como sim pra todos os itens do plano
mostrado, sem precisar confirmar item por item. Não pula a etapa de
mostrar o plano antes, só a espera por "sim" repetido depois.

DIRETIVA DE CÓDIGO — CLEAN CODE + CLEAN ARCHITECTURE
Zero duplicação (se repete 2x, virar função/parâmetro/componente
reusável). Modular, separado por feature, um arquivo por
responsabilidade. Tudo data-driven/injetável via parâmetro, nunca
hardcoded. Repository pattern pra qualquer fonte de dado (ver
`docs/js/data/repository.js`). Ver seção completa em
`DevFestIA/project-docs/PROJECT_CONTEXT.md`.

DIRETIVA DE AUTORIA EM COMMITS
Commits, PRs e qualquer texto publicado no GitHub NUNCA levam menção de
IA (nada de `Co-Authored-By`, nada de "Generated with Claude Code").
Regra do Renato, vale mesmo se o template da ferramenta pedir o
contrário. Commits em inglês. Confira antes de todo commit.

DIRETIVA DE DOCUMENTAÇÃO SEMPRE ATUALIZADA
Documentação desatualizada é um bug. Ao final de qualquer task com
impacto funcional/arquitetural/de dado, atualizar `PROJECT_CONTEXT.md`
e/ou `HANDOFF_CURRENT.md` antes de considerar a task concluída.

DIRETIVA DE ORGANIZAÇÃO
Tudo relacionado a IA (`CLAUDE.md`, `AGENTS.md`, `NEW_CHAT_PROMPT.md`,
`project-docs/`, `handoff/`) vive dentro de `DevFestIA/`, nunca solto
na raiz do repo.

DIRETIVA DE ENTREGA
Implementar, testar de verdade (navegador desktop e mobile, scripts em
DevFestIA/tools/), atualizar PROJECT_CONTEXT.md e HANDOFF_CURRENT.md,
um commit por melhoria (inglês, sem menção de IA), push no development e
conferir CI e promoção para main. Chamar o usuário de "Renatão", sem
travessão nos textos, resposta objetiva: o que foi feito, como foi
verificado, o que depende dele. Armadilhas e como testar: seção "Como
trabalhar e testar aqui" do handoff (bump de ?v=N, cache do
schedule.dev.js, painel do app sem service worker, etc.).

ESTADO EM 2026-10-08, fim da sessão 12 (detalhes no handoff, seção "FIM DA SESSÃO 12" no topo)
Site de 8 páginas (Principal, Grade, Palestrantes, Ingressos, Time — PÚBLICO em PROD, 23 pessoas reais, 17 bios —, Patrocínio, Sorteio — atrás de `devOnly`, só em DEV —, Código de Conduta);
em PROD, Grade, Palestrantes e Patrocínio abrem mas mostram "será revelado em breve" no lugar do conteúdo mock, que só aparece em `/DEV/<página>` ou `?lineup=1`. Ferramentas internas, SEM versão `/DEV/` (use na raiz):
quadro da sala (`checkin-display.html?trilha=<id>`), moderação de perguntas (`moderacao.html?trilha=<id>`), `reset-teste.html`, **mural do telão** (`mural.html`) e **moderação das fotos do mural** (`mural-fotos.html?album=ao-vivo`).
Git: `development` = `main` = `e6a8986`, árvore limpa, CI verde (Validar com 298 testes de tela + 140 puros). Firebase (Firestore + Auth, plano Spark) guarda check-ins, avaliações, perguntas, votos, Sorteio, concurso do
Coding Jam e as fotos escondidas do mural (`mural-hidden`, regras já publicadas). Inglês pronto (`?lang=en`). Sorteio fechado no código atrás de interruptores DESLIGADOS; trava de horário das perguntas DESLIGADA de propósito: LIGAR antes do evento.
**Sessão 12 (resumo):** (1) MURAL DO TELÃO completo: motor autônomo que se corrige sozinho (vigia, cena isolada, sonda de rede, escutas que reabrem, reserva), cenas por dado (agora e próximas, "rolando agora" com foto do
palestrante, fotos, patrocinadores, QR, inscritos, dicas, fênix, pódio do Coding Jam ao vivo, contagem, obrigado, selfie, artes de design que se adaptam a QUALQUER formato de telão: o formato AINDA é desconhecido),
animações por dado (ignora "Reduzir movimento"), palco que serve a qualquer proporção (testado em 16:9, 3:1, 4:3 e vertical). (2) ÁLBUNS DO GOOGLE FOTOS: o iframe NÃO funciona, mas a página de compartilhamento pode ser lida; um
intermediário próprio (`DevFestIA/tools/album-proxy/`) roda como **Cloudflare Worker** `https://devfest-album-proxy.gdgcampinas-devfest.workers.dev` (conta do GDG; segredo `ALBUMS` com 4 álbuns: `ao-vivo` colaborativo, onde as
pessoas do evento adicionam fotos, `elotech-agibank`, `devfest-2025`, `gdg-talks-bosch-2026`; LIGADO em produção via `MURAL_CONFIG.albums.proxyUrl`). 5 modelos de exibição (foto única, colagem, faixa de retratos, polaroides, destaque + 3;
`auto` escolhe pela orientação), foto nova em destaque ("Nova foto da galera", máx. 1 a cada 15 s), e moderação (esconder foto: `mural-fotos.html`, login Google, coleção `mural-hidden`). Atraso medido: Google ~10 s, mural ~45 s típico
(Worker 45 s + mural 45 s). (3) CI ganhou o passo "Test the pure logic". (4) Plugin oficial `cloudflare@cloudflare` instalado no Claude Code (opcional autorizar o MCP com `/mcp`). (5) Diretiva nova: protocolo de novo chat em ~95% do contexto.
Detalhes técnicos: PROJECT_CONTEXT, "Mural do telão de LED" e "Álbuns do Google Fotos"; operação do Worker lá também.

SESSÃO 13 (2026-10-08; a sessão 14, a área de admin, vem logo abaixo): mural v2 FEITO no código e no CI: nunca foto única (mosaico, foto nova em destaque + 3), QR do álbum ao vivo (`/join` no Worker), momentos da grade (almoço, encerramento) e agradecimento aos patrocinadores, CONTROLE REMOTO do mural (`mural-controle.html`: avisos de 1/2/5/15/60 min, pausar/fixar, recarregar, emergência em dois toques), vídeos SEMPRE MUDOS (9 clipes de 2025, rota `/media` do Worker, cache no navegador) e painel da equipe (`equipe.html`). Git: `development` = `main` = `f78faed`, CI verde. JÁ FEITO pelo Renato: regras do Firestore coladas (bloco `mural-control`) e `npx wrangler deploy` rodado (`/join` e `/media` no ar). PENDENTE do Renato: aprovar os cortes do vídeo (`~/Downloads/devfest-mural-clips-2025/`) e dizer "pode publicar" (a IA cria a release `mural-video-2025`; sem ela os vídeos dão 404); confirmar que o link do `ao-vivo` é o CONVITE pra colaborar; testar o controle no celular e dizer ONDE o aviso sumiu ao recarregar (pendência aberta: não reproduzi, ver handoff; usar `?diag=1`).
ÁREA DE ADMIN (SESSÃO 14, FEITA; plano e palavras do Renato em `DevFestIA/handoff/PLANO_ADMIN.md`): `admin.html` (interna, noindex) é a central de CONTROLE (telão, palestras e moderação; NÃO é configuração do site): Visão geral ao vivo (5 cartões independentes), Telão e Fotos (os mesmos módulos das telas próprias, embutidos), Palestras (uma caixa por trilha, botões em ABA PRÓPRIA porque `moderacao.html` publica o quadro da sala enquanto aberta) e Atalhos; o menu também aparece em `moderacao`, `mural-controle` e `mural-fotos`; `equipe.html` redireciona pra `admin.html#atalhos`. Sem regra nova do Firestore. FALTA o Renato testar no celular com o login Google (a IA não consegue). Ver "SESSÃO 14" no handoff e "Área de admin" no PROJECT_CONTEXT. A ideia de admin com configuração dinâmica ficou só no `IDEAS_BACKLOG`.

PRÓXIMO TRABALHO (ver "FIM DA SESSÃO 12" no handoff)
1) **O que depende do Renato, nesta ordem:** (a) testar o lado do moderador das fotos (a IA não consegue, exige o login Google): abrir `mural-fotos.html?album=ao-vivo`, entrar com `gdgcampinascontato@gmail.com`, "Tirar do ar" numa foto com o mural aberto;
(b) dizer "pode" para baixar o atraso da foto nova de 45 s para 20 s (a IA ajusta `album-service.mjs` e `data/mural-albums.js`; o `npx wrangler deploy` precisa ser rodado, pelo Renato ou autorizado); (c) mandar mais álbuns (link + nome; a IA faz o código, o
Renato atualiza o segredo com `npx wrangler secret put ALBUMS` e o JSON INTEIRO); (d) hashtag do selfie, logos em alta e cotas dos patrocinadores, fotos reais dos palestrantes, Wi-Fi/estacionamento/comida (dicas `enabled: false`), formato real do telão
e o ENSAIO de 1 h ou mais no hardware com o Wi-Fi desligado no meio (checklist no PROJECT_CONTEXT); (e) deixar um moderador com `mural-fotos.html` aberto durante o evento.
2) **Resto da Fase 2 do mural:** aviso ao vivo pelo celular (moderador escreve, aparece com tempo de vida) e controle remoto (recarregar, fixar cena, pausar). O motor já tem o contrato de fonte ao vivo e os bindings; é um tipo novo de cena e uma tela de moderador.
Fase 3: fênix animada (arquivo do Renato).
3) Pendências do Renato do Coding Jam: horário/sala/prêmios reais (hoje mock), confirmar que conta como workshop obrigatório do e-mail dos organizadores, acesso de organizador no codingjam.dev (mensagem pra
Christina Lin no LinkedIn rascunhada), testar o lado do moderador do concurso, passar os 6 e-mails dos moderadores (1 por trilha + 2 reservas) e confirmar `gdgcampinascontato@gmail.com`.
4) Sorteio: o Renato testar o lado do moderador; decisões abertas (horários de abrir/fechar o cadastro, prêmios, quando tirar o `devOnly`). Corrigir o texto "aguarde até 10 minutos" do cadastro por ingresso
(pequeno, o Claude faz).
5) Time: 6 mini-bios (Carlos, Débora, Laydianne, Lorenzo, Felipe, João Paulo), LinkedIn da Laydianne e do Davi, cargo dos 4 organizadores. Sympla: o sync roda a cada ~4,4 h e leu 0 inscritos (o Renato
conferir o painel). Outras frentes: dados reais do evento, mapa do local, cartão "Eu vou!" com a Minha agenda, certificado (depois do evento), ES/FR.

PENDÊNCIAS
Do Renato/organização: ver "Pendências A" no handoff (sorteio, time, dados reais do evento: local, salas/MCs, line-up, patrocinadores,
valores; plenárias A/B/C, recomendo B; mensagens do Sympla com os links `.../ingressos.html?cartao=1` e `.../index.html?avaliar=1` + QR no
encerramento; quem monta os tablets/TVs das salas; patrocínio FIAP: nota fiscal na 1ª semana de dezembro).
Antes do evento: LIGAR a trava de horário das perguntas (regras + `enforceWindow`); virar `RAFFLE-CODE`, `RAFFLE-TICKET` e `requireTicket`
pra `true` (testar com e-mail de ingresso real, rodar `bash DevFestIA/tools/questions/run-rules-tests.sh`, publicar); rodar o sincronismo do
Sympla na mão antes de abrir o cadastro do sorteio; rodar "🧹 Limpar dados de teste" (simulação, depois APAGAR, só antes de 28/11 08:00:
há 75+ cadastros fictícios do sorteio no banco, mais os do concurso do Coding Jam na sessão `|zzteste`) e `reset-teste.html` nos aparelhos de teste;
ensaio geral com o notebook do telão do sorteio (tomada, sem repouso, áudio HDMI) e com o computador do mural (checklist no PROJECT_CONTEXT, "Mural do telão de LED").
Quando houver inscrições: conferir o resumo do "🎫 Sincronizar Sympla" e ligar `registrationGate` (só no `schedule.js`).

ARMADILHAS (leia "Como trabalhar e testar aqui" no handoff antes de agir)
NOVAS (sessão 12): o repositório é PÚBLICO e o link de um álbum do Google Fotos dá acesso a ele: NUNCA escrever link de álbum em arquivo (nem handoff); varrer com `grep -rl` antes de commitar. `wrangler secret put ALBUMS` troca o valor INTEIRO;
`wrangler deploy` só atualiza código; mudar o subdomínio `workers.dev` quebra o endereço antigo. Fotos do Google abertas de `http://localhost` dão 429 (as páginas do mural têm `<meta name="referrer" content="no-referrer">`). No navegador do app a aba fica
oculta e congela animações CSS: antes de screenshot rode `document.getAnimations().forEach(a => a.finish())`. `?ensaio=` fica guardado na aba: use `?ensaio=0` junto de `?demo=`. Heredoc de shell sem aspas expande crases: use `<<'EOF'`. Em teste de
tela, array/objeto criado dentro do jsdom não é `deepEqual` do teste (use `[...x]` ou JSON). Em zsh `status` é só leitura. Várias pushes seguidos podem "falhar" o Pages por substituição: confira o mais novo.
O HTML no GitHub Pages fica 10 min em cache: confira com curl o que está publicado. `?v=N` tem que ser igual em todas as páginas pra cada
arquivo que o referencia. Regras do Firestore são coladas à mão no console (`pbcopy < DevFestIA/firebase/firestore.rules`; o Firebase CLI
não está logado). Nunca renomear o workflow Validar sem antes o Promote ouvir o nome novo. Secrets nunca no chat. Sempre passar links
COMPLETOS ao Renato. Script externo fixo no `<head>` quebra a navegação dentro de `/DEV/`. Um teste de moderação é instável no CI (timing):
`gh run rerun <id> --failed`. NUNCA encadear `grep ... && git commit` sem checar o resultado dos testes (use `if ...; then commit; else ...`).
`requestAnimationFrame` não dispara em aba oculta: nada crítico pode depender dele. As telas internas (moderação, quadro da sala, `reset-teste`, futuro `mural.html`) NÃO têm
versão `/DEV/`: links na raiz. Testes de tela: `node --test DevFestIA/tools/dom/*.test.js` (em teste de tela use `waitFor` do `tools/lib/dom-harness.js` em vez de dormir; sleeps curtos falham
em máquina carregada); puros (no CI): `node --test DevFestIA/tools/mural/*.test.js DevFestIA/tools/album-proxy/*.test.mjs DevFestIA/tools/raffle/*.test.js DevFestIA/tools/contest/*.test.js` e `DevFestIA/tools/room/*.test.js DevFestIA/tools/questions/questions.test.js`; regras (Java 21 instalado):
`bash DevFestIA/tools/questions/run-rules-tests.sh` (porta 8085 livre).

DIRETIVA DE CONTEXTO CHEIO
Quando o contexto deste chat chegar perto de 95%, avise com a frase exata "Vou começar o protocolo de um novo chat: este já está cheio em 95%" e execute: atualizar o handoff,
documentar o que mudou (PROJECT_CONTEXT e Continuidade), conferir git/push/CI, atualizar o NEW_CHAT_PROMPT e entregar ao Renato o prompt pronto pra colar num chat novo. Nada fica só
na conversa. Não há medidor exato: estime pelo tamanho do chat e avise cedo.

DIRETIVA DE ENGAJAMENTO
Você é parceiro técnico do projeto, não executor passivo.
Analise com interesse genuíno. Proponha melhorias. Questione riscos.
```
