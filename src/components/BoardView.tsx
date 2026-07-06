import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BoardSpace, Player, Property, ColorGroup } from '../core/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = SCREEN_WIDTH - 16;
const SIDE_COUNT = 11; // 40 spaces: 10 per side + 4 corners
const CELL_SIZE = Math.floor(BOARD_SIZE / SIDE_COUNT);
const CORNER_SIZE = CELL_SIZE;

const COLOR_MAP: Record<ColorGroup, string> = {
  brown: '#8B4513',
  lightblue: '#87CEEB',
  pink: '#FF69B4',
  orange: '#FF8C00',
  red: '#DC143C',
  yellow: '#FFD700',
  green: '#228B22',
  darkblue: '#00008B',
  railroad: '#333',
  utility: '#666',
};

interface Props {
  board: BoardSpace[];
  players: Player[];
  properties: Property[];
}

export function BoardView({ board, players, properties }: Props) {
  // 40-space board: positions 0-10 bottom, 11-20 left, 21-30 top, 31-39 right
  // For rendering, we place spaces around the perimeter of a square grid

  const getSpacePosition = (index: number): { top: number; left: number; rotate: number } => {
    const boardLen = board.length;
    const sideLen = boardLen === 40 ? 10 : 6; // spaces per side (excluding corners)
    const totalPerSide = sideLen + 1;

    if (boardLen === 40) {
      // Bottom row (right to left): 0-10
      if (index <= 10) {
        return { top: BOARD_SIZE - CELL_SIZE, left: BOARD_SIZE - CELL_SIZE * (index + 1), rotate: 0 };
      }
      // Left column (bottom to top): 11-20
      if (index <= 20) {
        return { top: BOARD_SIZE - CELL_SIZE * (index - 10 + 1), left: 0, rotate: 90 };
      }
      // Top row (left to right): 21-30
      if (index <= 30) {
        return { top: 0, left: CELL_SIZE * (index - 20), rotate: 180 };
      }
      // Right column (top to bottom): 31-39
      return { top: CELL_SIZE * (index - 30), left: BOARD_SIZE - CELL_SIZE, rotate: 270 };
    }

    // 24-space board: 6 per side
    if (index <= 6) {
      return { top: BOARD_SIZE - CELL_SIZE, left: BOARD_SIZE - CELL_SIZE * (index + 1), rotate: 0 };
    }
    if (index <= 12) {
      return { top: BOARD_SIZE - CELL_SIZE * (index - 6 + 1), left: 0, rotate: 90 };
    }
    if (index <= 18) {
      return { top: 0, left: CELL_SIZE * (index - 12), rotate: 180 };
    }
    return { top: CELL_SIZE * (index - 18), left: BOARD_SIZE - CELL_SIZE, rotate: 270 };
  };

  const playersAt = (pos: number) => players.filter((p) => p.position === pos && !p.bankrupt);

  return (
    <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
      {board.map((space, i) => {
        const { top, left } = getSpacePosition(i);
        const prop = properties.find((p) => p.spaceId === i);
        const color = space.color ? COLOR_MAP[space.color] : undefined;
        const pHere = playersAt(i);

        return (
          <View
            key={i}
            style={[
              styles.cell,
              { top, left, width: CELL_SIZE, height: CELL_SIZE },
              color ? { borderTopColor: color, borderTopWidth: 4 } : undefined,
            ]}
          >
            <Text style={styles.cellName} numberOfLines={2}>{space.name}</Text>
            {prop?.ownerId !== null && prop?.ownerId !== undefined && (
              <View style={[styles.ownerDot, { backgroundColor: COLOR_MAP[space.color ?? 'utility'] }]} />
            )}
            {pHere.length > 0 && (
              <View style={styles.tokens}>
                {pHere.map((p) => (
                  <Text key={p.id} style={styles.token}>{p.token}</Text>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* Center area */}
      <View style={styles.center}>
        <Text style={styles.centerTitle}>🎲</Text>
        <Text style={styles.centerSubtitle}>MONOPOLY</Text>
        <Text style={styles.centerTheme}>INDONESIA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: '#c8e6c9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1b5e20',
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cellName: {
    fontSize: 6,
    textAlign: 'center',
    color: '#1b5e20',
    fontWeight: '600',
  },
  ownerDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tokens: {
    position: 'absolute',
    bottom: 1,
    left: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  token: { fontSize: 8 },
  center: {
    position: 'absolute',
    top: CELL_SIZE + 10,
    left: CELL_SIZE + 10,
    right: CELL_SIZE + 10,
    bottom: CELL_SIZE + 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTitle: { fontSize: 32 },
  centerSubtitle: { fontSize: 14, fontWeight: '800', color: '#1b5e20', letterSpacing: 2 },
  centerTheme: { fontSize: 10, color: '#2e7d32', marginTop: 2 },
});
