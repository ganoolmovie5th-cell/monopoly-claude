import React, { useEffect } from 'react';
import { StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Player, BoardSpace } from '../core/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = SCREEN_WIDTH - 16;
const SIDE_COUNT = 11;
const CELL_SIZE = Math.floor(BOARD_SIZE / SIDE_COUNT);

interface Props {
  player: Player;
  boardSize: number; // total spaces on board
}

function getPosition(index: number, boardSize: number): { x: number; y: number } {
  if (boardSize === 40) {
    if (index <= 10) {
      return { x: BOARD_SIZE - CELL_SIZE * (index + 1) + CELL_SIZE / 2, y: BOARD_SIZE - CELL_SIZE / 2 };
    }
    if (index <= 20) {
      return { x: CELL_SIZE / 2, y: BOARD_SIZE - CELL_SIZE * (index - 10 + 1) + CELL_SIZE / 2 };
    }
    if (index <= 30) {
      return { x: CELL_SIZE * (index - 20) + CELL_SIZE / 2, y: CELL_SIZE / 2 };
    }
    return { x: BOARD_SIZE - CELL_SIZE / 2, y: CELL_SIZE * (index - 30) + CELL_SIZE / 2 };
  }
  // 24-space board
  if (index <= 6) {
    return { x: BOARD_SIZE - CELL_SIZE * (index + 1) + CELL_SIZE / 2, y: BOARD_SIZE - CELL_SIZE / 2 };
  }
  if (index <= 12) {
    return { x: CELL_SIZE / 2, y: BOARD_SIZE - CELL_SIZE * (index - 6 + 1) + CELL_SIZE / 2 };
  }
  if (index <= 18) {
    return { x: CELL_SIZE * (index - 12) + CELL_SIZE / 2, y: CELL_SIZE / 2 };
  }
  return { x: BOARD_SIZE - CELL_SIZE / 2, y: CELL_SIZE * (index - 18) + CELL_SIZE / 2 };
}

export function PlayerToken({ player, boardSize }: Props) {
  const pos = getPosition(player.position, boardSize);
  const x = useSharedValue(pos.x);
  const y = useSharedValue(pos.y);

  useEffect(() => {
    const target = getPosition(player.position, boardSize);
    x.value = withSpring(target.x, { damping: 12, stiffness: 100 });
    y.value = withSpring(target.y, { damping: 12, stiffness: 100 });
  }, [player.position]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - 12 },
      { translateY: y.value - 12 },
    ],
  }));

  if (player.bankrupt) return null;

  return (
    <Animated.View style={[styles.token, animatedStyle]}>
      <Text style={styles.emoji}>{player.token}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  token: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  emoji: { fontSize: 16 },
});
