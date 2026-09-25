import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// O modelo 3D das peças é o que se vende e nunca vai para o site. Tudo em assets/ é publicado.
const MALHA = /\.(stl|3mf|obj|ply|glb|gltf|blend|step|stp)$/i;

test('nenhum modelo 3D dentro de assets/, que é o que o site publica', () => {
  const assets = fileURLToPath(new URL('..', import.meta.url));
  assert.deepEqual(readdirSync(assets, { recursive: true }).filter((f) => MALHA.test(f)), []);
});
