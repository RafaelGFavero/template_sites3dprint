// A trava desenhada a partir do STL: três vistas em primeiro diedro com cotas, eixos e a linha de corte,
// a perspectiva que se imprime camada por camada e gira sob o ponteiro, os quatro estados e o corte A-A.
import { parseSTL, bounds, featureEdgeList, sliceAxis, loops, layerCount } from './stl.js';
import { VISTAS, orbita, ISO, recortaAbaixo, mm } from './vistas.js';

const CAMADA = 0.2;
const FURO = { x: 0, y: 12.75, raio: 5.5, placa: 1.6 }; // das notas de projeto da peça; a placa em volta do furo, medida na malha
const PLANO_AA = 12.8; // y do corte A-A: pelo eixo do furo, 0,05 mm fora do centro para não passar por vértices
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
const PASSO_AMOSTRA = 0.4; // mm entre amostras na busca de linhas ocultas
const NOMES = { frontal: 'FRONTAL', superior: 'SUPERIOR', lateral: 'LATERAL ESQUERDA', perspectiva: 'PERSPECTIVA' };
const EASE_OUT = bezier(0.23, 1, 0.32, 1);
const limita = (v) => Math.min(1, Math.max(0, v));

export async function iniciar() {
  const principal = document.getElementById('desenho-principal');
  if (!principal) return;
  try {
    const [buffer] = await Promise.all([
      fetch('assets/models/trava-conector.stl').then((r) => { if (!r.ok) throw new Error(`STL ${r.status}`); return r.arrayBuffer(); }),
      document.fonts.load(FONTE.cota).catch(() => {}),
    ]);
    const parte = montarParte(parseSTL(buffer));
    const vistas = {
      frontal: projetar(parte, VISTAS.frontal), superior: projetar(parte, VISTAS.superior),
      lateral: projetar(parte, VISTAS.lateral), iso: projetar(parte, orbita(ISO.az, ISO.el)),
    };
    const redesenhos = [];
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => redesenhos.forEach((f) => f()));
    montarHero(principal, parte, vistas, redesenhos);
    const estados = {
      foto: (c) => desenharFoto(c, parte, vistas.iso),
      cotas: (c) => desenharCotas(c, parte, vistas.frontal),
      mesa: (c) => desenharMesa(c, parte, vistas.superior),
      camadas: (c) => desenharCamadas(c, parte, vistas.iso),
    };
    for (const c of document.querySelectorAll('canvas.estado')) preguicoso(c, () => estados[c.dataset.estado]?.(c), redesenhos);
    const corte = document.getElementById('corte');
    if (corte) { // já no quadro seguinte, sem esperar rolagem; fora da tarefa do primeiro desenho do hero
      const desenhar = montarCorte(corte, parte);
      requestAnimationFrame(() => { dimensionar(corte); desenhar(); acompanhar(corte, desenhar, redesenhos); });
    }
  } catch (e) {
    console.warn(`desenho: ${e.message}`); // sem o modelo, os canvas ficam em branco
  }
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

// A parte da malha com y >= plano, com os triângulos que cruzam o plano recortados nele.
function alemDoPlano(parte, plano) {
  const { positions: P, normals: N, count } = parte.mesh, pos = [], nor = [];
  for (let f = 0; f < count; f++) {
    const tri = [0, 3, 6].map((k) => [P[f * 9 + k], P[f * 9 + k + 1], P[f * 9 + k + 2]]);
    // recortaAbaixo guarda z <= h; trocando (x, y, z) por (x, z, -y), "y >= plano" vira "z' <= -plano"
    const poligono = recortaAbaixo(tri.map(([x, y, z]) => [x, z, -y]), -plano).map(([x, z, ny]) => [x, -ny, z]);
    for (let i = 1; i + 1 < poligono.length; i++) { pos.push(...poligono[0], ...poligono[i], ...poligono[i + 1]); nor.push(N[f * 3], N[f * 3 + 1], N[f * 3 + 2]); }
  }
  return montarParte({ count: pos.length / 9, positions: Float32Array.from(pos), normals: Float32Array.from(nor) });
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
// Encaixa a vista em W×H com margem m, reservando ESP_COTA à esquerda para a cota vertical, COTA + 3 embaixo
// para a horizontal e `eixo` mm em cima e embaixo para a linha de centro que passa do contorno; centra o conjunto.
function encaixarComCotas(vista, W, H, m, eixo = 0) {
  const { esq, dir, cima, baixo } = vista.ext, w = dir[0] - esq[0], h = baixo[1] - cima[1] + 2 * eixo, sob = COTA + 3;
  const s = Math.min((W - 2 * m - ESP_COTA) / w, (H - 2 * m - sob) / h);
  return { s, x: (W - ESP_COTA - w * s) / 2 + ESP_COTA - esq[0] * s, y: (H - sob - h * s) / 2 + eixo * s - cima[1] * s };
}

// Algoritmo do pintor: cada face de frente, de trás para a frente, é preenchida com papel e recebe as arestas
// que a tocam. `h` recorta a peça abaixo dessa altura (a impressão em andamento) e fecha a tampa; `camadas`
// traça as linhas de camada nas faces visíveis.
function pintar(ctx, parte, vista, mapa, cor, { h = Infinity, camadas = false } = {}) {
  const { mesh, todas, porFace, caixa } = parte, P = mesh.positions;
  const { pv, ordem, desenha, proj } = vista;
  const M = (q) => ponto(mapa, q);
  const recorta = h < caixa.max[2];
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.setLineDash([]);
  for (const f of ordem) {
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
    ctx.fillStyle = cor.papel;
    ctx.fill(); ctx.fill(); // duas vezes: pela emenda com a face vizinha vaza 6% do que está atrás, não 25%
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
        ctx.moveTo(ax - ex, ay - ey); // 0,7px além da face: repõe o que a emenda da face vizinha atenua
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
      ctx.moveTo(...M(proj(...a)));
      ctx.lineTo(...M(proj(...b)));
    }
    ctx.strokeStyle = cor.tinta; ctx.lineWidth = TRACO.visivel; ctx.stroke();
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

// Trechos ocultos e visíveis das arestas da vista: amostra cada aresta a cada 0,4 mm, marca o ponto coberto por
// alguma face de frente mais próxima de quem olha e refina cada transição por bissecção (~0,05 mm).
// Devolve segmentos [u0, v0, u1, v1] em mm, já fundidos onde são colineares.
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
    const oculto = (t) => coberto(...em(t), A[2] + t * (B[2] - A[2]));
    let estado = oculto(0), inicio = 0; // corrida atual e o t onde começou
    for (let k = 1; k <= n; k++) {
      if (oculto(k / n) === estado) continue;
      let lo = (k - 1) / n, hi = k / n;
      for (let j = 0; j < 3; j++) { const meio = (lo + hi) / 2; if (oculto(meio) === estado) lo = meio; else hi = meio; }
      const t = (lo + hi) / 2;
      (estado ? ocultos : visiveis).push(...em(inicio), ...em(t));
      estado = !estado; inicio = t;
    }
    (estado ? ocultos : visiveis).push(...em(inicio), ...em(1));
  });
  return { ocultos: fundir(ocultos), visiveis: fundir(visiveis) };
}
const corridas = (parte, vista) => (vista.trechos ??= trechos(parte, vista));

// Une trechos colineares que se sobrepõem numa mesma linha de suporte e devolve cada um uma vez, da esquerda
// para a direita: sem isso o tracejado recomeça a cada trecho e trechos coincidentes em sentidos opostos
// viram uma linha contínua.
function fundir(segs) {
  const linhas = []; // { p, d: direção unitária, trechos: [[t0, t1], ...] }
  for (let i = 0; i < segs.length; i += 4) {
    const a = [segs[i], segs[i + 1]], b = [segs[i + 2], segs[i + 3]], c = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (c < 1e-6) continue;
    const d = [(b[0] - a[0]) / c, (b[1] - a[1]) / c];
    let linha = linhas.find((l) => Math.abs(l.d[0] * d[1] - l.d[1] * d[0]) < 2e-3 && Math.abs((a[0] - l.p[0]) * l.d[1] - (a[1] - l.p[1]) * l.d[0]) < 0.03);
    if (!linha) linhas.push(linha = { p: a, d: d[0] < 0 || (d[0] === 0 && d[1] < 0) ? [-d[0], -d[1]] : d, trechos: [] });
    const t = (q) => (q[0] - linha.p[0]) * linha.d[0] + (q[1] - linha.p[1]) * linha.d[1];
    linha.trechos.push([Math.min(t(a), t(b)), Math.max(t(a), t(b))]);
  }
  const out = [];
  for (const { p, d, trechos: ts } of linhas) {
    ts.sort((x, y) => x[0] - y[0]);
    const emitir = (t0, t1) => out.push(p[0] + t0 * d[0], p[1] + t0 * d[1], p[0] + t1 * d[0], p[1] + t1 * d[1]);
    let [ini, fim] = ts[0];
    for (const [t0, t1] of ts.slice(1)) {
      if (t0 <= fim + 0.05) fim = Math.max(fim, t1);
      else { emitir(ini, fim); [ini, fim] = [t0, t1]; }
    }
    emitir(ini, fim);
  }
  return out;
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

// Só as arestas, sem faces: o esboço em linha de construção.
function arame(ctx, parte, vista, mapa, cor) {
  estiloVisivel(ctx, cor, TRACO.construcao, cor.construcao);
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

function montarHero(canvas, parte, { frontal, superior, lateral, iso }, redesenhos) {
  const tres = { frontal, superior, lateral }, nomes = Object.keys(tres);
  const [X, Y, Z] = parte.caixa.size, topo = parte.caixa.max[2];
  const centro = parte.caixa.min.map((v, i) => (v + parte.caixa.max[i]) / 2);
  const diagonal = Math.hypot(X, Y, Z);
  const angulo = { az: ISO.az, el: ISO.el };
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let comp, persp = iso, fase = reduzido ? 'pronto' : 'espera', pedido = 0, ultimoT = 0;
  const perspectiva = () => (persp ??= projetar(parte, orbita(angulo.az, angulo.el)));
  const estado = (t) => ({
    p: [0, 120, 240].map((inicio) => EASE_OUT(limita((t - inicio) / 460))),
    alfa: EASE_OUT(limita((t - 600) / 500)),
    h: Z * limita((t - 900) / 1700),
  });
  const FINAL = estado(Infinity);

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
    const quadrante = { x: xf + (X + ALEM) * s + LETRA_A, y: rotuloLateral + FOLGA };
    quadrante.w = W - quadrante.x; quadrante.h = base - (FOLGA + ROTULO_H) - quadrante.y;
    const sp = (0.96 * Math.min(coluna.w, quadrante.h)) / diagonal;
    const cx = coluna.x + coluna.w / 2, cy = quadrante.y + quadrante.h / 2;
    const mapa = (vista, x, y) => ({ s, x: x - vista.ext.esq[0] * s, y: y - vista.ext.cima[1] * s });
    comp = {
      s, quadrante,
      frontal: mapa(frontal, xf, yf), superior: mapa(superior, xf, ys), lateral: mapa(lateral, lx, yf),
      cotas: { altura: xf - COTA, largura: fundoS + COTA, profundidade: fundoF + EIXO * s + COTA },
      rotulos: { frontal: [xf + (X * s) / 2, fundoF + EIXO * s + SOB_EIXO], superior: [xf + (X * s) / 2, base], lateral: [lx + (Y * s) / 2, rotuloLateral], perspectiva: [cx, base] },
      mapaPersp: (vista) => { const c = vista.proj(...centro); return { s: sp, x: cx - c[0] * sp, y: cy - c[1] * sp }; },
    };
  }

  function desenharTudo(est) {
    const cor = cores(), ctx = contexto(canvas, cor.papel), { s } = comp;
    if (est.alfa > 0) { // os tracejados ficam por baixo da tinta: onde uma oculta coincide com uma visível, vence a visível
      ctx.globalAlpha = est.alfa;
      estiloOculta(ctx, cor);
      for (const n of nomes) tracar(ctx, corridas(parte, tres[n]).ocultos, comp[n]);
      ctx.globalAlpha = 1;
    }
    estiloVisivel(ctx, cor); // as arestas visíveis em peso cheio, por cima dos tracejados, desde o primeiro quadro
    nomes.forEach((n, k) => tracar(ctx, corridas(parte, tres[n]).visiveis, comp[n], est.p[k]));
    if (est.alfa > 0) {
      ctx.globalAlpha = est.alfa;
      const F = mapear(frontal.ext, comp.frontal), S = mapear(superior.ext, comp.superior), L = mapear(lateral.ext, comp.lateral);
      cota(ctx, cor, F.cima, F.baixo, 'y', comp.cotas.altura, mm(Z));
      cota(ctx, cor, S.esq, S.dir, 'x', comp.cotas.largura, mm(X));
      cota(ctx, cor, L.esq, L.dir, 'x', comp.cotas.profundidade, mm(Y));
      // eixos: a simetria na frontal, o furo na superior (o horizontal é a própria A-A) e na lateral, pela placa
      linhaDeCentro(ctx, cor, ponto(comp.frontal, [0, -(topo + EIXO)]), ponto(comp.frontal, [0, EIXO]));
      linhaDeCentro(ctx, cor, ponto(comp.superior, [FURO.x, -(FURO.y + FURO.raio + EIXO)]), ponto(comp.superior, [FURO.x, -(FURO.y - FURO.raio - EIXO)]));
      linhaDeCentro(ctx, cor, ponto(comp.lateral, [-FURO.y, -(FURO.placa + EIXO)]), ponto(comp.lateral, [-FURO.y, EIXO]));
      linhaDeCorte(ctx, cor, ponto(comp.superior, [0, -PLANO_AA])[1], S.esq[0] - ALEM * s, S.dir[0] + ALEM * s);
      for (const [n, [x, y]] of Object.entries(comp.rotulos)) rotulo(ctx, cor.grafite, FONTE.rotulo, NOMES[n], x, y);
      ctx.globalAlpha = 1;
    }
    if (est.h > 0) desenharPerspectiva(ctx, cor, est.h);
  }

  function desenharPerspectiva(ctx, cor, h) {
    const q = comp.quadrante;
    ctx.save(); ctx.beginPath(); ctx.rect(q.x, q.y, q.w, q.h); ctx.clip();
    ctx.fillStyle = cor.papel; ctx.fillRect(q.x, q.y, q.w, q.h);
    const vista = perspectiva();
    pintar(ctx, parte, vista, comp.mapaPersp(vista), cor, { h, camadas: true });
    ctx.restore();
  }

  function redesenhar() {
    if (fase === 'pronto') desenharTudo(FINAL);
    else if (fase === 'animando') desenharTudo(estado(ultimoT));
    else contexto(canvas, cores().papel);
  }

  function animar() {
    fase = 'animando';
    let t0;
    const quadro = (agora) => {
      t0 ??= agora;
      ultimoT = agora - t0;
      desenharTudo(estado(ultimoT));
      if (ultimoT < 2600) requestAnimationFrame(quadro);
      else { fase = 'pronto'; desenharTudo(FINAL); }
    };
    requestAnimationFrame(quadro);
  }

  function agendar() { // só a perspectiva, num quadro; durante a animação o laço já a redesenha
    if (fase !== 'pronto' || pedido) return;
    pedido = requestAnimationFrame(() => { pedido = 0; desenharPerspectiva(contexto(canvas), cores(), Infinity); });
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

  // Girar: a peça acompanha o ponteiro (arrastar para a direita leva a face da frente para a direita).
  const dentro = (e) => { const q = comp?.quadrante; return !!q && e.offsetX >= q.x && e.offsetX <= q.x + q.w && e.offsetY >= q.y && e.offsetY <= q.y + q.h; };
  let arrasto = null; // { id, x, y }
  canvas.style.touchAction = 'pan-y pinch-zoom';
  canvas.addEventListener('pointerdown', (e) => {
    if (arrasto || !e.isPrimary || e.button !== 0 || !dentro(e)) return;
    arrasto = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrasto) { canvas.style.cursor = dentro(e) ? 'grab' : ''; return; }
    if (e.pointerId !== arrasto.id) return;
    girar(-(e.clientX - arrasto.x) * 0.5, (e.clientY - arrasto.y) * 0.3);
    arrasto.x = e.clientX; arrasto.y = e.clientY;
  });
  const soltar = (e) => { if (arrasto && e.pointerId === arrasto.id) { arrasto = null; canvas.style.cursor = dentro(e) ? 'grab' : ''; } };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('keydown', (e) => { // cada seta faz o que arrastar naquele sentido faria
    const passo = { ArrowRight: [-15, 0], ArrowLeft: [15, 0], ArrowDown: [0, 5], ArrowUp: [0, -5] }[e.key];
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
  const W = canvas.clientWidth, cor = cores(), ctx = contexto(canvas, cor.papel);
  const mapa = encaixarComCotas(frontal, W, W, 0.08 * W, EIXO), { ocultos, visiveis } = corridas(parte, frontal);
  estiloOculta(ctx, cor); tracar(ctx, ocultos, mapa);
  estiloVisivel(ctx, cor); tracar(ctx, visiveis, mapa);
  linhaDeCentro(ctx, cor, ponto(mapa, [0, -(parte.caixa.max[2] + EIXO)]), ponto(mapa, [0, EIXO]));
  const F = mapear(frontal.ext, mapa);
  cota(ctx, cor, F.cima, F.baixo, 'y', F.esq[0] - COTA, mm(parte.caixa.size[2]));
  cota(ctx, cor, F.esq, F.dir, 'x', F.baixo[1] + EIXO * mapa.s + COTA, mm(parte.caixa.size[0]));
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

// --- o corte A-A: o plano y = PLANO_AA visto da frente (u = x, v = -z) ---

function montarCorte(canvas, parte) {
  const fundo = alemDoPlano(parte, PLANO_AA), vista = projetar(fundo, VISTAS.frontal); // o que fica atrás do plano
  const lacos = loops(sliceAxis(parte.mesh, 1, PLANO_AA)).map((laco) => laco.map(([x, z]) => [x, -z]));
  const [X, , Z] = parte.caixa.size;
  return () => {
    const W = canvas.clientWidth, H = canvas.clientHeight, cor = cores(), ctx = contexto(canvas, cor.papel);
    const mapa = encaixarComCotas(vista, W, H, 0.06 * Math.min(W, H));
    estiloVisivel(ctx, cor, TRACO.oculta, cor.grafite); // atrás do corte, só o que se vê, em grafite
    tracar(ctx, corridas(fundo, vista).visiveis, mapa);
    const { caminho, caixa } = caminhoDosLacos(lacos, mapa);
    ctx.fillStyle = cor.papel; ctx.fill(caminho, 'evenodd');
    hachurar(ctx, caminho, caixa, cor.tinta);
    ctx.strokeStyle = cor.tinta; ctx.lineWidth = TRACO.visivel; ctx.lineJoin = 'round'; ctx.setLineDash([]); ctx.stroke(caminho);
    const E = mapear(vista.ext, mapa);
    cota(ctx, cor, E.cima, E.baixo, 'y', E.esq[0] - COTA, mm(Z));
    cota(ctx, cor, E.esq, E.dir, 'x', E.baixo[1] + COTA, mm(X));
  };
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
