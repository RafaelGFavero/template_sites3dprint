import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mm, quadroHero, FIM_HERO } from './desenho.js';

test('cotas com vírgula e uma casa', () => {
  assert.equal(mm(32.8249), '32,8');
  assert.equal(mm(26), '26,0');
});

test('a abertura do hero termina com a peça inteira impressa e em tinta', () => {
  const fim = quadroHero(FIM_HERO, 132);
  assert.deepEqual(fim, { p: [1, 1, 1], alfa: 1, esboco: 1, ate: 132, tinta: 1 });
  assert.deepEqual(quadroHero(Infinity, 132), fim); // o quadro do movimento reduzido
});

test('as camadas sobem em ritmo linear de 900 a 2600 ms, e a tinta vem depois', () => {
  assert.equal(quadroHero(900, 132).ate, 0);
  assert.equal(quadroHero(1750, 132).ate, 66);
  assert.equal(quadroHero(2600, 132).ate, 132);
  assert.equal(quadroHero(2600, 132).tinta, 0);
});
