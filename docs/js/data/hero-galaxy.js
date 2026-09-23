/**
 * A "galáxia" do hero: o próprio logo (uma espiral) girando bem devagar
 * atrás do hero da home, tema "Do Local ao Infinito". Tudo é dado: trocar a
 * imagem, a velocidade, o tamanho ou a intensidade é editar só este objeto
 * (nenhum valor fixo no CSS ou no JS). Com "Reduzir movimento" ligado no aparelho ela gira
 * bem mais devagar (`reducedMotionSeconds`), ou fica parada se for null.
 */
const HERO_GALAXY = {
  src: "assets/brand/gdg-icon.svg",
  rotationSeconds: 80, // uma volta completa
  reducedMotionSeconds: 240, // idem, em aparelho com "Reduzir movimento" ligado (bem mais lenta, sem parar); null = parada
  opacity: 0.4,
  size: "230%", // relativo à ALTURA do hero (não à largura da tela)
  maxWidth: "125vw", // teto por largura da tela: no celular a espiral não passa da tela nem "estoura"
  x: "50%", // onde o CENTRO da espiral fica dentro do card
  y: "50%",
  // o logo tem dois "olhos" (azul+vermelho e verde+amarelo); ela gira em volta do azul+vermelho, posição
  // dele DENTRO da imagem, pra esse núcleo ficar sempre no meio do card (girar pelo meio do desenho
  // faria os dois olhos orbitarem e o quadro parecer descentralizado)
  pivotX: "40.8%",
  pivotY: "41.8%",
};

const heroGalaxyRepository = createRepository(HERO_GALAXY);
