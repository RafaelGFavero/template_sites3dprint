// A trava desenhada a partir do STL: três vistas em primeiro diedro com cotas e a linha de corte,
// a perspectiva que se imprime camada por camada e gira sob o ponteiro, os quatro estados e o corte A-A.
import { parseSTL, bounds, featureEdgeList, sliceAxis, loops, layerCount } from './stl.js';
import { VISTAS, orbita, ISO, recortaAbaixo, mm } from './vistas.js';

const CAMADA = 0.2;
const PLANO_AA = 0.05; // x do corte A-A, fora do plano de simetria para não passar por vértices
const TRACO = { visivel: 1.6, oculta: 0.8, cota: 0.8, construcao: 1, corte: 0.8, hachura: 0.7, camada: 0.5 };
const FONTE = { cota: '13px osifont', rotulo: '11px osifont' };
const ESP_COTA = 40; // px reservados para uma cota ao lado de uma vista
const PASSO_AMOSTRA = 0.4; // mm entre amostras na busca de linhas ocultas
const EASE_OUT = bezier(0.23, 1, 0.32, 1);
const limita = (v) => Math.min(1, Math.max(0, v));

export async function iniciar() {
  const principal = document.getElementById('desenho-principal');
  if (!principal) return;
  const t0 = performance.now();
  const [buffer] = await Promise.all([
    fetch('assets/models/trava-conector.stl').then((r) => r.arrayBuffer()),
    document.fonts.load(FONTE.cota).catch(() => {}),
  ]);
  const parte = montarParte(parseSTL(buffer));
  performance.measure('desenho:dados', { start: t0 });
  const redesenhos = [];
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => redesenhos.forEach((f) => f()));

  montarHero(principal, parte, redesenhos);
  const lateral = projetar(parte, VISTAS.lateral);
  const iso = projetar(parte, orbita(ISO.az, ISO.el));
  const estados = {
    foto: (c) => desenharFoto(c, parte, iso),
    cotas: (c) => desenharCotas(c, parte, projetar(parte, VISTAS.frontal)),
    mesa: (c) => desenharMesa(c, parte, projetar(parte, VISTAS.superior)),
    camadas: (c) => desenharCamadas(c, parte, iso),
  };
  for (const c of document.querySelectorAll('canvas.estado')) preguicoso(c, () => estados[c.dataset.estado]?.(c), redesenhos);
  const corte = document.getElementById('corte');
  if (corte) preguicoso(corte, () => desenharCorte(corte, parte, lateral), redesenhos);
}

function montarParte(mesh) {
  const arestas = featureEdgeList(mesh, 30);
  const chave = ({ a, b }) => `${a}|${b}`;
  const vivas = new Set(arestas.map(chave));
  const todas = featureEdgeList(mesh, 0).map((e) => ({ ...e, viva: vivas.has(chave(e)) }));
  const porFace = Array.from({ length: mesh.count }, () => []);
  todas.forEach((e, i) => e.faces.forEach((f) => porFace[f].push(i)));
  return { mesh, caixa: bounds(mesh), arestas, camadas: layerCount(mesh, CAMADA), todas, porFace };
}

// Projeta a malha numa vista: vértices em (u, v, profundidade), faces de frente ordenadas de trás para a
// frente, e quais arestas se desenham nela (as vivas e as de silhueta, entre uma face de frente e uma de costas).
function projetar(parte, proj) {
  const { count: n, positions: P, normals: N } = parte.mesh;
  const pv = new Float64Array(n * 9), frente = new Uint8Array(n), prof = new Float64Array(n);
  const D = [proj(1, 0, 0)[2], proj(0, 1, 0)[2], proj(0, 0, 1)[2]]; // direção de quem olha
  for (let f = 0; f < n; f++) {
    for (let k = 0; k < 3; k++) {
      const o = f * 9 + k * 3, q = proj(P[o], P[o + 1], P[o + 2]);
      pv[o] = q[0]; pv[o + 1] = q[1]; pv[o + 2] = q[2]; prof[f] += q[2] / 3;
    }
    frente[f] = N[f * 3] * D[0] + N[f * 3 + 1] * D[1] + N[f * 3 + 2] * D[2] > 0 ? 1 : 0;
  }
  const ordem = [...Array(n).keys()].filter((f) => frente[f]).sort((f, g) => prof[f] - prof[g]);
  const desenha = parte.todas.map(({ viva, faces }) => viva || (faces.length === 2 && frente[faces[0]] !== frente[faces[1]]));
  let esq, dir, cima, baixo;
  for (let i = 0; i < pv.length; i += 3) {
    const q = [pv[i], pv[i + 1]];
    if (!esq || q[0] < esq[0]) esq = q; if (!dir || q[0] > dir[0]) dir = q;
    if (!cima || q[1] < cima[1]) cima = q; if (!baixo || q[1] > baixo[1]) baixo = q;
  }
  return { proj, pv, frente, ordem, desenha, ext: { esq, dir, cima, baixo } };
}

// Escala e origem que levam (u, v) em mm para px: X = x + u * s.
const ponto = (mapa, [u, v]) => [mapa.x + u * mapa.s, mapa.y + v * mapa.s];
const mapear = (ext, mapa) => Object.fromEntries(Object.entries(ext).map(([k, q]) => [k, ponto(mapa, q)]));
function encaixar(vista, rect) {
  const { esq, dir, cima, baixo } = vista.ext, w = dir[0] - esq[0], h = baixo[1] - cima[1];
  const s = Math.min(rect.w / w, rect.h / h);
  return { s, x: rect.x + (rect.w - w * s) / 2 - esq[0] * s, y: rect.y + (rect.h - h * s) / 2 - cima[1] * s };
}

// Algoritmo do pintor: cada face de frente, de trás para a frente, é preenchida com papel e recebe as arestas
// que a tocam. `p` traça cada aresta só até essa fração do comprimento; `h` recorta a peça abaixo dessa altura
// (a impressão em andamento) e fecha a tampa; `camadas` traça as linhas de camada nas faces visíveis.
function pintar(ctx, parte, vista, mapa, cor, { p = 1, h = Infinity, camadas = false, filtro, corAresta = cor.tinta, largura = TRACO.visivel } = {}) {
  const { mesh, todas, porFace, caixa } = parte, P = mesh.positions;
  const { pv, ordem, desenha, proj } = vista;
  const M = (q) => ponto(mapa, q);
  const recorta = h < caixa.max[2];
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.setLineDash([]);
  for (const f of ordem) {
    if (filtro && !filtro(f)) continue;
    const o = f * 9;
    let poligono;
    if (recorta) {
      const tri = [0, 3, 6].map((k) => [P[o + k], P[o + k + 1], P[o + k + 2]]);
      const rec = recortaAbaixo(tri, h);
      if (rec.length < 3) continue;
      poligono = rec.map((q) => proj(...q));
    } else poligono = [0, 3, 6].map((k) => [pv[o + k], pv[o + k + 1]]);
    ctx.beginPath();
    poligono.forEach((q, i) => (i ? ctx.lineTo(...M(q)) : ctx.moveTo(...M(q))));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle = cor.papel;
    ctx.lineWidth = 1; // cobre a emenda entre faces vizinhas, por onde vazaria o que está atrás
    ctx.fill(); ctx.stroke();
    if (camadas) {
      const zMin = Math.min(P[o + 2], P[o + 5], P[o + 8]), zMax = Math.min(h, Math.max(P[o + 2], P[o + 5], P[o + 8]));
      const face = { count: 1, positions: P.subarray(o, o + 9) };
      const salto = Math.max(1, Math.ceil(1.5 / (CAMADA * mapa.s))); // nunca menos de 1,5px entre linhas
      ctx.beginPath();
      for (let k = Math.ceil((zMin - 0.1) / CAMADA / salto) * salto; k * CAMADA + 0.1 < zMax; k += salto) {
        const z = k * CAMADA + 0.1, seg = sliceAxis(face, 2, z);
        if (!seg.length) continue;
        const [ax, ay] = M(proj(seg[0], seg[1], z)), [bx, by] = M(proj(seg[2], seg[3], z));
        const c = Math.hypot(bx - ax, by - ay) || 1, ex = (0.7 * (bx - ax)) / c, ey = (0.7 * (by - ay)) / c;
        ctx.moveTo(ax - ex, ay - ey); // 0,7px além da face: repõe o que a emenda da face vizinha apaga
        ctx.lineTo(bx + ex, by + ey);
      }
      ctx.strokeStyle = cor.grafite; ctx.lineWidth = TRACO.camada; ctx.stroke();
    }
    ctx.beginPath();
    for (const i of porFace[f]) {
      if (!desenha[i]) continue;
      let { a, b } = todas[i];
      if (recorta) {
        if (a[2] > h && b[2] > h) continue;
        if (a[2] > h) a = cortaEm(b, a, h); else if (b[2] > h) b = cortaEm(a, b, h);
      }
      let A = proj(...a), B = proj(...b);
      if (A[0] > B[0] || (A[0] === B[0] && A[1] > B[1])) [A, B] = [B, A]; // traça da esquerda para a direita
      ctx.moveTo(...M(A));
      ctx.lineTo(...M([A[0] + p * (B[0] - A[0]), A[1] + p * (B[1] - A[1])]));
    }
    ctx.strokeStyle = corAresta; ctx.lineWidth = largura; ctx.stroke();
  }
  if (recorta) {
    ctx.beginPath();
    for (const laco of loops(sliceAxis(mesh, 2, h))) {
      laco.forEach(([x, y], i) => (i ? ctx.lineTo(...M(proj(x, y, h))) : ctx.moveTo(...M(proj(x, y, h)))));
      ctx.closePath();
    }
    ctx.fillStyle = cor.papel; ctx.fill('evenodd');
    ctx.strokeStyle = cor.tinta; ctx.lineWidth = TRACO.visivel; ctx.stroke();
  }
}

// Ponto do segmento a-b na altura h (b está acima de h).
function cortaEm(a, b, h) {
  const t = (h - a[2]) / (b[2] - a[2]);
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), h];
}

// Trechos ocultos e visíveis das arestas da vista: amostra cada aresta a cada 0,4 mm e marca o ponto coberto
// por alguma face de frente mais próxima de quem olha. Devolve segmentos [u0, v0, u1, v1] em mm.
function trechos(parte, vista) {
  const { pv, ordem, desenha, proj } = vista;
  const faces = ordem.map((f) => {
    const o = f * 9, u = [pv[o], pv[o + 3], pv[o + 6]], v = [pv[o + 1], pv[o + 4], pv[o + 7]];
    return { o, u0: Math.min(...u), u1: Math.max(...u), v0: Math.min(...v), v1: Math.max(...v) };
  });
  const coberto = (u, v, d) => {
    for (const { o, u0, u1, v0, v1 } of faces) {
      if (u < u0 || u > u1 || v < v0 || v > v1) continue;
      const ax = pv[o], ay = pv[o + 1], bx = pv[o + 3] - ax, by = pv[o + 4] - ay, cx = pv[o + 6] - ax, cy = pv[o + 7] - ay;
      const det = bx * cy - by * cx;
      if (Math.abs(det) < 1e-12) continue;
      const s = ((u - ax) * cy - (v - ay) * cx) / det, t = (bx * (v - ay) - by * (u - ax)) / det;
      if (s < -1e-6 || t < -1e-6 || s + t > 1 + 1e-6) continue;
      if (pv[o + 2] + s * (pv[o + 5] - pv[o + 2]) + t * (pv[o + 8] - pv[o + 2]) > d + 0.05) return true;
    }
    return false;
  };
  const ocultos = [], visiveis = [];
  parte.todas.forEach(({ a, b }, i) => {
    if (!desenha[i]) return;
    const A = proj(...a), B = proj(...b);
    const n = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) / PASSO_AMOSTRA));
    const em = (t) => [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])];
    let estado = null, inicio = 0; // corrida atual: oculta ou visível, desde a amostra `inicio`
    for (let k = 0; k <= n; k++) {
      const oculto = coberto(...em(k / n), A[2] + (k / n) * (B[2] - A[2]));
      if (estado === null) estado = oculto;
      if (oculto !== estado || k === n) {
        const fim = oculto !== estado ? k - 1 : k;
        (estado ? ocultos : visiveis).push(...em(Math.max(0, (inicio - 0.5) / n)), ...em(Math.min(1, (fim + 0.5) / n)));
        estado = oculto; inicio = k;
      }
    }
  });
  return { ocultos, visiveis };
}

// Linhas ocultas tracejadas; por cima, os trechos visíveis outra vez em tinta, porque onde uma aresta oculta
// coincide com uma visível quem aparece é a visível.
function tracejar(ctx, parte, vista, mapa, cor) {
  vista.trechos ??= trechos(parte, vista);
  const tracar = (segs) => {
    ctx.beginPath();
    for (let i = 0; i < segs.length; i += 4) {
      ctx.moveTo(...ponto(mapa, [segs[i], segs[i + 1]]));
      ctx.lineTo(...ponto(mapa, [segs[i + 2], segs[i + 3]]));
    }
    ctx.stroke();
  };
  ctx.strokeStyle = cor.grafite; ctx.lineWidth = TRACO.oculta; ctx.lineCap = 'butt'; ctx.setLineDash([4, 3]);
  tracar(vista.trechos.ocultos);
  ctx.strokeStyle = cor.tinta; ctx.lineWidth = TRACO.visivel; ctx.lineCap = 'round'; ctx.setLineDash([]);
  tracar(vista.trechos.visiveis);
}

// Só as arestas, sem faces: o esboço em linha de construção.
function arame(ctx, parte, vista, mapa, cor) {
  ctx.strokeStyle = cor.construcao; ctx.lineWidth = TRACO.construcao; ctx.lineCap = 'round'; ctx.setLineDash([]);
  ctx.beginPath();
  parte.todas.forEach(({ a, b }, i) => {
    if (!vista.desenha[i]) return;
    ctx.moveTo(...ponto(mapa, vista.proj(...a)));
    ctx.lineTo(...ponto(mapa, vista.proj(...b)));
  });
  ctx.stroke();
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

// Linha de corte vertical em x, traço-ponto, extremos grossos, setas no sentido de quem olha e a letra A.
function linhaDeCorte(ctx, cor, x, y0, y1) {
  ctx.strokeStyle = ctx.fillStyle = cor.tinta; ctx.lineCap = 'butt';
  ctx.lineWidth = TRACO.corte; ctx.setLineDash([10, 3, 2, 3]);
  ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
  ctx.setLineDash([]); ctx.lineWidth = TRACO.visivel;
  ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + 8); ctx.moveTo(x, y1); ctx.lineTo(x, y1 - 8); ctx.stroke();
  ctx.lineWidth = TRACO.cota;
  for (const y of [y0, y1]) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y); ctx.stroke();
    ponta(ctx, x + 14, y, 1, 0);
    rotulo(ctx, cor.tinta, FONTE.cota, 'A', x - 5, y, 'right', 'middle');
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
  for (let c = x0 + y0; c <= x1 + y1; c += 5 * Math.SQRT2) { ctx.moveTo(c - y1, y1); ctx.lineTo(c - y0, y0); }
  ctx.stroke(); ctx.restore();
}

// Laços (pares [u, v] em mm, já no plano da vista) viram um caminho em px, com a caixa envolvente.
function caminhoDosLacos(lacos, mapa) {
  const caminho = new Path2D(), caixa = [Infinity, Infinity, -Infinity, -Infinity];
  for (const laco of lacos) {
    laco.forEach((q, i) => {
      const [x, y] = ponto(mapa, q);
      i ? caminho.lineTo(x, y) : caminho.moveTo(x, y);
      caixa[0] = Math.min(caixa[0], x); caixa[1] = Math.min(caixa[1], y); caixa[2] = Math.max(caixa[2], x); caixa[3] = Math.max(caixa[3], y);
    });
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

// Desenha quando o canvas se aproxima da tela; depois acompanha o tamanho e o tema.
function preguicoso(canvas, desenhar, redesenhos) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    dimensionar(canvas); desenhar();
    redesenhos.push(desenhar);
    new ResizeObserver(() => { if (dimensionar(canvas)) desenhar(); }).observe(canvas);
  }, { rootMargin: '200px' });
  io.observe(canvas);
}

// --- o hero: três vistas, cotas, corte e a perspectiva impressa ---

function montarHero(canvas, parte, redesenhos) {
  const vistas = { frontal: projetar(parte, VISTAS.frontal), superior: projetar(parte, VISTAS.superior), lateral: projetar(parte, VISTAS.lateral) };
  const [X, Y, Z] = parte.caixa.size;
  const centro = parte.caixa.min.map((v, i) => (v + parte.caixa.max[i]) / 2);
  const diagonal = Math.hypot(X, Y, Z);
  const angulo = { az: ISO.az, el: ISO.el };
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let comp, persp, fase = reduzido ? 'pronto' : 'espera', pedido = 0;
  const perspectiva = () => (persp ??= projetar(parte, orbita(angulo.az, angulo.el)));
  const estado = (t) => ({
    p: [0, 120, 240].map((inicio) => EASE_OUT(limita((t - inicio) / 460))),
    alfa: limita((t - 600) / 500),
    h: Z * limita((t - 900) / 1700),
  });
  const FINAL = estado(Infinity);

  // Composição em primeiro diedro: frontal no alto à esquerda, superior abaixo dela, lateral esquerda à
  // direita da frontal, perspectiva no quadrante de baixo à direita. Uma escala para as três vistas.
  function compor() {
    const W = canvas.clientWidth, H = canvas.clientHeight, mx = 0.06 * W, my = 0.06 * H;
    const s = Math.min((H - 2 * my - 75) / (Z + Y + 8), (W - 2 * mx - ESP_COTA - 24) / (X + Y));
    const sobra = W - 2 * mx - ESP_COTA - (X + Y) * s - 24;
    const vao = 24 + sobra / 3;
    const xf = mx + ESP_COTA, yf = (H - (s * (Z + Y + 8) + 75)) / 2;
    const coluna = { x: xf + X * s + vao, w: W - mx - (xf + X * s + vao) };
    const mapa = (vista, x, y) => ({ s, x: x - vista.ext.esq[0] * s, y: y - vista.ext.cima[1] * s });
    const baseRotulos = yf + s * (Z + Y + 8) + 75;
    const quadrante = { x: coluna.x - vao / 2, y: yf + Z * s + 48, w: W - (coluna.x - vao / 2), h: H - (yf + Z * s + 48) };
    const sp = 0.92 * Math.min(coluna.w, baseRotulos - 17 - quadrante.y) / diagonal;
    const cx = coluna.x + coluna.w / 2, cy = (quadrante.y + baseRotulos - 17) / 2;
    comp = {
      s, mx, my, baseRotulos, quadrante, cx,
      frontal: mapa(vistas.frontal, xf, yf),
      superior: mapa(vistas.superior, xf, yf + Z * s + 28 + 4 * s),
      lateral: mapa(vistas.lateral, coluna.x + (coluna.w - Y * s) / 2, yf),
      mapaPersp: (vista) => { const c = vista.proj(...centro); return { s: sp, x: cx - c[0] * sp, y: cy - c[1] * sp }; },
    };
  }

  function desenharTudo(est) {
    const t = performance.now(), cor = cores(), ctx = contexto(canvas, cor.papel), { s } = comp;
    const nomes = ['frontal', 'superior', 'lateral'];
    nomes.forEach((n, k) => pintar(ctx, parte, vistas[n], comp[n], cor, { p: est.p[k] }));
    if (est.alfa > 0) {
      ctx.globalAlpha = est.alfa;
      for (const n of nomes) tracejar(ctx, parte, vistas[n], comp[n], cor);
      const F = mapear(vistas.frontal.ext, comp.frontal), S = mapear(vistas.superior.ext, comp.superior), L = mapear(vistas.lateral.ext, comp.lateral);
      cota(ctx, cor, F.cima, F.baixo, 'y', F.esq[0] - 22, mm(Z));
      cota(ctx, cor, S.esq, S.dir, 'x', S.baixo[1] + 4 * s + 27, mm(X));
      cota(ctx, cor, L.esq, L.dir, 'x', L.baixo[1] + 22, mm(Y));
      linhaDeCorte(ctx, cor, comp.superior.x + PLANO_AA * s, S.cima[1] - 4 * s, S.baixo[1] + 4 * s);
      rotulo(ctx, cor.grafite, FONTE.rotulo, 'FRONTAL', (F.esq[0] + F.dir[0]) / 2, F.baixo[1] + 17);
      rotulo(ctx, cor.grafite, FONTE.rotulo, 'SUPERIOR', (S.esq[0] + S.dir[0]) / 2, comp.baseRotulos);
      rotulo(ctx, cor.grafite, FONTE.rotulo, 'LATERAL ESQUERDA', (L.esq[0] + L.dir[0]) / 2, L.baixo[1] + 42);
      ctx.globalAlpha = 1;
    }
    if (est.h > 0) desenharPerspectiva(ctx, cor, est.h, est.alfa);
    performance.measure('desenho:quadro', { start: t });
  }

  function desenharPerspectiva(ctx, cor, h, alfa) {
    const q = comp.quadrante;
    ctx.save(); ctx.beginPath(); ctx.rect(q.x, q.y, q.w, q.h); ctx.clip();
    ctx.fillStyle = cor.papel; ctx.fillRect(q.x, q.y, q.w, q.h);
    const vista = perspectiva();
    pintar(ctx, parte, vista, comp.mapaPersp(vista), cor, { h, camadas: true });
    ctx.globalAlpha = alfa;
    rotulo(ctx, cor.grafite, FONTE.rotulo, 'PERSPECTIVA', comp.cx, comp.baseRotulos);
    ctx.restore();
  }

  function redesenhar() {
    if (fase === 'pronto') desenharTudo(FINAL);
    else if (fase === 'espera') contexto(canvas, cores().papel);
  }

  function animar() {
    fase = 'animando';
    let t0;
    const quadro = (agora) => {
      t0 ??= agora;
      const t = agora - t0;
      desenharTudo(estado(t));
      if (t < 2600) requestAnimationFrame(quadro);
      else { fase = 'pronto'; desenharTudo(FINAL); }
    };
    requestAnimationFrame(quadro);
  }

  function agendar() { // só a perspectiva, num quadro; durante a animação o laço já a redesenha
    if (fase !== 'pronto' || pedido) return;
    pedido = requestAnimationFrame(() => { pedido = 0; desenharPerspectiva(contexto(canvas), cores(), Infinity, 1); });
  }

  function girar(dAz, dEl) {
    angulo.az += dAz;
    angulo.el = Math.min(70, Math.max(10, angulo.el + dEl));
    persp = null;
    agendar();
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

  const dentro = (e) => comp && e.offsetX >= comp.quadrante.x && e.offsetY >= comp.quadrante.y;
  let arrasto = null;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => {
    if (!dentro(e)) return;
    arrasto = [e.clientX, e.clientY];
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrasto) { canvas.style.cursor = dentro(e) ? 'grab' : ''; return; }
    girar((e.clientX - arrasto[0]) * 0.5, -(e.clientY - arrasto[1]) * 0.3);
    arrasto = [e.clientX, e.clientY];
  });
  const soltar = (e) => { arrasto = null; canvas.style.cursor = dentro(e) ? 'grab' : ''; };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('keydown', (e) => {
    const passo = { ArrowLeft: [-15, 0], ArrowRight: [15, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }[e.key];
    if (!passo || !comp) return;
    e.preventDefault();
    girar(...passo);
  });
}

// --- os quatro estados ---

function desenharFoto(canvas, parte, iso) {
  const W = canvas.clientWidth, m = 0.1 * W, cor = cores(), ctx = contexto(canvas, cor.papel);
  arame(ctx, parte, iso, encaixar(iso, { x: m, y: m, w: W - 2 * m, h: W - 2 * m }), cor);
}

function desenharCotas(canvas, parte, frontal) {
  const W = canvas.clientWidth, m = 0.1 * W, cor = cores(), ctx = contexto(canvas, cor.papel);
  const mapa = encaixar(frontal, { x: m + ESP_COTA, y: m, w: W - 2 * m - ESP_COTA, h: W - 2 * m - ESP_COTA });
  pintar(ctx, parte, frontal, mapa, cor);
  tracejar(ctx, parte, frontal, mapa, cor);
  const F = mapear(frontal.ext, mapa);
  cota(ctx, cor, F.cima, F.baixo, 'y', F.esq[0] - 22, mm(parte.caixa.size[2]));
  cota(ctx, cor, F.esq, F.dir, 'x', F.baixo[1] + 22, mm(parte.caixa.size[0]));
}

function desenharMesa(canvas, parte, superior) {
  const W = canvas.clientWidth, m = 0.1 * W, cor = cores(), ctx = contexto(canvas, cor.papel);
  const mapa = encaixar(superior, { x: m, y: m, w: W - 2 * m, h: W - 2 * m - 24 });
  pintar(ctx, parte, superior, mapa, cor);
  const base = loops(sliceAxis(parte.mesh, 2, 0.1)).map((laco) => laco.map(([x, y]) => [x, -y]));
  const { caminho, caixa } = caminhoDosLacos(base, mapa);
  hachurar(ctx, caminho, caixa, cor.tinta);
  rotulo(ctx, cor.grafite, FONTE.rotulo, 'BASE NA MESA', W / 2, W - m + 4);
}

function desenharCamadas(canvas, parte, iso) {
  const W = canvas.clientWidth, m = 0.1 * W, cor = cores(), ctx = contexto(canvas, cor.papel);
  pintar(ctx, parte, iso, encaixar(iso, { x: m, y: m, w: W - 2 * m, h: W - 2 * m - 24 }), cor, { camadas: true });
  rotulo(ctx, cor.grafite, FONTE.rotulo, `${parte.camadas} CAMADAS DE ${mm(CAMADA)} mm`, W / 2, W - m + 4);
}

// --- o corte A-A ---

function desenharCorte(canvas, parte, lateral) {
  const W = canvas.clientWidth, H = canvas.clientHeight, cor = cores(), ctx = contexto(canvas, cor.papel);
  const [, Y, Z] = parte.caixa.size, P = parte.mesh.positions;
  const mx = 0.05 * W, my = 0.08 * H;
  const s = Math.min((W - 2 * mx - ESP_COTA) / Y, (H - 2 * my - ESP_COTA) / Z);
  const x0 = (W - ESP_COTA - Y * s) / 2 + ESP_COTA, y0 = (H - ESP_COTA - Z * s) / 2;
  const mapa = { s, x: x0 - lateral.ext.esq[0] * s, y: y0 - lateral.ext.cima[1] * s };
  // atrás do plano, a metade que fica depois do corte, só em silhueta
  pintar(ctx, parte, lateral, mapa, cor, { filtro: (f) => P[f * 9] + P[f * 9 + 3] + P[f * 9 + 6] > 3 * PLANO_AA, corAresta: cor.grafite, largura: TRACO.oculta });
  // o material cortado, visto da esquerda: u = -y, v = -z
  const lacos = loops(sliceAxis(parte.mesh, 0, PLANO_AA)).map((laco) => laco.map(([y, z]) => [-y, -z]));
  const { caminho, caixa } = caminhoDosLacos(lacos, mapa);
  ctx.fillStyle = cor.papel; ctx.fill(caminho, 'evenodd');
  hachurar(ctx, caminho, caixa, cor.tinta);
  ctx.strokeStyle = cor.tinta; ctx.lineWidth = TRACO.visivel; ctx.lineJoin = 'round'; ctx.setLineDash([]); ctx.stroke(caminho);
  const L = mapear(lateral.ext, mapa);
  cota(ctx, cor, L.cima, L.baixo, 'y', L.esq[0] - 22, mm(Z));
  cota(ctx, cor, L.esq, L.dir, 'x', L.baixo[1] + 22, mm(Y));
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
