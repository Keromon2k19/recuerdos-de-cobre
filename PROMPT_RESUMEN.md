# Prompt canónico de resumen — Recuerdos de Cobre

**Fuente única de verdad.** Los resúmenes los hace Claude Code a mano: el transcript es enorme y de máximo criterio narrativo — los modelos chicos (local/cloud) no dan la talla en esta tarea (probado; ver `docs/GOAL.md`). La *extracción* (resumen → JSON) sí la hace Ollama local. Cuando el usuario pida resumir un episodio:

1. Leer el transcript en `output/epNN.transcript.txt` (lo deja el pipeline; el job queda en estado `esperando_resumen`).
2. Aplicar **exactamente** el prompt de abajo.
3. Escribir el resultado en `output/epNN.resumen.md`.
4. Inyectarlo en el job: editar `vault-mysha/_jobs/0NN.json` → setear `"resumen"` con el texto y `"estado": "done"`, `"etapa_actual": "Resumen listo — cargá al formulario"`. (No tocar `committed_entities`: su ausencia hace que la UI muestre el botón "📤 Cargar".)
5. El usuario carga el resumen al formulario → **Ollama** extrae (qwen2.5:7b; fallback Gemini) → revisa en `/review` → commit al vault.

---

## PROMPT

> Sos un Archivista Experto y Maestro del Lore documentando la campaña de rol de mesa **"Recuerdos de Cobre"**. Tu tarea es leer la transcripción cruda del **Episodio {N} — "{título}"** (generada por Whisper) y producir un resumen narrativo exhaustivo, limpio y estructurado, para poblar una base de datos de lore. Es una campaña **coral de 6 jugadores: no hay protagonista único, todos los PJs pesan igual**.
>
> ### Reglas de filtrado y estilo
> 1. **Cero meta-juego (OOC):** ignorá bromas fuera de personaje, interrupciones, discusiones de reglas, mecánicas de D&D y charla casual de jugadores.
> 2. **Mecánicas → narrativa:** nada de tiradas, números ni turnos. "Sacó un 15 y pegó" → "Borok asestó un golpe decisivo". El combate se resume en términos narrativos: qué pasó, no cómo se tiró.
> 3. **Acciones grupales:** no detalles cada frase trivial; agrupá ("mientras Mysha y Narcissa revisaban el altar, Borok e Io cubrían la salida"). **EXCEPCIÓN — NPCs:** nunca omitas un NPC con nombre ni lo que aporta. De cada NPC dejá explícito: oficio o rol, si tiene tienda/taberna/negocio y qué vende u ofrece, qué servicios presta, si ayuda o estorba al grupo, y qué información/misión/recompensa entrega — aunque aparezca poco.
> 4. **Ignorar el recap:** si la sesión arranca con "en episodios anteriores…", excluí esa parte por completo (no duplicar lore entre episodios).
> 5. **El DM:** narra la historia, lo llaman **Ra**, **Rammis** o **DM**. No es un personaje del mundo — nunca lo registres como NPC.
> 6. **Diferencial, no redundante:** no reafirmes lo que una entidad ES por definición en cada mención (el lector ya está en su ficha y su descripción canónica lo dice). Contá lo NUEVO/específico del episodio: qué hace, en qué parte del lugar aparece, qué cambia. Ej.: en vez de «Ciudad a la que regresan los PJs» → «El grupo regresa al gremio al terminar la misión; aparece el barrio acomodado cerca de la estación». En vez de «PJ semi-orco que rompe huevos de araña» → «Rompe los huevos de araña y halla la caja oculta con el anillo-artefacto». Nunca arranques una mención con «Ciudad…», «La ciudad…», «PJ semi-orco que…», «NPC que…».
>
> ### Glosario canónico de normalización
> Whisper transcribe mal los nombres. Corregí según esta lista; ante un nombre fonéticamente parecido, asumí error y usá el canónico.
>
> **PJs (solo 6, NUNCA NPCs; grupo de iguales, ninguno es "el protagonista"):**
> - **Mysha** — humana, bruja de sangre (Coven Rojo/Rosa). 3 personalidades: Mysha, Selenne, Veltra; si actúan Selenne/Veltra referirse a ella como **Mysha** aclarando la personalidad. *Corregir: Milla, Misha, Milla Selen Beltra → Mysha.*
> - **Borok** — semi-orco.
> - **Layra** — dracónica. *Corregir: Laira, Layyra → Layra.*
> - **Narcissa** — boticaria.
> - **David Ilcard** — asimar.
> - **Io Campbell** — "Io" es nombre propio (no el pronombre "yo").
> - *Familiar:* **Champi** (búho de Mysha).
>
> **NPCs principales:** Annora (parche en el ojo), Margarita ("la Doctora"), Lord Faxius, Clara, Celeste, Carl Jhonson, PatPat, Pilar, Zaros Creighton, Zhaar, Sitzil, Nym, Nori, Aria, Toshi, Raylen, Amari Zaled, Vladimir Clarte, Orion Bolderminer, Apolo Iorxan, Armola Caihana, Saphira Nyerovik, Firguc Alasol, Capitán Fóster, El Profesor, Darko, Mironov, Sargento Gastón Chersey, El Corruptor, Luk.
>
> **Facciones:** Hermandad de Cobre, Los 5 Covens (Rojo, Rosa, Negro, Blanco, Verde), Té de Medianoche, Los Nefarios, Los Renegados, Los Soñadores, Lanceros del Alba, Ejército de la Libertad, La Gran Aristocracia, La Monarquía de Lefaye, La Dinastía de las Alas Metálicas, Imperio de los Grandes.
>
> **Lugares:** Metrópolis de Cobre, Plumas Doradas (casino), Lorenza, Khelgrim, Arkala, Desierto de los Espejos, Sanctuario de los Libres, Mar del Leviatán, Montañas de Frío Eterno, Sigil (Ciudad de las Puertas), Eyra/Eyira (continente), Feywilds.
>
> **Dioses (registrar como lore del mundo, NO como personajes):** Mystra, Vecna, Locky, Tyr, Leira, Druidia, Myrkul, Raven Queen, Luzne, Selune, Orcus, Umberlee, Talos, Tymora, Bahamut, Tiamat, Moradín, Lefaye, Erina, Demogorgon, El Dios de Dioses.
>
> ### Formato de salida obligatorio (Markdown, exactamente estas 4 secciones)
>
> ```
> ## Cast del episodio
> (Viñetas con TODOS los nombres propios que aparecen activamente: PJs, NPCs, monstruos. Omitir al DM. Formato: **[Nombre]**: [rol/oficio en este episodio; si tiene tienda o negocio, qué ofrece; si ayuda o estorba al grupo].)
>
> ## Resumen cronológico
> (Prosa fluida en párrafos temáticos. Omitir el recap inicial y las mecánicas, agrupar acciones de los PJs narrativamente, orden cronológico estricto. Cada vez que aparece un NPC, dejar explícito qué hace, qué ofrece y cómo se relaciona con el grupo. Negritas en la primera aparición de lugares y facciones.)
>
> ## Archivos de Lore y Objetos
> (Viñetas: lore de historia, política, facciones, dioses; descubrimiento o uso de objetos mágicos/artefactos relevantes.)
>
> ## Decisiones Clave y Misterios Abiertos
> (Viñetas: decisiones importantes del grupo y cabos sueltos/misterios sin resolver al final.)
> ```

---

> **Nota:** este prompt está alineado con el de extracción en `lib/prompts.ts` (versión `EXTRACTION_PROMPT_VERSION`). Si se edita uno, alinear el otro. No recrear copias en código.
