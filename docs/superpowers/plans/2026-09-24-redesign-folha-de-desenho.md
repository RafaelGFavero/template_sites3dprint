# Redesign "Folha de desenho técnico": plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer o site de uma página da RF Tecnologia 3D como a folha de desenho técnico da peça do visitante: a trava real desenhada a partir do STL, em vistas cotadas, corte hachurado e camadas de impressão, com o pedido saindo pelo WhatsApp.

**Architecture:** Site estático (GitHub Pages), sem build e sem dependência externa. HTML semântico, um CSS com tokens, módulos ES pequenos: `stl.js` (ler e fatiar a malha), `vistas.js` (projeções puras), `whatsapp.js` (mensagem), `desenho.js` (canvas), `main.js` (página). Toda a lógica pura tem teste em `node --test`.

**Tech Stack:** HTML5, CSS (custom properties, grid, `color-mix`, `prefers-color-scheme`), JavaScript ES2022 em módulos, Canvas 2D, Node 24 só para testes, Playwright (Chrome da máquina) só para captura.

**Fontes de verdade (ler antes de qualquer tarefa):**
- `PRODUCT.md`: fatos, público, o que nunca afirmar.
- `.impeccable/surfaces/index-html.md`: contrato da direção (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH).
- `.claude/skills/impeccable/reference/craft-floor.md`: piso de qualidade e proibições.
- `.claude/skills/taste-skill/SKILL.md`, seções 4.7, 9 e 14: disciplina de layout, sinais de IA e checklist final.
- `.claude/skills/review-animations/STANDARDS.md`: curvas, durações e movimento reduzido (Emil Kowalski).

## Global Constraints

- Idioma pt-BR. Voz "artesão que resolve", primeira pessoa do singular ("eu desenho"), direta sobre a peça.
- Contatos: WhatsApp `https://wa.me/5517997912726`, Instagram `https://instagram.com/rf_tec3d`, e-mail `rftec3d@gmail.com`, telefone exibido `(17) 99791-2726`.
- Nunca afirmar cidade, frete ou envio, preço, prazo, forma de pagamento, horário, materiais em estoque, tamanho máximo, depoimentos, contagem de clientes ou anos de mercado.
- Números permitidos na página: os medidos do STL (32,8 × 26,4 × 26,4 mm; 132 camadas), a camada padrão de 0,2 mm, as regras de projeto (parede ≥ 1,2 mm, inclinação ≤ 45°), cinco fotos, versão amarela 8 % menor.
- Tokens claros (folha sulfite): `--papel:#f2f4f3; --tinta:#15181b; --grafite:#50575e; --construcao:#7fb3dd; --vermelho:#d93430; --sobre-vermelho:#ffffff`.
- Tokens escuros (cópia heliográfica, `prefers-color-scheme: dark`): `--papel:#17355f; --tinta:#eef3f8; --grafite:#b9c9dc; --construcao:#6f9fd0; --vermelho:#d93430; --sobre-vermelho:#ffffff`. No escuro o botão vermelho ganha borda de 1,5px em `--tinta`.
- Nenhum hex fora de `:root` e do bloco escuro. O canvas lê as cores dessas variáveis.
- Fontes locais, nada de Google Fonts: `assets/fonts/osifont.woff2` e `assets/fonts/osifont-italic.woff2` (família `osifont`, letra técnica ISO 3098) e `assets/fonts/overpass-latin-wght-normal.woff2` + `overpass-latin-ext-wght-normal.woff2` (família `Overpass`, variável 100 a 900).
- Títulos, cotas, carimbo e legendas em `osifont`, caixa alta via CSS. Texto corrido em `Overpass`. Nenhuma outra fonte.
- Raio 0 em tudo. Nada de cartões, sombras, degradê em texto, brilho, vidro, marquee, grade decorativa de fundo.
- Proibido: rótulo pequeno acima de título (eyebrow), numeração 01/02/03 de seção, travessão (— ou –) em texto visível, mais de um ponto médio (·) por linha, emoji, ícone desenhado à mão, Font Awesome, foto de banco, screenshot falso.
- Ícones só da Phosphor (peso regular, SVG embutido, `viewBox="0 0 256 256"`, `fill="currentColor"`), copiados de `C:\Users\RAFAEL~1.RIO\AppData\Local\Temp\claude\C--Users-rafael-favero-RIOSOFT-Documents-Claude\c5368272-cf9b-474b-8fdd-d6c096615e06\scratchpad\icons\` (`whatsapp-logo.svg`, `instagram-logo.svg`, `arrow-right.svg`, `envelope-simple.svg`, `list.svg`, `x.svg`).
- Vermelho só na ação (botão do WhatsApp). Uma coisa vermelha por tela. A marca R é logo e está isenta.
- Um rótulo por intenção: WhatsApp é sempre "Mandar foto da peça"; Instagram é sempre "Ver no Instagram".
- Link padrão do WhatsApp (igual em todo `href` estático, fixado por teste): `https://wa.me/5517997912726?text=Ol%C3%A1%2C%20Rafael!%20Vim%20pelo%20site%20da%20RF%20Tecnologia%203D.%0ATenho%20uma%20pe%C3%A7a%20para%20fazer.%0AVou%20mandar%20as%20fotos%20aqui.`
- Movimento: um só momento autoral (o desenho do hero). Fora ele, só troca de cor no hover (150ms `ease`) e aperto de botão (`scale(.98)`, 120ms). Todo movimento dentro de `@media (prefers-reduced-motion: no-preference)`; com movimento reduzido o desenho aparece pronto. Curvas: `--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`; a impressão por camadas é linear.
- Proibido `addEventListener('scroll', …)`. Usar IntersectionObserver.
- Alvo de toque ≥ 44px. Foco visível: `outline: 2px solid var(--tinta); outline-offset: 3px`.
- Contraste medido: tinta/papel 16,1; grafite/papel 6,6; branco/vermelho 4,7; tinta/heliográfico 11,0; grafite/heliográfico 7,3.
- Superfícies do navegador tematizadas: `::selection` (fundo `--construcao`, texto `--tinta`), `caret-color`, `scrollbar-color`, `text-underline-offset: .2em`.
- Testes: `npm test` (roda `node --test assets/js/*.test.js`) sempre verde.
- Captura: servidor `python -m http.server 8765 --bind 127.0.0.1` na raiz do repo (rodar em segundo plano) e `node <scratchpad>\tools\capture.mjs http://127.0.0.1:8765/ <saida> [--dark] [--reduced] [--wait=ms] [--eval="expr"]`, onde `<scratchpad>` é `C:\Users\RAFAEL~1.RIO\AppData\Local\Temp\claude\C--Users-rafael-favero-RIOSOFT-Documents-Claude\c5368272-cf9b-474b-8fdd-d6c096615e06\scratchpad`. O script grava `desktop.png` (1440×900) e `mobile.png` (390×844), página inteira, e imprime erros de console e estouro horizontal.
- Commits em pt-BR, `tipo: descrição`, terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Caminhos explícitos no `git add`.

---

### Task 1: Lógica pura (malha, vistas e mensagem)

**Files:**
- Modify: `assets/js/stl.js`
- Modify: `assets/js/stl.test.js`
- Create: `assets/js/vistas.js`
- Create: `assets/js/vistas.test.js`
- Modify: `assets/js/whatsapp.js`
- Modify: `assets/js/whatsapp.test.js`

**Interfaces:**
- Consumes: `parseSTL(buffer) -> { count, positions: Float32Array(9 por triângulo), normals: Float32Array(3 por triângulo) }` e `bounds(mesh) -> { min:[x,y,z], max:[x,y,z], size:[x,y,z] }`, já existentes em `assets/js/stl.js`.
- Produces:
  - `stl.js`: `featureEdgeList(mesh, angleDeg = 30) -> Array<{ a:[x,y,z], b:[x,y,z], faces:number[] }>` (substitui `featureEdges`); `sliceAxis(mesh, axis, value) -> number[]` segmentos planos `[u1,v1,u2,v2,…]` nas duas coordenadas restantes em ordem (eixo 0 → (y,z); 1 → (x,z); 2 → (x,y)); `loops(segments, tol = 1e-3) -> Array<Array<[u,v]>>` laços fechados sem repetir o primeiro ponto; `layerCount(mesh, layer = 0.2) -> number`.
  - `vistas.js`: `VISTAS = { frontal, superior, lateral }`, cada uma `(x,y,z) -> [u, v, profundidade]` (u para a direita, v para baixo, profundidade maior = mais perto de quem olha); `orbita(azGraus, elGraus) -> (x,y,z) -> [u, v, profundidade]`; `ISO = { az: 45, el: asin(1/√3) em graus (35,26439°) }`; `recortaAbaixo(tri, h) -> Array<[x,y,z]>` (polígono do triângulo com z ≤ h, 0, 3 ou 4 pontos); `mm(valor) -> string` com vírgula e uma casa.
  - `whatsapp.js`: `WHATSAPP_NUMBER`, `buildWhatsappMessage({ nome, peca, medida } = {}) -> string`, `buildWhatsappUrl(message) -> string`.

A frente da trava no STL é o lado de y menor (y vai de -0,60 a 25,77); as orelhas inclinam para trás (y maior); a base está em z = 0; x é simétrico (-16,41 a 16,41).

- [ ] **Step 1: Testes que falham**

Substituir o terceiro teste de `assets/js/stl.test.js` e acrescentar os novos (manter a função `cubeSTL()` e os dois primeiros testes):

```js
import { parseSTL, bounds, featureEdgeList, sliceAxis, loops, layerCount } from './stl.js';

test('arestas vivas: um cubo tem 12, cada uma entre duas faces', () => {
  const arestas = featureEdgeList(parseSTL(cubeSTL()), 30);
  assert.equal(arestas.length, 12);
  assert.ok(arestas.every((e) => e.faces.length === 2));
});

test('corte horizontal do cubo a meia altura é um quadrado', () => {
  const lacos = loops(sliceAxis(parseSTL(cubeSTL()), 2, 0.5));
  assert.equal(lacos.length, 1);
  assert.equal(lacos[0].length, 8); // 4 cantos + o meio de cada face, onde passa a diagonal
  const perimetro = lacos[0].reduce((s, p, i, l) => { const q = l[(i + 1) % l.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
  assert.equal(perimetro.toFixed(3), '4.000');
});

test('a trava sobe em 132 camadas de 0,2 mm', () => {
  assert.equal(layerCount(parseSTL(buffer), 0.2), 132);
});

test('o corte A-A da trava (x = 0,05, fora do plano de simetria) fecha todos os segmentos em laços', () => {
  const segs = sliceAxis(parseSTL(buffer), 0, 0.05);
  const lacos = loops(segs);
  assert.ok(lacos.length >= 1);
  assert.equal(lacos.reduce((n, l) => n + l.length, 0), segs.length / 4);
});
```

Criar `assets/js/vistas.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VISTAS, orbita, ISO, recortaAbaixo, mm } from './vistas.js';

test('primeiro diedro: frontal, superior abaixo e lateral esquerda à direita', () => {
  assert.deepEqual(VISTAS.frontal(1, 2, 3), [1, -3, -2]);
  assert.deepEqual(VISTAS.superior(1, 2, 3), [1, -2, 3]);
  assert.deepEqual(VISTAS.lateral(1, 2, 3), [-2, -3, -1]);
});

test('órbita com azimute e elevação zero é a vista frontal', () => {
  const [u, v, p] = orbita(0, 0)(1, 2, 3);
  assert.deepEqual([u, v, p].map((n) => Math.round(n * 1e6) / 1e6), [1, -3, -2]);
});

test('isométrica mostra os três eixos com o mesmo encurtamento', () => {
  const proj = orbita(ISO.az, ISO.el);
  const comp = ([x, y, z]) => { const [u, v] = proj(x, y, z); return Math.hypot(u, v).toFixed(3); };
  assert.equal(comp([1, 0, 0]), comp([0, 1, 0]));
  assert.equal(comp([0, 1, 0]), comp([0, 0, 1]));
});

test('recorte do triângulo abaixo de uma altura', () => {
  const tri = [[0, 0, 0], [2, 0, 0], [0, 0, 2]];
  assert.equal(recortaAbaixo(tri, 5).length, 3);
  assert.equal(recortaAbaixo(tri, -1).length, 0);
  const meio = recortaAbaixo(tri, 1);
  assert.equal(meio.length, 4);
  assert.ok(meio.every(([, , z]) => z <= 1 + 1e-9));
});

test('cotas com vírgula e uma casa', () => {
  assert.equal(mm(32.8249), '32,8');
  assert.equal(mm(26), '26,0');
});
```

Reescrever `assets/js/whatsapp.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsappMessage, buildWhatsappUrl } from './whatsapp.js';

const LINK_PADRAO = 'https://wa.me/5517997912726?text=Ol%C3%A1%2C%20Rafael!%20Vim%20pelo%20site%20da%20RF%20Tecnologia%203D.%0ATenho%20uma%20pe%C3%A7a%20para%20fazer.%0AVou%20mandar%20as%20fotos%20aqui.';

test('mensagem completa, na ordem', () => {
  assert.equal(
    buildWhatsappMessage({ nome: 'Ana', peca: 'trava do tanque do Compass', medida: '32 mm de largura' }),
    'Olá, Rafael! Vim pelo site da RF Tecnologia 3D.\nMeu nome é Ana.\nA peça: trava do tanque do Compass\nMedida: 32 mm de largura\nVou mandar as fotos aqui.',
  );
});

test('sem nada preenchido sai a mensagem curta', () => {
  assert.equal(
    buildWhatsappMessage(),
    'Olá, Rafael! Vim pelo site da RF Tecnologia 3D.\nTenho uma peça para fazer.\nVou mandar as fotos aqui.',
  );
});

test('campo só com espaços conta como vazio', () => {
  assert.equal(buildWhatsappMessage({ nome: '  ', peca: ' ', medida: '' }), buildWhatsappMessage());
});

test('o link padrão é o mesmo gravado no HTML', () => {
  assert.equal(buildWhatsappUrl(buildWhatsappMessage()), LINK_PADRAO);
});

test('url codifica acento e &', () => {
  assert.equal(buildWhatsappUrl('Olá & tchau'), 'https://wa.me/5517997912726?text=Ol%C3%A1%20%26%20tchau');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL (`featureEdgeList`, `sliceAxis`, `loops`, `layerCount` e o módulo `./vistas.js` não existem; a mensagem antiga do WhatsApp não bate).

- [ ] **Step 3: Implementar**

Em `assets/js/stl.js`, trocar `featureEdges` por `featureEdgeList` (mesma soldagem por chave de vértice com 4 casas, mesmo critério de ângulo) devolvendo objetos, e acrescentar:

```js
export function featureEdgeList({ count, positions, normals }, angleDeg = 30) {
  const key = (i) => `${positions[i].toFixed(4)},${positions[i + 1].toFixed(4)},${positions[i + 2].toFixed(4)}`;
  const edges = new Map();
  for (let f = 0; f < count; f++) {
    for (let k = 0; k < 3; k++) {
      const a = f * 9 + k * 3, b = f * 9 + ((k + 1) % 3) * 3;
      const ka = key(a), kb = key(b);
      const id = ka < kb ? ka + '|' + kb : kb + '|' + ka;
      const e = edges.get(id);
      if (e) e.faces.push(f); else edges.set(id, { a, b, faces: [f] });
    }
  }
  const cos = Math.cos((angleDeg * Math.PI) / 180);
  const out = [];
  for (const { a, b, faces } of edges.values()) {
    if (faces.length === 2) {
      const [f, g] = faces;
      const dot = normals[f * 3] * normals[g * 3] + normals[f * 3 + 1] * normals[g * 3 + 1] + normals[f * 3 + 2] * normals[g * 3 + 2];
      if (dot > cos) continue;
    }
    out.push({ a: [positions[a], positions[a + 1], positions[a + 2]], b: [positions[b], positions[b + 1], positions[b + 2]], faces });
  }
  return out;
}

// Where the plane (coordinate `axis` = value) cuts the mesh, as flat 2D segments
// in the two remaining coordinates, in x, y, z order.
export function sliceAxis({ count, positions }, axis, value) {
  const [ua, va] = [0, 1, 2].filter((c) => c !== axis);
  const out = [];
  for (let f = 0; f < count; f++) {
    const p = [0, 1, 2].map((k) => positions.subarray(f * 9 + k * 3, f * 9 + k * 3 + 3));
    const d = p.map((q) => q[axis] - value);
    const hits = [];
    for (let k = 0; k < 3; k++) {
      const i = k, j = (k + 1) % 3;
      if ((d[i] < 0) === (d[j] < 0)) continue;
      const t = d[i] / (d[i] - d[j]);
      hits.push(p[i][ua] + t * (p[j][ua] - p[i][ua]), p[i][va] + t * (p[j][va] - p[i][va]));
    }
    if (hits.length === 4 && Math.hypot(hits[2] - hits[0], hits[3] - hits[1]) > 1e-9) out.push(...hits);
  }
  return out;
}

// Chain unordered segments into closed loops by matching endpoints within `tol`.
export function loops(segments, tol = 1e-3) {
  const segs = [];
  for (let i = 0; i < segments.length; i += 4) segs.push([[segments[i], segments[i + 1]], [segments[i + 2], segments[i + 3]]]);
  const same = (p, q) => Math.abs(p[0] - q[0]) <= tol && Math.abs(p[1] - q[1]) <= tol;
  const used = new Array(segs.length).fill(false);
  const out = [];
  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue;
    used[s] = true;
    const loop = [segs[s][0], segs[s][1]];
    for (let grew = true; grew && !same(loop[0], loop[loop.length - 1]);) {
      grew = false;
      const tail = loop[loop.length - 1];
      for (let t = 0; t < segs.length; t++) {
        if (used[t]) continue;
        const [p, q] = segs[t];
        if (same(p, tail)) { loop.push(q); used[t] = grew = true; break; }
        if (same(q, tail)) { loop.push(p); used[t] = grew = true; break; }
      }
    }
    if (!same(loop[0], loop[loop.length - 1])) continue; // open chain: not a loop
    loop.pop();
    if (loop.length >= 3) out.push(loop);
  }
  return out;
}

export function layerCount(mesh, layer = 0.2) {
  return Math.ceil(bounds(mesh).size[2] / layer - 1e-6);
}
```

Criar `assets/js/vistas.js`:

```js
// Orthographic views of a z-up part, first-angle arrangement (ABNT NBR 10067).
// Each view returns [u, v, depth]: u to the right, v downwards, larger depth = closer to the viewer.
export const VISTAS = {
  frontal: (x, y, z) => [x, -z, -y],   // seen from -Y
  superior: (x, y, z) => [x, -y, z],   // seen from above, drawn below the front view
  lateral: (x, y, z) => [-y, -z, -x],  // left view (seen from -X), drawn to the right of the front view
};

export const ISO = { az: 45, el: (Math.asin(1 / Math.sqrt(3)) * 180) / Math.PI }; // isométrica exata

// Free view around the part: azimuth turns around Z starting from the front, elevation lifts the eye.
export function orbita(azGraus, elGraus) {
  const az = (azGraus * Math.PI) / 180, el = (elGraus * Math.PI) / 180;
  const d = [Math.cos(el) * Math.sin(az), -Math.cos(el) * Math.cos(az), Math.sin(el)];
  const r = [Math.cos(az), Math.sin(az), 0];
  const up = [-Math.sin(el) * Math.sin(az), Math.sin(el) * Math.cos(az), Math.cos(el)];
  return (x, y, z) => [
    x * r[0] + y * r[1] + z * r[2],
    -(x * up[0] + y * up[1] + z * up[2]),
    x * d[0] + y * d[1] + z * d[2],
  ];
}

// Part of a triangle at or below height h (Sutherland-Hodgman against one plane).
export function recortaAbaixo(tri, h) {
  const out = [];
  for (let i = 0; i < tri.length; i++) {
    const p = tri[i], q = tri[(i + 1) % tri.length];
    const pIn = p[2] <= h, qIn = q[2] <= h;
    if (pIn) out.push(p);
    if (pIn !== qIn) {
      const t = (h - p[2]) / (q[2] - p[2]);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]), h]);
    }
  }
  return out;
}

export const mm = (valor) => valor.toFixed(1).replace('.', ',');
```

Reescrever `assets/js/whatsapp.js`:

```js
export const WHATSAPP_NUMBER = '5517997912726';

const limpo = (v) => String(v ?? '').trim();

export function buildWhatsappMessage({ nome, peca, medida } = {}) {
  const linhas = ['Olá, Rafael! Vim pelo site da RF Tecnologia 3D.'];
  if (limpo(nome)) linhas.push(`Meu nome é ${limpo(nome)}.`);
  linhas.push(limpo(peca) ? `A peça: ${limpo(peca)}` : 'Tenho uma peça para fazer.');
  if (limpo(medida)) linhas.push(`Medida: ${limpo(medida)}`);
  linhas.push('Vou mandar as fotos aqui.');
  return linhas.join('\n');
}

export function buildWhatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS em todos os testes de `stl.test.js`, `vistas.test.js` e `whatsapp.test.js`, saída limpa.

- [ ] **Step 5: Provar por mutação**

Uma mutação por arquivo, rodar `npm test`, ver a falha esperada, desfazer, ver verde. Colar as três saídas no relatório:
1. `loops`: remover a linha `loop.pop();`. Espera-se falha no teste do quadrado (9 pontos).
2. `VISTAS.superior`: trocar `-y` por `y`. Espera-se falha no teste do primeiro diedro.
3. `buildWhatsappMessage`: trocar `'Tenho uma peça para fazer.'` por `'Tenho uma peça.'`. Espera-se falha no teste do link padrão.

- [ ] **Step 6: Commit**

```bash
git add assets/js/stl.js assets/js/stl.test.js assets/js/vistas.js assets/js/vistas.test.js assets/js/whatsapp.js assets/js/whatsapp.test.js
git commit -m "feat: malha fatiada, vistas em primeiro diedro e mensagem curta do WhatsApp"
```

---

### Task 2: A folha (HTML, CSS e página, sem o desenho)

**Files:**
- Modify: `index.html` (reescrever inteiro)
- Modify: `assets/css/style.css` (reescrever inteiro)
- Modify: `assets/js/main.js` (reescrever inteiro)
- Delete: `assets/img/logo-icone.jpg`, `assets/img/logo-rf3d.png`, `assets/img/portfolio/README.md`
- Create: `assets/fonts/LICENSES.md`

**Interfaces:**
- Consumes: `buildWhatsappMessage`, `buildWhatsappUrl` de `assets/js/whatsapp.js` (Task 1).
- Produces para a Task 3: no HTML, `<canvas id="desenho-principal">`, quatro `<canvas class="estado" data-estado="foto|cotas|mesa|camadas">` e `<canvas id="corte">`, todos com `role="img"` e `aria-label`. O carimbo expõe `[data-carimbo="folha"]`, `[data-carimbo="peca"]` e `[data-carimbo="cliente"]`. O `main.js` desta tarefa não importa `desenho.js`; a Task 3 acrescenta essa linha.

O mundo é uma folha só, contínua, com moldura fixa e carimbo fixo. Nada de cartões. As seções são as "folhas" do jogo: 1 A peça, 2 Como eu faço, 3 Quem faz, 4 Pedido. O número da folha só aparece no carimbo.

- [ ] **Step 1: Escrever `index.html`**

`<head>`: `lang="pt-BR"`, charset, viewport, `<title>RF Tecnologia 3D | A peça que não se acha mais, desenhada e impressa em 3D</title>`, `<meta name="description" content="Mande a foto da peça quebrada pelo WhatsApp. Rafael Favero redesenha em milímetros e imprime em 3D.">`, `<meta name="theme-color" content="#f2f4f3" media="(prefers-color-scheme: light)">`, `<meta name="theme-color" content="#17355f" media="(prefers-color-scheme: dark)">`, `<meta name="color-scheme" content="light dark">`, ícones `assets/img/favicon-32.png` (32) e `assets/img/apple-touch-icon.png`, `<link rel="preload" href="assets/fonts/osifont-italic.woff2" as="font" type="font/woff2" crossorigin>`, idem para `overpass-latin-wght-normal.woff2`, `<link rel="stylesheet" href="assets/css/style.css">`, `<script type="module" src="assets/js/main.js"></script>`. Open Graph (`og:type` website, `og:title` igual ao title, `og:description` igual à description, `og:locale` pt_BR, `og:image` `https://rafaelgfavero.github.io/template_sites3dprint/assets/img/og.png`) e JSON-LD:

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"LocalBusiness","name":"RF Tecnologia 3D",
"description":"Peças plásticas redesenhadas a partir de foto e medida e impressas em 3D.",
"url":"https://rafaelgfavero.github.io/template_sites3dprint/",
"image":"https://rafaelgfavero.github.io/template_sites3dprint/assets/img/og.png",
"telephone":"+55-17-99791-2726","email":"rftec3d@gmail.com",
"sameAs":["https://instagram.com/rf_tec3d"]}
</script>
```

`<body>` na ordem abaixo. Textos exatamente como escritos. `LINK` é o link padrão das Global Constraints. Ícones Phosphor embutidos com `aria-hidden="true"`.

```html
<a class="pular" href="#principal">Pular para o conteúdo</a>
<div class="moldura" aria-hidden="true"></div>

<header class="topo">
  <a class="topo-marca" href="#inicio">RF Tecnologia 3D</a>
  <nav aria-label="Principal">
    <a href="#como">Como eu faço</a>
    <a href="#quem">Quem faz</a>
    <a href="#pedido">Pedido</a>
    <a href="https://instagram.com/rf_tec3d" rel="noopener" target="_blank" aria-label="Ver no Instagram"><!-- instagram-logo --><span class="so-desktop">Ver no Instagram</span></a>
  </nav>
</header>

<main id="principal">
  <section class="folha hero" id="inicio" data-folha="1" aria-labelledby="t-inicio">
    <div class="hero-texto">
      <h1 id="t-inicio">Não acha a peça? Eu desenho e imprimo.</h1>
      <p class="lead">Mande uma foto e uma medida pelo WhatsApp. Eu redesenho a peça em milímetros e imprimo em 3D.</p>
      <div class="hero-acoes">
        <a class="acao" href="LINK" target="_blank" rel="noopener"><!-- whatsapp-logo --> Mandar foto da peça</a>
        <a class="link" href="#como">Ver como eu faço</a>
      </div>
    </div>
    <figure class="desenho">
      <canvas id="desenho-principal" role="img" tabindex="0" aria-describedby="desenho-dica"
        aria-label="Desenho da trava do conector de combustível em vista frontal, superior e lateral, com 32,8 por 26,4 por 26,4 milímetros, e uma perspectiva impressa camada por camada."></canvas>
      <figcaption>
        <span>Trava do conector de combustível</span>
        <span>1º diedro, medidas em mm</span>
        <span id="desenho-dica">Arraste a perspectiva para girar. No teclado, use as setas.</span>
      </figcaption>
    </figure>
  </section>

  <section class="folha como" id="como" data-folha="2" aria-labelledby="t-como">
    <h2 id="t-como">Da foto à peça impressa</h2>
    <ol class="estados">
      <li><canvas class="estado" data-estado="foto" role="img" aria-label="Esboço da trava em linhas azuis de construção."></canvas>
        <h3>Você manda a foto</h3><p>De frente, de lado e de cima, com uma régua ou uma moeda ao lado para dar a escala.</p></li>
      <li><canvas class="estado" data-estado="cotas" role="img" aria-label="Vista frontal da trava com as cotas de largura e altura."></canvas>
        <h3>Eu desenho em milímetros</h3><p>Cada medida vira cota. O que não dá para medir, eu tiro da proporção entre as fotos.</p></li>
      <li><canvas class="estado" data-estado="mesa" role="img" aria-label="Vista de cima com a área da base que encosta na mesa hachurada."></canvas>
        <h3>Confiro se imprime</h3><p>Olho a base, a espessura das paredes e as inclinações. A trava, por exemplo, imprime sem suporte.</p></li>
      <li><canvas class="estado" data-estado="camadas" role="img" aria-label="Perspectiva da trava com as 132 camadas de impressão."></canvas>
        <h3>Imprimo em camadas</h3><p>A peça sobe em camadas de 0,2 mm. A trava leva 132.</p></li>
    </ol>
    <div class="caso">
      <figure class="corte">
        <canvas id="corte" role="img" aria-label="Corte A-A da trava, com a área de material hachurada."></canvas>
        <figcaption>Corte A-A</figcaption>
      </figure>
      <aside class="notas" aria-labelledby="t-notas">
        <h3 id="t-notas">Notas</h3>
        <ol>
          <li>Trava do conector rápido da linha de combustível, no tanque. Aplicação da peça original: Jeep Compass e Renegade, Fiat Toro e Mobi.</li>
          <li>Redesenhada a partir de cinco fotos da original, sem nenhuma medida de fábrica.</li>
          <li>Imprime sem suporte, com a base inteira apoiada na mesa.</li>
          <li>Duas versões: a azul e a amarela, 8 % menor.</li>
        </ol>
      </aside>
    </div>
  </section>

  <section class="folha quem" id="quem" data-folha="3" aria-labelledby="t-quem">
    <img class="retrato" src="assets/img/rafael-favero.webp" width="640" height="640" loading="lazy" alt="Rafael Favero">
    <div class="quem-texto">
      <h2 id="t-quem">Rafael Favero</h2>
      <p>Eu desenho e imprimo as peças da RF Tecnologia 3D.</p>
      <p>Também faço luminárias autorais, miniaturas, toys articulados e brindes com a marca da sua empresa.</p>
      <a class="link" href="https://instagram.com/rf_tec3d" target="_blank" rel="noopener">Ver no Instagram</a>
    </div>
  </section>

  <section class="folha pedido" id="pedido" data-folha="4" aria-labelledby="t-pedido">
    <div class="pedido-form">
      <h2 id="t-pedido">Mande a foto da peça</h2>
      <p>Se quiser, adiante o pedido aqui. A conversa continua no WhatsApp, onde você anexa as fotos.</p>
      <form id="pedido-form" novalidate>
        <label for="nome">Seu nome</label>
        <input id="nome" name="nome" type="text" autocomplete="name">
        <label for="peca">Que peça é, e de onde?</label>
        <textarea id="peca" name="peca" rows="2" placeholder="Ex.: trava do tanque de combustível do Compass"></textarea>
        <label for="medida">Tem alguma medida?</label>
        <input id="medida" name="medida" type="text" placeholder="Ex.: 32 mm de largura">
        <p class="dica">Tudo aqui é opcional.</p>
        <button class="acao" type="submit"><!-- whatsapp-logo --> Mandar foto da peça</button>
        <p class="aviso" id="pedido-aviso" hidden>Se o WhatsApp não abriu, <a id="pedido-link" href="LINK" target="_blank" rel="noopener">abra por aqui</a>.</p>
      </form>
    </div>
    <aside class="mandar" aria-labelledby="t-mandar">
      <h3 id="t-mandar">O que mandar</h3>
      <ul>
        <li>Fotos de frente, de lado e de cima.</li>
        <li>Uma régua ou moeda ao lado, para dar a escala.</li>
        <li>A peça quebrada inteira, mesmo em pedaços, se ainda tiver.</li>
      </ul>
    </aside>
  </section>
</main>

<footer class="rodape">
  <a href="LINK" target="_blank" rel="noopener"><!-- whatsapp-logo --> (17) 99791-2726</a>
  <a href="https://instagram.com/rf_tec3d" target="_blank" rel="noopener"><!-- instagram-logo --> @rf_tec3d</a>
  <a href="mailto:rftec3d@gmail.com"><!-- envelope-simple --> rftec3d@gmail.com</a>
  <p>© 2026 RF Tecnologia 3D</p>
</footer>

<aside class="carimbo" aria-label="Carimbo da folha">
  <img class="carimbo-marca" src="assets/img/marca-r.png" width="200" height="146" alt="">
  <p class="carimbo-nome">RF Tecnologia 3D</p>
  <p class="carimbo-campo"><span>Peça</span> <span data-carimbo="peca">Trava do conector</span></p>
  <p class="carimbo-campo"><span>Cliente</span> <span data-carimbo="cliente">Você</span></p>
  <p class="carimbo-campo"><span>Desenho</span> <span>Rafael Favero</span></p>
  <p class="carimbo-campo"><span>Escala</span> <span>Sem escala</span></p>
  <p class="carimbo-campo"><span>Unidade</span> <span>mm</span></p>
  <p class="carimbo-campo"><span>Folha</span> <span data-carimbo="folha">1/4</span></p>
  <a class="acao carimbo-acao" href="LINK" target="_blank" rel="noopener"><!-- whatsapp-logo --> Mandar foto da peça <!-- arrow-right --></a>
</aside>
```

- [ ] **Step 2: Escrever `assets/css/style.css`**

Começar por estas regras exatas; o resto segue as medidas abaixo.

```css
@font-face { font-family: osifont; src: url(../fonts/osifont.woff2) format('woff2'); font-display: swap; }
@font-face { font-family: osifont; src: url(../fonts/osifont-italic.woff2) format('woff2'); font-style: italic; font-display: swap; }
@font-face { font-family: Overpass; src: url(../fonts/overpass-latin-wght-normal.woff2) format('woff2'); font-weight: 100 900; font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: Overpass; src: url(../fonts/overpass-latin-ext-wght-normal.woff2) format('woff2'); font-weight: 100 900; font-display: swap;
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }

:root {
  color-scheme: light dark;
  --papel: #f2f4f3; --tinta: #15181b; --grafite: #50575e; --construcao: #7fb3dd;
  --vermelho: #d93430; --sobre-vermelho: #ffffff;
  --letra: osifont, Overpass, sans-serif;
  --texto: Overpass, system-ui, sans-serif;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --moldura: 6px; --margem: 6px; --carimbo-h: 64px;
}
@media (prefers-color-scheme: dark) {
  :root { --papel: #17355f; --tinta: #eef3f8; --grafite: #b9c9dc; --construcao: #6f9fd0; }
}
@media (min-width: 1024px) { :root { --moldura: 12px; --margem: 28px; --carimbo-h: 0px; } }
```

Medidas e regras (todas em rem sobre 16px):
- `html` fundo `--papel`, cor `--tinta`, `font: 400 1.0625rem/1.6 var(--texto)`, `-webkit-text-size-adjust: 100%`; `scroll-padding-top: 1.5rem`; `scroll-behavior: smooth` só dentro de `no-preference`.
- `.moldura`: `position: fixed; inset: var(--moldura) var(--moldura) var(--moldura) var(--margem); border: 1.5px solid var(--tinta); pointer-events: none; z-index: 2`. No desktop a margem esquerda de 28px é a margem de encadernação da folha ABNT.
- Conteúdo: container com `max-width: 82.5rem`, `margin-inline: auto`, `padding-inline: calc(var(--margem) + clamp(1rem, 4vw, 3.5rem)) calc(var(--moldura) + clamp(1rem, 4vw, 3.5rem))`. Grade de 12 colunas, `column-gap: 1.5rem`.
- Espaço entre folhas: `padding-block: clamp(5rem, 10vw, 8rem)`; o hero tem `padding-top` máximo de 6rem. O fim do `main` reserva `padding-bottom: calc(var(--carimbo-h) + 2rem)` no celular e `11rem` no desktop, para o carimbo nunca cobrir o rodapé no fim da rolagem.
- Tipos: `h1` `font: italic 400 clamp(2.25rem, 1.1rem + 3.4vw, 3.75rem)/1.05 var(--letra); text-transform: uppercase; letter-spacing: .02em; word-spacing: -.18em; text-wrap: balance`, no máximo 2 linhas entre 1280 e 1600px. `h2` `italic 400 clamp(1.75rem, 1.2rem + 1.8vw, 2.75rem)/1.1 var(--letra)`, caixa alta, mesmo `word-spacing`. `h3` `400 1.125rem/1.3 var(--letra)`, caixa alta, `letter-spacing: .04em`. Parágrafos `max-width: 60ch`, `text-wrap: pretty`. `.lead` 1.1875rem.
- Letra técnica pequena só no que pertence ao desenho (`figcaption` das figuras, `.carimbo`, `.notas h3`, legendas dos estados): `font-family: var(--letra)`, `.8125rem`, caixa alta, `letter-spacing: .06em`, cor `--grafite` (os valores do carimbo em `--tinta`). Navegação, rótulos do formulário, `.dica` e rodapé ficam em Overpass, caixa normal, `.9375rem` (rótulos em peso 600). Caixa alta espaçada espalhada pela página vira o visual editorial genérico; aqui ela só aparece onde uma folha de desenho teria.
- `.topo`: uma linha, altura 64px, marca "RF Tecnologia 3D" à esquerda em letra técnica itálica caixa alta `1rem`, links à direita em Overpass com `gap: 1.5rem`, alvo de 44px de altura. Abaixo de 768px, mostrar só "Pedido" e o ícone do Instagram (`.so-desktop` some).
- Links (`.link` e os de texto): `color: var(--tinta); text-decoration: underline 1px; text-underline-offset: .2em`; hover (`@media (hover: hover)`) sobe a espessura para 2px.
- `.acao`: `display: inline-flex; align-items: center; gap: .6rem; min-height: 48px; padding: 0 1.25rem; background: var(--vermelho); color: var(--sobre-vermelho); border: 1.5px solid var(--vermelho); border-radius: 0; font: italic 400 1rem/1 var(--letra); text-transform: uppercase; letter-spacing: .04em; text-decoration: none; transition: background-color 150ms ease, transform 120ms var(--ease-out)`; ícone 20px. Hover: `background: color-mix(in srgb, var(--vermelho) 86%, #000)`. `:active` `transform: scale(.98)` dentro de `no-preference`. No escuro `border-color: var(--tinta)`. O rótulo nunca quebra linha no desktop (`white-space: nowrap`).
- Hero (≥1024px): texto nas colunas 1 a 5, alinhado ao centro vertical; `.desenho` nas colunas 6 a 12; canvas em `aspect-ratio: 4 / 3`, com largura igual ao menor entre a coluna e `(100svh - 64px - 6rem - 11rem) × 4/3`, para a borda de baixo do desenho ficar pelo menos 11rem acima do fim da tela a partir de 1280×720. Como numa folha de verdade, o canto do carimbo fica livre de vistas. Celular: empilhado, texto primeiro, canvas com `aspect-ratio: 1 / 1`. `figcaption` em três partes separadas por quebras de coluna (grid de 3 no desktop, empilhado no celular), nunca por ponto médio.
- `.estados`: `list-style: none`, grid de 4 colunas no desktop, 2×2 abaixo de 768px, `gap: 1.5rem 1.5rem`; cada canvas `aspect-ratio: 1 / 1; width: 100%; border: 1px solid var(--grafite)` (quadro de detalhe, não cartão: sem fundo diferente, sem sombra).
- `.caso`: grid; `.corte` nas colunas 1 a 8 com canvas `aspect-ratio: 16 / 9`; `.notas` nas colunas 9 a 12; notas numeradas com `ol` decimal em letra técnica, texto corrido em Overpass. Celular empilhado.
- `.quem` (≥768px): retrato nas colunas 1 a 3, `filter: grayscale(1) contrast(1.05)`, `aspect-ratio: 1`, sem borda arredondada; texto nas colunas 4 a 9. Celular: retrato com 40% da largura, texto abaixo.
- `.pedido`: formulário nas colunas 1 a 7, `.mandar` nas colunas 9 a 12. Campos como linhas de preenchimento: `background: transparent; border: 0; border-bottom: 1.5px solid var(--tinta); border-radius: 0; min-height: 48px; font: 400 1.0625rem var(--texto); color: var(--tinta); padding: .5rem 0; width: 100%`; `label` acima com `margin-top: 1.5rem`; `::placeholder` `--grafite`; foco com `outline: 2px solid var(--tinta); outline-offset: 4px`.
- `.rodape`: dentro da moldura, links em linha com `gap: 1.5rem` e ícones de 18px, `padding-block: 3rem`, reservando a mesma altura do carimbo no fim.
- `.carimbo` desktop (≥1024px): `position: fixed; right: var(--moldura); bottom: var(--moldura); z-index: 3; width: 30rem; background: var(--papel); border-top: 1.5px solid var(--tinta); border-left: 1.5px solid var(--tinta)`; grade de células com filetes de 1px `--tinta`:
  ```
  grid-template-columns: 4.5rem 1fr 1fr 1fr;
  grid-template-areas:
    "marca nome    nome    folha"
    "marca peca    peca    cliente"
    "des   des     escala  unidade"
    "acao  acao    acao    acao";
  ```
  Cada célula com rótulo pequeno (`--grafite`, `.6875rem`) em cima e valor (`--tinta`, `.8125rem`) embaixo; `.carimbo-nome` em letra técnica `1.125rem`; a marca R centralizada com 3rem de largura; `.carimbo-acao` ocupa a linha inteira, 48px, texto à esquerda e seta à direita.
- `.carimbo` abaixo de 1024px: barra fixa no fim da tela, `left: var(--margem); right: var(--moldura); bottom: var(--moldura); height: var(--carimbo-h)` (64px), uma linha só: marca R (28px), "Folha n/4" e a `.carimbo-acao` ocupando o resto. Os demais campos somem (`display: none`).
- Um vermelho por tela: enquanto algum botão `.acao` fora do carimbo estiver visível, o carimbo recebe `data-acao-visivel` e a `.carimbo-acao` vira secundária (`background: transparent; color: var(--tinta); border-color: var(--tinta)`), com `transition: background-color 150ms ease, color 150ms ease`. Quando nenhum está à vista, volta ao vermelho.
- Superfícies do navegador: `::selection { background: var(--construcao); color: var(--tinta) }`, `caret-color: var(--tinta)`, `scrollbar-color: var(--grafite) var(--papel)`.
- `.pular`: link de pular visível só no foco, no canto superior esquerdo dentro da moldura.

- [ ] **Step 3: Escrever `assets/js/main.js`**

```js
import { buildWhatsappMessage, buildWhatsappUrl } from './whatsapp.js';

const PECA_PADRAO = 'Trava do conector';
const CLIENTE_PADRAO = 'Você';

export function acompanharFolha(secoes, alvo) {
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) alvo.textContent = `${e.target.dataset.folha}/${secoes.length}`;
  }, { rootMargin: '-45% 0px -45% 0px' });
  secoes.forEach((s) => io.observe(s));
}

export function carimboAoVivo(form, peca, cliente) {
  const curto = (t, n) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);
  form.addEventListener('input', () => {
    peca.textContent = curto(form.peca.value.trim(), 28) || PECA_PADRAO;
    cliente.textContent = curto(form.nome.value.trim(), 20) || CLIENTE_PADRAO;
  });
}

export function enviarPedido(form, aviso, link) {
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const url = buildWhatsappUrl(buildWhatsappMessage(Object.fromEntries(new FormData(form))));
    link.href = url;
    aviso.hidden = false;
    window.open(url, '_blank', 'noopener');
  });
}

// Red marks one thing per screen: the carimbo's action steps back while another action is visible.
export function vermelhoUnico(acoes, carimbo) {
  const visiveis = new Set();
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target);
    carimbo.toggleAttribute('data-acao-visivel', visiveis.size > 0);
  });
  acoes.forEach((a) => io.observe(a));
}

if (typeof document !== 'undefined') {
  const $ = (s) => document.querySelector(s);
  acompanharFolha([...document.querySelectorAll('[data-folha]')], $('[data-carimbo="folha"]'));
  carimboAoVivo($('#pedido-form'), $('[data-carimbo="peca"]'), $('[data-carimbo="cliente"]'));
  enviarPedido($('#pedido-form'), $('#pedido-aviso'), $('#pedido-link'));
  vermelhoUnico([...document.querySelectorAll('main .acao')], $('.carimbo'));
}
```

- [ ] **Step 4: Apagar arquivos antigos e registrar licenças das fontes**

```bash
git rm -q assets/img/logo-icone.jpg assets/img/logo-rf3d.png assets/img/portfolio/README.md
```

`assets/fonts/LICENSES.md`:

```markdown
# Licenças das fontes

- `overpass-*.woff2`: Overpass, Copyright 2021 The Overpass Project Authors (https://github.com/RedHatOfficial/Overpass). SIL Open Font License 1.1. Arquivos tirados do pacote `@fontsource-variable/overpass` 5.3.0.
- `osifont.woff2`: osifont (https://github.com/hikikomori82/osifont), arquivo `osifont-lgpl3fe.ttf`, GNU LGPL 3 com exceção de fonte. Recortado para latim e convertido para WOFF2.
- `osifont-italic.woff2`: osifont itálico, mesmo projeto, GNU GPL 3 com exceção de fonte. Recortado para latim e convertido para WOFF2.
```

- [ ] **Step 5: Verificar no navegador**

Subir o servidor (Global Constraints) e rodar o script de captura em claro e em escuro, salvando em `.impeccable/review/`:

```bash
node <scratchpad>/tools/capture.mjs http://127.0.0.1:8765/ .impeccable/review --eval="[...document.querySelectorAll('a[href^=\"https://wa.me\"]')].map(a=>a.href).every(h=>h.startsWith('https://wa.me/5517997912726?text=Ol%C3%A1'))"
node <scratchpad>/tools/capture.mjs http://127.0.0.1:8765/ .impeccable/review --dark
```

Expected: `errors: []`, `overflowX: false` nas duas larguras, `evaluated: true`. Abrir cada PNG e conferir: h1 em no máximo 2 linhas a 1440px; carimbo no canto inferior direito no desktop e como barra no celular; rodapé visível acima do carimbo no fim da página; no primeiro viewport só o botão do hero está vermelho (o do carimbo está secundário). Medir o contraste do placeholder e dos rótulos pequenos com o `--grafite` (≥ 4,5).

- [ ] **Step 6: Detector do impeccable**

```bash
sh .claude/skills/impeccable/scripts/impeccable detect --json index.html assets/css/style.css
```

Expected: nenhum achado das regras `overused-font`, `all-caps-body`, `marquee`, `codex-grid-background`, `border-accent-on-rounded`, `gradient-text`. Corrigir o que aparecer que seja defeito real; relatar os demais.

- [ ] **Step 7: Commit**

```bash
git add index.html assets/css/style.css assets/js/main.js assets/fonts/ assets/img/marca-r.png assets/img/favicon-32.png assets/img/apple-touch-icon.png assets/img/rafael-favero.webp
git commit -m "feat: folha de desenho técnico com carimbo, pedido e fontes locais"
```

---

### Task 3: O desenho da peça (canvas)

**Files:**
- Create: `assets/js/desenho.js`
- Modify: `assets/js/main.js` (acrescentar, dentro do bloco `if (typeof document !== 'undefined')`, a linha `import('./desenho.js').then((m) => m.iniciar());`)
- Test: sem teste unitário novo (a geometria já está testada na Task 1); verificação por captura e por avaliação no navegador.

**Interfaces:**
- Consumes: de `stl.js` (`parseSTL`, `bounds`, `featureEdgeList`, `sliceAxis`, `loops`, `layerCount`); de `vistas.js` (`VISTAS`, `orbita`, `ISO`, `recortaAbaixo`, `mm`); do HTML os canvas `#desenho-principal`, `canvas.estado[data-estado]`, `#corte`.
- Produces: `export async function iniciar()` (chamada por `main.js`).

**Comportamento exigido**

1. `iniciar()` busca `assets/models/trava-conector.stl` (`fetch` + `arrayBuffer`), monta `parte = { mesh, caixa: bounds(mesh), arestas: featureEdgeList(mesh, 30), camadas: layerCount(mesh, 0.2) }` uma vez só e desenha: o hero, os quatro estados (cada um só quando entra na tela, por IntersectionObserver com `rootMargin: '200px'`) e o corte.
2. Cores lidas a cada desenho de `getComputedStyle(document.documentElement)` (`--papel`, `--tinta`, `--grafite`, `--construcao`). Redesenhar tudo quando `matchMedia('(prefers-color-scheme: dark)')` mudar e quando o tamanho do canvas mudar (`ResizeObserver`). Canvas com `width = clientWidth * dpr`, `dpr = Math.min(devicePixelRatio, 2)`, e `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.
3. Traços (em px CSS): linha visível 1,6 em `--tinta`; linha oculta tracejada 0,8 em `--grafite` com `setLineDash([4, 3])`; cota e linha de chamada 0,8 em `--grafite`; construção 1 em `--construcao`; linha de corte traço-ponto 0,8 com `setLineDash([10, 3, 2, 3])`; hachura 0,7 em `--tinta` a 45° com passo de 5px. Setas de cota cheias, 9px de comprimento por 3px de meia largura. Números em `13px osifont`, com `mm()`.
4. Remoção de linhas ocultas (algoritmo do pintor): para cada vista, projetar os triângulos, descartar os de costas (normal · direção de quem olha ≤ 0), ordenar de trás para frente pela profundidade média, e para cada triângulo preencher com `--papel` e traçar as arestas de `featureEdgeList` que tocam esse triângulo. Nas três vistas estáticas do hero, depois de tudo, desenhar as arestas ocultas: amostrar cada aresta a cada 0,4 mm, marcar como oculto o ponto coberto por algum triângulo de frente com profundidade maior que a do ponto + 0,05 mm, e traçar só os trechos ocultos, tracejados. Na perspectiva que gira, sem linhas ocultas.
5. Composição do hero (canvas 4:3 no desktop, 1:1 no celular), em primeiro diedro: vista frontal no alto à esquerda; vista superior abaixo dela, alinhada em x; vista lateral esquerda à direita da frontal, alinhada em z; perspectiva isométrica (`ISO`) no quadrante de baixo à direita. Uma escala única para as três vistas ortográficas, calculada para caber com margem de 12% e espaço para cotas. Rótulos pequenos em letra técnica, cor `--grafite`, abaixo de cada vista: "Frontal", "Superior", "Lateral esquerda", "Perspectiva". Cotas: largura total (x) abaixo da vista superior, altura total (z) à esquerda da frontal, profundidade total (y) abaixo da lateral, valores de `caixa.size`. Linha de corte A-A na vista superior, em x = 0,05, passando 4mm além do contorno, com setas curtas nas pontas e a letra "A" em cada ponta. No celular (canvas 1:1) a composição vira: frontal em cima à esquerda, lateral em cima à direita, superior embaixo à esquerda, perspectiva embaixo à direita, mantendo o primeiro diedro.
6. Momento autoral (só com `prefers-reduced-motion: no-preference`, uma vez, quando o hero fica 40% visível), em camadas registradas sobre a linha-mestra fixa, com `requestAnimationFrame`:
   - 0 a 700 ms, `--ease-out`: as arestas visíveis das três vistas se desenham do começo ao fim de cada segmento (proporção do comprimento), a frontal começa em 0 ms, a superior em 120 ms e a lateral em 240 ms.
   - 600 a 1100 ms: cotas, rótulos e linha de corte entram por opacidade (`globalAlpha` de 0 a 1).
   - 900 a 2600 ms, linear: a perspectiva é impressa. Altura `h` de 0 ao topo; cada triângulo recortado por `recortaAbaixo(tri, h)`; linhas de camada (cortes `sliceAxis(mesh, 2, k * 0.2 + 0.1)` dos triângulos visíveis) em `--grafite` 0,5 abaixo de `h`; a camada atual em `--tinta` 1,6; a tampa em `h` preenchida com `--papel` a partir de `loops(sliceAxis(mesh, 2, h))` com `fill('evenodd')`.
   - Com movimento reduzido, ou depois do fim, o desenho fica no estado final, com as camadas visíveis na perspectiva.
7. Girar a perspectiva: `pointerdown` dentro do quadrante da perspectiva inicia o arrasto com `setPointerCapture`; azimute += dx × 0,5°, elevação -= dy × 0,3°, elevação limitada entre 10° e 70°; redesenho só da perspectiva em `requestAnimationFrame`. `touch-action: pan-y` no canvas para não prender a rolagem. Teclado com o canvas em foco: setas esquerda e direita giram 15°, cima e baixo mudam a elevação 5°. Nenhuma animação no giro (é ação direta).
8. Estados (`canvas.estado`, estáticos):
   - `foto`: a perspectiva isométrica só em linhas de construção (todas as arestas vivas, inclusive as ocultas, 1px `--construcao`, sem preenchimento).
   - `cotas`: vista frontal em tinta com as cotas de largura e altura.
   - `mesa`: vista superior em tinta com a área da primeira camada (`loops(sliceAxis(mesh, 2, 0.1))`) hachurada e a legenda "Base na mesa" em letra técnica.
   - `camadas`: perspectiva isométrica com todas as linhas de camada em `--grafite` 0,5 e a legenda "132 camadas de 0,2 mm" (o 132 vem de `parte.camadas`).
9. Corte A-A (`#corte`): laços de `sliceAxis(mesh, 0, 0.05)` (0,05 mm fora do plano de simetria, para não passar por vértices) desenhados no plano (y, z) visto da esquerda (u = -y, v = -z), contorno em tinta 1,6 e hachura a 45° recortada pelos laços com `clip('evenodd')`; atrás do corte, a silhueta da metade de x < 0 em `--grafite` 0,8 sem preenchimento; cotas de profundidade e altura; é o maior bloco escuro da página.
10. Nada no canvas usa vermelho.

- [ ] **Step 1: Implementar `assets/js/desenho.js`** conforme o comportamento acima.

- [ ] **Step 2: Verificar no navegador**

```bash
node <scratchpad>/tools/capture.mjs http://127.0.0.1:8765/ .impeccable/review --wait=3500 --eval="(()=>{const c=document.getElementById('desenho-principal');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let tinta=0;for(let i=0;i<d.length;i+=4){if(d[i]<60&&d[i+1]<60&&d[i+2]<60)tinta++;}return {w:c.width,h:c.height,pixelsDeTinta:tinta};})()"
node <scratchpad>/tools/capture.mjs http://127.0.0.1:8765/ .impeccable/review --dark --wait=3500
node <scratchpad>/tools/capture.mjs http://127.0.0.1:8765/ .impeccable/review --reduced --wait=300
```

Expected: `errors: []`, `overflowX: false`, `pixelsDeTinta` maior que zero no claro. Abrir os PNGs: as três vistas no arranjo de primeiro diedro, cotas 32,8, 26,4 e 26,4, linha A-A com as letras, perspectiva com camadas, os quatro estados e o corte hachurado, legíveis nos dois temas; com movimento reduzido o desenho já aparece completo em 300 ms.

- [ ] **Step 3: Girar com o teclado**

Avaliar no navegador (Playwright) após o desenho: focar `#desenho-principal`, pressionar `ArrowRight` 3 vezes e conferir que os pixels do quadrante da perspectiva mudaram (comparar `getImageData` antes e depois). Colar o resultado no relatório.

- [ ] **Step 4: Commit**

```bash
git add assets/js/desenho.js assets/js/main.js
git commit -m "feat: a trava desenhada do STL em primeiro diedro, cortada e impressa em camadas"
```

---

### Task 4: Acabamento e documentação

**Files:**
- Modify: `README.md` (reescrever)
- Create: `assets/img/og.png`
- Modify: `index.html`, `assets/css/style.css`, `assets/js/*.js` só para corrigir achados do detector e da auditoria

- [ ] **Step 1: Imagem de compartilhamento**

Com o servidor de pé, gerar `assets/img/og.png` (1200×630) capturando o hero depois do desenho pronto, com o Playwright e movimento reduzido:

```js
// node -e com playwright-core de <scratchpad>/tools
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
await p.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(800);
await p.screenshot({ path: 'assets/img/og.png' });
await b.close();
```

Registrar a origem da imagem no README ("captura do próprio site").

- [ ] **Step 2: README em pt-BR**

Seções em prosa: o que é o site; como rodar local (`python -m http.server 8765`); como testar (`npm test`); onde trocar o número do WhatsApp (`assets/js/whatsapp.js` e os links `href` do `index.html`, que o teste confere); como trocar a peça desenhada (novo STL em `assets/models/`, notas no `index.html`, o número de camadas no teste de `stl.test.js`); fontes e licenças (`assets/fonts/LICENSES.md`); publicação (o workflow copia só `index.html` e `assets/` para o GitHub Pages a cada push na `main`); arquivos de design (`PRODUCT.md`, `DESIGN.md`, `.impeccable/`) e skills do projeto (`.claude/VENDORED.md`).

- [ ] **Step 3: Auditoria final**

Rodar e colar no relatório:
1. `npm test` (todos verdes).
2. `sh .claude/skills/impeccable/scripts/impeccable detect --json index.html assets/css/style.css assets/js/main.js assets/js/desenho.js`; corrigir os achados mecânicos.
3. Captura em claro, escuro e movimento reduzido nas duas larguras (script de captura): zero erros, sem estouro horizontal.
4. Checklist do taste-skill (seção 14) item a item, com o resultado de cada um.
5. Busca por travessão: `grep -n -P '[\x{2013}\x{2014}]' index.html` sem resultado.

- [ ] **Step 4: Commit**

```bash
git add README.md assets/img/og.png index.html assets/css/style.css assets/js/
git commit -m "docs: README do novo site, imagem de compartilhamento e auditoria"
```
