# UI V2 — Protocolo obligatorio de referencia visual

Para cualquier pedido de UI V2 visual, layout, responsive, polish, motion o QA:

1. Antes de editar, abrir la referencia correcta:
   - Home: `public/assets/atlas-v2/references/home-reference.png`
   - Personajes: `public/assets/atlas-v2/references/personajes-reference.png`
   - Capitulos: `public/assets/atlas-v2/references/capitulos-reference.png`
   - Mapa: `public/assets/atlas-v2/references/mapa-reference.png`
   - Dioses: `public/assets/atlas-v2/references/dioses-reference.png`
   - Archivos: `public/assets/atlas-v2/references/archivos-reference.png`
2. Abrir o generar screenshot actual con `scripts/v2-screenshot.mjs` en desktop
   y mobile. Usar `V2_BROWSER_CHANNEL=msedge` o `chrome` si Chromium no esta.
3. Comparar referencia vs screenshot actual y listar diferencias P0/P1/P2 antes
   de tocar CSS o componentes.
4. Despues de editar, generar screenshots nuevos y compararlos contra la misma
   referencia. No declarar terminado solo por TypeScript/build.
5. No usar `.design-bundle*`, `PRODUCT.md`, `DESIGN.md`, screenshots viejos del
   repo padre ni UI legacy como direccion visual para UI V2, salvo pedido
   explicito de Kero. Son contexto historico, no fuente de verdad.
6. Si se usa skill o subagent, el brief local y estas referencias mandan sobre
   cualquier regla generica de la skill.
