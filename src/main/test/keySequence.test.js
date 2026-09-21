import { jest } from '@jest/globals';

import { createKeySequence } from '../keySequence.js';

const keyDown = (key, extra = {}) => ({ type: 'keyDown', key, ...extra });
const cmdK = () => keyDown('k', { meta: true });

let onComplete;

function build(isMac = true) {
  onComplete = jest.fn();
  return createKeySequence({ isMac, onComplete });
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('Cmd+K seguido de R dispara a ação e consome as duas teclas (macOS)', () => {
  const handle = build();

  expect(handle(cmdK())).toBe(true);
  expect(handle(keyDown('r'))).toBe(true);

  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('Ctrl+K seguido de R dispara a ação (Linux)', () => {
  const handle = build(false);

  expect(handle(keyDown('k', { control: true }))).toBe(true);
  expect(handle(keyDown('r'))).toBe(true);

  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('aceita R com o modificador ainda pressionado e consome (evita Cmd+R de recarregar)', () => {
  const handle = build();

  handle(cmdK());

  expect(handle(keyDown('r', { meta: true }))).toBe(true);
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('outra tecla depois de Cmd+K cancela a sequência sem ser consumida', () => {
  const handle = build();

  handle(cmdK());

  expect(handle(keyDown('x'))).toBe(false);
  expect(handle(keyDown('r'))).toBe(false);
  expect(onComplete).not.toHaveBeenCalled();
});

test('teclas só de modificador não cancelam a sequência', () => {
  const handle = build();

  handle(cmdK());
  expect(handle(keyDown('Shift'))).toBe(false);
  expect(handle(keyDown('Meta'))).toBe(false);
  handle(keyDown('r'));

  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('passados 1,5 s sem tecla a sequência é cancelada', () => {
  const handle = build();

  handle(cmdK());
  jest.advanceTimersByTime(1501);

  expect(handle(keyDown('r'))).toBe(false);
  expect(onComplete).not.toHaveBeenCalled();
});

test('R antes de 1,5 s ainda completa a sequência', () => {
  const handle = build();

  handle(cmdK());
  jest.advanceTimersByTime(1400);
  handle(keyDown('r'));

  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('R sem armar a sequência é ignorado', () => {
  const handle = build();

  expect(handle(keyDown('r'))).toBe(false);
  expect(handle(keyDown('r', { meta: true }))).toBe(false);
  expect(onComplete).not.toHaveBeenCalled();
});

test('K sem o modificador da plataforma não arma a sequência', () => {
  const handle = build();

  expect(handle(keyDown('k', { control: true }))).toBe(false);
  expect(handle(keyDown('k'))).toBe(false);
  handle(keyDown('r'));
  expect(onComplete).not.toHaveBeenCalled();
});

test('repetição automática do Cmd+K mantém a sequência armada', () => {
  const handle = build();

  handle(cmdK());
  expect(handle(keyDown('k', { meta: true, isAutoRepeat: true }))).toBe(true);
  handle(keyDown('r'));

  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('eventos que não são keyDown são ignorados', () => {
  const handle = build();

  expect(handle({ type: 'keyUp', key: 'k', meta: true })).toBe(false);
  handle(keyDown('r'));
  expect(onComplete).not.toHaveBeenCalled();
});

test('a sequência pode ser repetida depois de completar', () => {
  const handle = build();

  handle(cmdK());
  handle(keyDown('r'));
  handle(cmdK());
  handle(keyDown('r'));

  expect(onComplete).toHaveBeenCalledTimes(2);
});
