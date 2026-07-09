// AI decision making. Pure logic.
import { Player, Property, BoardSpace, GameState, TradeOffer, ColorGroup } from './types';
import { canBuildHouse, ownsFullGroup, totalAssets, countOwnedInGroup, groupSize } from './rules';

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


// --- Trade AI ---

const PROPERTY_COLORS: ColorGroup[] = ['brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkblue'];

/** How close player is to completing a color group (0-1). */
function groupProgress(properties: Property[], board: BoardSpace[], playerId: number, color: ColorGroup): number {
  const owned = countOwnedInGroup(properties, board, playerId, color);
  const total = groupSize(board, color);
  return total > 0 ? owned / total : 0;
}

/** AI evaluates whether a trade is beneficial to accept. */
export function aiTradeDecision(
  offer: TradeOffer,
  player: Player,
  properties: Property[],
  board: BoardSpace[],
): boolean {
  // Check if receiving properties gets us closer to a group
  let groupBenefit = 0;
  for (const spaceId of offer.requestProperties) {
    // These are what we'd give away
    const space = board[spaceId];
    if (space?.color && PROPERTY_COLORS.includes(space.color)) {
      const progress = groupProgress(properties, board, player.id, space.color);
      if (progress >= 1) return false; // never give away from a complete group
      groupBenefit -= progress;
    }
  }
  for (const spaceId of offer.offerProperties) {
    // These are what we'd receive
    const space = board[spaceId];
    if (space?.color && PROPERTY_COLORS.includes(space.color)) {
      // Simulate receiving this
      const current = countOwnedInGroup(properties, board, player.id, space.color);
      const total = groupSize(board, space.color);
      const newProgress = (current + 1) / total;
      groupBenefit += newProgress;
    }
  }

  // Money differential check: accept if within 50% of property values involved
  const receivedValue = offer.offerProperties.reduce((sum, id) => sum + (board[id]?.price ?? 0), 0) + offer.offerMoney;
  const givenValue = offer.requestProperties.reduce((sum, id) => sum + (board[id]?.price ?? 0), 0) + offer.requestMoney;

  const fairness = givenValue > 0 ? receivedValue / givenValue : 2;

  // Accept if group benefit is positive AND money is fair (within 50%)
  return groupBenefit > 0.3 && fairness >= 0.5;
}

/** AI proposes a trade if it can complete a color group. Returns null if no beneficial trade found. */
export function aiProposeTrade(
  player: Player,
  players: Player[],
  properties: Property[],
  board: BoardSpace[],
): TradeOffer | null {
  // Find groups where AI needs exactly 1 more property
  for (const color of PROPERTY_COLORS) {
    const total = groupSize(board, color);
    const owned = countOwnedInGroup(properties, board, player.id, color);
    if (owned < total - 1 || owned >= total) continue; // Need exactly 1 more

    // Find the missing property
    const groupSpaces = board.filter((s) => s.color === color);
    const missing = groupSpaces.find((s) => {
      const prop = properties.find((p) => p.spaceId === s.id);
      return prop && prop.ownerId !== null && prop.ownerId !== player.id;
    });
    if (!missing) continue;

    const missingProp = properties.find((p) => p.spaceId === missing.id);
    if (!missingProp || missingProp.ownerId === null) continue;
    const targetPlayer = players[missingProp.ownerId];
    if (!targetPlayer || targetPlayer.bankrupt) continue;

    // Find a property to offer — one from a group AI can't complete
    const myProps = properties.filter((p) => p.ownerId === player.id && p.houses === 0 && !p.mortgaged);
    const offerProp = myProps.find((p) => {
      const space = board[p.spaceId];
      if (!space?.color || !PROPERTY_COLORS.includes(space.color)) return false;
      // Don't offer from a group we already own fully or nearly fully
      const myOwned = countOwnedInGroup(properties, board, player.id, space.color);
      const myTotal = groupSize(board, space.color);
      return myOwned < myTotal - 1; // Can't complete this group anyway
    });

    const missingPrice = missing.price ?? 0;
    // Offer money supplement (20% of missing property's value)
    const moneyOffer = Math.min(Math.floor(missingPrice * 0.2), player.money - RESERVE_CASH);
    if (moneyOffer < 0) continue;

    return {
      from: player.id,
      to: missingProp.ownerId,
      offerProperties: offerProp ? [offerProp.spaceId] : [],
      requestProperties: [missing.id],
      offerMoney: offerProp ? moneyOffer : Math.min(Math.floor(missingPrice * 0.7), player.money - RESERVE_CASH),
      requestMoney: 0,
    };
  }
  return null;
}
