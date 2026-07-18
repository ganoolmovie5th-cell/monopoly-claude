import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameState, Player, Property, BoardTheme, BoardSpace,
  GO_SALARY, JAIL_FINE, GamePhase, HouseRules, TradeOffer,
} from '../core/types';
import { getBoard } from '../core/board';
import { rollDice } from '../core/dice';
import { shuffleDeck, getCard, COMMUNITY_CARDS, CHANCE_CARDS } from '../core/cards';
import { calculateRent, canBuildHouse, mortgageValue, passedGo, ownsFullGroup } from '../core/rules';
import { aiBuyDecision, aiJailDecision, aiBuildDecision, aiProposeTrade, aiTradeDecision } from '../core/ai';

interface PlayerInit { name: string; token: string; isAI: boolean; }

interface GameStore {
  state: GameState | null;
  undoStack: GameState[];
  houseRules: HouseRules;
  setHouseRules: (rules: Partial<HouseRules>) => void;
  newGame: (theme: BoardTheme, players: PlayerInit[]) => void;
  rollAndMove: () => void;
  buyProperty: () => void;
  skipBuy: () => void;
  endTurn: () => void;
  buildHouse: (spaceId: number) => void;
  mortgageProperty: (spaceId: number) => void;
  proposeTrade: (offer: TradeOffer) => void;
  respondTrade: (accept: boolean) => void;
  undo: () => void;
}

function initProperties(board: BoardSpace[]): Property[] {
  return board
    .filter((s) => s.type === 'property' || s.type === 'railroad' || s.type === 'utility')
    .map((s) => ({ spaceId: s.id, ownerId: null, houses: 0, mortgaged: false }));
}

function nextActivePlayer(state: GameState): number {
  let idx = (state.currentPlayerIndex + 1) % state.players.length;
  let safety = 0;
  while (state.players[idx].bankrupt && safety < state.players.length) {
    idx = (idx + 1) % state.players.length;
    safety++;
  }
  return idx;
}

function checkWinner(state: GameState): number | null {
  const active = state.players.filter((p) => !p.bankrupt);
  return active.length === 1 ? active[0].id : null;
}

function handleLanding(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const space = state.board[player.position];
  const prop = state.properties.find((p) => p.spaceId === space.id);

  // Go to jail
  if (space.type === 'go-to-jail') {
    player.position = state.board.findIndex((s) => s.type === 'jail');
    player.inJail = true;
    player.jailTurns = 0;
    return { ...state, phase: 'paying', lastAction: `${player.token} masuk penjara!` };
  }

  // Tax
  if (space.type === 'tax') {
    const tax = space.taxAmount ?? 0;
    player.money -= tax;
    let freeParkingPot = state.freeParkingPot;
    if (state.houseRules.freeParking) {
      freeParkingPot += tax;
    }
    return { ...state, freeParkingPot, phase: 'paying', lastAction: `${player.token} bayar ${space.name}: Rp ${(tax / 1_000_000).toFixed(1)}jt` };
  }

  // Free parking — collect pot if house rule active
  if (space.type === 'free-parking' && state.houseRules.freeParking && state.freeParkingPot > 0) {
    const pot = state.freeParkingPot;
    player.money += pot;
    return { ...state, freeParkingPot: 0, phase: 'paying', lastAction: `${player.token} dapat Rp ${(pot / 1_000_000).toFixed(1)}jt dari Parkir Gratis! 🎉` };
  }

  // Community / Chance
  if (space.type === 'community' || space.type === 'chance') {
    const deck = space.type === 'community' ? state.communityDeck : state.chanceDeck;
    if (deck.length === 0) {
      const refill = shuffleDeck(space.type === 'community' ? COMMUNITY_CARDS : CHANCE_CARDS);
      deck.push(...refill);
    }
    const cardId = deck.shift()!;
    const card = getCard(cardId);
    if (!card) return { ...state, phase: 'paying', lastAction: 'Kartu kosong' };

    let msg = card.text;
    const action = card.action;
    switch (action.type) {
      case 'collect': player.money += action.amount; break;
      case 'pay': player.money -= action.amount; break;
      case 'move':
        if (action.to < player.position) player.money += GO_SALARY; // passed GO
        player.position = action.to;
        break;
      case 'move-back':
        player.position = (player.position - action.spaces + state.board.length) % state.board.length;
        break;
      case 'jail':
        player.position = state.board.findIndex((s) => s.type === 'jail');
        player.inJail = true;
        player.jailTurns = 0;
        break;
      case 'get-out-of-jail': player.hasGetOutOfJailCard += 1; break;
      case 'collect-from-each':
        state.players.forEach((p) => { if (p.id !== player.id && !p.bankrupt) { p.money -= action.amount; player.money += action.amount; } });
        break;
      case 'pay-each-player':
        state.players.forEach((p) => { if (p.id !== player.id && !p.bankrupt) { p.money += action.amount; player.money -= action.amount; } });
        break;
      case 'repair': {
        const myProps = state.properties.filter((p) => p.ownerId === player.id);
        const houses = myProps.reduce((sum, p) => sum + (p.houses < 5 ? p.houses : 0), 0);
        const hotels = myProps.reduce((sum, p) => sum + (p.houses === 5 ? 1 : 0), 0);
        const cost = houses * action.perHouse + hotels * action.perHotel;
        player.money -= cost;
        msg += ` (Rp ${(cost / 1_000_000).toFixed(1)}jt)`;
        break;
      }
    }
    return { ...state, phase: 'paying', lastAction: `${player.token} ${msg}` };
  }

  // Property/Railroad/Utility
  if (prop) {
    if (prop.ownerId === null) {
      // Unowned — offer to buy
      return { ...state, phase: 'buying', lastAction: `${player.token} mendarat di ${space.name} (belum dimiliki)` };
    } else if (prop.ownerId !== player.id && !prop.mortgaged) {
      // Pay rent
      const rent = calculateRent(space, prop, state.properties, state.board, state.dice?.total ?? 7);
      player.money -= rent;
      state.players[prop.ownerId].money += rent;
      return { ...state, phase: 'paying', lastAction: `${player.token} bayar sewa Rp ${(rent / 1_000_000).toFixed(1)}jt ke ${state.players[prop.ownerId].token}` };
    }
  }

  // Free parking, jail visit, own property, GO — nothing happens
  return { ...state, phase: 'paying', lastAction: `${player.token} mendarat di ${space.name}` };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: null,
      undoStack: [],
      houseRules: { freeParking: false, doubleOnGo: false, noAuction: false, startingMoney: 20_000_000 },

      setHouseRules: (rules) => {
        set((s) => ({ houseRules: { ...s.houseRules, ...rules } }));
      },

      newGame: (theme, players) => {
        const { houseRules } = get();
        const board = getBoard(theme);
        const startMoney = houseRules.startingMoney;
        const gamePlayers: Player[] = players.map((p, i) => ({
          id: i, name: p.name, token: p.token, money: startMoney,
          position: 0, inJail: false, jailTurns: 0, hasGetOutOfJailCard: 0,
          bankrupt: false, isAI: p.isAI,
        }));
        set({
          state: {
            players: gamePlayers,
            properties: initProperties(board),
            board, boardTheme: theme,
            currentPlayerIndex: 0,
            phase: 'rolling',
            dice: null, doublesCount: 0,
            communityDeck: shuffleDeck(COMMUNITY_CARDS),
            chanceDeck: shuffleDeck(CHANCE_CARDS),
            auction: null, tradeOffer: null,
            houseRules,
            freeParkingPot: 0,
            turnCount: 0,
            winner: null, lastAction: 'Permainan dimulai! 🎲',
          },
        });
      },

      rollAndMove: () => {
        const { state, undoStack } = get();
        if (!state || state.phase !== 'rolling') return;

        // Capture state before roll for undo
        set({ undoStack: [...undoStack, state] });

        const dice = rollDice();
        const player = { ...state.players[state.currentPlayerIndex] };
        const players = [...state.players];
        players[state.currentPlayerIndex] = player;

        let doublesCount = state.doublesCount;

        // Jail handling
        if (player.inJail) {
          const decision = player.isAI ? aiJailDecision(player) : 'roll'; // Human default: roll
          if (decision === 'pay' || (decision === 'card' && player.hasGetOutOfJailCard > 0)) {
            if (decision === 'pay') player.money -= JAIL_FINE;
            else player.hasGetOutOfJailCard -= 1;
            player.inJail = false;
            player.jailTurns = 0;
          } else if (dice.isDoubles) {
            player.inJail = false;
            player.jailTurns = 0;
          } else {
            player.jailTurns += 1;
            if (player.jailTurns >= 3) {
              player.money -= JAIL_FINE;
              player.inJail = false;
              player.jailTurns = 0;
            } else {
              set({ state: { ...state, players, dice, phase: 'paying', lastAction: `${player.token} gagal keluar penjara (giliran ${player.jailTurns}/3)` } });
              return;
            }
          }
        }

        // Doubles tracking (3 doubles = jail)
        if (dice.isDoubles) {
          doublesCount += 1;
          if (doublesCount >= 3) {
            player.position = state.board.findIndex((s) => s.type === 'jail');
            player.inJail = true;
            set({ state: { ...state, players, dice, doublesCount: 0, phase: 'paying', lastAction: `${player.token} lempar doubles 3x — masuk penjara!` } });
            return;
          }
        } else {
          doublesCount = 0;
        }

        // Move
        const oldPos = player.position;
        player.position = (player.position + dice.total) % state.board.length;
        if (passedGo(oldPos, player.position, state.board.length) && player.position !== 0) {
          player.money += GO_SALARY;
        }
        // Double on GO house rule
        if (player.position === 0 && state.houseRules.doubleOnGo) {
          player.money += GO_SALARY; // extra (total 4jt)
        }

        let newState: GameState = { ...state, players, dice, doublesCount, phase: 'landed' };
        newState = handleLanding(newState);

        // Bankruptcy check
        if (player.money < 0) {
          player.bankrupt = true;
          player.money = 0;
          // Return properties to bank
          newState.properties.forEach((p) => { if (p.ownerId === player.id) { p.ownerId = null; p.houses = 0; p.mortgaged = false; } });
          newState.lastAction = `${player.token} bangkrut! 💀`;
          const winner = checkWinner(newState);
          if (winner !== null) {
            newState.winner = winner;
            newState.phase = 'game-over';
          }
        }

        set({ state: newState });

        // AI auto-actions
        if (player.isAI && !player.bankrupt && newState.phase === 'buying') {
          setTimeout(() => get().buyProperty(), 500);
        } else if (player.isAI && !player.bankrupt && newState.phase === 'paying') {
          setTimeout(() => get().endTurn(), 800);
        }
      },

      buyProperty: () => {
        const { state } = get();
        if (!state || state.phase !== 'buying') return;
        const player = state.players[state.currentPlayerIndex];
        const space = state.board[player.position];
        const prop = state.properties.find((p) => p.spaceId === space.id);
        if (!prop || !space.price) return;

        // AI decision
        if (player.isAI && !aiBuyDecision(player, space)) {
          get().skipBuy();
          return;
        }

        if (player.money < space.price) {
          set({ state: { ...state, phase: 'paying', lastAction: `${player.token} tidak cukup uang untuk membeli ${space.name}` } });
          if (player.isAI) setTimeout(() => get().endTurn(), 500);
          return;
        }

        const players = [...state.players];
        players[state.currentPlayerIndex] = { ...player, money: player.money - space.price };
        const properties = state.properties.map((p) => p.spaceId === space.id ? { ...p, ownerId: player.id } : p);

        const newState = { ...state, players, properties, phase: 'paying' as GamePhase, lastAction: `${player.token} membeli ${space.name} seharga Rp ${(space.price / 1_000_000).toFixed(1)}jt` };
        set({ state: newState });
        if (player.isAI) setTimeout(() => get().endTurn(), 500);
      },

      skipBuy: () => {
        const { state } = get();
        if (!state) return;
        const player = state.players[state.currentPlayerIndex];
        const space = state.board[player.position];
        set({ state: { ...state, phase: 'paying', lastAction: `${player.token} melewati ${space.name}` } });
        if (player.isAI) setTimeout(() => get().endTurn(), 500);
      },

      endTurn: () => {
        const { state } = get();
        if (!state) return;
        const player = state.players[state.currentPlayerIndex];

        // AI try to build houses
        if (player.isAI) {
          const builds = aiBuildDecision(player, state.properties, state.board);
          if (builds.length > 0) {
            builds.forEach((spaceId) => get().buildHouse(spaceId));
          }
          // AI try to propose trade
          const trade = aiProposeTrade(player, state.players, state.properties, state.board);
          if (trade) {
            const target = state.players[trade.to];
            if (target && target.isAI) {
              // AI-to-AI trade: auto-decide
              const accept = aiTradeDecision(trade, target, state.properties, state.board);
              if (accept) {
                get().proposeTrade(trade);
                get().respondTrade(true);
                return;
              }
            } else if (target && !target.bankrupt) {
              // AI proposes to human — show modal
              set({ state: { ...state, tradeOffer: trade, phase: 'trading', lastAction: `${player.token} mengajukan tukar properti ke ${target.token}` } });
              return;
            }
          }
        }

        // Doubles = roll again (unless went to jail)
        if (state.dice?.isDoubles && !player.inJail && !player.bankrupt) {
          set({ state: { ...state, phase: 'rolling', lastAction: `${player.token} dapat doubles — lempar lagi!` } });
          if (player.isAI) setTimeout(() => get().rollAndMove(), 800);
          return;
        }

        const nextIdx = nextActivePlayer(state);
        const nextPlayer = state.players[nextIdx];
        const newState: GameState = {
          ...state,
          currentPlayerIndex: nextIdx,
          phase: 'rolling',
          doublesCount: 0,
          turnCount: state.turnCount + 1,
          lastAction: `Giliran ${nextPlayer.token} ${nextPlayer.name}`,
        };
        set({ state: newState });

        // AI auto-roll
        if (nextPlayer.isAI) {
          setTimeout(() => get().rollAndMove(), 1000);
        }
      },

      buildHouse: (spaceId) => {
        const { state } = get();
        if (!state) return;
        const player = state.players[state.currentPlayerIndex];
        const prop = state.properties.find((p) => p.spaceId === spaceId);
        if (!prop || !canBuildHouse(prop, state.properties, state.board, player)) return;
        const space = state.board[spaceId];
        if (!space.housePrice) return;

        const players = [...state.players];
        players[state.currentPlayerIndex] = { ...player, money: player.money - space.housePrice };
        const properties = state.properties.map((p) => p.spaceId === spaceId ? { ...p, houses: p.houses + 1 } : p);
        set({ state: { ...state, players, properties, lastAction: `${player.token} bangun rumah di ${space.name}` } });
      },

      mortgageProperty: (spaceId) => {
        const { state } = get();
        if (!state) return;
        const player = state.players[state.currentPlayerIndex];
        const prop = state.properties.find((p) => p.spaceId === spaceId);
        if (!prop || prop.ownerId !== player.id || prop.mortgaged || prop.houses > 0) return;
        const space = state.board[spaceId];
        const value = mortgageValue(space);

        const players = [...state.players];
        players[state.currentPlayerIndex] = { ...player, money: player.money + value };
        const properties = state.properties.map((p) => p.spaceId === spaceId ? { ...p, mortgaged: true } : p);
        set({ state: { ...state, players, properties, lastAction: `${player.token} mortgage ${space.name} (Rp ${(value / 1_000_000).toFixed(1)}jt)` } });
      },

      proposeTrade: (offer) => {
        const { state } = get();
        if (!state) return;
        set({ state: { ...state, tradeOffer: offer, phase: 'trading' as GamePhase, lastAction: `${state.players[offer.from].token} mengajukan tukar ke ${state.players[offer.to].token}` } });
      },

      respondTrade: (accept) => {
        const { state } = get();
        if (!state || !state.tradeOffer) return;
        const offer = state.tradeOffer;
        const players = [...state.players];
        let properties = [...state.properties];

        if (accept) {
          // Transfer properties
          properties = properties.map((p) => {
            if (offer.offerProperties.includes(p.spaceId) && p.ownerId === offer.from) {
              return { ...p, ownerId: offer.to };
            }
            if (offer.requestProperties.includes(p.spaceId) && p.ownerId === offer.to) {
              return { ...p, ownerId: offer.from };
            }
            return p;
          });
          // Transfer money
          players[offer.from] = { ...players[offer.from], money: players[offer.from].money - offer.offerMoney + offer.requestMoney };
          players[offer.to] = { ...players[offer.to], money: players[offer.to].money - offer.requestMoney + offer.offerMoney };
        }

        const fromPlayer = players[offer.from];
        const action = accept
          ? `${players[offer.to].token} menerima tukar dari ${fromPlayer.token}! 🤝`
          : `${players[offer.to].token} menolak tukar dari ${fromPlayer.token}`;

        set({ state: { ...state, players, properties, tradeOffer: null, phase: 'paying' as GamePhase, lastAction: action } });

        // If current player is AI, continue their turn
        if (fromPlayer.isAI) {
          setTimeout(() => get().endTurn(), 800);
        }
      },

      undo: () => {
        const { undoStack } = get();
        if (!undoStack || undoStack.length === 0) return;
        // ponytail: restore from undoStack. Push-before-action added as needed per action.
        const newStack = [...undoStack];
        const prevState = newStack.pop()!;
        set({ state: prevState, undoStack: newStack });
      },
    }),
    {
      name: 'monopoly-game-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ state: s.state, houseRules: s.houseRules }),
    },
  ),
);
