/**
 * Player status enumeration representing different states a player can be in
 */
export enum PlayerStatus {
  ON_FOOT = "ON_FOOT",
  SWIMMING = "SWIMMING",
  IN_VEHICLE = "IN_VEHICLE",
  ARMED = "ARMED",
  DEAD = "DEAD",
}

/**
 * Coordinates interface representing a player's position
 */
export interface Coordinates {
  x: number;
  y: number;
}

/**
 * Player interface representing a player's information and state
 */
export interface PlayerData {
  id: number;
  license: string;
  name: string;
  ping: number;
  health: number;
  admin: boolean;
  timeOnline: number;
  playTime: number;
  threatScore: number;
  status: PlayerStatus;
  coords: Coordinates;
}
