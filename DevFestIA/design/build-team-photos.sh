#!/bin/bash
# Gera os .webp de docs/assets/img/team/ a partir das fotos originais de organizadores/voluntários
# (arquivo "Nome Sobrenome.jpg/.jpeg" por pessoa, numa pasta local fora do repo — nunca comitar as
# fotos originais, só o .webp já comprimido). Rode da raiz do repositório:
#   DevFestIA/design/build-team-photos.sh <pasta com as fotos originais>
# Precisa de sips (macOS) e cwebp (brew install webp). Depois de rodar, adicione a pessoa em
# docs/js/data/team.js com `teamPhoto("<slug>")` e suba TEAM_PHOTO_VERSION se algum slug já existia
# (mesma regra do `?v=` dos scripts: trocar o conteúdo sem trocar o nome não invalida cache).
set -euo pipefail
SRC="${1:?uso: build-team-photos.sh <pasta com as fotos originais>}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/docs/assets/img/team"
TMP="$(mktemp -d)"
mkdir -p "$OUT"

# "Nome do arquivo" -> slug usado em teamPhoto(). Precisa bater com o nome em team.js; nem sempre é
# a mesma grafia do arquivo (ex.: apelido no arquivo, nome completo no site) — por isso a lista
# explícita, em vez de derivar o slug automaticamente do nome do arquivo. Terceiro campo opcional
# "altura,largura,offsetY,offsetX" recorta antes de redimensionar (foto de corpo inteiro, por ex.).
declare -a PHOTOS=(
  "Camila Fernanda Ignacio .jpeg|camila-fernanda-ignacio"
  "Davi Andrade.jpeg|davi-andrade"
  "Débora Nortes.jpg|debora-nortes"
  "Felipe de Oliveira .jpeg|felipe-de-oliveira"
  "Gustavo Costa .jpeg|gustavo-costa"
  "Henrique Ferreira Rodrigues da Silva.jpeg|henrique-ferreira-rodrigues-da-silva"
  "Henrique Ribeiro Medeiros da Silva.jpeg|henrique-ribeiro-medeiros-da-silva"
  "João Estevão Camilo.jpeg|joao-estevao-camilo"
  "João Lima.jpeg|joao-paulo-gomes-lima"
  "Laydianne Naira.jpeg|laydianne-naira"
  "Leonardo Araújo.jpeg|leonardo-araujo"
  "Letícia Fernandes Camargo de Campos .jpeg|leticia-fernandes-campos"
  "Lorenzo da Cunha.jpeg|lorenzo-da-cunha"
  "Mayne Gabriele da Silva.jpeg|mayne-gabriele-da-silva"
  "Michel Salomé.png|michel-salome|300,240,0,50"
  "Paula Santos.jpeg|paula-santos"
  "Pedro Missola.jpeg|pedro-escobar-missola"
  "Renato Ramos.jpeg|renato-ramos"
  "Ricardo Koiti Matsushita.jpeg|ricardo-koiti-matsushita"
  "Vânia Gomes Marinelli .jpeg|vania-gomes-marinelli"
)

for entry in "${PHOTOS[@]}"; do
  IFS='|' read -r file slug crop <<< "$entry"
  in="$SRC/$file"
  [ -f "$in" ] || { echo "faltando: $file"; continue; }
  if [ -n "$crop" ]; then
    IFS=',' read -r ch cw coy cox <<< "$crop"
    sips -c "$ch" "$cw" --cropOffset "$coy" "$cox" -s format jpeg "$in" --out "$TMP/$slug.crop.jpg" >/dev/null
    in="$TMP/$slug.crop.jpg"
  fi
  sips -Z 480 -s format jpeg "$in" --out "$TMP/$slug.jpg" >/dev/null
  cwebp -q 78 "$TMP/$slug.jpg" -o "$OUT/$slug.webp" >/dev/null 2>&1
  echo "$slug.webp"
done
rm -rf "$TMP"
