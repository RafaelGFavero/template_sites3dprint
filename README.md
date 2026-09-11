# RF Tecnologia 3D — site

Site institucional de uma página só para a RF Tecnologia 3D. É HTML, CSS e
JavaScript puros: não há framework, build, bundler nem dependência de runtime.
O que está no repositório é exatamente o que vai para o ar.

A página não tem back-end e não envia e-mail. Toda a conversão acontece pelo
WhatsApp: os botões de "pedir orçamento" abrem uma conversa já com a mensagem
escrita, e o formulário da seção Orçamento monta esse texto a partir dos campos
preenchidos antes de abrir o link. Se o navegador bloquear a abertura, aparece
logo abaixo do botão um link de escape com a mesma URL.

## Rodar localmente

Na raiz do repositório:

```
python -m http.server 8080
```

Depois abra `http://localhost:8080`. Vale qualquer servidor estático — o
importante é servir por HTTP e não abrir o `index.html` pelo `file://`, porque
o `assets/js/main.js` é um módulo ES e o navegador recusa módulos vindos do
sistema de arquivos.

## Testar

```
npm test
```

O comando roda `node --test assets/js/*.test.js` e cobre as funções puras de
`assets/js/whatsapp.js` — a montagem da mensagem e a montagem da URL. Precisa
de Node 18 ou mais novo; não instala nada, o `package.json` não tem
dependências.

## Onde mexer em cada coisa

**Número do WhatsApp.** Está em dois lugares e os dois precisam mudar juntos.
O primeiro é a constante `WHATSAPP_NUMBER` no topo de `assets/js/whatsapp.js`,
usada pelo formulário. O segundo são os links `https://wa.me/5517997912726...`
escritos direto no `index.html` — o botão do cabeçalho, os do hero e do "como
funciona", o da chamada final, o do rodapé e o botão flutuante. Procure por
`wa.me` no arquivo para achar todos. O número vai sem sinais: código do país,
DDD e o número, tudo grudado.

**Fotos do portfólio.** As instruções estão em `assets/img/portfolio/README.md`.
Hoje a galeria usa blocos de espaço reservado (`<div class="gallery-ph">`) que
devem ser trocados por `<img>` assim que houver foto real. O logotipo fica em
`assets/img/logo-rf3d.png` e `assets/img/logo-icone.jpg`.

**Textos.** Todos ficam no `index.html`, em português e em prosa normal. Cada
seção tem um `id` (`inicio`, `solucoes`, `como-funciona`, `materiais`,
`portfolio`, `orcamento`, `faq`), o mesmo usado pelo menu do cabeçalho. Se você
renomear um `id`, ajuste também o link correspondente no `<nav>`.

**Cores e tipografia.** Todos os valores vivem no bloco `:root` do começo de
`assets/css/style.css`. Trocar `--primary` ali muda os botões, o destaque do
cabeçalho e o botão flutuante de uma vez. A regra que o projeto segue é não
escrever nenhum código hexadecimal fora do `:root`: no resto da folha só entra
`var(--token)`. As três famílias de fonte vêm de uma única tag `<link>` do
Google Fonts no `<head>` do `index.html`.

**Ícones.** São SVG escritos à mão dentro do próprio HTML, com traço de 2px e
`viewBox="0 0 24 24"`. Não há Font Awesome nem emoji; se precisar de um ícone
novo, copie o formato dos que já existem.

## Publicação

O deploy é automático pelo GitHub Pages. O workflow
`.github/workflows/static.yml` roda a cada push na branch `main`, empacota o
repositório inteiro e publica. Não há etapa de build, então o que você commitar
é o que aparece no ar em um ou dois minutos. Também dá para disparar o workflow
à mão pela aba Actions do GitHub.
