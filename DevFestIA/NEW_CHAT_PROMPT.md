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

ESTADO EM 2026-09-25, fim da sessão 7 (detalhes completos no handoff)
Site de 7 páginas mais quiz, no ar (main = development, CI verde), e ferramentas internas: quadro da sala
(`checkin-display.html?trilha=<id>`), moderação (`moderacao.html?trilha=<id>`) e `reset-teste.html`. Firebase
(Firestore + Auth) no plano Spark guarda check-ins, avaliações, perguntas e votos; job do GitHub Actions lê o Sympla.
Inglês pronto (`?lang=en`). Sessão 7 entregou: chave do Firebase por domínio (Renato), quiz, EN, perguntas ao vivo v2
(pergunta pendente -> moderador aprova/rejeita/respondida -> votos), moderação, quadro da sala, modo ensaio
(`?ensaio=agora`), palestra fixada (`?palestra=0900.ia`), emulador local + 21 testes das regras, logins de plateia e
moderador separados. Trava de horário das perguntas DESLIGADA de propósito (teste em DEV): LIGAR antes do evento.

PRÓXIMO TRABALHO (decidido, teste primeiro em cada etapa; ver "PRÓXIMO TRABALHO" no handoff)
Motor: pergunta -> moderador autoriza/nega/devolve (volta pra fila) -> votos -> a "na vez" (novo estado `current`).
Plano B sem TV: página Sala ao vivo no celular (`sala.html`, QR fixo por sala) + tela Palco do moderador. ANTES: redesenho
da leitura do Firestore (o poll atual estoura as 50 mil leituras/dia do Spark; uma TV sozinha passa de 50 mil numa
palestra) e a decisão do Blaze como seguro. Aberto: o Renato não conseguia moderar (login Google da moderação, agora com
sessão própria e erro visível); pedir o que aparece na tela.

PENDÊNCIAS
Do Renato/organização: dados reais (local, salas/MCs, line-up, patrocinadores, time, valores); plenárias (A, B ou C,
recomendo B); mensagens do Sympla com os links `.../ingressos.html?cartao=1` e `.../index.html?avaliar=1` + QR no
encerramento; quem monta os tablets/TVs das salas (ou o plano B com QR impresso); decidir o Blaze.
Antes do evento: LIGAR a trava de horário das perguntas (regras + `enforceWindow`), rodar "🧹 Limpar dados de teste"
(simulação, depois APAGAR, só antes de 28/11 08:00) e `reset-teste.html` nos aparelhos de teste; ensaio geral.
Quando houver inscrições: conferir o resumo do "🎫 Sincronizar Sympla", testar o gate com e-mail real e ligar
`registrationGate` (só no `schedule.js`).
Tasks anotadas: certificado profissional (decidir quem recebe e carga horária), mural do telão de LED, área
administrativa com login (CRUD de moderadores/palestrantes; caminho em `project-docs/IDEAS_BACKLOG.md`),
internacionalização de ES/FR e do corpo das outras páginas.

ARMADILHAS (leia "Como trabalhar e testar aqui" e "Armadilhas desta sessão" no handoff antes de agir)
O HTML no GitHub Pages fica 10 min em cache: confira com curl o que está publicado. `?v=N` tem que ser igual em todas
as páginas pra cada arquivo. Regras do Firestore são coladas à mão no console (`pbcopy < DevFestIA/firebase/firestore.rules`;
o Firebase CLI não está logado). Nunca renomear o workflow Validar sem antes o Promote ouvir o nome novo. Secrets nunca
no chat. Sempre passar links COMPLETOS ao Renato. Testes de ponta a ponta: `DevFestIA/tools/emulator/start.sh` + site com
`?emulador=1`; regras: `DevFestIA/tools/questions/run-rules-tests.sh` (porta 8085 livre).

DIRETIVA DE ENGAJAMENTO
Você é parceiro técnico do projeto, não executor passivo.
Analise com interesse genuíno. Proponha melhorias. Questione riscos.
```
