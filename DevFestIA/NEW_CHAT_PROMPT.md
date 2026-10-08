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

ESTADO EM 2026-10-07, fim da sessão 12 (detalhes no handoff, seções "Sessão 12" e "Sessão 11" no topo)
Site de 8 páginas (Principal, Grade, Palestrantes, Ingressos, Time — PÚBLICO em PROD, 23 pessoas reais, 17 bios —, Patrocínio, Sorteio — atrás de `devOnly`, só em DEV —, Código de Conduta);
em PROD, Grade, Palestrantes e Patrocínio abrem mas mostram "será revelado em breve" no lugar do conteúdo mock (line-up, patrocinadores, comunidades, valores), que só aparece em `/DEV/<página>` ou
`?lineup=1`. Há também o quiz e ferramentas internas, que NÃO têm versão `/DEV/` (use na raiz): quadro da sala (`checkin-display.html?trilha=<id>`), moderação (`moderacao.html?trilha=<id>`) e
`reset-teste.html`. No ar (main = development). Firebase (Firestore + Auth, plano Spark) guarda check-ins, avaliações, perguntas, votos, o Sorteio e o concurso do Coding Jam. Inglês pronto (`?lang=en`).
Sorteio fechado no código (modo telão, roda de 24, Ausente, Resetar = nova rodada, papel picado, fanfarra, QR que muda e 1 ingresso = 1 cadastro atrás de interruptores hoje DESLIGADOS). Trava de
horário das perguntas DESLIGADA de propósito (teste em DEV): LIGAR antes do evento.
**Sessão 11:** (1) o CODING JAM entrou na grade como card de destaque (`highlight: "codejam"`, mock na trilha IA às 10:30, "Mão na massa", "Recomendamos usar Antigravity, Antigravity IDE ou Gemini",
perguntas ao vivo desligadas, avaliação mantida) e tem CONCURSO feito: quem tem check-in cadastra o projeto, a turma vota (um voto por check-in), o moderador publica o pódio (modal, cards, quadro da sala com
papel picado). As regras do Firestore do concurso JÁ estão publicadas e conferidas contra o banco real; o lado do moderador (login Google) ainda não foi testado pelo Renato. (2) Ideias reorganizadas:
descartadas nota média pública, credencial digital, mentorias, mural da hashtag, área administrativa, votação das salas e a página `codejam.html` (o envio é no Google). (3) MURAL DO TELÃO DECIDIDO.
**Sessão 12:** o MURAL DO TELÃO, FASE 1, está FEITO e no ar (`mural.html`, interno, sem versão `/DEV/`: abra na raiz com `?lineup=1`). Motor autônomo com vigia, cena isolada, rede por sonda, escutas que reabrem e
cena de reserva, 14 cenas por dado (agora e próximas, fotos, patrocinadores, QR, inscritos, dicas, fênix estática, pódio do Coding Jam ao vivo, contagem, obrigado), palco que serve a qualquer proporção
(testado em 16:9, 3:1, 4:3 e vertical) e animações por dado (troca em sequência, zoom lento nas fotos, cartões em fila, pódio 3º, 2º, 1º, número que sobe; ignora "Reduzir movimento"). Testes: `tools/mural/*.test.js` (56, puros, fora do CI), `tools/dom/mural-*.dom.test.js` (50, no CI, com relógio falso e 8 h de resistência). Detalhes e parâmetros
(`?tela=`, `?proporcao=`, `?cenas=`, `?diag=1`, `?demo=`, `?ensaio=0`) no PROJECT_CONTEXT, "Mural do telão de LED", subseção "Implementação da Fase 1".

PRÓXIMO TRABALHO (ver "Sessão 12" no handoff e "Mural do telão de LED" no PROJECT_CONTEXT)
1) **Mural, o que depende do Renato:** (a) abrir `mural.html` (links no handoff) e dizer o que ajustar no visual e no tempo de cada cena; (b) mandar logos em alta e cotas reais dos patrocinadores, originais em alta das fotos de
2025 (hoje 900 px, vão pixelar no LED), texto de Wi-Fi, estacionamento e comida (as dicas estão `enabled: false`), a proporção/resolução do telão quando souber, e se o sorteio usa o mesmo telão; (c) o ENSAIO de 1 h ou mais no
computador e no telão de verdade, desligando o Wi-Fi no meio (checklist no PROJECT_CONTEXT); (d) dar OK pra incluir `tools/mural/`, `tools/raffle/`, `tools/contest/` e `tools/room/` no `validate.yml`.
2) **Fase 2 do mural (lapidar com o Renato):** foto ao vivo (SEM aprovação antes, qualquer moderador tira do ar, sem limite rígido por pessoa, nome opcional, exportar zip pro Google Fotos, módulo
desligável; caminho em aberto: nosso site ou álbum do Google Fotos lido por intermediário, decidir com um álbum de TESTE que o Renato vai mandar), aviso e controle remoto pelo celular. O motor já tem o contrato
de fonte ao vivo (`open(onData, onError)`) e a cena é só um tipo novo no registro de `pages/mural.js`. O iframe do álbum do Google Fotos NÃO funciona. Fase 3: fênix animada (arquivo do Renato).
3) Pendências do Renato do Coding Jam: horário/sala/prêmios reais (hoje mock), confirmar que conta como workshop obrigatório do e-mail dos organizadores, acesso de organizador no codingjam.dev (mensagem pra
Christina Lin no LinkedIn rascunhada), testar o lado do moderador, passar os 6 e-mails dos moderadores (1 por trilha + 2 reservas) e confirmar `gdgcampinascontato@gmail.com`.
4) Sorteio: o Renato testar o lado do moderador; decisões abertas (horários de abrir/fechar o cadastro, prêmios, quando tirar o `devOnly`). Corrigir o texto "aguarde até 10 minutos" do cadastro por ingresso
(pequeno, o Claude faz). Incluir `tools/raffle/`, `tools/contest/` e `tools/room/` no `validate.yml`: SÓ com o OK explícito do Renato (mexe no CI).
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
O HTML no GitHub Pages fica 10 min em cache: confira com curl o que está publicado. `?v=N` tem que ser igual em todas as páginas pra cada
arquivo que o referencia. Regras do Firestore são coladas à mão no console (`pbcopy < DevFestIA/firebase/firestore.rules`; o Firebase CLI
não está logado). Nunca renomear o workflow Validar sem antes o Promote ouvir o nome novo. Secrets nunca no chat. Sempre passar links
COMPLETOS ao Renato. Script externo fixo no `<head>` quebra a navegação dentro de `/DEV/`. Um teste de moderação é instável no CI (timing):
`gh run rerun <id> --failed`. NUNCA encadear `grep ... && git commit` sem checar o resultado dos testes (use `if ...; then commit; else ...`).
`requestAnimationFrame` não dispara em aba oculta: nada crítico pode depender dele. As telas internas (moderação, quadro da sala, `reset-teste`, futuro `mural.html`) NÃO têm
versão `/DEV/`: links na raiz. Testes de tela: `node --test DevFestIA/tools/dom/*.test.js` (em teste de tela use `waitFor` do `tools/lib/dom-harness.js` em vez de dormir; sleeps curtos falham
em máquina carregada); puros: `node --test DevFestIA/tools/raffle/*.test.js DevFestIA/tools/contest/*.test.js DevFestIA/tools/room/*.test.js DevFestIA/tools/questions/questions.test.js`; regras (Java 21 instalado):
`bash DevFestIA/tools/questions/run-rules-tests.sh` (porta 8085 livre).

DIRETIVA DE ENGAJAMENTO
Você é parceiro técnico do projeto, não executor passivo.
Analise com interesse genuíno. Proponha melhorias. Questione riscos.
```
