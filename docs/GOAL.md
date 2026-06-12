# GOAL.md — El Regalo (replanteo junio 2026)

Este documento es la fuente de verdad vigente. Reemplaza al GOAL anterior
(reinicio canónico; conservado en el historial de git). Si otro documento
contradice este objetivo, este archivo tiene prioridad.

## Estrella polar

> En la próxima partida (~mediados de julio 2026), la antología se revela como
> **sorpresa para el DM**: busca cualquier cosa de los caps 1–70 y llega a una
> ficha correcta, legible y cinemática en menos de un minuto.

No es un producto. Es un regalo para la mesa, pulido como tal.

## Por qué este replanteo

- El contenido **ya existe**: 81 episodios procesados y ~5.600 archivos de lore
  en el vault. La fase de producción terminó; empieza la fase **editorial**:
  corregir, conectar y presentar.
- El feedback real de los compañeros que ya la vieron fue sobre **errores de
  texto y nombres** — no sobre falta de features. Eso define el trabajo.
- Las ~12.500 líneas de CSS son sedimento de iteraciones con IA, no diseño
  intencional. La poda es prerequisito de la suavidad cinemática, no su rival.

## Audiencia

La mesa (7–8 personas) + algún curioso. **Menos de 15 personas, jamás masivo.**
El DM no debe ver el sitio antes de la partida: deploy con link privado,
`noindex`, sin difusión.

## Ley visual

**Detalles ornamentales sí, pero nunca protagonistas.** Cinemático y suave =
transiciones 150–300ms con `transform`/`opacity`, `prefers-reduced-motion`,
cero jank, legibilidad primero (medida de columna, line-height amplio,
contraste alto). El steampunk decora los bordes; el centro es lectura.

## El camino del DM (alcance del mes)

La pantalla núcleo es **Búsqueda**. Pero la búsqueda es un router: su valor es
la calidad de las páginas destino. El alcance del mes es el camino completo:

```txt
home → buscar → ficha de personaje / capítulo / lugar / misterio
```

Esas pantallas (y solo esas) reciben el ciclo completo:
**contenido correcto → conexiones correctas → polish cinemático**, en ese orden.
Las demás de las 21 páginas quedan congeladas: no se borran, no se pulen.

## Plan del mes

### Semana 1 — Auditoría triple
- **Datos/lore**: inventario de errores (nombres, textos, duplicados,
  conexiones rotas) con triage P0 (info incorrecta) / P1 (se muestra mal) /
  P2 (cosmético). Incluye el **reporte de NPCs incompletos**: entidades con
  nombre dudoso o sin imagen — la información "perdida" se recupera de
  transcripts/resúmenes con grep dirigido, no de memoria.
- **CSS**: medir código muerto/duplicado, consolidar tokens, podar por archivo.
- **Feedback de la mesa**: convertir lo ya recibido en issues con prioridad.

### Semana 2 — Búsqueda impecable + destinos correctos
Búsqueda encuentra todo (alias incluidos) y las fichas destino muestran
información correcta. Acá se queman los P0.

### Semana 3 — Polish cinemático del camino del DM
Home → buscar → fichas, en desktop **y móvil** (la mesa va a abrir esto desde
el teléfono). Acá se queman los P1 y el polish.

### Semana 4 — Cap 70 + deploy + ensayo general
Procesar el cap 70 cuando esté subido. Deploy read-only con link privado.
Ensayo: recorrer el camino del DM completo como si fuera la partida.

## No-goals del mes

- Páginas nuevas o features nuevas (mapa expandido, té de media noche, kit…).
- Pulir las 21 páginas — solo el camino del DM.
- Audiencia más allá de la mesa; SEO; cuentas; comentarios.
- Reescrituras de arquitectura. El pipeline local y gratis no se toca.

## Criterios de aceptación

- El DM encuentra cualquier NPC/lugar/misterio/capítulo en <1 minuto.
- Cero errores conocidos de nombres/textos en el camino del DM.
- NPCs del camino con nombre canónico e imagen (o placeholder digno).
- Funciona suave en desktop y móvil; sin jank en transiciones.
- Deploy read-only accesible por link privado; el DM no lo vio antes.
- Cap 70 procesado y visible.

## Lo que sobrevive del GOAL anterior

Estructura pública (`/`, `/cronicas`, `/personajes`, `/buscar`, …), reglas de
lectura y UX, pipeline local sin API (Whisper → resumen/extracción a mano →
vault Markdown), separación público/panel local, y la prohibición de
dashboard genérico / pastiche / neón. Todo lo demás del documento anterior es
contexto histórico (git).
