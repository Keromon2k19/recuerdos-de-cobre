// Override curado de "personaje → lugar de origen / residencia".
// Mapea slug de personaje (filename del .md) → id de marker en BASE_MARKERS.
//
// Por que existe: el frontmatter del vault no tiene `origen` poblado todavia.
// Mientras migramos esa data a los .md, mantenemos el cruce aca a mano.
// Si un personaje tiene `origen` en su frontmatter, este archivo gana (es
// override). Si no aparece aca, cae al algoritmo de co-aparicion.
//
// Para agregar lugares ocultos (Coven Rojo, etc.) que no tienen marcador en
// el mapa todavia: agregar el marker en lib/map-markers.ts (via calibrador)
// y despues agregar el match aca.

export const PERSONAJE_ORIGEN: Record<string, string> = {
  // PJs (6 jugadores)
  "mysha": "coven-rojo",                  // marker pendiente — lugar oculto
  "narcissa": "lefayes-arrowhead",
  "io-campbell": "bosque-memorias",
  // "borok": "",          // pendiente
  // "layra": "",          // pendiente
  // "david-ilcard": "",   // pendiente

  // NPCs / habitantes notables (agregar a medida que se identifiquen)
};
