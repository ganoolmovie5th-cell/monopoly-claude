import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';

interface Props { onBack: () => void; }

export default function GameScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { state, rollAndMove, buyProperty, skipBuy, endTurn } = useGameStore();

  if (!state) return null;

  const current = state.players[state.currentPlayerIndex];
  const space = state.board[current.position];

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Keluar</Text>
        </TouchableOpacity>
        <Text style={styles.turnLabel}>Giliran: {current.token} {current.name}</Text>
      </View>

      {/* Player statuses */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersRow}>
        {state.players.map((p) => (
          <View key={p.id} style={[styles.playerCard, p.bankrupt && styles.playerBankrupt, p.id === current.id && styles.playerActive]}>
            <Text style={styles.playerToken}>{p.token}</Text>
            <Text style={styles.playerName}>{p.name}</Text>
            <Text style={styles.playerMoney}>Rp {(p.money / 1_000_000).toFixed(1)}jt</Text>
            {p.inJail && <Text style={styles.jailBadge}>🔒</Text>}
          </View>
        ))}
      </ScrollView>

      {/* Board position info */}
      <View style={styles.positionCard}>
        <Text style={styles.positionLabel}>📍 Posisi saat ini</Text>
        <Text style={styles.positionName}>{space.name}</Text>
        <Text style={styles.positionType}>{space.type}</Text>
      </View>

      {/* Action log */}
      <View style={styles.logCard}>
        <Text style={styles.logText}>{state.lastAction || 'Game dimulai!'}</Text>
      </View>

      {/* Dice display */}
      {state.dice && (
        <View style={styles.diceRow}>
          <View style={styles.die}><Text style={styles.dieText}>{state.dice.die1}</Text></View>
          <View style={styles.die}><Text style={styles.dieText}>{state.dice.die2}</Text></View>
          {state.dice.isDoubles && <Text style={styles.doublesLabel}>DOUBLES!</Text>}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {state.phase === 'rolling' && (
          <TouchableOpacity style={styles.actionBtn} onPress={rollAndMove}>
            <Text style={styles.actionText}>🎲 Lempar Dadu</Text>
          </TouchableOpacity>
        )}
        {state.phase === 'buying' && (
          <View style={styles.buyRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.buyBtn]} onPress={buyProperty}>
              <Text style={styles.actionText}>💰 Beli (Rp {((space.price ?? 0) / 1_000_000).toFixed(1)}jt)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={skipBuy}>
              <Text style={styles.actionText}>⏭️ Lewati</Text>
            </TouchableOpacity>
          </View>
        )}
        {(state.phase === 'paying' || state.phase === 'card' || state.phase === 'landed') && (
          <TouchableOpacity style={styles.actionBtn} onPress={endTurn}>
            <Text style={styles.actionText}>✅ Selesai Giliran</Text>
          </TouchableOpacity>
        )}
        {state.phase === 'game-over' && (
          <View style={styles.gameOver}>
            <Text style={styles.winnerText}>🏆 {state.players[state.winner!]?.name} Menang!</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={onBack}>
              <Text style={styles.actionText}>🏠 Kembali ke Menu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#2a2a4a', borderRadius: 10 },
  backText: { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
  turnLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  playersRow: { maxHeight: 90, marginBottom: 12 },
  playerCard: { backgroundColor: '#2a2a4a', borderRadius: 12, padding: 10, marginRight: 10, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: 'transparent' },
  playerActive: { borderColor: '#a78bfa' },
  playerBankrupt: { opacity: 0.4 },
  playerToken: { fontSize: 24 },
  playerName: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  playerMoney: { fontSize: 13, fontWeight: '700', color: '#4ade80', marginTop: 2 },
  jailBadge: { position: 'absolute', top: 4, right: 4, fontSize: 12 },
  positionCard: { backgroundColor: '#2a2a4a', borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center' },
  positionLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  positionName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  positionType: { fontSize: 12, color: '#a78bfa', marginTop: 4, textTransform: 'uppercase' },
  logCard: { backgroundColor: 'rgba(167,139,250,0.1)', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  logText: { fontSize: 14, color: '#e2e8f0', textAlign: 'center' },
  diceRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 },
  die: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dieText: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  doublesLabel: { color: '#fbbf24', fontWeight: '800', fontSize: 14 },
  actions: { marginTop: 'auto', paddingBottom: 16 },
  actionBtn: { backgroundColor: '#a78bfa', paddingVertical: 16, borderRadius: 14, alignItems: 'center', width: '100%' },
  actionText: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  buyRow: { flexDirection: 'row', gap: 10 },
  buyBtn: { flex: 1, backgroundColor: '#4ade80' },
  skipBtn: { flex: 1, backgroundColor: '#64748b' },
  gameOver: { alignItems: 'center', gap: 16 },
  winnerText: { fontSize: 24, fontWeight: '800', color: '#fbbf24' },
});
