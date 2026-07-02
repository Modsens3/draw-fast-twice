// Save/load to localStorage, versioned for forward compatibility.

import { GameState, newGameState } from './state';

const KEY = 'chimera-red-save';
const VERSION = 1;

export function saveGame(state: GameState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, state }));
    return true;
  } catch {
    return false;
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version: number; state: Partial<GameState> };
    // Merge over fresh defaults so new fields keep working across versions.
    return { ...newGameState(), ...parsed.state };
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
