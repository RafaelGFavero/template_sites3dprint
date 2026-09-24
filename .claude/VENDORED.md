# Skills e agentes de terceiros deste projeto

Copiados em 24/09/2026. Valem só para sessões do Claude Code abertas nesta pasta.
Cada pasta mantém o LICENSE original. Para atualizar, clonar o repositório de origem e copiar de novo as mesmas pastas.

| Origem | Commit | Licença | Pastas |
|---|---|---|---|
| github.com/pbakaus/impeccable (`plugin/`) | edb9c7f | Apache-2.0 | `skills/impeccable`, `agents/impeccable-*.md` |
| github.com/Leonxlnx/taste-skill (`skills/`) | c184364 | MIT | `skills/taste-skill`, `redesign-skill`, `soft-skill`, `minimalist-skill`, `brutalist-skill`, `output-skill` |
| github.com/emilkowalski/skill (`skills/`) | d16ebe6 | MIT | `skills/emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `prototype`, `animation-vocabulary`, `apple-design`, `pick-ui-library` |

Ficaram de fora por não servirem a um site estático: as skills de geração de imagem, a v1 e a variante GPT do taste-skill, e as skills de Expo, Swift e Sonner do Emil.

O impeccable baixa o próprio motor (binário do GitHub Releases, conferido por SHA-256) para `~/.impeccable/bin` no primeiro uso. O sorteio de direção (`concept-seed`) consulta o catálogo na API do impeccable.style, e o fluxo pede um aviso anônimo de telemetria depois de cada escolha. Neste projeto o aviso não é enviado; para desligar de vez, defina `IMPECCABLE_NO_TELEMETRY=1` ou `DO_NOT_TRACK=1`.

O Playwright MCP está em `../.mcp.json` e usa o Chrome instalado na máquina.
