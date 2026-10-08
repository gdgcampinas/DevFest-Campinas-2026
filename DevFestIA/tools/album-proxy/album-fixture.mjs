/** Página de álbum SINTÉTICA no mesmo formato da real (sem tokens de verdade: o repositório é público e o link de um álbum dá acesso a ele). Usada pelos testes. */
export const photoItem = ({ id, token = id, width = 3000, height = 2000, takenAt = 1_700_000_000_000, addedAt = 1_700_000_100_000 }) =>
  `["${id}",["https://lh3.googleusercontent.com/pw/${token}",${width},${height},null,null,null,null,null,[${width},${height},1,null,["Apple","iPhone [teste]",null,6.7]],[8615534],2,[[null,1,null,1]]],${takenAt},"chave",-10800000,${addedAt},["AF1QipDono"],[[2],[19]],2,null,null,null,null,null,4894]`;

export function albumPage({ title = "Álbum de Teste", items, padding = 2000 } = {}) {
  const data = items.map(photoItem).join(",");
  return `<!doctype html><html><head><title>${title} - Google Photos</title><meta property="og:title" content="${title} · Saturday, Nov 29 📸"></head><body>${" ".repeat(padding)}<script>AF_initDataCallback({key: 'ds:1', data:[[${data}],null,"texto com ] colchete e [ outro"], sideChannel: {}});</script></body></html>`;
}
