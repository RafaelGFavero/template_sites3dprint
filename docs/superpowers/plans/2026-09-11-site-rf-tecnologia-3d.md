# Site RF Tecnologia 3D — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever o protótipo MR 3D PRINT como site de vendas de uma página da RF Tecnologia 3D, com conversão via WhatsApp.

**Architecture:** Três arquivos estáticos (`index.html`, `assets/css/style.css`, `assets/js/main.js`) servidos pelo GitHub Pages. Sem build, sem framework, sem dependência externa além de Google Fonts. JS mínimo: menu, header, reveal, formulário → WhatsApp (função pura testada com `node --test`).

**Tech Stack:** HTML5, CSS3 (custom properties, grid), JS ES2020 (módulo), Node 18+ só para o teste.

Spec: `docs/superpowers/specs/2026-09-11-site-rf-tecnologia-3d-design.md`. Design system: `design-system/rf-tecnologia-3d/MASTER.md`.

## Global Constraints

- Idioma do site: pt-BR. Prosa normal (sem estilo telegráfico) em todo texto visível.
- Empresa: **RF Tecnologia 3D**. Instagram `@rf_tec3d` (`https://instagram.com/rf_tec3d`). WhatsApp `+55 17 99791-2726` → link `https://wa.me/5517997912726`. E-mail `rftec3d@gmail.com`.
- Tokens obrigatórios em `:root`: `--bg:#1a1a1a; --bg-deep:#141414; --card:#2a2a2a; --muted:#252525; --border:#4a4a4a; --primary:#d93430; --amber:#ffa000; --blue:#64b5f6; --earth:#a1887f; --text:#f5f5f5; --text-muted:#b3b3b3; --on-primary:#fff; --radius:2px`. Nenhum hex cru fora de `:root`.
- Fontes: `Oxanium` (títulos, `text-transform: uppercase`, peso 700/800), `Inter` (texto), `Source Code Pro` (eyebrows, numeração, specs). Uma única tag `<link>` do Google Fonts.
- Sem verde em lugar nenhum. O botão do WhatsApp usa `--primary` (vermelho), não a cor da marca WhatsApp.
- Ícones: SVG inline (traço 2px, `viewBox 0 0 24 24`, estilo Lucide). Proibido emoji e Font Awesome (remover o CDN do template).
- Alvo de toque ≥ 44×44px. `:focus-visible` com `outline: 2px solid var(--amber); outline-offset: 2px`.
- Contraste ≥ 4,5:1 para texto corrido. `--primary` sobre `--bg` só em texto ≥ 18px bold ou como fundo de botão com `--on-primary`.
- Motion: `transition 300ms cubic-bezier(0.16,1,0.3,1)`; reveal via `IntersectionObserver` adicionando classe `.is-visible`; tudo dentro de `@media (prefers-reduced-motion: no-preference)`. Sem GSAP, sem biblioteca.
- Mobile-first, breakpoints 768px, 1024px, 1440px. Sem scroll horizontal em 375px.
- Não inventar fatos: nada de números de projetos, anos de mercado, depoimentos com nome, certificações, SLA/SLS.
- Commits em português no formato `tipo: descrição` (feat/fix/docs/test/chore).
- Servidor local para verificar: `python -m http.server 8080` na raiz do repo, pela ferramenta de preview do harness (não Bash em primeiro plano).

---

### Task 1: Fundação — tokens, header, hero, marquee

**Files:**
- Modify: `index.html` (reescrever inteiro)
- Modify: `assets/css/style.css` (reescrever inteiro)
- Modify: `assets/js/main.js` (reescrever inteiro)
- Delete: `assets/img/logo.jpg` (logo do template antigo)

**Interfaces:**
- Produces: `index.html` com `<main>` contendo `<section>` vazias com ids `solucoes`, `como-funciona`, `materiais`, `portfolio`, `orcamento`, `faq` (comentário `<!-- Task N -->` dentro) para as tarefas seguintes preencherem; classes utilitárias `.container` (max-width 1200px, padding 0 20px), `.section` (padding 96px 0; 64px em mobile), `.section-deep` (fundo `--bg-deep`), `.eyebrow` (mono, âmbar, texto começa com `// `), `.section-title` (Oxanium uppercase), `.btn`, `.btn-primary`, `.btn-ghost`, `.reveal`; em `main.js` a função `setupReveal(elements)` que observa todo `.reveal`.

- [ ] **Step 1: Reescrever `index.html`**

`<head>`: charset, viewport, `<title>RF Tecnologia 3D | Impressão 3D sob demanda, modelagem e peças personalizadas</title>`, meta description `Impressão 3D FDM sob demanda em São José do Rio Preto e todo o Brasil: peças personalizadas, protótipos, peças de reposição, luminárias autorais e modelagem 3D. Orçamento pelo WhatsApp.`, favicon `assets/img/logo-icone.jpg`, link único Google Fonts `https://fonts.googleapis.com/css2?family=Oxanium:wght@700;800&family=Inter:wght@400;500;600&family=Source+Code+Pro:wght@500&display=swap`, `assets/css/style.css`, `<script type="module" src="assets/js/main.js"></script>`.

Header `<header class="header">` → `.container` com: `<a class="brand" href="#inicio">` (img `assets/img/logo-icone.jpg` 40×40 `alt="RF Tecnologia 3D"` + `<span>RF Tecnologia 3D</span>`); `<nav id="navMenu" class="nav" aria-label="Principal">` com links `Soluções #solucoes`, `Como funciona #como-funciona`, `Materiais #materiais`, `Portfólio #portfolio`, `FAQ #faq`; `<a class="btn btn-primary header-cta" href="https://wa.me/5517997912726?text=Ol%C3%A1%2C%20RF%20Tecnologia%203D!%20Quero%20um%20or%C3%A7amento.">Pedir orçamento</a>`; `<button id="mobileToggle" class="mobile-toggle" aria-expanded="false" aria-controls="navMenu" aria-label="Abrir menu">` com SVG de menu (3 linhas).

Hero `<section class="hero" id="inicio">`: coluna de texto com `<p class="eyebrow">// impressão 3D sob demanda</p>`, `<h1>Da ideia à peça impressa</h1>`, `<p class="lead">Peças personalizadas, protótipos, reposição de componentes e luminárias autorais, impressos em FDM com acabamento artesanal. Você manda a ideia ou o arquivo, a gente modela, imprime e entrega.</p>`, `<div class="hero-actions">` com `Pedir orçamento no WhatsApp` (btn-primary, mesmo link do header) e `Ver soluções` (btn-ghost, `#solucoes`). Coluna visual `<div class="hero-visual">` com `<div class="hero-grid"></div>` (fundo `background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 48px 48px; opacity: .25`), glow radial vermelho (`radial-gradient(circle, rgba(229,57,53,.35), transparent 60%)` — única exceção de rgba com o hex do primário, comentada) e `<img src="assets/img/logo-rf3d.png" alt="" width="520" height="520" class="hero-logo">`. Faixa `<ul class="trust">` com 3 `<li>` (SVG 20px em âmbar + texto): `FDM de alta resolução`, `Modelagem 3D inclusa no orçamento`, `Atendimento direto com quem produz`.

Marquee `<div class="marquee" aria-hidden="true"><div class="marquee-track">` com a lista repetida 2 vezes, itens `<span>` separados por `<span class="dot">·</span>`: `PLA`, `PETG`, `ABS / ASA`, `TPU flexível`, `Modelagem 3D`, `Pintura e acabamento`, `Peças sob demanda`, `Luminárias autorais`, `Miniaturas`, `Brindes personalizados`. Animação CSS `translateX(-50%)` em 40s linear infinita, dentro de `prefers-reduced-motion: no-preference`.

`<main>` com as seis seções placeholder (ids acima, `class="section"`, alternando `section-deep` em `como-funciona`, `portfolio`, `orcamento`), depois `<footer class="footer"><!-- Task 4 --></footer>`.

- [ ] **Step 2: Reescrever `assets/css/style.css`**

`:root` com os tokens da Global Constraints mais `--font-display:'Oxanium',sans-serif; --font-body:'Inter',system-ui,sans-serif; --font-mono:'Source Code Pro',monospace; --ease:cubic-bezier(.16,1,.3,1)`. Reset mínimo (`*{box-sizing:border-box;margin:0}`; `img{max-width:100%;height:auto;display:block}`). `html{scroll-behavior:smooth;scroll-padding-top:80px}` (só em `no-preference`). `body{background:var(--bg);color:var(--text);font-family:var(--font-body);line-height:1.6;padding-top:72px}`. `h1,h2,h3{font-family:var(--font-display);text-transform:uppercase;line-height:1.1}` `h1{font-size:clamp(2.4rem,6vw,4.5rem);font-weight:800}` `h2{font-size:clamp(1.8rem,4vw,2.8rem)}` `h3{font-size:1.15rem}`. `.header{position:fixed;inset:0 0 auto;height:72px;background:rgba(20,20,20,.85);backdrop-filter:blur(12px);z-index:50}` `.header.scrolled{border-bottom:1px solid var(--border)}`. Nav: em mobile `.nav{position:fixed;top:72px;left:0;right:0;background:var(--bg-deep);flex-direction:column;padding:16px 20px;display:none}` `.nav.open{display:flex}`; em ≥1024px inline, `.mobile-toggle{display:none}`, `.header-cta` visível só ≥768px. `.btn{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 24px;font-family:var(--font-display);font-weight:700;text-transform:uppercase;font-size:.875rem;letter-spacing:.06em;border-radius:var(--radius);border:1px solid transparent;cursor:pointer;transition:all .3s var(--ease)}` `.btn-primary{background:var(--primary);color:var(--on-primary)}` hover `filter:brightness(1.1);transform:translateY(-1px)`; `.btn-ghost{border-color:var(--border);color:var(--text)}` hover `border-color:var(--amber)`. `.hero{display:grid;gap:40px;padding:64px 0}` → ≥1024px `grid-template-columns:1.1fr .9fr;align-items:center;min-height:calc(100vh - 72px)`. `.reveal{opacity:0;transform:translateY(12px);transition:opacity .3s var(--ease),transform .3s var(--ease)}` `.reveal.is-visible{opacity:1;transform:none}` — ambos dentro de `@media (prefers-reduced-motion: no-preference)`. `:focus-visible{outline:2px solid var(--amber);outline-offset:2px}`. Marquee: `overflow:hidden;border-block:1px solid var(--border);font-family:var(--font-mono);color:var(--text-muted)`; `.marquee-track{display:flex;gap:32px;width:max-content;animation:marquee 40s linear infinite}`.

- [ ] **Step 3: Reescrever `assets/js/main.js`** como módulo:

```js
export function setupMobileMenu(toggle, nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  }));
}

export function setupHeaderScroll(header) {
  const update = () => header.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

export function setupReveal(elements) {
  if (!('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  elements.forEach((el) => io.observe(el));
}

if (typeof document !== 'undefined') {
  setupMobileMenu(document.getElementById('mobileToggle'), document.getElementById('navMenu'));
  setupHeaderScroll(document.querySelector('.header'));
  setupReveal(document.querySelectorAll('.reveal'));
}
```

- [ ] **Step 4: Verificar no navegador**: console sem erro; em 375px `document.documentElement.scrollWidth === document.documentElement.clientWidth`; menu abre/fecha e `aria-expanded` alterna; header ganha `.scrolled` após rolar; fontes Oxanium/Inter carregadas (`document.fonts.check('700 16px Oxanium')`).

- [ ] **Step 5: Commit**

```bash
git rm -q assets/img/logo.jpg
git add index.html assets/css/style.css assets/js/main.js
git commit -m "feat: fundação do site RF Tecnologia 3D (tokens, header, hero, marquee)"
```

---

### Task 2: Soluções (bento) e Como funciona

**Files:**
- Modify: `index.html` (seções `#solucoes` e `#como-funciona`)
- Modify: `assets/css/style.css` (append)

**Interfaces:**
- Consumes: `.container`, `.section`, `.section-deep`, `.eyebrow`, `.section-title`, `.reveal`, `.btn*` da Task 1.

- [ ] **Step 1: Seção `#solucoes`**: `<p class="eyebrow">// o que fazemos</p>`, `<h2 class="section-title">Soluções em impressão 3D para quem precisa da peça certa</h2>`, `<p class="section-lead">Do protótipo à peça final, cada trabalho é modelado e impresso sob medida.</p>`. `<div class="bento">` com 7 `<article class="card reveal">` (SVG 24px em `--amber`, `<h3>`, `<p>`). O primeiro tem `class="card card-wide reveal"`. Textos:
  1. **Peças sob demanda** — `Qualquer peça que você imagina ou precisa repor: suportes, adaptadores, caixas, engrenagens. Você descreve, nós modelamos e imprimimos.`
  2. **Protótipos** — `Valide forma, encaixe e função antes de investir em produção. Iterações rápidas com custo baixo.`
  3. **Peças de reposição** — `Componente quebrado e sem peça no mercado? Reproduzimos a partir da peça original ou de fotos com medidas.`
  4. **Modelagem 3D** — `Modelagem em Blender e CAD a partir de desenho, foto ou ideia. Arquivo STL entregue pronto para imprimir.`
  5. **Luminárias autorais** — `Luminárias de design próprio, com iluminação LED, para decoração e presentes com identidade.`
  6. **Miniaturas e colecionáveis** — `Miniaturas, action figures e peças de fandom com pintura e acabamento à mão.`
  7. **Brindes personalizados** — `Chaveiros, troféus, porta-cartões e brindes com a marca da sua empresa ou evento.`

  CSS: `.bento{display:grid;gap:16px;grid-template-columns:1fr}` → 768px `repeat(2,1fr)` → 1024px `repeat(3,1fr)`; `.card-wide{grid-column:span 2}` só a partir de 768px. `.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:28px;transition:border-color .3s var(--ease),transform .3s var(--ease)}` hover `border-color:var(--amber);transform:translateY(-2px)`. `.card-wide{border-top:2px solid var(--primary)}`. `.card h3{margin:16px 0 8px}` `.card p{color:var(--text-muted)}`.

- [ ] **Step 2: Seção `#como-funciona`**: `<p class="eyebrow">// como funciona</p>`, `<h2 class="section-title">Quatro passos entre a sua ideia e a peça na mão</h2>`. `<ol class="steps">` com 4 `<li class="step reveal">`: `<span class="step-num">01</span>` (mono, âmbar, 14px) + `<h3>` + `<p>`:
  1. **Envie a ideia ou o arquivo** — `Mande uma foto, um desenho, medidas ou um STL pelo WhatsApp.`
  2. **Modelamos e orçamos** — `Definimos material, tamanho e acabamento e você recebe o valor e o prazo.`
  3. **Imprimimos e acabamos** — `Impressão em FDM, lixamento, pintura ou montagem conforme combinado.`
  4. **Entregamos** — `Retirada em São José do Rio Preto ou envio para todo o Brasil.`
  Abaixo `<a class="btn btn-primary" href="https://wa.me/5517997912726?text=Ol%C3%A1%2C%20RF%20Tecnologia%203D!%20Quero%20um%20or%C3%A7amento.">Começar pelo WhatsApp</a>`. CSS: `.steps{list-style:none;padding:0;display:grid;gap:24px}` → 768px 2 col → 1024px 4 col com `border-top:1px solid var(--border);padding-top:24px` em cada `.step`.

- [ ] **Step 3: Verificar no navegador**: 375px sem scroll horizontal; 7 cards visíveis; cards recebem `.is-visible` ao rolar; em 1024px o card largo ocupa 2 colunas.

- [ ] **Step 4: Commit** `git commit -am "feat: seções Soluções e Como funciona"`

---

### Task 3: Materiais, Portfólio e FAQ

**Files:**
- Modify: `index.html` (seções `#materiais`, `#portfolio`, `#faq`)
- Modify: `assets/css/style.css` (append)
- Create: `assets/img/portfolio/README.md`

- [ ] **Step 1: Seção `#materiais`**: `<p class="eyebrow">// materiais</p>`, `<h2 class="section-title">Materiais para cada uso</h2>`, `<p class="section-lead">Escolhemos o filamento junto com você. Na dúvida, indicamos o melhor para a peça.</p>`. `<div class="materials">` com 4 `<article class="card spec reveal">` com `<h3>` e `<dl class="spec-list">` (mono 13px, `dt` em `--text-muted`, `dd` em `--text`):
  - **PLA** — Resistência: `Média` · Temperatura de uso: `até 55 °C` · Acabamento: `Ótimo, muitas cores` · Indicado para: `Decoração, miniaturas, protótipos visuais`
  - **PETG** — Resistência: `Alta` · Temperatura de uso: `até 75 °C` · Acabamento: `Bom, leve brilho` · Indicado para: `Peças funcionais, suportes, uso externo leve`
  - **ABS / ASA** — Resistência: `Alta a impacto` · Temperatura de uso: `até 95 °C` · Acabamento: `Fosco, aceita lixa e pintura` · Indicado para: `Peças automotivas, carcaças, uso ao sol (ASA)`
  - **TPU flexível** — Resistência: `Alta a abrasão` · Temperatura de uso: `até 60 °C` · Acabamento: `Emborrachado` · Indicado para: `Capas, amortecedores, vedações, correias`
  Cada card tem `border-top:4px solid` com modificador: `.spec-pla{border-top-color:var(--amber)}`, `.spec-petg{...var(--blue)}`, `.spec-abs{...var(--primary)}`, `.spec-tpu{...var(--earth)}`. Grid 1 → 2 (768px) → 4 (1024px).

- [ ] **Step 2: Seção `#portfolio`**: `<p class="eyebrow">// portfólio</p>`, `<h2 class="section-title">Alguns trabalhos</h2>`. `<div class="gallery">` com 6 `<figure class="gallery-item reveal">` contendo `<div class="gallery-ph" role="img" aria-label="LEGENDA">` (fundo `linear-gradient(135deg, var(--card), var(--muted))`, SVG da categoria 40px centralizado em `--text-muted`) e `<figcaption>`. Legendas: `Luminária autoral em PLA`, `Miniatura pintada à mão`, `Suporte funcional em PETG`, `Peça de reposição em ABS`, `Brinde corporativo personalizado`, `Protótipo de encaixe`. Abaixo `<a class="btn btn-ghost" href="https://instagram.com/rf_tec3d" target="_blank" rel="noopener">` com SVG do Instagram + `Ver mais no Instagram @rf_tec3d`. CSS: `.gallery{display:grid;gap:12px;grid-template-columns:repeat(2,1fr)}` → 768px `repeat(3,1fr)`; `.gallery-ph{aspect-ratio:4/3;display:grid;place-items:center;border:1px solid var(--border)}`; `figcaption{font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted);margin-top:8px}`.

  `assets/img/portfolio/README.md` (conteúdo exato):
  ```
  # Fotos do portfólio

  Coloque aqui as fotos reais (JPG ou WebP, 1200×900, até 200 KB cada).
  Em `index.html`, troque cada `<div class="gallery-ph" ...>` por:

      <img src="assets/img/portfolio/nome.jpg" alt="descrição da peça" width="1200" height="900" loading="lazy">
  ```

- [ ] **Step 3: Seção `#faq`**: `<p class="eyebrow">// dúvidas</p>`, `<h2 class="section-title">Perguntas frequentes</h2>`. `<div class="faq">` com 6 `<details class="faq-item reveal">` (`<summary>` + `<p>`):
  1. `Preciso ter o arquivo 3D?` — `Não. Se você tiver um STL ou STEP, ótimo. Se não tiver, modelamos a partir de fotos, desenhos ou medidas, e o custo da modelagem entra no orçamento.`
  2. `Qual o prazo?` — `Depende do tamanho e da quantidade. Peças pequenas costumam ficar prontas em poucos dias; informamos o prazo junto com o valor.`
  3. `Qual o tamanho máximo de uma peça?` — `Peças grandes são divididas em partes e montadas com encaixes ou colagem, sem limite prático de tamanho.`
  4. `Vocês fazem pintura e acabamento?` — `Sim. Lixamento, primer, pintura à mão ou aerógrafo e montagem, conforme o uso da peça.`
  5. `Como funciona o pagamento?` — `Pix ou cartão. Para produções maiores, parte na aprovação e o restante na entrega.`
  6. `Entregam fora de São José do Rio Preto?` — `Sim, enviamos para todo o Brasil pelos Correios ou transportadora.`
  CSS: `.faq-item{border-bottom:1px solid var(--border)}` `summary{min-height:48px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-family:var(--font-display);text-transform:uppercase;font-size:1rem;list-style:none}` `summary::-webkit-details-marker{display:none}` `summary::after{content:'+';font-family:var(--font-mono);color:var(--amber);transition:transform .3s var(--ease)}` `[open] summary::after{transform:rotate(45deg)}` `.faq-item p{color:var(--text-muted);padding-bottom:16px}`. Máximo `max-width:800px` no `.faq`.

- [ ] **Step 4: Verificar no navegador**: FAQ abre e fecha por teclado (Tab + Enter); galeria 2 colunas em 375px; sem scroll horizontal.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: seções Materiais, Portfólio e FAQ"`

---

### Task 4: Formulário de orçamento (TDD), CTA final, footer, botão flutuante, SEO

**Files:**
- Create: `assets/js/whatsapp.js`
- Create: `assets/js/whatsapp.test.js`
- Create: `package.json` (`{"type":"module","scripts":{"test":"node --test assets/js/"}}`)
- Modify: `assets/js/main.js` (importar e ligar o formulário)
- Modify: `index.html` (seção `#orcamento`, CTA final, footer, botão flutuante, OG + JSON-LD)
- Modify: `assets/css/style.css` (append)

**Interfaces:**
- Produces: `buildWhatsappMessage({ nome, tipo, material, quantidade, temArquivo, descricao }) => string` e `buildWhatsappUrl(message) => string` em `assets/js/whatsapp.js`.

- [ ] **Step 1: Teste que falha** — `assets/js/whatsapp.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsappMessage, buildWhatsappUrl } from './whatsapp.js';

test('mensagem completa lista todos os campos em ordem', () => {
  const msg = buildWhatsappMessage({
    nome: 'Ana', tipo: 'Peça de reposição', material: 'PETG',
    quantidade: '2', temArquivo: 'Sim', descricao: 'Engrenagem 40 mm',
  });
  assert.equal(msg,
    'Olá, RF Tecnologia 3D! Quero um orçamento.\n' +
    'Nome: Ana\n' +
    'Tipo de peça: Peça de reposição\n' +
    'Material: PETG\n' +
    'Quantidade: 2\n' +
    'Tenho arquivo 3D: Sim\n' +
    'Descrição: Engrenagem 40 mm');
});

test('campos vazios recebem "não informado"', () => {
  const msg = buildWhatsappMessage({ nome: 'Ana', tipo: '', material: '', quantidade: '', temArquivo: '', descricao: '   ' });
  assert.match(msg, /Material: não informado/);
  assert.match(msg, /Descrição: não informado/);
});

test('url aponta para o número da RF com texto codificado', () => {
  const url = buildWhatsappUrl('Olá & tchau');
  assert.equal(url, 'https://wa.me/5517997912726?text=Ol%C3%A1%20%26%20tchau');
});
```

- [ ] **Step 2: Rodar** `npm test` — esperado: FAIL (`Cannot find module` `whatsapp.js`).

- [ ] **Step 3: Implementar `assets/js/whatsapp.js`**:

```js
export const WHATSAPP_NUMBER = '5517997912726';

const ouNaoInformado = (v) => (v && v.trim()) || 'não informado';

export function buildWhatsappMessage({ nome, tipo, material, quantidade, temArquivo, descricao }) {
  return [
    'Olá, RF Tecnologia 3D! Quero um orçamento.',
    `Nome: ${ouNaoInformado(nome)}`,
    `Tipo de peça: ${ouNaoInformado(tipo)}`,
    `Material: ${ouNaoInformado(material)}`,
    `Quantidade: ${ouNaoInformado(quantidade)}`,
    `Tenho arquivo 3D: ${ouNaoInformado(temArquivo)}`,
    `Descrição: ${ouNaoInformado(descricao)}`,
  ].join('\n');
}

export function buildWhatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Rodar** `npm test` — esperado: 3 passing. Provar por mutação: trocar `'\n'` por `' '` no `join`, rodar, ver 1 falha, desfazer, rodar, ver verde. Colar as três saídas no relatório.

- [ ] **Step 5: Seção `#orcamento`**: `<p class="eyebrow">// orçamento</p>`, `<h2 class="section-title">Peça seu orçamento em um minuto</h2>`, `<p class="section-lead">Preencha e a mensagem já sai pronta no seu WhatsApp. Respondemos em horário comercial.</p>`. `<form id="quoteForm" class="quote-form" novalidate>` com `<label for>` visível em todos os campos (`name` igual ao id):
  - `nome` (text, required, `autocomplete="name"`)
  - `tipo` (select: `Peça sob demanda`, `Protótipo`, `Peça de reposição`, `Modelagem 3D`, `Luminária`, `Miniatura ou colecionável`, `Brinde personalizado`)
  - `material` (select: `Não sei, me indiquem`, `PLA`, `PETG`, `ABS / ASA`, `TPU flexível`)
  - `quantidade` (text, `inputmode="numeric"`, placeholder `Ex.: 1, 10, 50`)
  - `temArquivo` (select: `Sim`, `Não, preciso de modelagem`)
  - `descricao` (textarea rows 4, placeholder `Uso da peça, medidas aproximadas, cor, prazo…`)
  - `<button type="submit" class="btn btn-primary">Enviar pelo WhatsApp</button>`
  - `<p id="quoteFallback" class="form-note" hidden>Se o WhatsApp não abriu, <a id="quoteFallbackLink" href="#" target="_blank" rel="noopener">clique aqui</a>.</p>`
  CSS: grid 1 col → 2 col em 768px (`descricao` e botão em `grid-column:1/-1`); inputs `min-height:48px;background:var(--muted);border:1px solid var(--border);color:var(--text);padding:0 14px;border-radius:var(--radius);font:inherit` focus `border-color:var(--amber)`; `:user-invalid{border-color:var(--primary)}`; label mono 13px `--text-muted`, `margin-bottom:6px`.

  Em `main.js`:

```js
import { buildWhatsappMessage, buildWhatsappUrl } from './whatsapp.js';

export function setupQuoteForm(form, fallback, fallbackLink) {
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const url = buildWhatsappUrl(buildWhatsappMessage(data));
    fallbackLink.href = url;
    fallback.hidden = false;
    window.open(url, '_blank', 'noopener');
  });
}
```
  Chamar no bloco `if (typeof document !== 'undefined')` com `document.getElementById('quoteForm')`, `quoteFallback`, `quoteFallbackLink`.

- [ ] **Step 6: CTA final + footer + botão flutuante**. Antes de `</main>`: `<section class="section cta-final">` com `<h2 class="section-title">Tem uma peça na cabeça?</h2>`, `<p class="section-lead">Manda uma mensagem. Sem compromisso, sem formulário longo.</p>`, botão WhatsApp (btn-primary, link padrão). `<footer class="footer">` com `.container` em 3 colunas (≥768px): (1) marca (ícone 40px + nome) e `Impressão 3D sob demanda com acabamento artesanal.`; (2) `<h3>Contato</h3>` lista: WhatsApp `(17) 99791-2726` → `https://wa.me/5517997912726`, e-mail `rftec3d@gmail.com` → `mailto:rftec3d@gmail.com`, Instagram `@rf_tec3d` → `https://instagram.com/rf_tec3d`; (3) `<h3>Atendimento</h3>`: `Segunda a sexta, 9h às 18h` e `São José do Rio Preto, SP · envios para todo o Brasil`. Linha final `<p class="footer-copy">© 2026 RF Tecnologia 3D</p>`. Botão flutuante `<a class="whats-float" href="https://wa.me/5517997912726?text=Ol%C3%A1%2C%20RF%20Tecnologia%203D!%20Quero%20um%20or%C3%A7amento." aria-label="Falar no WhatsApp" target="_blank" rel="noopener">` com SVG do WhatsApp 28px branco; CSS `position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:var(--primary);display:grid;place-items:center;z-index:40;box-shadow:0 8px 24px rgba(0,0,0,.4)`.

- [ ] **Step 7: SEO** no `<head>`: `og:type website`, `og:title` (= title), `og:description` (= description), `og:image https://rafaelgfavero.github.io/template_sites3dprint/assets/img/logo-rf3d.png`, `og:locale pt_BR`, `<meta name="theme-color" content="#1a1a1a">`, e:

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"LocalBusiness","name":"RF Tecnologia 3D",
"description":"Impressão 3D FDM sob demanda, modelagem 3D, peças personalizadas e luminárias autorais.",
"telephone":"+55-17-99791-2726","email":"rftec3d@gmail.com",
"sameAs":["https://instagram.com/rf_tec3d"],
"address":{"@type":"PostalAddress","addressLocality":"São José do Rio Preto","addressRegion":"SP","addressCountry":"BR"},
"areaServed":"BR"}
</script>
```

- [ ] **Step 8: Verificar no navegador**: submeter com nome vazio → validação nativa bloqueia; preencher e submeter → `#quoteFallback` visível e `#quoteFallbackLink.href` começa com `https://wa.me/5517997912726?text=Ol%C3%A1`; botão flutuante não cobre o botão de enviar em 375px (rolar até o form e conferir `getBoundingClientRect`).

- [ ] **Step 9: Commit** `git add -A && git commit -m "feat: orçamento via WhatsApp com teste, CTA final, footer e SEO"`

---

### Task 5: README e auditoria final

**Files:**
- Modify: `README.md` (reescrever)
- Modify: `assets/css/style.css` / `index.html` só se a auditoria achar defeito

- [ ] **Step 1: `README.md`** em português com: título `RF Tecnologia 3D — site`, o que é (uma página estática, conversão via WhatsApp), rodar local (`python -m http.server 8080`), testar (`npm test`), onde trocar: número do WhatsApp (`assets/js/whatsapp.js` e os links `wa.me` no `index.html`), fotos (`assets/img/portfolio/README.md`), textos (`index.html`), cores (`:root` em `assets/css/style.css`), publicação (GitHub Pages pelo workflow `.github/workflows/static.yml` a cada push em `main`).

- [ ] **Step 2: Auditoria no navegador** em 375px e 1440px, saídas coladas no relatório:
  - console sem erros;
  - `document.documentElement.scrollWidth === document.documentElement.clientWidth`;
  - contraste calculado por JS (luminância relativa WCAG) para `--text/--bg`, `--text-muted/--bg`, `--text-muted/--card`, `--on-primary/--primary`, `--amber/--bg`: todos ≥ 4,5 exceto `--amber/--bg` ≥ 3 (rótulo mono bold); se algum falhar, ajustar o token e registrar;
  - `document.querySelectorAll('a[href="#"]').length === 1` (só o fallback);
  - todo `<img>` tem atributo `alt`; `document.querySelector('.fa, link[href*="font-awesome"]') === null`;
  - Tab percorre header, CTAs, formulário, FAQ e botão flutuante com foco visível.
- [ ] **Step 3: Screenshots** desktop e mobile pela ferramenta de screenshot do navegador do harness; descrever no relatório o que se vê (hero, bento, form).
- [ ] **Step 4: Commit** `git add -A && git commit -m "docs: README de manutenção e auditoria final"`
