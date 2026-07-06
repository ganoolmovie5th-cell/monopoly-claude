import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { DiceResult } from '../core/types';

interface Props {
  dice: DiceResult | null;
  rolling: boolean;
}

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function DiceAnimation({ dice, rolling }: Props) {
  const rotate1 = useSharedValue(0);
  const rotate2 = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (rolling) {
      rotate1.value = withSequence(
        withTiming(720, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      );
      rotate2.value = withSequence(
        withTiming(-540, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      );
      scale.value = withSequence(
        withTiming(1.3, { duration: 200 }),
        withSpring(1, { damping: 8 }),
      );
    }
  }, [rolling, dice]);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotate1.value}deg` }, { scale: scale.value }],
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotate2.value}deg` }, { scale: scale.value }],
  }));

  if (!dice) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.die, style1]}>
        <Text style={styles.dieText}>{DIE_FACES[dice.die1 - 1]}</Text>
      </Animated.View>
      <Animated.View style={[styles.die, style2]}>
        <Text style={styles.dieText}>{DIE_FACES[dice.die2 - 1]}</Text>
      </Animated.View>
      {dice.isDoubles && (
        <View style={styles.doublesBadge}>
          <Text style={styles.doublesText}>DOUBLES!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginVertical: 12 },
  die: { width: 56, height: 56, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  dieText: { fontSize: 36 },
  doublesBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fbbf24', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  doublesText: { fontSize: 10, fontWeight: '800', color: '#78350f' },
});
