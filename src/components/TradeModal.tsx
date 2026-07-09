import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';

export function TradeModal() {
  const { state, respondTrade } = useGameStore();
  if (!state || !state.tradeOffer) return null;

  const offer = state.tradeOffer;
  const fromPlayer = state.players[offer.from];
  const toPlayer = state.players[offer.to];

  const getSpaceName = (spaceId: number) => state.board[spaceId]?.name ?? `#${spaceId}`;

  return (
    <Modal transparent animationType="fade" visible={state.phase === 'trading'}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>🤝 Penawaran Tukar</Text>
          <Text style={styles.subtitle}>{fromPlayer.token} {fromPlayer.name} → {toPlayer.token} {toPlayer.name}</Text>

          <ScrollView style={styles.content}>
            {/* What the proposer offers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📤 {fromPlayer.token} menawarkan:</Text>
              {offer.offerProperties.map((id) => (
                <Text key={id} style={styles.item}>• {getSpaceName(id)}</Text>
              ))}
              {offer.offerMoney > 0 && (
                <Text style={styles.item}>• Rp {(offer.offerMoney / 1_000_000).toFixed(1)}jt</Text>
              )}
              {offer.offerProperties.length === 0 && offer.offerMoney === 0 && (
                <Text style={styles.itemMuted}>Tidak ada</Text>
              )}
            </View>

            {/* What the proposer wants */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📥 Sebagai gantinya meminta:</Text>
              {offer.requestProperties.map((id) => (
                <Text key={id} style={styles.item}>• {getSpaceName(id)}</Text>
              ))}
              {offer.requestMoney > 0 && (
                <Text style={styles.item}>• Rp {(offer.requestMoney / 1_000_000).toFixed(1)}jt</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => respondTrade(true)}>
              <Text style={styles.btnText}>✅ Terima</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => respondTrade(false)}>
              <Text style={styles.btnText}>❌ Tolak</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: '#1e1e3a', borderRadius: 20, padding: 20, width: '100%', maxHeight: '80%', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 4, marginBottom: 12 },
  content: { maxHeight: 250 },
  section: { marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#a78bfa', marginBottom: 8 },
  item: { fontSize: 14, color: '#e2e8f0', marginBottom: 4 },
  itemMuted: { fontSize: 13, color: '#64748b', fontStyle: 'italic' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#4ade80' },
  rejectBtn: { backgroundColor: '#ef4444' },
  btnText: { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
});
