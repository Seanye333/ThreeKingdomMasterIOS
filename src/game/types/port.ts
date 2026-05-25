import type { BilingualName, EntityId } from './common';
import type { ShipClass } from './naval';

/**
 * A port is an independent map facility, NOT owned via its nearest city.
 * (RTK 14-style.) Players capture ports separately by sending forces to
 * the port's coordinates.
 *
 * - Owner can change independently of any city.
 * - HP tracks combat damage; 0 HP means the port is contested/sacked.
 * - connectedPortIds lists the sea routes (bidirectional) — naval
 *   movement is restricted to port-to-port hops along these edges.
 * - linkedCityId is the "home city" used for upkeep and trade flow.
 */
export interface Port {
  id: EntityId;
  name: BilingualName;
  /** Real-world (lon, lat). Renderers project to world coords. */
  coords: { lon: number; lat: number };
  /** null = neutral / unowned. */
  ownerForceId: EntityId | null;
  /** Current / max hitpoints. Port is "down" at 0. */
  hp: number;
  maxHp: number;
  /** Other ports this one connects to by sea (bidirectional). */
  connectedPortIds: EntityId[];
  /** Nearest land city — used for upkeep + AI logic. */
  linkedCityId: EntityId;
  /** Ships currently docked at this port (count per class). */
  dockedShips?: Partial<Record<ShipClass, number>>;
  /** Pending ship builds — each takes seasonsLeft to complete. */
  buildQueue?: Array<{ shipClass: ShipClass; seasonsLeft: number }>;
}
