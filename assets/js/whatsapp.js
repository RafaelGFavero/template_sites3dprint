export const WHATSAPP_NUMBER = '5517997912726';

const limpo = (v) => String(v ?? '').trim();

export function buildWhatsappMessage({ nome, peca, medida } = {}) {
  const linhas = ['Olá, Rafael! Vim pelo site da RF Tecnologia 3D.'];
  if (limpo(nome)) linhas.push(`Meu nome é ${limpo(nome)}.`);
  linhas.push(limpo(peca) ? `A peça: ${limpo(peca)}` : 'Tenho uma peça para fazer.');
  if (limpo(medida)) linhas.push(`Medida: ${limpo(medida)}`);
  linhas.push('Vou mandar as fotos aqui.');
  return linhas.join('\n');
}

export function buildWhatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
