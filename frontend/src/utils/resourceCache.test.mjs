import assert from 'node:assert/strict';
import test from 'node:test';
import { createResourceCache } from './resourceCache.js';

test('deduplica requisições, mantém o recurso carregado e permite atualização explícita', async () => {
  const cache = createResourceCache();
  let requests = 0;
  const applied = [];
  const loader = async () => ++requests;
  const apply = value => applied.push(value);

  await Promise.all([
    cache.load('cursos', loader, apply),
    cache.load('cursos', loader, apply)
  ]);
  await cache.load('cursos', loader, apply);
  await cache.load('cursos', loader, apply, true);

  assert.equal(requests, 2);
  assert.deepEqual(applied, [1, 2]);
});

test('ignora uma resposta iniciada antes da limpeza da sessão', async () => {
  const cache = createResourceCache();
  const applied = [];
  let release;
  const pending = cache.load(
    'turmas',
    () => new Promise(resolve => { release = resolve; }),
    value => applied.push(value)
  );

  cache.clear();
  release('antigo');
  await pending;

  assert.deepEqual(applied, []);
});
