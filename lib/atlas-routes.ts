export const ATLAS_ROUTES = {
  home: "/",
  capitulos: "/capitulos",
  personajes: "/personajes",
  facciones: "/facciones",
  lugares: "/lugares",
  mapa: "/mapa",
  dioses: "/dioses",
  objetos: "/objetos",
  misterios: "/misterios",
  mundo: "/mundo",
  buscar: "/buscar",
} as const;

export const LEGACY_PUBLIC_REDIRECTS: Record<string, string> = {
  // Redirecciones de la antigua V2 a la raíz
  "/v2": ATLAS_ROUTES.home,
  "/v2/timeline": "/timeline",
  "/v2/capitulos": ATLAS_ROUTES.capitulos,
  "/v2/capitulos/:num": `${ATLAS_ROUTES.capitulos}/:num`,
  "/v2/personajes": ATLAS_ROUTES.personajes,
  "/v2/personajes/:slug": `${ATLAS_ROUTES.personajes}/:slug`,
  "/v2/facciones": ATLAS_ROUTES.facciones,
  "/v2/facciones/:slug": `${ATLAS_ROUTES.facciones}/:slug`,
  "/v2/lugares": ATLAS_ROUTES.lugares,
  "/v2/lugares/:slug": `${ATLAS_ROUTES.lugares}/:slug`,
  "/v2/mapa": ATLAS_ROUTES.mapa,
  "/v2/dioses": ATLAS_ROUTES.dioses,
  "/v2/objetos": ATLAS_ROUTES.objetos,
  "/v2/objetos/:slug": `${ATLAS_ROUTES.objetos}/:slug`,
  "/v2/misterios": ATLAS_ROUTES.misterios,
  "/v2/misterios/:slug": `${ATLAS_ROUTES.misterios}/:slug`,
  "/v2/mundo": ATLAS_ROUTES.mundo,
  "/v2/mundo/:slug": `${ATLAS_ROUTES.mundo}/:slug`,
  "/v2/buscar": ATLAS_ROUTES.buscar,
  "/v2/archivos": ATLAS_ROUTES.objetos,

  // Redirecciones de la antigua V1 a la raíz (solo las que difieren en nombre)
  "/cronicas": ATLAS_ROUTES.capitulos,
  "/cronicas/:num": `${ATLAS_ROUTES.capitulos}/:num`,
  "/worldbuilding": ATLAS_ROUTES.mundo,
  "/worldbuilding/:slug": `${ATLAS_ROUTES.mundo}/:slug`,
  "/episodios": ATLAS_ROUTES.capitulos,
  "/episodios/:num": `${ATLAS_ROUTES.capitulos}/:num`,

  // Redirecciones de entidades locales a la raíz (solo las que difieren en nombre)
  "/entidades/personaje": ATLAS_ROUTES.personajes,
  "/entidades/personaje/:slug": `${ATLAS_ROUTES.personajes}/:slug`,
  "/entidades/lugar": ATLAS_ROUTES.lugares,
  "/entidades/lugar/:slug": `${ATLAS_ROUTES.lugares}/:slug`,
  "/entidades/faccion": ATLAS_ROUTES.facciones,
  "/entidades/faccion/:slug": `${ATLAS_ROUTES.facciones}/:slug`,
  "/entidades/objeto": ATLAS_ROUTES.objetos,
  "/entidades/objeto/:slug": `${ATLAS_ROUTES.objetos}/:slug`,
  "/entidades/misterio": ATLAS_ROUTES.misterios,
  "/entidades/misterio/:slug": `${ATLAS_ROUTES.misterios}/:slug`,
  "/entidades/worldbuilding": ATLAS_ROUTES.mundo,
  "/entidades/worldbuilding/:slug": `${ATLAS_ROUTES.mundo}/:slug`,
  "/entidades/evento": ATLAS_ROUTES.capitulos,
  "/entidades/evento/:slug": ATLAS_ROUTES.capitulos,
  "/entidades/quote": ATLAS_ROUTES.capitulos,
  "/entidades/quote/:slug": ATLAS_ROUTES.capitulos,
  "/entidades/decision": ATLAS_ROUTES.capitulos,
  "/entidades/decision/:slug": ATLAS_ROUTES.capitulos,
};

export function isPublicHref(href: string): boolean {
  if (!href.startsWith("/")) return false;
  const path = href.split(/[?#]/, 1)[0];
  const publicPaths = [
    ATLAS_ROUTES.home,
    ATLAS_ROUTES.capitulos,
    ATLAS_ROUTES.personajes,
    ATLAS_ROUTES.facciones,
    ATLAS_ROUTES.lugares,
    ATLAS_ROUTES.mapa,
    ATLAS_ROUTES.dioses,
    ATLAS_ROUTES.objetos,
    ATLAS_ROUTES.misterios,
    ATLAS_ROUTES.mundo,
    ATLAS_ROUTES.buscar,
  ];
  return publicPaths.some((p) => p === path || path.startsWith(`${p}/`));
}
