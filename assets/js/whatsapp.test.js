import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsappMessage, buildWhatsappUrl } from './whatsapp.js';

test('mensagem completa lista todos os campos em ordem', () => {
  const msg = buildWhatsappMessage({
    nome: 'Ana', tipo: 'Peça de reposição', material: 'PETG',
    quantidade: '2', temArquivo: 'Sim', descricao: 'Engrenagem 40 mm',
  });
  assert.equal(msg,
    'Olá, RF Tecnologia 3D! Quero um orçamento.\n' +
    'Nome: Ana\n' +
    'Tipo de peça: Peça de reposição\n' +
    'Material: PETG\n' +
    'Quantidade: 2\n' +
    'Tenho arquivo 3D: Sim\n' +
    'Descrição: Engrenagem 40 mm');
});

test('campos vazios recebem "não informado"', () => {
  const msg = buildWhatsappMessage({ nome: 'Ana', tipo: '', material: '', quantidade: '', temArquivo: '', descricao: '   ' });
  assert.match(msg, /Material: não informado/);
  assert.match(msg, /Descrição: não informado/);
});

test('url aponta para o número da RF com texto codificado', () => {
  const url = buildWhatsappUrl('Olá & tchau');
  assert.equal(url, 'https://wa.me/5517997912726?text=Ol%C3%A1%20%26%20tchau');
});
