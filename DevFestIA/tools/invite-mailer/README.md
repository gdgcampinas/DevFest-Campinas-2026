# Envio do convite de moderador

Script do Google (Apps Script) que o botão **Convidar** do admin chama para o e-mail sair sozinho da conta do GDG.

## Publicar (uma vez, logado em gdgcampinascontato@gmail.com)

1. Abra https://script.google.com e clique em **Novo projeto**. Nome: `DevFest convite de moderador`.
2. Apague o conteúdo do `Código.gs`, cole todo o `Code.gs` desta pasta e salve.
3. **Implantar** > **Nova implantação** > engrenagem > **App da Web**.
4. **Executar como:** Eu. **Quem pode acessar:** Qualquer pessoa.
5. **Implantar** e autorize o acesso (enviar e-mail e acessar serviço externo).
6. Copie a **URL do app da Web** (termina em `/exec`).
7. Cole a URL em `invite.sendUrl` (`docs/js/data/admin-sections.js`) e publique o site.

## Por que "Qualquer pessoa" é seguro

A URL aceita pedidos de qualquer lugar, mas só envia quando o login que veio junto consegue ler a lista de moderadores, o que as regras do Firestore permitem só ao dono. E só recebe quem está nessa lista.

## Limites

Conta Gmail comum: cerca de 100 destinatários por dia. Mudou o `Code.gs`? **Implantar** > **Gerenciar implantações** > editar > **Nova versão** (a URL continua a mesma).

Desligar: arquive a implantação e esvazie `invite.sendUrl` (o botão volta a abrir o Gmail com o texto pronto).
