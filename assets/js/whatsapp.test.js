import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsappMessage, buildWhatsappUrl } from './whatsapp.js';

const LINK_PADRAO = 'https://wa.me/5517997912726?text=Ol%C3%A1%2C%20Rafael!%20Vim%20pelo%20site%20da%20RF%20Tecnologia%203D.%0ATenho%20uma%20pe%C3%A7a%20para%20fazer.%0AVou%20mandar%20as%20fotos%20aqui.';

test('mensagem completa, na ordem', () => {
  assert.equal(
    buildWhatsappMessage({ nome: 'Ana', peca: 'trava do tanque do Compass', medida: '32 mm de largura' }),
    'Olá, Rafael! Vim pelo site da RF Tecnologia 3D.\nMeu nome é Ana.\nA peça: trava do tanque do Compass\nMedida: 32 mm de largura\nVou mandar as fotos aqui.',
  );
});

test('sem nada preenchido sai a mensagem curta', () => {
  assert.equal(
    buildWhatsappMessage(),
    'Olá, Rafael! Vim pelo site da RF Tecnologia 3D.\nTenho uma peça para fazer.\nVou mandar as fotos aqui.',
  );
});

test('campo só com espaços conta como vazio', () => {
  assert.equal(buildWhatsappMessage({ nome: '  ', peca: ' ', medida: '' }), buildWhatsappMessage());
});

test('o link padrão é o mesmo gravado no HTML', () => {
  assert.equal(buildWhatsappUrl(buildWhatsappMessage()), LINK_PADRAO);
});

test('url codifica acento e &', () => {
  assert.equal(buildWhatsappUrl('Olá & tchau'), 'https://wa.me/5517997912726?text=Ol%C3%A1%20%26%20tchau');
});
