/**
 * Conteúdo do modal do cartão pessoal "Eu vou!" (features/share-card.js
 * desenha o canvas e liga os botões, isso aqui só monta o HTML). Nome é
 * opcional e redesenha o cartão a cada tecla (ver initShareCard).
 */
function shareCardModalMarkup() {
  return `<div class="share-card">
    <h3 class="share-card-title">${iconMarkup("share")}Meu cartão "Eu vou!"</h3>
    <p class="share-card-hint">Seu nome aparece no cartão (opcional) — baixe ou compartilhe pra convidar a rede.</p>
    <input type="text" class="feedback-input" data-share-card-name placeholder="Seu nome (opcional)" maxlength="40">
    <canvas class="share-card-canvas" data-share-card-canvas width="1080" height="1350" aria-label="Pré-visualização do cartão 'Eu vou'"></canvas>
    <div class="share-card-actions">
      <button type="button" class="chip-btn chip-btn--primary" data-share-card-download data-track-event="share_card_download">${iconMarkup("download")}Baixar imagem</button>
      <button type="button" class="chip-btn" data-share-card-native data-track-event="share_card_native" hidden>${iconMarkup("share")}Compartilhar</button>
    </div>
  </div>`;
}
