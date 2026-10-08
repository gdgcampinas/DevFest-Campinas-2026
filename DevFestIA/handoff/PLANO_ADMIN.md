# Plano da área de admin/moderação (apresentado em 2026-10-08, AINDA NÃO AUTORIZADO)

**Status:** só plano. NÃO implementar sem o "autorizado" do Renato. "Vamos para o plano" não é autorização.

## O que o Renato pediu (palavras dele, 2026-10-08)
"A ideia da área de admin era isso aqui. Ter a parte do controle do telão, mais as coisas de palestras, as partes de moderação. Não era para fazer tudo dinâmico. Era mais uma área de CONTROLE, não por agora uma parte de config e de alimentação do site."

Ou seja: uma área de CONTROLE com (1) o controle do telão, (2) as coisas de palestras e (3) as partes de moderação, tudo num lugar só. NÃO é configuração do site nem alimentação de conteúdo. Essa outra ideia (config dinâmica) ficou guardada só como lembrete no `DevFestIA/project-docs/IDEAS_BACKLOG.md`, seção "Admin com CONFIGURAÇÃO e alimentação do site".

## Restrição importante descoberta na leitura do código
A tela de moderação de perguntas (`docs/moderacao.html`, `docs/js/features/question-moderation.js`) também PUBLICA o quadro da palestra (`talk-boards/<talkKey>`, ver `features/board-publisher.js`) enquanto está aberta: a ordem das perguntas que a plateia vê só anda com essa tela aberta na palestra. Por isso NÃO embutir as perguntas de várias trilhas numa página só: trocar de trilha pararia de publicar o quadro da outra sala. No admin, cada trilha abre em ABA PRÓPRIA (como hoje, e como os 6 moderadores, 1 por trilha + 2 reservas, já usam). O admin mostra o estado e leva até a tela, mas não a substitui. A moderação do Coding Jam também mora em `moderacao.html` (com `?palestra=<código>`).

## Seções de `admin.html` (página interna: noindex, fora do menu e do sitemap, sem versão /DEV/; adicionar a `INTERNAL_PAGES` de `DevFestIA/tools/check-meta.js`)
1. **Visão geral ao vivo:** telão (emergência, cena fixada, avisos no ar), inscritos (`eventStatsRepository`), fotos (quantas no álbum ao vivo e quantas escondidas), perguntas pendentes por trilha, palestra no ar em cada trilha.
2. **Telão:** o controle que já existe (`initMuralControlPanel`: avisos de 1/2/5/15/60 min, pausar/fixar cena, recarregar, emergência em dois toques), embutido.
3. **Fotos do telão:** a moderação de fotos (`initMuralPhotoModeration`), embutida.
4. **Palestras:** uma linha por trilha com a palestra no ar (ou a próxima) e botões: abrir a moderação de perguntas (aba própria), abrir o quadro da sala (`checkin-display.html?trilha=<id>`) e abrir o pódio do Coding Jam na sessão dele. Usa `SCHEDULE`, `resolveEventState` e `talkShareCode` (os mesmos do site).
5. **Atalhos:** sorteio em modo telão (`DEV/sorteio.html?telao=1`), mural, reset de teste. Só links (o sorteio é grande e continua na tela dele).

## Passos (um commit por melhoria, em inglês, sem menção de IA; testes de tela + CI conferido; docs no fim)
1. **Menu compartilhado:** `docs/js/data/admin-sections.js` (substitui `team-tools.js`) + componente de menu. Entra em `moderacao.html`, `mural-controle.html`, `mural-fotos.html` e `reset-teste.html`. NÃO entra nas telas de TV (`mural.html`, `checkin-display.html`).
2. **Login único e casco:** `features/admin-session.js` (restaura o login do Google, que o Firebase já guarda entre páginas; mostra "esta conta não é de moderador" quando as regras recusarem) e `admin.html` com rotas por hash (`#visao-geral`, `#telao`, `#fotos`, `#palestras`, `#atalhos`). `equipe.html` vira redirecionamento pra `admin.html#atalhos`.
3. **Telão e Fotos embutidos:** os mesmos módulos, sem copiar código. Formulários desenhados uma vez (o que a pessoa digita nunca é apagado).
4. **Visão geral:** cartões independentes (um fora do ar não derruba os outros). Perguntas pendentes por `countWhere({ status: "pending" })` do `moderationQuestionsRepository` (as regras já deixam o moderador listar `talk-questions`).
5. **Seção Palestras.**
6. **Docs e handoff** (`PROJECT_CONTEXT`, `HANDOFF_CURRENT`, `NEW_CHAT_PROMPT`).

## O que NÃO precisa
Nenhuma regra nova do Firestore (o Renato não cola nada), nenhum documento novo no banco, nenhum custo novo (tudo no plano grátis).

## Opcionais (cada um exige regra nova que o Renato cola; sugestão: deixar fora)
- **Cartão de check-ins:** as regras proíbem listar `checkins` até do moderador (`allow list: if false`); precisaria de `allow list: if isModerator()`.
- **Batimento do telão** ("vivo há X segundos"): o mural gravaria `mural-status/current` a cada 30 s com login anônimo; a regra aceitaria gravação de qualquer visitante (dano máximo: indicador falso).

## O que depende do Renato
Dizer se a divisão das seções está certa (principalmente a seção Palestras), escrever "autorizado" e, no fim, testar o admin no celular com o login dele.
