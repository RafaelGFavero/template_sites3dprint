# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Principal (confirmado em 24/09/2026): gente com um problema físico concreto. Uma peça plástica quebrou e não se vende mais avulsa (um clipe, uma trava, um suporte, uma engrenagem, uma tampa), um protótipo precisa sair do papel, ou algo precisa ser feito sob medida. A pessoa chega com a foto da peça quebrada no celular e muitas vezes sem medida nenhuma. O trabalho dela é descobrir se dá para fazer, como, e o que acontece depois, sem precisar aprender impressão 3D.

Secundário: quem procura peças autorais (luminárias, miniaturas, toys articulados) e empresas que querem brindes. Aparecem no site sem disputar a primeira tela.

Inferido, não confirmado: a maior parte das visitas vem do Instagram, pelo celular.

## Product Purpose

A RF Tecnologia 3D modela e imprime em 3D (FDM) a peça de que a pessoa precisa, a partir da peça quebrada, de fotos ou de uma ideia. O site transforma "será que alguém faz isso?" em uma conversa no WhatsApp que já chega com foto e, quando houver, medida. Sucesso é um pedido de orçamento com a informação certa dentro.

## Positioning

Uma pessoa desenha e imprime: engenharia reversa a partir de foto e medida, modelagem própria no Blender, impressão e acabamento na mesma bancada. Quem pede fala com quem desenha a peça.

## Operating Context

- O cliente manda foto, medida ou a própria peça pelo WhatsApp ou pelo direct do Instagram.
- Modelagem no Blender em milímetros, exportação em STL, impressão FDM (bico 0,4 mm e camada 0,2 mm por padrão), regras de imprimibilidade (parede ≥ 1,2 mm, balanço ≤ 45°, chanfro em vez de filete na base).
- A venda fecha no WhatsApp e no Instagram (confirmado). Nenhuma loja de marketplace entra neste site.

## Capabilities and Constraints

- Site estático no GitHub Pages, sem backend. O pedido de orçamento sai como mensagem pronta no WhatsApp.
- O modelo 3D das peças (STL ou qualquer outra malha) nunca vai para o site nem para o repositório, que é público. O site mostra só desenho.
- Não confirmado, nunca afirmar no site: cidade, cobertura de envio, prazos, preços, formas de pagamento, horário de atendimento, lista de materiais em estoque, tamanho máximo de impressão.

## Brand Commitments

- Nome: RF Tecnologia 3D. Instagram @rf_tec3d. WhatsApp +55 17 99791-2726 (wa.me/5517997912726). E-mail rftec3d@gmail.com.
- Marca: o "R" em fita vermelha com friso dourado e prateado, registrado como ícone no INPI. A arte completa escreve "RAFAEL FAVERO / TECNOLOGIA 3D". O R fica; o degradê dele é da marca, não um modelo para o site.
- Voz: "artesão que resolve". Direta e técnica quando o assunto é peça; calorosa quando é peça autoral. Português do Brasil.
- Quem faz, Rafael Favero, aparece com nome e foto (aprovado em 24/09/2026).

## Evidence on Hand

- Caso real: trava do conector rápido da linha de combustível no tanque (Jeep Compass e Renegade, Fiat Toro e Mobi). Redesenhada a partir de cinco fotos da original, sem cota de fábrica, com medidas estimadas por proporção. Modelada no Blender, imprime sem suporte. Duas versões, azul e amarela (a amarela é 8 % menor). O STL da versão azul fica fora do repositório, em `impressao-3d/saida/trava_conector_azul.stl`, e os desenhos da página saem dele.
- Retrato de Rafael Favero (uso aprovado).
- Arquivos da marca: arte completa em PNG transparente; ícone R em JPG com fundo branco.
- Ausente, nunca inventar: fotos de peças prontas, depoimentos, nomes de clientes, preços, contagem de peças feitas, anos de mercado, certificações.

## Product Principles

1. A peça do cliente vem primeiro. O site responde "vocês fazem isso?" antes de falar de si.
2. Mostrar trabalho real em vez de adjetivo.
3. Pedir o mínimo para orçar: uma foto e, se houver, uma medida.
4. Nunca prometer o que não foi confirmado: prazo, preço, cidade, frete.

## Accessibility & Inclusion

WCAG 2.2 AA. Leitura pensada primeiro para o celular, já que o público provavelmente chega pelo Instagram.
