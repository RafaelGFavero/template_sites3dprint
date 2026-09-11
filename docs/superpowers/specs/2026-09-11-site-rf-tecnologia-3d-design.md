# Site RF Tecnologia 3D — design

Data: 2026-09-11. Base: fork do template `template_sites3dprint` (MR 3D PRINT, HTML/CSS/JS estático, GitHub Pages).

## Objetivo

Transformar o protótipo em um site de vendas para a **RF Tecnologia 3D**: gerar contato qualificado via WhatsApp (orçamento) e Instagram (@rf_tec3d). Uma página, sem backend.

## Fatos da empresa (fonte: media kits em Downloads)

- Nome: RF Tecnologia 3D. Instagram: `@rf_tec3d`. WhatsApp: `+55 17 99791-2726`. E-mail: `rftec3d@gmail.com`.
- O que faz: peças 3D sob demanda (FDM), luminárias autorais, decoração, miniaturas e colecionáveis, toys articulados, brindes personalizados, modelagem 3D (Blender/CAD).
- Diferencial: acabamento artesanal, personalização, atendimento direto.
- Não prometer o que não existe: nada de SLA/SLS, "parque fabril", "+5.000 projetos" ou depoimentos inventados. Números só onde houver fato.

## Decisões

| Item | Decisão | Motivo |
|---|---|---|
| Stack | HTML + CSS + JS vanilla, sem build | Workflow do GitHub Pages já publica a raiz; YAGNI |
| Paleta | Doom 64 remix sem verde: fundo `#1a1a1a`, fundo profundo `#141414`, card `#2a2a2a`, muted `#252525`, borda `#4a4a4a`, primário `#e53935`, âmbar `#ffa000`, azul `#64b5f6` (só detalhe), terra `#a1887f`, texto `#f5f5f5` / muted `#b3b3b3` | Pedido do usuário; vermelho e âmbar casam com o logo (gradiente vermelho + friso dourado) |
| Raio | 2px (cantos quase retos) | Tema Doom 64 usa 0; 2px evita serrilhado |
| Fontes | Display `Oxanium` (títulos, uppercase), texto `Inter`, rótulos técnicos `Source Code Pro` | Tema Doom 64 + legibilidade |
| Ícones | SVG inline (Lucide), sem emoji | Regra ui-ux-pro-max |
| Animação | `IntersectionObserver` + CSS (fade 12px, 300ms), `prefers-reduced-motion` respeitado | Sem GSAP: dependência não pedida |
| Logo | `assets/img/logo-rf3d.png` (arte completa, fundo transparente) e `assets/img/logo-icone.jpg` (só o R) no header e favicon. Fundo branco do JPG: usar só onde o fundo for claro, ou converter para PNG transparente na implementação | Artes do usuário |
| Idioma | pt-BR | Mercado local |

## Estrutura da página (ordem)

1. **Header** fixo: ícone R + "RF Tecnologia 3D", links (Soluções, Como funciona, Materiais, Portfólio, FAQ), CTA "Pedir orçamento" (WhatsApp). Mobile: menu hambúrguer.
2. **Hero**: eyebrow em mono (`// impressão 3D sob demanda`), título "Da ideia à peça impressa", subtítulo com o que fazemos, CTA primário WhatsApp + secundário "Ver soluções". Direita: logo grande com glow vermelho e grade técnica de fundo (inspiração Cube). Faixa de confiança embaixo: "FDM de alta resolução", "Modelagem 3D inclusa", "Atendimento direto com quem produz".
3. **Faixa marquee** com materiais e serviços (PLA · PETG · ABS · TPU · Modelagem · Pintura…).
4. **Soluções** em bento grid (inspiração Cube/Deepflow), 7 cards com ícone e uma frase de benefício: Peças sob demanda; Protótipos; Peças de reposição; Modelagem 3D; Luminárias autorais; Miniaturas e colecionáveis; Brindes personalizados. Card grande = Peças sob demanda.
5. **Como funciona** (padrão funil, 4 passos numerados em mono `01`–`04`): Envie a ideia ou arquivo → Modelamos e orçamos → Imprimimos e acabamos → Entregamos. Cada passo com mini-CTA no último.
6. **Materiais**: 4 cards (PLA, PETG, ABS/ASA, TPU) com tabela de specs (resistência, temperatura, uso típico) em estilo "spec sheet" (inspiração Syntax).
7. **Portfólio**: grid 6 itens. Imagens: placeholders com gradiente e legenda; pasta `assets/img/portfolio/` para o usuário trocar. Link "Mais no Instagram".
8. **Orçamento**: formulário (nome, tipo de peça, material, quantidade, tem arquivo?, descrição) que monta a mensagem e abre o WhatsApp. Labels visíveis, `inputmode`, estado de feedback ao enviar.
9. **FAQ**: 6 perguntas em `<details>` nativo (sem JS).
10. **CTA final** + **Footer**: contatos, Instagram, horário, CNPJ opcional (placeholder claro).
11. **Botão flutuante** WhatsApp (44×44 mín.).

## Componentes de código

- `index.html` — conteúdo e estrutura semântica (`header/main/section/footer`, h1 único).
- `assets/css/style.css` — tokens em `:root`, layout mobile-first (375, 768, 1024, 1440), sem scroll horizontal.
- `assets/js/main.js` — menu mobile, header ao rolar, reveal, formulário → WhatsApp. Função pura `buildWhatsappMessage(dados)` exportada para teste.
- `assets/js/main.test.js` — teste com `node --test` da função pura.
- SEO: `title`, `description`, Open Graph, JSON-LD `LocalBusiness`, `favicon`.
- `README.md` atualizado: como trocar fotos, número e textos.

## Tratamento de erro

- Formulário: campos obrigatórios com validação nativa; se `window.open` for bloqueado, mostrar link direto para clicar.
- Imagens de portfólio ausentes: `onerror` não é usado; placeholders são CSS puro até o usuário substituir.

## Testes e verificação

- `node --test assets/js` verde (mensagem do WhatsApp com todos os campos, e com campos vazios).
- Navegador: console sem erro; largura 375 e 1440 sem `scrollWidth > clientWidth`; contraste texto/fundo ≥ 4,5:1 medido nos tokens; menu mobile abre e fecha; formulário abre URL `wa.me/5517997912726?text=…`.
- Screenshots das duas larguras anexados ao PR.

## Fora de escopo

Loja/carrinho, backend, blog, multi-idioma, integração com feed do Instagram.
