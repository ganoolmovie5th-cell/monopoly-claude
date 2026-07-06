// Core types for Monopoly game. Pure data, no React.

export type BoardTheme = 'indonesia' | 'world-mini';

export type SpaceType =
  | 'property'
  | 'railroad'
  | 'utility'
  | 'tax'
  | 'community'
  | 'chance'
  | 'go'
  | 'jail'
  | 'free-parking'
  | 'go-to-jail';

export type ColorGroup =
  | 'brown' | 'lightblue' | 'pink' | 'orange'
  | 'red' | 'yellow' | 'green' | 'darkblue'
  | 'railroad' | 'utility';

export interface BoardSpace {
  id: number;
  name: string;
  type: SpaceType;
  color?: ColorGroup;
  price?: number;
  rent?: number[];      // [base, 1house, 2house, 3house, 4house, hotel]
  housePrice?: number;
  taxAmount?: number;
}

export interface Property {
  spaceId: number;
  ownerId: number | null; // player index, null = unowned
  houses: number;         // 0-4 houses, 5 = hotel
  mortgaged: boolean;
}

export interface Player {
  id: number;
  name: string;
  token: string;       // emoji pion
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  hasGetOutOfJailCard: number; // count of cards held
  bankrupt: boolean;
  isAI: boolean;
}

export type CardType = 'community' | 'chance';

export interface GameCard {
  id: number;
  type: CardType;
  text: string;
  action: CardAction;
}

export type CardAction =
  | { type: 'collect'; amount: number }
  | { type: 'pay'; amount: number }
  | { type: 'move'; to: number }
  | { type: 'move-back'; spaces: number }
  | { type: 'jail' }
  | { type: 'get-out-of-jail' }
  | { type: 'pay-each-player'; amount: number }
  | { type: 'collect-from-each'; amount: number }
  | { type: 'repair'; perHouse: number; perHotel: number };

export interface DiceResult {
  die1: number;
  die2: number;
  total: number;
  isDoubles: boolean;
}

export type GamePhase =
  | 'rolling'        // waiting to roll dice
  | 'moving'         // animating movement
  | 'landed'         // landed, needs action (buy/pay/card)
  | 'buying'         // deciding to buy property
  | 'auction'        // auction in progress
  | 'paying'         // paying rent/tax
  | 'card'           // community/chance card drawn
  | 'jail-decision'  // in jail, choose action
  | 'building'       // buying houses/hotels
  | 'trading'        // trade modal open
  | 'game-over';     // winner declared

export interface AuctionState {
  propertyId: number;
  currentBid: number;
  currentBidder: number | null;
  activeBidders: number[]; // player IDs still in auction
}

export interface GameState {
  players: Player[];
  properties: Property[];
  board: BoardSpace[];
  boardTheme: BoardTheme;
  currentPlayerIndex: number;
  phase: GamePhase;
  dice: DiceResult | null;
  doublesCount: number;
  communityDeck: number[];  // shuffled card IDs
  chanceDeck: number[];
  auction: AuctionState | null;
  turnCount: number;
  winner: number | null;
  lastAction: string;       // description of last action for log
}

export const STARTING_MONEY = 20_000_000; // Rp 20 juta
export const GO_SALARY = 2_000_000;       // Rp 2 juta saat lewat START
export const JAIL_FINE = 500_000;
export const MAX_HOUSES = 5; // 5 = hotel

export const TOKENS = ['🚗', '🚢', '✈️', '🏍️', '🚂', '🎩', '👟', '💎', '🐶', '🦁', '🐲', '🌟'];
