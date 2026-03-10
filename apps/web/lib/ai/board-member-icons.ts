/**
 * Board Member Icon Mapping
 *
 * Maps each board member to a Lucide icon for use in the
 * Board Member Panel UI.
 */

import { Compass, TrendingUp, Heart, Eye, Wrench, Flower } from 'lucide-react';
import type { BoardMemberId } from './board-types';
import type { LucideIcon } from 'lucide-react';

export const BOARD_MEMBER_ICONS: Record<BoardMemberId, LucideIcon> = {
  mary: Compass,
  victoria: TrendingUp,
  casey: Heart,
  elaine: Eye,
  omar: Wrench,
  taylor: Flower,
};
