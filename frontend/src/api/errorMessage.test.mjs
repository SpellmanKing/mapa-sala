import assert from 'node:assert/strict';
import test from 'node:test';
import { getApiErrorMessage } from './errorMessage.js';

test('retorna a mensagem do backend para conflito HTTP 409', () => {
  const message = getApiErrorMessage({
    response: {
      status: 409,
      data: { error: 'Não é possível excluir a sala porque existem vínculos.' }
    }
  }, 'Erro ao excluir sala.');

  assert.equal(message, 'Não é possível excluir a sala porque existem vínculos.');
});

test('usa a mensagem padrão quando a resposta não traz erro legível', () => {
  assert.equal(getApiErrorMessage(new Error('falha de rede'), 'Erro ao excluir sala.'), 'Erro ao excluir sala.');
});
