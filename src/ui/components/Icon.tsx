import type { StatId } from "../../domain/types";

// Jeu d'icônes dessiné à la main : un seul trait (2 px, bouts arrondis) pour toute l'app,
// au lieu d'emojis dont le rendu change d'un système à l'autre.
const PATHS = {
  quests: '<path d="M7 4h11a2 2 0 012 2v12a2 2 0 01-2 2H7"/><path d="M7 4a2 2 0 00-2 2v1h4V6a2 2 0 00-2-2zM7 20a2 2 0 01-2-2v-1h4v1a2 2 0 01-2 2z"/><path d="M11 9h5M11 13h5"/>',
  boss: '<path d="M12 3c4.4 0 8 3.2 8 7.4 0 2.6-1.4 4.4-3 5.4V19a1 1 0 01-1 1H8a1 1 0 01-1-1v-3.2c-1.6-1-3-2.8-3-5.4C4 6.2 7.6 3 12 3z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 20v-2M14 20v-2"/>',
  shop: '<path d="M5 8h14l-1.2 11a1 1 0 01-1 .9H7.2a1 1 0 01-1-.9z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.4-3.4 4.4-5 8-5s6.6 1.6 8 5"/>',
  force: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  intel: '<path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z"/><path d="M12 6v13.5"/>',
  charisme: '<path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-6l-5 4v-4H6a2 2 0 01-2-2z"/>',
  discipline: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  richesse: '<ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  dots: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.9-8.3.5 1.9 1.4 3 2.6 3.6.2-2.8 1.4-5.2 3.4-7.1.3 3.2 4.1 6 4.1 11.4C19.5 18.3 16 21 12 21z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r=".9"/><circle cx="15" cy="15" r=".9"/><circle cx="15" cy="9" r=".9"/><circle cx="9" cy="15" r=".9"/>',
  sword: '<path d="M14.5 4H20v5.5L10 19.5 4.5 14z"/><path d="M8 12l4 4M4 20l2.5-2.5"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.8c0-1 1.1-1.8 2.5-1.8s2.5.8 2.5 1.8-1.1 1.6-2.5 1.9-2.5.9-2.5 1.9 1.1 1.8 2.5 1.8 2.5-.8 2.5-1.8"/>',
  heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.6-7.5 10-7.5 10z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  edit: '<path d="M16.5 4.5l3 3L8 19l-4 1 1-4z"/>',
  download: '<path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 20h14"/>',
  upload: '<path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 20h14"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 13h9l1-13M9.5 7V4.5h5V7"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 01-.6-9A6 6 0 0118 8.5a4.5 4.5 0 01-.5 10z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4M8.5 20h7M10 17h4v3h-4z"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  chart: '<path d="M5 20V11M11 20V5M17 20v-6M3 20h18"/>',
  journal: '<path d="M6 4h11a1 1 0 011 1v15H7a2 2 0 01-2-2V5a1 1 0 011-1z"/><path d="M5 18a2 2 0 012-2h11M9 8h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  potion: '<path d="M10 3h4M10.5 3v5L6 15.5A3.5 3.5 0 009 20.5h6a3.5 3.5 0 003-5L13.5 8V3"/><path d="M7.5 14h9"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className, stroke = 2 }: { name: IconName; size?: number; className?: string; stroke?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}

/** Icône d'une statistique, teintée de sa couleur. */
export function StatIcon({ stat, size = 16 }: { stat: StatId; size?: number }) {
  return (
    <span className="stat-ic" style={{ color: `var(--${stat})` }}>
      <Icon name={stat} size={size} />
    </span>
  );
}
