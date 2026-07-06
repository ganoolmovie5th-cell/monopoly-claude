// Community Chest & Chance cards
import { GameCard } from './types';

export const COMMUNITY_CARDS: GameCard[] = [
  { id: 1, type: 'community', text: 'Anda menerima warisan sebesar Rp 1.000.000', action: { type: 'collect', amount: 1_000_000 } },
  { id: 2, type: 'community', text: 'Bayar biaya rumah sakit Rp 500.000', action: { type: 'pay', amount: 500_000 } },
  { id: 3, type: 'community', text: 'Maju ke START, terima Rp 2.000.000', action: { type: 'move', to: 0 } },
  { id: 4, type: 'community', text: 'Dapat bonus THR Rp 2.000.000', action: { type: 'collect', amount: 2_000_000 } },
  { id: 5, type: 'community', text: 'Bayar premi asuransi Rp 500.000', action: { type: 'pay', amount: 500_000 } },
  { id: 6, type: 'community', text: 'Menang lomba 17-an! Terima Rp 1.000.000', action: { type: 'collect', amount: 1_000_000 } },
  { id: 7, type: 'community', text: 'Bayar pajak kendaraan Rp 1.000.000', action: { type: 'pay', amount: 1_000_000 } },
  { id: 8, type: 'community', text: 'Dapat cashback e-wallet Rp 500.000', action: { type: 'collect', amount: 500_000 } },
  { id: 9, type: 'community', text: 'Masuk penjara! Langsung ke penjara.', action: { type: 'jail' } },
  { id: 10, type: 'community', text: 'Kartu bebas penjara — simpan untuk digunakan nanti', action: { type: 'get-out-of-jail' } },
  { id: 11, type: 'community', text: 'Bayar biaya renovasi: Rp 400.000 per rumah, Rp 1.150.000 per hotel', action: { type: 'repair', perHouse: 400_000, perHotel: 1_150_000 } },
  { id: 12, type: 'community', text: 'Ulang tahunmu! Terima Rp 100.000 dari setiap pemain', action: { type: 'collect-from-each', amount: 100_000 } },
];

export const CHANCE_CARDS: GameCard[] = [
  { id: 13, type: 'chance', text: 'Maju ke START', action: { type: 'move', to: 0 } },
  { id: 14, type: 'chance', text: 'Maju ke Jakarta Pusat', action: { type: 'move', to: 37 } },
  { id: 15, type: 'chance', text: 'Maju ke Semarang', action: { type: 'move', to: 11 } },
  { id: 16, type: 'chance', text: 'Mundur 3 langkah', action: { type: 'move-back', spaces: 3 } },
  { id: 17, type: 'chance', text: 'Masuk penjara! Langsung ke penjara.', action: { type: 'jail' } },
  { id: 18, type: 'chance', text: 'Kartu bebas penjara — simpan untuk digunakan nanti', action: { type: 'get-out-of-jail' } },
  { id: 19, type: 'chance', text: 'Bayar denda tilang Rp 150.000', action: { type: 'pay', amount: 150_000 } },
  { id: 20, type: 'chance', text: 'Bank membayar dividen Rp 500.000', action: { type: 'collect', amount: 500_000 } },
  { id: 21, type: 'chance', text: 'Maju ke Denpasar', action: { type: 'move', to: 19 } },
  { id: 22, type: 'chance', text: 'Bayar ke setiap pemain Rp 500.000', action: { type: 'pay-each-player', amount: 500_000 } },
  { id: 23, type: 'chance', text: 'Menang undian! Terima Rp 1.500.000', action: { type: 'collect', amount: 1_500_000 } },
  { id: 24, type: 'chance', text: 'Bayar biaya perbaikan jalan: Rp 250.000 per rumah, Rp 1.000.000 per hotel', action: { type: 'repair', perHouse: 250_000, perHotel: 1_000_000 } },
];

export function shuffleDeck(cards: GameCard[]): number[] {
  const ids = cards.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export function getCard(id: number): GameCard | undefined {
  return [...COMMUNITY_CARDS, ...CHANCE_CARDS].find((c) => c.id === id);
}
