import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSTL, bounds, featureEdgeList, sliceAxis, loops, layerCount } from './stl.js';

const file = readFileSync(new URL('../models/trava-conector.stl', import.meta.url));
const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);

test('lê o STL binário da trava com todos os triângulos', () => {
  const mesh = parseSTL(buffer);
  assert.equal(mesh.count, 854);
  assert.equal(mesh.positions.length, 854 * 9);
});

test('STL truncado ou sem o cabeçalho inteiro é recusado', () => {
  const mil = new ArrayBuffer(100);
  new DataView(mil).setUint32(80, 1000, true); // diz ter 1000 triângulos e traz 100 bytes
  assert.throws(() => parseSTL(mil), /STL truncado/);
  assert.throws(() => parseSTL(cubeSTL().slice(0, 683)), /STL truncado/); // falta o último byte do cubo
  assert.throws(() => parseSTL(new ArrayBuffer(40)), /STL truncado/); // nem os 84 bytes do cabeçalho
});

test('a caixa envolvente bate com a peça modelada (mm)', () => {
  const b = bounds(parseSTL(buffer));
  assert.equal(b.size.map((v) => v.toFixed(1)).join(' x '), '32.8 x 26.4 x 26.4');
  assert.equal(b.min[2].toFixed(2), '0.00');
});

test('arestas vivas: um cubo tem 12, cada uma entre duas faces', () => {
  const arestas = featureEdgeList(parseSTL(cubeSTL()), 30);
  assert.equal(arestas.length, 12);
  assert.ok(arestas.every((e) => e.faces.length === 2));
  assert.ok(arestas.every(({ a, b }) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) === 1));
});

test('corte horizontal do cubo a meia altura é um quadrado', () => {
  const lacos = loops(sliceAxis(parseSTL(cubeSTL()), 2, 0.5));
  assert.equal(lacos.length, 1);
  assert.equal(lacos[0].length, 8); // 4 cantos + o meio de cada face, onde passa a diagonal
  const perimetro = lacos[0].reduce((s, p, i, l) => { const q = l[(i + 1) % l.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
  assert.equal(perimetro.toFixed(3), '4.000');
});

test('a trava sobe em 132 camadas de 0,2 mm', () => {
  assert.equal(layerCount(parseSTL(buffer), 0.2), 132);
});

test('a camada incompleta do topo também conta: 1,05 mm de altura são 6 camadas de 0,2 mm', () => {
  assert.equal(layerCount(parseSTL(cubeSTL(1.05)), 0.2), 6);
});

test('o corte A-A da trava (y = 12,8, pelo eixo do furo) fecha todos os segmentos em laços', () => {
  const segs = sliceAxis(parseSTL(buffer), 1, 12.8);
  const lacos = loops(segs);
  assert.equal(lacos.length, 2);
  // um ponto por segmento vale neste plano vertical; não reusar em corte horizontal: em z = 0,1 há segmentos de menos de 1 µm
  assert.equal(lacos.reduce((n, l) => n + l.length, 0), segs.length / 4);
});

test('cadeia aberta não vira laço', () => {
  assert.deepEqual(loops([0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1]), []);
});

test('corte em x devolve (y, z)', () => {
  assert.deepEqual(sliceAxis({ count: 1, positions: new Float32Array([0, 0, 0, 2, 4, 0, 2, 0, 6]) }, 0, 1), [2, 0, 0, 3]);
});

// Cubo unitário em STL binário: 12 triângulos, cada face quadrada dividida por uma diagonal. `altura` estica o z.
function cubeSTL(altura = 1) {
  const v = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  const buf = new ArrayBuffer(84 + faces.length * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, faces.length, true);
  faces.forEach((f, i) => {
    const o = 84 + i * 50;
    f.forEach((vi, k) => v[vi].forEach((c, j) => dv.setFloat32(o + 12 + k * 12 + j * 4, j === 2 ? c * altura : c, true)));
  });
  return buf;
}
