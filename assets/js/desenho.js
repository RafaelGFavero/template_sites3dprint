// A trava desenhada a partir de assets/desenhos.json: três vistas em primeiro diedro com cotas, eixos e a linha
// de corte, a perspectiva que se imprime camada por camada, os quatro estados e o corte A-A. O JSON traz só o
// traço 2D, calculado fora do site por tools/desenhos.js; a malha da peça nunca chega ao navegador.

const FURO = { x: 0, y: 12.75, raio: 5.5, placa: 1.6 }; // das notas de projeto da peça; a placa em volta do furo, medida na malha
const TRACO = { visivel: 1.6, oculta: 0.8, cota: 0.8, construcao: 1, corte: 0.8, hachura: 1.1, camada: 0.5 };
const FONTE = { cota: '13px osifont', rotulo: '11px osifont' };
const COTA = 22; // px do contorno à linha de cota
const ESP_COTA = COTA + 14; // px que a cota vertical ocupa à esquerda de uma vista: linha, 4px de folga e as cifras giradas
const ROTULO_H = 11, FOLGA = 6; // altura da letra do rótulo; folga entre um elemento e o rótulo
const ROTULO = 3 + FOLGA + ROTULO_H; // da linha de cota (com 3px de chamada além) à base do rótulo abaixo dela
const SOB_EIXO = 4 + ROTULO_H; // do fim da linha de centro à base do rótulo
const ENTRE = SOB_EIXO + ROTULO_H; // do fim da linha de centro ao topo da vista de baixo
const LETRA_A = 13; // px ao lado da ponta da linha de corte para a letra A
const EIXO = 3, ALEM = 4; // mm que a linha de centro e a linha de corte passam do contorno
const NOMES = { frontal: 'FRONTAL', superior: 'SUPERIOR', lateral: 'LATERAL ESQUERDA', perspectiva: 'PERSPECTIVA' };
const EASE_OUT = bezier(0.23, 1, 0.32, 1);
const limita = (v) => Math.min(1, Math.max(0, v));
export const mm = (valor) => valor.toFixed(1).replace('.', ',');

// A abertura do hero no instante t (ms): as três vistas se traçam, ocultas, cotas e rótulos aparecem, o esboço da
// perspectiva surge em azul de construção, as camadas sobem por cima dele em ritmo linear e as arestas ganham a
// tinta no fim.
export const FIM_HERO = 2850;
export function quadroHero(t, camadas) {
  return {
    p: [0, 120, 240].map((inicio) => EASE_OUT(limita((t - inicio) / 460))),
    alfa: EASE_OUT(limita((t - 600) / 500)),
    esboco: EASE_OUT(limita((t - 900) / 200)),
    ate: Math.floor(camadas * limita((t - 900) / 1700)),
    tinta: EASE_OUT(limita((t - 2600) / 250)),
  };
}

// Largura da aresta visível da perspectiva: 1,6px a partir de 4px por mm; abaixo disso afina com a escala até 0,8px,
// porque as nervuras da trava ficam a menos de 1,6px umas das outras e o traço cheio as funde num bloco.
export const larguraAresta = (s) => TRACO.visivel * Math.min(1, Math.max(0.5, s / 4));

export async function iniciar() {
  const principal = document.getElementById('desenho-principal');
  if (!principal) return;
  try {
    const [d] = await Promise.all([
      fetch('assets/desenhos.json').then((r) => { if (!r.ok) throw new Error(`desenhos.json ${r.status}`); return r.json(); }),
      document.fonts.load(FONTE.cota).catch(() => {}),
    ]);
    const redesenhos = [];
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => redesenhos.forEach((f) => f()));
    montarHero(principal, d, redesenhos);
    const estados = { foto: desenharFoto, cotas: desenharCotas, mesa: desenharMesa, camadas: desenharCamadas };
    for (const c of document.querySelectorAll('canvas.estado')) preguicoso(c, () => estados[c.dataset.estado]?.(c, d), redesenhos);
    const corte = document.getElementById('corte');
    if (corte) { // já no quadro seguinte, sem esperar rolagem; fora da tarefa do primeiro desenho do hero
      const desenhar = () => desenharCorte(corte, d);
      requestAnimationFrame(() => { dimensionar(corte); desenhar(); acompanhar(corte, desenhar, redesenhos); });
    }
  } catch (e) {
    console.warn(`desenho: ${e.message}`); // sem o traço, os canvas ficam em branco
  }
}

// Escala e origem que levam (u, v) em mm para px: X = x + u * s.
const ponto = (mapa, [u, v]) => [mapa.x + u * mapa.s, mapa.y + v * mapa.s];
const mapear = (ext, mapa) => Object.fromEntries(Object.entries(ext).map(([k, q]) => [k, ponto(mapa, q)]));
function encaixar(vista, rect) {
  const { esq, dir, cima, baixo } = vista.ext, w = dir[0] - esq[0], h = baixo[1] - cima[1];
  const s = Math.min(rect.w / w, rect.h / h);
  return { s, x: rect.x + (rect.w - w * s) / 2 - esq[0] * s, y: rect.y + (rect.h - h * s) / 2 - cima[1] * s };
}
// Encaixa a vista em W×H com margem m, reservando ESP_COTA à esquerda para a cota vertical, COTA + 3 embaixo
// para a horizontal e `eixo` mm em cima e embaixo para a linha de centro que passa do contorno; centra o conjunto.
function encaixarComCotas(vista, W, H, m, eixo = 0) {
  const { esq, dir, cima, baixo } = vista.ext, w = dir[0] - esq[0], h = baixo[1] - cima[1] + 2 * eixo, sob = COTA + 3;
  const s = Math.min((W - 2 * m - ESP_COTA) / w, (H - 2 * m - sob) / h);
  return { s, x: (W - ESP_COTA - w * s) / 2 + ESP_COTA - esq[0] * s, y: (H - sob - h * s) / 2 + eixo * s - cima[1] * s };
}

function tracar(ctx, segs, mapa, p = 1) { // cada trecho da esquerda para a direita, até a fração p
  if (p <= 0) return;
  ctx.beginPath();
  for (let i = 0; i < segs.length; i += 4) {
    const [x0, y0] = ponto(mapa, [segs[i], segs[i + 1]]), [x1, y1] = ponto(mapa, [segs[i + 2], segs[i + 3]]);
    ctx.moveTo(x0, y0); ctx.lineTo(x0 + p * (x1 - x0), y0 + p * (y1 - y0));
  }
  ctx.stroke();
}
const estiloOculta = (ctx, cor) => { ctx.strokeStyle = cor.grafite; ctx.lineWidth = TRACO.oculta; ctx.lineCap = 'butt'; ctx.setLineDash([4, 3]); };
const estiloVisivel = (ctx, cor, largura = TRACO.visivel, corTraco = cor.tinta) => { ctx.strokeStyle = corTraco; ctx.lineWidth = largura; ctx.lineCap = 'round'; ctx.setLineDash([]); };

// A perspectiva isométrica: as linhas de camada que se veem, nunca a menos de 1,5px uma da outra, e as arestas
// visíveis. Na abertura do hero, `ate` conta as camadas já impressas, `esboco` é o contorno em azul de construção
// e `tinta` a força da aresta final; sem esses três, a peça sai pronta.
function perspectiva(ctx, d, mapa, cor, { ate = d.camadas, esboco = 0, tinta = 1 } = {}) {
  const salto = Math.max(1, Math.ceil(1.5 / (d.camada * mapa.s)));
  const largura = larguraAresta(mapa.s);
  if (esboco * (1 - tinta) > 0) {
    ctx.globalAlpha = esboco * (1 - tinta);
    estiloVisivel(ctx, cor, Math.min(TRACO.construcao, largura), cor.construcao);
    tracar(ctx, d.iso.visiveis, mapa);
  }
  ctx.globalAlpha = 1;
  estiloVisivel(ctx, cor, TRACO.camada, cor.grafite);
  for (let k = 0; k < ate; k += salto) tracar(ctx, d.iso.camadas[k], mapa);
  if (tinta > 0) {
    ctx.globalAlpha = tinta;
    estiloVisivel(ctx, cor, largura);
    tracar(ctx, d.iso.visiveis, mapa);
    ctx.globalAlpha = 1;
  }
}

function ponta(ctx, x, y, dx, dy) { // seta cheia com a ponta em (x, y) apontando para (dx, dy)
  const c = 9, m = 3;
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.lineTo(x - c * dx - m * dy, y - c * dy + m * dx);
  ctx.lineTo(x - c * dx + m * dy, y - c * dy - m * dx);
  ctx.closePath(); ctx.fill();
}

// Cota linear entre os pontos extremos `p` e `q` do contorno (px), com a linha de cota em `nivel`
// (y se o eixo é 'x', x se é 'y'); linhas de chamada com 2px de folga e 3px além da cota.
function cota(ctx, cor, p, q, eixo, nivel, valor) {
  const horizontal = eixo === 'x', ao = horizontal ? 0 : 1, perp = 1 - ao;
  ctx.strokeStyle = ctx.fillStyle = cor.grafite; ctx.lineWidth = TRACO.cota; ctx.lineCap = 'butt'; ctx.setLineDash([]);
  const L = (a, b) => (horizontal ? [a, b] : [b, a]);
  ctx.beginPath();
  for (const pt of [p, q]) {
    const lado = Math.sign(nivel - pt[perp]);
    ctx.moveTo(...L(pt[ao], pt[perp] + 2 * lado)); ctx.lineTo(...L(pt[ao], nivel + 3 * lado));
  }
  const [lo, hi] = p[ao] < q[ao] ? [p[ao], q[ao]] : [q[ao], p[ao]];
  ctx.moveTo(...L(lo, nivel)); ctx.lineTo(...L(hi, nivel)); ctx.stroke();
  ponta(ctx, ...L(lo, nivel), ...L(-1, 0)); ponta(ctx, ...L(hi, nivel), ...L(1, 0));
  ctx.font = FONTE.cota; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (horizontal) ctx.fillText(valor, (lo + hi) / 2, nivel - 4);
  else { ctx.save(); ctx.translate(nivel - 4, (lo + hi) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(valor, 0, 0); ctx.restore(); }
}

// Traço-ponto com o meio da linha no meio de um traço longo: dois eixos se cruzam em traços, não em pontos.
function tracoPonto(ctx, x0, y0, x1, y1) {
  ctx.setLineDash([10, 3, 2, 3]);
  ctx.lineDashOffset = 5 - (Math.hypot(x1 - x0, y1 - y0) / 2) % 18;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.setLineDash([]); ctx.lineDashOffset = 0;
}

// Linha de centro (NBR 8403): traço-ponto fino em grafite, de a até b (px).
function linhaDeCentro(ctx, cor, a, b) {
  ctx.strokeStyle = cor.grafite; ctx.lineWidth = TRACO.cota; ctx.lineCap = 'butt';
  tracoPonto(ctx, ...a, ...b);
}

// Linha de corte horizontal em y, de x0 a x1: traço-ponto, extremos grossos, setas no sentido de quem olha o
// corte (+y, para cima na vista superior) e a letra A junto de cada ponta de seta.
function linhaDeCorte(ctx, cor, y, x0, x1) {
  ctx.strokeStyle = ctx.fillStyle = cor.tinta; ctx.lineCap = 'butt'; ctx.lineWidth = TRACO.corte;
  tracoPonto(ctx, x0, y, x1, y);
  ctx.lineWidth = TRACO.visivel;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 8, y); ctx.moveTo(x1, y); ctx.lineTo(x1 - 8, y); ctx.stroke();
  ctx.lineWidth = TRACO.cota;
  for (const x of [x0, x1]) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 12); ctx.stroke();
    ponta(ctx, x, y - 14, 0, -1);
    rotulo(ctx, cor.tinta, FONTE.cota, 'A', x, y - 18);
  }
}

function rotulo(ctx, cor, fonte, texto, x, y, alinhamento = 'center', base = 'alphabetic') {
  ctx.fillStyle = cor; ctx.font = fonte; ctx.textAlign = alinhamento; ctx.textBaseline = base;
  ctx.fillText(texto, x, y);
}

function hachurar(ctx, caminho, [x0, y0, x1, y1], cor) {
  ctx.save(); ctx.clip(caminho, 'evenodd');
  ctx.strokeStyle = cor; ctx.lineWidth = TRACO.hachura; ctx.lineCap = 'butt'; ctx.setLineDash([]);
  ctx.beginPath();
  for (let c = x0 + y0; c <= x1 + y1; c += 3 * Math.SQRT2) { ctx.moveTo(c - y1, y1); ctx.lineTo(c - y0, y0); } // passo de 3px: o corte é um campo denso
  ctx.stroke(); ctx.restore();
}

// Laços ([u0, v0, u1, v1, ...] em mm, no plano da vista) viram um caminho em px, com a caixa envolvente.
function caminhoDosLacos(lacos, mapa) {
  const caminho = new Path2D(), caixa = [Infinity, Infinity, -Infinity, -Infinity];
  for (const laco of lacos) {
    for (let i = 0; i < laco.length; i += 2) {
      const [x, y] = ponto(mapa, [laco[i], laco[i + 1]]);
      i ? caminho.lineTo(x, y) : caminho.moveTo(x, y);
      caixa[0] = Math.min(caixa[0], x); caixa[1] = Math.min(caixa[1], y); caixa[2] = Math.max(caixa[2], x); caixa[3] = Math.max(caixa[3], y);
    }
    caminho.closePath();
  }
  return { caminho, caixa };
}

function cores() {
  const estilo = getComputedStyle(document.documentElement);
  const cor = (nome) => estilo.getPropertyValue(nome).trim();
  return { papel: cor('--papel'), tinta: cor('--tinta'), grafite: cor('--grafite'), construcao: cor('--construcao') };
}

// Ajusta o armazenamento do canvas ao tamanho em CSS (dpr até 2). Devolve true se mudou.
function dimensionar(canvas) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w; canvas.height = h;
  return true;
}

// Contexto em px CSS (o dpr fica na transformação). Com `papel`, cobre tudo com a cor da folha antes:
// o canvas fica opaco, e o desenho segue legível mesmo com cores forçadas pelo sistema.
function contexto(canvas, papel) {
  const ctx = canvas.getContext('2d'), dpr = canvas.width / canvas.clientWidth;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (papel) { ctx.fillStyle = papel; ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight); }
  return ctx;
}

// Redesenha quando o tema ou o tamanho do canvas mudam.
function acompanhar(canvas, desenhar, redesenhos) {
  redesenhos.push(desenhar);
  new ResizeObserver(() => { if (dimensionar(canvas)) desenhar(); }).observe(canvas);
}

// Desenha quando o canvas se aproxima da tela; depois acompanha tema e tamanho.
function preguicoso(canvas, desenhar, redesenhos) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    dimensionar(canvas); desenhar();
    acompanhar(canvas, desenhar, redesenhos);
  }, { rootMargin: '200px' });
  io.observe(canvas);
}

// --- o hero: três vistas, cotas, eixos, corte e a perspectiva impressa ---

function montarHero(canvas, d, redesenhos) {
  const { frontal, superior, lateral } = d, tres = { frontal, superior, lateral }, nomes = Object.keys(tres);
  const { largura: X, profundidade: Y, altura: Z } = d.medidas;
  const diagonal = Math.hypot(X, Y, Z);
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let comp, fase = reduzido ? 'pronto' : 'espera', ultimoT = 0;
  const FINAL = quadroHero(Infinity, d.camadas);

  // Composição em primeiro diedro: frontal no alto à esquerda, superior abaixo dela, lateral esquerda à
  // direita da frontal, perspectiva no quadrante de baixo à direita. Uma escala para as três vistas.
  // Pilha da esquerda: frontal, eixo EIXO mm além, rótulo, folga (ENTRE), superior, cota (COTA), rótulo (ROTULO).
  function compor() {
    const W = canvas.clientWidth, H = canvas.clientHeight, mx = 0.06 * W, my = 0.06 * H;
    const pilha = ENTRE + COTA + ROTULO; // px que a coluna da esquerda gasta além das vistas e do eixo
    const s = Math.min((H - 2 * my - pilha) / (Z + Y + EIXO), (W - 2 * mx - ESP_COTA - LETRA_A) / (X + Y + ALEM));
    const sobra = W - 2 * mx - ESP_COTA - (X + Y + ALEM) * s - LETRA_A;
    const vao = ALEM * s + LETRA_A + sobra / 3; // entre a frontal e a coluna da direita: cabe a letra A do corte
    const xf = mx + ESP_COTA, yf = (H - (s * (Z + Y + EIXO) + pilha)) / 2;
    const fundoF = yf + Z * s; // base da frontal e da lateral (alinhadas em z)
    const ys = fundoF + EIXO * s + ENTRE, fundoS = ys + Y * s; // topo e base da superior
    const coluna = { x: xf + X * s + vao, w: W - mx - (xf + X * s + vao) }, lx = coluna.x + (coluna.w - Y * s) / 2;
    const base = fundoS + COTA + ROTULO; // base dos rótulos SUPERIOR e PERSPECTIVA
    const rotuloLateral = fundoF + EIXO * s + COTA + ROTULO;
    const topoPersp = rotuloLateral + FOLGA, alturaPersp = base - (FOLGA + ROTULO_H) - topoPersp; // entre o rótulo da lateral e o da perspectiva
    const sp = (0.96 * Math.min(coluna.w, alturaPersp)) / diagonal;
    const cx = coluna.x + coluna.w / 2, cy = topoPersp + alturaPersp / 2;
    const mapa = (vista, x, y) => ({ s, x: x - vista.ext.esq[0] * s, y: y - vista.ext.cima[1] * s });
    comp = {
      s,
      frontal: mapa(frontal, xf, yf), superior: mapa(superior, xf, ys), lateral: mapa(lateral, lx, yf),
      persp: { s: sp, x: cx - d.iso.centro[0] * sp, y: cy - d.iso.centro[1] * sp },
      cotas: { altura: xf - COTA, largura: fundoS + COTA, profundidade: fundoF + EIXO * s + COTA },
      rotulos: { frontal: [xf + (X * s) / 2, fundoF + EIXO * s + SOB_EIXO], superior: [xf + (X * s) / 2, base], lateral: [lx + (Y * s) / 2, rotuloLateral], perspectiva: [cx, base] },
    };
  }

  function desenharTudo(est) {
    const cor = cores(), ctx = contexto(canvas, cor.papel), { s } = comp;
    if (est.alfa > 0) { // os tracejados ficam por baixo da tinta: onde uma oculta coincide com uma visível, vence a visível
      ctx.globalAlpha = est.alfa;
      estiloOculta(ctx, cor);
      for (const n of nomes) tracar(ctx, tres[n].ocultos, comp[n]);
      ctx.globalAlpha = 1;
    }
    estiloVisivel(ctx, cor); // as arestas visíveis em peso cheio, por cima dos tracejados, desde o primeiro quadro
    nomes.forEach((n, k) => tracar(ctx, tres[n].visiveis, comp[n], est.p[k]));
    if (est.alfa > 0) {
      ctx.globalAlpha = est.alfa;
      const F = mapear(frontal.ext, comp.frontal), S = mapear(superior.ext, comp.superior), L = mapear(lateral.ext, comp.lateral);
      cota(ctx, cor, F.cima, F.baixo, 'y', comp.cotas.altura, mm(Z));
      cota(ctx, cor, S.esq, S.dir, 'x', comp.cotas.largura, mm(X));
      cota(ctx, cor, L.esq, L.dir, 'x', comp.cotas.profundidade, mm(Y));
      // eixos: a simetria na frontal, o furo na superior (o horizontal é a própria A-A) e na lateral, pela placa
      linhaDeCentro(ctx, cor, ponto(comp.frontal, [0, -(Z + EIXO)]), ponto(comp.frontal, [0, EIXO]));
      linhaDeCentro(ctx, cor, ponto(comp.superior, [FURO.x, -(FURO.y + FURO.raio + EIXO)]), ponto(comp.superior, [FURO.x, -(FURO.y - FURO.raio - EIXO)]));
      linhaDeCentro(ctx, cor, ponto(comp.lateral, [-FURO.y, -(FURO.placa + EIXO)]), ponto(comp.lateral, [-FURO.y, EIXO]));
      linhaDeCorte(ctx, cor, ponto(comp.superior, [0, -d.corte.plano])[1], S.esq[0] - ALEM * s, S.dir[0] + ALEM * s);
      for (const [n, [x, y]] of Object.entries(comp.rotulos)) rotulo(ctx, cor.grafite, FONTE.rotulo, NOMES[n], x, y);
      ctx.globalAlpha = 1;
    }
    if (est.esboco > 0) perspectiva(ctx, d, comp.persp, cor, est);
  }

  function redesenhar() {
    if (fase === 'pronto') desenharTudo(FINAL);
    else if (fase === 'animando') desenharTudo(quadroHero(ultimoT, d.camadas));
    else contexto(canvas, cores().papel);
  }

  function animar() {
    fase = 'animando';
    let t0;
    const quadro = (agora) => {
      t0 ??= agora;
      ultimoT = agora - t0;
      desenharTudo(quadroHero(ultimoT, d.camadas));
      if (ultimoT < FIM_HERO) requestAnimationFrame(quadro);
      else { fase = 'pronto'; desenharTudo(FINAL); }
    };
    requestAnimationFrame(quadro);
  }

  new ResizeObserver(() => { if (dimensionar(canvas)) { compor(); redesenhar(); } }).observe(canvas);
  redesenhos.push(redesenhar);
  if (!reduzido) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (!comp) { dimensionar(canvas); compor(); }
      animar();
    }, { threshold: 0.4 });
    io.observe(canvas);
  }
}

// --- os quatro estados ---

function desenharFoto(canvas, d) { // só as arestas, sem tirar as ocultas: o esboço em linha de construção
  const W = canvas.clientWidth, m = 0.1 * W, cor = cores(), ctx = contexto(canvas, cor.papel);
  estiloVisivel(ctx, cor, TRACO.construcao, cor.construcao);
  tracar(ctx, d.iso.arame, encaixar(d.iso, { x: m, y: m, w: W - 2 * m, h: W - 2 * m }));
}

function desenharCotas(canvas, d) {
  const W = canvas.clientWidth, cor = cores(), ctx = contexto(canvas, cor.papel), { frontal, medidas } = d;
  const mapa = encaixarComCotas(frontal, W, W, 0.08 * W, EIXO);
  estiloOculta(ctx, cor); tracar(ctx, frontal.ocultos, mapa);
  estiloVisivel(ctx, cor); tracar(ctx, frontal.visiveis, mapa);
  linhaDeCentro(ctx, cor, ponto(mapa, [0, -(medidas.altura + EIXO)]), ponto(mapa, [0, EIXO]));
  const F = mapear(frontal.ext, mapa);
  cota(ctx, cor, F.cima, F.baixo, 'y', F.esq[0] - COTA, mm(medidas.altura));
  cota(ctx, cor, F.esq, F.dir, 'x', F.baixo[1] + EIXO * mapa.s + COTA, mm(medidas.largura));
}

function desenharMesa(canvas, d) {
  const W = canvas.clientWidth, m = 0.1 * W, cor = cores(), ctx = contexto(canvas, cor.papel);
  const mapa = encaixar(d.superior, { x: m, y: m, w: W - 2 * m, h: W - 2 * m - 24 });
  estiloVisivel(ctx, cor); tracar(ctx, d.superior.visiveis, mapa);
  const { caminho, caixa } = caminhoDosLacos(d.superior.base, mapa);
  hachurar(ctx, caminho, caixa, cor.tinta);
  rotulo(ctx, cor.grafite, FONTE.rotulo, 'BASE NA MESA', W / 2, W - m + 4);
}

function desenharCamadas(canvas, d) {
  const W = canvas.clientWidth, m = 0.1 * W, cor = cores(), ctx = contexto(canvas, cor.papel);
  perspectiva(ctx, d, encaixar(d.iso, { x: m, y: m, w: W - 2 * m, h: W - 2 * m - 24 }), cor);
  rotulo(ctx, cor.grafite, FONTE.rotulo, `${d.camadas} CAMADAS DE ${mm(d.camada)} mm`, W / 2, W - m + 4);
}

// --- o corte A-A: o plano y = d.corte.plano visto da frente (u = x, v = -z) ---

function desenharCorte(canvas, d) {
  const W = canvas.clientWidth, H = canvas.clientHeight, cor = cores(), ctx = contexto(canvas, cor.papel), { corte, medidas } = d;
  const mapa = encaixarComCotas(corte, W, H, 0.06 * Math.min(W, H));
  estiloVisivel(ctx, cor, TRACO.oculta, cor.grafite); // atrás do corte, só o que se vê, em grafite
  tracar(ctx, corte.visiveis, mapa);
  const { caminho, caixa } = caminhoDosLacos(corte.lacos, mapa);
  ctx.fillStyle = cor.papel; ctx.fill(caminho, 'evenodd');
  hachurar(ctx, caminho, caixa, cor.tinta);
  ctx.strokeStyle = cor.tinta; ctx.lineWidth = TRACO.visivel; ctx.lineJoin = 'round'; ctx.setLineDash([]); ctx.stroke(caminho);
  const E = mapear(corte.ext, mapa);
  cota(ctx, cor, E.cima, E.baixo, 'y', E.esq[0] - COTA, mm(medidas.altura));
  cota(ctx, cor, E.esq, E.dir, 'x', E.baixo[1] + COTA, mm(medidas.largura));
}

// cubic-bezier(x1, y1, x2, y2) como o CSS: acha t para o x pedido por bissecção e devolve y.
function bezier(x1, y1, x2, y2) {
  const B = (a, b, t) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) {
      const bx = B(x1, x2, t);
      if (Math.abs(bx - x) < 1e-6) break;
      if (bx < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return B(y1, y2, t);
  };
}
