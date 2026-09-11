# RF Tecnologia 3D — design system (fonte de verdade)

Paleta Doom 64 remix (21st.dev) sem o verde. Ver spec em docs/superpowers/specs/2026-09-11-site-rf-tecnologia-3d-design.md.

## Tokens
- --bg: #1a1a1a  --bg-deep: #141414  --card: #2a2a2a  --muted: #252525  --border: #4a4a4a
- --primary: #d93430 (era #e53935 no tema Doom 64; escurecido para branco sobre o botão atingir 4,5:1)  --amber: #ffa000  --blue: #64b5f6 (detalhe raro)  --earth: #a1887f
- --text: #f5f5f5  --text-muted: #b3b3b3  --on-primary: #ffffff
- --radius: 2px
- Fontes: display Oxanium (uppercase, 700/800), corpo Inter, mono Source Code Pro (eyebrows, numeração, specs)
- Espaçamento: 4/8/16/24/32/48/64/96px

## Regras
- Ícones SVG (Lucide) inline. Sem emoji.
- Alvo de toque ≥ 44px. Foco visível (outline âmbar 2px).
- Motion 300ms, ease (0.16,1,0.3,1), reveal por IntersectionObserver, respeitar prefers-reduced-motion.
- Mobile-first: 375 / 768 / 1024 / 1440. Sem scroll horizontal.
- Contraste ≥ 4,5:1 em texto. Vermelho #d93430 (era #e53935 no tema Doom 64; escurecido para branco sobre o botão atingir 4,5:1) sobre #1a1a1a só em texto ≥ 18px/bold.
