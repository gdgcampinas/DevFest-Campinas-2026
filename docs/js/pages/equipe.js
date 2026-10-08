/** Página: PAINEL DA EQUIPE (equipe.html), atalhos das ferramentas internas. Raiz de composição: só liga os dados (ferramentas e trilhas) à marcação. */
document.getElementById("teamBody").innerHTML = teamToolsMarkup({ tools: teamToolsRepository.getAll(), tracks: TRACKS });
