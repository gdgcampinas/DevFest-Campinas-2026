#!/bin/bash
# Sobe o Firebase LOCAL (Firestore 8085 + Auth 9099) com as regras de DevFestIA/firebase/firestore.rules, pra testar o
# site inteiro sem tocar no banco real: abra o site com ?emulador=1 (ver docs/js/data/firebase-emulator.js).
# Precisa de Java 21 (brew install openjdk@21) e do Firebase CLI. Ctrl+C encerra (os dados somem).
set -e
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
cd "$(dirname "$0")/../../.."
exec firebase emulators:start --only firestore,auth --project demo-devfest --config DevFestIA/firebase/firebase.json
