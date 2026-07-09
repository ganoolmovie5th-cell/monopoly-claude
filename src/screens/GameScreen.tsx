import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { BoardView } from '../components/BoardView';
import { DiceAnimation } from '../components/DiceAnimation';
import { PlayerToken } from '../components/PlayerToken';
import { TradeModal } from '../components/TradeModal';

interface Props { onBack: () => void; onGallery: () => void; }

export default function GameScreen({ onBack, onGallery }: Props) {
  const insets = useSafeAreaInsets();
  const { state, rollAndMove, buyProperty, skipBuy, endTurn } = useGameStore();
  const [rolling, setRolling] = useState(false);

  if (!state) return null;

  const current = state.players[state.currentPlayerIndex];
  const space = state.board[current.position];

  const handleRoll = () => {
    setRolling(true);
    setTimeout(() => {
      rollAndMove();
      setRolling(false);
    }, 600);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Keluar</Text>
          </TouchableOpacity>
          <Text style={styles.turnLabel}>{current.token} {current.name}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={onGallery} style={styles.galleryMiniBtn}>
              <Text style={styles.galleryMiniText}>📋</Text>
            </TouchableOpacity>
            <View style={styles.moneyBadge}>
              <Text style={styles.moneyText}>Rp {(current.money / 1_000_000).toFixed(1)}jt</Text>
            </View>
          </View>
        </View>

        {/* Visual Board with animated tokens */}
        <View style={styles.boardContainer}>
          <BoardView board={state.board} players={state.players} properties={state.properties} />
          {state.players.map((p) => (
            <PlayerToken key={p.id} player={p} boardSize={state.board.length} />
          ))}
        </View>

        {/* Dice */}
        <DiceAnimation dice={state.dice} rolling={rolling} />

        {/* Player statuses */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersRow}>
          {state.players.map((p) => (
            <View key={p.id} style={[styles.playerCard, p.bankrupt && styles.playerBankrupt, p.id === current.id && styles.playerActive]}>
              <Text style={styles.playerToken}>{p.token}</Text>
              <Text style={styles.playerName}>{p.name}{p.isAI ? ' 🤖' : ''}</Text>
              <Text style={styles.playerMoney}>Rp {(p.money / 1_000_000).toFixed(1)}jt</Text>
              {p.inJail && <Text style={styles.jailBadge}>🔒</Text>}
            </View>
          ))}
        </ScrollView>

        {/* Action log */}
        <View style={styles.logCard}>
          <Text style={styles.logText}>{state.lastAction}</Text>
        </View>

        {/* Position info */}
        <View style={styles.positionRow}>
          <Text style={styles.positionLabel}>📍</Text>
          <Text style={styles.positionName}>{space.name}</Text>
          {space.price && <Text style={styles.positionPrice}>Rp {(space.price / 1_000_000).toFixed(1)}jt</Text>}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {state.phase === 'rolling' && !current.isAI && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleRoll} disabled={rolling}>
              <Text style={styles.actionText}>🎲 Lempar Dadu</Text>
            </TouchableOpacity>
          )}
          {state.phase === 'buying' && !current.isAI && (
            <View style={styles.buyRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.buyBtn]} onPress={buyProperty}>
                <Text style={styles.actionText}>💰 Beli</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={skipBuy}>
                <Text style={styles.actionText}>⏭️ Lewati</Text>
              </TouchableOpacity>
            </View>
          )}
          {(state.phase === 'paying' || state.phase === 'card' || state.phase === 'landed') && !current.isAI && (
            <TouchableOpacity style={styles.actionBtn} onPress={endTurn}>
              <Text style={styles.actionText}>✅ Selesai</Text>
            </TouchableOpacity>
          )}
          {state.phase === 'game-over' && (
            <View style={styles.gameOver}>
              <Text style={styles.winnerText}>🏆 {state.players[state.winner!]?.name} Menang!</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={onBack}>
                <Text style={styles.actionText}>🏠 Menu Utama</Text>
              </TouchableOpacity>
            </View>
          )}
          {current.isAI && state.phase !== 'game-over' && (
            <View style={styles.aiWait}>
              <Text style={styles.aiText}>🤖 {current.name} sedang berpikir...</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <TradeModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 8, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 8 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#2a2a4a', borderRadius: 8 },
  backText: { color: '#94a3b8', fontWeight: '600', fontSize: 12 },
  turnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  galleryMiniBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#2a2a4a', justifyContent: 'center', alignItems: 'center' },
  galleryMiniText: { fontSize: 16 },
  moneyBadge: { backgroundColor: 'rgba(74,222,128,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  moneyText: { color: '#4ade80', fontWeight: '700', fontSize: 12 },
  boardContainer: { position: 'relative', alignSelf: 'center', marginVertical: 8 },
  playersRow: { maxHeight: 72, marginVertical: 8 },
  playerCard: { backgroundColor: '#2a2a4a', borderRadius: 10, padding: 8, marginRight: 8, alignItems: 'center', minWidth: 70, borderWidth: 1, borderColor: 'transparent' },
  playerActive: { borderColor: '#a78bfa' },
  playerBankrupt: { opacity: 0.3 },
  playerToken: { fontSize: 20 },
  playerName: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  playerMoney: { fontSize: 11, fontWeight: '700', color: '#4ade80', marginTop: 2 },
  jailBadge: { position: 'absolute', top: 2, right: 2, fontSize: 10 },
  logCard: { backgroundColor: 'rgba(167,139,250,0.1)', borderRadius: 10, padding: 10, marginVertical: 6, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  logText: { fontSize: 13, color: '#e2e8f0', textAlign: 'center' },
  positionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 4 },
  positionLabel: { fontSize: 14 },
  positionName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  positionPrice: { fontSize: 12, color: '#a78bfa', fontWeight: '600' },
  actions: { marginTop: 8 },
  actionBtn: { backgroundColor: '#a78bfa', paddingVertical: 14, borderRadius: 12, alignItems: 'center', width: '100%' },
  actionText: { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  buyRow: { flexDirection: 'row', gap: 10 },
  buyBtn: { flex: 1, backgroundColor: '#4ade80' },
  skipBtn: { flex: 1, backgroundColor: '#64748b' },
  gameOver: { alignItems: 'center', gap: 12 },
  winnerText: { fontSize: 22, fontWeight: '800', color: '#fbbf24' },
  aiWait: { alignItems: 'center', paddingVertical: 14 },
  aiText: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },
});
