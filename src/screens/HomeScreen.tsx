import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { BoardTheme, TOKENS } from '../core/types';

interface Props { onStart: () => void; }

const PLAYER_COUNTS = [0, 1, 2, 3, 4];
const THEMES: { key: BoardTheme; label: string; icon: string; desc: string }[] = [
  { key: 'indonesia', label: 'Indonesia', icon: '🇮🇩', desc: '40 kotak — kota-kota Indonesia' },
  { key: 'world-mini', label: 'World Mini', icon: '🌍', desc: '24 kotak — kota-kota dunia' },
];

interface HumanSetup {
  name: string;
  token: string;
}

export default function HomeScreen({ onStart }: Props) {
  const insets = useSafeAreaInsets();
  const { newGame } = useGameStore();
  const [humanCount, setHumanCount] = useState(1);
  const [aiCount, setAiCount] = useState(1);
  const [theme, setTheme] = useState<BoardTheme>('indonesia');
  const [humans, setHumans] = useState<HumanSetup[]>([{ name: 'Pemain 1', token: TOKENS[0] }]);

  const total = humanCount + aiCount;
  const canStart = total >= 2 && total <= 4;

  // Sync human setups when humanCount changes
  const updateHumanCount = (n: number) => {
    if (n + aiCount > 4) return;
    setHumanCount(n);
    const newHumans: HumanSetup[] = [];
    for (let i = 0; i < n; i++) {
      newHumans.push(humans[i] ?? { name: `Pemain ${i + 1}`, token: TOKENS[i % TOKENS.length] });
    }
    setHumans(newHumans);
  };

  const updateHumanName = (idx: number, name: string) => {
    const copy = [...humans];
    copy[idx] = { ...copy[idx], name };
    setHumans(copy);
  };

  const updateHumanToken = (idx: number, token: string) => {
    const copy = [...humans];
    copy[idx] = { ...copy[idx], token };
    setHumans(copy);
  };

  // Tokens already used by humans
  const usedTokens = humans.map((h) => h.token);

  const handleStart = () => {
    if (!canStart) return;
    const players = [];
    for (let i = 0; i < humanCount; i++) {
      players.push({ name: humans[i]?.name || `Pemain ${i + 1}`, token: humans[i]?.token || TOKENS[i], isAI: false });
    }
    // AI gets unused tokens
    let tokenIdx = 0;
    for (let i = 0; i < aiCount; i++) {
      while (usedTokens.includes(TOKENS[tokenIdx]) && tokenIdx < TOKENS.length) tokenIdx++;
      players.push({ name: `Bot ${i + 1}`, token: TOKENS[tokenIdx] || '🤖', isAI: true });
      tokenIdx++;
    }
    newGame(theme, players);
    onStart();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>  
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🎲</Text>
          <Text style={styles.title}>Monopoly</Text>
          <Text style={styles.subtitle}>Indonesia Edition</Text>
        </View>

        {/* Theme selection */}
        <Text style={styles.sectionLabel}>🗺️ Pilih Papan</Text>
        <View style={styles.themeRow}>
          {THEMES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.themeCard, theme === t.key && styles.themeCardActive]}
              onPress={() => setTheme(t.key)}
            >
              <Text style={styles.themeIcon}>{t.icon}</Text>
              <Text style={styles.themeLabel}>{t.label}</Text>
              <Text style={styles.themeDesc}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Human count */}
        <Text style={styles.sectionLabel}>👤 Pemain Manusia</Text>
        <View style={styles.chipRow}>
          {PLAYER_COUNTS.map((n) => {
            const disabled = n + aiCount > 4 || (n + aiCount < 2 && n !== humanCount);
            return (
              <TouchableOpacity
                key={n}
                style={[styles.chip, humanCount === n && styles.chipActive, disabled && styles.chipDisabled]}
                onPress={() => updateHumanCount(n)}
                disabled={disabled}
              >
                <Text style={[styles.chipText, humanCount === n && styles.chipTextActive]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Human name + token setup */}
        {humans.map((h, idx) => (
          <View key={idx} style={styles.humanCard}>
            <View style={styles.humanHeader}>
              <Text style={styles.humanLabel}>Pemain {idx + 1}</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              value={h.name}
              onChangeText={(text) => updateHumanName(idx, text)}
              placeholder="Nama pemain..."
              placeholderTextColor="#64748b"
              maxLength={12}
            />
            <Text style={styles.tokenLabel}>Pilih pion:</Text>
            <View style={styles.tokenGrid}>
              {TOKENS.map((t) => {
                const taken = usedTokens.includes(t) && t !== h.token;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tokenBtn, h.token === t && styles.tokenBtnActive, taken && styles.tokenBtnTaken]}
                    onPress={() => !taken && updateHumanToken(idx, t)}
                    disabled={taken}
                  >
                    <Text style={styles.tokenEmoji}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* AI count */}
        <Text style={styles.sectionLabel}>🤖 Bot AI</Text>
        <View style={styles.chipRow}>
          {PLAYER_COUNTS.map((n) => {
            const disabled = humanCount + n > 4 || (humanCount + n < 2 && n !== aiCount);
            return (
              <TouchableOpacity
                key={n}
                style={[styles.chip, aiCount === n && styles.chipActive, disabled && styles.chipDisabled]}
                onPress={() => { if (humanCount + n <= 4) setAiCount(n); }}
                disabled={disabled}
              >
                <Text style={[styles.chipText, aiCount === n && styles.chipTextActive]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalText}>Total: {total} pemain</Text>
          {!canStart && <Text style={styles.totalWarn}>⚠️ Minimal 2, maksimal 4</Text>}
          {canStart && <Text style={styles.totalOk}>✅ Siap bermain!</Text>}
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          accessibilityRole="button"
        >
          <Text style={styles.startText}>🎲 Mulai Permainan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 28 },
  heroIcon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 15, color: '#a78bfa', fontWeight: '600', marginTop: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeCard: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#1e1e3a', borderWidth: 2, borderColor: 'rgba(167,139,250,0.15)', alignItems: 'center' },
  themeCardActive: { borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.12)' },
  themeIcon: { fontSize: 28, marginBottom: 6 },
  themeLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  themeDesc: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#1e1e3a', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(167,139,250,0.15)' },
  chipActive: { borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.2)' },
  chipDisabled: { opacity: 0.25 },
  chipText: { fontSize: 20, fontWeight: '700', color: '#94a3b8' },
  chipTextActive: { color: '#a78bfa' },
  humanCard: { backgroundColor: '#1e1e3a', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  humanHeader: { marginBottom: 10 },
  humanLabel: { fontSize: 14, fontWeight: '700', color: '#e2e8f0' },
  nameInput: { backgroundColor: '#0f0f23', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)', marginBottom: 12 },
  tokenLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  tokenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tokenBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#0f0f23', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tokenBtnActive: { borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.2)' },
  tokenBtnTaken: { opacity: 0.2 },
  tokenEmoji: { fontSize: 20 },
  totalCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: 12, backgroundColor: '#1e1e3a', borderRadius: 12 },
  totalText: { fontSize: 14, color: '#e2e8f0', fontWeight: '600' },
  totalWarn: { fontSize: 12, color: '#fbbf24' },
  totalOk: { fontSize: 12, color: '#4ade80' },
  startBtn: { marginTop: 24, backgroundColor: '#a78bfa', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#a78bfa', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  startBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  startText: { fontSize: 18, fontWeight: '800', color: '#0f0f23' },
});
