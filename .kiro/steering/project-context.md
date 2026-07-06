# Monopoly Indonesia — Project Context & Conventions

## Overview

Game Monopoly klasik untuk mobile dengan tema Indonesia. Hot-seat multiplayer (2-4 pemain di satu device) + AI lawan. Full Monopoly rules.

- **Repo:** ganoolmovie5th-cell/monopoly-claude
- **Branch:** `main` (push langsung)
- **Stack:** React Native 0.81 + Expo SDK 54 (managed, Expo Go compatible) + TypeScript strict

---

## Aturan Penting

- **Harus jalan di Expo Go SDK 54** — jangan native module yang butuh prebuild
- Tambah paket selalu via `npx expo install <paket>`, bukan `npm install` versi bebas
- **Logika game di `src/core/` harus murni** (no React import) agar mudah di-test
- Push langsung ke `main`, tanpa PR
- Setiap commit update README.md + steering file ini

---

## Struktur File

```
src/
├── core/              # Logika murni, no React
│   ├── types.ts       # Player, Property, BoardSpace, GameState, constants
│   ├── board.ts       # INDONESIA_BOARD (40), WORLD_MINI_BOARD (24)
│   ├── cards.ts       # COMMUNITY_CARDS (12), CHANCE_CARDS (12), shuffleDeck
│   ├── dice.ts        # rollDice → DiceResult
│   ├── rules.ts       # calculateRent, canBuildHouse, mortgage, passedGo, ownsFullGroup
│   └── ai.ts          # aiBuyDecision, aiAuctionBid, aiBuildDecision, aiJailDecision
├── store/
│   └── gameStore.ts   # Zustand + persist; actions: newGame, rollAndMove, buyProperty, skipBuy, endTurn, buildHouse, mortgageProperty
└── screens/
    ├── HomeScreen.tsx  # Setup game (theme, players, AI count)
    └── GameScreen.tsx  # Main gameplay
```

---

## Game Rules Implemented

- **Board:** 40 kotak (Indonesia) atau 24 kotak (World Mini)
- **Starting money:** Rp 20.000.000
- **GO salary:** Rp 2.000.000 saat lewat/mendarat di START
- **Properti:** Beli saat mendarat di properti kosong
- **Sewa:** Base rent × houses; double jika punya full color group tanpa rumah
- **Railroad:** 250k/500k/1jt/2jt berdasarkan jumlah yang dimiliki
- **Utility:** 4× dadu (1 utility) atau 10× dadu (2 utility)
- **Rumah/Hotel:** Max 4 rumah → 1 hotel; even building rule
- **Jail:** Masuk via "Masuk Penjara", doubles 3×, atau kartu; keluar bayar 500k, kartu, atau doubles (max 3 attempt)
- **Kartu:** 12 Dana Umum + 12 Kesempatan; shuffled deck, recycle saat habis
- **Bankruptcy:** Money < 0 → bangkrut, properti kembali ke bank
- **Winner:** Pemain terakhir yang tidak bangkrut

---

## AI Strategy

- **Buy:** Beli jika sisa uang setelah beli > Rp 2jt
- **Build:** Prioritas group dengan sewa tertinggi
- **Auction:** Bid sampai 70% harga properti
- **Jail:** Pakai kartu > bayar (jika kaya) > roll
- **Mortgage:** Properti dengan sewa terendah dulu

---

## Persistence

- Game state di-persist penuh via Zustand + AsyncStorage (key: `monopoly-game-store`)
- Tutup app → buka lagi → game lanjut dari state terakhir

---

## Verifikasi (WAJIB sebelum selesai)

```bash
npm run typecheck      # tsc --noEmit (0 error)
npx expo export --platform android   # bundle sukses ("Exported: dist")
```

---

## Commit Convention

```
<type>: <deskripsi singkat>
```
Type: `feat` `fix` `refactor` `test` `chore` `docs`

---

## Roadmap

- [ ] Visual board layout (circular/grid)
- [ ] Animated dice roll (Reanimated)
- [ ] Animated pion movement
- [ ] Auction modal
- [ ] Trade modal (player-to-player)
- [ ] Statistics & history
- [ ] Sound effects + haptic feedback
- [ ] Dark/light theme
- [ ] Online multiplayer (Supabase)
