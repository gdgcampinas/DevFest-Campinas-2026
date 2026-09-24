#!/bin/bash
# Roda os testes das regras do Firestore (perguntas ao vivo) no emulador local. Precisa de Java 21
# (brew install openjdk@21) e do Firebase CLI. Não toca o banco real (projeto demo-devfest).
set -e
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
cd "$(dirname "$0")/../../.."
firebase emulators:exec --only firestore --project demo-devfest --config DevFestIA/firebase/firebase.json \
  "node --test DevFestIA/tools/questions/rules.test.js"
