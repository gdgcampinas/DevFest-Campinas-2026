/**
 * A "galáxia" do hero: o próprio logo (uma espiral) girando bem devagar
 * atrás do hero da home, tema "Do Local ao Infinito". Tudo é dado: trocar a
 * imagem, a velocidade, o tamanho ou a intensidade é editar só este objeto
 * (nenhum valor fixo no CSS ou no JS). Quem pede menos movimento vê o logo
 * parado (a regra global de prefers-reduced-motion em styles.css já cuida).
 */
const HERO_GALAXY = {
  src: "assets/brand/gdg-icon.svg",
  rotationSeconds: 140, // uma volta completa
  opacity: 0.42,
  size: "1500px", // maior que o palco de propósito: só os arcos do centro aparecem por trás do hero
  x: "80%", // centro da espiral em relação ao palco
  y: "30%",
};

const heroGalaxyRepository = createRepository(HERO_GALAXY);
