# 🎲 Monopoly Indonesia

Game Monopoly klasik untuk mobile dengan tema kota-kota Indonesia. Dibangun dengan React Native + Expo SDK 54 — jalan di Expo Go.

## Fitur

- **Board Indonesia (40 kotak)** — properti kota-kota Indonesia dari Jayapura sampai Jakarta
- **Board World Mini (24 kotak)** — kota-kota dunia (Cairo, London, Tokyo, New York)
- **2-4 pemain** — hot-seat (giliran di satu HP)
- **AI lawan** — bot dengan strategi beli/bangun/mortgage otomatis
- **Visual Board + Animasi** — papan visual dengan warna properti, indikator pemilik, animasi dadu & token movement (Reanimated spring)
- **Trade AI Negotiation** — AI mengajukan tukar properti untuk melengkapi color group, modal terima/tolak
- **Property Card Gallery** — galeri semua properti grouped by color, filter Semua/Milik Saya/Tersedia, detail rent table
- **House Rules Toggle** — Free Parking pot, Double on GO, Tanpa Lelang, Custom starting money (15-50jt)
- **Full Monopoly rules:**
  - Beli properti, bayar sewa, rumah & hotel
  - Kartu Dana Umum & Kesempatan (24 kartu)
  - Penjara (doubles 3×, kartu, bayar denda)
  - Mortgage & unmortgage
  - Bankruptcy & winner detection
  - Sewa naik saat punya full color group
  - Even building rule (rumah merata per group)
- **Dadu dengan doubles** — lempar lagi saat doubles
- **Save/load otomatis** — game state tersimpan di AsyncStorage
- **Mata uang Rupiah** — configurable starting money

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript strict |
| State | Zustand 5 + persist (AsyncStorage) |
| Gesture | react-native-gesture-handler |
| Animation | react-native-reanimated 4 |
| Haptics | expo-haptics |

## Menjalankan

```bash
npm install
npx expo start --go    # Scan QR dengan Expo Go
```

## Verifikasi

```bash
npm run typecheck      # tsc --noEmit (0 error)
npx expo export --platform android   # Bundle sukses
```

## Struktur

```
src/
├── core/              # Pure logic (no React)
│   ├── types.ts       # All types: Player, Property, BoardSpace, GameState
│   ├── board.ts       # INDONESIA_BOARD (40) & WORLD_MINI_BOARD (24)
│   ├── cards.ts       # Community Chest & Chance cards (24 kartu)
│   ├── dice.ts        # rollDice (doubles detection)
│   ├── rules.ts       # calculateRent, canBuildHouse, mortgage, passedGo
│   └── ai.ts          # AI decision: buy, auction, build, jail, mortgage
├── store/
│   └── gameStore.ts   # Zustand: full game state + all actions + persist
└── screens/
    ├── HomeScreen.tsx  # Pilih board, jumlah pemain, jumlah AI
    └── GameScreen.tsx  # Main gameplay (dice, actions, player status)
```

## Board Indonesia (40 kotak)

| Group | Properti |
|---|---|
| 🟤 Brown | Jayapura, Ambon |
| 🔵 Light Blue | Medan, Padang, Palembang |
| 🩷 Pink | Semarang, Yogyakarta, Solo |
| 🟠 Orange | Makassar, Manado, Denpasar |
| 🔴 Red | Bandung, Bogor, Tangerang |
| 🟡 Yellow | Surabaya, Malang, Bekasi |
| 🟢 Green | Depok, Jakarta Selatan, Jakarta Barat |
| 🔵 Dark Blue | Jakarta Pusat, Jakarta Utara |
| 🚂 Railroad | Gambir, Pasar Senen, Manggarai, Sudirman |
| ⚡ Utility | PLN, PDAM |

## Roadmap

- [x] Visual board dengan animasi (BoardView + PlayerToken + DiceAnimation)
- [x] Trade AI Negotiation (AI propose + human accept/reject modal)
- [x] Property Card Gallery (galeri semua properti grouped by color)
- [x] House Rules Toggle (Free Parking, Double GO, No Auction, Custom money)
- [ ] Auction system (saat pemain skip beli)
- [ ] Statistics & leaderboard
- [ ] Sound effects & haptic feedback
- [ ] Online multiplayer

## License

Private — © 2026
