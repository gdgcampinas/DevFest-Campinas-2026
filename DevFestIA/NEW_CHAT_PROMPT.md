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

ESTADO EM 2026-09-30, fim da sessão 9 (longa — detalhes completos no handoff)
Site de 8 páginas (Principal, Grade, Palestrantes, Ingressos, Time, Patrocínio, Sorteio — atrás de
`devOnly`, só em DEV — Código de Conduta) mais quiz e ferramentas internas: quadro da sala
(`checkin-display.html?trilha=<id>`), moderação (`moderacao.html?trilha=<id>`) e `reset-teste.html`. No ar
(main = development, CI verde). Firebase (Firestore + Auth) no plano Spark guarda check-ins, avaliações,
perguntas, votos e (novo) cadastro/check-in/sorteios do Sorteio. Inglês pronto (`?lang=en`). Sessão 9
entregou: modal de mini-bio no Time (11/22 pessoas com texto), Código de conduta redesenhado (regras com
ícone, contato via `CONTACT`), e a aba Sorteio inteira (cadastro com check-in por QR + roleta do moderador
que gira de verdade, nomes nas fatias, modo por rodadas). Trava de horário das perguntas DESLIGADA de
propósito (teste em DEV): LIGAR antes do evento.

PRÓXIMO TRABALHO (ver "Pendências" no handoff pra lista completa)
Sorteio: falta o Renato publicar as regras novas do Firestore no console (`raffle-checkins`/`raffle-entries`/
`raffle-draws`, já coladas junto com as de sempre em `DevFestIA/firebase/firestore.rules`) — sem isso o
cadastro/roleta são recusados contra o banco real. Depois: decidir quando tira do `devOnly` e abre pro
público, gerar/imprimir o QR físico (o QR já é desenhado na própria tela, "Mostrar QR do sorteio"), decidir
som de verdade (hoje sintetizado) e como opera os prêmios no dia. Mini-bio: faltam os textos de 11 pessoas
(organizadores e voluntários) — perguntar ao Renato. Motor das perguntas ao vivo: feito e estável desde a
sessão 8, sem pendência técnica; página Sala ao vivo/tela Palco decidida mas pausada a pedido do Renato.

PENDÊNCIAS
Do Renato/organização: publicar as regras do Firestore do Sorteio (ver acima); dados de time em aberto
(cargo dos 4 organizadores, LinkedIn de Laydianne e Davi, 11 bios);
dados reais do evento (local, salas/MCs, line-up, patrocinadores, valores); plenárias (A, B ou C, recomendo
B); mensagens do Sympla com os links `.../ingressos.html?cartao=1` e `.../index.html?avaliar=1` + QR no
encerramento; quem monta os tablets/TVs das salas; patrocínio FIAP (nota fiscal na 1ª semana de dezembro).
Antes do evento: LIGAR a trava de horário das perguntas (regras + `enforceWindow`), rodar "🧹 Limpar dados
de teste" (simulação, depois APAGAR, só antes de 28/11 08:00) e `reset-teste.html` nos aparelhos de teste;
ensaio geral.
Quando houver inscrições: conferir o resumo do "🎫 Sincronizar Sympla", testar o gate com e-mail real e
ligar `registrationGate` (só no `schedule.js`).
Tasks anotadas: certificado profissional (decidir quem recebe e carga horária), mural do telão de LED
(mascote Gumbleton já consolidada, ainda estática), área administrativa com login (CRUD de
moderadores/palestrantes; caminho em `project-docs/IDEAS_BACKLOG.md`), internacionalização de ES/FR.

ARMADILHAS (leia "Como trabalhar e testar aqui" no handoff antes de agir)
O HTML no GitHub Pages fica 10 min em cache: confira com curl o que está publicado. `?v=N` tem que ser igual em todas
as páginas pra cada arquivo que o referencia. Regras do Firestore são coladas à mão no console
(`pbcopy < DevFestIA/firebase/firestore.rules`; o Firebase CLI não está logado). Nunca renomear o workflow Validar sem
antes o Promote ouvir o nome novo. Secrets nunca no chat. Sempre passar links COMPLETOS ao Renato. Um script externo
(tipo `qrcodejs`) fixo no `<head>` quebra a navegação dentro de `/DEV/` — carregar sob demanda, nunca fixo. Um teste
de moderação é conhecidamente instável no CI (timing, não é regressão): `gh run rerun <id> --failed` resolve. Testes
de ponta a ponta: `DevFestIA/tools/emulator/start.sh` + site com `?emulador=1`; regras:
`DevFestIA/tools/questions/run-rules-tests.sh` (porta 8085 livre).

DIRETIVA DE ENGAJAMENTO
Você é parceiro técnico do projeto, não executor passivo.
Analise com interesse genuíno. Proponha melhorias. Questione riscos.
```
