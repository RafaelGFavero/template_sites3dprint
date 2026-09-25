---
name: RF Tecnologia 3D
description: A folha de desenho técnico da peça de quem visita, com papel sulfite, traço em tinta, cotas em grafite e um só vermelho, o da ação.
colors:
  vermelho: "#d93430"
  vermelho-pressionado: "#bb2d29"
  sobre-vermelho: "#ffffff"
  construcao: "#7fb3dd"
  construcao-escuro: "#6f9fd0"
  papel: "#f2f4f3"
  papel-escuro: "#17355f"
  tinta: "#15181b"
  tinta-escuro: "#eef3f8"
  grafite: "#50575e"
  grafite-escuro: "#b9c9dc"
typography:
  display:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: "clamp(2rem, .25rem + 3.2vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0"
  display-desktop:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: "clamp(2.4rem, 4.3vw - .3rem, 3.25rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0"
  headline:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: "clamp(1.5rem, .5rem + 1.6vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: ".02em"
  title:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: ".04em"
  title-vista:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: ".9375rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: ".06em"
  body:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  body-lead:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: ".9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label-formulario:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: ".9375rem"
    fontWeight: 600
    lineHeight: 1.6
  campo:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  acao:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: ".04em"
  label:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: ".8125rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: ".06em"
  carimbo-rotulo:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: ".6875rem"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: ".06em"
  carimbo-valor:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: ".8125rem"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: ".06em"
  carimbo-nome:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: ".06em"
  carimbo-linha-nome:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: ".875rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: ".06em"
  carimbo-linha-valor:
    fontFamily: "osifont, Overpass, sans-serif"
    fontSize: ".75rem"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: ".06em"
rounded:
  none: "0px"
spacing:
  xs: ".25rem"
  sm: ".5rem"
  md: ".75rem"
  lg: "1rem"
  xl: "1.5rem"
  xxl: "2.5rem"
  xxxl: "3rem"
  moldura: "6px"
  moldura-desktop: "12px"
  margem-desktop: "28px"
  respiro: "clamp(1rem, 4vw, 3.5rem)"
  folha: "clamp(3.5rem, 8vw, 5rem)"
  hero-topo: "clamp(3rem, 7svh, 6rem)"
components:
  acao:
    backgroundColor: "{colors.vermelho}"
    textColor: "{colors.sobre-vermelho}"
    typography: "{typography.acao}"
    rounded: "{rounded.none}"
    padding: "0 1.25rem"
    height: "48px"
  acao-hover:
    backgroundColor: "{colors.vermelho-pressionado}"
    textColor: "{colors.sobre-vermelho}"
  acao-recuada:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    typography: "{typography.acao}"
    rounded: "{rounded.none}"
    padding: "0 .875rem"
    height: "48px"
  link:
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    height: "44px"
  campo:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.campo}"
    rounded: "{rounded.none}"
    padding: ".5rem 0"
    height: "48px"
  campo-rotulo:
    textColor: "{colors.tinta}"
    typography: "{typography.label-formulario}"
  topo:
    height: "64px"
  topo-marca:
    textColor: "{colors.tinta}"
    typography: "{typography.acao}"
    height: "44px"
  topo-link:
    textColor: "{colors.tinta}"
    typography: "{typography.body-small}"
    height: "44px"
  legenda:
    textColor: "{colors.grafite}"
    typography: "{typography.label}"
  rotulo-vista:
    textColor: "{colors.tinta}"
    typography: "{typography.title-vista}"
  carimbo-bloco:
    backgroundColor: "{colors.tinta}"
    width: "30rem"
  carimbo-celula:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    typography: "{typography.carimbo-valor}"
    padding: ".25rem .625rem"
  carimbo-rotulo:
    textColor: "{colors.grafite}"
    typography: "{typography.carimbo-rotulo}"
  carimbo-nome:
    textColor: "{colors.tinta}"
    typography: "{typography.carimbo-nome}"
    padding: "0 .625rem"
  carimbo-barra:
    backgroundColor: "{colors.papel}"
    height: "64px"
    padding: "0 .5rem"
  carimbo-linha:
    backgroundColor: "{colors.tinta}"
    height: "3.5rem"
    width: "59rem"
  carimbo-linha-celula:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    typography: "{typography.carimbo-linha-valor}"
    padding: ".25rem .375rem"
  carimbo-linha-nome:
    textColor: "{colors.tinta}"
    typography: "{typography.carimbo-linha-nome}"
    padding: "0 .375rem"
---

# Design System: RF Tecnologia 3D

## Overview

**Creative North Star: "A Folha de Desenho Técnico"**

O site inteiro é a folha de desenho técnico da peça de quem visita, no padrão ABNT: papel sulfite frio, moldura em tinta com a margem de encadernação mais larga à esquerda, carimbo fixo no canto inferior direito e a peça real desenhada em primeiro diedro, com cotas em milímetros. A página conta o serviço pelo próprio desenho: a peça quebrada vira vista cotada, corte hachurado e camadas de impressão.

A densidade é de prancha: muito papel livre, linha fina e precisa, pouca massa. O único campo pesado é a hachura a 45° do corte. A cor fica em três materiais de desenho (tinta, grafite e azul de construção), e o vermelho aparece uma vez por tela, sempre na ação. No escuro, a mesma folha vira cópia heliográfica, com papel azul e traço claro.

O mundo recusa o padrão dos sites de impressão 3D: hero escuro com impressora brilhando, grade de cartões de serviço, passos numerados, FAQ em sanfona e bolha verde de chat flutuante. O movimento se resume a um momento, o desenho do hero se traçando e a perspectiva se imprimindo camada por camada; o resto da página fica parado.

**Key Characteristics:**
- Papel sulfite frio e traço em tinta; no escuro, cópia heliográfica em azul.
- Moldura fixa com margem de encadernação e carimbo ABNT sempre à vista, preenchido ao vivo.
- A peça real, desenhada a partir do STL fora do site, em primeiro diedro com cotas em milímetros, corte A-A hachurado e perspectiva que se imprime em camadas.
- Letra técnica ISO 3098 (osifont) no que pertence ao desenho; Overpass na leitura.
- Um vermelho por tela, e ele é a ação.
- Nenhuma sombra, nenhum cartão, nenhum canto arredondado.

## Colors

Paleta de prancha: três materiais de desenho sobre papel frio e um único vermelho de revisão, com um segundo jogo de valores para a cópia heliográfica do esquema escuro.

### Primary
- **Vermelho de Revisão** (#d93430): a marca de revisão da folha, usada só na ação "Mandar foto da peça": fundo do botão no hero, no formulário e na célula de ação do carimbo, com borda de 1,5px da mesma cor. Branco sobre ele dá 4,68:1; contra o papel claro, o botão marca 4,24:1.
- **Vermelho Pressionado** (#bb2d29): o vermelho a 86% sobre preto, pré-calculado. Fundo da ação no hover, só em dispositivos com hover. Branco sobre ele dá 5,97:1.
- **Branco sobre Vermelho** (#ffffff): texto e ícone dentro da ação vermelha, e em nenhum outro lugar.

### Secondary
- **Azul de Construção** (#7fb3dd): o azul não fotográfico do esboço. Desenha as linhas de construção do quadro "Você manda a foto", o esboço da perspectiva na abertura do hero, que some sob a tinta no fim, e o fundo da seleção de texto, com tinta por cima (7,97:1). Sobre o papel fica em 2,02:1, por isso nunca carrega texto nem informação que precise ser lida.
- **Azul de Construção da Cópia** (#6f9fd0): o mesmo material no esquema escuro, 4,41:1 sobre o azul heliográfico.

### Neutral
- **Papel Sulfite** (#f2f4f3): fundo da página, das células do carimbo, do link de pular e de todo canvas, que pinta o papel antes de traçar. Repetido na meta theme-color clara.
- **Azul Heliográfico** (#17355f): o papel no esquema escuro. Repetido na meta theme-color escura.
- **Tinta Nanquim** (#15181b): texto, títulos, contorno visível da peça, hachura, moldura, bordas e filetes do carimbo, linha de preenchimento, anel de foco e cursor de texto. 16,13:1 sobre o papel.
- **Tinta da Cópia** (#eef3f8): a tinta no escuro, 10,99:1 sobre o azul heliográfico. No escuro também contorna a ação vermelha e vira o fundo da seleção de texto, com papel por cima.
- **Grafite** (#50575e): o que mede e referencia: cotas, linhas ocultas, eixos, rótulos de vista, legendas, rótulos do carimbo, régua de troca de folha, placeholder, dica, números das notas, marcadores de lista e barra de rolagem. 6,63:1 sobre o papel, o bastante para letra pequena.
- **Grafite da Cópia** (#b9c9dc): o grafite no escuro, 7,28:1 sobre o azul heliográfico.

### Named Rules
**The Vermelho Único Rule.** Uma coisa vermelha por tela, e ela é a ação de mandar a foto. Quando uma ação vermelha do conteúdo está à vista, a ação do carimbo recua para papel e tinta; quando nenhuma está, ela volta ao vermelho. Desenho, títulos, links e ícones soltos nunca são vermelhos. A marca R é logo, fica isenta e aparece só no carimbo, no tamanho de marca.

**The Materiais de Prancha Rule.** Fora a ação, toda cor é um material de desenho com função fixa: tinta desenha e escreve, grafite mede e referencia, azul de construção esboça. A paleta é fechada; o que não for um desses materiais não entra na folha.

**The Cópia Heliográfica Rule.** No escuro mudam só papel, tinta, grafite e azul de construção. Geometria, pesos de linha, letra e o vermelho da ação ficam iguais, e a ação ganha borda de 1,5px em tinta, porque o vermelho sobre o azul heliográfico fica em 2,62:1.

## Typography

**Display Font:** osifont (with Overpass, sans-serif)
**Body Font:** Overpass (with system-ui, sans-serif)
**Label Font:** osifont (with Overpass, sans-serif)

**Character:** A osifont é a letra técnica da norma ISO 3098, a do carimbo de uma prancha; em caixa alta e inclinada, os títulos parecem escritos no normógrafo. A Overpass é uma grotesca de engenharia e leva a leitura corrida sem fantasia de desenho. As duas famílias são servidas do próprio repositório em WOFF2 (osifont normal e itálica; Overpass variável de 100 a 900, latim e latim estendido), com font-display: swap e pré-carga da osifont itálica e da Overpass latina.

O contrato de direção previa letra inclinada também nas cotas e no carimbo. A construção deixou cotas, legendas e carimbo na osifont vertical, e este documento registra o que foi construído.

### Hierarchy
- **Display** (400 itálico, clamp(2rem, .25rem + 3.2vw, 3rem) e, a partir de 1024px, clamp(2.4rem, 4.3vw - .3rem, 3.25rem), 1.05): só o h1 do hero, em duas linhas, com espacejamento 0 e -.2em entre palavras. O teto foi medido para a segunda linha (8,963em) caber nas cinco colunas do texto.
- **Headline** (400 itálico, clamp(1.5rem, .5rem + 1.6vw, 2.25rem), 1.1): títulos de folha (h2), com .02em de espacejamento e -.18em entre palavras.
- **Title** (400 itálico, 1.125rem, 1.3): h3 de bloco lateral, como "O que mandar", com .04em. O rótulo de vista sob cada quadro usa .9375rem com .06em; o título "Notas" usa a letra pequena de legenda, em grafite, também inclinada.
- **Body** (400, 1.0625rem, 1.6): texto corrido em Overpass, parágrafos até 60ch com quebra "pretty". O lead do hero sobe para 1.1875rem. Texto de apoio (navegação, notas, dica, aviso, rodapé, link de pular) usa .9375rem; o rótulo de formulário usa .9375rem em 600; o texto digitado nos campos fica em 1.0625rem com entrelinha 1.5.
- **Label** (400, .8125rem, 1.3, .06em, caixa alta): a letra técnica pequena, vertical e em grafite, só no que pertence ao desenho: legendas de figura, carimbo, título das notas e números das notas.
- **Ação** (400 itálico, 1rem, 1, .04em, caixa alta): o rótulo da ação e a marca "RF Tecnologia 3D" do topo.
- **Carimbo** (400, vertical, .06em, caixa alta): rótulo de célula em .6875rem com entrelinha .9, valor em .8125rem em tinta com entrelinha 1.05 e folga de .35em em cima (a osifont sobe o acento a .98em, e o recorte das reticências cortaria o circunflexo), nome em 1.125rem. Na linha única do laptop baixo, nome em .875rem e valor em .75rem.
- **Desenho** (osifont 13px e 11px, verticais): cifras de cota e a letra A do corte em 13px, rótulos de vista e de quadro em 11px, caixa alta.

### Named Rules
**The Letra Técnica Rule.** osifont em caixa alta só no que pertence ao desenho: títulos, marca, ação, cotas, legendas, carimbo e notas. Leitura corrida, rótulo de formulário, navegação e rodapé são sempre Overpass em caixa normal. Não existe terceira família.

**The Inclinada nos Títulos Rule.** Títulos (h1, h2, h3), a marca do topo e a ação usam a osifont itálica. Cotas, legendas, rótulos de vista do canvas e carimbo usam a osifont vertical.

**The Espaço Justo Rule.** A osifont tem espaço largo entre palavras, então toda composição nela aperta word-spacing: -.2em no h1, -.18em no h2, -.1em em h3, ação, marca, legendas e carimbo. A unidade "mm" nunca vai para caixa alta, nem dentro de texto em caixa alta.

## Layout

A página é uma folha contínua dentro de uma moldura fixa. As seções são folhas de largura inteira, empilhadas e numeradas no carimbo de 1/4 a 4/4; cada troca de folha é uma régua de 1px em grafite que vai de uma linha da moldura à outra. O conteúdo fica centrado até 82.5rem pelo padding lateral, e o respiro lateral é clamp(1rem, 4vw, 3.5rem) somado à moldura e à margem.

- **Moldura e margem:** 6px em volta no celular. A partir de 1024px, 12px em cima, à direita e embaixo, e 28px à esquerda, a margem de encadernação.
- **Topo:** 64px de altura, marca à esquerda e navegação à direita, sem régua embaixo.
- **Folha:** padding vertical de clamp(3.5rem, 8vw, 5rem) e 2.5rem entre blocos. O hero tem respiro superior de clamp(3rem, 7svh, 6rem).
- **Grade:** uma coluna no celular. A partir de 1024px, 12 colunas com 1.5rem de vão no hero (texto nas colunas 1 a 5, desenho nas 6 a 12), em "Como eu faço" (corte em 8 colunas, notas em 4) e no pedido (formulário em 7, lista em 4, uma coluna livre entre eles). "Quem faz" entra na grade de 12 colunas já em 768px, com o retrato em 3 e o texto em 6.
- **Desenho do hero:** a largura vem da altura da janela, (100svh menos topo, respiro do hero, reserva do carimbo e 4.5rem da legenda) vezes 4/3, para que figura e legenda terminem acima do carimbo. Piso de 34rem quando a legenda empilhada ainda cabe acima dele: a partir de 654px de altura com o carimbo em linha, 772px com o carimbo inteiro. Canvas 1:1 no celular e 4:3 no desktop.
- **Quadros:** os quatro estados em 2 colunas no celular e 4 a partir de 768px, com 1.5rem de vão; cada canvas é quadrado. O corte é 4:3.
- **Ritmo:** .5rem entre desenho e rótulo, .75rem entre itens de lista, 1rem do título ao parágrafo, 1.5rem entre campos e entre itens de grade, 2rem até os botões do hero, 2.5rem entre blocos de uma folha, 3rem entre formulário e lista no celular e no respiro do rodapé.
- **Reserva do carimbo:** o main termina com padding igual ao carimbo (64px mais 2rem no celular, 11rem no desktop, 5rem no laptop baixo), e o scroll-padding-bottom impede o foco de parar embaixo dele.
- **Rodapé:** no desktop fica à esquerda do carimbo, com padding direito igual à moldura mais a largura do carimbo mais 2rem; no laptop baixo sobe para cima da linha do carimbo.
- **Pontos de quebra:** 768px (quadros em 4, "Quem faz" em grade, navegação completa), 1024px (moldura larga, carimbo em bloco, grades de 12 colunas), altura de até 760px a partir de 1024px (carimbo em linha) e, nessa mesma altura, largura abaixo de 1200px (a linha perde Desenho e Escala). A legenda do hero empilha quando a figura tem menos de 41.5rem.

### Named Rules
**The Folha Contínua Rule.** Uma página é uma folha. Seções trocam de folha com a régua de 1px em grafite, de moldura a moldura, e nunca com cartão, faixa de fundo, sombra ou papel de outra cor.

**The Canto do Carimbo Rule.** O canto inferior direito pertence ao carimbo em todas as larguras. Nenhuma vista, legenda, campo ou foco termina embaixo dele; a reserva do main e o scroll-padding existem para isso.

## Elevation & Depth

Plano, sem nenhuma sombra, brilho, desfoque ou degradê; não existe vocabulário de sombra. A profundidade é ordem de sobreposição de papel sobre papel, sempre marcada por uma linha de tinta. A moldura fixa (camada 2) traz um contorno de 28px na cor do papel que apaga o que rola pela margem. O carimbo (camada 3) tem fundo de papel, filete de 1,5px em tinta no topo e, no desktop, uma faixa de papel de 1.5rem à esquerda para que nada encoste nele. O link de pular (camada 4) é papel com borda de tinta. Dentro do desenho, o que fica atrás já chega separado em linha oculta, calculado fora do site; as linhas ocultas são traçadas antes da tinta, para que a visível vença onde as duas coincidem.

### Named Rules
**The Papel Sobre Papel Rule.** Nada flutua. O que fica por cima é papel com uma linha de tinta na borda, nunca uma sombra.

## Shapes

Cantos retos em tudo: botão, campo, célula do carimbo, retrato e canvas. O raio 0 é declarado na ação e nos campos para anular o arredondamento do navegador. A forma é feita de linha: contornos de interface em 1,5px de tinta (moldura, bordas do carimbo, borda da ação, linha de preenchimento, link de pular), réguas de 1px em grafite (troca de folha, régua da legenda, régua do rótulo de vista) e filetes de 1px em tinta entre as células do carimbo, feitos pelo fundo de tinta que aparece nos vãos da grade. O retrato é um quadrado em escala de cinza. Os ícones são Phosphor de peso regular, em SVG embutido preenchido com currentColor. As únicas curvas da página são as da própria peça e as dos ícones.

### Named Rules
**The Dois Pesos Rule.** A interface tem dois pesos de linha, como o desenho: 1,5px em tinta contorna, 1px em grafite separa. O anel de foco de 2px é a única linha mais grossa e só aparece com foco de teclado.

## Components

### Moldura e folha
A folha ABNT em volta de tudo.
- **Moldura:** linha de 1,5px em tinta, fixa, sem receber clique, com inset de 6px no celular e de 12px (28px à esquerda) no desktop. Um contorno de 28px na cor do papel apaga o que rola pela margem; com cores forçadas, esse contorno vira Canvas.
- **Troca de folha:** régua de 1px em grafite no topo de cada folha a partir da segunda, recuada 1,5px de cada linha da moldura.
- **Número da folha:** o carimbo mostra a folha atual ("1/4"). A faixa central da tela decide a folha; topo à vista força 1 e rodapé à vista força 4.

### Carimbo
O carimbo da prancha, fixo e preenchido ao vivo; guarda a marca, os campos da folha e a ação.
- **Campos:** marca R, nome "RF Tecnologia 3D", Peça, Cliente, Desenho (Rafael Favero), Escala (Sem escala), Unidade (mm), Folha e a ação. Peça e Cliente mudam enquanto a pessoa digita no formulário, cortados em 28 e 20 caracteres com reticências, e voltam a "Trava do conector" e "Você" quando os campos ficam vazios.
- **Célula:** fundo de papel, rótulo em cima em grafite, valor embaixo em tinta, uma linha só, reticências no excesso.
- **Em bloco (1024px ou mais, altura acima de 760px):** 30rem de largura no canto inferior direito, com as bordas direita e de baixo coincidindo com a moldura. Grade de quatro colunas (4.5rem e três frações iguais) em quatro linhas: marca, nome e folha; marca, peça e cliente; desenho, escala e unidade; ação na largura toda, com seta à direita. O fundo de tinta aparece no vão de 1px e faz os filetes; borda de 1,5px em tinta em cima e à esquerda; faixa de papel de 1.5rem à esquerda. A marca R preenche a célula dela com .75rem de folga.
- **Em barra (abaixo de 1024px):** faixa de 64px apoiada na base da moldura, de uma linha lateral à outra, com filete de 1,5px em tinta no topo e vão de .25rem entre as partes. Mostra só a marca R (1.75rem), a célula Folha e a ação, que ocupa o resto da largura, sem a seta.
- **Em linha (1024px ou mais, altura até 760px):** todas as células numa linha de 3.5rem e 59rem de largura, com colunas de 2.75rem, 9rem, 8.75rem, 5.5rem, 6.75rem, 5.5rem, 3.75rem e 3rem e o resto para a ação, sem a seta. Entre 1024px e 1199px caem Desenho e Escala e a linha fica com 46.75rem. O rodapé sobe para cima dela.
- **Com cores forçadas (1024px ou mais):** os filetes do vão somem, porque o tema repinta o fundo; cada célula ganha um contorno de 1px em CanvasText, e a célula com foco fica só com o anel.
- **Ação no carimbo:** vermelha quando nenhuma outra ação está à vista. Recuada (papel, texto e borda em tinta, hover com 8% de tinta misturada ao papel) quando o hero ou o formulário mostram a deles. Na barra do celular, a área coberta pela própria barra não conta como visível.

### Buttons
A ação é um carimbo de revisão: plana, reta, vermelha e rara.
- **Shape:** reto (raio 0), altura mínima de 48px, padding 0 1.25rem, vão de .6rem entre ícone e texto.
- **Primary:** fundo Vermelho de Revisão, texto e ícone em branco, borda de 1,5px no mesmo vermelho; osifont itálica 1rem em caixa alta; ícone do WhatsApp de 20px. O rótulo é sempre "Mandar foto da peça", e no desktop não quebra linha.
- **Hover / Focus:** o hover (só com mouse) passa para o Vermelho Pressionado em 150ms ease; pressionar reduz a escala para .98 em 120ms com a curva de saída; o foco de teclado é o anel de 2px em tinta a 3px do botão. No escuro a borda vira tinta.
- **Recuada:** a ação do carimbo enquanto outra ação vermelha está à vista (ver Carimbo).
- **Link de texto:** a ação secundária ("Ver como eu faço", "Ver no Instagram"), em Overpass sem caixa alta, sublinhado de 1px afastado .2em que engrossa para 2px no hover, com alvo de 44px.

### Inputs / Fields
Linhas de preenchimento de formulário técnico, sem caixa.
- **Style:** só uma linha de 1,5px em tinta embaixo, fundo transparente, raio 0, altura mínima de 48px, padding .5rem 0, texto em Overpass. O textarea cresce com o conteúdo e não tem alça de redimensionar.
- **Rótulo:** acima do campo, em Overpass .9375rem peso 600, com 1.5rem acima de cada rótulo.
- **Placeholder e dica:** em grafite, com opacidade cheia; a dica "Tudo aqui é opcional." fica em .9375rem abaixo dos campos.
- **Focus:** anel de 2px em tinta a 4px do campo.
- **Error / Disabled:** não existem. Todos os campos são opcionais e o envio sempre abre o WhatsApp; depois do envio aparece um aviso de status, em .9375rem, com o link para abrir a conversa à mão.

### Navigation
- **Topo:** marca à esquerda em osifont itálica 1rem em caixa alta; links em Overpass .9375rem sem sublinhado, que ganham sublinhado de 2px no hover; ícone do Instagram de 22px. Abaixo de 768px ficam só "Pedido" e o ícone do Instagram, com alvo de 44px.
- **Rodapé:** WhatsApp, Instagram e e-mail em Overpass .9375rem, sublinhados, com ícones de 18px; a linha de direitos fica em grafite.
- **Pular para o conteúdo:** escondido acima da tela, desce com o foco; papel, borda de 1,5px em tinta, .9375rem, alvo de 44px.

### Desenho da peça
A assinatura do sistema: a peça real, desenhada em canvas em primeiro diedro (ABNT NBR 10067). O traço vem pronto de `assets/desenhos.json`, que `tools/desenhos.js` calcula do STL na máquina do autor. A malha nunca chega ao navegador, e por isso o desenho não gira.
- **Composição:** frontal no alto à esquerda, superior abaixo dela, lateral esquerda à direita da frontal e perspectiva isométrica no quadrante de baixo à direita, com uma escala só para as três vistas e margem de 6%.
- **Pesos de linha (px):** visível 1,6 em tinta, com pontas redondas; na perspectiva, a visível afina com a escala abaixo de 4px por mm, até 0,8, para as nervuras não se fundirem; oculta 0,8 em grafite, traço 4 e vão 3; cota e linha de chamada 0,8 em grafite; eixo 0,8 em grafite, traço-ponto 10-3-2-3, centrado para que dois eixos se cruzem num traço; corte 0,8 em tinta, traço-ponto, com pontas de 8px em 1,6; construção 1 no azul de construção; hachura 1,1 em tinta; camada de impressão 0,5 em grafite, nunca a menos de 1,5px uma da outra.
- **Cotas:** linha de cota a 22px do contorno; linhas de chamada com 2px de folga do contorno e 3px além da cota; setas cheias de 9px por 6px; cifra 4px acima da linha, girada na cota vertical, com vírgula decimal e uma casa (26,4 e 32,8) e sem unidade, que fica na legenda e no carimbo.
- **Eixos e corte:** linhas de centro passam 3mm além do contorno; a linha de corte A-A passa 4mm, com setas no sentido de quem olha e a letra A em tinta junto de cada seta.
- **Rótulos:** FRONTAL, SUPERIOR, LATERAL ESQUERDA e PERSPECTIVA em grafite, centrados sob cada vista.
- **Linhas ocultas e cor:** as arestas chegam separadas em visíveis e ocultas, já fundidas onde são colineares; o canvas pinta o papel antes de traçar, então o desenho segue legível com cores forçadas. As cores são lidas das variáveis a cada desenho, e trocar o esquema redesenha tudo. Densidade de pixel até 2.
- **Movimento:** o único momento autoral da página. Quando 40% do canvas entra na tela, as arestas visíveis das três vistas se traçam em 460ms cada, começando em 0, 120 e 240ms, na curva cubic-bezier(0.23, 1, 0.32, 1); ocultas, cotas, eixos, corte e rótulos aparecem de 600 a 1100ms na mesma curva; o esboço da perspectiva aparece em azul de construção de 900 a 1100ms, as linhas de camada sobem por cima dele em ritmo linear de 900 a 2600ms e as arestas ganham a tinta de 2600 a 2850ms, na mesma curva. Com movimento reduzido o desenho já aparece pronto.

**The Pesos ISO Rule.** A peça tem duas espessuras de traço, 1,6px e 0,8px, na razão 2:1 da ISO 128. Hachura (1,1px), construção (1px) e camada (0,5px) são as únicas outras, cada uma com um uso só. Na perspectiva pequena, a visível afina até 0,8px, a mesma regra que já espaça as linhas de camada.

### Vistas de detalhe
Quatro quadros quadrados da mesma peça, um por etapa do serviço.
- **Os quadros:** esboço isométrico em linha de construção azul, sem faces (a foto); vista frontal com ocultas, eixo e duas cotas (o desenho em milímetros); vista superior com a área que apoia na mesa hachurada e o rótulo BASE NA MESA (a conferência); perspectiva com as linhas de camada e o rótulo "132 CAMADAS DE 0,2 mm" (a impressão).
- **Desenho:** margem de 10% (8% no quadro das cotas), traçados sem animação quando chegam a 200px da tela.
- **Rótulo:** abaixo de cada quadro, o rótulo de vista com régua de 1px em grafite e um parágrafo curto.

### Corte e hachura
- **Corte A-A:** o plano pelo eixo do furo, visto de frente. O que fica além do plano sai em linha contínua de 0,8px em grafite; a seção é preenchida de papel, hachurada e contornada com 1,6px em tinta, com duas cotas. Canvas 4:3 com a legenda "Corte A-A", ao lado das notas.
- **Hachura:** linhas a 45°, subindo para a direita, de 1,1px em tinta com passo de 3px, recortadas pela área cortada. É o campo mais denso da página, e o mesmo padrão marca a base na mesa.

### Legendas, rótulos e notas
- **Legenda de figura:** régua de 1px em grafite em cima, .5rem abaixo do desenho e .375rem de folga até a letra; letra técnica pequena, vertical, em grafite. No hero do desktop são duas partes lado a lado (1.65fr e 2.55fr), empilhadas quando a figura tem menos de 41.5rem.
- **Rótulo de vista:** o h3 de cada quadro, osifont itálica .9375rem em tinta, com a mesma régua de 1px.
- **Notas:** título NOTAS na letra pequena inclinada; lista numerada com o número em osifont .8125rem em grafite numa coluna de 1.5rem e o texto em Overpass .9375rem, com .75rem entre as notas.
- **Lista "O que mandar":** marcador quadrado em grafite, .5rem entre os itens.

### Retrato
- Quadrado, em escala de cinza com contraste de 1.05, sem borda nem raio; 40% da largura no celular e três colunas a partir de 768px.

## Do's and Don'ts

### Do:
- **Do** declarar toda cor como variável no :root e no bloco de esquema escuro, e ler essas variáveis no canvas; nenhum hex fora desses dois lugares, com a cor do papel repetida só nas duas meta theme-color.
- **Do** manter o vermelho #d93430 só na ação "Mandar foto da peça", uma por tela, com a ação do carimbo recuando enquanto outra estiver à vista.
- **Do** desenhar peça a partir de medida real, em primeiro diedro, com cotas em milímetros, vírgula decimal e uma casa.
- **Do** usar os pesos do desenho: 1,6px na visível; 0,8px na oculta (4-3), na cota, no eixo (10-3-2-3) e no corte; 1,1px na hachura a 45° com passo de 3px; 0,5px na camada.
- **Do** separar folhas com a régua de 1px em grafite de moldura a moldura e contornar peças de interface com 1,5px em tinta.
- **Do** deixar o canto inferior direito para o carimbo, com conteúdo e foco fora dele.
- **Do** pôr todo movimento dentro de prefers-reduced-motion: no-preference, mostrar o desenho pronto com movimento reduzido e usar IntersectionObserver no lugar do evento de rolagem.
- **Do** usar ícones Phosphor de peso regular em SVG embutido, com fill currentColor e aria-hidden, em 18px, 20px ou 22px.
- **Do** manter alvos de 44px, ação e campos com 48px, foco em anel de 2px em tinta e seleção, cursor de texto e barra de rolagem nas cores da folha.

### Don't:
- **Don't** usar cartão, faixa de fundo, sombra, brilho, vidro ou degradê; a página é uma folha contínua.
- **Don't** quadricular o papel nem pôr grade decorativa de fundo.
- **Don't** pintar de vermelho o desenho, títulos, links ou ícones soltos; a marca R, no carimbo, é a única outra presença vermelha.
- **Don't** copiar o degradê da marca R para elementos do site; ele pertence à marca.
- **Don't** usar o azul de construção em texto ou em informação necessária; ele fica em 2,02:1 sobre o papel.
- **Don't** compor texto corrido em osifont, nem títulos, cotas, legendas ou carimbo em Overpass, nem acrescentar uma terceira família.
- **Don't** arredondar cantos.
- **Don't** pôr rótulo pequeno acima de título; rótulo pequeno só existe dentro da célula do carimbo, sobre o valor.
- **Don't** escrever "mm" em caixa alta.
- **Don't** voltar ao padrão de site de impressão 3D: hero escuro com impressora brilhando, grade de cartões de serviço, passos numerados, FAQ em sanfona e bolha verde de chat flutuante.
