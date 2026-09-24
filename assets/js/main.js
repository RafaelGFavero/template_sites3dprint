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
  const curto = (t, n) => (t.length > n ? `${t.slice(0, n - 3).trimEnd()}...` : t);
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
  // The mobile bar covers the bottom of the screen: a button behind it does not count as visible.
  const barra = getComputedStyle(document.documentElement).getPropertyValue('--carimbo-h').trim() || '0px';
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target);
    carimbo.toggleAttribute('data-acao-visivel', visiveis.size > 0);
  }, { rootMargin: `0px 0px -${barra} 0px` });
  acoes.forEach((a) => io.observe(a));
}

if (typeof document !== 'undefined') {
  const $ = (s) => document.querySelector(s);
  acompanharFolha([...document.querySelectorAll('[data-folha]')], $('[data-carimbo="folha"]'));
  carimboAoVivo($('#pedido-form'), $('[data-carimbo="peca"]'), $('[data-carimbo="cliente"]'));
  enviarPedido($('#pedido-form'), $('#pedido-aviso'), $('#pedido-link'));
  vermelhoUnico([...document.querySelectorAll('main .acao')], $('.carimbo'));
}
