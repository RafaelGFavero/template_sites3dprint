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

test('cubo: a frontal esconde a face de trás, e a isométrica mostra 9 das 12 arestas', () => {
  const d = cubo();
  assert.equal(d.frontal.ocultos.length, 16); // as quatro arestas da face de trás, cobertas pela da frente
  // 9 arestas de 1 mm, cada uma encurtada para √(2/3) na isométrica: ≈ 7,35 mm. Mede 7,38 com os tocos de ~0,01 mm
  // que as três arestas ocultas deixam onde encostam no contorno.
  const visivel = comprimento(d.iso.visiveis);
  assert.ok(Math.abs(visivel - 9 * Math.sqrt(2 / 3)) < 0.1, `${visivel} mm`);
});

test('cubo: cada camada tem só as duas linhas das faces que a isométrica mostra', () => {
  assert.deepEqual(cubo().iso.camadas.map((c) => c.length), [8, 8, 8, 8, 8]);
});

test('cubo: o corte A-A fecha um laço, com o z para cima', () => {
  const { lacos } = cubo().corte;
  assert.equal(lacos.length, 1);
  assert.deepEqual(lacos[0].filter((n, i) => i % 2 && n > 0), []); // v = -z e cresce para baixo: nada abaixo da base
});

test('plano de corte que não passa pela peça é recusado', () => {
  assert.throws(() => gerar(parseSTL(cubeSTL()), 5), /não corta a peça/);
});

const semSTL = !existsSync(STL_PADRAO) && 'sem o STL da trava em ../impressao-3d/saida';

test('o desenhos.json do repositório é o que o STL da trava gera agora', { skip: semSTL }, () => {
  const dados = gerar(parseSTL(new Uint8Array(readFileSync(STL_PADRAO)).buffer));
  assert.deepEqual(JSON.parse(readFileSync(SAIDA, 'utf8')), dados); // comparado já lido: o git pode trocar o fim de linha
});
