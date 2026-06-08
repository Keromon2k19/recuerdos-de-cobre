export type HeroBackground = {
  key: string;
  label: string;
  src: string;
};

export const DEFAULT_HERO_BACKGROUND: HeroBackground = {
  key: "current",
  label: "Actual V2",
  src: "/assets/atlas/backgrounds/hero.png",
};

export const HERO_BACKGROUNDS: HeroBackground[] = [
  DEFAULT_HERO_BACKGROUND,
  {
    key: "steampunk_atmosphere",
    label: "Steampunk atmosphere",
    src: "/assets/atlas/backgrounds/candidates/steampunk_atmosphere.png",
  },
  {
    key: "steampunk_atmosphere_v2",
    label: "Steampunk atmosphere v2",
    src: "/assets/atlas/backgrounds/candidates/steampunk_atmosphere_v2.png",
  },
  {
    key: "steampunk_atmosphere_v3",
    label: "Steampunk atmosphere v3",
    src: "/assets/atlas/backgrounds/candidates/steampunk_atmosphere_v3.png",
  },
  {
    key: "low_lying_steam_v1",
    label: "Low lying steam v1",
    src: "/assets/atlas/backgrounds/candidates/low_lying_steam_v1.png",
  },
  {
    key: "low_lying_steam_v2",
    label: "Low lying steam v2",
    src: "/assets/atlas/backgrounds/candidates/low_lying_steam_v2.png",
  },
  {
    key: "steam_cloud_drifting",
    label: "Steam cloud drifting",
    src: "/assets/atlas/backgrounds/candidates/steam_cloud_drifting.png",
  },
];

export function resolveHeroBackground(value: string | string[] | undefined): HeroBackground {
  const key = Array.isArray(value) ? value[0] : value;
  return HERO_BACKGROUNDS.find((background) => background.key === key) ?? DEFAULT_HERO_BACKGROUND;
}
