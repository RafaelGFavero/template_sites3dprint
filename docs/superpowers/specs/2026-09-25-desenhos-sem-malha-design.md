# Desenhos sem malha no site

Data: 25/09/2026. Pedido do dono: "O STL não deve ir no site!"

## Problema

O site buscava `assets/models/trava-conector.stl` e desenhava tudo no navegador a partir da malha. Qualquer visitante baixava o modelo que se vende. O PR #3 tirou o arquivo do repositório e do deploy, e os desenhos ficaram em branco.

## Objetivo

Os mesmos desenhos na página, sem nenhuma geometria 3D publicada. O site recebe só traço 2D: os segmentos que já aparecem na tela, em milímetros no plano de cada vista.

## Decisão de arquitetura

O cálculo que dependia da malha sai do navegador e vai para uma ferramenta de Node em `tools/`, rodada na máquina do dono. Ela lê o STL de fora do repositório (`../impressao-3d/saida/trava_conector_azul.stl` por padrão, ou o caminho passado na linha de comando) e grava `assets/desenhos.json`. O `desenho.js` continua desenhando em canvas, com as mesmas cores, pesos, cotas e escalas, mas a partir desse JSON.

Alternativas descartadas:

- **SVG pronto.** Exigiria reescrever toda a camada de desenho, que hoje fala a API do canvas, e o tema escuro precisaria de SVG inline.
- **Quadros de imagem da impressão e do giro.** Pesariam centenas de KB por tema, e o giro por quadros ainda seria uma coleção de vistas da peça.
- **Malha reduzida ou embaralhada.** Continua sendo o modelo e continua baixável.

Medido no protótipo: o JSON com duas casas decimais tem 65 KB, 16 KB com gzip, e a ferramenta roda em 0,1 s.

## Conteúdo do `desenhos.json`

Tudo em mm, no plano de cada vista (u para a direita, v para baixo), arredondado a 0,01 mm. Nenhum ponto com três coordenadas.

- `medidas`: largura, profundidade e altura da caixa da peça. São as cotas que o desenho já mostra.
- `camada` (0,2) e `camadas` (132).
- `frontal`, `superior` e `lateral`: `ext` (os pontos extremos esq, dir, cima e baixo), `visiveis` e `ocultos` (segmentos `[u0, v0, u1, v1]` já sem linha oculta e fundidos onde são colineares). A superior leva também `base`, os laços da base em z = 0,1 para a hachura do quadro "Confiro se imprime".
- `iso`: `ext`, `centro` (o centro da caixa projetado), `visiveis`, `arame` (todas as arestas desenháveis, para o esboço do quadro "Você manda a foto") e `camadas`, uma lista por camada com os trechos visíveis da linha de camada naquela altura.
- `corte`: `plano` (12,8), `ext` e `visiveis` do que fica atrás do plano, e `lacos`, os laços do corte A-A.

## O que muda na página

- **O giro sai.** Girar exige a peça em 3D no navegador, que é exatamente o que não pode ir. O canvas do hero deixa de receber foco, perde o `aria-roledescription` e a legenda perde "Arraste para girar". A legenda fica com dois itens.
- **A impressão do hero muda de forma.** Antes a peça crescia recortada na altura atual, o que precisaria de uma geometria por altura. Agora o esboço da perspectiva aparece no azul de construção, as linhas de camada sobem de baixo para cima, em ritmo linear, de 900 a 2600 ms, e as arestas ganham a tinta em 250 ms no fim. Conta a mesma história da página: o desenho, a impressão em camadas e a peça pronta. Com movimento reduzido tudo aparece pronto, como antes.
- **"Confiro se imprime" e "Imprimo em camadas"** deixam o algoritmo do pintor e usam os trechos visíveis calculados na ferramenta. O resultado na tela é o mesmo conjunto de arestas visíveis.

## Testes

- A ferramenta num cubo sintético: 5 camadas de 0,2 mm, cada uma com os 2 trechos das faces que a isométrica mostra.
- Com o STL presente na máquina, o JSON do repositório é idêntico ao que a ferramenta gera agora. O teste é pulado onde o STL não existe.
- O teste que recusa malha em `assets/`, o `.gitignore` e o passo do deploy, todos do PR #3, continuam valendo.
- No navegador, cada canvas da versão nova é comparado com a versão anterior ao PR #3, com movimento reduzido, em 1440×900 e 390×844, no claro e no escuro. Também se confere que a página não pede nenhum `.stl`.

## Fora do escopo

- Limpar o STL do histórico do git e do PR #2. Isso reescreve a `main` publicada e depende de decisão do dono.
- Trocar a peça de exemplo.
