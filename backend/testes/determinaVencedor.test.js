const { determinaVencedor } = require('../index'); 

test('pedra vs tesoura → jogador1 ganha', () => {
  expect(determinaVencedor('pedra', 'tesoura')).toBe('jogador1');
});

test('pedra vs papel → jogador2 ganha', () => {
  expect(determinaVencedor('pedra', 'papel')).toBe('jogador2');
});

test('papel vs pedra → jogador1 ganha', () => {
  expect(determinaVencedor('papel', 'pedra')).toBe('jogador1');
});

test('tesoura vs papel → jogador1 ganha', () => {
  expect(determinaVencedor('tesoura', 'papel')).toBe('jogador1');
});

test('tesoura vs tesoura → empate', () => {
  expect(determinaVencedor('tesoura', 'tesoura')).toBe('empate');
});
