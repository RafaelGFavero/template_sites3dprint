export const WHATSAPP_NUMBER = '5517997912726';

const ouNaoInformado = (v) => (v && v.trim()) || 'não informado';

export function buildWhatsappMessage({ nome, tipo, material, quantidade, temArquivo, descricao }) {
  return [
    'Olá, RF Tecnologia 3D! Quero um orçamento.',
    `Nome: ${ouNaoInformado(nome)}`,
    `Tipo de peça: ${ouNaoInformado(tipo)}`,
    `Material: ${ouNaoInformado(material)}`,
    `Quantidade: ${ouNaoInformado(quantidade)}`,
    `Tenho arquivo 3D: ${ouNaoInformado(temArquivo)}`,
    `Descrição: ${ouNaoInformado(descricao)}`,
  ].join('\n');
}

export function buildWhatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
