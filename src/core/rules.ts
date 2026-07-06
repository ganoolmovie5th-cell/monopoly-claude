// Game rules engine. Pure functions, no React.
import { BoardSpace, Player, Property, GameState, GO_SALARY, JAIL_FINE, MAX_HOUSES, ColorGroup } from './types';

/** Count how many properties of a color group a player owns (un-mortgaged). */
export function countOwnedInGroup(properties: Property[], board: BoardSpace[], playerId: number, color: ColorGroup): number {
  return properties.filter(
    (p) => p.ownerId === playerId && !p.mortgaged && board[p.spaceId]?.color === color
  ).length;
}

/** Total properties in a color group on the board. */
export function groupSize(board: BoardSpace[], color: ColorGroup): number {
  return board.filter((s) => s.color === color).length;
}

/** Does player own all properties in a color group? */
export function ownsFullGroup(properties: Property[], board: BoardSpace[], playerId: number, color: ColorGroup): boolean {
  return countOwnedInGroup(properties, board, playerId, color) === groupSize(board, color);
}

/** Calculate rent for a property. */
export function calculateRent(space: BoardSpace, property: Property, properties: Property[], board: BoardSpace[], diceTotal: number): number {
  if (property.mortgaged) return 0;
  if (property.ownerId === null) return 0;

  if (space.type === 'railroad') {
    const railroads = properties.filter((p) => p.ownerId === property.ownerId && board[p.spaceId]?.type === 'railroad' && !p.mortgaged);
    const rentTable = space.rent ?? [250_000, 500_000, 1_000_000, 2_000_000];
    return rentTable[Math.min(railroads.length - 1, rentTable.length - 1)];
  }

  if (space.type === 'utility') {
    const utils = properties.filter((p) => p.ownerId === property.ownerId && board[p.spaceId]?.type === 'utility' && !p.mortgaged);
    return utils.length >= 2 ? diceTotal * 100_000 : diceTotal * 40_000;
  }

  if (!space.rent) return 0;
  if (property.houses === 0) {
    // Double rent if full group owned and no houses
    const fullGroup = space.color ? ownsFullGroup(properties, board, property.ownerId, space.color) : false;
    return space.rent[0] * (fullGroup ? 2 : 1);
  }
  return space.rent[Math.min(property.houses, space.rent.length - 1)];
}

/** Can player build a house on this property? */
export function canBuildHouse(property: Property, properties: Property[], board: BoardSpace[], player: Player): boolean {
  if (property.ownerId !== player.id) return false;
  if (property.mortgaged) return false;
  if (property.houses >= MAX_HOUSES) return false;

  const space = board[property.spaceId];
  if (!space || space.type !== 'property' || !space.color || !space.housePrice) return false;
  if (!ownsFullGroup(properties, board, player.id, space.color)) return false;
  if (player.money < space.housePrice) return false;

  // Even building rule: can't have more than 1 house difference in group
  const groupProps = properties.filter((p) => p.ownerId === player.id && board[p.spaceId]?.color === space.color);
  const minHouses = Math.min(...groupProps.map((p) => p.houses));
  return property.houses <= minHouses;
}

/** Mortgage a property — return cash received. */
export function mortgageValue(space: BoardSpace): number {
  return Math.floor((space.price ?? 0) / 2);
}

/** Unmortgage cost (50% price + 10% interest). */
export function unmortgageCost(space: BoardSpace): number {
  const half = Math.floor((space.price ?? 0) / 2);
  return half + Math.floor(half * 0.1);
}

/** Check if a player passed GO during movement. */
export function passedGo(oldPos: number, newPos: number, boardSize: number): boolean {
  return newPos < oldPos || (oldPos === newPos && oldPos === 0);
}

/** Calculate total assets of a player (money + property values + houses). */
export function totalAssets(player: Player, properties: Property[], board: BoardSpace[]): number {
  let total = player.money;
  for (const prop of properties) {
    if (prop.ownerId !== player.id) continue;
    const space = board[prop.spaceId];
    if (!space) continue;
    if (prop.mortgaged) {
      total += mortgageValue(space);
    } else {
      total += space.price ?? 0;
      total += prop.houses * (space.housePrice ?? 0);
    }
  }
  return total;
}
