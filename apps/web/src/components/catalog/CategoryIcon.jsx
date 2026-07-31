import {
  Brain,
  Camera,
  Dumbbell,
  Ellipsis,
  Footprints,
  Hand,
  HeartHandshake,
  Palette,
  Scissors,
  Smile,
  Sparkles,
  Wand,
} from 'lucide-react';

/**
 * Kategoriya ikonkasi bazada nom sifatida saqlanadi ('scissors').
 * Dinamik import qilinmaydi — butun lucide to'plami bundle'ga tushib ketadi.
 */
const ICONS = {
  sparkles: Sparkles,
  hand: Hand,
  footprints: Footprints,
  wand: Wand,
  smile: Smile,
  'heart-handshake': HeartHandshake,
  brain: Brain,
  palette: Palette,
  scissors: Scissors,
  dumbbell: Dumbbell,
  camera: Camera,
  ellipsis: Ellipsis,
};

export function CategoryIcon({ name, className }) {
  const Icon = ICONS[name] || Sparkles;
  return <Icon className={className} />;
}

export default CategoryIcon;
