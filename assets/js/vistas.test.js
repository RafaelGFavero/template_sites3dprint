import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VISTAS, orbita, ISO, recortaAbaixo, mm } from './vistas.js';

test('primeiro diedro: frontal, superior abaixo e lateral esquerda à direita', () => {
  assert.deepEqual(VISTAS.frontal(1, 2, 3), [1, -3, -2]);
  assert.deepEqual(VISTAS.superior(1, 2, 3), [1, -2, 3]);
  assert.deepEqual(VISTAS.lateral(1, 2, 3), [-2, -3, -1]);
});

test('órbita com azimute e elevação zero é a vista frontal', () => {
  const [u, v, p] = orbita(0, 0)(1, 2, 3);
  assert.deepEqual([u, v, p].map((n) => Math.round(n * 1e6) / 1e6), [1, -3, -2]);
});

test('isométrica mostra os três eixos com o mesmo encurtamento', () => {
  const proj = orbita(ISO.az, ISO.el);
  const comp = ([x, y, z]) => { const [u, v] = proj(x, y, z); return Math.hypot(u, v).toFixed(3); };
  assert.equal(comp([1, 0, 0]), comp([0, 1, 0]));
  assert.equal(comp([0, 1, 0]), comp([0, 0, 1]));
});

test('recorte do triângulo abaixo de uma altura', () => {
  const tri = [[0, 0, 0], [2, 0, 0], [0, 0, 2]];
  assert.equal(recortaAbaixo(tri, 5).length, 3);
  assert.equal(recortaAbaixo(tri, -1).length, 0);
  const meio = recortaAbaixo(tri, 1);
  assert.equal(meio.length, 4);
  assert.ok(meio.every(([, , z]) => z <= 1 + 1e-9));
});

test('cotas com vírgula e uma casa', () => {
  assert.equal(mm(32.8249), '32,8');
  assert.equal(mm(26), '26,0');
});
