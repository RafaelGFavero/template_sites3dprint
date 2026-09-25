# Site da RF Tecnologia 3D

Site de uma página da RF Tecnologia 3D. Rafael Favero redesenha e imprime em 3D peças plásticas que não se vendem mais avulsas, e o site existe para quem tem a peça quebrada na mão mandar a foto pelo WhatsApp. A página imita uma folha de desenho técnico. A peça de exemplo é a trava do conector rápido da linha de combustível, uma peça real, desenhada a partir do próprio arquivo STL em três vistas cotadas no primeiro diedro, com o corte A-A e uma perspectiva que se imprime camada por camada quando a página abre. O pedido sai como mensagem pronta no WhatsApp. Não há back-end: o formulário só monta o texto e abre a conversa.

## Como o código está organizado

É HTML, CSS e JavaScript puros, sem framework, sem etapa de build e sem dependência para instalar. Quase todo o texto da página fica no `index.html`; as exceções são os rótulos desenhados no canvas, em `desenho.js`, e a mensagem do WhatsApp, em `whatsapp.js`.

O visual está em `assets/css/style.css`. As cores são variáveis declaradas no `:root` e no bloco `prefers-color-scheme: dark`, onde a folha vira uma cópia heliográfica, e nenhum código hexadecimal aparece no CSS fora desses dois lugares. O canvas lê as mesmas variáveis a cada desenho. A cor do papel também está repetida nas duas `<meta name="theme-color">` do `index.html`, que precisam mudar junto com ela.

O JavaScript está dividido em módulos pequenos em `assets/js/`: `stl.js` lê o STL binário e fatia a malha, `vistas.js` faz as projeções, `desenho.js` desenha a peça nos canvas (o desenho do topo da página, os quatro quadros de "Da foto à peça impressa" e o corte A-A), `whatsapp.js` monta a mensagem e o link, e `main.js` cuida do resto: o contador de folhas e os campos do carimbo, o envio do pedido e a regra de um só botão vermelho por tela.

## Rodar localmente

Na raiz do repositório:

```
python -m http.server 8765 --bind 127.0.0.1
```

Depois abra `http://127.0.0.1:8765`. O `--bind` deixa o servidor só nesta máquina; sem ele, o `http.server` escuta em toda a rede local e expõe a pasta inteira, inclusive o `.git/`. Precisa ser por um servidor: aberta direto pelo `file://`, a página perde os módulos JavaScript, que o navegador bloqueia, e fica sem o desenho, sem o envio do pedido, sem o contador de folhas e sem a regra do vermelho único. Qualquer servidor estático funciona.

## Testar

```
npm test
```

O comando roda `node --test assets/js/*.test.js`. `stl.test.js` confere a leitura e o fatiamento da malha, `vistas.test.js` as projeções e `whatsapp.test.js` a mensagem e o link do WhatsApp, inclusive os quatro links gravados no `index.html`. Não há nada para instalar, porque o `package.json` não tem dependências. Os testes foram rodados no Node 24.

## Trocar o número do WhatsApp

O número dos links está em três lugares, e os três mudam juntos. O primeiro é a constante `WHATSAPP_NUMBER`, no topo de `assets/js/whatsapp.js`, que o formulário usa para montar o link. O segundo são os quatro links `https://wa.me/...` escritos no `index.html`: o botão do topo da página, o link "abra por aqui" que aparece abaixo do botão depois de cada envio, o do rodapé e o botão do carimbo. Os quatro são iguais ao link que o formulário gera quando ninguém preenche nada, com a mensagem curta já escrita. O terceiro é a constante `LINK_PADRAO`, em `assets/js/whatsapp.test.js`. O teste confere que os quatro links do HTML são iguais a ela e que o `whatsapp.js` gera exatamente esse link; se um dos três lugares ficar para trás, o `npm test` falha.

Se o texto da mensagem padrão mudar, gere o link novo com

```
node -e "import('./assets/js/whatsapp.js').then((m) => console.log(m.buildWhatsappUrl(m.buildWhatsappMessage())))"
```

e cole o resultado nos quatro links e no teste.

O telefone também aparece escrito no rodapé e no campo `telephone` do bloco JSON-LD, no `<head>` do `index.html`. Esses dois o teste não confere.

## Trocar a peça desenhada

Todo o desenho sai de `assets/models/trava-conector.stl`. O STL de outra peça precisa ser binário, em milímetros, com o Z para cima e a base apoiada em z = 0, do jeito que a peça vai para a mesa da impressora. A vista frontal é a peça vista do lado de -Y, e o eixo de simetria dela é desenhado em x = 0, então a peça precisa estar centrada em x. Ponha o arquivo em `assets/models/` com o mesmo nome, ou troque o caminho no `fetch` da função `iniciar()`, em `assets/js/desenho.js`.

Duas constantes de `desenho.js` são medidas da trava e precisam ser refeitas na peça nova. `FURO` guarda o centro, o raio e a espessura da placa em volta do furo; dali saem as linhas de centro do furo nas vistas superior e lateral. `PLANO_AA` é o y do corte A-A. Na trava ele passa pelo eixo do furo, em y = 12,8 (fica 0,05 mm fora do centro, para não cair em cima de vértices da malha). Numa peça sem furo, as duas linhas de centro do furo precisam sair de `desenharTudo()`.

No `index.html` ficam os textos sobre a trava: as quatro notas ao lado do corte, o nome na legenda do desenho, os rótulos dos canvas para leitor de tela (os `aria-label`, que citam as medidas da trava e as 132 camadas) e as frases "A trava leva 132." e "A trava, por exemplo, imprime sem suporte." O campo Peça do carimbo começa com "Trava do conector", escrito no HTML e também em `PECA_PADRAO`, no `main.js`.

Em `assets/js/stl.test.js`, os números medidos da trava viraram expectativa: 854 triângulos, caixa de 32,8 × 26,4 × 26,4 mm, 132 camadas de 0,2 mm e o corte A-A em y = 12,8 fechando em dois laços. Meça a peça nova, troque esses valores e o plano do corte, e rode `npm test`. Depois gere de novo a imagem de compartilhamento, que mostra o desenho, e revise o caso descrito no `PRODUCT.md`.

## Imagens e a origem de cada uma

As imagens ficam em `assets/img/`. `marca-r.png` é o R da marca, recortado da arte original do logo que o dono forneceu, com fundo transparente, e `favicon-32.png` e `apple-touch-icon.png` foram gerados a partir dele. `rafael-favero.webp` é o retrato que o Rafael forneceu, com uso aprovado em 24/09/2026. `og.png` é a imagem que aparece quando alguém compartilha o link: uma captura do próprio site, o topo da página a 1200 × 630 px com movimento reduzido, para o desenho sair pronto, e sem a navegação do topo nem a dica de arrastar, que não fazem sentido numa imagem parada.

Cada PNG leva a própria origem gravada dentro do arquivo, num bloco de texto. A ferramenta não grava dentro de WebP, então a origem do retrato fica ao lado dele, em `rafael-favero.webp.json`. Para ler a origem de uma imagem ou listar as que estão sem, no PowerShell:

```
.\.claude\skills\impeccable\scripts\impeccable.cmd embed-prompt assets/img/og.png --read
.\.claude\skills\impeccable\scripts\impeccable.cmd embed-prompt --scan assets/img
```

No Git Bash, no Linux ou no macOS, o comando é `sh .claude/skills/impeccable/scripts/impeccable` com os mesmos argumentos. Uma imagem nova recebe a origem com `embed-prompt <arquivo> --prompt "de onde ela veio"`.

Para gerar a `og.png` de novo, suba o servidor local e capture a janela de 1200 × 630 no Chrome com movimento reduzido, depois que as fontes carregarem, escondendo a navegação do topo e a dica de arrastar só nessa captura. O Playwright não faz parte do repositório; o trecho abaixo, salvo como `.mjs` numa pasta com o `playwright-core` instalado e rodado da raiz do repositório, faz a captura:

```js
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
await p.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(800);
await p.addStyleTag({ content: '.topo nav, #desenho-dica { visibility: hidden; }' });
await p.screenshot({ path: 'assets/img/og.png' });
await b.close();
```

O arquivo novo sai sem a origem, então grave de novo com o `embed-prompt`.

## Fontes e ícones

As duas famílias de letra estão no repositório, em `assets/fonts/`, e nada vem do Google Fonts ou de outro CDN. A osifont é letra técnica no padrão ISO 3098 e aparece nos títulos, nas cotas, no carimbo e nas legendas; a Overpass é a do texto corrido. A origem e a licença de cada arquivo estão em `assets/fonts/LICENSES.md`. A Overpass é OFL 1.1. A osifont normal é LGPL 3 e a itálica é GPL 3, ambas com exceção de fonte, que deixa a página usar a letra sem herdar a licença.

Os ícones são da Phosphor, peso regular, copiados como SVG para dentro do `index.html` (licença MIT).

## Publicação

O workflow `.github/workflows/static.yml` publica no GitHub Pages a cada push na branch `main`, e também pode ser disparado à mão pela aba Actions. Ele copia só o `index.html` e a pasta `assets/`, tira os arquivos de teste (`assets/js/*.test.js`) e publica o que sobrou; documentação, skills e plano ficam só no repositório. Como não há build, o `index.html` e a pasta `assets/` commitados na `main` são exatamente o que vai para o ar, em https://rafaelgfavero.github.io/template_sites3dprint/. Esse endereço está escrito no `<head>` do `index.html`, na tag `og:image` e no bloco JSON-LD, e os dois precisam mudar se o site mudar de endereço.

## Arquivos de design e skills

O `PRODUCT.md` guarda os fatos do negócio: o público, o que a RF faz e o que o site nunca pode afirmar sem confirmação, como cidade, frete, preço, prazo, forma de pagamento, horário, materiais em estoque e tamanho máximo. O `.impeccable/surfaces/index-html.md` é o contrato da direção visual, que trata a página como a folha de desenho da peça de quem visita, com carimbo, cotas e um só vermelho, o da ação. O plano da reescrita está em `docs/superpowers/plans/2026-09-24-redesign-folha-de-desenho.md`, com as regras que o código segue: cor só por variável, um vermelho por tela, movimento só dentro de `prefers-reduced-motion: no-preference` e nada de ouvir o evento de rolagem (o que depende da rolagem usa `IntersectionObserver`). As capturas de revisão ficam em `.impeccable/review/`, fora do git.

As skills e os agentes de terceiros que o Claude Code usa nesta pasta (os do impeccable, do taste-skill e do Emil Kowalski) estão em `.claude/skills/` e `.claude/agents/`. O `.claude/VENDORED.md` diz de onde cada um veio, de que commit e com que licença.
