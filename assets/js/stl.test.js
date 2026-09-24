import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSTL, bounds, featureEdges } from './stl.js';

const file = readFileSync(new URL('../models/trava-conector.stl', import.meta.url));
const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);

test('lê o STL binário da trava com todos os triângulos', () => {
  const mesh = parseSTL(buffer);
  assert.equal(mesh.count, 854);
  assert.equal(mesh.positions.length, 854 * 9);
});

test('a caixa envolvente bate com a peça modelada (mm)', () => {
  const b = bounds(parseSTL(buffer));
  assert.equal(b.size.map((v) => v.toFixed(1)).join(' x '), '32.8 x 26.4 x 26.4');
  assert.equal(b.min[2].toFixed(2), '0.00');
});

test('arestas vivas: um cubo tem 12, e nenhuma diagonal das faces', () => {
  const mesh = parseSTL(cubeSTL());
  assert.equal(featureEdges(mesh, 30).length / 6, 12);
});

// Cubo unitário em STL binário: 12 triângulos, cada face quadrada dividida por uma diagonal.
function cubeSTL() {
  const v = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  const buf = new ArrayBuffer(84 + faces.length * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, faces.length, true);
  faces.forEach((f, i) => {
    const o = 84 + i * 50;
    f.forEach((vi, k) => v[vi].forEach((c, j) => dv.setFloat32(o + 12 + k * 12 + j * 4, c, true)));
  });
  return buf;
}
