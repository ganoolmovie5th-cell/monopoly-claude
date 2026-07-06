import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BoardSpace, Player, Property, ColorGroup } from '../core/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = SCREEN_WIDTH - 12;
// Board: 11 columns — 2 corners (1.5x) + 9 properties (1x)
const PROP_COUNT = 9; // properties per side (between corners)
const CORNER_RATIO = 1.6;
const TOTAL_UNITS = PROP_COUNT + CORNER_RATIO * 2;
const CELL_W = Math.floor(BOARD_SIZE / TOTAL_UNITS);
const CORNER_W = Math.floor(CELL_W * CORNER_RATIO);
const STRIP_H = 5; // color strip thickness

const COLOR_MAP: Record<ColorGroup, string> = {
  brown: '#8B4513',
  lightblue: '#87CEEB',
  pink: '#FF69B4',
  orange: '#FF8C00',
  red: '#DC143C',
  yellow: '#FFD700',
  green: '#228B22',
  darkblue: '#1a237e',
  railroad: '#424242',
  utility: '#78909c',
};

const CORNER_COLORS: Record<string, { bg: string; text: string }> = {
  go: { bg: '#c8e6c9', text: '#1b5e20' },
  jail: { bg: '#ffecb3', text: '#e65100' },
  'free-parking': { bg: '#e3f2fd', text: '#0d47a1' },
  'go-to-jail': { bg: '#ffcdd2', text: '#b71c1c' },
};

interface Props {
  board: BoardSpace[];
  players: Player[];
  properties: Property[];
}

export function BoardView({ board, players, properties }: Props) {
  const boardLen = board.length;
  const perSide = boardLen === 40 ? 9 : 5;

  // Split board into 4 sides + 4 corners
  // Bottom: index 0 (corner), 1..9 (props), 10 (corner)
  // Left:   index 10 (corner), 11..19 (props), 20 (corner)
  // Top:    index 20 (corner), 21..29 (props), 30 (corner)
  // Right:  index 30 (corner), 31..39 (props), 0 (corner)
  const corners = boardLen === 40 ? [0, 10, 20, 30] : [0, 6, 12, 18];
  const sides = {
    bottom: boardLen === 40 ? [9, 8, 7, 6, 5, 4, 3, 2, 1] : [5, 4, 3, 2, 1],
    left: boardLen === 40 ? [11, 12, 13, 14, 15, 16, 17, 18, 19] : [7, 8, 9, 10, 11],
    top: boardLen === 40 ? [21, 22, 23, 24, 25, 26, 27, 28, 29] : [13, 14, 15, 16, 17],
    right: boardLen === 40 ? [39, 38, 37, 36, 35, 34, 33, 32, 31] : [23, 22, 21, 20, 19],
  };

  const playersAt = (pos: number) => players.filter((p) => p.position === pos && !p.bankrupt);

  const renderCorner = (idx: number) => {
    const space = board[idx];
    const colors = CORNER_COLORS[space.type] ?? { bg: '#fff', text: '#000' };
    const pHere = playersAt(idx);
    return (
      <View key={`corner-${idx}`} style={[styles.corner, { backgroundColor: colors.bg }]}>
        <Text style={[styles.cornerText, { color: colors.text }]} numberOfLines={2}>{space.name}</Text>
        {pHere.length > 0 && (
          <View style={styles.cornerTokens}>
            {pHere.map((p) => <Text key={p.id} style={styles.tokenSmall}>{p.token}</Text>)}
          </View>
        )}
      </View>
    );
  };

  const renderPropCell = (idx: number, side: 'bottom' | 'left' | 'top' | 'right') => {
    const space = board[idx];
    const prop = properties.find((p) => p.spaceId === idx);
    const color = space.color ? COLOR_MAP[space.color] : '#9e9e9e';
    const pHere = playersAt(idx);
    const isVertical = side === 'left' || side === 'right';
    const stripSide = side === 'bottom' ? 'top' : side === 'top' ? 'bottom' : side === 'left' ? 'right' : 'left';

    // Extract short name (without emoji prefix for display)
    const parts = space.name.split(' ');
    const emoji = parts[0];
    const name = parts.slice(1).join(' ');

    return (
      <View
        key={`prop-${idx}`}
        style={[
          isVertical ? styles.propCellV : styles.propCellH,
          { [`border${capitalize(stripSide)}Color`]: color, [`border${capitalize(stripSide)}Width`]: STRIP_H },
        ]}
      >
        <Text style={styles.propEmoji}>{emoji}</Text>
        <Text style={[styles.propName, isVertical && styles.propNameV]} numberOfLines={2}>{name}</Text>
        {space.price && <Text style={styles.propPrice}>Rp{(space.price / 1000).toFixed(0)}k</Text>}
        {prop?.ownerId !== null && prop?.ownerId !== undefined && (
          <View style={[styles.ownerBar, { backgroundColor: color }]}>
            <Text style={styles.ownerToken}>{players[prop.ownerId]?.token}</Text>
            {prop.houses > 0 && <Text style={styles.houseCount}>{prop.houses < 5 ? '🏠'.repeat(prop.houses) : '🏨'}</Text>}
          </View>
        )}
        {pHere.length > 0 && (
          <View style={styles.cellTokens}>
            {pHere.map((p) => <Text key={p.id} style={styles.tokenSmall}>{p.token}</Text>)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
      {/* Top-left corner */}
      <View style={[styles.cornerWrap, { top: 0, left: 0 }]}>{renderCorner(corners[2])}</View>
      {/* Top-right corner */}
      <View style={[styles.cornerWrap, { top: 0, right: 0 }]}>{renderCorner(corners[3])}</View>
      {/* Bottom-left corner */}
      <View style={[styles.cornerWrap, { bottom: 0, left: 0 }]}>{renderCorner(corners[1])}</View>
      {/* Bottom-right corner */}
      <View style={[styles.cornerWrap, { bottom: 0, right: 0 }]}>{renderCorner(corners[0])}</View>

      {/* Bottom row (L to R visually = R to L in index) */}
      <View style={[styles.sideRow, { bottom: 0, left: CORNER_W, right: CORNER_W, height: CORNER_W, flexDirection: 'row' }]}>
        {sides.bottom.map((idx) => renderPropCell(idx, 'bottom'))}
      </View>

      {/* Top row */}
      <View style={[styles.sideRow, { top: 0, left: CORNER_W, right: CORNER_W, height: CORNER_W, flexDirection: 'row' }]}>
        {sides.top.map((idx) => renderPropCell(idx, 'top'))}
      </View>

      {/* Left column */}
      <View style={[styles.sideCol, { left: 0, top: CORNER_W, bottom: CORNER_W, width: CORNER_W, flexDirection: 'column' }]}>
        {sides.left.map((idx) => renderPropCell(idx, 'left'))}
      </View>

      {/* Right column */}
      <View style={[styles.sideCol, { right: 0, top: CORNER_W, bottom: CORNER_W, width: CORNER_W, flexDirection: 'column' }]}>
        {sides.right.map((idx) => renderPropCell(idx, 'right'))}
      </View>

      {/* Center */}
      <View style={styles.center}>
        <Text style={styles.centerDragon}>🐉</Text>
        <Text style={styles.centerTitle}>MONOPOLY</Text>
        <Text style={styles.centerSub}>INDONESIA</Text>
        <View style={styles.centerDiamond}>
          <View style={styles.diamondInner} />
        </View>
        <Text style={styles.centerDragon2}>🐉</Text>
      </View>
    </View>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: '#e8e0d4',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#333',
    overflow: 'hidden',
  },
  cornerWrap: { position: 'absolute', width: CORNER_W, height: CORNER_W, zIndex: 2 },
  corner: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  cornerText: { fontSize: 8, fontWeight: '800', textAlign: 'center' },
  cornerTokens: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 },
  sideRow: { position: 'absolute', flexDirection: 'row' },
  sideCol: { position: 'absolute', flexDirection: 'column' },
  propCellH: {
    flex: 1, height: '100%',
    borderWidth: 0.5, borderColor: '#555',
    backgroundColor: '#f5f0e8',
    alignItems: 'center', justifyContent: 'center',
    padding: 1, overflow: 'hidden',
  },
  propCellV: {
    flex: 1, width: '100%',
    borderWidth: 0.5, borderColor: '#555',
    backgroundColor: '#f5f0e8',
    alignItems: 'center', justifyContent: 'center',
    padding: 1, overflow: 'hidden',
  },
  propEmoji: { fontSize: 10, marginBottom: 1 },
  propName: { fontSize: 5.5, fontWeight: '700', textAlign: 'center', color: '#1a1a1a', lineHeight: 7 },
  propNameV: { fontSize: 5 },
  propPrice: { fontSize: 5, color: '#555', marginTop: 1 },
  ownerBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ownerToken: { fontSize: 6 },
  houseCount: { fontSize: 5 },
  cellTokens: { position: 'absolute', top: 1, right: 1, flexDirection: 'row', flexWrap: 'wrap' },
  tokenSmall: { fontSize: 7 },
  center: {
    position: 'absolute',
    top: CORNER_W,
    left: CORNER_W,
    right: CORNER_W,
    bottom: CORNER_W,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDragon: { fontSize: 24, marginBottom: 4 },
  centerTitle: { fontSize: 18, fontWeight: '900', color: '#d32f2f', letterSpacing: 2, textShadowColor: '#ffeb3b', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  centerSub: { fontSize: 10, fontWeight: '700', color: '#1565c0', letterSpacing: 3, marginTop: 2 },
  centerDiamond: { width: 50, height: 50, marginVertical: 8, transform: [{ rotate: '45deg' }], borderWidth: 2, borderColor: '#2e7d32', backgroundColor: '#4caf50', justifyContent: 'center', alignItems: 'center' },
  diamondInner: { width: 30, height: 30, backgroundColor: '#388e3c', borderWidth: 1, borderColor: '#1b5e20' },
  centerDragon2: { fontSize: 24, marginTop: 4, transform: [{ rotate: '180deg' }] },
});
