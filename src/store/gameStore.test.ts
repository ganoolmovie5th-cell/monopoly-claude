jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { useGameStore } from './gameStore';

describe('gameStore undo', () => {
  beforeEach(() => {
    useGameStore.setState({ state: null, undoStack: [] });
  });

  test('undo restores previous state from stack', () => {
    useGameStore.getState().newGame('classic', [
      { name: 'P1', token: '🎩', isAI: false },
      { name: 'P2', token: '🐶', isAI: true },
    ]);

    const initialPos = useGameStore.getState().state!.players[0].position;

    useGameStore.getState().rollAndMove();
    const afterRollPos = useGameStore.getState().state!.players[0].position;

    expect(afterRollPos).not.toBe(initialPos);

    useGameStore.getState().undo();

    expect(useGameStore.getState().state!.players[0].position).toBe(initialPos);
    expect(useGameStore.getState().undoStack.length).toBe(0);
  });

  test('undo stack builds on successive rolls', () => {
    useGameStore.getState().newGame('classic', [
      { name: 'P1', token: '🎩', isAI: false },
      { name: 'P2', token: '🐶', isAI: true },
    ]);

    const stackBefore = useGameStore.getState().undoStack.length;

    useGameStore.getState().rollAndMove();
    const stackAfterRoll1 = useGameStore.getState().undoStack.length;
    expect(stackAfterRoll1).toBe(stackBefore + 1);

    useGameStore.getState().undo();
    expect(useGameStore.getState().undoStack.length).toBe(stackBefore);
  });

  test('undo with empty stack is no-op', () => {
    useGameStore.getState().newGame('classic', [
      { name: 'P1', token: '🎩', isAI: false },
    ]);

    const state = useGameStore.getState().state;

    useGameStore.setState({ undoStack: [] });

    useGameStore.getState().undo();
    expect(useGameStore.getState().state).toBe(state);
  });
});
