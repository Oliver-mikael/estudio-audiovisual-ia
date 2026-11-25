import { describe, expect, it } from 'vitest';
import { PLAY_PAUSE_EVENT, isTypingTarget, matchShortcut } from '../engine/shortcuts';

describe('atajos de teclado (fase 39)', () => {
  it('el espacio reproduce o pausa y Ctrl+E abre exportar', () => {
    expect(matchShortcut({ key: ' ' })).toBe('play-pause');
    expect(matchShortcut({ key: 'e', ctrlKey: true })).toBe('export');
    expect(matchShortcut({ key: 'E', metaKey: true })).toBe('export');
  });

  it('Ctrl+Z deshace y Ctrl+Shift+Z (o Ctrl+Y) rehace', () => {
    expect(matchShortcut({ key: 'z', ctrlKey: true })).toBe('undo');
    expect(matchShortcut({ key: 'Z', metaKey: true })).toBe('undo');
    expect(matchShortcut({ key: 'z', ctrlKey: true, shiftKey: true })).toBe('redo');
    expect(matchShortcut({ key: 'y', ctrlKey: true })).toBe('redo');
  });

  it('Escape cierra el modal abierto', () => {
    expect(matchShortcut({ key: 'Escape' })).toBe('escape');
  });

  it('no captura el espacio mientras se escribe en un campo', () => {
    const input = { tagName: 'INPUT' } as unknown as EventTarget;
    const textarea = { tagName: 'TEXTAREA' } as unknown as EventTarget;
    const editable = { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget;
    expect(matchShortcut({ key: ' ' }, input)).toBeNull();
    expect(matchShortcut({ key: ' ' }, textarea)).toBeNull();
    expect(matchShortcut({ key: ' ' }, editable)).toBeNull();
    expect(matchShortcut({ key: ' ' }, { tagName: 'BUTTON' } as unknown as EventTarget)).toBe(
      'play-pause'
    );
    expect(isTypingTarget(null)).toBe(false);
  });

  it('ignora teclas sin atajo y combinaciones con Alt', () => {
    expect(matchShortcut({ key: 'a' })).toBeNull();
    expect(matchShortcut({ key: ' ' , altKey: true })).toBeNull();
    expect(matchShortcut({ key: 'e', ctrlKey: true, shiftKey: true })).toBeNull();
    expect(matchShortcut({ key: 'x', ctrlKey: true })).toBeNull();
  });

  it('expone un nombre de evento estable para el Monitor', () => {
    expect(PLAY_PAUSE_EVENT).toBe('estudio:alternar-reproduccion');
  });
});
