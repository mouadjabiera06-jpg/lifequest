import { useEffect, useState } from "react";
import type { AvatarStyle } from "../../domain/types";

type BossStyle = "bottts";
type Style = AvatarStyle | BossStyle;

// Les styles DiceBear sont chargés à la demande et générés dans le navigateur :
// aucun appel réseau, donc les avatars marchent hors ligne et sans fuite du pseudo.
const loaders: Record<Style, () => Promise<unknown>> = {
  "pixel-art": () => import("@dicebear/pixel-art"),
  adventurer: () => import("@dicebear/adventurer"),
  lorelei: () => import("@dicebear/lorelei"),
  "fun-emoji": () => import("@dicebear/fun-emoji"),
  bottts: () => import("@dicebear/bottts"),
};

const cache = new Map<string, string>();

async function render(style: Style, seed: string): Promise<string> {
  const key = `${style}|${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [{ createAvatar }, collection] = await Promise.all([import("@dicebear/core"), loaders[style]()]);
  // Les modules de style exposent l'interface attendue par createAvatar.
  const uri = createAvatar(collection as Parameters<typeof createAvatar>[0], { seed }).toDataUri();
  cache.set(key, uri);
  return uri;
}

function initialSvg(label: string, color: string): string {
  const letter = (label.trim().charAt(0) || "?").toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='#211B33'/><text x='32' y='42' font-family='system-ui,sans-serif' font-size='30' font-weight='800' text-anchor='middle' fill='${color}'>${letter.replace(/[<>&'"]/g, "")}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface Props {
  style: Style;
  seed: string;
  label: string;
  className?: string;
  color?: string;
}

export function Avatar({ style, seed, label, className, color = "#A78BFA" }: Props) {
  const key = `${style}|${seed}`;
  const [loaded, setLoaded] = useState<{ key: string; uri: string } | null>(() => {
    const hit = cache.get(key);
    return hit ? { key, uri: hit } : null;
  });

  useEffect(() => {
    let alive = true;
    render(style, seed)
      .then((uri) => alive && setLoaded({ key, uri }))
      .catch(() => {
        /* style introuvable : l'initiale reste affichée */
      });
    return () => {
      alive = false;
    };
  }, [style, seed, key]);

  const src = loaded?.key === key ? loaded.uri : initialSvg(label, color);
  return <img className={className} src={src} alt={label} width={76} height={76} />;
}
