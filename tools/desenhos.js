// Gera assets/desenhos.json: o traço 2D de cada desenho da página, calculado a partir do STL da peça.
// O STL é o modelo que se vende e fica fora do repositório. O site recebe só o que aparece na tela, em mm no
// plano de cada vista, e nunca um ponto com três coordenadas.
// Uso: npm run desenhos -- [caminho-do-stl]   (sem caminho, lê STL_PADRAO)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseSTL, bounds, featureEdgeList, sliceAxis, loops, layerCount } from './stl.js';
import { VISTAS, orbita, ISO, recortaAbaixo } from './vistas.js';

export const STL_PADRAO = fileURLToPath(new URL('../../impressao-3d/saida/trava_conector_azul.stl', import.meta.url));
export const SAIDA = fileURLToPath(new URL('../assets/desenhos.json', import.meta.url));
export const PLANO_AA = 12.8; // y do corte A-A na trava: pelo eixo do furo, 0,05 mm fora do centro para não passar por vértices
const CAMADA = 0.2;
const PASSO_AMOSTRA = 0.4; // mm entre amostras na busca de linhas ocultas
const r2 = (v) => Math.round(v * 100) / 100 || 0; // 0,01 mm; o `|| 0` troca -0 por 0
const plano2 = (valores) => Array.from(valores, r2);
const extremos = (vista) => Object.fromEntries(Object.entries(vista.ext).map(([k, q]) => [k, plano2(q)]));

export function gerar(mesh, planoAA = PLANO_AA) {
  const parte = montarParte(mesh);
  const { size: [X, Y, Z], min, max } = parte.caixa;
  const lacosAA = loops(sliceAxis(mesh, 1, planoAA));
  if (!lacosAA.length) throw new Error(`o plano do corte A-A (y = ${planoAA}) não corta a peça`);
  const ortogonal = (proj) => {
    const vista = projetar(parte, proj), { visiveis, ocultos } = trechos(parte, vista);
    return { ext: extremos(vista), visiveis: plano2(visiveis), ocultos: plano2(ocultos) };
  };
  const iso = projetar(parte, orbita(ISO.az, ISO.el));
  const arame = []; // todas as arestas desenháveis da isométrica, sem tirar as ocultas: o esboço de "Você manda a foto"
  parte.todas.forEach(({ a, b }, i) => { if (iso.desenha[i]) arame.push(...iso.proj(...a).slice(0, 2), ...iso.proj(...b).slice(0, 2)); });
  const fundo = alemDoPlano(parte, planoAA), atras = projetar(fundo, VISTAS.frontal); // o que fica atrás do plano
  const achatar = (lacos, f) => lacos.map((laco) => plano2(laco.flatMap(f)));
  return {
    medidas: { largura: r2(X), profundidade: r2(Y), altura: r2(Z) },
    camada: CAMADA,
    camadas: parte.camadas,
    frontal: ortogonal(VISTAS.frontal),
    superior: { ...ortogonal(VISTAS.superior), base: achatar(loops(sliceAxis(mesh, 2, 0.1)), ([x, y]) => [x, -y]) },
    lateral: ortogonal(VISTAS.lateral),
    iso: {
      ext: extremos(iso),
      centro: plano2(iso.proj(...min.map((v, i) => (v + max[i]) / 2)).slice(0, 2)),
      visiveis: plano2(trechos(parte, iso).visiveis),
      arame: plano2(fundir(arame)),
      camadas: camadasVisiveis(parte, iso).map(plano2),
    },
    corte: {
      plano: planoAA,
      ext: extremos(atras),
      visiveis: plano2(trechos(fundo, atras).visiveis),
      lacos: achatar(lacosAA, ([x, z]) => [x, -z]),
    },
  };
}

function montarParte(mesh) {
  const chave = ({ a, b }) => `${a}|${b}`;
  const vivas = new Set(featureEdgeList(mesh, 30).map(chave));
  const todas = featureEdgeList(mesh, 0).map((e) => ({ ...e, viva: vivas.has(chave(e)) }));
  return { mesh, caixa: bounds(mesh), camadas: layerCount(mesh, CAMADA), todas };
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

// O ponto (u, v) na profundidade d fica atrás de alguma face de frente da vista?
function cobertura({ pv, ordem }) {
  const faces = ordem.map((f) => {
    const o = f * 9, u = [pv[o], pv[o + 3], pv[o + 6]], v = [pv[o + 1], pv[o + 4], pv[o + 7]];
    return { o, u0: Math.min(...u), u1: Math.max(...u), v0: Math.min(...v), v1: Math.max(...v) };
  });
  return (u, v, d) => {
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
}

// Trechos ocultos e visíveis de segmentos 3D na vista: amostra cada um a cada 0,4 mm, marca o ponto coberto por
// alguma face de frente mais próxima de quem olha e refina cada transição por bissecção (~0,05 mm).
// Devolve segmentos [u0, v0, u1, v1] em mm, ainda sem fundir.
function corridasDe(segs, vista, coberto) {
  const ocultos = [], visiveis = [];
  for (const [a, b] of segs) {
    const A = vista.proj(...a), B = vista.proj(...b);
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
  }
  return { ocultos, visiveis };
}

// Trechos ocultos e visíveis das arestas que se desenham na vista, já fundidos onde são colineares.
function trechos(parte, vista) {
  const segs = [];
  parte.todas.forEach(({ a, b }, i) => { if (vista.desenha[i]) segs.push([a, b]); });
  const { ocultos, visiveis } = corridasDe(segs, vista, cobertura(vista));
  return { ocultos: fundir(ocultos), visiveis: fundir(visiveis) };
}

// As linhas de camada que se veem na vista: em cada camada k, a fatia de cada face de frente no meio da camada
// (z = k * CAMADA + CAMADA / 2), sem os trechos cobertos. Uma lista de segmentos por camada.
function camadasVisiveis(parte, vista) {
  const P = parte.mesh.positions, coberto = cobertura(vista), porCamada = [];
  for (let k = 0; k < parte.camadas; k++) {
    const z = k * CAMADA + CAMADA / 2, segs = [];
    for (const f of vista.ordem) {
      const o = f * 9, zs = [P[o + 2], P[o + 5], P[o + 8]];
      if (z < Math.min(...zs) || z > Math.max(...zs)) continue;
      const s = sliceAxis({ count: 1, positions: P.subarray(o, o + 9) }, 2, z);
      if (s.length) segs.push([[s[0], s[1], z], [s[2], s[3], z]]);
    }
    porCamada.push(fundir(corridasDe(segs, vista, coberto).visiveis));
  }
  return porCamada;
}

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

if (import.meta.main) {
  const stl = process.argv[2] ?? STL_PADRAO;
  const json = `${JSON.stringify(gerar(parseSTL(new Uint8Array(readFileSync(stl)).buffer)))}\n`;
  writeFileSync(SAIDA, json);
  console.log(`${SAIDA}: ${json.length} bytes, a partir de ${stl}`);
}
