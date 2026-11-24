# Monopoly Indonesia

Game Monopoly klasik untuk mobile dengan tema kota-kota Indonesia. Board 40 kotak dari Jayapura sampai Jakarta. Dibangun dengan React Native + Expo SDK 58.

**Tech Stack:** React Native · Expo SDK 58 · TypeScript · Zustand · Reanimated · Gesture Handler

## Features

- Board Indonesia (40 kotak) dengan properti kota-kota Indonesia
- Board World Mini (24 kotak) dengan kota-kota dunia
- 2-4 pemain (hot-seat di satu HP)
- AI lawan (strategi beli/bangun/mortgage otomatis)
- Visual board + animasi dadu & token movement (Reanimated spring)
- Trade AI Negotiation (AI propose tukar properti)
- Property Card Gallery (grouped by color, filter, rent table)
- House Rules Toggle (Free Parking, Double GO, No Auction, custom starting money)
- Full Monopoly rules (beli, sewa, rumah/hotel, Dana Umum, Kesempatan, penjara, mortgage, bankruptcy)
- Dadu dengan doubles (lempar lagi saat doubles, penjara 3x doubles)
- Save/load otomatis (AsyncStorage)
- Mata uang Rupiah (configurable starting money 15-50jt)

## Getting Started

```bash
npm install
npx expo start --go
```

Scan QR code dengan Expo Go.

## Project Structure

```
src/
  core/             → Pure logic (no React)
    types.ts            Player, Property, BoardSpace, GameState
    board.ts            INDONESIA_BOARD (40) & WORLD_MINI_BOARD (24)
    cards.ts            Community Chest & Chance (24 kartu)
    dice.ts             rollDice (doubles detection)
    rules.ts            calculateRent, canBuildHouse, mortgage, passedGo
    ai.ts               AI decision: buy, auction, build, jail, mortgage
  store/            → gameStore.ts (Zustand + persist)
  screens/
    HomeScreen.tsx      Pilih board, jumlah pemain, jumlah AI
    GameScreen.tsx      Main gameplay
```

## Testing

```bash
npm run typecheck
npx expo export --platform android
```

## License

MIT
