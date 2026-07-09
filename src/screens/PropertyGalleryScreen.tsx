import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { BoardSpace, ColorGroup, Property } from '../core/types';
import { getBoard } from '../core/board';

interface Props { onBack: () => void; }

type Filter = 'semua' | 'milik-saya' | 'tersedia';

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

const GROUP_ORDER: ColorGroup[] = ['brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkblue', 'railroad', 'utility'];

const GROUP_LABELS: Record<ColorGroup, string> = {
  brown: 'Coklat',
  lightblue: 'Biru Muda',
  pink: 'Merah Muda',
  orange: 'Oranye',
  red: 'Merah',
  yellow: 'Kuning',
  green: 'Hijau',
  darkblue: 'Biru Tua',
  railroad: 'Stasiun',
  utility: 'Utilitas',
};

export default function PropertyGalleryScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { state } = useGameStore();
  const [filter, setFilter] = useState<Filter>('semua');

  // Use current game board or default Indonesia
  const board = state?.board ?? getBoard('indonesia');
  const properties = state?.properties ?? [];
  const players = state?.players ?? [];
  const currentPlayerId = state ? state.currentPlayerIndex : -1;

  const propertySpaces = board.filter((s) => s.type === 'property' || s.type === 'railroad' || s.type === 'utility');

  const filteredSpaces = propertySpaces.filter((space) => {
    const prop = properties.find((p) => p.spaceId === space.id);
    if (filter === 'milik-saya') return prop?.ownerId === currentPlayerId;
    if (filter === 'tersedia') return prop?.ownerId === null;
    return true;
  });

  const grouped = GROUP_ORDER.map((color) => ({
    color,
    spaces: filteredSpaces.filter((s) => s.color === color),
  })).filter((g) => g.spaces.length > 0);

  const renderCard = (space: BoardSpace) => {
    const prop = properties.find((p) => p.spaceId === space.id);
    const owner = prop?.ownerId !== null && prop?.ownerId !== undefined ? players[prop.ownerId] : null;
    const color = space.color ? COLOR_MAP[space.color] : '#666';

    return (
      <View key={space.id} style={[styles.card, { borderTopColor: color, borderTopWidth: 4 }]}>
        <Text style={styles.cardName} numberOfLines={1}>{space.name}</Text>
        {space.price && <Text style={styles.cardPrice}>Rp {(space.price / 1_000_000).toFixed(1)}jt</Text>}

        {/* Rent table */}
        {space.rent && (
          <View style={styles.rentTable}>
            {space.type === 'property' && (
              <>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>Sewa</Text><Text style={styles.rentVal}>Rp{(space.rent[0] / 1000).toFixed(0)}k</Text></View>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>🏠×1</Text><Text style={styles.rentVal}>Rp{(space.rent[1] / 1000).toFixed(0)}k</Text></View>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>🏠×2</Text><Text style={styles.rentVal}>Rp{((space.rent[2] ?? 0) / 1000).toFixed(0)}k</Text></View>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>🏠×3</Text><Text style={styles.rentVal}>Rp{((space.rent[3] ?? 0) / 1000).toFixed(0)}k</Text></View>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>🏠×4</Text><Text style={styles.rentVal}>Rp{((space.rent[4] ?? 0) / 1_000_000).toFixed(1)}jt</Text></View>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>🏨</Text><Text style={styles.rentVal}>Rp{((space.rent[5] ?? 0) / 1_000_000).toFixed(1)}jt</Text></View>
              </>
            )}
            {space.type === 'railroad' && (
              <>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>×1</Text><Text style={styles.rentVal}>Rp250k</Text></View>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>×2</Text><Text style={styles.rentVal}>Rp500k</Text></View>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>×3</Text><Text style={styles.rentVal}>Rp1jt</Text></View>
                <View style={styles.rentRow}><Text style={styles.rentLabel}>×4</Text><Text style={styles.rentVal}>Rp2jt</Text></View>
              </>
            )}
          </View>
        )}

        {space.housePrice && (
          <Text style={styles.housePrice}>🏠 Rp{(space.housePrice / 1_000_000).toFixed(1)}jt/rumah</Text>
        )}

        {/* Owner & status */}
        <View style={styles.cardFooter}>
          {owner ? (
            <Text style={styles.ownerText}>{owner.token} {owner.name}</Text>
          ) : (
            <Text style={styles.availText}>Tersedia</Text>
          )}
          {prop && prop.houses > 0 && (
            <Text style={styles.houseDots}>{prop.houses < 5 ? '🏠'.repeat(prop.houses) : '🏨'}</Text>
          )}
          {prop?.mortgaged && <Text style={styles.mortgageBadge}>📋 Mortgage</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📋 Galeri Properti</Text>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {([['semua', 'Semua'], ['milik-saya', 'Milik Saya'], ['tersedia', 'Tersedia']] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterBtn, filter === key && styles.filterActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {grouped.map((group) => (
          <View key={group.color}>
            <View style={styles.groupHeader}>
              <View style={[styles.colorDot, { backgroundColor: COLOR_MAP[group.color] }]} />
              <Text style={styles.groupLabel}>{GROUP_LABELS[group.color]}</Text>
              <Text style={styles.groupCount}>({group.spaces.length})</Text>
            </View>
            <View style={styles.cardGrid}>
              {group.spaces.map(renderCard)}
            </View>
          </View>
        ))}
        {grouped.length === 0 && (
          <Text style={styles.emptyText}>Tidak ada properti ditemukan</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#2a2a4a', borderRadius: 8 },
  backText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1e1e3a', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  filterActive: { backgroundColor: 'rgba(167,139,250,0.2)', borderColor: '#a78bfa' },
  filterText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  filterTextActive: { color: '#a78bfa' },
  scroll: { padding: 16, paddingBottom: 40 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 16, gap: 8 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  groupLabel: { fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  groupCount: { fontSize: 12, color: '#64748b' },
  cardGrid: { gap: 10 },
  card: { backgroundColor: '#1e1e3a', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardPrice: { fontSize: 13, color: '#a78bfa', fontWeight: '600', marginBottom: 8 },
  rentTable: { marginBottom: 8 },
  rentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  rentLabel: { fontSize: 11, color: '#94a3b8' },
  rentVal: { fontSize: 11, color: '#e2e8f0', fontWeight: '600' },
  housePrice: { fontSize: 11, color: '#4ade80', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 4 },
  ownerText: { fontSize: 12, color: '#fbbf24', fontWeight: '600' },
  availText: { fontSize: 12, color: '#4ade80', fontWeight: '600' },
  houseDots: { fontSize: 10 },
  mortgageBadge: { fontSize: 10, color: '#ef4444' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 40 },
});
