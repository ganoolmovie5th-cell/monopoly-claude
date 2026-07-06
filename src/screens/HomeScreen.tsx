import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { BoardTheme, TOKENS } from '../core/types';

interface Props { onStart: () => void; }

const PLAYER_COUNTS = [0, 1, 2, 3, 4];
const THEMES: { key: BoardTheme; label: string; desc: string }[] = [
  { key: 'indonesia', label: '🇮🇩 Indonesia', desc: '40 kotak — kota-kota Indonesia' },
  { key: 'world-mini', label: '🌍 World Mini', desc: '24 kotak — kota-kota dunia' },
];

export default function HomeScreen({ onStart }: Props) {
  const insets = useSafeAreaInsets();
  const { newGame } = useGameStore();
  const [humanCount, setHumanCount] = useState(1);
  const [aiCount, setAiCount] = useState(1);
  const [theme, setTheme] = useState<BoardTheme>('indonesia');

  const total = humanCount + aiCount;
  const canStart = total >= 2 && total <= 4;

  const handleStart = () => {
    if (!canStart) return;
    const players = [];
    for (let i = 0; i < humanCount; i++) {
      players.push({ name: `Pemain ${i + 1}`, token: TOKENS[i], isAI: false });
    }
    for (let i = 0; i < aiCount; i++) {
      players.push({ name: `Bot ${i + 1}`, token: TOKENS[humanCount + i], isAI: true });
    }
    newGame(theme, players);
    onStart();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🎲 Monopoly</Text>
        <Text style={styles.subtitle}>Indonesia Edition</Text>

        {/* Theme selection */}
        <Text style={styles.sectionLabel}>Pilih Papan</Text>
        <View style={styles.row}>
          {THEMES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.option, theme === t.key && styles.optionActive]}
              onPress={() => setTheme(t.key)}
            >
              <Text style={styles.optionLabel}>{t.label}</Text>
              <Text style={styles.optionDesc}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Human players */}
        <Text style={styles.sectionLabel}>Pemain Manusia</Text>
        <View style={styles.row}>
          {PLAYER_COUNTS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, humanCount === n && styles.chipActive, (n + aiCount > 4 || n + aiCount < 2) && n !== humanCount && styles.chipDisabled]}
              onPress={() => { if (n + aiCount <= 4) setHumanCount(n); }}
              disabled={n + aiCount > 4}
            >
              <Text style={[styles.chipText, humanCount === n && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI count */}
        <Text style={styles.sectionLabel}>Bot AI</Text>
        <View style={styles.row}>
          {PLAYER_COUNTS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, aiCount === n && styles.chipActive, (humanCount + n > 4 || humanCount + n < 2) && n !== aiCount && styles.chipDisabled]}
              onPress={() => { if (humanCount + n <= 4) setAiCount(n); }}
              disabled={humanCount + n > 4}
            >
              <Text style={[styles.chipText, aiCount === n && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total indicator */}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total: {total} pemain</Text>
          {!canStart && <Text style={styles.totalWarn}>⚠️ Minimal 2, maksimal 4</Text>}
        </View>

        <TouchableOpacity style={[styles.startBtn, !canStart && styles.startBtnDisabled]} onPress={handleStart} accessibilityRole="button" disabled={!canStart}>
          <Text style={styles.startText}>🎲 Mulai Permainan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 24, alignItems: 'center' },
  title: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 24 },
  subtitle: { fontSize: 16, color: '#a78bfa', marginBottom: 32 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#94a3b8', alignSelf: 'flex-start', marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', width: '100%' },
  option: { flex: 1, minWidth: 140, padding: 16, borderRadius: 14, backgroundColor: '#2a2a4a', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  optionActive: { borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.15)' },
  optionLabel: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  optionDesc: { fontSize: 12, color: '#94a3b8' },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2a2a4a', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  chipActive: { borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.2)' },
  chipText: { fontSize: 18, fontWeight: '700', color: '#94a3b8' },
  chipTextActive: { color: '#a78bfa' },
  startBtn: { marginTop: 40, backgroundColor: '#a78bfa', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 16, width: '100%', alignItems: 'center' },
  startBtnDisabled: { opacity: 0.4 },
  startText: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  chipDisabled: { opacity: 0.3 },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  totalText: { fontSize: 14, color: '#e2e8f0', fontWeight: '600' },
  totalWarn: { fontSize: 12, color: '#fbbf24' },
});
