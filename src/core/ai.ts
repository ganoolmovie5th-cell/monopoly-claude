// AI decision making. Pure logic.
import { Player, Property, BoardSpace, GameState } from './types';
import { canBuildHouse, ownsFullGroup, totalAssets } from './rules';

const RESERVE_CASH = 2_000_000; // AI keeps this minimum cash after buying

/** Should AI buy this property? */
export function aiBuyDecision(player: Player, space: BoardSpace): boolean {
  if (!space.price) return false;
  return player.money - space.price > RESERVE_CASH;
}

/** AI auction bid — up to 70% of property price. */
export function aiAuctionBid(player: Player, space: BoardSpace, currentBid: number): number | null {
  if (!space.price) return null;
  const maxBid = Math.floor(space.price * 0.7);
  if (currentBid >= maxBid) return null; // pass
  if (player.money <= currentBid + 100_000) return null; // can't afford
  // Bid increment: 10% of property price
  const increment = Math.max(100_000, Math.floor(space.price * 0.1));
  const bid = Math.min(currentBid + increment, maxBid, player.money - RESERVE_CASH);
  return bid > currentBid ? bid : null;
}

/** AI decides which properties to build houses on. Returns spaceIds to build. */
export function aiBuildDecision(player: Player, properties: Property[], board: BoardSpace[]): number[] {
  const buildable = properties.filter((p) => canBuildHouse(p, properties, board, player));
  if (buildable.length === 0) return [];

  // Sort by rent potential (higher rent = priority)
  buildable.sort((a, b) => {
    const spaceA = board[a.spaceId];
    const spaceB = board[b.spaceId];
    const rentA = spaceA?.rent?.[a.houses + 1] ?? 0;
    const rentB = spaceB?.rent?.[b.houses + 1] ?? 0;
    return rentB - rentA;
  });

  // Build on first available if we can afford it and still have reserve
  const space = board[buildable[0].spaceId];
  if (space?.housePrice && player.money - space.housePrice > RESERVE_CASH) {
    return [buildable[0].spaceId];
  }
  return [];
}

/** AI jail decision: pay to get out if can afford, otherwise try doubles. */
export function aiJailDecision(player: Player): 'pay' | 'roll' | 'card' {
  if (player.hasGetOutOfJailCard > 0) return 'card';
  if (player.money > 3_000_000) return 'pay';
  return 'roll';
}

/** AI decides which property to mortgage when needing money. */
export function aiMortgageDecision(player: Player, properties: Property[], board: BoardSpace[]): number | null {
  const owned = properties.filter((p) => p.ownerId === player.id && !p.mortgaged && p.houses === 0);
  if (owned.length === 0) return null;

  // Mortgage the one with lowest rent first
  owned.sort((a, b) => {
    const rentA = board[a.spaceId]?.rent?.[0] ?? 0;
    const rentB = board[b.spaceId]?.rent?.[0] ?? 0;
    return rentA - rentB;
  });
  return owned[0].spaceId;
}
