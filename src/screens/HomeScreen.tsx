import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { BoardTheme, TOKENS } from '../core/types';

interface Props { onStart: () => void; }

const PLAYER_COUNTS = [2, 3, 4];
const THEMES: { key: BoardTheme; label: string; desc: string }[] = [
  { key: 'indonesia', label: '🇮🇩 Indonesia', desc: '40 kotak — kota-kota Indonesia' },
  { key: 'world-mini', label: '🌍 World Mini', desc: '24 kotak — kota-kota dunia' },
];

export default function HomeScreen({ onStart }: Props) {
  const insets = useSafeAreaInsets();
  const { newGame } = useGameStore();
  const [playerCount, setPlayerCount] = useState(2);
  const [aiCount, setAiCount] = useState(1);
  const [theme, setTheme] = useState<BoardTheme>('indonesia');

  const handleStart = () => {
    const humanCount = playerCount - aiCount;
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

        {/* Player count */}
        <Text style={styles.sectionLabel}>Jumlah Pemain</Text>
        <View style={styles.row}>
          {PLAYER_COUNTS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, playerCount === n && styles.chipActive]}
              onPress={() => { setPlayerCount(n); setAiCount(Math.min(aiCount, n - 1)); }}
            >
              <Text style={[styles.chipText, playerCount === n && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI count */}
        <Text style={styles.sectionLabel}>Jumlah Bot (AI)</Text>
        <View style={styles.row}>
          {Array.from({ length: playerCount }, (_, i) => i).map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, aiCount === n && styles.chipActive]}
              onPress={() => setAiCount(n)}
            >
              <Text style={[styles.chipText, aiCount === n && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart} accessibilityRole="button">
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
  startText: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
});
