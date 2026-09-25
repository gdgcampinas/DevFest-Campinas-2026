#!/bin/bash
# Roda os testes das regras do Firestore (perguntas ao vivo) no emulador local, duas vezes: com a TRAVA DE HORÁRIO
# ligada (cópia temporária das regras com `windowEnforced()` = true) e como está no arquivo. Precisa de Java 21
# (brew install openjdk@21) e do Firebase CLI. Não toca o banco real (projeto demo-devfest).
set -e
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
cd "$(dirname "$0")/../../.."

run() { # $1 = valor de RULES_WINDOW, $2 = pasta com firebase.json + firestore.rules
  echo "== regras com a trava de horário: $1 =="
  RULES_WINDOW="$1" firebase emulators:exec --only firestore --project demo-devfest --config "$2/firebase.json" \
    "node --test DevFestIA/tools/questions/rules.test.js DevFestIA/tools/questions/feedback-rules.test.js"
}

TMP="$(mktemp -d)"
cp DevFestIA/firebase/firebase.json "$TMP/firebase.json"
sed 's#return false; // TRAVA-DE-HORARIO#return true; // TRAVA-DE-HORARIO#' DevFestIA/firebase/firestore.rules > "$TMP/firestore.rules"
run on "$TMP"

if grep -q 'return true; // TRAVA-DE-HORARIO' DevFestIA/firebase/firestore.rules; then
  run on DevFestIA/firebase
else
  run off DevFestIA/firebase
fi
rm -rf "$TMP"
