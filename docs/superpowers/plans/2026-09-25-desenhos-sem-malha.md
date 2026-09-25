# Desenhos sem malha no site: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A página volta a mostrar os desenhos da trava sem publicar nenhuma geometria 3D: o traço 2D de cada desenho é calculado fora do site e lido de `assets/desenhos.json`.

**Architecture:** O cálculo que dependia da malha (arestas, linhas ocultas, fatias, corte) sai de `assets/js/desenho.js` e vai para uma ferramenta de Node em `tools/`, que lê o STL de fora do repositório e grava `assets/desenhos.json`. O `desenho.js` continua desenhando em canvas, com os mesmos pesos, cores, cotas e escalas, mas a partir do JSON. O giro da perspectiva sai, e a impressão do hero passa a ser esboço, camadas e tinta.

**Tech Stack:** HTML, CSS e ES modules puros; Node 24 (`node --test`, `import.meta.main`); Canvas 2D; Playwright só para a verificação, fora do repositório.

Especificação: `docs/superpowers/specs/2026-09-25-desenhos-sem-malha-design.md`.

## Global Constraints

- O STL ou qualquer outra malha nunca entra em `assets/`, no repositório ou no site. O `.gitignore` já recusa `*.stl`, `*.3mf`, `*.obj`, `*.ply`, `*.glb`, `*.gltf`, `*.blend`, `*.step` e `*.stp`; nunca use `git add -f` neles.
- O STL da trava fica em `C:\Users\rafael.favero.RIOSOFT\Documents\Claude\impressao-3d\saida\trava_conector_azul.stl`, ou seja, `../impressao-3d/saida/trava_conector_azul.stl` a partir da raiz do repositório. Só leia esse arquivo; não o copie para dentro do repositório.
- `assets/desenhos.json` guarda só pontos 2D (mm no plano de cada vista, u para a direita, v para baixo), arredondados a 0,01 mm, e nenhum ponto com três coordenadas.
- Sem dependência nova no `package.json`.
- Pesos de linha, cores, fontes, constantes de composição e curvas de movimento do `desenho.js` não mudam, salvo o que este plano diz.
- Comentários, documentos e mensagens de commit em português do Brasil. Toda mensagem de commit termina com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Raiz do repositório: `C:\Users\rafael.favero.RIOSOFT\Documents\Claude\template_sites3dprint`, branch `feat/desenhos-sem-malha`. Não faça push.
- Pasta de rascunho para scripts de verificação: `C:\Users\RAFAEL~1.RIO\AppData\Local\Temp\claude\C--Users-rafael-favero-RIOSOFT-Documents-Claude\c5368272-cf9b-474b-8fdd-d6c096615e06\scratchpad` (chamada abaixo de `$RASCUNHO`). O `playwright-core` já está instalado em `$RASCUNHO/tools`, e o Chrome da máquina roda com `channel: 'chrome'`.
- Prova por mutação: todo teste novo precisa falhar com a lógica quebrada. Quebre, rode, veja falhar, desfaça, veja passar.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `tools/stl.js` | Movido de `assets/js/`. Lê o STL binário, fatia, acha arestas. Sem mudança de código. |
| `tools/vistas.js` | Movido de `assets/js/`. Projeções, órbita, recorte. Perde `mm`, que é da página. |
| `tools/cubo.js` | Novo. O cubo sintético dos testes, tirado de `stl.test.js`. |
| `tools/desenhos.js` | Novo. `gerar(mesh, planoAA)` devolve o objeto do JSON; rodado direto, grava `assets/desenhos.json`. |
| `tools/*.test.js` | `stl.test.js` e `vistas.test.js` movidos; `desenhos.test.js` novo. |
| `assets/desenhos.json` | Gerado. O traço de todos os desenhos. |
| `assets/js/desenho.js` | Reescrito para ler o JSON. Sem giro. Abertura do hero com esboço, camadas e tinta. |
| `assets/js/desenho.test.js` | Novo. `mm` e o roteiro `quadroHero`. |
| `index.html`, `assets/css/style.css` | O canvas do hero deixa de receber foco; a legenda perde a dica de arrastar. |
| `README.md`, `DESIGN.md`, `.impeccable/design.json` | Documentação do novo caminho. |

---

### Task 1: A ferramenta que gera `assets/desenhos.json`

**Files:**
- Move: `assets/js/stl.js` → `tools/stl.js`, `assets/js/stl.test.js` → `tools/stl.test.js`, `assets/js/vistas.js` → `tools/vistas.js`, `assets/js/vistas.test.js` → `tools/vistas.test.js`
- Create: `tools/cubo.js`, `tools/desenhos.js`, `tools/desenhos.test.js`, `assets/desenhos.json`
- Modify: `package.json`, `tools/stl.test.js`, `tools/vistas.js`, `tools/vistas.test.js`, `README.md`

**Interfaces:**
- Consumes: de `tools/stl.js`, `parseSTL(buffer) -> { count, positions: Float32Array (9 por triângulo), normals: Float32Array (3 por triângulo) }`, `bounds(mesh) -> { min, max, size }` (arrays de 3), `featureEdgeList(mesh, anguloGraus) -> Array<{ a:[x,y,z], b:[x,y,z], faces:number[] }>`, `sliceAxis(mesh, eixo, valor) -> number[]` (4 números por segmento: no eixo 2 são `x0, y0, x1, y1`; no eixo 1, `x0, z0, x1, z1`), `loops(segs) -> Array<Array<[a, b]>>` (só laços fechados), `layerCount(mesh, camada) -> number`. De `tools/vistas.js`, `VISTAS.frontal|superior|lateral(x, y, z) -> [u, v, profundidade]`, `orbita(az, el)`, `ISO = { az, el }`, `recortaAbaixo(tri, h)`.
- Produces: `tools/desenhos.js` exporta `gerar(mesh, planoAA = PLANO_AA)`, `STL_PADRAO` (caminho absoluto do STL da trava), `SAIDA` (caminho absoluto de `assets/desenhos.json`) e `PLANO_AA` (12,8). O JSON tem esta forma, que a Task 2 lê:

```
{
  medidas: { largura, profundidade, altura },          // mm, 2 casas
  camada: 0.2, camadas: 132,
  frontal:  { ext, visiveis, ocultos },
  superior: { ext, visiveis, ocultos, base },
  lateral:  { ext, visiveis, ocultos },
  iso:      { ext, centro, visiveis, arame, camadas },
  corte:    { plano, ext, visiveis, lacos }
}
ext = { esq:[u,v], dir:[u,v], cima:[u,v], baixo:[u,v] }   // pontos extremos da projeção
visiveis, ocultos, arame = [u0, v0, u1, v1, u0, v0, ...]   // segmentos, 4 números cada
base, lacos = [[u0, v0, u1, v1, ...], ...]                  // laços fechados, 2 números por ponto
iso.centro = [u, v]                                         // centro da caixa da peça, projetado
iso.camadas = [[segmentos da camada 0], [da camada 1], ...] // uma lista por camada, na altura k * camada + camada / 2
```

- [ ] **Step 1: Mover os módulos da malha para `tools/`**

```bash
cd /c/Users/rafael.favero.RIOSOFT/Documents/Claude/template_sites3dprint
mkdir -p tools
git mv assets/js/stl.js tools/stl.js
git mv assets/js/stl.test.js tools/stl.test.js
git mv assets/js/vistas.js tools/vistas.js
git mv assets/js/vistas.test.js tools/vistas.test.js
```

- [ ] **Step 2: Criar `tools/cubo.js` com o cubo que hoje está no fim de `stl.test.js`**

```js
// Cubo unitário em STL binário para os testes: 12 triângulos, cada face quadrada dividida por uma diagonal.
// `altura` estica o z.
export function cubeSTL(altura = 1) {
  const v = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  const buf = new ArrayBuffer(84 + faces.length * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, faces.length, true);
  faces.forEach((f, i) => {
    const o = 84 + i * 50;
    f.forEach((vi, k) => v[vi].forEach((c, j) => dv.setFloat32(o + 12 + k * 12 + j * 4, j === 2 ? c * altura : c, true)));
  });
  return buf;
}
```

- [ ] **Step 3: Ajustar `tools/stl.test.js`**

Troque o cabeçalho do arquivo (dos `import` até a linha `const buffer = ...`) por:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseSTL, bounds, featureEdgeList, sliceAxis, loops, layerCount } from './stl.js';
import { cubeSTL } from './cubo.js';
import { STL_PADRAO } from './desenhos.js';

// O STL da trava é o modelo que se vende e fica fora do repositório, que é público. Os testes com a peça
// real rodam onde ele existe e são pulados no resto.
const semSTL = !existsSync(STL_PADRAO) && 'sem o STL da trava em ../impressao-3d/saida';
const buffer = semSTL ? null : new Uint8Array(readFileSync(STL_PADRAO)).buffer;
```

Apague do fim do arquivo o comentário `// Cubo unitário em STL binário...` e a função `cubeSTL` inteira. Os testes em si não mudam, inclusive os `{ skip: semSTL }`.

`stl.test.js` passa a importar `./desenhos.js`, que só existe no Step 7. Até lá ele falha na importação; é esperado.

- [ ] **Step 4: Tirar `mm` de `tools/vistas.js` e do teste**

Em `tools/vistas.js`, apague a última linha:

```js
export const mm = (valor) => valor.toFixed(1).replace('.', ',');
```

Em `tools/vistas.test.js`, troque a importação por

```js
import { VISTAS, orbita, ISO, recortaAbaixo } from './vistas.js';
```

e apague o teste `'cotas com vírgula e uma casa'` inteiro. Ele volta na Task 2, junto do `mm` que a página usa.

- [ ] **Step 5: Apontar os scripts do `package.json` para as duas pastas**

`package.json` inteiro:

```json
{
  "name": "rf-tecnologia-3d-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test assets/js/*.test.js tools/*.test.js",
    "desenhos": "node tools/desenhos.js"
  }
}
```

- [ ] **Step 6: Escrever o teste que falha, `tools/desenhos.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseSTL } from './stl.js';
import { cubeSTL } from './cubo.js';
import { gerar, STL_PADRAO, SAIDA } from './desenhos.js';

const comprimento = (segs) => {
  let soma = 0;
  for (let i = 0; i < segs.length; i += 4) soma += Math.hypot(segs[i + 2] - segs[i], segs[i + 3] - segs[i + 1]);
  return soma;
};
const cubo = () => gerar(parseSTL(cubeSTL()), 0.5); // o corte A-A do cubo passa pelo meio dele

test('cubo: medidas, camadas e o contorno da vista frontal', () => {
  const d = cubo();
  assert.deepEqual(d.medidas, { largura: 1, profundidade: 1, altura: 1 });
  assert.equal(d.camadas, 5);
  assert.equal(d.frontal.visiveis.length, 16); // as quatro arestas da face da frente
  assert.equal(comprimento(d.frontal.visiveis).toFixed(2), '4.00');
});

test('cubo: cada camada tem só as duas linhas das faces que a isométrica mostra', () => {
  assert.deepEqual(cubo().iso.camadas.map((c) => c.length), [8, 8, 8, 8, 8]);
});

test('cubo: o corte A-A fecha um laço', () => {
  assert.equal(cubo().corte.lacos.length, 1);
});

test('plano de corte que não passa pela peça é recusado', () => {
  assert.throws(() => gerar(parseSTL(cubeSTL()), 5), /não corta a peça/);
});

const semSTL = !existsSync(STL_PADRAO) && 'sem o STL da trava em ../impressao-3d/saida';

test('o desenhos.json do repositório é o que o STL da trava gera agora', { skip: semSTL }, () => {
  const dados = gerar(parseSTL(new Uint8Array(readFileSync(STL_PADRAO)).buffer));
  assert.deepEqual(JSON.parse(readFileSync(SAIDA, 'utf8')), dados); // comparado já lido: o git pode trocar o fim de linha
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL em `tools/desenhos.test.js` e em `tools/stl.test.js` com `Cannot find module` para `tools/desenhos.js`.

- [ ] **Step 8: Escrever `tools/desenhos.js`**

As funções `montarParte`, `alemDoPlano`, `projetar` e `fundir` vêm de `assets/js/desenho.js` quase sem mudança (`montarParte` perde `arestas` e `porFace`, que só o algoritmo do pintor usava). `trechos` foi dividida em `cobertura` e `corridasDe` para servir também às linhas de camada.

```js
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
```

- [ ] **Step 9: Rodar os testes do cubo**

Run: `node --test tools/*.test.js`
Expected: os testes do cubo passam; `'o desenhos.json do repositório...'` falha com `ENOENT` porque o JSON ainda não existe; o resto de `stl.test.js` e `vistas.test.js` passa.

- [ ] **Step 10: Gerar o JSON**

Run: `npm run desenhos`
Expected: uma linha como `...\assets\desenhos.json: 64976 bytes, a partir de ...\trava_conector_azul.stl`. O tamanho medido no protótipo foi 64 975 bytes mais a quebra de linha; qualquer valor entre 60 e 70 KB está certo.

Confira que nenhum número ficou com mais de duas casas e que não há malha:

```bash
node -e "const s=require('fs').readFileSync('assets/desenhos.json','utf8'); console.log(/\d\.\d{3}/.test(s) ? 'MAIS DE 2 CASAS' : 'ok 2 casas', /positions|normals/.test(s) ? 'TEM MALHA' : 'sem malha')"
```

- [ ] **Step 11: Rodar tudo**

Run: `npm test`
Expected: PASS em todos, 0 pulados nesta máquina.

- [ ] **Step 12: Provar por mutação**

Faça cada mutação, rode `npm test`, confirme a falha indicada e desfaça:

1. Em `camadasVisiveis`, troque `corridasDe(segs, vista, coberto).visiveis` por `.ocultos`. Falha `'cubo: cada camada tem só as duas linhas...'` (as camadas ficam vazias).
2. Em `gerar`, apague a linha do `throw new Error(...)`. Falha `'plano de corte que não passa pela peça é recusado'` (o erro vira `TypeError`).
3. Em `assets/desenhos.json`, troque um número qualquer. Falha `'o desenhos.json do repositório é o que o STL da trava gera agora'`.

Depois de desfazer as três, `npm test` volta a passar.

- [ ] **Step 13: Atualizar o README nas partes da ferramenta**

Troque o parágrafo que começa com `O comando roda \`node --test assets/js/*.test.js\`.` (seção "Testar") por:

```markdown
O comando roda `node --test assets/js/*.test.js tools/*.test.js`. Em `tools/`, `stl.test.js` confere a leitura e o fatiamento da malha, `vistas.test.js` as projeções e `desenhos.test.js` o traço que a ferramenta gera. Os testes com a trava de verdade leem o STL de `../impressao-3d/saida/trava_conector_azul.stl` e são pulados onde ele não existe; um deles confere que o `assets/desenhos.json` do repositório é o que esse STL gera. Em `assets/js/`, `whatsapp.test.js` confere a mensagem e o link do WhatsApp, inclusive os quatro links gravados no `index.html`, e `sem-malha.test.js` falha se aparecer um modelo 3D em `assets/`. Não há nada para instalar, porque o `package.json` não tem dependências. Os testes foram rodados no Node 24.
```

Troque os dois primeiros parágrafos da seção "Trocar a peça desenhada" (o que começa com `Todo o desenho sai de` e o que começa com `Duas constantes de`) por:

````markdown
O traço de todos os desenhos está em `assets/desenhos.json`, gerado a partir do STL da peça. O STL é o modelo que se vende e fica fora deste repositório, que é público. O `.gitignore` recusa arquivos de modelo 3D, um teste falha se aparecer um em `assets/` e o deploy para com erro se encontrar um no que vai publicar. O STL de outra peça precisa ser binário, em milímetros, com o Z para cima e a base apoiada em z = 0, do jeito que a peça vai para a mesa da impressora. A vista frontal é a peça vista do lado de -Y, e o eixo de simetria dela é desenhado em x = 0, então a peça precisa estar centrada em x. Gere o traço com

```
npm run desenhos -- caminho/da/peca.stl
```

Sem o caminho, a ferramenta lê `../impressao-3d/saida/trava_conector_azul.stl`, que é a constante `STL_PADRAO` de `tools/desenhos.js`. O JSON gerado entra no commit, e o STL nunca.

Duas medidas da trava precisam ser refeitas na peça nova. `PLANO_AA`, em `tools/desenhos.js`, é o y do corte A-A. Na trava ele passa pelo eixo do furo, em y = 12,8, e fica 0,05 mm fora do centro para não cair em cima de vértices da malha; a ferramenta recusa um plano que não corta a peça. `FURO`, em `assets/js/desenho.js`, guarda o centro, o raio e a espessura da placa em volta do furo, e dali saem as linhas de centro do furo nas vistas superior e lateral. Numa peça sem furo, essas duas linhas de centro precisam sair de `desenharTudo()`.
````

No último parágrafo da mesma seção, troque `Em \`assets/js/stl.test.js\`` por `Em \`tools/stl.test.js\`` e `Meça a peça nova, troque esses valores e o plano do corte, e rode \`npm test\`.` por `Meça a peça nova, troque esses valores e o plano do corte, aponte \`STL_PADRAO\` para ela, gere o traço e rode \`npm test\`.`

Na seção "Publicação", troque `tira os arquivos de teste (\`assets/js/*.test.js\`) e publica o que sobrou` por `tira os arquivos de teste (\`assets/js/*.test.js\`), para com erro se encontrar um modelo 3D e publica o que sobrou`.

- [ ] **Step 14: Commit**

```bash
git add package.json tools assets/desenhos.json README.md
git status --short
git commit -F - <<'EOF'
feat: ferramenta que gera o traço 2D dos desenhos a partir do STL

stl.js e vistas.js saem de assets/js para tools/, junto com os testes. A
nova tools/desenhos.js calcula, fora do site, as linhas visíveis e ocultas
de cada vista, o esboço e as linhas de camada da isométrica e o corte A-A,
e grava assets/desenhos.json só com pontos 2D arredondados a 0,01 mm.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

O `git status --short` antes do commit não pode listar nenhum `.stl`.

---

### Task 2: A página desenha a partir de `assets/desenhos.json`

**Files:**
- Modify: `assets/js/desenho.js` (reescrito), `index.html:59-65`, `assets/css/style.css:21`, `assets/css/style.css:266-270`, `README.md`, `DESIGN.md`, `.impeccable/design.json`
- Create: `assets/js/desenho.test.js`

**Interfaces:**
- Consumes: `assets/desenhos.json` na forma descrita na Task 1.
- Produces: `assets/js/desenho.js` exporta `iniciar()` (chamado por `main.js`, que não muda), `mm(valor) -> string`, `quadroHero(t, camadas) -> { p: number[3], alfa, esboco, ate, tinta }` e `FIM_HERO` (2850).

- [ ] **Step 1: Escrever o teste que falha, `assets/js/desenho.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mm, quadroHero, FIM_HERO } from './desenho.js';

test('cotas com vírgula e uma casa', () => {
  assert.equal(mm(32.8249), '32,8');
  assert.equal(mm(26), '26,0');
});

test('a abertura do hero termina com a peça inteira impressa e em tinta', () => {
  const fim = quadroHero(FIM_HERO, 132);
  assert.deepEqual(fim, { p: [1, 1, 1], alfa: 1, esboco: 1, ate: 132, tinta: 1 });
  assert.deepEqual(quadroHero(Infinity, 132), fim); // o quadro do movimento reduzido
});

test('as camadas sobem em ritmo linear de 900 a 2600 ms, e a tinta vem depois', () => {
  assert.equal(quadroHero(900, 132).ate, 0);
  assert.equal(quadroHero(1750, 132).ate, 66);
  assert.equal(quadroHero(2600, 132).ate, 132);
  assert.equal(quadroHero(2600, 132).tinta, 0);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test assets/js/desenho.test.js`
Expected: FAIL. O `desenho.js` atual importa `./stl.js`, que foi para `tools/`, e não exporta `quadroHero`.

- [ ] **Step 3: Reescrever `assets/js/desenho.js` inteiro**

```js
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
  if (esboco * (1 - tinta) > 0) {
    ctx.globalAlpha = esboco * (1 - tinta);
    estiloVisivel(ctx, cor, TRACO.construcao, cor.construcao);
    tracar(ctx, d.iso.visiveis, mapa);
  }
  ctx.globalAlpha = 1;
  estiloVisivel(ctx, cor, TRACO.camada, cor.grafite);
  for (let k = 0; k < ate; k += salto) tracar(ctx, d.iso.camadas[k], mapa);
  if (tinta > 0) {
    ctx.globalAlpha = tinta;
    estiloVisivel(ctx, cor);
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS em todos.

- [ ] **Step 5: Provar por mutação**

1. Em `quadroHero`, troque `(t - 2600) / 250` por `(t - 2600) / 2500`. Falha `'a abertura do hero termina com a peça inteira impressa e em tinta'`.
2. Em `quadroHero`, troque `/ 1700` por `/ 1600`. Falha `'as camadas sobem em ritmo linear...'`, porque em 1750 ms saem 70 camadas em vez de 66.

Desfaça as duas e confirme o verde.

- [ ] **Step 6: Tirar o giro do HTML**

Em `index.html`, a abertura do canvas do hero passa de

```html
      <canvas id="desenho-principal" role="img" aria-roledescription="desenho giratório" tabindex="0" aria-describedby="desenho-dica"
```

para

```html
      <canvas id="desenho-principal" role="img"
```

(o `aria-label` da linha seguinte fica como está) e a linha

```html
        <span id="desenho-dica">Arraste para girar. <span class="so-leitor">No teclado, use as setas.</span></span>
```

sai da `figcaption`.

- [ ] **Step 7: Ajustar a legenda no CSS**

Em `assets/css/style.css`:

1. Linha 21: `--legenda-h: 4.5rem; /* legenda empilhada em três linhas sob o desenho, com folga */` passa a `--legenda-h: 4.5rem; /* legenda empilhada em duas linhas sob o desenho, com uma linha de folga acima do carimbo */`. O valor não muda, então o tamanho do desenho não muda em nenhuma tela.
2. `.desenho figcaption { grid-template-columns: 1.65fr 1.55fr 1fr; }` passa a `.desenho figcaption { grid-template-columns: 1.65fr 2.55fr; }`. A primeira coluna tem a mesma largura de antes, e o segundo item começa no mesmo x.
3. O comentário `/* figura estreita (menos de 41.5rem): a legenda empilha em três linhas em vez de quebrar dentro de cada célula */` passa a dizer `duas linhas`.

- [ ] **Step 8: Verificar no navegador contra a versão de antes do PR #3**

A referência é o commit `41db084`, o último com o STL, servido só na máquina.

```bash
cd /c/Users/rafael.favero.RIOSOFT/Documents/Claude/template_sites3dprint
RASCUNHO="C:/Users/RAFAEL~1.RIO/AppData/Local/Temp/claude/C--Users-rafael-favero-RIOSOFT-Documents-Claude/c5368272-cf9b-474b-8fdd-d6c096615e06/scratchpad"
git worktree add --detach "$RASCUNHO/ref-41db084" 41db084
```

Suba os dois servidores em segundo plano (ferramenta Bash com `run_in_background: true`, um comando cada):

```bash
python -m http.server 8771 --bind 127.0.0.1 --directory "C:/Users/RAFAEL~1.RIO/AppData/Local/Temp/claude/C--Users-rafael-favero-RIOSOFT-Documents-Claude/c5368272-cf9b-474b-8fdd-d6c096615e06/scratchpad/ref-41db084"
```

```bash
python -m http.server 8772 --bind 127.0.0.1 --directory "C:/Users/rafael.favero.RIOSOFT/Documents/Claude/template_sites3dprint"
```

Salve em `$RASCUNHO/tools/compara.mjs`:

```js
// Compara cada canvas da página nova com a referência, com movimento reduzido, e guarda os pares em PNG.
// Uso: node compara.mjs <url-referencia> <url-nova> <pasta-saida>
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [urlRef, urlNova, saida] = process.argv.slice(2);
mkdirSync(saida, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });

async function canvases(url, viewport, esquema) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: esquema, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const pedidos = [], erros = [];
  page.on('request', (r) => pedidos.push(r.url()));
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => { // passa pela página inteira para os canvas preguiçosos desenharem
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 120)); }
    scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 600));
  });
  const imagens = await page.$$eval('#desenho-principal, canvas.estado, #corte', (cs) => cs.map((c) => ({ nome: c.id || c.dataset.estado, url: c.toDataURL() })));
  return { context, page, imagens, pedidos, erros };
}

for (const [rotulo, viewport] of [['desktop', { width: 1440, height: 900 }], ['celular', { width: 390, height: 844 }]]) {
  for (const esquema of ['light', 'dark']) {
    const ref = await canvases(urlRef, viewport, esquema), nova = await canvases(urlNova, viewport, esquema);
    const pares = ref.imagens.map((a) => ({ nome: a.nome, ref: a.url, nova: nova.imagens.find((b) => b.nome === a.nome)?.url }));
    const difs = await nova.page.evaluate(async (pares) => {
      const carregar = (src) => new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = falha; i.src = src; });
      const pixels = (img) => { const c = new OffscreenCanvas(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
      const out = [];
      for (const { nome, ref, nova } of pares) {
        if (!nova) { out.push({ nome, erro: 'canvas ausente na página nova' }); continue; }
        const [a, b] = await Promise.all([carregar(ref), carregar(nova)]);
        if (a.width !== b.width || a.height !== b.height) { out.push({ nome, erro: `${a.width}x${a.height} contra ${b.width}x${b.height}` }); continue; }
        const pa = pixels(a), pb = pixels(b), papel = [pa[0], pa[1], pa[2]];
        let traco = 0, dif = 0;
        for (let i = 0; i < pa.length; i += 4) {
          if (Math.max(Math.abs(pa[i] - papel[0]), Math.abs(pa[i + 1] - papel[1]), Math.abs(pa[i + 2] - papel[2])) > 48) traco++;
          if (Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2])) > 48) dif++;
        }
        out.push({ nome, pixelsDeTraco: traco, diferentes: dif, pctDoTraco: +((100 * dif) / Math.max(1, traco)).toFixed(1) });
      }
      return out;
    }, pares);
    for (const { nome, ref: a, nova: b } of pares) {
      writeFileSync(join(saida, `${rotulo}-${esquema}-${nome}-ref.png`), Buffer.from(a.split(',')[1], 'base64'));
      if (b) writeFileSync(join(saida, `${rotulo}-${esquema}-${nome}-nova.png`), Buffer.from(b.split(',')[1], 'base64'));
    }
    console.log(JSON.stringify({ rotulo, esquema, difs, stl: nova.pedidos.filter((u) => /\.stl(\?|$)/i.test(u)), json: nova.pedidos.filter((u) => u.includes('desenhos.json')).length, erros: nova.erros }));
    await ref.context.close(); await nova.context.close();
  }
}
await browser.close();
```

Run: `cd "$RASCUNHO/tools" && node compara.mjs http://127.0.0.1:8771/ http://127.0.0.1:8772/ ../compara`

Expected, em cada uma das quatro linhas: `stl: []`, `json: 1`, `erros: []` e os seis canvas presentes (`desenho-principal`, `foto`, `cotas`, `mesa`, `camadas`, `corte`). `frontal`, `superior` e `lateral` usam o mesmo cálculo de antes, então `desenho-principal`, `cotas` e `corte` devem diferir só na suavização das bordas. `foto`, `mesa`, `camadas` e a perspectiva do hero trocaram de algoritmo e podem diferir mais. Abra cada par `-ref.png`/`-nova.png` com a ferramenta Read e confirme que nenhuma aresta, linha de camada, cota ou hachura sumiu ou sobrou. Relate a tabela de `pctDoTraco` e o que viu em cada par.

Depois, capture a abertura com movimento normal. Salve em `$RASCUNHO/tools/abertura.mjs`:

```js
// Quatro instantes da abertura do hero na página nova, no desktop claro.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.argv[2]);
await p.waitForFunction(() => { // começa quando o hero deixa de ser só papel
  const c = document.getElementById('desenho-principal'), x = c.getContext('2d');
  if (!c.width) return false;
  const d = x.getImageData(0, 0, c.width, c.height).data;
  for (let i = 4; i < d.length; i += 4 * 97) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) return true;
  return false;
}, null, { polling: 16 });
const inicio = Date.now();
for (const t of [700, 1400, 2100, 3100]) {
  await p.waitForTimeout(Math.max(0, t - (Date.now() - inicio)));
  await p.locator('figure.desenho').screenshot({ path: `../abertura-${t}.png` });
}
await b.close();
```

Run: `cd "$RASCUNHO/tools" && node abertura.mjs http://127.0.0.1:8772/`

Abra as quatro imagens. Esperado: em 700 ms as vistas se traçando e sem perspectiva; em 1400 ms o esboço azul e as camadas no terço de baixo; em 2100 ms camadas até perto do topo; em 3100 ms a peça em tinta com todas as camadas, igual ao estado final.

Por fim, pare os dois servidores e tire a referência:

```powershell
Get-NetTCPConnection -LocalPort 8771,8772 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Confirm:$false }
```

```bash
cd /c/Users/rafael.favero.RIOSOFT/Documents/Claude/template_sites3dprint && git worktree remove --force "C:/Users/RAFAEL~1.RIO/AppData/Local/Temp/claude/C--Users-rafael-favero-RIOSOFT-Documents-Claude/c5368272-cf9b-474b-8fdd-d6c096615e06/scratchpad/ref-41db084" && git worktree prune
```

- [ ] **Step 9: Atualizar a documentação da página**

`README.md`:

1. No primeiro parágrafo, depois de `...e uma perspectiva que se imprime camada por camada quando a página abre.`, acrescente `O STL é o modelo que se vende. Ele fica fora do site e deste repositório, e a página recebe só o traço dos desenhos.` E troque `desenhada a partir do próprio arquivo STL` por `desenhada a partir do arquivo STL`.
2. Na seção "Como o código está organizado", troque `É HTML, CSS e JavaScript puros, sem framework, sem etapa de build e sem dependência para instalar.` por `É HTML, CSS e JavaScript puros, sem framework, sem etapa de build e sem dependência para instalar. O traço dos desenhos já vem pronto em \`assets/desenhos.json\`, gerado uma vez por \`tools/desenhos.js\` e guardado no repositório.`
3. Troque o parágrafo que começa com `O JavaScript está dividido em módulos pequenos em \`assets/js/\`` por:

```markdown
O JavaScript da página está em `assets/js/`: `desenho.js` desenha a peça nos canvas a partir do `desenhos.json` (o desenho do topo da página, os quatro quadros de "Da foto à peça impressa" e o corte A-A), `whatsapp.js` monta a mensagem e o link, e `main.js` cuida do resto: o contador de folhas e os campos do carimbo, o envio do pedido e a regra de um só botão vermelho por tela. A ferramenta que gera o JSON fica em `tools/`, fora do que o site publica: `stl.js` lê o STL binário e fatia a malha, `vistas.js` faz as projeções e `desenhos.js` separa as linhas visíveis das ocultas e grava o traço 2D de cada desenho.
```

4. Na seção "Testar", logo depois de `Em \`assets/js/\`, \`whatsapp.test.js\` confere a mensagem e o link do WhatsApp, inclusive os quatro links gravados no \`index.html\`,`, acrescente ` \`desenho.test.js\` confere as cotas e o roteiro da abertura do hero,` antes de `e \`sem-malha.test.js\``.
5. Na seção das imagens, troque `e sem a navegação do topo nem a dica de arrastar, que não fazem sentido numa imagem parada.` por `e sem a navegação do topo, que não faz sentido numa imagem parada.`; troque `escondendo a navegação do topo, a dica de arrastar e a régua da troca de folha só nessa captura` por `escondendo a navegação do topo e a régua da troca de folha só nessa captura`; e no trecho de código troque `'.topo nav, #desenho-dica, .folha + .folha::before { visibility: hidden; }'` por `'.topo nav, .folha + .folha::before { visibility: hidden; }'`.

`DESIGN.md`:

1. Linha 227: `- A peça real, lida do STL, desenhada em primeiro diedro com cotas em milímetros, corte A-A hachurado e perspectiva que se imprime em camadas.` passa a `- A peça real, desenhada a partir do STL fora do site, em primeiro diedro com cotas em milímetros, corte A-A hachurado e perspectiva que se imprime em camadas.`
2. Na linha 309, a frase `Dentro do desenho vale o algoritmo do pintor: cada face é preenchida com papel, de trás para a frente, e o que fica atrás some sob o que está na frente; as linhas ocultas são traçadas antes da tinta, para que a visível vença onde as duas coincidem.` passa a `Dentro do desenho, o que fica atrás já chega separado em linha oculta, calculado fora do site; as linhas ocultas são traçadas antes da tinta, para que a visível vença onde as duas coincidem.`
3. Linha 361: `A assinatura do sistema: a peça real, lida do STL em milímetros no navegador e desenhada em canvas em primeiro diedro (ABNT NBR 10067).` passa a `A assinatura do sistema: a peça real, desenhada em canvas em primeiro diedro (ABNT NBR 10067). O traço vem pronto de \`assets/desenhos.json\`, que \`tools/desenhos.js\` calcula do STL na máquina do autor. A malha nunca chega ao navegador, e por isso o desenho não gira.`
4. Linha 367: `- **Faces e cor:** faces preenchidas com papel de trás para a frente; o canvas pinta o papel antes de traçar,` passa a `- **Linhas ocultas e cor:** as arestas chegam separadas em visíveis e ocultas, já fundidas onde são colineares; o canvas pinta o papel antes de traçar,` (o resto da linha fica).
5. Linha 368: `a perspectiva se imprime camada por camada, em ritmo linear, de 900 a 2600ms.` passa a `o esboço da perspectiva aparece em azul de construção de 900 a 1100ms, as linhas de camada sobem por cima dele em ritmo linear de 900 a 2600ms e as arestas ganham a tinta de 2600 a 2850ms, na mesma curva.`
6. Apague a linha 369 inteira, a que começa com `- **Interação:**`.

`.impeccable/design.json` (edite o texto, sem reformatar o arquivo; depois confira com `node -e "JSON.parse(require('fs').readFileSync('.impeccable/design.json','utf8')); console.log('json ok')"`):

1. No token `impressao-por-camadas`, `"value": "linear, de 900ms a 2600ms"` passa a `"value": "linear, de 900ms a 2600ms, sobre o esboço em azul de construção; tinta de 2600ms a 2850ms"` e `"purpose": "A perspectiva do hero sobe camada por camada até a altura total da peça."` passa a `"purpose": "As linhas de camada da perspectiva do hero sobem até a altura total da peça, e as arestas ganham a tinta no fim."`.
2. Apague o objeto inteiro do token `"name": "giro"`, com a vírgula que o separa do seguinte.
3. No token `movimento-reduzido`, `"purpose": "Todo movimento vive dentro desta condição; com movimento reduzido o desenho aparece pronto e o giro continua por arrasto e setas."` passa a `"purpose": "Todo movimento vive dentro desta condição; com movimento reduzido o desenho aparece pronto."`.
4. No componente "Legenda e rótulo de vista", tire `<span>Arraste para girar.</span>` do `html` e troque `grid-template-columns: 1.65fr 1.55fr 1fr;` por `grid-template-columns: 1.65fr 2.55fr;` no `css`.
5. Em `keyCharacteristics`, `"A peça real, lida do STL, desenhada em primeiro diedro com cotas em milímetros, corte A-A hachurado e perspectiva que se imprime em camadas."` passa a `"A peça real, desenhada a partir do STL fora do site, em primeiro diedro com cotas em milímetros, corte A-A hachurado e perspectiva que se imprime em camadas."`.

Confira que nada ficou para trás:

```bash
grep -n -i -E 'arraste|girar|giro|pintor|lida do STL|desenho-dica|assets/models' README.md DESIGN.md .impeccable/design.json index.html assets/css/style.css assets/js/*.js
```

Expected: nenhuma linha. (`girada` e `giradas`, das cifras da cota vertical, não casam com esse padrão.)

- [ ] **Step 10: Rodar tudo e commitar**

Run: `npm test`
Expected: PASS em todos.

```bash
git add assets/js/desenho.js assets/js/desenho.test.js index.html assets/css/style.css README.md DESIGN.md .impeccable/design.json
git status --short
git commit -F - <<'EOF'
feat: a página desenha a trava a partir do traço 2D, sem a malha

desenho.js lê assets/desenhos.json em vez do STL. As vistas, as cotas, o
corte e os quatro estados saem do mesmo traço de antes. O giro sai, porque
precisaria da peça em 3D no navegador. Na abertura do hero, o esboço da
perspectiva aparece em azul de construção, as camadas sobem por cima dele
e as arestas ganham a tinta no fim.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```
