import { buildWhatsappMessage, buildWhatsappUrl } from './whatsapp.js';

export function setupMobileMenu(toggle, nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  }));
}

export function setupHeaderScroll(header) {
  const update = () => header.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

export function setupReveal(elements) {
  if (!('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  elements.forEach((el) => io.observe(el));
}

export function setupQuoteForm(form, fallback, fallbackLink) {
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const url = buildWhatsappUrl(buildWhatsappMessage(data));
    fallbackLink.href = url;
    fallback.hidden = false;
    window.open(url, '_blank', 'noopener');
  });
}

if (typeof document !== 'undefined') {
  setupMobileMenu(document.getElementById('mobileToggle'), document.getElementById('navMenu'));
  setupHeaderScroll(document.querySelector('.header'));
  setupReveal(document.querySelectorAll('.reveal'));
  setupQuoteForm(
    document.getElementById('quoteForm'),
    document.getElementById('quoteFallback'),
    document.getElementById('quoteFallbackLink'),
  );
}
