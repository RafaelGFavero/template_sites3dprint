import { buildWhatsappMessage, buildWhatsappUrl } from './whatsapp.js';

const PECA_PADRAO = 'Trava do conector';
const CLIENTE_PADRAO = 'Você';

export function acompanharFolha(secoes, alvo, rodape) {
  const marcar = (n) => { alvo.textContent = `${n}/${secoes.length}`; };
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) marcar(e.target.dataset.folha);
  }, { rootMargin: '-45% 0px -45% 0px' });
  secoes.forEach((s) => io.observe(s));
  // Em tela baixa, no fim da página a faixa do meio cai entre a última folha e o rodapé: rodapé à vista é a última folha.
  new IntersectionObserver(([e]) => { if (e.isIntersecting) marcar(secoes.length); }).observe(rodape);
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
  const largo = matchMedia('(min-width: 1024px)');
  let io;
  const observar = () => {
    io?.disconnect();
    visiveis.clear();
    // Below 1024px the carimbo is a bottom bar: whatever sits behind it (bar plus frame inset) does not count as visible.
    const barra = largo.matches ? 0 : Math.ceil(innerHeight - carimbo.getBoundingClientRect().top);
    io = new IntersectionObserver((entradas) => {
      for (const e of entradas) e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target);
      carimbo.toggleAttribute('data-acao-visivel', visiveis.size > 0);
    }, { rootMargin: `0px 0px -${barra}px 0px` });
    acoes.forEach((a) => io.observe(a));
  };
  observar();
  largo.addEventListener('change', observar);
}

if (typeof document !== 'undefined') {
  const $ = (s) => document.querySelector(s);
  acompanharFolha([...document.querySelectorAll('[data-folha]')], $('[data-carimbo="folha"]'), $('.rodape'));
  carimboAoVivo($('#pedido-form'), $('[data-carimbo="peca"]'), $('[data-carimbo="cliente"]'));
  enviarPedido($('#pedido-form'), $('#pedido-aviso'), $('#pedido-link'));
  vermelhoUnico([...document.querySelectorAll('main .acao')], $('.carimbo'));
  import('./desenho.js').then((m) => m.iniciar()).catch(() => {});
}
