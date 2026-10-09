# Estudo (Fase C): números ao vivo no telão (2026-10-09)

**Status:** só ESTUDO, nada implementado. Pedido do Renato: "Já somos N aqui" (contador de presença com comemoração nos marcos) e "De onde vem a galera" (cidades). O "Passaporte" foi descartado. A decisão de fazer ou não é do Renato depois deste relatório.

## 1. "Já somos N aqui" (presença)
**O que o dado permite hoje**
- O check-in é POR PALESTRA (`checkins/<uid>_<talkKey>`). Uma pessoa gera vários documentos ao longo do dia, então contar documentos NÃO é contar pessoas.
- As regras proíbem listar e contar `checkins` (`allow list: if false`), até do moderador. Contar no navegador exige regra nova.
- O sorteio tem 1 cadastro por pessoa (`raffle-entries`), mas só quem participa do sorteio: serve de aproximação, não de presença.

**Medidas honestas (escolher uma e dizer no telão o que é)**
- A) **Pessoas na sala agora** = check-ins da palestra no ar (soma das trilhas). Número real e fácil de explicar ("N pessoas nas palestras agora"). Sobe e desce com a grade.
- B) **Pico do dia** = o maior valor de A durante o dia (guardado). Bom para comemorar marcos (100, 200...).
- C) **Pessoas únicas do dia** = precisa de um documento de presença por pessoa (ex.: `presence/<uid>` criado no primeiro check-in): mudança de regra e de fluxo; só vale se for decidido antes do evento.

**Como entregar o número ao telão (4 caminhos)**
1. **Cloudflare Worker com agendamento (recomendado):** o Worker que já existe (conta do GDG, plano grátis) ganha um gatilho a cada 1 minuto, lê a contagem no Firestore (consulta de agregação, ~1 leitura por 1000 documentos) e grava `event-stats/presence`; o telão só LÊ (como já lê `event-stats`). Prós: não depende de nenhum celular aberto, o cliente não é confiável nem precisa de regra nova de leitura de `checkins`. Contras: guardar a chave de serviço do Firebase como segredo do Worker (o Renato cria e cola; é a mesma que o GitHub já usa).
2. **GitHub Actions:** descartado, o agendamento do GitHub atrasa HORAS (o sync do Sympla roda em média a cada 4,4 h).
3. **Admin aberto num celular do moderador** conta e grava: depende de alguém manter a tela aberta; regra nova de leitura (`checkins` para moderador) e de escrita. Serve de plano B.
4. **Contador incrementado pelo cliente:** descartado, qualquer pessoa inflaria.
**Custo/risco:** leituras do plano grátis desprezíveis (agregação); risco de privacidade nenhum (só número agregado, sem nome). Marcos (100, 200...) e confete: lógica pura no telão (já existe o detector de "acabou de publicar" e o papel picado), uns 2 commits.
**Esforço estimado:** Worker com agendamento + chave de serviço + leitura no telão + cena + testes: ~6 commits e UM passo do Renato (segredo no Worker). Se escolher o caminho 3: 1 regra nova a colar.

## 2. "De onde vem a galera" (cidades)
- O job do Sympla hoje lê, de cada participante: nome do ingresso, e-mail, status do pedido. **Cidade NÃO faz parte do que lemos.** A API do Sympla só devolve cidade se a pergunta existir no formulário de inscrição (campo personalizado, `custom_form`) ou no endereço do comprador do pedido.
- **Como confirmar (5 minutos do Renato):** abrir a exportação de participantes do Sympla do evento e ver se há uma coluna de cidade/estado. Se existir, eu leio o campo no job e gravo SÓ o agregado (`{ cidade: quantidade }`) em `event-stats`, sem e-mail nem nome.
- **Privacidade (LGPD):** mostrar só cidades com pelo menos 3 pessoas (as demais viram "outras"); nunca nome nem e-mail; o telão mostra "gente de N cidades" e as maiores.
- **Se não houver o dado:** não dá para "adivinhar" cidade; alternativa é uma pergunta no formulário do Sympla para as próximas vendas ou uma enquete no próprio evento (pergunta no mural de recados: "De que cidade você veio?" com nuvem de palavras, moderada).
- **Esforço:** ~4 commits (job, agregado, cena de bolhas, testes) depois de confirmar o dado.

## 3. Recomendação
1. Fazer a medida A (pessoas nas palestras agora) pelo Worker agendado, com marcos de pico (B); explicar no telão o que o número significa.
2. Cidades só depois de o Renato confirmar a coluna no Sympla; sem ela, usar a pergunta no mural de recados.
3. Nada disso é obrigatório para o evento: o telão acolhedor (Fases A e B) já funciona sem números.

## 4. O que preciso do Renato para decidir
- Quer o contador de presença? (sim/não e qual medida: A, B ou C)
- Topa guardar a chave de serviço do Firebase como segredo do Worker?
- Tem coluna de cidade na exportação do Sympla?
