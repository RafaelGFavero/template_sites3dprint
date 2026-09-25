import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseSTL } from './stl.js';
import { cubeSTL } from './cubo.js';
import { gerar, STL_PADRAO, SAIDA } from './desenhos.js';

const comprimento = (segs) => {
  let soma = 0;
  for (let i = 0; i < segs.length; i += 4) soma += Math.hypot(segs[i + 2] - segs[i], segs[i + 3] - segs[i + 1]);
  return soma;
};
const cubo = () => gerar(parseSTL(cubeSTL()), 0.5); // o corte A-A do cubo passa pelo meio dele

test('cubo: medidas, camadas e o contorno da vista frontal', () => {
  const d = cubo();
  assert.deepEqual(d.medidas, { largura: 1, profundidade: 1, altura: 1 });
  assert.equal(d.camadas, 5);
  assert.equal(d.frontal.visiveis.length, 16); // as quatro arestas da face da frente
  assert.equal(comprimento(d.frontal.visiveis).toFixed(2), '4.00');
});

test('cubo: cada camada tem só as duas linhas das faces que a isométrica mostra', () => {
  assert.deepEqual(cubo().iso.camadas.map((c) => c.length), [8, 8, 8, 8, 8]);
});

test('cubo: o corte A-A fecha um laço', () => {
  assert.equal(cubo().corte.lacos.length, 1);
});

test('plano de corte que não passa pela peça é recusado', () => {
  assert.throws(() => gerar(parseSTL(cubeSTL()), 5), /não corta a peça/);
});

const semSTL = !existsSync(STL_PADRAO) && 'sem o STL da trava em ../impressao-3d/saida';

test('o desenhos.json do repositório é o que o STL da trava gera agora', { skip: semSTL }, () => {
  const dados = gerar(parseSTL(new Uint8Array(readFileSync(STL_PADRAO)).buffer));
  assert.deepEqual(JSON.parse(readFileSync(SAIDA, 'utf8')), dados); // comparado já lido: o git pode trocar o fim de linha
});
