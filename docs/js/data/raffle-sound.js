/**
 * Sons do sorteio, só dados (features/raffle-sound.js toca). Cada nota: { at, freq, dur, type, gain } em segundos e Hz;
 * `at` conta a partir do início do som. Tudo sintetizado no navegador (Web Audio): sem arquivo, sem direitos autorais,
 * funciona offline. A fanfarra é original, em dó maior: subida rápida em "8 bits", um motivo de comemoração e um acorde
 * final brilhante com faíscas agudas. A soma dos volumes fica abaixo de 0,35 pra não estourar o som do telão.
 */
const soundNote = (at, freq, dur, type, gain) => ({ at, freq, dur, type, gain });
const soundChord = (at, freqs, dur, gain) => freqs.map(freq => soundNote(at, freq, dur, "triangle", gain));

const RAFFLE_SOUND = {
  tick: soundNote(0, 680, 0.06, "square", 0.05),
  fanfare: [
    // subida rápida: dó mi sol dó
    soundNote(0.0, 523.25, 0.1, "square", 0.06),
    soundNote(0.09, 659.25, 0.1, "square", 0.06),
    soundNote(0.18, 783.99, 0.1, "square", 0.06),
    soundNote(0.27, 1046.5, 0.14, "square", 0.06),
    // motivo de festa: sol dó mi (agudo)
    soundNote(0.42, 783.99, 0.09, "square", 0.055),
    soundNote(0.5, 1046.5, 0.09, "square", 0.055),
    soundNote(0.58, 1318.51, 0.16, "square", 0.055),
    // acorde final de dó maior, aberto, que dura
    ...soundChord(0.78, [523.25, 659.25, 783.99, 1046.5], 1.1, 0.05),
    soundNote(0.78, 261.63, 1.1, "sine", 0.08),
    // faíscas: notas agudas e curtinhas, em cascata
    soundNote(0.84, 2637.02, 0.09, "sine", 0.03),
    soundNote(0.94, 3135.96, 0.09, "sine", 0.03),
    soundNote(1.04, 2093.0, 0.09, "sine", 0.03),
    soundNote(1.14, 3135.96, 0.09, "sine", 0.03),
    soundNote(1.24, 4186.01, 0.12, "sine", 0.025),
    soundNote(1.36, 3135.96, 0.12, "sine", 0.025),
  ],
};

const raffleSoundRepository = createRepository(RAFFLE_SOUND);
