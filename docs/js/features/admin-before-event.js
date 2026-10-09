/**
 * Feature: seção "Antes do evento" do admin. A limpeza do BANCO é um link pro workflow do GitHub (lá moram as travas: modo teste, digitar APAGAR, recusa depois do início do evento; o navegador não tem
 * e não deve ter permissão pra apagar esses dados). A limpeza DESTE APARELHO roda aqui, em dois toques (features/two-tap-confirm.js), com a MESMA função da página reset-teste.html (`resetBrowserData`).
 * Tudo por parâmetro: `config` (ADMIN_BEFORE_EVENT), `reset` (limpa o aparelho e devolve o que removeu), `resultRows` (components/local-reset.js), `schedule` (agendador). Devolve `{ stop }`.
 */
function initAdminBeforeEvent(containerEl, { config, reset, resultRows, schedule = defaultSchedule }) {
  const state = { busy: false, rows: null, failed: false };
  let stopped = false;
  const slot = () => containerEl.querySelector('[data-slot="device"]');
  const drawDevice = () => {
    if (!stopped) slot().innerHTML = adminDeviceSlotMarkup({ config, armed: confirm.armed() === "device", busy: state.busy, rows: state.rows, failed: state.failed });
  };
  const confirm = createTwoTapConfirm({ schedule, confirmMs: config.confirmMs, onChange: drawDevice });

  containerEl.innerHTML = adminBeforeEventShellMarkup({ config });
  drawDevice();
  containerEl.addEventListener("click", event => {
    if (!event.target.closest("[data-device-reset]") || state.busy) return;
    confirm.press("device", async () => {
      state.busy = true;
      state.failed = false;
      drawDevice();
      try {
        state.rows = resultRows(await reset());
      } catch {
        state.failed = true; // o aparelho fica como estava: o botão volta e avisa
      } finally {
        state.busy = false;
        drawDevice();
      }
    });
  });

  return { stop: () => { stopped = true; confirm.disarm(); } };
}
